import { prisma } from "@/lib/prisma";
import { sumXp } from "@/lib/xp";
import {
  computeReputationScore,
  getReputationLabel,
} from "@/lib/reputation";
import { getLeagueSettings } from "@/lib/league";

export type SeasonRecord = {
  seasonId: string;
  seasonNumber: number;
  seasonName: string;
  franchiseId: string | null;
  franchiseName: string | null;
  franchiseAbbr: string | null;
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
        orderBy: { season: { number: "asc" } },
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

  const bySeason: SeasonRecord[] = memberships.map((m) => {
    const teamResults = results.filter(
      (r) =>
        r.seasonId === m.seasonId &&
        (r.homeTeamId === m.franchiseId || r.awayTeamId === m.franchiseId)
    );

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

    const xp = sumXp(
      xpAdjustments.filter((x) => x.seasonId === m.seasonId)
    );

    return {
      seasonId: m.seasonId,
      seasonNumber: m.season.number,
      seasonName: m.season.name,
      franchiseId: m.franchiseId,
      franchiseName: m.franchise.name,
      franchiseAbbr: m.franchise.abbreviation,
      wins,
      losses,
      ties,
      pointsFor,
      pointsAgainst,
      xp,
    };
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

  const reputationScore = computeReputationScore(
    settings.startingRepScore,
    repAdjustments
  );

  return {
    seasonsPlayed: bySeason.length,
    ...totals,
    careerXp: sumXp(xpAdjustments),
    reputationScore,
    reputationLabel: getReputationLabel(reputationScore),
    bySeason,
  };
}
