import { prisma } from "@/lib/prisma";
import { franchiseIdForMaddenTeam } from "@/lib/madden/franchises";
import { scoresForSiteSubmitter } from "@/lib/madden/sync-scores-map";

export async function findMaddenScoreForMatchup(params: {
  week: number;
  userTeamId: string;
  opponentTeamId: string;
}) {
  const weekIndex = params.week - 1;
  const games = await prisma.maddenGame.findMany({
    where: { weekIndex },
    include: {
      homeTeam: { select: { franchiseId: true, abbr: true } },
      awayTeam: { select: { franchiseId: true, abbr: true } },
    },
  });

  for (const game of games) {
    const homeFranchiseId = await franchiseIdForMaddenTeam(game.homeTeam);
    const awayFranchiseId = await franchiseIdForMaddenTeam(game.awayTeam);
    if (!homeFranchiseId || !awayFranchiseId) continue;
    const match =
      (homeFranchiseId === params.userTeamId &&
        awayFranchiseId === params.opponentTeamId) ||
      (awayFranchiseId === params.userTeamId &&
        homeFranchiseId === params.opponentTeamId);
    if (!match) continue;
    if (game.homeScore === 0 && game.awayScore === 0) return null;
    return {
      ...scoresForSiteSubmitter({
        userTeamId: params.userTeamId,
        homeFranchiseId,
        homeScore: game.homeScore,
        awayScore: game.awayScore,
      }),
      status: game.status,
    };
  }

  return null;
}
