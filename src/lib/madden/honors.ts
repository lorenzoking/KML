import { StoryCategory } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  formatSacks,
  isQuarterback,
  isRunningBack,
} from "@/lib/madden/display";
import { canonAbbr } from "@/lib/madden/franchises";
import { isMaddenFinal } from "@/lib/madden/game-status";
import { getWeekGames, getWeekPlayerTotals, type WeekPlayerTotal } from "@/lib/madden/query";
import { nflGamesInWeek } from "@/lib/nfl-schedule-2026";

export type HonorsPlayer = {
  rosterId: string;
  fullName: string;
  shortName: string;
  lastName: string;
  position: string;
  teamAbbr: string;
  coachName: string | null;
  category: "PASSING" | "RUSHING" | "RECEIVING" | "DEFENSE";
  line: string;
  passYds: number;
  passTDs: number;
  passInts: number;
  passAtt: number;
  passComp: number;
  passerRating: number;
  rushYds: number;
  rushTDs: number;
  rushAtt: number;
  recYds: number;
  recTDs: number;
  recCatches: number;
  defSacks: number;
  defInts: number;
  defTackles: number;
};

export type HonorsBoard = {
  week: number;
  weekIndex: number;
  finalCount: number;
  expected: number;
  stamp: string;
  opoy: HonorsPlayer | null;
  dpoy: HonorsPlayer | null;
  rec: HonorsPlayer | null;
  passing: HonorsPlayer[];
  rushing: HonorsPlayer[];
  receiving: HonorsPlayer[];
  defense: HonorsPlayer[];
};

export function autoHonorsSlug(week: number) {
  return `madden-week-${week}-stat-honors`;
}

export function isAutoHonorsSlug(slug: string) {
  return /^madden-week-\d+-stat-honors$/.test(slug);
}

export function honorsOgPath(week: number, stamp?: string) {
  const path = `/api/honors/${week}/og`;
  return stamp ? `${path}?v=${encodeURIComponent(stamp)}` : path;
}

function scrimmageYards(row: WeekPlayerTotal) {
  return row.rushYds + row.recYds;
}

function scrimmageTDs(row: WeekPlayerTotal) {
  return row.rushTDs + row.recTDs;
}

/** Same weights as the League award races — rush, rec, and pass all count. */
function offensiveValue(row: WeekPlayerTotal) {
  return (
    row.passYds / 25 +
    row.passTDs * 4 -
    row.passInts * 2 +
    row.rushYds / 10 +
    row.rushTDs * 6 +
    row.recYds / 10 +
    row.recTDs * 6 +
    row.recCatches * 0.4
  );
}

function skillValue(row: WeekPlayerTotal) {
  return (
    row.rushYds / 10 +
    row.rushTDs * 6 +
    row.recYds / 10 +
    row.recTDs * 6 +
    row.recCatches * 0.5
  );
}

function defensiveValue(row: WeekPlayerTotal) {
  return row.defSacks * 12 + row.defInts * 12 + row.defTackles * 0.4;
}

function rushBoardValue(row: WeekPlayerTotal) {
  if (isRunningBack(row.position)) {
    return scrimmageYards(row) + scrimmageTDs(row) * 20;
  }
  return row.rushYds + row.rushTDs * 20;
}

function sortBy<T>(rows: T[], value: (row: T) => number) {
  return [...rows].sort((a, b) => value(b) - value(a));
}

function passingLine(row: WeekPlayerTotal) {
  const pass = `${row.passYds} yds, ${row.passTDs} TD`;
  return row.rushYds >= 20 ? `${pass} · ${row.rushYds} rush` : pass;
}

function rushingLine(row: WeekPlayerTotal) {
  if (row.recCatches > 0 || row.recYds > 0) {
    return `${row.rushYds} rush, ${row.recCatches} for ${row.recYds} · ${scrimmageYards(row)} yds, ${scrimmageTDs(row)} TD`;
  }
  return `${row.rushYds} yds, ${row.rushTDs} TD`;
}

