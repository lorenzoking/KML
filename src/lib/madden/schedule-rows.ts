import { classifyCompanionPath } from "@/lib/madden/companion";
import { flag, num, str } from "@/lib/madden/parse";
import { siteWeekIndexFromCompanion } from "@/lib/league-week";

/** A regular-season week never has more than 16 games. More than that is All Weeks junk. */
export const MAX_GAMES_PER_WEEK = 16;

export type CompanionScheduleRow = {
  scheduleId: string;
  rawWeekIndex: number;
  weekIndex: number;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  status: number;
  isGameOfTheWeek: boolean;
};

export function pathWeekFromExportPath(path: string | null | undefined) {
  if (!path) return null;
  const info = classifyCompanionPath(path.split("/").filter(Boolean));
  if (info.weekNumber == null || info.weekNumber < 0) return null;
  return info.weekNumber;
}

function optionalInt(row: Record<string, unknown>, key: string) {
  if (!Object.prototype.hasOwnProperty.call(row, key)) return null;
  const value = row[key];
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(value);
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.round(parsed) : null;
  }
  return null;
}

function teamRef(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
    if (typeof value === "string" && value) return value;
  }
  return "";
}

function isPreseason(row: Record<string, unknown>, weekType: string | null) {
  const stage = optionalInt(row, "stageIndex");
  if (stage === 0) return true;
  return stage == null && weekType === "pre";
}

function mappingWeekType(
  row: Record<string, unknown>,
  rawWeekIndex: number,
  weekType: string | null
) {
  const stage = optionalInt(row, "stageIndex");
  if (rawWeekIndex >= 18) return weekType === "pre" ? "reg" : weekType;
  if (stage === 2 || stage === 3) return "post";
  if (weekType === "playoff" || weekType === "post") return weekType;
  return weekType;
}

/**
 * Companion "All Weeks" replays every franchise season and sometimes stamps
 * the entire schedule with the URL week. Week 4 also arrives in that same
 * schedules list. Keep the current season's real week, and drop dumps that
 * would paste every game onto one slate.
 */
export function selectCompanionScheduleRows(
  rows: Record<string, unknown>[],
  options: { weekType: string | null; pathWeek: number | null }
): CompanionScheduleRow[] {
  if (options.weekType === "pre") return [];
  const parsed: Array<CompanionScheduleRow & { seasonIndex: number | null }> = [];
  for (const row of rows) {
    if (isPreseason(row, options.weekType)) continue;
    const scheduleId = str(row, "scheduleId") || String(row.scheduleId ?? "");
    const homeTeamId = teamRef(row, ["homeTeamId", "homeTeamID"]);
    const awayTeamId = teamRef(row, ["awayTeamId", "awayTeamID"]);
    const rawWeekIndex = optionalInt(row, "weekIndex");
    if (!scheduleId || !homeTeamId || !awayTeamId || rawWeekIndex == null) continue;
    parsed.push({
      scheduleId,
      rawWeekIndex,
      weekIndex: siteWeekIndexFromCompanion(
        rawWeekIndex,
        mappingWeekType(row, rawWeekIndex, options.weekType)
      ),
      homeTeamId,
      awayTeamId,
      homeScore: Math.round(num(row, "homeScore")),
      awayScore: Math.round(num(row, "awayScore")),
      status: Math.round(num(row, "status")),
      isGameOfTheWeek: flag(row, "isGameOfTheWeek"),
      seasonIndex: optionalInt(row, "seasonIndex"),
    });
  }

  const tagged = parsed
    .map((row) => row.seasonIndex)
    .filter((season): season is number => season != null);
  const currentSeason = tagged.length > 0 ? Math.max(...tagged) : null;
  const current =
    currentSeason == null
      ? parsed
      : parsed.filter((row) => row.seasonIndex === currentSeason);

  const pathWeek =
    options.pathWeek != null && options.pathWeek >= 0 ? options.pathWeek : null;
  let chosen = current;
  if (pathWeek != null) {
    const matched = current.filter((row) => row.rawWeekIndex === pathWeek);
    if (matched.length > MAX_GAMES_PER_WEEK) return [];
    if (matched.length > 0) chosen = matched;
    else if (current.length > MAX_GAMES_PER_WEEK) return [];
  }

  const byWeek = new Map<number, CompanionScheduleRow[]>();
  for (const row of chosen) {
    const list = byWeek.get(row.rawWeekIndex) ?? [];
    list.push(row);
    byWeek.set(row.rawWeekIndex, list);
  }
  const kept: CompanionScheduleRow[] = [];
  for (const list of byWeek.values()) {
    if (list.length > MAX_GAMES_PER_WEEK) continue;
    kept.push(...list);
  }
  return kept;
}

export function pairKey(homeTeamId: string, awayTeamId: string) {
  return homeTeamId < awayTeamId
    ? `${homeTeamId}:${awayTeamId}`
    : `${awayTeamId}:${homeTeamId}`;
}

/** Earlier rows win. Pass newest matchups first. */
export function dedupeWeekMatchups<T extends { homeTeamId: string; awayTeamId: string }>(
  games: T[]
): T[] {
  const used = new Set<string>();
  const kept: T[] = [];
  for (const game of games) {
    if (!game.homeTeamId || !game.awayTeamId || game.homeTeamId === game.awayTeamId) {
      continue;
    }
    if (used.has(game.homeTeamId) || used.has(game.awayTeamId)) continue;
    used.add(game.homeTeamId);
    used.add(game.awayTeamId);
    kept.push(game);
  }
  return kept;
}

export function planCompanionWeek(params: {
  existing: Array<{
    id: string;
    homeTeamId: string;
    awayTeamId: string;
    isPrimetime: boolean;
  }>;
  incoming: Array<{ homeTeamId: string; awayTeamId: string; isPrimetime: boolean }>;
  livePairs: Array<{ homeTeamId: string; awayTeamId: string }>;
}): {
  deleteIds: string[];
  create: Array<{ homeTeamId: string; awayTeamId: string; isPrimetime: boolean }>;
} {
  const live = new Set(
    params.livePairs.map((pair) => pairKey(pair.homeTeamId, pair.awayTeamId))
  );
  const keepIds = new Set<string>();
  const lockedTeams = new Set<string>();
  for (const game of params.existing) {
    if (!live.has(pairKey(game.homeTeamId, game.awayTeamId))) continue;
    keepIds.add(game.id);
    lockedTeams.add(game.homeTeamId);
    lockedTeams.add(game.awayTeamId);
  }

  const create: Array<{ homeTeamId: string; awayTeamId: string; isPrimetime: boolean }> =
    [];
  const taken = new Set(lockedTeams);
  for (const game of dedupeWeekMatchups(params.incoming)) {
    if (taken.has(game.homeTeamId) || taken.has(game.awayTeamId)) continue;
    const existing = params.existing.find(
      (row) => row.homeTeamId === game.homeTeamId && row.awayTeamId === game.awayTeamId
    );
    taken.add(game.homeTeamId);
    taken.add(game.awayTeamId);
    if (existing && existing.isPrimetime === game.isPrimetime) {
      keepIds.add(existing.id);
      continue;
    }
    create.push({
      homeTeamId: game.homeTeamId,
      awayTeamId: game.awayTeamId,
      isPrimetime: game.isPrimetime,
    });
  }

  return {
    deleteIds: params.existing.filter((game) => !keepIds.has(game.id)).map((game) => game.id),
    create,
  };
}
