import { MaddenStatCategory } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { canonAbbr } from "@/lib/madden/franchises";
import { playerName } from "@/lib/madden/display";

export type BoxScoreLine = {
  rosterId: string;
  name: string;
  position: string;
  jerseyNum: number;
  teamAbbr: string;
  passComp: number;
  passAtt: number;
  passYds: number;
  passTDs: number;
  passInts: number;
  passerRating: number;
  rushAtt: number;
  rushYds: number;
  rushTDs: number;
  recCatches: number;
  recYds: number;
  recTDs: number;
  defTackles: number;
  defSacks: number;
  defInts: number;
  kickPts: number;
};

export type BoxScoreTeamTotals = {
  offPassYds: number;
  offRushYds: number;
  offPassTDs: number;
  offRushTDs: number;
  defTotalYds: number;
  defSacks: number;
};

export type BoxScoreSide = {
  abbr: string;
  name: string;
  totals: BoxScoreTeamTotals | null;
  passing: BoxScoreLine[];
  rushing: BoxScoreLine[];
  receiving: BoxScoreLine[];
  defense: BoxScoreLine[];
  kicking: BoxScoreLine[];
};

export type GameBoxScore = {
  week: number;
  maddenScore: {
    awayAbbr: string;
    homeAbbr: string;
    awayScore: number;
    homeScore: number;
  } | null;
  sides: [BoxScoreSide, BoxScoreSide];
};

function lineFromStat(row: {
  rosterId: string;
  fullName: string;
  passComp: number;
  passAtt: number;
  passYds: number;
  passTDs: number;
  passInts: number;
  passerRating: number;
  rushAtt: number;
  rushYds: number;
  rushTDs: number;
  recCatches: number;
  recYds: number;
  recTDs: number;
  defTackles: number;
  defSacks: number;
  defInts: number;
  kickPts: number;
  player: { firstName: string; lastName: string; position: string; jerseyNum: number };
  team: { abbr: string };
}): BoxScoreLine {
  return {
    rosterId: row.rosterId,
    name: row.fullName.trim() || playerName(row.player),
    position: row.player.position,
    jerseyNum: row.player.jerseyNum,
    teamAbbr: row.team.abbr,
    passComp: row.passComp,
    passAtt: row.passAtt,
    passYds: row.passYds,
    passTDs: row.passTDs,
    passInts: row.passInts,
    passerRating: row.passerRating,
    rushAtt: row.rushAtt,
    rushYds: row.rushYds,
    rushTDs: row.rushTDs,
    recCatches: row.recCatches,
    recYds: row.recYds,
    recTDs: row.recTDs,
    defTackles: row.defTackles,
    defSacks: row.defSacks,
    defInts: row.defInts,
    kickPts: row.kickPts,
  };
}

async function maddenTeamForFranchise(franchiseId: string, abbr: string) {
  const byFranchise = await prisma.maddenTeam.findFirst({
    where: { franchiseId },
  });
  if (byFranchise) return byFranchise;
  const aliases = [...new Set([canonAbbr(abbr), abbr.toUpperCase()])];
  return prisma.maddenTeam.findFirst({
    where: {
      OR: aliases.map((value) => ({
        abbr: { equals: value, mode: "insensitive" as const },
      })),
    },
  });
}

type IndexedStat = Parameters<typeof lineFromStat>[0] & {
  category: MaddenStatCategory;
  maddenTeamId: string;
};

