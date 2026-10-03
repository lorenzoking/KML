import { prisma } from "@/lib/prisma";
import { NFL_REGULAR_SEASON_WEEKS } from "@/lib/league-week";

export type HallChampion = {
  seasonNumber: number;
  championName: string;
  championAbbr: string;
  championColor: string;
  runnerUpName: string | null;
  runnerUpAbbr: string | null;
  championScore: number;
  runnerUpScore: number;
  coachName: string | null;
  wins: number;
  losses: number;
  ties: number;
};

export async function getHallOfChampions(): Promise<HallChampion[]> {
  const titles = await prisma.seasonTitle.findMany({
    orderBy: { seasonNumber: "desc" },
    include: {
      champion: {
        select: { id: true, name: true, abbreviation: true, primaryColor: true },
      },
      runnerUp: { select: { name: true, abbreviation: true } },
    },
  });
  if (titles.length === 0) return [];

  const seasons = await prisma.season.findMany({
    where: { number: { in: titles.map((title) => title.seasonNumber) } },
    select: { id: true, number: true },
  });
  const seasonIdByNumber = new Map(seasons.map((season) => [season.number, season.id]));
  const seasonIds = seasons.map((season) => season.id);

  const [results, memberships] = await Promise.all([
    prisma.gameResult.findMany({
      where: {
        seasonId: { in: seasonIds },
        isVoided: false,
        week: { lte: NFL_REGULAR_SEASON_WEEKS },
      },
      select: { seasonId: true, homeTeamId: true, awayTeamId: true, winnerTeamId: true },
    }),
    prisma.leagueMembership.findMany({
      where: {
        seasonId: { in: seasonIds },
        franchiseId: { in: titles.map((title) => title.championFranchiseId) },
        user: { deletedAt: null },
      },
      select: {
        seasonId: true,
        franchiseId: true,
        isActive: true,
        user: { select: { name: true } },
      },
      orderBy: { assignedAt: "desc" },
    }),
  ]);

  return titles.map((title) => {
    const seasonId = seasonIdByNumber.get(title.seasonNumber);
    const record = { wins: 0, losses: 0, ties: 0 };
    if (seasonId) {
      for (const game of results) {
        if (game.seasonId !== seasonId) continue;
        const played =
          game.homeTeamId === title.championFranchiseId ||
          game.awayTeamId === title.championFranchiseId;
        if (!played) continue;
        if (!game.winnerTeamId) record.ties += 1;
        else if (game.winnerTeamId === title.championFranchiseId) record.wins += 1;
        else record.losses += 1;
      }
    }
    const coach = memberships.find(
      (row) =>
        row.seasonId === seasonId && row.franchiseId === title.championFranchiseId
    );
    return {
      seasonNumber: title.seasonNumber,
      championName: title.champion.name,
      championAbbr: title.champion.abbreviation,
      championColor: title.champion.primaryColor,
      runnerUpName: title.runnerUp?.name ?? null,
      runnerUpAbbr: title.runnerUp?.abbreviation ?? null,
      championScore: title.championScore,
      runnerUpScore: title.runnerUpScore,
      coachName: coach?.user.name?.trim() || null,
      ...record,
    };
  });
}
