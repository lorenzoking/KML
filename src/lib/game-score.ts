export function hasFinalScores(game: {
  userScore: number | null | undefined;
  opponentScore: number | null | undefined;
}) {
  return game.userScore != null && game.opponentScore != null;
}

export function formatMatchupScore(game: {
  userTeam: { abbreviation: string };
  opponentTeam: { abbreviation: string };
  userScore: number | null | undefined;
  opponentScore: number | null | undefined;
  isForceWin?: boolean;
}) {
  const user = game.userTeam.abbreviation;
  const opp = game.opponentTeam.abbreviation;
  if (!hasFinalScores(game)) {
    return game.isForceWin
      ? `${user} vs ${opp} · force win (score pending)`
      : `${user} vs ${opp}`;
  }
  const line = `${user} ${game.userScore}–${game.opponentScore} ${opp}`;
  return game.isForceWin ? `${line} · force win` : line;
}
