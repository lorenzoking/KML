export const APP_NAME = "Kings Madden League";
export const APP_SHORT = "KML";

/** Cookie set when a commissioner previews the app as a regular coach. */
export const VIEW_AS_USER_COOKIE = "kml_view_as_user";

export const PROTECTED_PREFIXES = [
  "/dashboard",
  "/admin",
  "/coach",
  "/request-team",
] as const;

export const COMMISSIONER_PREFIXES = ["/admin"] as const;

export const GAME_TYPE_LABELS: Record<string, string> = {
  REGULAR_SEASON: "Regular Season",
  PLAYOFF: "Playoff",
  SUPER_BOWL: "Super Bowl",
  PRESEASON: "Preseason",
  SIMULATED: "Simulated",
  OTHER: "Other",
};

export const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  VOIDED: "Voided",
};

export const FORCE_WIN_REASONS = [
  "GAME_CUT_OUT",
  "OPPONENT_UNAVAILABLE",
] as const;

export type ForceWinReasonCode = (typeof FORCE_WIN_REASONS)[number];

export const FORCE_WIN_REASON_LABELS: Record<ForceWinReasonCode, string> = {
  GAME_CUT_OUT: "The game cut out",
  OPPONENT_UNAVAILABLE: "Opponent said they can’t play",
};

export const FORCE_WIN_REASON_XP_HINTS: Record<ForceWinReasonCode, string> = {
  GAME_CUT_OUT: "Both coaches get game-played XP after approval. No win bonus.",
  OPPONENT_UNAVAILABLE:
    "Only you get game-played XP after approval. The opponent does not. No win bonus.",
};

export function forceWinReasonLabel(reason: string | null | undefined) {
  if (reason === "GAME_CUT_OUT" || reason === "OPPONENT_UNAVAILABLE") {
    return FORCE_WIN_REASON_LABELS[reason];
  }
  return null;
}

export function forceWinXpBlurb(
  reason: ForceWinReasonCode | string | null | undefined,
  userAbbr?: string,
  oppAbbr?: string
) {
  if (reason === "GAME_CUT_OUT") {
    return userAbbr && oppAbbr
      ? `Game cut out. Both ${userAbbr} and ${oppAbbr} get game-played XP.`
      : "Game cut out. Both coaches get game-played XP.";
  }
  return userAbbr
    ? `Opponent could not play. Only ${userAbbr} gets game-played XP.`
    : "Opponent could not play. Only the available coach gets game-played XP.";
}
