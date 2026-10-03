import {
  PLAYOFF_ROUNDS,
  PLAYOFF_START_WEEK,
  SUPER_BOWL_WEEK,
  type PlayoffRoundId,
} from "@/lib/league-week";
import type { StandingRow } from "@/lib/standings";

export type ResultLike = {
  homeTeamId: string;
  awayTeamId: string;
  winnerTeamId: string | null;
};

export type PlayoffSeed = {
  seed: number;
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
  divisionWinner: boolean;
  primaryColor?: string | null;
};

export type PlayoffField = {
  afc: PlayoffSeed[];
  nfc: PlayoffSeed[];
};

export type BracketSlotStatus = "tbd" | "scheduled" | "pending" | "final";

export type BracketSlot = {
  id: string;
  week: number;
  round: PlayoffRoundId;
  conference: "AFC" | "NFC" | "NFL";
  label: string;
  home: PlayoffSeed | null;
  away: PlayoffSeed | null;
  homeScore: number | null;
  awayScore: number | null;
  winnerFranchiseId: string | null;
  submissionId: string | null;
  status: BracketSlotStatus;
};

export type ConferenceBracket = {
  conference: "AFC" | "NFC";
  seeds: PlayoffSeed[];
  bye: PlayoffSeed | null;
  wildCard: BracketSlot[];
  divisional: BracketSlot[];
  championship: BracketSlot;
};

export type PlayoffBracket = {
  afc: ConferenceBracket;
  nfc: ConferenceBracket;
  superBowl: BracketSlot;
};

export type PlayoffGameInput = {
  week: number;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number | null;
  awayScore: number | null;
  winnerTeamId: string | null;
  submissionId: string | null;
  status: "pending" | "approved" | null;
};

const WC_PAIRS = [
  { homeSeed: 2, awaySeed: 7, label: "2 vs 7" },
  { homeSeed: 3, awaySeed: 6, label: "3 vs 6" },
  { homeSeed: 4, awaySeed: 5, label: "4 vs 5" },
] as const;

export function formatSeedRecord(seed: Pick<PlayoffSeed, "wins" | "losses" | "ties">) {
  return seed.ties
    ? `${seed.wins}-${seed.losses}-${seed.ties}`
    : `${seed.wins}-${seed.losses}`;
}

export function seedPlayoffs(
  standings: StandingRow[],
  results: ResultLike[] = [],
  games: PlayoffGameInput[] = []
): PlayoffField {
  return {
    afc:
      seedFromWildCardGames("AFC", standings, results, games) ??
      seedConference("AFC", standings, results),
    nfc:
      seedFromWildCardGames("NFC", standings, results, games) ??
      seedConference("NFC", standings, results),
  };
}

export function seedConference(
  conference: "AFC" | "NFC",
  standings: StandingRow[],
  results: ResultLike[] = []
): PlayoffSeed[] {
  const conferenceRows = standings.filter((row) => row.conference === conference);
  const divisionWinners = divisionWinnersOf(conferenceRows, results);
  const winnerIds = new Set(divisionWinners.map((row) => row.franchiseId));
  const wildCards = conferenceRows
    .filter((row) => !winnerIds.has(row.franchiseId))
    .sort((a, b) => compareTeams(a, b, results))
    .slice(0, 3);

  return [...divisionWinners, ...wildCards].map((row, index) =>
    toSeed(row, index + 1, index < divisionWinners.length && index < 4)
  );
}

/**
 * When Madden already exported Wild Card games, those pairings are the field.
 * Home teams become seeds 2–4 (by record), their opponents 7–5.
 */
