import assert from "node:assert/strict";
import { test } from "node:test";
import {
  averageSimScore,
  coachOwesSimScore,
  formatAverageSimScore,
  myOutstandingSimScore,
  outstandingSimScoresForCoach,
  simScoreForTeam,
  teamsOwingSimScore,
} from "./sim-score";

const week5 = {
  week: 5,
  userTeamId: "TEN",
  opponentTeamId: "IND",
  opponentSimScore: null,
  userTeamSimScore: 4,
  isForceWin: false,
};

const week7 = {
  week: 7,
  userTeamId: "KC",
  opponentTeamId: "TEN",
  opponentSimScore: 3,
  userTeamSimScore: null,
  isForceWin: false,
};

test("outstanding sim score is the rating this coach still owes", () => {
  assert.deepEqual(myOutstandingSimScore(week7, "TEN"), {
    ratedTeamId: "KC",
    alreadySubmitted: false,
  });
  assert.deepEqual(myOutstandingSimScore(week7, "KC"), {
    ratedTeamId: "TEN",
    alreadySubmitted: true,
  });
  assert.equal(coachOwesSimScore(week7, "TEN"), true);
  assert.equal(coachOwesSimScore(week7, "KC"), false);
});

test("Needs You lists every unpaid sim score and puts the current week first", () => {
  const rows = outstandingSimScoresForCoach([week5, week7], "TEN", 7);
  assert.equal(rows.length, 2);
  assert.equal(rows[0]?.game.week, 7);
  assert.equal(rows[1]?.game.week, 5);
  assert.equal(simScoreForTeam(week7, "TEN"), 3);
  assert.equal(simScoreForTeam(week7, "KC"), null);
});

test("average sim score is the mean of scores a coach received", () => {
  assert.deepEqual(averageSimScore([4, 3, null, 5]), { average: 4, count: 3 });
  assert.deepEqual(averageSimScore([2, 3]), { average: 2.5, count: 2 });
  assert.deepEqual(averageSimScore([null, undefined]), { average: null, count: 0 });
  assert.equal(formatAverageSimScore(2.5, 2), "2.5");
  assert.equal(formatAverageSimScore(null, 0), "—");
});

test("admin copy names every coach still owing a Sim Score", () => {
  const labeled = {
    userTeam: { abbreviation: "KC" },
    opponentTeam: { abbreviation: "TEN" },
    opponentSimScore: 3,
    userTeamSimScore: null as number | null,
    isForceWin: false,
  };
  assert.deepEqual(teamsOwingSimScore(labeled), ["TEN"]);
  assert.deepEqual(teamsOwingSimScore({ ...labeled, opponentSimScore: null }), [
    "KC",
    "TEN",
  ]);
});
