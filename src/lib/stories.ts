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
    title: "Final team selection is locked: 32 coaches, 32 destinies",
    eyebrow: "Season 1 · Draft desk",
    summary:
      "The Kings Madden League draft is official. Curry opened on the Lions. Big Al closed on the Steelers. Now the ratings board tells us who walked into a throne — and who walked into a rebuild.",
    body: `The board is closed. The chat is loud. And Season 1 finally has faces on every franchise.

Curry went first and took the Lions — a 87 OVR club with a 91 offense ready to cook. Wrinzo followed with the Patriots (86). Biz grabbed the Giants. Chance went Packers. Jordan Stowe landed the league’s top overall machine: the Rams at 91 OVR (93 OFF / 88 DEF).

Prime took the Raiders. Lefty secured the Eagles (88 OVR). Nick went Bengals. Qon took Titans. Puddin landed Broncos. Trent got the Chiefs. Noquestions went Ravens (87). Jsmood took Cowboys. Jaylen Stowe chose Bears. Bone went Jets. Dimez took Jaguars. Oli landed Chargers. Watermann got Texans. Gotti took Falcons. Dre went Bucs. Pryor secured Bills (85 OVR, 91 offense). Swipe took 49ers. MONEYTEAMPETEY landed Seahawks. Quon went Colts. Dooders took Cardinals. Slap got Saints. Wdub landed Panthers. Jerm took Commanders. Fitz went Vikings. Jgold got Browns. Mease closed near the end on the Dolphins (74 OVR — the toughest roster on the board). Big Al finished it with the Steelers.

FINAL TEAM SELECTION
1. Curry — Lions
2. Wrinzo — Patriots
3. Biz — Giants
4. Chance — Packers
5. Jordan Stowe — Rams
6. Prime — Raiders
7. Lefty — Eagles
8. Nick — Bengals
9. Qon — Titans
10. Puddin — Broncos
11. Trent — Chiefs
12. Noquestions — Ravens
13. Jsmood — Cowboys
14. Jaylen Stowe — Bears
15. Bone — Jets
16. Dimez — Jaguars
17. Oli — Chargers
18. Watermann — Texans
19. Gotti — Falcons
20. Dre — Bucs
21. Pryor — Bills
22. Swipe — 49ers
23. MONEYTEAMPETEY — Seahawks
24. Quon — Colts
25. Dooders — Cardinals
26. Slap — Saints
27. Wdub — Panthers
28. Jerm — Commanders
29. Fitz — Vikings
30. Jgold — Browns
31. Mease — Dolphins
32. Big Al — Steelers

OFFICIAL MADDEN TEAM RATINGS (OVR / OFF / DEF)
Rams 91 / 93 / 88 · Eagles 88 / 88 / 87 · Lions 87 / 91 / 83 · Ravens 87 / 90 / 87 · Broncos 86 / 85 / 87 · Patriots 86 / 87 / 85 · 49ers 85 / 90 / 82 · Bills 85 / 91 / 79 · Chiefs 84 / 90 / 80 · Seahawks 84 / 83 / 82 · Texans 84 / 80 / 87 · Bears 83 / 85 / 82 · Bengals 83 / 88 / 77 · Cowboys 83 / 87 / 80 · Chargers 82 / 85 / 79 · Colts 82 / 83 / 79 · Falcons 82 / 83 / 79 · Packers 81 / 82 / 82 · Panthers 81 / 79 / 82 · Steelers 81 / 79 / 87 · Buccaneers 80 / 83 / 79 · Vikings 80 / 82 / 79 · Commanders 79 / 80 / 77 · Giants 79 / 80 / 79 · Raiders 79 / 79 / 77 · Saints 79 / 80 / 75 · Cardinals 78 / 79 / 75 · Jaguars 78 / 79 / 79 · Browns 77 / 74 / 80 · Jets 76 / 75 / 79 · Titans 75 / 74 / 79 · Dolphins 74 / 74 / 72

The top of the board is stacked: Rams, Eagles, Lions, Ravens. The bottom of the board is a proving ground: Titans, Jets, Browns, Dolphins. That gap is the whole point of this league — talent gets you in the conversation, coaching keeps you there.

Draft night is over. Contracts are live. Week 1 is next. Welcome to the Kings Madden League.`,
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

Watch the premium offenses first: Lions, Bills, Rams, 49ers, Chiefs. Then watch the traps — lower-rated clubs with something to prove.

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

Commissioners will spotlight offensive, defensive, and coaching standouts as the season unfolds. Have a nominee after your game? Make the case in Discord and on the wire.

Great leagues remember great weeks. This is where those names live.`,
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
    body: `The draft handed out opportunity. The ratings board handed out expectations.

Coaches on 87+ clubs will be judged by January. Coaches on the bottom tier will be judged by progress. Either way, reputation, contracts, and job security are now part of the product — not just the box score.

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
