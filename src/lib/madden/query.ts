import { MaddenStatCategory } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export { ensureMaddenLeague } from "@/lib/madden/index-dumps";

const teamInclude = {
  franchise: {
    include: {
      memberships: {
        where: { isActive: true, user: { deletedAt: null } },
        include: { user: { select: { id: true, name: true } } },
        take: 1,
      },
    },
  },
  _count: { select: { players: true } },
} as const;

export async function getMaddenTeams() {
  return prisma.maddenTeam.findMany({
    where: { NOT: { abbr: "UNK" } },
    orderBy: [{ conference: "asc" }, { division: "asc" }, { abbr: "asc" }],
    include: teamInclude,
  });
}

export async function getMaddenTeam(abbr: string) {
  return prisma.maddenTeam.findFirst({
    where: { abbr: { equals: abbr, mode: "insensitive" } },
    include: {
      ...teamInclude,
      players: {
        orderBy: [{ overall: "desc" }, { lastName: "asc" }],
        include: { stats: true },
      },
    },
  });
}

export async function latestStatWeek() {
  const row = await prisma.maddenPlayerStat.findFirst({
    orderBy: { weekIndex: "desc" },
    select: { weekIndex: true },
  });
  return row?.weekIndex ?? null;
}

export async function getMaddenLivePulse() {
  const [latest, pending] = await Promise.all([
    prisma.maddenExportDump.findFirst({
      where: { indexedAt: { not: null } },
      orderBy: { indexedAt: "desc" },
      select: { indexedAt: true },
    }),
    prisma.maddenExportDump.count({ where: { indexedAt: null } }),
  ]);
  return {
    indexedAt: latest?.indexedAt ?? null,
    pending,
    stamp: latest?.indexedAt?.toISOString() ?? "",
  };
}

export async function listStatWeeks() {
  const rows = await prisma.maddenPlayerStat.findMany({
    distinct: ["weekIndex"],
    select: { weekIndex: true },
    orderBy: { weekIndex: "desc" },
  });
  return rows.map((row) => row.weekIndex);
}

export async function getWeekGames(weekIndex: number) {
  return prisma.maddenGame.findMany({
    where: { weekIndex },
    include: {
      homeTeam: {
        include: {
          franchise: {
            include: {
              memberships: {
                where: { isActive: true, user: { deletedAt: null } },
                include: { user: { select: { name: true } } },
                take: 1,
              },
            },
          },
        },
      },
      awayTeam: {
        include: {
          franchise: {
            include: {
              memberships: {
                where: { isActive: true, user: { deletedAt: null } },
                include: { user: { select: { name: true } } },
                take: 1,
              },
            },
          },
        },
      },
    },
    orderBy: { scheduleId: "asc" },
  });
}

export async function getLeaders(
  weekIndex: number,
  category: MaddenStatCategory,
  take = 10
) {
  const orderBy =
    category === MaddenStatCategory.PASSING
      ? [{ passYds: "desc" as const }, { passTDs: "desc" as const }]
      : category === MaddenStatCategory.RUSHING
        ? [{ rushYds: "desc" as const }, { rushTDs: "desc" as const }]
        : category === MaddenStatCategory.RECEIVING
          ? [{ recYds: "desc" as const }, { recTDs: "desc" as const }]
          : category === MaddenStatCategory.DEFENSE
            ? [{ defSacks: "desc" as const }, { defInts: "desc" as const }]
            : category === MaddenStatCategory.KICKING
              ? [{ kickPts: "desc" as const }]
              : [{ kickPts: "desc" as const }];

  const minWhere =
    category === MaddenStatCategory.PASSING
      ? { passAtt: { gt: 0 } }
      : category === MaddenStatCategory.RUSHING
        ? { rushYds: { gt: 0 } }
        : category === MaddenStatCategory.RECEIVING
          ? { recCatches: { gt: 0 } }
          : category === MaddenStatCategory.DEFENSE
            ? { OR: [{ defSacks: { gt: 0 } }, { defInts: { gt: 0 } }, { defTackles: { gt: 0 } }] }
            : { kickPts: { gt: 0 } };

  return prisma.maddenPlayerStat.findMany({
    where: { weekIndex, category, ...minWhere },
    include: {
      player: true,
      team: {
        include: {
          franchise: { select: { primaryColor: true } },
        },
      },
    },
    orderBy,
    take,
  });
}

export async function getTeamWeekStats(
  maddenTeamId: string,
  weekIndex: number
) {
  return prisma.maddenPlayerStat.findMany({
    where: { maddenTeamId, weekIndex },
    include: { player: true },
    orderBy: [{ category: "asc" }, { passYds: "desc" }, { rushYds: "desc" }, { recYds: "desc" }],
  });
}

export type SeasonPlayerTotal = {
  rosterId: string;
  name: string;
  firstName: string;
  lastName: string;
  position: string;
  jerseyNum: number;
  yearsPro: number;
  overall: number;
  teamAbbr: string;
  teamName: string;
  teamColor: string;
  wins: number;
  losses: number;
  ties: number;
  passYds: number;
  passTDs: number;
  passInts: number;
  passAtt: number;
  passComp: number;
  rushYds: number;
  rushTDs: number;
  rushAtt: number;
  recYds: number;
  recTDs: number;
  recCatches: number;
  defSacks: number;
  defInts: number;
  defTackles: number;
  kickPts: number;
  weeks: Set<number>;
};

