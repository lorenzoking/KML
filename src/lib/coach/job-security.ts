import { HotSeatStatus } from "@/generated/prisma/client";

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

export type JobStatusBadgeVariant =
  | "elite"
  | "stable"
  | "pressured"
  | "hotseat"
  | "outline";

/** Used when ownership has not set a formal expectation yet. */
export const NEUTRAL_EXPECTATION_SCORE = 75;

export const JOB_STATUS_BANDS = [
  {
    status: HotSeatStatus.SECURE,
    label: "Secure",
    short: "Secure",
    description: "Strong standing. Maintain the standard.",
    pulseOrder: 0,
    severity: 5,
  },
  {
    status: HotSeatStatus.STABLE,
    label: "Stable",
    short: "Stable",
    description: "On track. Keep meeting the standard.",
    pulseOrder: 1,
    severity: 4,
  },
  {
    status: HotSeatStatus.WATCH,
    label: "Watch",
    short: "Watch",
    description: "Being monitored. Not in immediate danger.",
    pulseOrder: 2,
    severity: 3,
  },
  {
    status: HotSeatStatus.PRESSURED,
    label: "Pressured",
    short: "Pressured",
    description: "Results and conduct need to turn quickly.",
    pulseOrder: 3,
    severity: 2,
  },
  {
    status: HotSeatStatus.HOT_SEAT,
    label: "Hot Seat",
    short: "Hot Seat",
    description: "Job is officially in danger this season.",
    pulseOrder: 4,
    severity: 1,
  },
  {
    status: HotSeatStatus.FIRING_ELIGIBLE,
    label: "Firing eligible",
    short: "Firing",
    description: "At the firing line. Commissioner action is likely.",
    pulseOrder: 5,
    severity: 0,
  },
] as const;

export const JOB_STATUS_PULSE_ORDER = [...JOB_STATUS_BANDS].sort(
  (a, b) => a.pulseOrder - b.pulseOrder
);

export const JOB_STATUS_SEVERITY_ORDER = [...JOB_STATUS_BANDS].sort(
  (a, b) => a.severity - b.severity
);

export const AT_RISK_JOB_STATUSES = new Set<HotSeatStatus>([
  HotSeatStatus.WATCH,
  HotSeatStatus.PRESSURED,
  HotSeatStatus.HOT_SEAT,
  HotSeatStatus.FIRING_ELIGIBLE,
]);

export function isExpectationUnset(score: number | null | undefined): boolean {
  return score == null || score <= 0;
}

export function effectiveExpectationScore(score: number | null | undefined): number {
  if (score == null || score <= 0) return NEUTRAL_EXPECTATION_SCORE;
  return score;
}

export function getJobStatusBand(status: string) {
  return JOB_STATUS_BANDS.find((band) => band.status === status);
}

export function formatJobStatus(status: string): string {
  return getJobStatusBand(status)?.label ?? status.replaceAll("_", " ");
}

export function jobStatusBadgeVariant(status: string): JobStatusBadgeVariant {
  switch (status) {
    case HotSeatStatus.SECURE:
      return "elite";
    case HotSeatStatus.STABLE:
      return "stable";
    case HotSeatStatus.WATCH:
    case HotSeatStatus.PRESSURED:
      return "pressured";
    case HotSeatStatus.HOT_SEAT:
    case HotSeatStatus.FIRING_ELIGIBLE:
      return "hotseat";
    default:
      return "outline";
  }
}

export function compareJobSeverity(a: string, b: string): number {
  const left = getJobStatusBand(a)?.severity ?? 99;
  const right = getJobStatusBand(b)?.severity ?? 99;
  return left - right;
}

export function getJobSecurityScore(input: JobSecurityInput): number {
  const strikePenalty = input.tankingStrikes * 8 + input.gmStrikes * 6;
  return (
    input.coachRepScore * 0.45 +
    input.gmRepScore * 0.35 +
    effectiveExpectationScore(input.expectationScore) * 0.2 -
    strikePenalty
  );
}

export function getJobSecurityStatus(input: JobSecurityInput): HotSeatStatus {
  if (input.override) return input.override;

  const base = getJobSecurityScore(input);

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
      return "Needs a positive trend over the next few weeks.";
    case HotSeatStatus.PRESSURED:
      return "Results and conduct need to turn quickly.";
    case HotSeatStatus.HOT_SEAT:
      return "High risk. Recovery is required this season.";
    case HotSeatStatus.FIRING_ELIGIBLE:
      return "At the firing threshold. Commissioner action is likely.";
  }
}
