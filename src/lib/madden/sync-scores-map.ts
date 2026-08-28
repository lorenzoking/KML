/** Madden Companion weekType from the export path. Null means the dump had no path. */
export function shouldSyncCompanionWeekType(weekType: string | null | undefined) {
  if (weekType == null || weekType === "") return true;
  return weekType === "reg";
}

export function scoresForSiteSubmitter(params: {
  userTeamId: string;
  homeFranchiseId: string;
  homeScore: number;
  awayScore: number;
}) {
  const userIsHome = params.userTeamId === params.homeFranchiseId;
  return {
    userScore: userIsHome ? params.homeScore : params.awayScore,
    opponentScore: userIsHome ? params.awayScore : params.homeScore,
  };
}

export function autoFileSides(params: {
  simulated: boolean;
  homeFranchiseId: string;
  awayFranchiseId: string;
  homeScore: number;
  awayScore: number;
}) {
  const tied = params.homeScore === params.awayScore;
  const isForceWin = params.simulated && !tied;
  if (!isForceWin) {
    return {
      isForceWin: false,
      userTeamId: params.homeFranchiseId,
      opponentTeamId: params.awayFranchiseId,
      userScore: params.homeScore,
      opponentScore: params.awayScore,
    };
  }
  const homeWon = params.homeScore > params.awayScore;
  return {
    isForceWin: true,
    userTeamId: homeWon ? params.homeFranchiseId : params.awayFranchiseId,
    opponentTeamId: homeWon ? params.awayFranchiseId : params.homeFranchiseId,
    userScore: homeWon ? params.homeScore : params.awayScore,
    opponentScore: homeWon ? params.awayScore : params.homeScore,
  };
}
