import { MaddenExportKind, MaddenStatCategory } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  flag,
  jsonValue,
  num,
  payloadList,
  rosterIdOf,
  splitName,
  STAT_LISTS,
  str,
  teamIdOf,
} from "@/lib/madden/parse";
import { awardUndeclaredForceWinXp } from "@/lib/madden/undeclared-force-win-xp";

async function franchiseByAbbr() {
  const franchises = await prisma.franchise.findMany({
    select: { id: true, abbreviation: true, name: true },
  });
  const aliases: Record<string, string> = {
    AZ: "ARI",
    ARZ: "ARI",
    WSH: "WAS",
    JAC: "JAX",
  };
  const map = new Map<string, string>();
  for (const row of franchises) {
    map.set(row.abbreviation.toUpperCase(), row.id);
  }
  for (const [from, to] of Object.entries(aliases)) {
    const id = map.get(to);
    if (id) map.set(from, id);
  }
  return map;
}

function canonAbbr(abbr: string) {
  const aliases: Record<string, string> = {
    AZ: "ARI",
    ARZ: "ARI",
    WSH: "WAS",
    JAC: "JAX",
  };
  const up = abbr.toUpperCase();
  return aliases[up] ?? up;
}

async function ensureTeam(maddenTeamId: string, fallbackName = "Team") {
  if (!maddenTeamId) return;
  const existing = await prisma.maddenTeam.findUnique({
    where: { maddenTeamId },
    select: { id: true },
  });
  if (existing) return;
  await prisma.maddenTeam.create({
    data: {
      maddenTeamId,
      abbr: maddenTeamId.slice(-3),
      city: "",
      nickName: fallbackName,
      displayName: fallbackName,
      division: "",
      conference: "",
    },
  });
}

async function ensurePlayer(
  rosterId: string,
  maddenTeamId: string,
  fullName: string
) {
  if (!rosterId || !maddenTeamId) return;
  await ensureTeam(maddenTeamId, fullName);
  const existing = await prisma.maddenPlayer.findUnique({
    where: { rosterId },
    select: { id: true },
  });
  if (existing) return;
  const name = splitName(fullName);
  await prisma.maddenPlayer.create({
    data: {
      rosterId,
      maddenTeamId,
      firstName: name.firstName,
      lastName: name.lastName,
      position: "UNK",
    },
  });
}

async function indexLeagueTeams(payload: unknown) {
  const abbrMap = await franchiseByAbbr();
  for (const row of payloadList(payload, "leagueTeamInfoList")) {
    const maddenTeamId = teamIdOf(row);
    if (!maddenTeamId) continue;
    const abbr = canonAbbr(str(row, "abbrName"));
    await prisma.maddenTeam.upsert({
      where: { maddenTeamId },
      create: {
        maddenTeamId,
        franchiseId: abbrMap.get(abbr) ?? null,
        abbr,
        city: str(row, "cityName"),
        nickName: str(row, "nickName"),
        displayName: str(row, "displayName") || str(row, "nickName"),
        division: str(row, "divName"),
        conference: str(row, "divName").startsWith("AFC") ? "AFC" : "NFC",
        ovr: Math.round(num(row, "ovrRating")),
        userName: str(row, "userName") || null,
      },
      update: {
        franchiseId: abbrMap.get(abbr) ?? null,
        abbr,
        city: str(row, "cityName"),
        nickName: str(row, "nickName"),
        displayName: str(row, "displayName") || str(row, "nickName"),
        division: str(row, "divName"),
        conference: str(row, "divName").startsWith("AFC") ? "AFC" : "NFC",
        ovr: Math.round(num(row, "ovrRating")),
        userName: str(row, "userName") || null,
      },
    });
  }
}

async function indexStandings(payload: unknown) {
  for (const row of payloadList(payload, "teamStandingInfoList")) {
    const maddenTeamId = teamIdOf(row);
    if (!maddenTeamId) continue;
    await ensureTeam(maddenTeamId, str(row, "teamName"));
    await prisma.maddenTeam.update({
      where: { maddenTeamId },
      data: {
        wins: Math.round(num(row, "totalWins")),
        losses: Math.round(num(row, "totalLosses")),
        ties: Math.round(num(row, "totalTies")),
        ptsFor: Math.round(num(row, "ptsFor")),
        ptsAgainst: Math.round(num(row, "ptsAgainst")),
        ovr: Math.round(num(row, "teamOvr")) || undefined,
        displayName: str(row, "teamName") || undefined,
        division: str(row, "divisionName") || undefined,
        conference: str(row, "conferenceName") || undefined,
      },
    });
  }
}

