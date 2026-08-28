export function sumXp(adjustments: { amount: number }[]) {
  return adjustments.reduce((sum, a) => sum + a.amount, 0);
}

export function awardsCoachXp(gameType: string, skipXp = false) {
  // Simulated (CPU) results count for standings only — never coach XP.
  // Commissioner-filed results skip XP unless the desk opts in.
  if (skipXp) return false;
  return gameType !== "SIMULATED";
}

export type ForceWinReasonValue = "GAME_CUT_OUT" | "OPPONENT_UNAVAILABLE";

/** Cut-outs still count as both coaches showing up. No-shows do not. */
export function forceWinAwardsOpponentXp(
  reason: ForceWinReasonValue | null | undefined
) {
  return reason === "GAME_CUT_OUT";
}

export function forceWinPlayedXpReason(
  reason: ForceWinReasonValue | null | undefined
) {
  return reason === "GAME_CUT_OUT"
    ? "Force win — game cut out"
    : "Force win — available to play";
}

/** Companion CPU-sim with no force-win ticket on the site. */
export const MADDEN_UNDECLARED_FORCE_WIN_MARKER =
  "force win — madden sim, no site claim";

export function maddenUndeclaredForceWinXpReason(
  week: number,
  scheduleId: string
) {
  return `Week ${week} force win — Madden sim, no site claim [${scheduleId}]`;
}

export function isMaddenUndeclaredForceWinXpReason(
  reason: string,
  week?: number
) {
  const normalized = reason.toLowerCase();
  if (week != null) {
    return normalized.startsWith(
      `week ${week} ${MADDEN_UNDECLARED_FORCE_WIN_MARKER}`
    );
  }
  return normalized.includes(MADDEN_UNDECLARED_FORCE_WIN_MARKER);
}

export function xpFromApprovedGame(params: {
  xpGamePlayed: number;
  xpWinBonus: number;
  won: boolean;
  gameType?: string;
  isForceWin?: boolean;
  forceWinReason?: ForceWinReasonValue | null;
}) {
  if (params.gameType && !awardsCoachXp(params.gameType)) {
    return [];
  }

  // Force wins are CPU sims. Game-played XP still applies; the simulated
  // score does not award a win bonus. A cut-out awards that play XP to both
  // coaches. An opponent no-show awards it only to the available coach.
  if (params.isForceWin) {
    return [
      {
        amount: params.xpGamePlayed,
        reason: forceWinPlayedXpReason(params.forceWinReason),
      },
    ];
  }

  const entries: { amount: number; reason: string }[] = [
    { amount: params.xpGamePlayed, reason: "Game played" },
  ];
  if (params.won) {
    entries.push({ amount: params.xpWinBonus, reason: "Win bonus" });
  }
  return entries;
}
