import type { Prisma, ReputationCategory } from "@prisma/client";
import { SEASON_1_DRAFT_GRADES } from "@/lib/draft-grades";

export type ReputationEvent = {
  userId: string;
  amount: number;
  ruleKey: string;
  reason: string;
  category: ReputationCategory;
};

type FranchiseRef = {
  id: string;
  name: string;
  abbreviation: string;
};

type ResultRow = {
  submissionId: string;
  week: number;
  createdAt: Date;
  gameType: string;
  homeTeamId: string;
  awayTeamId: string;
  winnerTeamId: string | null;
};

type PowerProfile = {
  ovr: number;
  contend: string;
};

const ON_FIELD_TYPES = new Set(["REGULAR_SEASON", "PLAYOFF", "SUPER_BOWL", "OTHER"]);

function powerForFranchise(franchise: FranchiseRef): PowerProfile {
  const entry = SEASON_1_DRAFT_GRADES.find(
    (row) =>
      franchise.name === row.team ||
      franchise.name.endsWith(` ${row.team}`) ||
      franchise.abbreviation === row.team
  );
  return {
    ovr: entry?.ovr ?? 80,
    contend: entry?.contend ?? "Medium",
  };
}

function isContender(power: PowerProfile, wins: number, losses: number) {
  const played = wins + losses;
  const winPct = played > 0 ? wins / played : 0;
  const contend = power.contend.toLowerCase();
  return (
    power.ovr >= 86 ||
    contend.startsWith("elite") ||
    contend.startsWith("high") ||
    (played >= 4 && winPct >= 0.7)
  );
}

function isTopTeam(power: PowerProfile, wins: number, losses: number) {
  const played = wins + losses;
  const winPct = played > 0 ? wins / played : 0;
  return (
    power.ovr >= 88 ||
    power.contend.toLowerCase().startsWith("elite") ||
    (played >= 4 && winPct >= 0.75)
  );
}

function isStruggling(power: PowerProfile, wins: number, losses: number) {
  const played = wins + losses;
  const winPct = played > 0 ? wins / played : 0;
  return power.ovr <= 78 || (played >= 3 && winPct <= 0.34);
}

function isCompetitive(power: PowerProfile, wins: number, losses: number) {
  const played = wins + losses;
  const winPct = played > 0 ? wins / played : 0;
  return power.ovr >= 80 || (played >= 3 && winPct >= 0.4);
}

function recordBefore(results: ResultRow[], franchiseId: string) {
  let wins = 0;
  let losses = 0;
  for (const result of results.slice(0, -1)) {
    if (result.winnerTeamId === franchiseId) wins += 1;
    else if (result.winnerTeamId) losses += 1;
  }
  return { wins, losses };
}

function streakLength(results: ResultRow[], franchiseId: string): { kind: "W" | "L"; length: number } | null {
  let kind: "W" | "L" | null = null;
  let length = 0;
  for (let i = results.length - 1; i >= 0; i -= 1) {
    const result = results[i];
    if (!result.winnerTeamId) break;
    const outcome: "W" | "L" = result.winnerTeamId === franchiseId ? "W" : "L";
    if (!kind) {
      kind = outcome;
      length = 1;
      continue;
    }
    if (outcome !== kind) break;
    length += 1;
  }
  return kind ? { kind, length } : null;
}

function streakSubmissionIds(results: ResultRow[], franchiseId: string) {
  const ids: string[] = [];
  let kind: "W" | "L" | null = null;
  for (let i = results.length - 1; i >= 0; i -= 1) {
    const result = results[i];
    if (!result.winnerTeamId) break;
    const outcome: "W" | "L" = result.winnerTeamId === franchiseId ? "W" : "L";
    if (!kind) kind = outcome;
    if (outcome !== kind) break;
    ids.push(result.submissionId);
  }
  return ids;
}

function resultsThrough(results: ResultRow[], submissionId: string) {
  const idx = results.findIndex((row) => row.submissionId === submissionId);
  if (idx < 0) return results;
  return results.slice(0, idx + 1);
}

