export const APP_NAME = "Kings Madden League";
export const APP_SHORT = "KML";

/** Cookie set when a commissioner previews the app as a regular coach. */
export const VIEW_AS_USER_COOKIE = "kml_view_as_user";

export const PROTECTED_PREFIXES = [
  "/dashboard",
  "/admin",
  "/coach",
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
