export function sumXp(adjustments: { amount: number }[]) {
  return adjustments.reduce((sum, a) => sum + a.amount, 0);
}

export function awardsCoachXp(gameType: string, skipXp = false) {
  // Simulated (CPU) results count for standings only — never coach XP.
  // Commissioner-filed results still count for standings/reputation, but not XP.
  if (skipXp) return false;
  return gameType !== "SIMULATED";
}

export function xpFromApprovedGame(params: {
  xpGamePlayed: number;
  xpWinBonus: number;
  won: boolean;
  gameType?: string;
}) {
  if (params.gameType && !awardsCoachXp(params.gameType)) {
    return [];
  }

  const entries: { amount: number; reason: string }[] = [
    { amount: params.xpGamePlayed, reason: "Game played" },
  ];
  if (params.won) {
    entries.push({ amount: params.xpWinBonus, reason: "Win bonus" });
  }
  return entries;
}
