import { revalidatePath } from "next/cache";
import {
  GameType,
  Role,
  SubmissionStatus,
} from "@/generated/prisma/client";
import { getActiveSeason } from "@/lib/league";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { hasFinalScores } from "@/lib/game-score";
import { approvePendingSubmission } from "@/lib/game-approval";
import { franchiseIdForMaddenTeam } from "@/lib/madden/franchises";
import { isMaddenFinal, isMaddenSimulated } from "@/lib/madden/game-status";
import {
  autoFileSides,
  scoresForSiteSubmitter,
  shouldSyncCompanionWeekType,
} from "@/lib/madden/sync-scores-map";

const COMPANION_FILE_NOTE = "Auto-filed from Madden Companion export.";

function revalidateLeagueBoard() {
  try {
    revalidatePath("/games", "layout");
    revalidatePath("/submissions");
    revalidatePath("/standings");
    revalidatePath("/dashboard");
    revalidatePath("/admin");
    revalidatePath("/admin/approvals");
    revalidatePath("/admin/season");
    revalidatePath("/coach");
    revalidatePath("/coach/reputation");
  } catch (error) {
    console.error("Failed to revalidate after Madden score sync", error);
  }
}

async function deskActorId() {
  const commissioner = await prisma.user.findFirst({
    where: { role: Role.COMMISSIONER, isActive: true, deletedAt: null },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });
  return commissioner?.id ?? null;
}

async function activeCoachUserId(seasonId: string, franchiseId: string) {
  const membership = await prisma.leagueMembership.findFirst({
    where: {
      franchiseId,
      seasonId,
      isActive: true,
      user: { isActive: true, deletedAt: null },
    },
    select: { userId: true },
  });
  return membership?.userId ?? null;
}

async function findLiveMatchup(params: {
  seasonId: string;
  week: number;
  homeFranchiseId: string;
  awayFranchiseId: string;
}) {
  return prisma.gameSubmission.findFirst({
    where: {
      seasonId: params.seasonId,
      week: params.week,
      status: { in: [SubmissionStatus.PENDING, SubmissionStatus.APPROVED] },
      OR: [
        {
          userTeamId: params.homeFranchiseId,
          opponentTeamId: params.awayFranchiseId,
        },
        {
          userTeamId: params.awayFranchiseId,
          opponentTeamId: params.homeFranchiseId,
        },
      ],
    },
    include: {
      userTeam: { select: { id: true, name: true, abbreviation: true } },
      opponentTeam: { select: { id: true, name: true, abbreviation: true } },
      result: { select: { id: true } },
    },
  });
}

async function fillOpenSubmissionScores(params: {
  submission: NonNullable<Awaited<ReturnType<typeof findLiveMatchup>>>;
  userScore: number;
  opponentScore: number;
  actorId: string | null;
  scheduleId: string;
}) {
  const { submission, userScore, opponentScore, actorId, scheduleId } = params;
  const winnerTeamId = submission.isForceWin
    ? submission.userTeamId
    : userScore > opponentScore
      ? submission.userTeamId
      : userScore < opponentScore
        ? submission.opponentTeamId
        : null;

  await prisma.$transaction(async (tx) => {
    await tx.gameSubmission.update({
      where: { id: submission.id },
      data: { userScore, opponentScore },
    });

    if (submission.result) {
      await tx.gameResult.update({
        where: { id: submission.result.id },
        data: {
          homeScore: userScore,
          awayScore: opponentScore,
          winnerTeamId,
          isForceWin: submission.isForceWin,
        },
      });
      return;
    }

    if (submission.status === SubmissionStatus.APPROVED) {
      await tx.gameResult.create({
        data: {
          submissionId: submission.id,
          seasonId: submission.seasonId,
          week: submission.week,
          gameType: submission.gameType,
          homeTeamId: submission.userTeamId,
          awayTeamId: submission.opponentTeamId,
          homeScore: userScore,
          awayScore: opponentScore,
          opponentSimScore: submission.opponentSimScore,
          userTeamSimScore: submission.userTeamSimScore,
          winnerTeamId,
          isForceWin: submission.isForceWin,
          isPrimetime: submission.isPrimetime,
        },
      });
    }
  });

  await writeAuditLog({
    actorId,
    action: "MADDEN_SYNC_OPEN_GAME_SCORE",
    entityType: "GameSubmission",
    entityId: submission.id,
    metadata: {
      scheduleId,
      userScore,
      opponentScore,
      status: submission.status,
      isForceWin: submission.isForceWin,
    },
  });
}

