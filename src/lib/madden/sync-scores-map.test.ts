import assert from "node:assert/strict";
import { test } from "node:test";
import {
  autoFileSides,
  scoresForSiteSubmitter,
  shouldSyncCompanionWeekType,
} from "./sync-scores-map";

test("only regular-season Companion weeks sync onto the site slate", () => {
  assert.equal(shouldSyncCompanionWeekType(null), true);
  assert.equal(shouldSyncCompanionWeekType(""), true);
  assert.equal(shouldSyncCompanionWeekType("reg"), true);
  assert.equal(shouldSyncCompanionWeekType("pre"), false);
  assert.equal(shouldSyncCompanionWeekType("playoff"), false);
  assert.equal(shouldSyncCompanionWeekType("post"), false);
});

test("maps Madden home/away onto the site submitter’s team", () => {
  assert.deepEqual(
    scoresForSiteSubmitter({
      userTeamId: "home",
      homeFranchiseId: "home",
      homeScore: 27,
      awayScore: 13,
    }),
    { userScore: 27, opponentScore: 13 }
  );
  assert.deepEqual(
    scoresForSiteSubmitter({
      userTeamId: "away",
      homeFranchiseId: "home",
      homeScore: 27,
      awayScore: 13,
    }),
    { userScore: 13, opponentScore: 27 }
  );
});

test("played games file as the Madden home/away result", () => {
  assert.deepEqual(
    autoFileSides({
      simulated: false,
      homeFranchiseId: "NE",
      awayFranchiseId: "NYJ",
      homeScore: 24,
      awayScore: 17,
    }),
    {
      isForceWin: false,
      userTeamId: "NE",
      opponentTeamId: "NYJ",
      userScore: 24,
      opponentScore: 17,
    }
  );
});

test("CPU sims file as a force win for the scoring winner", () => {
  assert.deepEqual(
    autoFileSides({
      simulated: true,
      homeFranchiseId: "NE",
      awayFranchiseId: "NYJ",
      homeScore: 10,
      awayScore: 31,
    }),
    {
      isForceWin: true,
      userTeamId: "NYJ",
      opponentTeamId: "NE",
      userScore: 31,
      opponentScore: 10,
    }
  );
});

test("CPU sim ties are not force wins", () => {
  assert.equal(
    autoFileSides({
      simulated: true,
      homeFranchiseId: "NE",
      awayFranchiseId: "NYJ",
      homeScore: 20,
      awayScore: 20,
    }).isForceWin,
    false
  );
});
