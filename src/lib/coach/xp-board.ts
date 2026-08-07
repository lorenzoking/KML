import { prisma } from "@/lib/prisma";

export type XpBoardRow = {
  userId: string;
  coach: string;
  team: string;
  teamAbbr: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  gameXp: number;
  manualXp: number;
  totalXp: number;
  winPct: number;
};

export async function getXpStandings(seasonId: string): Promise<XpBoardRow[]> {
  const memberships = await prisma.leagueMembership.findMany({
    where: { seasonId, isActive: true },
    include: {
      user: true,
      franchise: true,
    },
  });

  const results = await prisma.gameResult.findMany({
    where: { seasonId, isVoided: false },
  });

  const adjustments = await prisma.xPAdjustment.findMany({
    where: { seasonId },
  });

  const rows: XpBoardRow[] = memberships.map((m) => {
    const teamResults = results.filter(
      (r) => r.homeTeamId === m.franchiseId || r.awayTeamId === m.franchiseId
    );
    const wins = teamResults.filter((r) => r.winnerTeamId === m.franchiseId).length;
    const losses = teamResults.filter(
      (r) => r.winnerTeamId && r.winnerTeamId !== m.franchiseId
    ).length;

    const userAdjustments = adjustments.filter((a) => a.userId === m.userId);
    const gameXp = userAdjustments
      .filter((a) => a.isAutomatic)
      .reduce((sum, row) => sum + row.amount, 0);
    const manualXp = userAdjustments
      .filter((a) => !a.isAutomatic)
      .reduce((sum, row) => sum + row.amount, 0);
    const totalXp = gameXp + manualXp;
    const gamesPlayed = wins + losses;
    const winPct = gamesPlayed > 0 ? wins / gamesPlayed : 0;

    return {
      userId: m.userId,
      coach: m.user.name?.trim() || "Unnamed coach",
      team: m.franchise.name,
      teamAbbr: m.franchise.abbreviation,
      gamesPlayed,
      wins,
      losses,
      gameXp,
      manualXp,
      totalXp,
      winPct,
    };
  });

  return rows.sort((a, b) => {
    if (b.totalXp !== a.totalXp) return b.totalXp - a.totalXp;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return b.winPct - a.winPct;
  });
}
