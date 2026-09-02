export const SIM_SCORE_OPTIONS = [
  { value: 5, label: "5 — Elite sim" },
  { value: 4, label: "4 — Strong sim" },
  { value: 3, label: "3 — Acceptable" },
  { value: 2, label: "2 — Poor (counts toward Bad Sim for them)" },
  { value: 1, label: "1 — Very poor (counts toward Bad Sim for them)" },
] as const;

export type SimScoreSides = {
  userTeamId: string;
  opponentTeamId: string;
  opponentSimScore: number | null;
  userTeamSimScore: number | null;
};

export type OutstandingSimScore = {
  ratedTeamId: string;
  alreadySubmitted: boolean;
};

/** Sim Score a franchise received from the other coach. */
export function simScoreForTeam(
  game: SimScoreSides,
  franchiseId: string
): number | null {
  if (franchiseId === game.opponentTeamId) return game.opponentSimScore;
  if (franchiseId === game.userTeamId) return game.userTeamSimScore;
  return null;
}

/** Sim Score this franchise still owes on the opposing team. */
export function myOutstandingSimScore(
  game: SimScoreSides,
  myFranchiseId: string
): OutstandingSimScore | null {
  if (myFranchiseId === game.userTeamId) {
    return {
      ratedTeamId: game.opponentTeamId,
      alreadySubmitted: game.opponentSimScore != null,
    };
  }
  if (myFranchiseId === game.opponentTeamId) {
    return {
      ratedTeamId: game.userTeamId,
      alreadySubmitted: game.userTeamSimScore != null,
    };
  }
  return null;
}

export function coachOwesSimScore(
  game: SimScoreSides & { isForceWin?: boolean },
  myFranchiseId: string
) {
  if (game.isForceWin) return false;
  const outstanding = myOutstandingSimScore(game, myFranchiseId);
  return Boolean(outstanding && !outstanding.alreadySubmitted);
}

export function outstandingSimScoresForCoach<
  T extends SimScoreSides & { week: number; isForceWin?: boolean },
>(games: T[], myFranchiseId: string, currentWeek: number) {
  return games
    .map((game) => ({
      game,
      outstanding: myOutstandingSimScore(game, myFranchiseId),
    }))
    .filter(
      (
        row
      ): row is typeof row & { outstanding: NonNullable<typeof row.outstanding> } =>
        Boolean(
          !row.game.isForceWin &&
            row.outstanding &&
            !row.outstanding.alreadySubmitted
        )
    )
    .sort((a, b) => {
      const aNow = a.game.week === currentWeek ? 0 : 1;
      const bNow = b.game.week === currentWeek ? 0 : 1;
      if (aNow !== bNow) return aNow - bNow;
      return b.game.week - a.game.week;
    });
}

export function averageSimScore(scores: Array<number | null | undefined>) {
  const values = scores.filter(
    (score): score is number => score != null && Number.isFinite(score)
  );
  if (values.length === 0) {
    return { average: null, count: 0 };
  }
  const sum = values.reduce((total, score) => total + score, 0);
  return {
    average: Math.round((sum / values.length) * 10) / 10,
    count: values.length,
  };
}

export function formatAverageSimScore(average: number | null, count = 0) {
  if (average == null || count === 0) return "—";
  return average.toFixed(1);
}

export function formatTeamSimScore(
  abbreviation: string,
  score: number | null | undefined
) {
  if (score == null) return `${abbreviation} Sim pending`;
  return `${abbreviation} Sim ${score}/5`;
}

export function formatBothSimScores(game: {
  userTeam: { abbreviation: string };
  opponentTeam: { abbreviation: string };
  opponentSimScore: number | null;
  userTeamSimScore: number | null;
  isForceWin?: boolean;
}) {
  if (game.isForceWin) return "No Sim Score — force win";
  return [
    formatTeamSimScore(game.userTeam.abbreviation, game.userTeamSimScore),
    formatTeamSimScore(game.opponentTeam.abbreviation, game.opponentSimScore),
  ].join(" · ");
}

/** Abbreviations of coaches who still need to rate the other side. */
export function teamsOwingSimScore(game: {
  userTeam: { abbreviation: string };
  opponentTeam: { abbreviation: string };
  opponentSimScore: number | null;
  userTeamSimScore: number | null;
  isForceWin?: boolean;
}) {
  if (game.isForceWin) return [];
  const missing: string[] = [];
  if (game.opponentSimScore == null) missing.push(game.userTeam.abbreviation);
  if (game.userTeamSimScore == null) missing.push(game.opponentTeam.abbreviation);
  return missing;
}
