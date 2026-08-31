import { StoryCategory, MaddenStatCategory } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getActiveSeason } from "@/lib/league";
import { displayWeek } from "@/lib/madden/display";
import { isMaddenFinal } from "@/lib/madden/game-status";
import {
  autoHonorsSlug,
  buildHonorsBoard,
  isAutoHonorsSlug,
  renderHonorsArticle,
  type HonorsBoard,
} from "@/lib/madden/honors";
import {
  getLeaders,
  getWeekGames,
  listStatWeeks,
} from "@/lib/madden/query";

function coachOf(team: {
  userName: string | null;
  franchise?: { memberships: Array<{ user: { name: string | null } }> } | null;
}) {
  return team.franchise?.memberships[0]?.user.name || team.userName || "CPU";
}

export async function generateMaddenStories() {
  const weeks = await listStatWeeks();
  if (weeks.length === 0) return;

  let seasonId: string | null = null;
  try {
    const { season } = await getActiveSeason();
    seasonId = season.id;
  } catch {
    seasonId = null;
  }

  for (const weekIndex of weeks.slice(0, 3)) {
    await stampWeekTape(weekIndex, seasonId);
    await stampWeekHonors(weekIndex, seasonId);
  }
}

async function stampWeekTape(weekIndex: number, seasonId: string | null) {
  const week = displayWeek(weekIndex);
  const [games, passing, rushing, receiving, defense] = await Promise.all([
    getWeekGames(weekIndex),
    getLeaders(weekIndex, MaddenStatCategory.PASSING, 5),
    getLeaders(weekIndex, MaddenStatCategory.RUSHING, 5),
    getLeaders(weekIndex, MaddenStatCategory.RECEIVING, 5),
    getLeaders(weekIndex, MaddenStatCategory.DEFENSE, 5),
  ]);

  const played = games.filter((game) => isMaddenFinal(game.status));
  if (played.length === 0 && passing.length === 0) return;

  const shootout = [...played].sort(
    (a, b) => a.homeScore + a.awayScore - (b.homeScore + b.awayScore)
  ).at(-1);
  const defensive = [...played].sort(
    (a, b) => a.homeScore + a.awayScore - (b.homeScore + b.awayScore)
  )[0];
  const pass = passing[0];
  const rush = rushing[0];
  const rec = receiving[0];
  const def = defense[0];

  const scoreboard = played
    .map((game) => {
      const away = `${game.awayTeam.abbr} ${game.awayScore}`;
      const home = `${game.homeTeam.abbr} ${game.homeScore}`;
      const winner =
        game.awayScore === game.homeScore
          ? "TIE"
          : game.awayScore > game.homeScore
            ? game.awayTeam.abbr
            : game.homeTeam.abbr;
      return `- **${away}** at **${home}** — ${winner} ${
        winner === "TIE" ? "holds" : "takes it"
      }`;
    })
    .join("\n");

  const tapeSlug = `madden-week-${week}-tape`;
  const tapeTitle = shootout
    ? `Week ${week} tape: ${shootout.awayTeam.abbr} ${shootout.awayScore}–${shootout.homeScore} ${shootout.homeTeam.abbr} headlines the board`
    : `Week ${week} is on the tape`;
  const tapeSummary = pass
    ? `${pass.fullName} threw for ${pass.passYds} and ${pass.passTDs} TD. The Companion export is live — scores, leaders, and rosters are on the site.`
    : `Week ${week} scores from the Madden 27 Companion App are on the board.`;

  const tapeBody = `The Companion App dumped Week ${week} into the desk. This is the live tape — not a preview, not a rumor mill.

${
  shootout
    ? `## The number that jumped
**${shootout.awayTeam.abbr} ${shootout.awayScore}, ${shootout.homeTeam.abbr} ${shootout.homeScore}.** ${coachOf(shootout.awayTeam)} vs ${coachOf(shootout.homeTeam)}. That’s the loudest score of the week.`
    : ""
}

${
  defensive && defensive !== shootout
    ? `## The other kind of statement
**${defensive.awayTeam.abbr} ${defensive.awayScore}, ${defensive.homeTeam.abbr} ${defensive.homeScore}.** Somebody played defense.`
    : ""
}

## Finals

${scoreboard || "No completed games in this export yet."}

## Who ate

${
  pass
    ? `- **Pass:** ${pass.fullName}, ${pass.team.abbr} — ${pass.passYds} yards, ${pass.passTDs} TD, ${pass.passInts} INT`
    : ""
}
${
  rush
    ? `- **Rush:** ${rush.fullName}, ${rush.team.abbr} — ${rush.rushYds} yards, ${rush.rushTDs} TD`
    : ""
}
${
  rec
    ? `- **Receive:** ${rec.fullName}, ${rec.team.abbr} — ${rec.recCatches} for ${rec.recYds}, ${rec.recTDs} TD`
    : ""
}
${
  def
    ? `- **Defense:** ${def.fullName}, ${def.team.abbr} — ${def.defSacks} sacks, ${def.defInts} INT, ${def.defTackles} tackles`
    : ""
}

Full leaders and every roster live under **League** in the nav. This chapter updates when the next weekly export lands.`;

  await prisma.leagueStory.upsert({
    where: { slug: tapeSlug },
    update: {
      title: tapeTitle,
      eyebrow: `League tape · Week ${week}`,
      summary: tapeSummary,
      body: tapeBody,
      category: StoryCategory.LEAGUE,
      week,
      seasonId,
      isPublished: true,
      isFeatured: false,
      sortOrder: 40 + week,
    },
    create: {
      slug: tapeSlug,
      title: tapeTitle,
      eyebrow: `League tape · Week ${week}`,
      summary: tapeSummary,
      body: tapeBody,
      category: StoryCategory.LEAGUE,
      week,
      seasonId,
      isPublished: true,
      isFeatured: false,
      sortOrder: 40 + week,
    },
  });
}

export async function persistHonorsBoard(
  board: HonorsBoard,
  seasonId?: string | null
) {
  if (!board.opoy && !board.dpoy) return;

  const existing = await prisma.leagueStory.findFirst({
    where: { week: board.week, category: StoryCategory.PLAYER_OF_WEEK },
    select: { slug: true },
  });
  if (existing && !isAutoHonorsSlug(existing.slug)) return;

  const article = renderHonorsArticle(board);
  const slug = existing?.slug ?? autoHonorsSlug(board.week);

  await prisma.leagueStory.upsert({
    where: { slug },
    update: {
      title: article.title,
      eyebrow: article.eyebrow,
      summary: article.summary,
      body: article.body,
      category: StoryCategory.PLAYER_OF_WEEK,
      week: board.week,
      seasonId: seasonId ?? undefined,
      isPublished: true,
      isFeatured: false,
      sortOrder: 30 + board.week,
    },
    create: {
      slug,
      title: article.title,
      eyebrow: article.eyebrow,
      summary: article.summary,
      body: article.body,
      category: StoryCategory.PLAYER_OF_WEEK,
      week: board.week,
      seasonId: seasonId ?? undefined,
      isPublished: true,
      isFeatured: false,
      sortOrder: 30 + board.week,
    },
  });
}

async function stampWeekHonors(weekIndex: number, seasonId: string | null) {
  await persistHonorsBoard(await buildHonorsBoard(weekIndex), seasonId);
}
