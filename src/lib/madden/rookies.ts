import { prisma } from "@/lib/prisma";
import { liveMaddenSeason } from "@/lib/madden/live-season";
import { rosterSeasonLine, sumPlayerStats } from "@/lib/madden/display";

export async function getRookieClass() {
  const season = await liveMaddenSeason();
  const players = await prisma.maddenPlayer.findMany({
    where: {
      yearsPro: 0,
      isOnPracticeSquad: false,
      isOnIR: false,
      NOT: { position: "UNK" },
      team: { franchiseId: { not: null } },
    },
    include: {
      team: {
        select: {
          abbr: true,
          displayName: true,
          city: true,
          nickName: true,
          franchise: {
            select: {
              abbreviation: true,
              primaryColor: true,
              memberships: {
                where: {
                  isActive: true,
                  seasonId: season.id,
                  user: { deletedAt: null },
                },
                select: { user: { select: { name: true } } },
                take: 1,
              },
            },
          },
        },
      },
      stats: {
        where: { seasonNumber: season.number },
        select: {
          weekIndex: true,
          passYds: true,
          passTDs: true,
          passInts: true,
          passAtt: true,
          passComp: true,
          rushYds: true,
          rushTDs: true,
          rushAtt: true,
          recYds: true,
          recTDs: true,
          recCatches: true,
          defSacks: true,
          defInts: true,
          defTackles: true,
          kickPts: true,
        },
      },
    },
    orderBy: [{ overall: "desc" }, { lastName: "asc" }],
  });

  const practiceSquad = await prisma.maddenPlayer.count({
    where: {
      yearsPro: 0,
      isOnPracticeSquad: true,
      team: { franchiseId: { not: null } },
    },
  });

  return {
    seasonNumber: season.number,
    practiceSquad,
    players: players.map((player) => {
      const sums = sumPlayerStats(player.stats);
      const line = rosterSeasonLine(player.position, sums);
      return {
        id: player.id,
        name: `${player.firstName} ${player.lastName}`.trim(),
        position: player.position,
        overall: player.overall,
        devTrait: player.devTrait,
        jerseyNum: player.jerseyNum,
        college: player.college,
        teamAbbr: player.team.franchise?.abbreviation || player.team.abbr,
        teamName: player.team.displayName || `${player.team.city} ${player.team.nickName}`,
        teamColor: player.team.franchise?.primaryColor ?? null,
        coachName: player.team.franchise?.memberships[0]?.user.name?.trim() || null,
        line: line === "—" ? null : line,
      };
    }),
  };
}
