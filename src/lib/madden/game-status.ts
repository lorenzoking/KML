import { SUPER_BOWL_WEEK } from "@/lib/league-week";

/**
 * Madden Companion `gameScheduleInfoList.status`.
 * The export has no separate force-win flag — CPU sims and in-game
 * force wins both land as SIMULATED after the week is advanced.
 */
export const MaddenScheduleStatus = {
  UNPLAYED: 1,
  PLAYED: 2,
  SIMULATED: 3,
} as const;

export type MaddenResultKind = "unplayed" | "played" | "simulated";

export function isMaddenPlayed(status: number) {
  return status === MaddenScheduleStatus.PLAYED;
}

export function isMaddenSimulated(status: number) {
  return status === MaddenScheduleStatus.SIMULATED;
}

export function isMaddenFinal(status: number) {
  return status >= MaddenScheduleStatus.PLAYED;
}

/**
 * Played vs CPU-sim from Companion data.
 * Status 2 is always a user game. Status 3 with a score is a leftover sim
 * only after that week is closed — while the current week still has unplayed
 * games, exported scores are treated as played.
 */
export function maddenResultKind(input: {
  status: number;
  homeScore: number;
  awayScore: number;
  week: number;
  currentWeek: number;
  currentWeekStillOpen: boolean;
}): MaddenResultKind {
  const hasScore = input.homeScore !== 0 || input.awayScore !== 0;
  if (!isMaddenFinal(input.status) && !hasScore) return "unplayed";
  if (isMaddenPlayed(input.status)) return "played";
  if (isMaddenSimulated(input.status)) {
    // Super Bowl sits on Madden weekIndex 22 after a Pro Bowl gap, so the
    // "current week still open" check looks at the empty week and would
    // otherwise treat a finished title game as a CPU sim.
    if (
      hasScore &&
      (input.week >= SUPER_BOWL_WEEK ||
        (input.week === input.currentWeek && input.currentWeekStillOpen))
    ) {
      return "played";
    }
    return hasScore ? "simulated" : "unplayed";
  }
  return hasScore ? "played" : "unplayed";
}
