import { SubmissionStatus } from "@/generated/prisma/client";
import { NFL_REGULAR_SEASON_WEEKS, PLAYOFF_START_WEEK } from "@/lib/league-week";
import { prisma } from "@/lib/prisma";
import {
  buildPlayoffBracket,
  completeMatchups,
  currentPlayoffRound,
  seedPlayoffs,
  type BracketSlot,
  type PlayoffBracket,
  type PlayoffField,
  type PlayoffGameInput,
  type PlayoffSeed,
} from "@/lib/playoffs";
import { computeStandings } from "@/lib/standings";

function isMissingScheduleTable(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String(error.code) : "";
  return code === "P2021" || code === "P2022";
}

export async function ensurePlayoffSchedule(seasonId: string, currentWeek: number) {
  if (currentWeek < PLAYOFF_START_WEEK) return;

  const field = await loadColoredField(seasonId);
  const games = await loadPlayoffGames(seasonId);
  const bracket = buildPlayoffBracket(field, games);

  if (currentWeek >= 19) {
    await replacePlayoffWeek(
      seasonId,
      19,
      completeMatchups([...bracket.afc.wildCard, ...bracket.nfc.wildCard]),
      false
    );
  }
  if (currentWeek >= 20) {
    await replacePlayoffWeek(
      seasonId,
      20,
      completeMatchups([...bracket.afc.divisional, ...bracket.nfc.divisional]),
      false
    );
  }
  if (currentWeek >= 21) {
    await replacePlayoffWeek(
      seasonId,
      21,
      completeMatchups([bracket.afc.championship, bracket.nfc.championship]),
      true
    );
  }
  if (currentWeek >= 22) {
    await replacePlayoffWeek(seasonId, 22, completeMatchups([bracket.superBowl]), true);
  }
}

export async function safeEnsurePlayoffSchedule(seasonId: string, currentWeek: number) {
  try {
    await ensurePlayoffSchedule(seasonId, currentWeek);
  } catch (error) {
    if (!isMissingScheduleTable(error)) {
      console.error("ensurePlayoffSchedule failed:", error);
    }
  }
}

export async function getPlayoffField(
  seasonId: string,
  currentWeek: number,
  writeSchedule: boolean
): Promise<{
  field: PlayoffField;
  bracket: PlayoffBracket;
  currentRound: ReturnType<typeof currentPlayoffRound>;
  projected: boolean;
}> {
  if (writeSchedule) {
    await safeEnsurePlayoffSchedule(seasonId, currentWeek);
  }
  const field = await loadColoredField(seasonId);
  const games = await loadPlayoffGames(seasonId);
  return {
    field,
    bracket: buildPlayoffBracket(field, games),
    currentRound: currentPlayoffRound(currentWeek),
    projected: currentWeek < PLAYOFF_START_WEEK,
  };
}

async function loadColoredField(seasonId: string): Promise<PlayoffField> {
  const [franchises, results] = await Promise.all([
    prisma.franchise.findMany({
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        abbreviation: true,
        conference: true,
        division: true,
        primaryColor: true,
      },
    }),
    prisma.gameResult.findMany({
      where: {
        seasonId,
        isVoided: false,
        week: { lte: NFL_REGULAR_SEASON_WEEKS },
      },
      select: {
        homeTeamId: true,
        awayTeamId: true,
        winnerTeamId: true,
        week: true,
        homeScore: true,
        awayScore: true,
      },
    }),
  ]);
  const standings = computeStandings(franchises, results);
  const colorById = Object.fromEntries(
    franchises.map((row) => [row.id, row.primaryColor])
  );
  const field = seedPlayoffs(standings, results);
  return {
    afc: paint(field.afc, colorById),
    nfc: paint(field.nfc, colorById),
  };
}

function paint(seeds: PlayoffSeed[], colorById: Record<string, string | null>) {
  return seeds.map((seed) => ({
    ...seed,
    primaryColor: colorById[seed.franchiseId] ?? seed.primaryColor,
  }));
}

