import assert from "node:assert/strict";
import { test } from "node:test";
import {
  displayLeagueWeek,
  nextLeagueWeek,
  siteWeekIndexFromCompanion,
  weekChip,
} from "./league-week";
import {
  buildPlayoffBracket,
  seedConference,
  seedFromWildCardGames,
  winnerOf,
  type PlayoffSeed,
} from "./playoffs";
import type { StandingRow } from "./standings";

function row(
  partial: Partial<StandingRow> &
    Pick<StandingRow, "franchiseId" | "abbreviation" | "division" | "wins" | "losses">
): StandingRow {
  return {
    name: partial.name ?? partial.abbreviation,
    conference: partial.conference ?? "AFC",
    ties: 0,
    pointsFor: partial.pointsFor ?? partial.wins * 20,
    pointsAgainst: partial.pointsAgainst ?? partial.losses * 17,
    form: "",
    ...partial,
  };
}

function seed(
  partial: Pick<PlayoffSeed, "seed" | "franchiseId" | "abbreviation"> &
    Partial<PlayoffSeed>
): PlayoffSeed {
  return {
    name: partial.name ?? partial.abbreviation,
    conference: partial.conference ?? "AFC",
    division: partial.division ?? "East",
    wins: partial.wins ?? 12 - partial.seed,
    losses: partial.losses ?? partial.seed,
    ties: 0,
    pointsFor: 300,
    pointsAgainst: 200,
    divisionWinner: partial.seed <= 4,
    ...partial,
  };
}

test("display helpers name playoff rounds instead of week 19+", () => {
  assert.equal(displayLeagueWeek(18), "Week 18");
  assert.equal(displayLeagueWeek(19), "Wild Card");
  assert.equal(displayLeagueWeek(20), "Divisional");
  assert.equal(displayLeagueWeek(21), "Conference");
  assert.equal(displayLeagueWeek(22), "Super Bowl");
  assert.equal(weekChip(19), "WC");
  assert.equal(nextLeagueWeek(18), 19);
  assert.equal(nextLeagueWeek(22), null);
  assert.equal(siteWeekIndexFromCompanion(0, "playoff"), 18);
  assert.equal(siteWeekIndexFromCompanion(3, "post"), 21);
  assert.equal(siteWeekIndexFromCompanion(7, "reg"), 7);
});

test("seeds four division winners then three wild cards", () => {
  const standings = [
    row({ franchiseId: "ne", abbreviation: "NE", division: "East", wins: 14, losses: 3 }),
    row({ franchiseId: "buf", abbreviation: "BUF", division: "East", wins: 13, losses: 4 }),
    row({ franchiseId: "bal", abbreviation: "BAL", division: "North", wins: 12, losses: 5 }),
    row({ franchiseId: "kc", abbreviation: "KC", division: "West", wins: 11, losses: 6 }),
    row({ franchiseId: "hou", abbreviation: "HOU", division: "South", wins: 10, losses: 7 }),
    row({ franchiseId: "pit", abbreviation: "PIT", division: "North", wins: 11, losses: 6 }),
    row({ franchiseId: "lac", abbreviation: "LAC", division: "West", wins: 10, losses: 7 }),
    row({ franchiseId: "den", abbreviation: "DEN", division: "West", wins: 9, losses: 8 }),
  ];
  const seeds = seedConference("AFC", standings);
  assert.deepEqual(
    seeds.map((s) => s.abbreviation),
    ["NE", "BAL", "KC", "HOU", "BUF", "PIT", "LAC"]
  );
  assert.equal(seeds[0].seed, 1);
  assert.equal(seeds[0].divisionWinner, true);
  assert.equal(seeds[4].abbreviation, "BUF");
  assert.equal(seeds[4].divisionWinner, false);
});

test("Madden Wild Card games set the field even when standings pick different wild cards", () => {
  const standings = [
    row({ franchiseId: "ne", abbreviation: "NE", division: "East", wins: 14, losses: 3 }),
    row({ franchiseId: "pit", abbreviation: "PIT", division: "North", wins: 14, losses: 3 }),
    row({ franchiseId: "ind", abbreviation: "IND", division: "South", wins: 13, losses: 3, pointsFor: 504, pointsAgainst: 328 }),
    row({ franchiseId: "kc", abbreviation: "KC", division: "West", wins: 13, losses: 3, pointsFor: 513, pointsAgainst: 365 }),
    row({ franchiseId: "lv", abbreviation: "LV", division: "West", wins: 11, losses: 5 }),
    row({ franchiseId: "bal", abbreviation: "BAL", division: "North", wins: 11, losses: 6 }),
    row({ franchiseId: "cle", abbreviation: "CLE", division: "North", wins: 8, losses: 9 }),
    row({ franchiseId: "lac", abbreviation: "LAC", division: "West", wins: 8, losses: 9 }),
  ];
  const seeds = seedFromWildCardGames("AFC", standings, [], [
    { week: 19, homeTeamId: "pit", awayTeamId: "lac", homeScore: null, awayScore: null, winnerTeamId: null, submissionId: null, status: null },
    { week: 19, homeTeamId: "ind", awayTeamId: "bal", homeScore: null, awayScore: null, winnerTeamId: null, submissionId: null, status: null },
    { week: 19, homeTeamId: "kc", awayTeamId: "lv", homeScore: null, awayScore: null, winnerTeamId: null, submissionId: null, status: null },
  ]);
  assert.ok(seeds);
  assert.deepEqual(
    seeds.map((s) => s.abbreviation),
    ["NE", "PIT", "IND", "KC", "LV", "BAL", "LAC"]
  );
  const withH2h = seedFromWildCardGames(
    "AFC",
    standings,
    [{ homeTeamId: "kc", awayTeamId: "ind", winnerTeamId: "kc" }],
    [
      { week: 19, homeTeamId: "pit", awayTeamId: "lac", homeScore: null, awayScore: null, winnerTeamId: null, submissionId: null, status: null },
      { week: 19, homeTeamId: "ind", awayTeamId: "bal", homeScore: null, awayScore: null, winnerTeamId: null, submissionId: null, status: null },
      { week: 19, homeTeamId: "kc", awayTeamId: "lv", homeScore: null, awayScore: null, winnerTeamId: null, submissionId: null, status: null },
    ]
  );
  assert.ok(withH2h);
  const byAbbr = Object.fromEntries(withH2h.map((s) => [s.abbreviation, s.seed]));
  assert.equal(byAbbr.KC, 3);
  assert.equal(byAbbr.LV, 6);
  assert.equal(byAbbr.IND, 4);
  assert.equal(byAbbr.BAL, 5);
});