export function seedFromWildCardGames(
  conference: "AFC" | "NFC",
  standings: StandingRow[],
  results: ResultLike[],
  games: PlayoffGameInput[]
): PlayoffSeed[] | null {
  const conferenceRows = standings.filter((row) => row.conference === conference);
  const byId = new Map(conferenceRows.map((row) => [row.franchiseId, row]));
  const seen = new Set<string>();
  const wcGames = games.filter((game) => {
    if (game.week !== 19) return false;
    if (!byId.has(game.homeTeamId) || !byId.has(game.awayTeamId)) return false;
    const key = [game.homeTeamId, game.awayTeamId].sort().join(":");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  if (wcGames.length < 3) return null;

  const playing = new Set(
    wcGames.flatMap((game) => [game.homeTeamId, game.awayTeamId])
  );
  const winners = divisionWinnersOf(conferenceRows, results);
  const bye = winners.find((row) => !playing.has(row.franchiseId));
  const homes = wcGames
    .map((game) => byId.get(game.homeTeamId))
    .filter((row): row is StandingRow => Boolean(row))
    .sort((a, b) => compareTeams(a, b, results));

  const seeds: PlayoffSeed[] = [];
  if (bye) seeds.push(toSeed(bye, 1, true));
  homes.forEach((home, index) => {
    const game = wcGames.find((row) => row.homeTeamId === home.franchiseId);
    const away = game ? byId.get(game.awayTeamId) : null;
    if (!away) return;
    seeds.push(toSeed(home, index + 2, winners.some((row) => row.franchiseId === home.franchiseId)));
    seeds.push(toSeed(away, 7 - index, false));
  });
  if (seeds.length < 7) return null;
  return seeds.sort((a, b) => a.seed - b.seed);
}

function divisionWinnersOf(conferenceRows: StandingRow[], results: ResultLike[]) {
  const byDivision = new Map<string, StandingRow[]>();
  for (const row of conferenceRows) {
    const list = byDivision.get(row.division) ?? [];
    list.push(row);
    byDivision.set(row.division, list);
  }
  return [...byDivision.values()]
    .map((group) => [...group].sort((a, b) => compareTeams(a, b, results))[0])
    .filter(Boolean)
    .sort((a, b) => compareTeams(a, b, results));
}

function toSeed(row: StandingRow, seed: number, divisionWinner: boolean): PlayoffSeed {
  return {
    seed,
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
    divisionWinner,
  };
}

export function buildPlayoffBracket(
  field: PlayoffField,
  games: PlayoffGameInput[] = []
): PlayoffBracket {
  const afc = buildConferenceBracket("AFC", field.afc, games);
  const nfc = buildConferenceBracket("NFC", field.nfc, games);
  const afcChamp = winnerOf(afc.championship);
  const nfcChamp = winnerOf(nfc.championship);
  const sbHomeAway = superBowlSides(afcChamp, nfcChamp);
  const teams = [...field.afc, ...field.nfc];
  const tape = games.find((game) => game.week === SUPER_BOWL_WEEK);
  const tapeHome = tape
    ? teams.find((team) => team.franchiseId === tape.homeTeamId) ?? null
    : null;
  const tapeAway = tape
    ? teams.find((team) => team.franchiseId === tape.awayTeamId) ?? null
    : null;
  return {
    afc,
    nfc,
    superBowl: fillSlot(
      {
        id: "superbowl",
        week: SUPER_BOWL_WEEK,
        round: "superbowl",
        conference: "NFL",
        label: "Super Bowl",
        home: sbHomeAway.home ?? tapeHome,
        away: sbHomeAway.away ?? tapeAway,
      },
      games
    ),
  };
}

export function winnerOf(slot: BracketSlot): PlayoffSeed | null {
  if (!slot.winnerFranchiseId) return null;
  if (slot.home?.franchiseId === slot.winnerFranchiseId) return slot.home;
  if (slot.away?.franchiseId === slot.winnerFranchiseId) return slot.away;
  return null;
}

export function completeMatchups(slots: BracketSlot[]) {
  return slots.filter(
    (slot): slot is BracketSlot & { home: PlayoffSeed; away: PlayoffSeed } =>
      Boolean(slot.home && slot.away)
  );
}

function buildConferenceBracket(
  conference: "AFC" | "NFC",
  seeds: PlayoffSeed[],
  games: PlayoffGameInput[]
): ConferenceBracket {
  const bySeed = new Map(seeds.map((seed) => [seed.seed, seed]));
  const wildCard = WC_PAIRS.map((pair) =>
    fillSlot(
      {
        id: `${conference.toLowerCase()}-wc-${pair.homeSeed}v${pair.awaySeed}`,
        week: 19,
        round: "wildcard",
        conference,
        label: pair.label,
        home: bySeed.get(pair.homeSeed) ?? null,
        away: bySeed.get(pair.awaySeed) ?? null,
      },
      games
    )
  );

  const oneSeed = bySeed.get(1) ?? null;
  const wcWinners = wildCard.map(winnerOf).filter((seed): seed is PlayoffSeed => Boolean(seed));
  const remaining = [oneSeed, ...wcWinners].filter((seed): seed is PlayoffSeed => Boolean(seed));
  const divisionalPairings =
    remaining.length === 4 && oneSeed
      ? pairDivisional(oneSeed, remaining)
      : {
          first: { home: oneSeed, away: null as PlayoffSeed | null },
          second: { home: null as PlayoffSeed | null, away: null as PlayoffSeed | null },
        };

  const divisional = [
    fillSlot(
      {
        id: `${conference.toLowerCase()}-div-1`,
        week: 20,
        round: "divisional",
        conference,
        label: "Divisional",
        home: divisionalPairings.first.home,
        away: divisionalPairings.first.away,
      },
      games
    ),
    fillSlot(
      {
        id: `${conference.toLowerCase()}-div-2`,
        week: 20,
        round: "divisional",
        conference,
        label: "Divisional",
        home: divisionalPairings.second.home,
        away: divisionalPairings.second.away,
      },
      games
    ),
  ];

  const champHomeAway = higherSeedHome(winnerOf(divisional[0]), winnerOf(divisional[1]));
  const championship = fillSlot(
    {
      id: `${conference.toLowerCase()}-championship`,
      week: 21,
      round: "conference",
      conference,
      label: `${conference} Championship`,
      home: champHomeAway.home,
      away: champHomeAway.away,
    },
    games
  );

  return {
    conference,
    seeds,
    bye: oneSeed,
    wildCard,
    divisional,
    championship,
  };
}

function pairDivisional(oneSeed: PlayoffSeed, remaining: PlayoffSeed[]) {
  const lowest = remaining.reduce((worst, seed) =>
    seed.seed > worst.seed ? seed : worst
  );
  const others = remaining.filter(
    (seed) =>
      seed.franchiseId !== oneSeed.franchiseId &&
      seed.franchiseId !== lowest.franchiseId
  );
  const [higher, lower] = [...others].sort((a, b) => a.seed - b.seed);
  return {
    first: { home: oneSeed, away: lowest },
    second: higherSeedHome(higher ?? null, lower ?? null),
  };
}

function higherSeedHome(
  a: PlayoffSeed | null,
  b: PlayoffSeed | null
): { home: PlayoffSeed | null; away: PlayoffSeed | null } {
  if (!a) return { home: b, away: null };
  if (!b) return { home: a, away: null };
  return a.seed <= b.seed ? { home: a, away: b } : { home: b, away: a };
}

function superBowlSides(afc: PlayoffSeed | null, nfc: PlayoffSeed | null) {
  if (!afc) return { home: nfc, away: null };
  if (!nfc) return { home: afc, away: null };
  const cmp = compareSeeds(afc, nfc);
  if (cmp < 0) return { home: afc, away: nfc };
  if (cmp > 0) return { home: nfc, away: afc };
  return { home: afc, away: nfc };
}

function fillSlot(
  slot: Omit<
    BracketSlot,
    "homeScore" | "awayScore" | "winnerFranchiseId" | "submissionId" | "status"
  >,
  games: PlayoffGameInput[]
): BracketSlot {
  const matches =
    slot.home && slot.away
      ? games.filter(
          (row) =>
            row.week === slot.week &&
            teamsMatch(row, slot.home!.franchiseId, slot.away!.franchiseId)
        )
      : [];
  const game =
    matches.find((row) => row.homeScore != null && row.awayScore != null) ??
    matches[0];

  if (!game) {
    return {
      ...slot,
      homeScore: null,
      awayScore: null,
      winnerFranchiseId: null,
      submissionId: null,
      status: slot.home && slot.away ? "scheduled" : "tbd",
    };
  }

  const homeIsGameHome = game.homeTeamId === slot.home?.franchiseId;
  const homeScore = homeIsGameHome ? game.homeScore : game.awayScore;
  const awayScore = homeIsGameHome ? game.awayScore : game.homeScore;
  const winnerFranchiseId =
    game.winnerTeamId ??
    (game.status === "approved" && homeScore != null && awayScore != null
      ? homeScore > awayScore
        ? slot.home?.franchiseId ?? null
        : awayScore > homeScore
          ? slot.away?.franchiseId ?? null
          : null
      : null);

  return {
    ...slot,
    homeScore,
    awayScore,
    winnerFranchiseId,
    submissionId: game.submissionId,
    status:
      game.status === "approved" && winnerFranchiseId
        ? "final"
        : game.status === "pending" || game.status === "approved"
          ? "pending"
          : "scheduled",
  };
}

function teamsMatch(game: PlayoffGameInput, a: string, b: string) {
  const teams = new Set([game.homeTeamId, game.awayTeamId]);
  return teams.has(a) && teams.has(b);
}

export function compareTeams(
  a: StandingRow | PlayoffSeed,
  b: StandingRow | PlayoffSeed,
  results: ResultLike[]
) {
  if (b.wins !== a.wins) return b.wins - a.wins;
  if (a.losses !== b.losses) return a.losses - b.losses;
  const h2h = headToHead(a.franchiseId, b.franchiseId, results);
  if (h2h !== 0) return h2h;
  const aDiff = a.pointsFor - a.pointsAgainst;
  const bDiff = b.pointsFor - b.pointsAgainst;
  if (bDiff !== aDiff) return bDiff - aDiff;
  if (b.pointsFor !== a.pointsFor) return b.pointsFor - a.pointsFor;
  return a.abbreviation.localeCompare(b.abbreviation);
}

function compareSeeds(a: PlayoffSeed, b: PlayoffSeed) {
  return compareTeams(a, b, []);
}

function headToHead(aId: string, bId: string, results: ResultLike[]) {
  let aWins = 0;
  let bWins = 0;
  for (const result of results) {
    const pair =
      (result.homeTeamId === aId && result.awayTeamId === bId) ||
      (result.homeTeamId === bId && result.awayTeamId === aId);
    if (!pair || !result.winnerTeamId) continue;
    if (result.winnerTeamId === aId) aWins += 1;
    if (result.winnerTeamId === bId) bWins += 1;
  }
  if (aWins === bWins) return 0;
  return bWins - aWins;
}

export function currentPlayoffRound(week: number) {
  if (week < PLAYOFF_START_WEEK) return PLAYOFF_ROUNDS[0];
  return PLAYOFF_ROUNDS.find((round) => round.week === week) ?? PLAYOFF_ROUNDS[3];
}