function receivingLine(row: WeekPlayerTotal) {
  const rec = `${row.recCatches} for ${row.recYds}, ${row.recTDs} TD`;
  return row.rushYds >= 15 ? `${rec} · ${row.rushYds} rush` : rec;
}

function defenseLine(row: WeekPlayerTotal) {
  return `${formatSacks(row.defSacks)} sacks, ${row.defInts} INT, ${row.defTackles} tkl`;
}

function stampCategory(row: WeekPlayerTotal): HonorsPlayer["category"] {
  if (isQuarterback(row.position) || row.passYds >= row.rushYds + row.recYds) {
    return "PASSING";
  }
  if (isRunningBack(row.position) || row.rushYds >= row.recYds) {
    return "RUSHING";
  }
  return "RECEIVING";
}

function stampLine(row: WeekPlayerTotal, category: HonorsPlayer["category"]) {
  if (category === "PASSING") return passingLine(row);
  if (category === "RUSHING") return rushingLine(row);
  if (category === "RECEIVING") return receivingLine(row);
  return defenseLine(row);
}

function toPlayer(
  row: WeekPlayerTotal,
  category: HonorsPlayer["category"]
): HonorsPlayer {
  return {
    rosterId: row.rosterId,
    fullName: row.fullName,
    shortName: row.fullName,
    lastName: row.lastName || row.fullName.split(" ").at(-1) || row.fullName,
    position: row.position,
    teamAbbr: canonAbbr(row.teamAbbr),
    coachName: row.coachName,
    category,
    line: stampLine(row, category),
    passYds: row.passYds,
    passTDs: row.passTDs,
    passInts: row.passInts,
    passAtt: row.passAtt,
    passComp: row.passComp,
    passerRating: row.passerRating,
    rushYds: row.rushYds,
    rushTDs: row.rushTDs,
    rushAtt: row.rushAtt,
    recYds: row.recYds,
    recTDs: row.recTDs,
    recCatches: row.recCatches,
    defSacks: row.defSacks,
    defInts: row.defInts,
    defTackles: row.defTackles,
  };
}

export function honorsNamedPlayers(board: HonorsBoard): HonorsPlayer[] {
  const seen = new Set<string>();
  const named: HonorsPlayer[] = [];
  for (const player of [
    board.opoy,
    board.dpoy,
    board.rec,
    ...board.passing,
    ...board.rushing,
    ...board.receiving,
    ...board.defense,
  ]) {
    if (!player || seen.has(player.rosterId)) continue;
    seen.add(player.rosterId);
    named.push(player);
  }
  return named;
}

export function honorsMentionsForAbbr(board: HonorsBoard, abbr: string) {
  const canon = canonAbbr(abbr);
  return honorsNamedPlayers(board).filter((player) => player.teamAbbr === canon);
}

