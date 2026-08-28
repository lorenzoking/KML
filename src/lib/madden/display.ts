export function formatRecord(wins: number, losses: number, ties: number) {
  return ties > 0 ? `${wins}-${losses}-${ties}` : `${wins}-${losses}`;
}

export function playerName(player: { firstName: string; lastName: string }) {
  return `${player.firstName} ${player.lastName}`.trim();
}

export function displayWeek(weekIndex: number) {
  return weekIndex + 1;
}

export function devTraitLabel(value: number) {
  if (value >= 3) return "X-Factor";
  if (value === 2) return "Superstar";
  if (value === 1) return "Star";
  return "";
}

export function formatHeight(inches: number) {
  if (!inches) return "—";
  const feet = Math.floor(inches / 12);
  return `${feet}'${inches % 12}"`;
}

export function formatSalary(value: number) {
  if (!value) return "—";
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${value}`;
}

const OFFENSE = new Set(["QB", "HB", "FB", "WR", "TE", "LT", "LG", "C", "RG", "RT"]);
const DEFENSE = new Set([
  "LE",
  "RE",
  "LEDG",
  "REDG",
  "DT",
  "LOLB",
  "MLB",
  "ROLB",
  "WILL",
  "MIKE",
  "SAM",
  "CB",
  "FS",
  "SS",
  "DB",
]);
const SPECIAL = new Set(["K", "P", "LS"]);

export function positionGroup(position: string) {
  const pos = position.toUpperCase();
  if (OFFENSE.has(pos)) return "Offense";
  if (DEFENSE.has(pos)) return "Defense";
  if (SPECIAL.has(pos)) return "Special teams";
  return "Other";
}

export const POSITION_GROUP_ORDER = ["Offense", "Defense", "Special teams", "Other"];

export function isQuarterback(position: string) {
  return position.toUpperCase() === "QB";
}

export function isRookie(yearsPro: number, position: string) {
  return yearsPro === 0 && position.toUpperCase() !== "UNK";
}

export function formatStat(value: number, digits = 0) {
  return value.toLocaleString("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

export function formatSacks(value: number) {
  return formatStat(value, Number.isInteger(value) ? 0 : 1);
}

export function isLightHex(color: string) {
  const hex = color.replace("#", "");
  if (hex.length < 6) return false;
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 160;
}

export function racePhaseLabel(week: number) {
  if (week <= 6) return "Early";
  if (week <= 12) return "Midseason";
  return "Stretch-run";
}
