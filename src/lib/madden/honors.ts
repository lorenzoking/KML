import { StoryCategory, MaddenStatCategory } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { formatSacks, playerName } from "@/lib/madden/display";
import { canonAbbr } from "@/lib/madden/franchises";
import { isMaddenFinal } from "@/lib/madden/game-status";
import { getLeaders, getWeekGames } from "@/lib/madden/query";
import { nflGamesInWeek } from "@/lib/nfl-schedule-2026";

export type HonorsPlayer = {
  rosterId: string;
  fullName: string;
  shortName: string;
  lastName: string;
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

type LeaderRow = Awaited<ReturnType<typeof getLeaders>>[number];

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

function coachOfTeam(team: LeaderRow["team"]) {
  return team.franchise?.memberships[0]?.user.name || team.userName || null;
}

function toPlayer(
  row: LeaderRow,
  category: HonorsPlayer["category"]
): HonorsPlayer {
  const line =
    category === "PASSING"
      ? `${row.passYds} yds, ${row.passTDs} TD`
      : category === "RUSHING"
        ? `${row.rushYds} yds, ${row.rushTDs} TD`
        : category === "RECEIVING"
          ? `${row.recCatches} for ${row.recYds}, ${row.recTDs} TD`
          : `${formatSacks(row.defSacks)} sacks, ${row.defInts} INT, ${row.defTackles} tkl`;

  return {
    rosterId: row.rosterId,
    fullName: row.fullName,
    shortName: playerName(row.player) || row.fullName,
    lastName: row.player.lastName || row.fullName.split(" ").at(-1) || row.fullName,
    teamAbbr: canonAbbr(row.team.franchise?.abbreviation || row.team.abbr),
    coachName: coachOfTeam(row.team),
    category,
    line,
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
  const [games, passingRows, rushingRows, receivingRows, defenseRows] =
    await Promise.all([
      getWeekGames(weekIndex),
      getLeaders(weekIndex, MaddenStatCategory.PASSING, 5),
      getLeaders(weekIndex, MaddenStatCategory.RUSHING, 5),
      getLeaders(weekIndex, MaddenStatCategory.RECEIVING, 5),
      getLeaders(weekIndex, MaddenStatCategory.DEFENSE, 5),
    ]);

  const passing = passingRows.map((row) => toPlayer(row, "PASSING"));
  const rushing = rushingRows.map((row) => toPlayer(row, "RUSHING"));
  const receiving = receivingRows.map((row) => toPlayer(row, "RECEIVING"));
  const defense = defenseRows.map((row) => toPlayer(row, "DEFENSE"));
  const pass = passingRows[0] ?? null;
  const rush = rushingRows[0] ?? null;
  const rec = receiving[0] ?? null;
  const opoyRow =
    rush && rush.rushYds >= (pass?.passYds ?? 0) / 3 ? rush : pass;
  const opoy = opoyRow
    ? toPlayer(opoyRow, opoyRow.category === "RUSHING" ? "RUSHING" : "PASSING")
    : null;
  const dpoy = defense[0] ?? null;
  const recHeater =
    rec && rec.rosterId !== opoy?.rosterId ? rec : receiving[1] ?? null;
  const finalCount = games.filter((game) => isMaddenFinal(game.status)).length;
  const expected = Math.max(nflGamesInWeek(week), games.length);
  const stamp = [
    opoy?.rosterId ?? "x",
    dpoy?.rosterId ?? "x",
    recHeater?.rosterId ?? "x",
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
    rec: recHeater,
    passing: passing.slice(0, 3),
    rushing: rushing.slice(0, 3),
    receiving: receiving.slice(0, 3),
    defense: defense.slice(0, 3),
  };
}

function teamLine(player: HonorsPlayer) {
  return player.coachName
    ? `**${player.teamAbbr}** · ${player.shortName} (${player.coachName})`
    : `**${player.teamAbbr}** · ${player.shortName}`;
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
      ? `${board.finalCount} of ${board.expected} finals are on the tape. This chapter rewrites when the next Companion dump lands — later games can still take the stamp.`
      : "These honors are pulled straight from the Madden 27 weekly export — not a panel vote.";

  const opoyTable =
    opoy?.category === "RUSHING"
      ? `| Rush | TDs |
| --- | --- |
| **${opoy.rushYds} yards** on ${opoy.rushAtt} carries | ${opoy.rushTDs} |`
      : opoy
        ? `| Pass | TDs / INT | Rating |
| --- | --- | --- |
| **${opoy.passYds} yards** (${opoy.passComp}/${opoy.passAtt}) | ${opoy.passTDs} / ${opoy.passInts} | ${opoy.passerRating.toFixed(1)} |`
        : "";

  const body = `![Week ${week} honors](${honorsOgPath(week, board.stamp)})

${tapeNote}

## Offensive stamp${opoy ? ` — ${opoy.fullName}` : ""}

${
  opoy
    ? `${teamLine(opoy)}

${opoyTable}`
    : "No offensive line jumped the rest of the board."
}

${
  rec
    ? `## The other heater — ${rec.fullName}

${teamLine(rec)}

${rec.recCatches} catches, **${rec.recYds} yards**, ${rec.recTDs} TD.`
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

Hand-written honors stay locked. This chapter is generated from the Companion export and updates as more games hit the tape.`;

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