export async function buildHonorsBoard(weekIndex: number): Promise<HonorsBoard> {
  const week = weekIndex + 1;
  const [games, totals] = await Promise.all([
    getWeekGames(weekIndex),
    getWeekPlayerTotals(weekIndex),
  ]);

  const passers = sortBy(
    totals.filter((row) => row.passAtt > 0),
    (row) => row.passYds + row.passTDs * 20
  );
  const rushers = sortBy(
    totals.filter(
      (row) =>
        row.rushYds > 0 ||
        (isRunningBack(row.position) && (row.recYds > 0 || row.recCatches > 0))
    ),
    rushBoardValue
  );
  const receivers = sortBy(
    totals.filter((row) => row.recCatches > 0 || row.recYds > 0),
    (row) => row.recYds + row.recTDs * 20
  );
  const defenders = sortBy(
    totals.filter((row) => row.defSacks > 0 || row.defInts > 0 || row.defTackles > 0),
    defensiveValue
  );
  const offense = sortBy(
    totals.filter(
      (row) =>
        row.passYds > 0 || row.rushYds > 0 || row.recYds > 0 || row.recCatches > 0
    ),
    offensiveValue
  );

  const opoyRow = offense[0] ?? null;
  const dpoyRow = defenders[0] ?? null;
  const recRow =
    sortBy(
      totals.filter(
        (row) =>
          row.rosterId !== opoyRow?.rosterId &&
          !isQuarterback(row.position) &&
          skillValue(row) > 0
      ),
      skillValue
    )[0] ?? null;

  const opoy = opoyRow ? toPlayer(opoyRow, stampCategory(opoyRow)) : null;
  const dpoy = dpoyRow ? toPlayer(dpoyRow, "DEFENSE") : null;
  const rec = recRow ? toPlayer(recRow, stampCategory(recRow)) : null;
  const passing = passers.slice(0, 3).map((row) => toPlayer(row, "PASSING"));
  const rushing = rushers.slice(0, 3).map((row) => toPlayer(row, "RUSHING"));
  const receiving = receivers.slice(0, 3).map((row) => toPlayer(row, "RECEIVING"));
  const defense = defenders.slice(0, 3).map((row) => toPlayer(row, "DEFENSE"));

  const finalCount = games.filter((game) => isMaddenFinal(game.status)).length;
  const expected = Math.max(nflGamesInWeek(week), games.length);
  const stamp = [
    opoy?.rosterId ?? "x",
    dpoy?.rosterId ?? "x",
    rec?.rosterId ?? "x",
    finalCount,
  ].join("-");

  return {
    week,
    weekIndex,
    finalCount,
    expected,
    stamp,
    opoy,
    dpoy,
    rec,
    passing,
    rushing,
    receiving,
    defense,
  };
}

function teamLine(player: HonorsPlayer) {
  return player.coachName
    ? `**${player.teamAbbr}** · ${player.shortName} (${player.coachName})`
    : `**${player.teamAbbr}** · ${player.shortName}`;
}

function opoyTable(player: HonorsPlayer) {
  if (player.category === "PASSING") {
    const rush =
      player.rushYds >= 20
        ? `
| Rush |
| --- |
| ${player.rushYds} yards, ${player.rushTDs} TD |`
        : "";
    return `| Pass | TDs / INT | Rating |
| --- | --- | --- |
| **${player.passYds} yards** (${player.passComp}/${player.passAtt}) | ${player.passTDs} / ${player.passInts} | ${player.passerRating.toFixed(1)} |${rush}`;
  }

  if (player.recCatches > 0 || player.recYds > 0) {
    return `| Rush | Rec | Scrimmage |
| --- | --- | --- |
| **${player.rushYds}** on ${player.rushAtt} (${player.rushTDs} TD) | ${player.recCatches} for **${player.recYds}** (${player.recTDs} TD) | **${player.rushYds + player.recYds} yds**, ${player.rushTDs + player.recTDs} TD |`;
  }

  return `| Rush | TDs |
| --- | --- |
| **${player.rushYds} yards** on ${player.rushAtt} carries | ${player.rushTDs} |`;
}

function heaterCopy(player: HonorsPlayer) {
  if (player.category === "RUSHING" || isRunningBack(player.position)) {
    return player.line;
  }
  if (player.recCatches > 0 || player.recYds > 0) {
    return player.rushYds >= 15
      ? `${player.recCatches} catches, **${player.recYds} yards**, ${player.recTDs} TD · ${player.rushYds} rush.`
      : `${player.recCatches} catches, **${player.recYds} yards**, ${player.recTDs} TD.`;
  }
  return `${player.line}.`;
}