async function indexRoster(payload: unknown, pathTeamId: string | null) {
  for (const row of payloadList(payload, "rosterInfoList")) {
    const rosterId = rosterIdOf(row);
    const maddenTeamId = teamIdOf(row) || pathTeamId || "";
    if (!rosterId || !maddenTeamId) continue;
    await ensureTeam(maddenTeamId, "Roster");
    await prisma.maddenPlayer.upsert({
      where: { rosterId },
      create: {
        rosterId,
        maddenTeamId,
        firstName: str(row, "firstName"),
        lastName: str(row, "lastName"),
        position: str(row, "position") || "UNK",
        jerseyNum: Math.round(num(row, "jerseyNum")),
        overall: Math.round(num(row, "playerBestOvr") || num(row, "playerSchemeOvr")),
        age: Math.round(num(row, "age")),
        yearsPro: Math.round(num(row, "yearsPro")),
        height: Math.round(num(row, "height")),
        weight: Math.round(num(row, "weight")),
        devTrait: Math.round(num(row, "devTrait")),
        college: str(row, "college"),
        contractSalary: Math.round(num(row, "contractSalary")),
        contractYearsLeft: Math.round(num(row, "contractYearsLeft")),
        isOnIR: flag(row, "isOnIR"),
        isOnPracticeSquad: flag(row, "isOnPracticeSquad"),
      },
      update: {
        maddenTeamId,
        firstName: str(row, "firstName"),
        lastName: str(row, "lastName"),
        position: str(row, "position") || "UNK",
        jerseyNum: Math.round(num(row, "jerseyNum")),
        overall: Math.round(num(row, "playerBestOvr") || num(row, "playerSchemeOvr")),
        age: Math.round(num(row, "age")),
        yearsPro: Math.round(num(row, "yearsPro")),
        height: Math.round(num(row, "height")),
        weight: Math.round(num(row, "weight")),
        devTrait: Math.round(num(row, "devTrait")),
        college: str(row, "college"),
        contractSalary: Math.round(num(row, "contractSalary")),
        contractYearsLeft: Math.round(num(row, "contractYearsLeft")),
        isOnIR: flag(row, "isOnIR"),
        isOnPracticeSquad: flag(row, "isOnPracticeSquad"),
      },
    });
  }
}

function kickPoints(row: Record<string, unknown>) {
  const listed = Math.round(num(row, "kickPts"));
  if (listed > 0) return listed;
  return Math.round(num(row, "fGMade")) * 3 + Math.round(num(row, "xPMade"));
}

async function indexPlayerStats(payload: unknown) {
  for (const list of STAT_LISTS) {
    for (const row of payloadList(payload, list.key)) {
      const rosterId = rosterIdOf(row);
      const maddenTeamId = teamIdOf(row);
      const weekIndex = Math.round(num(row, "weekIndex"));
      const fullName = str(row, "fullName");
      if (!rosterId || !maddenTeamId) continue;
      await ensurePlayer(rosterId, maddenTeamId, fullName);
      await prisma.maddenPlayerStat.upsert({
        where: {
          rosterId_weekIndex_category: {
            rosterId,
            weekIndex,
            category: list.category,
          },
        },
        create: {
          rosterId,
          maddenTeamId,
          weekIndex,
          category: list.category,
          fullName,
          passYds: Math.round(num(row, "passYds")),
          passTDs: Math.round(num(row, "passTDs")),
          passInts: Math.round(num(row, "passInts")),
          passAtt: Math.round(num(row, "passAtt")),
          passComp: Math.round(num(row, "passComp")),
          passerRating: num(row, "passerRating"),
          rushYds: Math.round(num(row, "rushYds")),
          rushTDs: Math.round(num(row, "rushTDs")),
          rushAtt: Math.round(num(row, "rushAtt")),
          recYds: Math.round(num(row, "recYds")),
          recTDs: Math.round(num(row, "recTDs")),
          recCatches: Math.round(num(row, "recCatches")),
          defTackles: Math.round(num(row, "defTotalTackles")),
          defSacks: num(row, "defSacks"),
          defInts: Math.round(num(row, "defInts")),
          kickPts: kickPoints(row),
          payload: jsonValue(row),
        },
        update: {
          maddenTeamId,
          fullName,
          passYds: Math.round(num(row, "passYds")),
          passTDs: Math.round(num(row, "passTDs")),
          passInts: Math.round(num(row, "passInts")),
          passAtt: Math.round(num(row, "passAtt")),
          passComp: Math.round(num(row, "passComp")),
          passerRating: num(row, "passerRating"),
          rushYds: Math.round(num(row, "rushYds")),
          rushTDs: Math.round(num(row, "rushTDs")),
          rushAtt: Math.round(num(row, "rushAtt")),
          recYds: Math.round(num(row, "recYds")),
          recTDs: Math.round(num(row, "recTDs")),
          recCatches: Math.round(num(row, "recCatches")),
          defTackles: Math.round(num(row, "defTotalTackles")),
          defSacks: num(row, "defSacks"),
          defInts: Math.round(num(row, "defInts")),
          kickPts: kickPoints(row),
          payload: jsonValue(row),
        },
      });
    }
  }
}

