import { prisma } from "@/lib/prisma";

export const STORY_REACTION_OPTIONS = [
  { key: "fire", emoji: "🔥", label: "Fire" },
  { key: "like", emoji: "👍", label: "Like" },
  { key: "laugh", emoji: "😂", label: "Laugh" },
  { key: "shocked", emoji: "😮", label: "Shocked" },
  { key: "clap", emoji: "👏", label: "Clap" },
] as const;

export type StoryReactionKey = (typeof STORY_REACTION_OPTIONS)[number]["key"];

export const STORY_REACTION_KEYS = [
  "fire",
  "like",
  "laugh",
  "shocked",
  "clap",
] as const;

export type StoryPollView = {
  id: string;
  title: string;
  isOpen: boolean;
  totalVoters: number;
  questions: Array<{
    id: string;
    prompt: string;
    myOptionId: string | null;
    totalVotes: number;
    finalScore: string | null;
    options: Array<{
      id: string;
      label: string;
      franchiseAbbr: string | null;
      votes: number;
      lean: "favorite" | "underdog" | "split" | null;
      result: "won" | "lost" | null;
    }>;
  }>;
};

export type StoryReactionView = {
  key: StoryReactionKey;
  emoji: string;
  label: string;
  count: number;
  mine: boolean;
};

export type StoryCommentView = {
  id: string;
  body: string;
  createdAt: string;
  authorName: string;
  authorUserId: string;
  isMine: boolean;
};

export type StoryEngagementView = {
  storyId: string;
  slug: string;
  poll: StoryPollView | null;
  reactions: StoryReactionView[];
  comments: StoryCommentView[];
};

export type CoachPickLean = {
  userId: string;
  name: string;
  franchiseAbbr: string | null;
  pickedToWin: number;
  appearances: number;
  pickRate: number;
};

type DefaultPollOption = {
  label: string;
  franchiseAbbr: string;
};

type DefaultPollQuestion = {
  prompt: string;
  options: [DefaultPollOption, DefaultPollOption];
};

type DefaultStoryPoll = {
  storySlug: string;
  key: string;
  title: string;
  questions: DefaultPollQuestion[];
};

const DEFAULT_STORY_POLLS: DefaultStoryPoll[] = [
  {
    storySlug: "season-1-week-1-primetime",
    key: "week-1-primetime",
    title: "Week 1 Primetime lock-in",
    questions: [
      {
        prompt: "Season Opener — Seahawks vs Patriots",
        options: [
          { label: "Petey · Seahawks", franchiseAbbr: "SEA" },
          { label: "Ren · Patriots", franchiseAbbr: "NE" },
        ],
      },
      {
        prompt: "Monday Night Football — Chiefs vs Broncos",
        options: [
          { label: "Trent · Chiefs", franchiseAbbr: "KC" },
          { label: "Puddin · Broncos", franchiseAbbr: "DEN" },
        ],
      },
      {
        prompt: "Thursday Night Football — Rams vs 49ers",
        options: [
          { label: "Jordan Stowe · Rams", franchiseAbbr: "LAR" },
          { label: "Swipe · 49ers", franchiseAbbr: "SF" },
        ],
      },
      {
        prompt: "Sunday Night Football — Cowboys vs Giants",
        options: [
          { label: "Jsmood · Cowboys", franchiseAbbr: "DAL" },
          { label: "Biz · Giants", franchiseAbbr: "NYG" },
        ],
      },
    ],
  },
];

function isMissingEngagementTable(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String(error.code) : "";
  return code === "P2021" || code === "P2022";
}

export async function resolveFranchiseCoach(
  seasonId: string | null | undefined,
  franchiseAbbr: string | null | undefined
) {
  const abbr = franchiseAbbr?.trim().toUpperCase();
  if (!abbr) return { franchiseId: null, coachUserId: null, franchiseAbbr: null };

  const franchise = await prisma.franchise.findUnique({
    where: { abbreviation: abbr },
    select: { id: true, abbreviation: true },
  });
  if (!franchise) {
    return { franchiseId: null, coachUserId: null, franchiseAbbr: abbr };
  }

  let coachUserId: string | null = null;
  if (seasonId) {
    const membership = await prisma.leagueMembership.findFirst({
      where: {
        seasonId,
        franchiseId: franchise.id,
        isActive: true,
        user: { deletedAt: null },
      },
      select: { userId: true },
    });
    coachUserId = membership?.userId ?? null;
  }

  return {
    franchiseId: franchise.id,
    coachUserId,
    franchiseAbbr: franchise.abbreviation,
  };
}