export function renderHonorsArticle(board: HonorsBoard) {
  const { week, opoy, dpoy, rec, passing, rushing, receiving, defense } = board;
  const titleBits = [opoy?.fullName, dpoy?.fullName].filter(Boolean).join(" and ");
  const title = `Week ${week} honors: ${titleBits || "the tape spoke"}`;
  const summary = [
    opoy ? `${opoy.fullName} (${opoy.teamAbbr}) led the week` : null,
    dpoy ? `${dpoy.fullName} wrecked the other sideline` : null,
  ]
    .filter(Boolean)
    .join(". ");
  const tapeNote =
    board.expected > 0 && board.finalCount < board.expected
      ? `${board.finalCount} of ${board.expected} finals are on the tape. This chapter rewrites when the next Companion dump lands — later games can still take the stamp. Backs are scored on rushing and receiving.`
      : "These honors are pulled straight from the Madden 27 weekly export — not a panel vote. Rush and receiving both count for backs.";

  const body = `![Week ${week} honors](${honorsOgPath(week, board.stamp)})

${tapeNote}

## Offensive stamp${opoy ? ` — ${opoy.fullName}` : ""}

${
  opoy
    ? `${teamLine(opoy)}

${opoyTable(opoy)}`
    : "No offensive line jumped the rest of the board."
}

${
  rec
    ? `## The other heater — ${rec.fullName}

${teamLine(rec)}

${heaterCopy(rec)}`
    : ""
}

## Defensive stamp${dpoy ? ` — ${dpoy.fullName}` : ""}

${
  dpoy
    ? `${teamLine(dpoy)}

| Sacks | INT | Tackles |
| --- | --- | --- |
| **${formatSacks(dpoy.defSacks)}** | ${dpoy.defInts} | ${dpoy.defTackles} |`
    : "No defender separated enough to print."
}

## The rest of the board

${passing
  .map((row) => `- Pass: **${row.fullName}**, ${row.teamAbbr} — ${row.line}`)
  .join("\n")}
${rushing
  .map((row) => `- Rush: **${row.fullName}**, ${row.teamAbbr} — ${row.line}`)
  .join("\n")}
${receiving
  .map((row) => `- Rec: **${row.fullName}**, ${row.teamAbbr} — ${row.line}`)
  .join("\n")}
${defense
  .map((row) => `- Defense: **${row.fullName}**, ${row.teamAbbr} — ${row.line}`)
  .join("\n")}

Hand-written honors stay locked. This chapter is generated from the Companion export and updates as more games hit the tape. Backs are scored on rushing **and** receiving.`;

  return {
    slug: autoHonorsSlug(week),
    title,
    eyebrow: `Honors desk · Week ${week}`,
    summary: summary || `Week ${week} statistical honors from the Companion export.`,
    body,
  };
}

export function joinHonorNames(names: string[]) {
  const unique = [...new Set(names.filter(Boolean))];
  if (unique.length === 0) return "";
  if (unique.length === 1) return unique[0];
  if (unique.length === 2) return `${unique[0]} and ${unique[1]}`;
  return `${unique.slice(0, 2).join(", ")} +${unique.length - 2} more`;
}

export async function getHonorsNudgeForAbbr(
  abbr: string,
  currentWeek: number
): Promise<{ week: number; slug: string; playerNames: string[] } | null> {
  const canon = canonAbbr(abbr);
  const weeks = [currentWeek, currentWeek - 1].filter((week) => week > 0);
  if (weeks.length === 0) return null;

  const stories = await prisma.leagueStory.findMany({
    where: {
      category: StoryCategory.PLAYER_OF_WEEK,
      week: { in: weeks },
      isPublished: true,
    },
    select: { slug: true, week: true, body: true },
  });

  for (const week of weeks) {
    const story = stories.find((row) => row.week === week);
    if (!story?.week) continue;

    if (isAutoHonorsSlug(story.slug)) {
      const board = await buildHonorsBoard(week - 1);
      const players = honorsMentionsForAbbr(board, canon);
      if (players.length > 0) {
        return {
          week,
          slug: story.slug,
          playerNames: [...new Set(players.map((player) => player.fullName))],
        };
      }
      continue;
    }

    if (new RegExp(`\\b${canon}\\b`).test(story.body)) {
      return { week, slug: story.slug, playerNames: [] };
    }
  }

  return null;
}