async function indexTeamWeekStats(payload: unknown) {
  for (const row of payloadList(payload, "teamStatInfoList")) {
    const maddenTeamId = teamIdOf(row);
    const weekIndex = Math.round(num(row, "weekIndex"));
    if (!maddenTeamId) continue;
    await ensureTeam(maddenTeamId);
    await prisma.maddenTeamWeekStat.upsert({
      where: { maddenTeamId_weekIndex: { maddenTeamId, weekIndex } },
      create: {
        maddenTeamId,
        weekIndex,
        offPassYds: Math.round(num(row, "offPassYds")),
        offRushYds: Math.round(num(row, "offRushYds")),
        offPassTDs: Math.round(num(row, "offPassTDs")),
        offRushTDs: Math.round(num(row, "offRushTDs")),
        offPtsPerGame: num(row, "offPtsPerGame"),
        defTotalYds: Math.round(num(row, "defTotalYds")),
        defSacks: num(row, "defSacks"),
        defPtsPerGame: num(row, "defPtsPerGame"),
        payload: jsonValue(row),
      },
      update: {
        offPassYds: Math.round(num(row, "offPassYds")),
        offRushYds: Math.round(num(row, "offRushYds")),
        offPassTDs: Math.round(num(row, "offPassTDs")),
        offRushTDs: Math.round(num(row, "offRushTDs")),
        offPtsPerGame: num(row, "offPtsPerGame"),
        defTotalYds: Math.round(num(row, "defTotalYds")),
        defSacks: num(row, "defSacks"),
        defPtsPerGame: num(row, "defPtsPerGame"),
        payload: jsonValue(row),
      },
    });
  }
}

async function indexSchedule(payload: unknown) {
  const scheduleIds: string[] = [];
  for (const row of payloadList(payload, "gameScheduleInfoList")) {
    const scheduleId = str(row, "scheduleId") || String(row.scheduleId ?? "");
    const homeTeamId = String(row.homeTeamId ?? "");
    const awayTeamId = String(row.awayTeamId ?? "");
    if (!scheduleId || !homeTeamId || !awayTeamId) continue;
    await ensureTeam(homeTeamId);
    await ensureTeam(awayTeamId);
    await prisma.maddenGame.upsert({
      where: { scheduleId },
      create: {
        scheduleId,
        weekIndex: Math.round(num(row, "weekIndex")),
        homeTeamId,
        awayTeamId,
        homeScore: Math.round(num(row, "homeScore")),
        awayScore: Math.round(num(row, "awayScore")),
        status: Math.round(num(row, "status")),
        isGameOfTheWeek: flag(row, "isGameOfTheWeek"),
      },
      update: {
        weekIndex: Math.round(num(row, "weekIndex")),
        homeTeamId,
        awayTeamId,
        homeScore: Math.round(num(row, "homeScore")),
        awayScore: Math.round(num(row, "awayScore")),
        status: Math.round(num(row, "status")),
        isGameOfTheWeek: flag(row, "isGameOfTheWeek"),
      },
    });
    scheduleIds.push(scheduleId);
  }
  if (scheduleIds.length === 0) return;
  try {
    await awardUndeclaredForceWinXp(scheduleIds);
  } catch (error) {
    console.error("Failed to award undeclared force-win XP", error);
  }
}

export async function indexMaddenDump(dump: {
  id: string;
  kind: MaddenExportKind;
  teamId: string | null;
  dataType: string | null;
  success: boolean | null;
  payload: unknown;
}) {
  if (dump.success === false) {
    await prisma.maddenExportDump.update({
      where: { id: dump.id },
      data: { indexedAt: new Date() },
    });
    return;
  }

  if (dump.kind === MaddenExportKind.LEAGUE_TEAMS) await indexLeagueTeams(dump.payload);
  else if (dump.kind === MaddenExportKind.STANDINGS) await indexStandings(dump.payload);
  else if (dump.kind === MaddenExportKind.TEAM_ROSTER) {
    await indexRoster(dump.payload, dump.teamId);
  } else if (dump.kind === MaddenExportKind.SCHEDULE || dump.dataType === "schedules") {
    await indexSchedule(dump.payload);
  } else if (
    dump.kind === MaddenExportKind.TEAM_STATS ||
    dump.dataType === "team" ||
    dump.dataType === "teamstats"
  ) {
    await indexTeamWeekStats(dump.payload);
  } else if (dump.kind === MaddenExportKind.PLAYER_STATS) {
    await indexPlayerStats(dump.payload);
  }

  await prisma.maddenExportDump.update({
    where: { id: dump.id },
    data: { indexedAt: new Date() },
  });
}

export async function indexPendingMaddenDumps(take = 40) {
  const dumps = await prisma.maddenExportDump.findMany({
    where: { indexedAt: null },
    orderBy: { receivedAt: "asc" },
    take,
    select: {
      id: true,
      kind: true,
      teamId: true,
      dataType: true,
      success: true,
      payload: true,
    },
  });
  for (const dump of dumps) {
    try {
      await indexMaddenDump(dump);
    } catch (error) {
      console.error("Failed to index Madden dump", dump.id, error);
    }
  }
  return dumps.length;
}

export async function ensureMaddenLeague() {
  const indexed = await indexPendingMaddenDumps();
  if (indexed === 0) return;
  const { generateMaddenStories } = await import("@/lib/madden/stories");
  await generateMaddenStories();
}
