import { StoryCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const STORY_CATEGORY_LABELS: Record<StoryCategory, string> = {
  FEATURE: "Front page",
  GAME_OF_WEEK: "Game of the week",
  PLAYER_OF_WEEK: "Players of the week",
  COACHING: "Coaching storyline",
  DRAFT: "Draft desk",
  LEAGUE: "League desk",
};

const DEFAULT_STORIES = [
  {
    slug: "season-1-team-draft-complete",
    category: StoryCategory.DRAFT,
    title: "The draft is locked: every coach has a franchise",
    eyebrow: "Season 1 · Draft desk",
    summary:
      "Final team selection is official. Jordan Stowe walked out with the No. 1 Rams. Mease drew the toughest rebuild in Miami. Here’s the full board — and the Madden 27 ratings that shape Season 1.",
    body: `The Kings Madden League draft room is closed.

Thirty-two coaches. Thirty-two franchises. One season about to tip from draft chatter into real scoreboard pressure.

Official Madden NFL 27 team overalls (via Madden Underground) now sit next to every pick — and they tell a clear story. Some coaches inherited ready-made contenders. Others inherited long roads and longer nights.

## What the ratings say

The top of the board is stacked. The **Rams (91)** are the highest-rated team in Madden 27, with a league-best **93 offense**. The **Eagles (88)** are the most complete two-way club. The **Lions (87)** and **Bills (85)** bring elite scoring offenses. The **Ravens (87)** and **Broncos (86)** can win on both sides of the ball.

At the other end, the rebuild desk is real. The **Dolphins (74)** are the lowest-rated team in the game. The **Titans (75)**, **Jets (76)**, and **Browns (77)** will need coaching, patience, and weekly proof.

That gap is the point of this league: talent gets you drafted. Coaching decides who survives.

## Final team selection

| Pick | Coach | Team | OVR | OFF | DEF |
| --- | --- | --- | --- | --- | --- |
| 1 | Curry | Lions | 87 | 91 | 83 |
| 2 | Wrinzo | Patriots | 86 | 87 | 85 |
| 3 | Biz | Giants | 79 | 80 | 79 |
| 4 | Chance | Packers | 81 | 82 | 82 |
| 5 | Jordan Stowe | Rams | 91 | 93 | 88 |
| 6 | Prime | Raiders | 79 | 79 | 77 |
| 7 | Lefty | Eagles | 88 | 88 | 87 |
| 8 | Nick | Bengals | 83 | 88 | 77 |
| 9 | Qon | Titans | 75 | 74 | 79 |
| 10 | Puddin | Broncos | 86 | 85 | 87 |
| 11 | Trent | Chiefs | 84 | 90 | 80 |
| 12 | Noquestions | Ravens | 87 | 90 | 87 |
| 13 | Jsmood | Cowboys | 83 | 87 | 80 |
| 14 | Jaylen Stowe | Bears | 83 | 85 | 82 |
| 15 | Bone | Jets | 76 | 75 | 79 |
| 16 | Dimez | Jaguars | 78 | 79 | 79 |
| 17 | Oli | Chargers | 82 | 85 | 79 |
| 18 | Watermann | Texans | 84 | 80 | 87 |
| 19 | Gotti | Falcons | 82 | 83 | 79 |
| 20 | Dre | Buccaneers | 80 | 83 | 79 |
| 21 | Pryor | Bills | 85 | 91 | 79 |
| 22 | Swipe | 49ers | 85 | 90 | 82 |
| 23 | MONEYTEAMPETEY | Seahawks | 84 | 83 | 82 |
| 24 | Quon | Colts | 82 | 83 | 79 |
| 25 | Dooders | Cardinals | 78 | 79 | 75 |
| 26 | Slap | Saints | 79 | 80 | 75 |
| 27 | Wdub | Panthers | 81 | 79 | 82 |
| 28 | Jerm | Commanders | 79 | 80 | 77 |
| 29 | Fitz | Vikings | 80 | 82 | 79 |
| 30 | Jgold | Browns | 77 | 74 | 80 |
| 31 | Mease | Dolphins | 74 | 74 | 72 |
| 32 | Big Al | Steelers | 81 | 79 | 87 |

## Madden 27 team rankings (best to worst)

| Rank | Team | OVR | OFF | DEF | League coach |
| --- | --- | --- | --- | --- | --- |
| 1 | Rams | 91 | 93 | 88 | Jordan Stowe |
| 2 | Eagles | 88 | 88 | 87 | Lefty |
| 3 | Lions | 87 | 91 | 83 | Curry |
| 4 | Ravens | 87 | 90 | 87 | Noquestions |
| 5 | Broncos | 86 | 85 | 87 | Puddin |
| 6 | Patriots | 86 | 87 | 85 | Wrinzo |
| 7 | 49ers | 85 | 90 | 82 | Swipe |
| 8 | Bills | 85 | 91 | 79 | Pryor |
| 9 | Chiefs | 84 | 90 | 80 | Trent |
| 10 | Seahawks | 84 | 83 | 82 | MONEYTEAMPETEY |
| 11 | Texans | 84 | 80 | 87 | Watermann |
| 12 | Bears | 83 | 85 | 82 | Jaylen Stowe |
| 13 | Bengals | 83 | 88 | 77 | Nick |
| 14 | Cowboys | 83 | 87 | 80 | Jsmood |
| 15 | Chargers | 82 | 85 | 79 | Oli |
| 16 | Colts | 82 | 83 | 79 | Quon |
| 17 | Falcons | 82 | 83 | 79 | Gotti |
| 18 | Packers | 81 | 82 | 82 | Chance |
| 19 | Panthers | 81 | 79 | 82 | Wdub |
| 20 | Steelers | 81 | 79 | 87 | Big Al |
| 21 | Buccaneers | 80 | 83 | 79 | Dre |
| 22 | Vikings | 80 | 82 | 79 | Fitz |
| 23 | Commanders | 79 | 80 | 77 | Jerm |
| 24 | Giants | 79 | 80 | 79 | Biz |
| 25 | Raiders | 79 | 79 | 77 | Prime |
| 26 | Saints | 79 | 80 | 75 | Slap |
| 27 | Cardinals | 78 | 79 | 75 | Dooders |
| 28 | Jaguars | 78 | 79 | 79 | Dimez |
| 29 | Browns | 77 | 74 | 80 | Jgold |
| 30 | Jets | 76 | 75 | 79 | Bone |
| 31 | Titans | 75 | 74 | 79 | Qon |
| 32 | Dolphins | 74 | 74 | 72 | Mease |

## Early storylines to watch

- **Win-now pressure:** Jordan Stowe (Rams), Lefty (Eagles), Curry (Lions), and Noquestions (Ravens) drafted premium clubs. Expectations arrive in Week 1.
- **Explosive offense lanes:** Lions, Bills, Rams, 49ers, and Chiefs can light up the scoreboard fast.
- **Defense-first identities:** Broncos, Texans, and Steelers can win ugly and force turnovers.
- **Rebuild bosses:** Mease (Dolphins), Qon (Titans), Bone (Jets), and Jgold (Browns) just signed up for the hardest coaching jobs in the league.

Draft night is over. Contracts are live. Week 1 is next.

Welcome to the Kings Madden League.`,
    isFeatured: true,
    sortOrder: 0,
  },
  {
    slug: "season-1-week-1-preview",
    category: StoryCategory.GAME_OF_WEEK,
    title: "Week 1 is loading: first impressions will travel fast",
    eyebrow: "Games of the week",
    summary:
      "Opening week sets the tone — early wins build belief, early slides start the hot-seat whispers.",
    body: `Week 1 does not decide a season, but it writes the first headline.

## What to watch

- Premium offenses: **Lions**, **Bills**, **Rams**, **49ers**, **Chiefs**
- Defense-first traps: **Broncos**, **Texans**, **Steelers**
- Rebuild openers: **Dolphins**, **Titans**, **Jets**, **Browns**

Submit your scores promptly. The story only feels alive when the results are official.`,
    isFeatured: false,
    sortOrder: 10,
  },
  {
    slug: "season-1-players-of-the-week-placeholder",
    category: StoryCategory.PLAYER_OF_WEEK,
    title: "Players of the Week desk opens with Season 1",
    eyebrow: "Honors desk",
    summary:
      "Each week we’ll crown the standouts who changed games — and give the league a reason to argue (in a good way).",
    body: `The Players of the Week board is live.

## How it works

- Commissioners spotlight offensive, defensive, and coaching standouts
- Nominations can come from Discord after your game
- Great leagues remember great weeks — this is where those names live`,
    isFeatured: false,
    sortOrder: 20,
  },
  {
    slug: "season-1-coaching-storylines",
    category: StoryCategory.COACHING,
    title: "New jobs, new pressure: coaching storylines after the draft",
    eyebrow: "Coaching carousel",
    summary:
      "Everyone starts with a contract and a reputation. Not everyone will keep both — especially with that ratings gap.",
    body: `The draft handed out opportunity. The Madden 27 ratings board handed out expectations.

## The new reality

- Coaches on 87+ clubs will be judged by January
- Coaches on the bottom tier will be judged by progress
- Reputation, contracts, and job security are now part of the product

Stay locked into the Coach Hub for hot seats, carousel windows, and the long game of franchise identity.`,
    isFeatured: false,
    sortOrder: 30,
  },
] as const;

/** Ensures the welcoming front-page stories exist and stay current. */
export async function ensureDefaultLeagueStories(seasonId?: string) {
  for (const story of DEFAULT_STORIES) {
    await prisma.leagueStory.upsert({
      where: { slug: story.slug },
      update: {
        title: story.title,
        eyebrow: story.eyebrow,
        summary: story.summary,
        body: story.body,
        category: story.category,
        isFeatured: story.isFeatured,
        sortOrder: story.sortOrder,
        isPublished: true,
        ...(seasonId ? { seasonId } : {}),
      },
      create: {
        ...story,
        seasonId,
        isPublished: true,
        publishedAt: new Date(),
      },
    });
  }
}

export async function getPublishedStories(options?: {
  seasonId?: string;
  take?: number;
}) {
  return prisma.leagueStory.findMany({
    where: { isPublished: true },
    orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { publishedAt: "desc" }],
    take: options?.take ?? 12,
    include: { author: { select: { name: true, email: true } } },
  });
}

export async function getFeaturedStory() {
  return prisma.leagueStory.findFirst({
    where: { isPublished: true, isFeatured: true },
    orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }],
    include: { author: { select: { name: true, email: true } } },
  });
}
