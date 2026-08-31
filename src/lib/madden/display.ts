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

export function isRunningBack(position: string) {
  const pos = position.toUpperCase();
  return pos === "HB" || pos === "FB" || pos === "RB";
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

export type PlayerStatSums = {
  passYds: number;
  passTDs: number;
  passInts: number;
  passAtt: number;
  passComp: number;
  rushYds: number;
  rushTDs: number;
  rushAtt: number;
  recYds: number;
  recTDs: number;
  recCatches: number;
  defSacks: number;
  defInts: number;
  defTackles: number;
  kickPts: number;
  games: number;
};

export function emptyStatSums(): PlayerStatSums {
  return {
    passYds: 0,
    passTDs: 0,
    passInts: 0,
    passAtt: 0,
    passComp: 0,
    rushYds: 0,
    rushTDs: 0,
    rushAtt: 0,
    recYds: 0,
    recTDs: 0,
    recCatches: 0,
    defSacks: 0,
    defInts: 0,
    defTackles: 0,
    kickPts: 0,
    games: 0,
  };
}

export function sumPlayerStats(
  rows: Array<{
    weekIndex: number;
    passYds: number;
    passTDs: number;
    passInts: number;
    passAtt: number;
    passComp: number;
    rushYds: number;
    rushTDs: number;
    rushAtt: number;
    recYds: number;
    recTDs: number;
    recCatches: number;
    defSacks: number;
    defInts: number;
    defTackles: number;
    kickPts: number;
  }>
): PlayerStatSums {
  const sums = emptyStatSums();
  const weeks = new Set<number>();
  for (const row of rows) {
    weeks.add(row.weekIndex);
    sums.passYds += row.passYds;
    sums.passTDs += row.passTDs;
    sums.passInts += row.passInts;
    sums.passAtt += row.passAtt;
    sums.passComp += row.passComp;
    sums.rushYds += row.rushYds;
    sums.rushTDs += row.rushTDs;
    sums.rushAtt += row.rushAtt;
    sums.recYds += row.recYds;
    sums.recTDs += row.recTDs;
    sums.recCatches += row.recCatches;
    sums.defSacks += row.defSacks;
    sums.defInts += row.defInts;
    sums.defTackles += row.defTackles;
    sums.kickPts += row.kickPts;
  }
  sums.games = weeks.size;
  return sums;
}

export function rosterSeasonLine(position: string, stats: PlayerStatSums) {
  const pos = position.toUpperCase();
  const group = positionGroup(pos);
  const parts: string[] = [];

  if (pos === "QB") {
    if (stats.passAtt > 0) {
      parts.push(`${stats.passComp}/${stats.passAtt}`);
      parts.push(`${formatStat(stats.passYds)} yds`);
      parts.push(`${stats.passTDs} TD`);
      parts.push(`${stats.passInts} INT`);
    }
    if (stats.rushYds >= 40) parts.push(`${formatStat(stats.rushYds)} rush`);
  } else if (pos === "HB" || pos === "FB") {
    if (stats.rushYds > 0 || stats.rushTDs > 0) {
      parts.push(`${formatStat(stats.rushYds)} rush`);
      parts.push(`${stats.rushTDs} TD`);
    }
    if (stats.recCatches > 0) {
      parts.push(`${stats.recCatches} rec`);
      if (stats.recYds >= 40) parts.push(`${formatStat(stats.recYds)} yds`);
    }
  } else if (pos === "WR" || pos === "TE") {
    if (stats.recCatches > 0 || stats.recYds > 0) {
      parts.push(`${stats.recCatches} rec`);
      parts.push(`${formatStat(stats.recYds)} yds`);
      parts.push(`${stats.recTDs} TD`);
    }
    if (stats.rushYds >= 40) parts.push(`${formatStat(stats.rushYds)} rush`);
  } else if (group === "Defense") {
    if (stats.defSacks > 0 || stats.defInts > 0 || stats.defTackles > 0) {
      parts.push(`${formatSacks(stats.defSacks)} sacks`);
      parts.push(`${stats.defInts} INT`);
      parts.push(`${formatStat(stats.defTackles)} tkl`);
    }
  } else if (pos === "K" || pos === "P") {
    if (stats.kickPts > 0) parts.push(`${stats.kickPts} pts`);
  } else {
    if (stats.passAtt > 0) parts.push(`${formatStat(stats.passYds)} pass`);
    if (stats.rushYds > 0) parts.push(`${formatStat(stats.rushYds)} rush`);
    if (stats.recCatches > 0) parts.push(`${stats.recCatches} rec`);
    if (stats.defSacks > 0 || stats.defInts > 0) {
      parts.push(`${formatSacks(stats.defSacks)} sacks`);
    }
    if (stats.kickPts > 0) parts.push(`${stats.kickPts} pts`);
  }

  return parts.length > 0 ? parts.join(" · ") : "—";
}
