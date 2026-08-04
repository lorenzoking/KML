export const APP_NAME = "Kings Madden League";
export const APP_SHORT = "KML";

export const PROTECTED_PREFIXES = [
  "/dashboard",
  "/submissions",
  "/admin",
] as const;

export const COMMISSIONER_PREFIXES = ["/admin"] as const;

export const GAME_TYPE_LABELS: Record<string, string> = {
  REGULAR_SEASON: "Regular Season",
  PLAYOFF: "Playoff",
  SUPER_BOWL: "Super Bowl",
  PRESEASON: "Preseason",
  OTHER: "Other",
};

export const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};