function seasonForm(results: ResultRow[], franchiseId: string) {
  const onField = results.filter((row) => ON_FIELD_TYPES.has(row.gameType));
  let wins = 0;
  let losses = 0;
  const through: Array<{ played: number; wins: number; losses: number }> = [];
  for (const result of onField) {
    if (result.winnerTeamId === franchiseId) wins += 1;
    else if (result.winnerTeamId) losses += 1;
    through.push({ played: wins + losses, wins, losses });
  }
  return { wins, losses, played: wins + losses, through };
}

export async function detectPrimetimeMatchup(
  tx: Prisma.TransactionClient,
  seasonId: string,
  teamA: string,
  teamB: string
) {
  try {
    const questions = await tx.storyPollQuestion.findMany({
      where: { poll: { story: { seasonId } } },
      include: { options: { select: { franchiseId: true } } },
    });
    return questions.some((question) => {
      const ids = [
        ...new Set(
          question.options
            .map((option) => option.franchiseId)
            .filter((id): id is string => Boolean(id))
        ),
      ];
      return ids.length === 2 && ids.includes(teamA) && ids.includes(teamB);
    });
  } catch {
    return false;
  }
}

async function loadTeamResults(
  tx: Prisma.TransactionClient,
  seasonId: string,
  franchiseId: string
) {
  return tx.gameResult.findMany({
    where: {
      seasonId,
      isVoided: false,
      gameType: { in: ["REGULAR_SEASON", "PLAYOFF", "SUPER_BOWL", "OTHER"] },
      OR: [{ homeTeamId: franchiseId }, { awayTeamId: franchiseId }],
    },
    orderBy: [{ week: "asc" }, { createdAt: "asc" }],
    select: {
      submissionId: true,
      week: true,
      createdAt: true,
      gameType: true,
      homeTeamId: true,
      awayTeamId: true,
      winnerTeamId: true,
    },
  });
}