function sideFromRows(
  abbr: string,
  name: string,
  maddenTeamId: string,
  stats: IndexedStat[],
  totals:
    | {
        offPassYds: number;
        offRushYds: number;
        offPassTDs: number;
        offRushTDs: number;
        defTotalYds: number;
        defSacks: number;
      }
    | undefined
): BoxScoreSide {
  const mine = stats.filter((row) => row.maddenTeamId === maddenTeamId);
  const passing = mine
    .filter((row) => row.category === MaddenStatCategory.PASSING && row.passAtt > 0)
    .map(lineFromStat)
    .sort((a, b) => b.passYds - a.passYds);
  const rushing = mine
    .filter((row) => row.category === MaddenStatCategory.RUSHING && (row.rushAtt > 0 || row.rushYds !== 0))
    .map(lineFromStat)
    .sort((a, b) => b.rushYds - a.rushYds);
  const receiving = mine
    .filter((row) => row.category === MaddenStatCategory.RECEIVING && row.recCatches > 0)
    .map(lineFromStat)
    .sort((a, b) => b.recYds - a.recYds);
  const defense = mine
    .filter(
      (row) =>
        row.category === MaddenStatCategory.DEFENSE &&
        (row.defTackles > 0 || row.defSacks > 0 || row.defInts > 0)
    )
    .map(lineFromStat)
    .sort((a, b) => b.defTackles - a.defTackles || b.defSacks - a.defSacks || b.defInts - a.defInts);
  const kicking = mine
    .filter((row) => row.category === MaddenStatCategory.KICKING && row.kickPts > 0)
    .map(lineFromStat)
    .sort((a, b) => b.kickPts - a.kickPts);

  const meaningfulTotals =
    totals &&
    (totals.offPassYds ||
      totals.offRushYds ||
      totals.offPassTDs ||
      totals.offRushTDs ||
      totals.defTotalYds ||
      totals.defSacks)
      ? {
          offPassYds: totals.offPassYds,
          offRushYds: totals.offRushYds,
          offPassTDs: totals.offPassTDs,
          offRushTDs: totals.offRushTDs,
          defTotalYds: totals.defTotalYds,
          defSacks: totals.defSacks,
        }
      : null;

  return {
    abbr,
    name,
    totals: meaningfulTotals,
    passing,
    rushing,
    receiving,
    defense,
    kicking,
  };
}

export function hasBoxScoreLines(side: BoxScoreSide) {
  return (
    Boolean(side.totals) ||
    side.passing.length > 0 ||
    side.rushing.length > 0 ||
    side.receiving.length > 0 ||
    side.defense.length > 0 ||
    side.kicking.length > 0
  );
}

export async function getGameBoxScore(input: {
  week: number;
  userTeamId: string;
  opponentTeamId: string;
  userAbbr: string;
  opponentAbbr: string;
  userName: string;
  opponentName: string;
}): Promise<GameBoxScore | null> {
  const weekIndex = input.week - 1;
  const [userTeam, opponentTeam] = await Promise.all([
    maddenTeamForFranchise(input.userTeamId, input.userAbbr),
    maddenTeamForFranchise(input.opponentTeamId, input.opponentAbbr),
  ]);
  if (!userTeam && !opponentTeam) return null;

  const teamIds = [userTeam?.maddenTeamId, opponentTeam?.maddenTeamId].filter(
    (id): id is string => Boolean(id)
  );
  const [maddenGame, playerStats, teamWeek] = await Promise.all([
    prisma.maddenGame.findFirst({
      where:
        userTeam && opponentTeam
          ? {
              weekIndex,
              OR: [
                {
                  homeTeamId: userTeam.maddenTeamId,
                  awayTeamId: opponentTeam.maddenTeamId,
                },
                {
                  homeTeamId: opponentTeam.maddenTeamId,
                  awayTeamId: userTeam.maddenTeamId,
                },
              ],
            }
          : {
              weekIndex,
              OR: teamIds.flatMap((id) => [{ homeTeamId: id }, { awayTeamId: id }]),
            },
      include: {
        homeTeam: { select: { abbr: true } },
        awayTeam: { select: { abbr: true } },
      },
    }),
    prisma.maddenPlayerStat.findMany({
      where: { weekIndex, maddenTeamId: { in: teamIds } },
      include: {
        player: {
          select: { firstName: true, lastName: true, position: true, jerseyNum: true },
        },
        team: { select: { abbr: true } },
      },
    }),
    prisma.maddenTeamWeekStat.findMany({
      where: { weekIndex, maddenTeamId: { in: teamIds } },
    }),
  ]);

  const totalsByTeam = new Map(teamWeek.map((row) => [row.maddenTeamId, row]));
  const userSide = sideFromRows(
    input.userAbbr,
    input.userName,
    userTeam?.maddenTeamId ?? "",
    playerStats,
    userTeam ? totalsByTeam.get(userTeam.maddenTeamId) : undefined
  );
  const opponentSide = sideFromRows(
    input.opponentAbbr,
    input.opponentName,
    opponentTeam?.maddenTeamId ?? "",
    playerStats,
    opponentTeam ? totalsByTeam.get(opponentTeam.maddenTeamId) : undefined
  );

  if (!hasBoxScoreLines(userSide) && !hasBoxScoreLines(opponentSide) && !maddenGame) {
    return null;
  }

  return {
    week: input.week,
    maddenScore: maddenGame
      ? {
          awayAbbr: maddenGame.awayTeam.abbr,
          homeAbbr: maddenGame.homeTeam.abbr,
          awayScore: maddenGame.awayScore,
          homeScore: maddenGame.homeScore,
        }
      : null,
    sides: [userSide, opponentSide],
  };
}
