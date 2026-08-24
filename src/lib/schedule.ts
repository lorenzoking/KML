import { prisma } from "@/lib/prisma";
import {
  NFL_2026_BYES,
  NFL_2026_GAMES,
  NFL_REGULAR_SEASON_WEEKS,
} from "@/lib/nfl-schedule-2026";

export { NFL_REGULAR_SEASON_WEEKS };

type FranchiseRef = {
  id: string;
  name: string;
  abbreviation: string;
};

type SubmissionLike = {
  id: string;
  status: string;
  userTeamId: string;
  opponentTeamId: string;
  userScore: number | null;
  opponentScore: number | null;
  isForceWin?: boolean;
};

export type SlateStatus = "approved" | "pending" | "missing";

export type WeekSlateRow = {
  scheduledId: string;
  week: number;
  home: FranchiseRef;
  away: FranchiseRef;
  isPrimetime: boolean;
  status: SlateStatus;
  submissionId: string | null;
  homeScore: number | null;
  awayScore: number | null;
  isForceWin: boolean;
};

export type TeamScheduleRow =
  | {
      week: number;
      bye: true;
    }
  | {
      week: number;
      bye: false;
      scheduledId: string;
      isHome: boolean;
      opponent: FranchiseRef;
      isPrimetime: boolean;
      status: SlateStatus;
      submissionId: string | null;
      myScore: number | null;
      oppScore: number | null;
      isForceWin: boolean;
    };

function isMissingScheduleTable(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String(error.code) : "";
  return code === "P2021" || code === "P2022";
}

function scheduleRowsFromNfl(
  seasonId: string,
  byAbbr: Map<string, string>
) {
  return NFL_2026_GAMES.map((game) => {
    const homeTeamId = byAbbr.get(game.home);
    const awayTeamId = byAbbr.get(game.away);
    if (!homeTeamId || !awayTeamId) return null;
    return {
      seasonId,
      week: game.week,
      homeTeamId,
      awayTeamId,
      isPrimetime: Boolean(game.primetime),
    };
  }).filter((row): row is NonNullable<typeof row> => Boolean(row));
}

async function syncScheduledPrimetime(
  seasonId: string,
  rows: Array<{
    week: number;
    homeTeamId: string;
    awayTeamId: string;
    isPrimetime: boolean;
  }>
) {
  await prisma.scheduledGame.updateMany({
    where: { seasonId, isPrimetime: true },
    data: { isPrimetime: false },
  });
  await Promise.all(
    rows
      .filter((row) => row.isPrimetime)
      .map((row) =>
        prisma.scheduledGame.updateMany({
          where: {
            seasonId,
            week: row.week,
            homeTeamId: row.homeTeamId,
            awayTeamId: row.awayTeamId,
          },
          data: { isPrimetime: true },
        })
      )
  );
}

export async function ensureSeasonSchedule(seasonId: string) {
  const existing = await prisma.scheduledGame.count({ where: { seasonId } });
  const franchises = await prisma.franchise.findMany({
    select: { id: true, abbreviation: true },
  });
  const byAbbr = new Map(franchises.map((row) => [row.abbreviation, row.id]));
  const rows = scheduleRowsFromNfl(seasonId, byAbbr);

  if (rows.length !== NFL_2026_GAMES.length) {
    console.error(
      "ensureSeasonSchedule: franchise abbreviations did not cover the full NFL slate"
    );
    return;
  }

  if (existing === NFL_2026_GAMES.length) {
    await syncScheduledPrimetime(seasonId, rows);
    return;
  }

  if (existing > 0) {
    await prisma.scheduledGame.deleteMany({ where: { seasonId } });
  }

  await prisma.scheduledGame.createMany({ data: rows });
}

export async function safeEnsureSeasonSchedule(seasonId: string) {
  try {
    await ensureSeasonSchedule(seasonId);
  } catch (error) {
    if (!isMissingScheduleTable(error)) {
      console.error("ensureSeasonSchedule failed:", error);
    }
  }
}

function liveSubmission(
  homeTeamId: string,
  awayTeamId: string,
  submissions: SubmissionLike[]
) {
  const matches = submissions.filter((row) => {
    if (row.status !== "PENDING" && row.status !== "APPROVED") return false;
    const teams = new Set([row.userTeamId, row.opponentTeamId]);
    return teams.has(homeTeamId) && teams.has(awayTeamId);
  });
  return (
    matches.find((row) => row.status === "APPROVED") ?? matches[0] ?? null
  );
}

function scoresForScheduledHome(
  homeTeamId: string,
  submission: SubmissionLike | null
) {
  if (!submission) return { homeScore: null, awayScore: null };
  const homeIsSubmitter = submission.userTeamId === homeTeamId;
  return {
    homeScore: homeIsSubmitter ? submission.userScore : submission.opponentScore,
    awayScore: homeIsSubmitter ? submission.opponentScore : submission.userScore,
  };
}

