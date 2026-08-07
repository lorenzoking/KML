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
    title: "The board is set: Kings Madden League team draft is complete",
    eyebrow: "Season 1 · Opening chapter",
    summary:
      "Thirty-two franchises now have their coaches. The draft room lights are off — and the real story of the league begins.",
    body: `The Kings Madden League team draft is officially in the books.

Every coach has a franchise. Every franchise has a narrative. Some walked away with dream destinations. Others accepted challenge jobs and started sketching turnaround blueprints before the call even ended.

This is the moment every league remembers later — the night the map stopped being blank.

From here, contracts start ticking, reputations start moving, and Week 1 becomes more than a schedule. It becomes the first chapter of who survives, who rises, and who gets written into league lore.

Welcome to Season 1. The draft is done. Now the games matter.`,
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

Watch for coaches who look organized out of the gate, defenses that set an identity early, and any surprise result that flips the league chat overnight.

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
      "Everyone starts with a contract and a reputation. Not everyone will keep both.",
    body: `The draft handed out opportunity. The season will hand out judgment.

Some coaches inherit win-now expectations. Others get runway to build. Either way, reputation, contracts, and job security are now part of the product — not just the box score.

Stay locked into the Coach Hub for hot seats, carousel windows, and the long game of franchise identity.`,
    isFeatured: false,
    sortOrder: 30,
  },
] as const;

/** Ensures the welcoming front-page stories exist (safe for production without reseeding). */
export async function ensureDefaultLeagueStories(seasonId?: string) {
  for (const story of DEFAULT_STORIES) {
    await prisma.leagueStory.upsert({
      where: { slug: story.slug },
      update: {},
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
