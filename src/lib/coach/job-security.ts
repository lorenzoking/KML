import { HotSeatStatus } from "@prisma/client";

export type JobSecurityInput = {
  coachRepScore: number;
  gmRepScore: number;
  expectationScore: number;
  tankingStrikes: number;
  gmStrikes: number;
  hotSeatThreshold: number;
  firingThreshold: number;
  watchThreshold: number;
  override?: HotSeatStatus | null;
};

export function getJobSecurityStatus(input: JobSecurityInput): HotSeatStatus {
  if (input.override) return input.override;

  const strikePenalty = input.tankingStrikes * 8 + input.gmStrikes * 6;
  const base =
    input.coachRepScore * 0.45 +
    input.gmRepScore * 0.35 +
    input.expectationScore * 0.2 -
    strikePenalty;

  if (base <= input.firingThreshold) return HotSeatStatus.FIRING_ELIGIBLE;
  if (base <= input.hotSeatThreshold) return HotSeatStatus.HOT_SEAT;
  if (base <= Math.max(input.hotSeatThreshold + 8, input.firingThreshold + 10))
    return HotSeatStatus.PRESSURED;
  if (base <= input.watchThreshold) return HotSeatStatus.WATCH;
  if (base <= input.watchThreshold + 10) return HotSeatStatus.STABLE;
  return HotSeatStatus.SECURE;
}

export function getRecoveryNote(status: HotSeatStatus): string {
  switch (status) {
    case HotSeatStatus.SECURE:
      return "Maintain current standards.";
    case HotSeatStatus.STABLE:
      return "Hold course and avoid strike events.";
    case HotSeatStatus.WATCH:
      return "Needs positive review trend in next few weeks.";
    case HotSeatStatus.PRESSURED:
      return "Urgent: improve results and conduct quickly.";
    case HotSeatStatus.HOT_SEAT:
      return "High risk. Recovery required this season.";
    case HotSeatStatus.FIRING_ELIGIBLE:
      return "At firing threshold. Commissioner action likely.";
  }
}