export async function applyReputationForApprovedGame(
  tx: Prisma.TransactionClient,
  params: {
    submissionId: string;
    seasonId: string;
    week: number;
    gameType: string;
    userTeam: FranchiseRef;
    opponentTeam: FranchiseRef;
    userScore: number;
    opponentScore: number;
    winnerTeamId: string | null;
    submitterId: string;
    isPrimetime: boolean;
    createdById: string;
  }
) {
  if (params.gameType === "SIMULATED" || params.gameType === "PRESEASON") {
    return [];
  }

  const alreadyApplied = await tx.reputationAdjustment.findFirst({
    where: {
      submissionId: params.submissionId,
      isAutomatic: true,
      NOT: { ruleKey: { startsWith: "VOID_" } },
    },
    select: { id: true },
  });
  if (alreadyApplied) return [];

  const [userMembership, opponentMembership] = await Promise.all([
    tx.leagueMembership.findFirst({
      where: {
        franchiseId: params.userTeam.id,
        seasonId: params.seasonId,
        isActive: true,
        user: { deletedAt: null },
      },
      select: { userId: true },
    }),
    tx.leagueMembership.findFirst({
      where: {
        franchiseId: params.opponentTeam.id,
        seasonId: params.seasonId,
        isActive: true,
        user: { deletedAt: null },
      },
      select: { userId: true },
    }),
  ]);

  const coachByTeam = new Map<string, string>();
  if (userMembership) coachByTeam.set(params.userTeam.id, userMembership.userId);
  else coachByTeam.set(params.userTeam.id, params.submitterId);
  if (opponentMembership) coachByTeam.set(params.opponentTeam.id, opponentMembership.userId);

  const events: ReputationEvent[] = [];
  const margin = Math.abs(params.userScore - params.opponentScore);
  const winnerId = params.winnerTeamId;
  if (!winnerId) return [];

  const loserId =
    winnerId === params.userTeam.id ? params.opponentTeam.id : params.userTeam.id;
  const winnerTeam = winnerId === params.userTeam.id ? params.userTeam : params.opponentTeam;
  const loserTeam = loserId === params.userTeam.id ? params.userTeam : params.opponentTeam;
  const winnerUserId = coachByTeam.get(winnerId);
  const loserUserId = coachByTeam.get(loserId);
  if (!winnerUserId && !loserUserId) return [];

  const [winnerResults, loserResults] = await Promise.all([
    loadTeamResults(tx, params.seasonId, winnerId),
    loadTeamResults(tx, params.seasonId, loserId),
  ]);
  const winnerThrough = resultsThrough(winnerResults, params.submissionId);
  const loserThrough = resultsThrough(loserResults, params.submissionId);

  const winnerBefore = recordBefore(winnerThrough, winnerId);
  const loserBefore = recordBefore(loserThrough, loserId);
  const winnerPower = powerForFranchise(winnerTeam);
  const loserPower = powerForFranchise(loserTeam);

  const winnerStruggling = isStruggling(winnerPower, winnerBefore.wins, winnerBefore.losses);
  const winnerContender = isContender(winnerPower, winnerBefore.wins, winnerBefore.losses);
  const loserContender = isContender(loserPower, loserBefore.wins, loserBefore.losses);
  const loserTop = isTopTeam(loserPower, loserBefore.wins, loserBefore.losses);
  const loserCompetitive = isCompetitive(loserPower, loserBefore.wins, loserBefore.losses);
  const majorUpset = winnerStruggling && loserTop;
  const beatContender = !majorUpset && !winnerContender && loserContender;

  if (winnerUserId) {
    if (majorUpset) {
      events.push({
        userId: winnerUserId,
        amount: 3,
        ruleKey: "MAJOR_UPSET",
        reason: `Week ${params.week}: major upset win vs ${loserTeam.abbreviation}`,
        category: "BONUS",
      });
    } else if (beatContender) {
      events.push({
        userId: winnerUserId,
        amount: 2,
        ruleKey: "BEAT_CONTENDER",
        reason: `Week ${params.week}: beat contender ${loserTeam.abbreviation}`,
        category: "BONUS",
      });
    }

    if (params.isPrimetime && majorUpset) {
      events.push({
        userId: winnerUserId,
        amount: 3,
        ruleKey: "PRIMETIME_UPSET",
        reason: `Week ${params.week}: Primetime upset vs ${loserTeam.abbreviation}`,
        category: "BONUS",
      });
    } else if (params.isPrimetime) {
      events.push({
        userId: winnerUserId,
        amount: 2,
        ruleKey: "PRIMETIME_WIN",
        reason: `Week ${params.week}: Primetime win vs ${loserTeam.abbreviation}`,
        category: "BONUS",
      });
    }

    if (margin >= 21 && loserCompetitive) {
      events.push({
        userId: winnerUserId,
        amount: 1,
        ruleKey: "BLOWOUT_WIN",
        reason: `Week ${params.week}: blowout win (${margin}) vs competitive ${loserTeam.abbreviation}`,
        category: "BONUS",
      });
    }
  }

  if (loserUserId) {
    if (majorUpset || beatContender) {
      events.push({
        userId: loserUserId,
        amount: -3,
        ruleKey: "MAJOR_UPSET_LOSS",
        reason: `Week ${params.week}: major upset loss to ${winnerTeam.abbreviation}`,
        category: "PENALTY",
      });
    }

    if (params.isPrimetime && margin >= 21) {
      events.push({
        userId: loserUserId,
        amount: -3,
        ruleKey: "PRIMETIME_BLOWOUT_LOSS",
        reason: `Week ${params.week}: Primetime blowout loss to ${winnerTeam.abbreviation}`,
        category: "PENALTY",
      });
    } else if (params.isPrimetime) {
      events.push({
        userId: loserUserId,
        amount: -2,
        ruleKey: "PRIMETIME_LOSS",
        reason: `Week ${params.week}: Primetime loss to ${winnerTeam.abbreviation}`,
        category: "PENALTY",
      });
    }

    if (margin >= 35) {
      events.push({
        userId: loserUserId,
        amount: -3,
        ruleKey: "EMBARRASSING_LOSS",
        reason: `Week ${params.week}: embarrassing loss by ${margin} to ${winnerTeam.abbreviation}`,
        category: "PENALTY",
      });
    } else if (margin >= 21) {
      events.push({
        userId: loserUserId,
        amount: -2,
        ruleKey: "BLOWOUT_LOSS",
        reason: `Week ${params.week}: blowout loss by ${margin} to ${winnerTeam.abbreviation}`,
        category: "PENALTY",
      });
    }
  }

  await addStreakEvents(tx, {
    seasonId: params.seasonId,
    week: params.week,
    submissionId: params.submissionId,
    franchiseId: winnerId,
    userId: winnerUserId,
    results: winnerThrough,
    events,
    kind: "W",
  });
  await addStreakEvents(tx, {
    seasonId: params.seasonId,
    week: params.week,
    submissionId: params.submissionId,
    franchiseId: loserId,
    userId: loserUserId,
    results: loserThrough,
    events,
    kind: "L",
  });

  await addTrajectoryEvents(tx, {
    seasonId: params.seasonId,
    week: params.week,
    submissionId: params.submissionId,
    franchiseId: winnerId,
    userId: winnerUserId,
    results: winnerResults,
    events,
  });
  await addTrajectoryEvents(tx, {
    seasonId: params.seasonId,
    week: params.week,
    submissionId: params.submissionId,
    franchiseId: loserId,
    userId: loserUserId,
    results: loserResults,
    events,
  });

  for (const event of events) {
    await tx.reputationAdjustment.create({
      data: {
        userId: event.userId,
        amount: event.amount,
        gmAmount: 0,
        category: event.category,
        seasonId: params.seasonId,
        week: params.week,
        reason: event.reason,
        isAutomatic: true,
        submissionId: params.submissionId,
        ruleKey: event.ruleKey,
        createdById: params.createdById,
      },
    });
  }

  return events;
}

