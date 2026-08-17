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
  opponentSimScore: number;
  userTeamSimScore: number | null;
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
): { ratedTeamId: string; alreadySubmitted: boolean } | null {
  if (myFranchiseId === game.userTeamId) {
    return {
      ratedTeamId: game.opponentTeamId,
      alreadySubmitted: true,
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
  opponentSimScore: number;
  userTeamSimScore: number | null;
}) {
  return [
    formatTeamSimScore(game.userTeam.abbreviation, game.userTeamSimScore),
    formatTeamSimScore(game.opponentTeam.abbreviation, game.opponentSimScore),
  ].join(" · ");
}
