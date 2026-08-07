import { HotSeatStatus } from "@prisma/client";

type BuyoutInput = {
  coachRepScore: number;
  availableXp: number;
  contractYearsLeft: number;
  minCoachRepScore: number;
  baseCost: number;
  status: HotSeatStatus;
};

export function getBuyoutCost(input: BuyoutInput) {
  return Math.max(input.baseCost, 0);
}

export function getBuyoutEligibility(input: BuyoutInput) {
  const cost = getBuyoutCost(input);
  const disallowedStatus =
    input.status === HotSeatStatus.HOT_SEAT ||
    input.status === HotSeatStatus.FIRING_ELIGIBLE;
  const eligible =
    input.coachRepScore >= input.minCoachRepScore &&
    input.availableXp >= cost &&
    !disallowedStatus;

  return {
    eligible,
    cost,
    reason: eligible
      ? "Eligible"
      : disallowedStatus
        ? "Coach is not in good standing for buyout."
        : input.coachRepScore < input.minCoachRepScore
          ? "Coach reputation is below buyout requirement."
          : "Not enough XP for buyout.",
  };
}