async function loadPlayoffGames(seasonId: string): Promise<PlayoffGameInput[]> {
  const [scheduled, submissions] = await Promise.all([
    prisma.scheduledGame.findMany({
      where: { seasonId, week: { gte: PLAYOFF_START_WEEK } },
      select: { week: true, homeTeamId: true, awayTeamId: true },
    }),
    prisma.gameSubmission.findMany({
      where: {
        seasonId,
        week: { gte: PLAYOFF_START_WEEK },
        status: { in: [SubmissionStatus.PENDING, SubmissionStatus.APPROVED] },
      },
      select: {
        id: true,
        week: true,
        status: true,
        userTeamId: true,
        opponentTeamId: true,
        userScore: true,
        opponentScore: true,
        isForceWin: true,
      },
    }),
  ]);

  const used = new Set<string>();
  const fromSchedule = scheduled.map((game) => {
    const sub = liveSubmission(game.homeTeamId, game.awayTeamId, submissions);
    if (sub) used.add(sub.id);
    return toGameInput(
      game.week,
      game.homeTeamId,
      game.awayTeamId,
      sub
    );
  });
  const orphans = submissions
    .filter((sub) => !used.has(sub.id))
    .map((sub) =>
      toGameInput(sub.week, sub.userTeamId, sub.opponentTeamId, sub)
    );
  return [...fromSchedule, ...orphans];
}

function liveSubmission(
  homeTeamId: string,
  awayTeamId: string,
  submissions: Array<{
    id: string;
    status: string;
    userTeamId: string;
    opponentTeamId: string;
    userScore: number | null;
    opponentScore: number | null;
    isForceWin: boolean;
  }>
) {
  const matches = submissions.filter((row) => {
    const teams = new Set([row.userTeamId, row.opponentTeamId]);
    return teams.has(homeTeamId) && teams.has(awayTeamId);
  });
  return (
    matches.find((row) => row.status === SubmissionStatus.APPROVED) ??
    matches[0] ??
    null
  );
}

function toGameInput(
  week: number,
  homeTeamId: string,
  awayTeamId: string,
  sub: {
    id: string;
    status: string;
    userTeamId: string;
    opponentTeamId: string;
    userScore: number | null;
    opponentScore: number | null;
    isForceWin: boolean;
  } | null
): PlayoffGameInput {
  if (!sub) {
    return {
      week,
      homeTeamId,
      awayTeamId,
      homeScore: null,
      awayScore: null,
      winnerTeamId: null,
      submissionId: null,
      status: null,
    };
  }
  const homeIsUser = sub.userTeamId === homeTeamId;
  const homeScore = homeIsUser ? sub.userScore : sub.opponentScore;
  const awayScore = homeIsUser ? sub.opponentScore : sub.userScore;
  const winnerTeamId = sub.isForceWin
    ? sub.userTeamId
    : sub.status === SubmissionStatus.APPROVED &&
        homeScore != null &&
        awayScore != null
      ? homeScore > awayScore
        ? homeTeamId
        : awayScore > homeScore
          ? awayTeamId
          : null
      : null;
  return {
    week,
    homeTeamId,
    awayTeamId,
    homeScore,
    awayScore,
    winnerTeamId,
    submissionId: sub.id,
    status:
      sub.status === SubmissionStatus.APPROVED
        ? "approved"
        : sub.status === SubmissionStatus.PENDING
          ? "pending"
          : null,
  };
}

async function replacePlayoffWeek(
  seasonId: string,
  week: number,
  matchups: Array<BracketSlot & { home: PlayoffSeed; away: PlayoffSeed }>,
  isPrimetime: boolean
) {
  if (matchups.length === 0) return;

  const existing = await prisma.scheduledGame.findMany({
    where: { seasonId, week },
    select: { homeTeamId: true, awayTeamId: true },
  });
  const live = await prisma.gameSubmission.count({
    where: {
      seasonId,
      week,
      status: { in: [SubmissionStatus.PENDING, SubmissionStatus.APPROVED] },
    },
  });
  if (live > 0) return;

  const desired = new Set(
    matchups.map((slot) => pairKey(slot.home.franchiseId, slot.away.franchiseId))
  );
  const have = new Set(
    existing.map((game) => pairKey(game.homeTeamId, game.awayTeamId))
  );
  if (desired.size === have.size && [...desired].every((key) => have.has(key))) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.scheduledGame.deleteMany({ where: { seasonId, week } });
    await tx.scheduledGame.createMany({
      data: matchups.map((slot) => ({
        seasonId,
        week,
        homeTeamId: slot.home.franchiseId,
        awayTeamId: slot.away.franchiseId,
        isPrimetime,
      })),
    });
  });
}

function pairKey(a: string, b: string) {
  return [a, b].sort().join(":");
}
