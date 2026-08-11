export type ReputationLabel = "Elite" | "Stable" | "Pressured" | "Hot Seat";

export type GmReputationStatus = "High" | "Neutral" | "Low";

export function getReputationLabel(score: number): ReputationLabel {
  if (score >= 85) return "Elite";
  if (score >= 70) return "Stable";
  if (score >= 55) return "Pressured";
  return "Hot Seat";
}

export function getGmReputationStatus(score: number): GmReputationStatus {
  if (score >= 80) return "High";
  if (score >= 65) return "Neutral";
  return "Low";
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

export function gmReputationBadgeVariant(
  status: GmReputationStatus
): "elite" | "stable" | "hotseat" {
  switch (status) {
    case "High":
      return "elite";
    case "Neutral":
      return "stable";
    case "Low":
      return "hotseat";
  }
}

export function computeReputationScore(
  startingScore: number,
  adjustments: { amount: number }[]
) {
  return startingScore + adjustments.reduce((sum, a) => sum + a.amount, 0);
}

/** GM score uses the same additive ledger, but reads gmAmount. */
export function computeGmReputationScore(
  startingScore: number,
  adjustments: { gmAmount: number }[]
) {
  return startingScore + adjustments.reduce((sum, a) => sum + a.gmAmount, 0);
}