test("head-to-head breaks a two-team seed tie", () => {
  const standings = [
    row({ franchiseId: "ne", abbreviation: "NE", division: "East", wins: 12, losses: 5 }),
    row({ franchiseId: "bal", abbreviation: "BAL", division: "North", wins: 12, losses: 5 }),
    row({ franchiseId: "kc", abbreviation: "KC", division: "West", wins: 11, losses: 6 }),
    row({ franchiseId: "hou", abbreviation: "HOU", division: "South", wins: 10, losses: 7 }),
    row({ franchiseId: "buf", abbreviation: "BUF", division: "East", wins: 9, losses: 8 }),
    row({ franchiseId: "pit", abbreviation: "PIT", division: "North", wins: 8, losses: 9 }),
    row({ franchiseId: "den", abbreviation: "DEN", division: "West", wins: 7, losses: 10 }),
  ];
  const seeds = seedConference("AFC", standings, [
    { homeTeamId: "bal", awayTeamId: "ne", winnerTeamId: "bal" },
  ]);
  assert.equal(seeds[0].abbreviation, "BAL");
  assert.equal(seeds[1].abbreviation, "NE");
});

test("wild card is 2v7 / 3v6 / 4v5 with the 1-seed on a bye", () => {
  const afc = [1, 2, 3, 4, 5, 6, 7].map((n) =>
    seed({ seed: n, franchiseId: `a${n}`, abbreviation: `A${n}` })
  );
  const nfc = [1, 2, 3, 4, 5, 6, 7].map((n) =>
    seed({
      seed: n,
      franchiseId: `n${n}`,
      abbreviation: `N${n}`,
      conference: "NFC",
    })
  );
  const bracket = buildPlayoffBracket({ afc, nfc });
  assert.equal(bracket.afc.bye?.abbreviation, "A1");
  assert.deepEqual(
    bracket.afc.wildCard.map((slot) => [
      slot.home?.seed,
      slot.away?.seed,
    ]),
    [
      [2, 7],
      [3, 6],
      [4, 5],
    ]
  );
  assert.equal(bracket.afc.divisional[0].away, null);
  assert.equal(bracket.superBowl.status, "tbd");
});

test("divisional re-seeds the 1-seed against the lowest remaining winner", () => {
  const afc = [1, 2, 3, 4, 5, 6, 7].map((n) =>
    seed({ seed: n, franchiseId: `a${n}`, abbreviation: `A${n}` })
  );
  const nfc = [1, 2, 3, 4, 5, 6, 7].map((n) =>
    seed({
      seed: n,
      franchiseId: `n${n}`,
      abbreviation: `N${n}`,
      conference: "NFC",
    })
  );
  const favorites = buildPlayoffBracket(
    { afc, nfc },
    [
      wcWin("a2", "a7"),
      wcWin("a3", "a6"),
      wcWin("a4", "a5"),
    ]
  );
  assert.deepEqual(
    [favorites.afc.divisional[0].home?.seed, favorites.afc.divisional[0].away?.seed],
    [1, 4]
  );
  assert.deepEqual(
    [favorites.afc.divisional[1].home?.seed, favorites.afc.divisional[1].away?.seed],
    [2, 3]
  );

  const upset = buildPlayoffBracket(
    { afc, nfc },
    [
      wcWin("a7", "a2"),
      wcWin("a3", "a6"),
      wcWin("a4", "a5"),
    ]
  );
  assert.equal(winnerOf(upset.afc.wildCard[0])?.seed, 7);
  assert.deepEqual(
    [upset.afc.divisional[0].home?.seed, upset.afc.divisional[0].away?.seed],
    [1, 7]
  );
  assert.deepEqual(
    [upset.afc.divisional[1].home?.seed, upset.afc.divisional[1].away?.seed],
    [3, 4]
  );
});

function wcWin(winnerId: string, loserId: string) {
  return {
    week: 19,
    homeTeamId: loserId.startsWith("a") && Number(loserId.slice(1)) < Number(winnerId.slice(1))
      ? loserId
      : winnerId,
    awayTeamId: loserId.startsWith("a") && Number(loserId.slice(1)) < Number(winnerId.slice(1))
      ? winnerId
      : loserId,
    homeScore: 20,
    awayScore: 17,
    winnerTeamId: winnerId,
    submissionId: `${winnerId}-${loserId}`,
    status: "approved" as const,
  };
}
