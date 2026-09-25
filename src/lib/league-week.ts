import { GameType } from "@/generated/prisma/client";
import { NFL_REGULAR_SEASON_WEEKS } from "@/lib/nfl-schedule-2026";

export { NFL_REGULAR_SEASON_WEEKS };

export const PLAYOFF_START_WEEK = 19;
export const SUPER_BOWL_WEEK = 22;

export const PLAYOFF_ROUNDS = [
  { week: 19, id: "wildcard", label: "Wild Card", short: "WC" },
  { week: 20, id: "divisional", label: "Divisional", short: "DIV" },
  { week: 21, id: "conference", label: "Conference", short: "CONF" },
  { week: 22, id: "superbowl", label: "Super Bowl", short: "SB" },
] as const;

export type PlayoffRoundId = (typeof PLAYOFF_ROUNDS)[number]["id"];

export function isPlayoffWeek(week: number) {
  return week >= PLAYOFF_START_WEEK && week <= SUPER_BOWL_WEEK;
}

export function playoffRound(week: number) {
  return PLAYOFF_ROUNDS.find((round) => round.week === week) ?? null;
}

/** Regular season stays "Week 12". Playoffs use the round name, never Week 19+. */
export function displayLeagueWeek(week: number) {
  return playoffRound(week)?.label ?? `Week ${week}`;
}

export function weekChip(week: number) {
  return playoffRound(week)?.short ?? `W${week}`;
}

export function nextLeagueWeek(week: number) {
  if (week < SUPER_BOWL_WEEK) return week + 1;
  return null;
}

export function advanceWeekLabel(week: number) {
  const next = nextLeagueWeek(week);
  if (!next) return null;
  if (week === NFL_REGULAR_SEASON_WEEKS) return "Open the playoffs";
  return `Advance to ${displayLeagueWeek(next)}`;
}

export function gameTypeForLeagueWeek(week: number) {
  if (week === SUPER_BOWL_WEEK) return GameType.SUPER_BOWL;
  if (isPlayoffWeek(week)) return GameType.PLAYOFF;
  return GameType.REGULAR_SEASON;
}

/**
 * Madden playoff dumps use weekIndex 0–3 (Wild Card through Super Bowl).
 * Offset them so site week stays weekIndex + 1 (19–22).
 */
export function siteWeekIndexFromCompanion(
  rawWeekIndex: number,
  weekType?: string | null
) {
  if (weekType === "playoff" || weekType === "post") {
    return NFL_REGULAR_SEASON_WEEKS + rawWeekIndex;
  }
  return rawWeekIndex;
}