export async function ensureDefaultStoryPolls() {
  for (const poll of DEFAULT_STORY_POLLS) {
    const story = await prisma.leagueStory.findUnique({
      where: { slug: poll.storySlug },
      select: { id: true, seasonId: true },
    });
    if (!story) continue;

    const existing = await prisma.storyPoll.findUnique({
      where: { storyId_key: { storyId: story.id, key: poll.key } },
      select: { id: true },
    });
    if (existing) continue;

    const resolvedOptions = await Promise.all(
      poll.questions.flatMap((question) =>
        question.options.map(async (option) => ({
          ...option,
          refs: await resolveFranchiseCoach(story.seasonId, option.franchiseAbbr),
        }))
      )
    );

    await prisma.storyPoll.create({
      data: {
        storyId: story.id,
        key: poll.key,
        title: poll.title,
        questions: {
          create: poll.questions.map((question, questionIndex) => ({
            prompt: question.prompt,
            sortOrder: questionIndex,
            options: {
              create: question.options.map((option, optionIndex) => {
                const resolved = resolvedOptions.find(
                  (row) =>
                    row.label === option.label &&
                    row.franchiseAbbr === option.franchiseAbbr
                );
                return {
                  label: option.label,
                  franchiseAbbr: resolved?.refs.franchiseAbbr ?? option.franchiseAbbr,
                  franchiseId: resolved?.refs.franchiseId,
                  coachUserId: resolved?.refs.coachUserId,
                  sortOrder: optionIndex,
                };
              }),
            },
          })),
        },
      },
    });
  }
}

function leanForOptions(votes: number[]) {
  const max = Math.max(...votes);
  const min = Math.min(...votes);
  if (votes.every((count) => count === 0) || max === min) {
    return votes.map(() => "split" as const);
  }
  return votes.map((count) => (count === max ? ("favorite" as const) : ("underdog" as const)));
}

type MatchupResult = {
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  winnerTeamId: string | null;
  homeTeam: { abbreviation: string };
  awayTeam: { abbreviation: string };
};

function findQuestionMatchup(
  results: MatchupResult[],
  franchiseIds: Array<string | null | undefined>
) {
  const ids = franchiseIds.filter((id): id is string => Boolean(id));
  if (ids.length < 2) return null;
  return (
    results.find((row) => {
      const teams = new Set([row.homeTeamId, row.awayTeamId]);
      return ids.every((id) => teams.has(id));
    }) ?? null
  );
}

function optionResult(
  matchup: MatchupResult | null,
  franchiseId: string | null | undefined
): "won" | "lost" | null {
  if (!matchup || !franchiseId || !matchup.winnerTeamId) return null;
  if (matchup.homeTeamId !== franchiseId && matchup.awayTeamId !== franchiseId) {
    return null;
  }
  return matchup.winnerTeamId === franchiseId ? "won" : "lost";
}

function formatQuestionFinalScore(
  matchup: MatchupResult | null,
  options: Array<{ franchiseId: string | null; franchiseAbbr: string | null }>
) {
  if (!matchup) return null;
  const parts = options.map((option) => {
    if (!option.franchiseId) return null;
    const score =
      option.franchiseId === matchup.homeTeamId
        ? matchup.homeScore
        : option.franchiseId === matchup.awayTeamId
          ? matchup.awayScore
          : null;
    const abbr =
      option.franchiseAbbr ??
      (option.franchiseId === matchup.homeTeamId
        ? matchup.homeTeam.abbreviation
        : matchup.awayTeam.abbreviation);
    if (score == null) return null;
    return { abbr, score };
  });
  if (parts.length !== 2 || parts.some((part) => !part)) return null;
  return `${parts[0]!.abbr} ${parts[0]!.score}–${parts[1]!.score} ${parts[1]!.abbr}`;
}