async function addStreakEvents(
  tx: Prisma.TransactionClient,
  params: {
    seasonId: string;
    week: number;
    submissionId: string;
    franchiseId: string;
    userId: string | undefined;
    results: ResultRow[];
    events: ReputationEvent[];
    kind: "W" | "L";
  }
) {
  if (!params.userId) return;
  const streak = streakLength(params.results, params.franchiseId);
  if (!streak || streak.kind !== params.kind) return;

  const thresholds =
    params.kind === "W"
      ? [
          { length: 3, amount: 1, ruleKey: "WIN_STREAK_3", label: "3-game winning streak" },
          { length: 5, amount: 2, ruleKey: "WIN_STREAK_5", label: "5-game winning streak" },
          { length: 8, amount: 2, ruleKey: "WIN_STREAK_8", label: "8-game winning streak" },
        ]
      : [
          { length: 3, amount: -1, ruleKey: "LOSE_STREAK_3", label: "3-game losing streak" },
          { length: 5, amount: -2, ruleKey: "LOSE_STREAK_5", label: "5-game losing streak" },
          { length: 8, amount: -2, ruleKey: "LOSE_STREAK_8", label: "8-game losing streak" },
        ];

  const hit = thresholds.filter((row) => streak.length === row.length);
  if (!hit.length) return;

  const streakIds = streakSubmissionIds(params.results, params.franchiseId);
  const already = await tx.reputationAdjustment.findMany({
    where: {
      userId: params.userId,
      seasonId: params.seasonId,
      isAutomatic: true,
      ruleKey: { in: hit.map((row) => row.ruleKey) },
      submissionId: { in: streakIds },
    },
    select: { ruleKey: true },
  });
  const used = new Set(already.map((row) => row.ruleKey));

  for (const row of hit) {
    if (used.has(row.ruleKey)) continue;
    params.events.push({
      userId: params.userId,
      amount: row.amount,
      ruleKey: row.ruleKey,
      reason: `Week ${params.week}: ${row.label}`,
      category: row.amount > 0 ? "BONUS" : "PENALTY",
    });
  }
}

