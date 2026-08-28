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

export function isMaddenPlayed(status: number) {
  return status === MaddenScheduleStatus.PLAYED;
}

export function isMaddenSimulated(status: number) {
  return status === MaddenScheduleStatus.SIMULATED;
}

export function isMaddenFinal(status: number) {
  return status >= MaddenScheduleStatus.PLAYED;
}
