import { prisma } from "@/lib/prisma";
import { sumXp } from "@/lib/xp";
import {
  computeReputationScore,
  getReputationLabel,
} from "@/lib/reputation";
import { getLeagueSettings } from "@/lib/league";

export type SeasonRecord = {
  stintId: string;
  seasonId: string;
  seasonNumber: number;
  seasonName: string;
  franchiseId: string | null;
  franchiseName: string | null;
  franchiseAbbr: string | null;
  isActive: boolean;
  startedWeek: number;
  endedWeek: number | null;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  xp: number;
};

export type CareerStats = {
  seasonsPlayed: number;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  careerXp: number;
  reputationScore: number;
  reputationLabel: ReturnType<typeof getReputationLabel>;
  bySeason: SeasonRecord[];
};

function resultBelongsToStint(
  result: { seasonId: string; week: number; homeTeamId: string; awayTeamId: string },
  stint: {
    seasonId: string;
    franchiseId: string;
    startedWeek: number;
    endedWeek: number | null;
  }
) {
  if (result.seasonId !== stint.seasonId) return false;
  if (
    result.homeTeamId !== stint.franchiseId &&
    result.awayTeamId !== stint.franchiseId
  ) {
    return false;
  }
  if (result.week < stint.startedWeek) return false;
  if (stint.endedWeek != null && result.week > stint.endedWeek) return false;
  return true;
}

export async function getUserCareerStats(userId: string): Promise<CareerStats> {
  const settings = await getLeagueSettings();

  const [memberships, results, xpAdjustments, repAdjustments] =
    await Promise.all([
      prisma.leagueMembership.findMany({
        where: { userId },
        include: {
          franchise: true,
          season: true,
        },
        orderBy: [{ season: { number: "asc" } }, { assignedAt: "asc" }],
      }),
      prisma.gameResult.findMany({
        where: { isVoided: false },
      }),
      prisma.xPAdjustment.findMany({
        where: { userId },
        select: { amount: true, seasonId: true },
      }),
      prisma.reputationAdjustment.findMany({
        where: { userId },
        select: { amount: true },
      }),
    ]);

  const countedResultIds = new Set<string>();

  const bySeason: SeasonRecord[] = memberships.map((m) => {
    const teamResults = results.filter((r) => {
      if (!resultBelongsToStint(r, m)) return false;
      if (countedResultIds.has(r.id)) return false;
      countedResultIds.add(r.id);
      return true;
    });

    let wins = 0;
    let losses = 0;
    let ties = 0;
    let pointsFor = 0;
    let pointsAgainst = 0;

    for (const r of teamResults) {
      const isHome = r.homeTeamId === m.franchiseId;
      const pf = isHome ? r.homeScore : r.awayScore;
      const pa = isHome ? r.awayScore : r.homeScore;
      pointsFor += pf;
      pointsAgainst += pa;

      if (!r.winnerTeamId) ties += 1;
      else if (r.winnerTeamId === m.franchiseId) wins += 1;
      else losses += 1;
    }

    // XP is user-scoped for the season (not split across stints)
    const xp = sumXp(
      xpAdjustments.filter((x) => x.seasonId === m.seasonId)
    );

    return {
      stintId: m.id,
      seasonId: m.seasonId,
      seasonNumber: m.season.number,
      seasonName: m.season.name,
      franchiseId: m.franchiseId,
      franchiseName: m.franchise.name,
      franchiseAbbr: m.franchise.abbreviation,
      isActive: m.isActive,
      startedWeek: m.startedWeek,
      endedWeek: m.endedWeek,
      wins,
      losses,
      ties,
      pointsFor,
      pointsAgainst,
      xp,
    };
  });

  // Avoid double-counting season XP in the table UI when multiple stints share a season
  const seenSeasonXp = new Set<string>();
  const bySeasonDisplay = bySeason.map((row) => {
    if (seenSeasonXp.has(row.seasonId)) {
      return { ...row, xp: 0 };
    }
    seenSeasonXp.add(row.seasonId);
    return row;
  });

  const totals = bySeason.reduce(
    (acc, s) => {
      acc.wins += s.wins;
      acc.losses += s.losses;
      acc.ties += s.ties;
      acc.pointsFor += s.pointsFor;
      acc.pointsAgainst += s.pointsAgainst;
      return acc;
    },
    { wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0 }
  );

  const uniqueSeasons = new Set(bySeason.map((s) => s.seasonId));
  const reputationScore = computeReputationScore(
    settings.startingRepScore,
    repAdjustments
  );

  return {
    seasonsPlayed: uniqueSeasons.size,
    ...totals,
    careerXp: sumXp(xpAdjustments),
    reputationScore,
    reputationLabel: getReputationLabel(reputationScore),
    bySeason: bySeasonDisplay,
  };
}
