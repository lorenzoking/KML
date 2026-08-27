import { randomBytes } from "crypto";
import { MaddenExportKind } from "@/generated/prisma/client";
import { getSiteUrl } from "@/lib/site";

export const MADDEN_EXPORT_KIND_LABELS: Record<MaddenExportKind, string> = {
  LEAGUE_TEAMS: "League teams",
  STANDINGS: "Standings",
  SCHEDULE: "Schedule",
  TEAM_STATS: "Team stats",
  PLAYER_STATS: "Player stats",
  TEAM_ROSTER: "Team roster",
  FREE_AGENTS: "Free agents",
  UNKNOWN: "Unrecognized (kept raw)",
};

const LIST_KEY_HINTS: Array<{ key: string; kind: MaddenExportKind }> = [
  { key: "leagueTeamInfoList", kind: MaddenExportKind.LEAGUE_TEAMS },
  { key: "teamStandingInfoList", kind: MaddenExportKind.STANDINGS },
  { key: "gameScheduleInfoList", kind: MaddenExportKind.SCHEDULE },
  { key: "teamStatInfoList", kind: MaddenExportKind.TEAM_STATS },
  { key: "rosterInfoList", kind: MaddenExportKind.TEAM_ROSTER },
  { key: "playerPassingStatInfoList", kind: MaddenExportKind.PLAYER_STATS },
  { key: "playerRushingStatInfoList", kind: MaddenExportKind.PLAYER_STATS },
  { key: "playerReceivingStatInfoList", kind: MaddenExportKind.PLAYER_STATS },
  { key: "playerDefensiveStatInfoList", kind: MaddenExportKind.PLAYER_STATS },
  { key: "playerKickingStatInfoList", kind: MaddenExportKind.PLAYER_STATS },
  { key: "playerPuntingStatInfoList", kind: MaddenExportKind.PLAYER_STATS },
];

export function newMaddenExportToken() {
  return randomBytes(24).toString("base64url");
}

export function maddenPublicOrigin() {
  const site = getSiteUrl();
  // Apex kingsmaddenleague.com 308s to www. Companion POSTs typically do not
  // follow that redirect, so league URLs meant for the phone must already be on www.
  if (site.includes("kingsmaddenleague.com") && !site.includes("www.")) {
    return site.replace("://kingsmaddenleague.com", "://www.kingsmaddenleague.com");
  }
  return site;
}

export function maddenExportUrl(token: string) {
  return `${maddenPublicOrigin()}/api/madden/${token}`;
}

export const MADDEN_EXPLORE_PATH = "/admin/madden/explore";

export function maddenExploreUrl() {
  return `${maddenPublicOrigin()}${MADDEN_EXPLORE_PATH}`;
}

export type CompanionPathInfo = {
  kind: MaddenExportKind;
  platform: string | null;
  leagueId: string | null;
  weekType: string | null;
  weekNumber: number | null;
  teamId: string | null;
  dataType: string | null;
};

export function classifyCompanionPath(segments: string[]): CompanionPathInfo {
  const empty: CompanionPathInfo = {
    kind: MaddenExportKind.UNKNOWN,
    platform: null,
    leagueId: null,
    weekType: null,
    weekNumber: null,
    teamId: null,
    dataType: null,
  };
  if (segments.length < 2) return empty;

  const platform = segments[0] ?? null;
  const leagueId = segments[1] ?? null;
  const rest = segments.slice(2);

  if (rest[0] === "leagueteams") {
    return { ...empty, kind: MaddenExportKind.LEAGUE_TEAMS, platform, leagueId };
  }
  if (rest[0] === "standings") {
    return { ...empty, kind: MaddenExportKind.STANDINGS, platform, leagueId };
  }
  if (rest[0] === "freeagents" && rest[1] === "roster") {
    return { ...empty, kind: MaddenExportKind.FREE_AGENTS, platform, leagueId };
  }
  if (rest[0] === "team" && rest[2] === "roster") {
    return {
      ...empty,
      kind: MaddenExportKind.TEAM_ROSTER,
      platform,
      leagueId,
      teamId: rest[1] ?? null,
    };
  }
  if (rest[0] === "week" && rest.length >= 4) {
    const weekType = rest[1] ?? null;
    const weekNumber = Number(rest[2]);
    const dataType = rest[3] ?? null;
    const kind =
      dataType === "schedules"
        ? MaddenExportKind.SCHEDULE
        : dataType === "teamstats"
          ? MaddenExportKind.TEAM_STATS
          : MaddenExportKind.PLAYER_STATS;
    return {
      kind,
      platform,
      leagueId,
      weekType,
      weekNumber: Number.isFinite(weekNumber) ? weekNumber : null,
      teamId: null,
      dataType,
    };
  }

  return { ...empty, platform, leagueId };
}

export function inspectPayload(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {
      keys: [] as string[],
      listCounts: {} as Record<string, number>,
      kindFromBody: MaddenExportKind.UNKNOWN,
      success: null as boolean | null,
      message: null as string | null,
    };
  }

  const record = payload as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  const listCounts: Record<string, number> = {};
  let kindFromBody: MaddenExportKind = MaddenExportKind.UNKNOWN;

  for (const hint of LIST_KEY_HINTS) {
    const value = record[hint.key];
    if (Array.isArray(value)) {
      listCounts[hint.key] = value.length;
      if (kindFromBody === MaddenExportKind.UNKNOWN) kindFromBody = hint.kind;
    }
  }

  for (const [key, value] of Object.entries(record)) {
    if (Array.isArray(value) && listCounts[key] == null) {
      listCounts[key] = value.length;
    }
  }

  const success = typeof record.success === "boolean" ? record.success : null;
  const message = typeof record.message === "string" ? record.message : null;

  return { keys, listCounts, kindFromBody, success, message };
}

export function resolveKind(
  pathKind: MaddenExportKind,
  bodyKind: MaddenExportKind,
  segments: string[]
) {
  if (pathKind !== MaddenExportKind.UNKNOWN) return pathKind;
  if (bodyKind === MaddenExportKind.TEAM_ROSTER && segments.includes("freeagents")) {
    return MaddenExportKind.FREE_AGENTS;
  }
  return bodyKind;
}