async function addTrajectoryEvents(
  tx: Prisma.TransactionClient,
  params: {
    seasonId: string;
    week: number;
    submissionId: string;
    franchiseId: string;
    userId: string | undefined;
    results: ResultRow[];
    events: ReputationEvent[];
  }
) {
  if (!params.userId) return;
  const form = seasonForm(params.results, params.franchiseId);
  if (form.played < 10) return;

  const first7 = form.through.find((row) => row.played === 7) ?? form.through[6];
  const first8 = form.through.find((row) => row.played === 8);
  const first10 = form.through.find((row) => row.played === 10);
  const winPct = form.played > 0 ? form.wins / form.played : 0;

  const existing = await tx.reputationAdjustment.findMany({
    where: {
      userId: params.userId,
      seasonId: params.seasonId,
      isAutomatic: true,
      OR: [
        {
          ruleKey: {
            in: ["MAJOR_TURNAROUND", "SEASON_TURNAROUND", "MAJOR_COLLAPSE", "SEASON_COLLAPSE"],
          },
        },
        {
          ruleKey: {
            in: [
              "VOID_MAJOR_TURNAROUND",
              "VOID_SEASON_TURNAROUND",
              "VOID_MAJOR_COLLAPSE",
              "VOID_SEASON_COLLAPSE",
            ],
          },
        },
      ],
    },
    select: { ruleKey: true },
  });
  const voided = new Set(
    existing
      .map((row) => row.ruleKey)
      .filter((key): key is string => Boolean(key?.startsWith("VOID_")))
      .map((key) => key.slice("VOID_".length))
  );
  const have = new Set(
    existing
      .map((row) => row.ruleKey)
      .filter((key): key is string => {
        if (!key || key.startsWith("VOID_")) return false;
        return !voided.has(key);
      })
  );

  const majorTurnaround =
    first7 && first7.wins <= 1 && form.played >= 10 && winPct >= 0.5;
  const turnaround =
    !majorTurnaround && first7 && first7.wins <= 2 && form.played >= 10 && winPct >= 0.5;
  const majorCollapse =
    first10 && first10.wins >= 8 && form.played >= 14 && winPct < 0.5;
  const collapse =
    !majorCollapse && first8 && first8.wins >= 6 && form.played >= 12 && winPct <= 0.5;

  if (majorTurnaround && !have.has("MAJOR_TURNAROUND")) {
    const alreadyTurnaround = have.has("SEASON_TURNAROUND");
    params.events.push({
      userId: params.userId,
      amount: alreadyTurnaround ? 1 : 3,
      ruleKey: "MAJOR_TURNAROUND",
      reason: `Week ${params.week}: major season turnaround`,
      category: "BONUS",
    });
  } else if (turnaround && !have.has("SEASON_TURNAROUND") && !have.has("MAJOR_TURNAROUND")) {
    params.events.push({
      userId: params.userId,
      amount: 2,
      ruleKey: "SEASON_TURNAROUND",
      reason: `Week ${params.week}: season turnaround`,
      category: "BONUS",
    });
  }

  if (majorCollapse && !have.has("MAJOR_COLLAPSE")) {
    const alreadyCollapse = have.has("SEASON_COLLAPSE");
    params.events.push({
      userId: params.userId,
      amount: alreadyCollapse ? -1 : -3,
      ruleKey: "MAJOR_COLLAPSE",
      reason: `Week ${params.week}: major season collapse`,
      category: "PENALTY",
    });
  } else if (collapse && !have.has("SEASON_COLLAPSE") && !have.has("MAJOR_COLLAPSE")) {
    params.events.push({
      userId: params.userId,
      amount: -2,
      ruleKey: "SEASON_COLLAPSE",
      reason: `Week ${params.week}: season collapse`,
      category: "PENALTY",
    });
  }
}

export async function reverseAutomaticReputation(
  tx: Prisma.TransactionClient,
  submissionId: string,
  commissionerId: string
) {
  const rows = await tx.reputationAdjustment.findMany({
    where: {
      submissionId,
      isAutomatic: true,
      NOT: { ruleKey: { startsWith: "VOID_" } },
    },
  });
  for (const row of rows) {
    if (row.reason.startsWith("Void reversal:")) continue;
    await tx.reputationAdjustment.create({
      data: {
        userId: row.userId,
        amount: -row.amount,
        gmAmount: 0,
        category: row.category,
        seasonId: row.seasonId,
        week: row.week,
        reason: `Void reversal: ${row.reason}`,
        isAutomatic: true,
        submissionId,
        ruleKey: row.ruleKey ? `VOID_${row.ruleKey}` : "VOID",
        createdById: commissionerId,
      },
    });
  }
}