export function buildWeekSlate(
  scheduled: Array<{
    id: string;
    week: number;
    isPrimetime: boolean;
    homeTeam: FranchiseRef;
    awayTeam: FranchiseRef;
  }>,
  submissions: SubmissionLike[]
): WeekSlateRow[] {
  return scheduled
    .map((game) => {
      const submission = liveSubmission(
        game.homeTeam.id,
        game.awayTeam.id,
        submissions
      );
      const scores = scoresForScheduledHome(game.homeTeam.id, submission);
      const status: SlateStatus = submission
        ? submission.status === "APPROVED"
          ? "approved"
          : "pending"
        : "missing";
      return {
        scheduledId: game.id,
        week: game.week,
        home: game.homeTeam,
        away: game.awayTeam,
        isPrimetime: game.isPrimetime,
        status,
        submissionId: submission?.id ?? null,
        homeScore: scores.homeScore,
        awayScore: scores.awayScore,
        isForceWin: Boolean(submission?.isForceWin),
      };
    })
    .sort((a, b) => {
      const rank = { missing: 0, pending: 1, approved: 2 };
      return (
        rank[a.status] - rank[b.status] ||
        Number(b.isPrimetime) - Number(a.isPrimetime) ||
        a.home.abbreviation.localeCompare(b.home.abbreviation)
      );
    });
}

export function buildTeamSchedule(
  franchiseId: string,
  scheduled: Array<{
    id: string;
    week: number;
    isPrimetime: boolean;
    homeTeamId: string;
    awayTeamId: string;
    homeTeam: FranchiseRef;
    awayTeam: FranchiseRef;
  }>,
  submissions: SubmissionLike[]
): TeamScheduleRow[] {
  const byWeek = new Map(scheduled.map((game) => [game.week, game]));
  const rows: TeamScheduleRow[] = [];
  for (let week = 1; week <= NFL_REGULAR_SEASON_WEEKS; week += 1) {
    const game = byWeek.get(week);
    if (!game) {
      rows.push({ week, bye: true });
      continue;
    }
    const isHome = game.homeTeamId === franchiseId;
    const opponent = isHome ? game.awayTeam : game.homeTeam;
    const submission = liveSubmission(
      game.homeTeamId,
      game.awayTeamId,
      submissions
    );
    const scores = scoresForScheduledHome(game.homeTeamId, submission);
    const myScore = isHome ? scores.homeScore : scores.awayScore;
    const oppScore = isHome ? scores.awayScore : scores.homeScore;
    rows.push({
      week,
      bye: false,
      scheduledId: game.id,
      isHome,
      opponent,
      isPrimetime: game.isPrimetime,
      status: submission
        ? submission.status === "APPROVED"
          ? "approved"
          : "pending"
        : "missing",
      submissionId: submission?.id ?? null,
      myScore,
      oppScore,
      isForceWin: Boolean(submission?.isForceWin),
    });
  }
  return rows;
}

export function byeWeekForAbbr(abbreviation: string) {
  return NFL_2026_BYES[abbreviation] ?? null;
}

export async function getTeamScheduledGame(
  seasonId: string,
  week: number,
  franchiseId: string
) {
  return prisma.scheduledGame.findFirst({
    where: {
      seasonId,
      week,
      OR: [{ homeTeamId: franchiseId }, { awayTeamId: franchiseId }],
    },
    include: {
      homeTeam: { select: { id: true, name: true, abbreviation: true } },
      awayTeam: { select: { id: true, name: true, abbreviation: true } },
    },
  });
}

export async function safeGetTeamScheduledGame(
  seasonId: string,
  week: number,
  franchiseId: string
) {
  try {
    return await getTeamScheduledGame(seasonId, week, franchiseId);
  } catch (error) {
    if (!isMissingScheduleTable(error)) {
      console.error("getTeamScheduledGame failed:", error);
    }
    return null;
  }
}

export async function getMissingScheduledGames(
  seasonId: string,
  fromWeek: number,
  toWeek: number
) {
  const [scheduled, submissions] = await Promise.all([
    prisma.scheduledGame.findMany({
      where: { seasonId, week: { gte: fromWeek, lte: toWeek } },
      include: {
        homeTeam: { select: { id: true, name: true, abbreviation: true } },
        awayTeam: { select: { id: true, name: true, abbreviation: true } },
      },
      orderBy: [{ week: "asc" }, { createdAt: "asc" }],
    }),
    prisma.gameSubmission.findMany({
      where: {
        seasonId,
        week: { gte: fromWeek, lte: toWeek },
        status: { in: ["PENDING", "APPROVED"] },
      },
      select: {
        id: true,
        status: true,
        userTeamId: true,
        opponentTeamId: true,
        userScore: true,
        opponentScore: true,
        isForceWin: true,
      },
    }),
  ]);

  return buildWeekSlate(scheduled, submissions).filter(
    (row) => row.status === "missing"
  );
}

export async function safeGetMissingScheduledGames(
  seasonId: string,
  fromWeek: number,
  toWeek: number
) {
  try {
    return await getMissingScheduledGames(seasonId, fromWeek, toWeek);
  } catch (error) {
    if (!isMissingScheduleTable(error)) {
      console.error("getMissingScheduledGames failed:", error);
    }
    return [];
  }
}
