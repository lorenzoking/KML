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

export type PollCoachRecord = {
  userId: string;
  name: string;
  franchiseAbbr: string | null;
  correct: number;
  wrong: number;
  isMine: boolean;
};

export type StoryPollView = {
  id: string;
  title: string;
  isOpen: boolean;
  totalVoters: number;
  gradedMatchups: number;
  leaderboard: PollCoachRecord[];
  questions: Array<{
    id: string;
    prompt: string;
    myOptionId: string | null;
    totalVotes: number;
    finalScore: string | null;
    resultSource: "approved" | "declared" | null;
    declaredWinnerOptionId: string | null;
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
  options: DefaultPollOption[];
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
  {
    storySlug: "season-1-week-2-primetime",
    key: "week-2-primetime",
    title: "Week 2 Primetime lock-in",
    questions: [
      {
        prompt: "Thursday Night Football — 49ers vs Dolphins",
        options: [
          { label: "Swipe · 49ers", franchiseAbbr: "SF" },
          { label: "Mease · Dolphins", franchiseAbbr: "MIA" },
        ],
      },
      {
        prompt: "Sunday Night Football — Patriots vs Steelers",
        options: [
          { label: "Ren · Patriots", franchiseAbbr: "NE" },
          { label: "Big Al · Steelers", franchiseAbbr: "PIT" },
        ],
      },
      {
        prompt: "Monday Night Football — Rams vs Giants",
        options: [
          { label: "Jordan Stowe · Rams", franchiseAbbr: "LAR" },
          { label: "Biz · Giants", franchiseAbbr: "NYG" },
        ],
      },
    ],
  },
  {
    storySlug: "season-1-week-3-primetime",
    key: "week-3-primetime",
    title: "Week 3 Primetime lock-in",
    questions: [
      {
        prompt: "Thursday Night Football — Bears vs Eagles",
        options: [
          { label: "Jaylen Stowe · Bears", franchiseAbbr: "CHI" },
          { label: "Lefty · Eagles", franchiseAbbr: "PHI" },
        ],
      },
      {
        prompt: "Sunday Night Football — Ravens vs Cowboys",
        options: [
          { label: "Quise · Ravens", franchiseAbbr: "BAL" },
          { label: "Javon · Cowboys", franchiseAbbr: "DAL" },
        ],
      },
      {
        prompt: "Monday Night Football — Chargers vs Bills",
        options: [
          { label: "Oli · Chargers", franchiseAbbr: "LAC" },
          { label: "Pryor · Bills", franchiseAbbr: "BUF" },
        ],
      },
    ],
  },
  {
    storySlug: "season-1-week-4-primetime",
    key: "week-4-primetime",
    title: "Week 4 Primetime lock-in",
    questions: [
      {
        prompt: "Thursday Night Football — Packers vs Buccaneers",
        options: [
          { label: "Chance · Packers", franchiseAbbr: "GB" },
          { label: "Dre · Buccaneers", franchiseAbbr: "TB" },
        ],
      },
      {
        prompt: "Sunday Night Football — Chargers vs Seahawks",
        options: [
          { label: "Oli · Chargers", franchiseAbbr: "LAC" },
          { label: "Petey · Seahawks", franchiseAbbr: "SEA" },
        ],
      },
      {
        prompt: "Monday Night Football — Rams vs Eagles",
        options: [
          { label: "Jordan Stowe · Rams", franchiseAbbr: "LAR" },
          { label: "Lefty · Eagles", franchiseAbbr: "PHI" },
        ],
      },
    ],
  },
  {
    storySlug: "season-1-week-5-primetime",
    key: "week-5-primetime",
    title: "Week 5 Primetime lock-in",
    questions: [
      {
        prompt: "Game of the Week — Lions vs Cardinals",
        options: [
          { label: "Curry · Lions", franchiseAbbr: "DET" },
          { label: "Dooders · Cardinals", franchiseAbbr: "ARI" },
        ],
      },
      {
        prompt: "Divisional battle — Packers vs Bears",
        options: [
          { label: "Chance · Packers", franchiseAbbr: "GB" },
          { label: "Jaylen Stowe · Bears", franchiseAbbr: "CHI" },
        ],
      },
      {
        prompt: "Buccaneers vs Cowboys",
        options: [
          { label: "Swagg · Buccaneers", franchiseAbbr: "TB" },
          { label: "Javon · Cowboys", franchiseAbbr: "DAL" },
        ],
      },
      {
        prompt: "Colts vs Steelers",
        options: [
          { label: "Quon · Colts", franchiseAbbr: "IND" },
          { label: "Big Al · Steelers", franchiseAbbr: "PIT" },
        ],
      },
    ],
  },
  {
    storySlug: "season-1-week-7-primetime",
    key: "week-7-primetime",
    title: "Week 7 Primetime lock-in",
    questions: [
      {
        prompt: "Game of the Week — Patriots vs Bears",
        options: [
          { label: "Ren · Patriots", franchiseAbbr: "NE" },
          { label: "Jaylen Stowe · Bears", franchiseAbbr: "CHI" },
        ],
      },
      {
        prompt: "Eagles vs Cowboys",
        options: [
          { label: "Lefty · Eagles", franchiseAbbr: "PHI" },
          { label: "Javon · Cowboys", franchiseAbbr: "DAL" },
        ],
      },
      {
        prompt: "Lions vs Packers",
        options: [
          { label: "Curry · Lions", franchiseAbbr: "DET" },
          { label: "Chance · Packers", franchiseAbbr: "GB" },
        ],
      },
      {
        prompt: "Seahawks vs Chiefs",
        options: [
          { label: "Petey · Seahawks", franchiseAbbr: "SEA" },
          { label: "Trent · Chiefs", franchiseAbbr: "KC" },
        ],
      },
    ],
  },
  {
    storySlug: "season-1-week-7-power-rankings",
    key: "week-7-power-rankings",
    title: "Week 7 Power Rankings lock-in",
    questions: [
      {
        prompt: "Who is actually #1?",
        options: [
          { label: "Lefty · Eagles", franchiseAbbr: "PHI" },
          { label: "Ren · Patriots", franchiseAbbr: "NE" },
        ],
      },
      {
        prompt: "Who is ranked too high?",
        options: [
          { label: "Curry · Lions", franchiseAbbr: "DET" },
          { label: "Oli · Chargers", franchiseAbbr: "LAC" },
          { label: "Chance · Packers", franchiseAbbr: "GB" },
        ],
      },
      {
        prompt: "First team into the top 10 next week?",
        options: [
          { label: "Jordan Stowe · Rams", franchiseAbbr: "LAR" },
          { label: "Swipe · 49ers", franchiseAbbr: "SF" },
          { label: "Mease · Dolphins", franchiseAbbr: "MIA" },
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

function formatDeclaredWinner(
  options: Array<{ id: string; franchiseAbbr: string | null; label: string }>,
  declaredWinnerOptionId: string | null
) {
  if (!declaredWinnerOptionId) return null;
  const winner = options.find((option) => option.id === declaredWinnerOptionId);
  if (!winner) return null;
  const label = winner.franchiseAbbr ?? winner.label;
  return `${label} won (desk call)`;
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

function buildPollLeaderboard(
  questions: StoryPollView["questions"],
  votes: Array<{
    userId: string;
    questionId: string;
    optionId: string;
    user: { name: string | null };
  }>,
  memberships: Array<{ userId: string; franchise: { abbreviation: string } }>,
  viewerId?: string | null
): PollCoachRecord[] {
  const winnerByQuestion = new Map(
    questions
      .map((question) => {
        const winner = question.options.find((option) => option.result === "won");
        return winner ? ([question.id, winner.id] as const) : null;
      })
      .filter((row): row is readonly [string, string] => Boolean(row))
  );
  if (winnerByQuestion.size === 0) return [];

  const teamByUser = new Map(
    memberships.map((row) => [row.userId, row.franchise.abbreviation])
  );
  const byUser = new Map<
    string,
    { name: string; correct: number; wrong: number }
  >();

  for (const vote of votes) {
    const winnerId = winnerByQuestion.get(vote.questionId);
    if (!winnerId) continue;
    const current = byUser.get(vote.userId) ?? {
      name: vote.user.name?.trim() || "League coach",
      correct: 0,
      wrong: 0,
    };
    if (vote.optionId === winnerId) current.correct += 1;
    else current.wrong += 1;
    byUser.set(vote.userId, current);
  }

  return [...byUser.entries()]
    .map(([id, row]) => ({
      userId: id,
      name: row.name,
      franchiseAbbr: teamByUser.get(id) ?? null,
      correct: row.correct,
      wrong: row.wrong,
      isMine: id === viewerId,
    }))
    .sort(
      (a, b) =>
        b.correct - a.correct ||
        a.wrong - b.wrong ||
        a.name.localeCompare(b.name)
    );
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

    const [voteCounts, myVotes, matchupResults, allVotes, memberships] = await Promise.all([
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
      prisma.storyPollVote.findMany({
        where: { question: { pollId: pollRow.id }, user: { deletedAt: null } },
        select: {
          userId: true,
          questionId: true,
          optionId: true,
          user: { select: { name: true } },
        },
      }),
      story.seasonId
        ? prisma.leagueMembership.findMany({
            where: { seasonId: story.seasonId, isActive: true },
            select: {
              userId: true,
              franchise: { select: { abbreviation: true } },
            },
          })
        : Promise.resolve([]),
    ]);

    const countMap = new Map(
      voteCounts.map((row) => [`${row.questionId}:${row.optionId}`, row._count._all])
    );
    const myMap = new Map(myVotes.map((row) => [row.questionId, row.optionId]));
    const questions = pollRow.questions.map((question) => {
      const optionVotes = question.options.map(
        (option) => countMap.get(`${question.id}:${option.id}`) ?? 0
      );
      const leans = leanForOptions(optionVotes);
      const totalVotes = optionVotes.reduce((sum, count) => sum + count, 0);
      const matchup = findQuestionMatchup(
        matchupResults,
        question.options.map((option) => option.franchiseId)
      );
      const declaredWinnerOptionId = matchup
        ? null
        : question.declaredWinnerOptionId;
      const resultSource: "approved" | "declared" | null = matchup?.winnerTeamId
        ? "approved"
        : declaredWinnerOptionId
          ? "declared"
          : null;
      return {
        id: question.id,
        prompt: question.prompt,
        myOptionId: myMap.get(question.id) ?? null,
        totalVotes,
        finalScore:
          formatQuestionFinalScore(matchup, question.options) ??
          formatDeclaredWinner(question.options, declaredWinnerOptionId),
        resultSource,
        declaredWinnerOptionId,
        options: question.options.map((option, index) => ({
          id: option.id,
          label: option.label,
          franchiseAbbr: option.franchiseAbbr,
          votes: optionVotes[index] ?? 0,
          lean: totalVotes > 0 ? leans[index] : null,
          result:
            optionResult(matchup, option.franchiseId) ??
            (declaredWinnerOptionId
              ? option.id === declaredWinnerOptionId
                ? "won"
                : "lost"
              : null),
        })),
      };
    });
    const leaderboard = buildPollLeaderboard(questions, allVotes, memberships, userId);

    return {
      storyId: story.id,
      slug: story.slug,
      poll: {
        id: pollRow.id,
        title: pollRow.title,
        isOpen: pollRow.isOpen,
        totalVoters: new Set(allVotes.map((vote) => vote.userId)).size,
        gradedMatchups: questions.filter((question) =>
          question.options.some((option) => option.result === "won")
        ).length,
        leaderboard,
        questions,
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

export async function getOpenPollsNeedingVote(userId: string) {
  const polls = await prisma.storyPoll.findMany({
    where: {
      isOpen: true,
      story: { isPublished: true },
    },
    include: {
      story: { select: { slug: true, title: true, week: true } },
      questions: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  if (polls.length === 0) return [];

  const questionIds = polls.flatMap((poll) => poll.questions.map((question) => question.id));
  const votes = await prisma.storyPollVote.findMany({
    where: { userId, questionId: { in: questionIds } },
    select: { questionId: true },
  });
  const voted = new Set(votes.map((vote) => vote.questionId));

  return polls
    .map((poll) => {
      const remaining = poll.questions.filter((question) => !voted.has(question.id)).length;
      return {
        id: poll.id,
        href: `/storylines/${poll.story.slug}`,
        title: poll.title,
        remaining,
        total: poll.questions.length,
      };
    })
    .filter((poll) => poll.remaining > 0);
}

export async function safeGetOpenPollsNeedingVote(userId: string) {
  try {
    return await getOpenPollsNeedingVote(userId);
  } catch (error) {
    if (!isMissingEngagementTable(error)) {
      console.error("getOpenPollsNeedingVote failed:", error);
    }
    return [];
  }
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