async function fileMissingGameFromMadden(params: {
  seasonId: string;
  week: number;
  scheduleId: string;
  homeFranchiseId: string;
  awayFranchiseId: string;
  homeScore: number;
  awayScore: number;
  simulated: boolean;
  isPrimetime: boolean;
  actorId: string | null;
}) {
  const sides = autoFileSides({
    simulated: params.simulated,
    homeFranchiseId: params.homeFranchiseId,
    awayFranchiseId: params.awayFranchiseId,
    homeScore: params.homeScore,
    awayScore: params.awayScore,
  });

  const submitterId =
    (await activeCoachUserId(params.seasonId, sides.userTeamId)) ??
    (await activeCoachUserId(params.seasonId, sides.opponentTeamId)) ??
    params.actorId;
  if (!submitterId) {
    console.error(
      "Madden score sync skipped — no submitter for",
      params.scheduleId
    );
    return false;
  }

  const reviewerId = params.actorId ?? submitterId;
  const notes = params.simulated
    ? `${COMPANION_FILE_NOTE} CPU sim — treated as an undeclared force win.`
    : COMPANION_FILE_NOTE;

  const created = await prisma.gameSubmission.create({
    data: {
      seasonId: params.seasonId,
      week: params.week,
      gameType: GameType.REGULAR_SEASON,
      submitterId,
      userTeamId: sides.userTeamId,
      opponentTeamId: sides.opponentTeamId,
      userScore: sides.userScore,
      opponentScore: sides.opponentScore,
      opponentSimScore: null,
      userTeamSimScore: null,
      isForceWin: sides.isForceWin,
      forceWinReason: null,
      isPrimetime: params.isPrimetime,
      notes,
      skipXp: false,
      filedByCommissioner: true,
      status: SubmissionStatus.PENDING,
    },
    include: {
      userTeam: true,
      opponentTeam: true,
    },
  });

  const { winnerTeamId, isPrimetime, grantXp } = await approvePendingSubmission(
    reviewerId,
    created,
    params.simulated
      ? "Madden Companion CPU sim — auto-filed"
      : "Madden Companion export — auto-filed"
  );

  await writeAuditLog({
    actorId: reviewerId,
    action: "MADDEN_AUTO_FILE_GAME",
    entityType: "GameSubmission",
    entityId: created.id,
    metadata: {
      scheduleId: params.scheduleId,
      week: params.week,
      winnerTeamId,
      userScore: created.userScore,
      opponentScore: created.opponentScore,
      isForceWin: created.isForceWin,
      awardsXp: grantXp,
      isPrimetime,
    },
  });

  return true;
}

/**
 * When a schedule export already has final scores, post them on the site so
 * open slate games (and force wins waiting on a CPU score) do not sit around
 * waiting for a coach to type the same numbers.
 */
export async function syncMaddenScoresToOpenGames(
  scheduleIds: string[],
  options?: { weekType?: string | null }
) {
  if (scheduleIds.length === 0) return 0;
  if (!shouldSyncCompanionWeekType(options?.weekType)) return 0;

  let season: Awaited<ReturnType<typeof getActiveSeason>>["season"];
  try {
    ({ season } = await getActiveSeason());
  } catch (error) {
    console.error("Madden score sync skipped — no active season", error);
    return 0;
  }

  const games = await prisma.maddenGame.findMany({
    where: { scheduleId: { in: scheduleIds } },
    include: {
      homeTeam: { select: { franchiseId: true, abbr: true } },
      awayTeam: { select: { franchiseId: true, abbr: true } },
    },
  });

  const actorId = await deskActorId();
  let updated = 0;

  for (const game of games) {
    if (!isMaddenFinal(game.status)) continue;

    const homeFranchiseId = await franchiseIdForMaddenTeam(game.homeTeam);
    const awayFranchiseId = await franchiseIdForMaddenTeam(game.awayTeam);
    if (!homeFranchiseId || !awayFranchiseId) continue;

    const week = game.weekIndex + 1;
    const scheduled = await prisma.scheduledGame.findFirst({
      where: {
        seasonId: season.id,
        week,
        OR: [
          { homeTeamId: homeFranchiseId, awayTeamId: awayFranchiseId },
          { homeTeamId: awayFranchiseId, awayTeamId: homeFranchiseId },
        ],
      },
      select: { isPrimetime: true },
    });
    if (!scheduled) continue;

    const existing = await findLiveMatchup({
      seasonId: season.id,
      week,
      homeFranchiseId,
      awayFranchiseId,
    });

    if (existing) {
      if (hasFinalScores(existing)) continue;
      const mapped = scoresForSiteSubmitter({
        userTeamId: existing.userTeamId,
        homeFranchiseId,
        homeScore: game.homeScore,
        awayScore: game.awayScore,
      });
      if (existing.isForceWin && mapped.userScore <= mapped.opponentScore) {
        continue;
      }
      await fillOpenSubmissionScores({
        submission: existing,
        userScore: mapped.userScore,
        opponentScore: mapped.opponentScore,
        actorId,
        scheduleId: game.scheduleId,
      });
      updated += 1;
      continue;
    }

    const filed = await fileMissingGameFromMadden({
      seasonId: season.id,
      week,
      scheduleId: game.scheduleId,
      homeFranchiseId,
      awayFranchiseId,
      homeScore: game.homeScore,
      awayScore: game.awayScore,
      simulated: isMaddenSimulated(game.status),
      isPrimetime: scheduled.isPrimetime,
      actorId,
    });
    if (filed) updated += 1;
  }

  if (updated > 0) revalidateLeagueBoard();
  return updated;
}
