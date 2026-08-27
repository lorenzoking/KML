const LEAGUE_TIME_ZONE = "America/New_York";

export type LeagueDatePattern =
  | "MMM d"
  | "MMM d, yyyy"
  | "MMMM d, yyyy"
  | "h:mm:ss a"
  | "MMM d, h:mm a"
  | "MMM d, h:mm:ss a"
  | "MMM d, yyyy · h:mm a"
  | "MMM d, yyyy h:mm:ss a";

function toDate(value: Date | string | number) {
  return value instanceof Date ? value : new Date(value);
}

function formatInLeagueZone(
  date: Date,
  options: Intl.DateTimeFormatOptions
) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: LEAGUE_TIME_ZONE,
    ...options,
  }).format(date);
}

/** Display timestamps in Eastern Time (EST/EDT), not the Vercel UTC clock. */
export function formatLeagueDate(
  value: Date | string | number,
  pattern: LeagueDatePattern
) {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return "";

  const dateParts: Intl.DateTimeFormatOptions = {
    month: pattern.startsWith("MMMM") ? "long" : "short",
    day: "numeric",
  };
  const dateYear: Intl.DateTimeFormatOptions = pattern.includes("yyyy")
    ? { ...dateParts, year: "numeric" }
    : dateParts;
  const timeParts: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };
  const timeSeconds: Intl.DateTimeFormatOptions = {
    ...timeParts,
    second: "2-digit",
  };

  switch (pattern) {
    case "MMM d":
    case "MMM d, yyyy":
    case "MMMM d, yyyy":
      return formatInLeagueZone(date, dateYear);
    case "h:mm:ss a":
      return `${formatInLeagueZone(date, timeSeconds)} ET`;
    case "MMM d, h:mm a":
      return `${formatInLeagueZone(date, {
        ...dateParts,
        ...timeParts,
      })} ET`;
    case "MMM d, h:mm:ss a":
      return `${formatInLeagueZone(date, {
        ...dateParts,
        ...timeSeconds,
      })} ET`;
    case "MMM d, yyyy · h:mm a":
      return `${formatInLeagueZone(date, dateYear)} · ${formatInLeagueZone(date, timeParts)} ET`;
    case "MMM d, yyyy h:mm:ss a":
      return `${formatInLeagueZone(date, {
        ...dateYear,
        ...timeSeconds,
      })} ET`;
  }
}
