import { StoryCategory, MaddenStatCategory } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getActiveSeason } from "@/lib/league";
import { displayWeek, playerName } from "@/lib/madden/display";
import {
  getLeaders,
  getWeekGames,
  latestStatWeek,
} from "@/lib/madden/query";

function coachOf(team: {
  userName: string | null;
  franchise?: { memberships: Array<{ user: { name: string | null } }> } | null;
}) {
  return team.franchise?.memberships[0]?.user.name || team.userName || "CPU";
}

export async function generateMaddenStories() {
  const weekIndex = await latestStatWeek();
  if (weekIndex == null) return;
  const week = displayWeek(weekIndex);

  let seasonId: string | null = null;
  try {
    const { season } = await getActiveSeason();
    seasonId = season.id;
  } catch {
    seasonId = null;
  }

  const [games, passing, rushing, receiving, defense] = await Promise.all([
    getWeekGames(weekIndex),
    getLeaders(weekIndex, MaddenStatCategory.PASSING, 5),
    getLeaders(weekIndex, MaddenStatCategory.RUSHING, 5),
    getLeaders(weekIndex, MaddenStatCategory.RECEIVING, 5),
    getLeaders(weekIndex, MaddenStatCategory.DEFENSE, 5),
  ]);

  const played = games.filter((game) => game.status >= 2);
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

  const existingHonors = await prisma.leagueStory.findFirst({
    where: { week, category: StoryCategory.PLAYER_OF_WEEK },
    select: { id: true, slug: true },
  });
  if (existingHonors) return;
  if (!pass && !rush && !def) return;

  const honorsSlug = `madden-week-${week}-stat-honors`;
  const opoy = rush && rush.rushYds >= (pass?.passYds ?? 0) / 3 ? rush : pass;
  const dpoy = def;
  const titleBits = [opoy?.fullName, dpoy?.fullName].filter(Boolean).join(" and ");
  const honorsTitle = `Week ${week} honors: ${titleBits || "the tape spoke"}`;
  const honorsSummary = [
    opoy
      ? `${opoy.fullName} (${opoy.team.abbr}) led the week`
      : null,
    dpoy ? `${dpoy.fullName} wrecked the other sideline` : null,
  ]
    .filter(Boolean)
    .join(". ");

  const honorsBody = `These honors are pulled straight from the Madden 27 weekly export — not a panel vote. If the numbers say it, the desk prints it.

## Offensive stamp${opoy ? ` — ${opoy.fullName}` : ""}

${
  opoy
    ? `**${opoy.team.abbr}** · ${playerName(opoy.player) || opoy.fullName}

${
  opoy.category === "RUSHING"
    ? `| Rush | TDs |
| --- | --- |
| **${opoy.rushYds} yards** on ${opoy.rushAtt} carries | ${opoy.rushTDs} |`
    : `| Pass | TDs / INT | Rating |
| --- | --- | --- |
| **${opoy.passYds} yards** (${opoy.passComp}/${opoy.passAtt}) | ${opoy.passTDs} / ${opoy.passInts} | ${opoy.passerRating.toFixed(1)} |`
}`
    : "No offensive line jumped the rest of the board."
}

${
  rec && rec.rosterId !== opoy?.rosterId
    ? `## The other heater — ${rec.fullName}

**${rec.team.abbr}** · ${rec.recCatches} catches, **${rec.recYds} yards**, ${rec.recTDs} TD.`
    : ""
}

## Defensive stamp${dpoy ? ` — ${dpoy.fullName}` : ""}

${
  dpoy
    ? `**${dpoy.team.abbr}** · ${playerName(dpoy.player) || dpoy.fullName}

| Sacks | INT | Tackles |
| --- | --- | --- |
| **${dpoy.defSacks}** | ${dpoy.defInts} | ${dpoy.defTackles} |`
    : "No defender separated enough to print."
}

## The rest of the board

${passing
  .slice(0, 3)
  .map(
    (row) =>
      `- Pass: **${row.fullName}**, ${row.team.abbr} — ${row.passYds} yds, ${row.passTDs} TD`
  )
  .join("\n")}
${rushing
  .slice(0, 3)
  .map(
    (row) =>
      `- Rush: **${row.fullName}**, ${row.team.abbr} — ${row.rushYds} yds, ${row.rushTDs} TD`
  )
  .join("\n")}
${receiving
  .slice(0, 3)
  .map(
    (row) =>
      `- Rec: **${row.fullName}**, ${row.team.abbr} — ${row.recCatches}/${row.recYds}/${row.recTDs}`
  )
  .join("\n")}

This chapter is generated from the Companion export. Hand-written honors stay locked; this only fills a week the desk has not stamped yet.`;

  await prisma.leagueStory.create({
    data: {
      slug: honorsSlug,
      title: honorsTitle,
      eyebrow: `Honors desk · Week ${week}`,
      summary: honorsSummary || `Week ${week} statistical honors from the Companion export.`,
      body: honorsBody,
      category: StoryCategory.PLAYER_OF_WEEK,
      week,
      seasonId,
      isPublished: true,
      isFeatured: false,
      sortOrder: 30 + week,
    },
  });
}