export async function getSeasonPlayerTotals() {
  const stats = await prisma.maddenPlayerStat.findMany({
    where: { team: { NOT: { abbr: "UNK" } } },
    include: {
      player: true,
      team: {
        include: {
          franchise: { select: { primaryColor: true } },
        },
      },
    },
  });

  const byPlayer = new Map<string, SeasonPlayerTotal>();
  for (const row of stats) {
    const current = byPlayer.get(row.rosterId);
    const rosterName = `${row.player.firstName} ${row.player.lastName}`.trim();
    const name = rosterName || row.fullName;
    const teamColor =
      row.team.franchise?.primaryColor &&
      row.team.franchise.primaryColor.toLowerCase() !== "#000000"
        ? row.team.franchise.primaryColor
        : "#d4af37";

    if (!current) {
      byPlayer.set(row.rosterId, {
        rosterId: row.rosterId,
        name,
        firstName: row.player.firstName,
        lastName: row.player.lastName,
        position: row.player.position,
        jerseyNum: row.player.jerseyNum,
        yearsPro: row.player.yearsPro,
        overall: row.player.overall,
        teamAbbr: row.team.abbr,
        teamName: row.team.displayName || row.team.nickName,
        teamColor,
        wins: row.team.wins,
        losses: row.team.losses,
        ties: row.team.ties,
        passYds: row.passYds,
        passTDs: row.passTDs,
        passInts: row.passInts,
        passAtt: row.passAtt,
        passComp: row.passComp,
        rushYds: row.rushYds,
        rushTDs: row.rushTDs,
        rushAtt: row.rushAtt,
        recYds: row.recYds,
        recTDs: row.recTDs,
        recCatches: row.recCatches,
        defSacks: row.defSacks,
        defInts: row.defInts,
        defTackles: row.defTackles,
        kickPts: row.kickPts,
        weeks: new Set([row.weekIndex]),
      });
      continue;
    }

    current.passYds += row.passYds;
    current.passTDs += row.passTDs;
    current.passInts += row.passInts;
    current.passAtt += row.passAtt;
    current.passComp += row.passComp;
    current.rushYds += row.rushYds;
    current.rushTDs += row.rushTDs;
    current.rushAtt += row.rushAtt;
    current.recYds += row.recYds;
    current.recTDs += row.recTDs;
    current.recCatches += row.recCatches;
    current.defSacks += row.defSacks;
    current.defInts += row.defInts;
    current.defTackles += row.defTackles;
    current.kickPts += row.kickPts;
    const lastWeek = Math.max(...current.weeks);
    current.weeks.add(row.weekIndex);
    if (row.weekIndex >= lastWeek) {
      current.name = name;
      current.firstName = row.player.firstName;
      current.lastName = row.player.lastName;
      current.position = row.player.position;
      current.jerseyNum = row.player.jerseyNum;
      current.yearsPro = row.player.yearsPro;
      current.overall = row.player.overall;
      current.teamAbbr = row.team.abbr;
      current.teamName = row.team.displayName || row.team.nickName;
      current.teamColor = teamColor;
      current.wins = row.team.wins;
      current.losses = row.team.losses;
      current.ties = row.team.ties;
    }
  }

  return [...byPlayer.values()];
}

export async function getSeasonLeaders(category: MaddenStatCategory, take = 10) {
  const stats = await prisma.maddenPlayerStat.findMany({
    where: { category },
    include: { player: true, team: true },
  });
  const byPlayer = new Map<
    string,
    (typeof stats)[number] & {
      passYds: number;
      passTDs: number;
      passInts: number;
      rushYds: number;
      rushTDs: number;
      recYds: number;
      recTDs: number;
      recCatches: number;
      defSacks: number;
      defInts: number;
      defTackles: number;
      kickPts: number;
    }
  >();
  for (const row of stats) {
    const current = byPlayer.get(row.rosterId);
    if (!current) {
      byPlayer.set(row.rosterId, { ...row });
      continue;
    }
    current.passYds += row.passYds;
    current.passTDs += row.passTDs;
    current.passInts += row.passInts;
    current.rushYds += row.rushYds;
    current.rushTDs += row.rushTDs;
    current.recYds += row.recYds;
    current.recTDs += row.recTDs;
    current.recCatches += row.recCatches;
    current.defSacks += row.defSacks;
    current.defInts += row.defInts;
    current.defTackles += row.defTackles;
    current.kickPts += row.kickPts;
  }
  const metric = (row: NonNullable<ReturnType<typeof byPlayer.get>>) => {
    if (category === MaddenStatCategory.PASSING) return row.passYds;
    if (category === MaddenStatCategory.RUSHING) return row.rushYds;
    if (category === MaddenStatCategory.RECEIVING) return row.recYds;
    if (category === MaddenStatCategory.DEFENSE) return row.defSacks * 10 + row.defInts;
    return row.kickPts;
  };
  return [...byPlayer.values()]
    .sort((a, b) => metric(b) - metric(a))
    .slice(0, take);
}
