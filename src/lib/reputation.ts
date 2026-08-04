export type ReputationLabel = "Elite" | "Stable" | "Pressured" | "Hot Seat";

export function getReputationLabel(score: number): ReputationLabel {
  if (score >= 85) return "Elite";
  if (score >= 70) return "Stable";
  if (score >= 55) return "Pressured";
  return "Hot Seat";
}

export function reputationBadgeVariant(
  label: ReputationLabel
): "elite" | "stable" | "pressured" | "hotseat" {
  switch (label) {
    case "Elite":
      return "elite";
    case "Stable":
      return "stable";
    case "Pressured":
      return "pressured";
    case "Hot Seat":
      return "hotseat";
  }
}

export function computeReputationScore(
  startingScore: number,
  adjustments: { amount: number }[]
) {
  return startingScore + adjustments.reduce((sum, a) => sum + a.amount, 0);
}
