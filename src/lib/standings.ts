export type StandingRow = {
  franchiseId: string;
  name: string;
  abbreviation: string;
  conference: string;
  division: string;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  form: string;
};

type ResultLike = {
  week: number;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  winnerTeamId: string | null;
};

type FranchiseLike = {
  id: string;
  name: string;
  abbreviation: string;
  conference: string;
  division: string;
};

export function computeStandings(
  franchises: FranchiseLike[],
  results: ResultLike[]
): StandingRow[] {
  const map = new Map<string, StandingRow & { recent: ("W" | "L" | "T")[] }>();

  for (const f of franchises) {
    map.set(f.id, {
      franchiseId: f.id,
      name: f.name,
      abbreviation: f.abbreviation,
      conference: f.conference,
      division: f.division,
      wins: 0,
      losses: 0,
      ties: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      form: "",
      recent: [],
    });
  }

  const ordered = [...results].sort((a, b) => a.week - b.week);

  for (const result of ordered) {
    const home = map.get(result.homeTeamId);
    const away = map.get(result.awayTeamId);
    if (!home || !away) continue;

    home.pointsFor += result.homeScore;
    home.pointsAgainst += result.awayScore;
    away.pointsFor += result.awayScore;
    away.pointsAgainst += result.homeScore;

    if (!result.winnerTeamId) {
      home.ties += 1;
      away.ties += 1;
      home.recent.push("T");
      away.recent.push("T");
    } else if (result.winnerTeamId === home.franchiseId) {
      home.wins += 1;
      away.losses += 1;
      home.recent.push("W");
      away.recent.push("L");
    } else {
      away.wins += 1;
      home.losses += 1;
      away.recent.push("W");
      home.recent.push("L");
    }
  }

  return [...map.values()]
    .map((row) => ({
      franchiseId: row.franchiseId,
      name: row.name,
      abbreviation: row.abbreviation,
      conference: row.conference,
      division: row.division,
      wins: row.wins,
      losses: row.losses,
      ties: row.ties,
      pointsFor: row.pointsFor,
      pointsAgainst: row.pointsAgainst,
      form: row.recent.slice(-5).join(""),
    }))
    .sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (a.losses !== b.losses) return a.losses - b.losses;
      const aDiff = a.pointsFor - a.pointsAgainst;
      const bDiff = b.pointsFor - b.pointsAgainst;
      if (bDiff !== aDiff) return bDiff - aDiff;
      return b.pointsFor - a.pointsFor;
    });
}

export function getTeamRecord(
  franchiseId: string,
  standings: StandingRow[]
): StandingRow | undefined {
  return standings.find((s) => s.franchiseId === franchiseId);
}