export async function getStoryEngagement(
  storyId: string,
  userId?: string | null
): Promise<StoryEngagementView | null> {
  const story = await prisma.leagueStory.findUnique({
    where: { id: storyId },
    select: { id: true, slug: true, seasonId: true, week: true },
  });
  if (!story) return null;

  const pollRow = await prisma.storyPoll.findFirst({
    where: { storyId },
    orderBy: { createdAt: "asc" },
    include: {
      questions: {
        orderBy: { sortOrder: "asc" },
        include: {
          options: { orderBy: { sortOrder: "asc" } },
        },
      },
    },
  });

  if (pollRow) {
    const franchiseIds = [
      ...new Set(
        pollRow.questions.flatMap((question) =>
          question.options
            .map((option) => option.franchiseId)
            .filter((id): id is string => Boolean(id))
        )
      ),
    ];

    const [voteCounts, myVotes, matchupResults] = await Promise.all([
      prisma.storyPollVote.groupBy({
        by: ["questionId", "optionId"],
        where: { question: { pollId: pollRow.id } },
        _count: { _all: true },
      }),
      userId
        ? prisma.storyPollVote.findMany({
            where: { userId, question: { pollId: pollRow.id } },
            select: { questionId: true, optionId: true },
          })
        : Promise.resolve([]),
      story.seasonId && franchiseIds.length >= 2
        ? prisma.gameResult.findMany({
            where: {
              seasonId: story.seasonId,
              isVoided: false,
              ...(story.week ? { week: story.week } : {}),
              homeTeamId: { in: franchiseIds },
              awayTeamId: { in: franchiseIds },
            },
            orderBy: [{ week: "asc" }, { createdAt: "asc" }],
            select: {
              homeTeamId: true,
              awayTeamId: true,
              homeScore: true,
              awayScore: true,
              winnerTeamId: true,
              homeTeam: { select: { abbreviation: true } },
              awayTeam: { select: { abbreviation: true } },
            },
          })
        : Promise.resolve([]),
    ]);

    const countMap = new Map(
      voteCounts.map((row) => [`${row.questionId}:${row.optionId}`, row._count._all])
    );
    const myMap = new Map(myVotes.map((row) => [row.questionId, row.optionId]));
    const voterIds = await prisma.storyPollVote.findMany({
      where: { question: { pollId: pollRow.id } },
      distinct: ["userId"],
      select: { userId: true },
    });

    return {
      storyId: story.id,
      slug: story.slug,
      poll: {
        id: pollRow.id,
        title: pollRow.title,
        isOpen: pollRow.isOpen,
        totalVoters: voterIds.length,
        questions: pollRow.questions.map((question) => {
          const optionVotes = question.options.map(
            (option) => countMap.get(`${question.id}:${option.id}`) ?? 0
          );
          const leans = leanForOptions(optionVotes);
          const totalVotes = optionVotes.reduce((sum, count) => sum + count, 0);
          const matchup = findQuestionMatchup(
            matchupResults,
            question.options.map((option) => option.franchiseId)
          );
          return {
            id: question.id,
            prompt: question.prompt,
            myOptionId: myMap.get(question.id) ?? null,
            totalVotes,
            finalScore: formatQuestionFinalScore(matchup, question.options),
            options: question.options.map((option, index) => ({
              id: option.id,
              label: option.label,
              franchiseAbbr: option.franchiseAbbr,
              votes: optionVotes[index] ?? 0,
              lean: totalVotes > 0 ? leans[index] : null,
              result: optionResult(matchup, option.franchiseId),
            })),
          };
        }),
      },
      reactions: [],
      comments: [],
    };
  }

  const [reactionRows, myReactions, commentRows] = await Promise.all([
    prisma.storyReaction.groupBy({
      by: ["emoji"],
      where: { storyId },
      _count: { _all: true },
    }),
    userId
      ? prisma.storyReaction.findMany({
          where: { storyId, userId },
          select: { emoji: true },
        })
      : Promise.resolve([]),
    prisma.storyComment.findMany({
      where: { storyId },
      orderBy: { createdAt: "asc" },
      take: 80,
      include: { user: { select: { name: true } } },
    }),
  ]);

  const reactionCounts = new Map(reactionRows.map((row) => [row.emoji, row._count._all]));
  const mine = new Set(myReactions.map((row) => row.emoji));

  return {
    storyId: story.id,
    slug: story.slug,
    poll: null,
    reactions: STORY_REACTION_OPTIONS.map((option) => ({
      ...option,
      count: reactionCounts.get(option.key) ?? 0,
      mine: mine.has(option.key),
    })),
    comments: commentRows.map((row) => ({
      id: row.id,
      body: row.body,
      createdAt: row.createdAt.toISOString(),
      authorName: row.user.name?.trim() || "League coach",
      authorUserId: row.userId,
      isMine: row.userId === userId,
    })),
  };
}

export async function getCoachPickLean(): Promise<CoachPickLean[]> {
  const options = await prisma.storyPollOption.findMany({
    where: { coachUserId: { not: null } },
    select: {
      coachUserId: true,
      franchiseAbbr: true,
      coach: { select: { name: true } },
      _count: { select: { votes: true } },
      question: { select: { _count: { select: { votes: true } } } },
    },
  });

  const byCoach = new Map<
    string,
    { name: string; franchiseAbbr: string | null; pickedToWin: number; appearances: number }
  >();

  for (const option of options) {
    if (!option.coachUserId) continue;
    const current = byCoach.get(option.coachUserId) ?? {
      name: option.coach?.name?.trim() || "League coach",
      franchiseAbbr: option.franchiseAbbr,
      pickedToWin: 0,
      appearances: 0,
    };
    current.pickedToWin += option._count.votes;
    current.appearances += option.question._count.votes;
    current.franchiseAbbr = option.franchiseAbbr ?? current.franchiseAbbr;
    byCoach.set(option.coachUserId, current);
  }

  return [...byCoach.entries()]
    .map(([userId, row]) => ({
      userId,
      name: row.name,
      franchiseAbbr: row.franchiseAbbr,
      pickedToWin: row.pickedToWin,
      appearances: row.appearances,
      pickRate: row.appearances > 0 ? row.pickedToWin / row.appearances : 0,
    }))
    .sort((a, b) => b.pickRate - a.pickRate || b.pickedToWin - a.pickedToWin);
}

export async function safeEnsureDefaultStoryPolls() {
  try {
    await ensureDefaultStoryPolls();
  } catch (error) {
    if (!isMissingEngagementTable(error)) {
      console.error("ensureDefaultStoryPolls failed:", error);
    }
  }
}

export async function safeGetStoryEngagement(
  storyId: string,
  userId?: string | null
): Promise<StoryEngagementView | null> {
  try {
    return await getStoryEngagement(storyId, userId);
  } catch (error) {
    if (!isMissingEngagementTable(error)) {
      console.error("getStoryEngagement failed:", error);
    }
    return null;
  }
}
