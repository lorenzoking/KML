import assert from "node:assert/strict";
import { test } from "node:test";
import { maddenResultKind } from "./game-status";

test("status 2 is always a played user game", () => {
  assert.equal(
    maddenResultKind({
      status: 2,
      homeScore: 24,
      awayScore: 17,
      week: 7,
      currentWeek: 7,
      currentWeekStillOpen: true,
    }),
    "played"
  );
});

test("status 3 with a score during an open current week is played, not a leftover sim", () => {
  assert.equal(
    maddenResultKind({
      status: 3,
      homeScore: 13,
      awayScore: 7,
      week: 7,
      currentWeek: 7,
      currentWeekStillOpen: true,
    }),
    "played"
  );
});

test("status 3 with a score after the week is closed is a CPU sim", () => {
  assert.equal(
    maddenResultKind({
      status: 3,
      homeScore: 13,
      awayScore: 7,
      week: 5,
      currentWeek: 7,
      currentWeekStillOpen: true,
    }),
    "simulated"
  );
  assert.equal(
    maddenResultKind({
      status: 3,
      homeScore: 24,
      awayScore: 21,
      week: 7,
      currentWeek: 7,
      currentWeekStillOpen: false,
    }),
    "simulated"
  );
});

test("status 1 at 0-0 is unplayed", () => {
  assert.equal(
    maddenResultKind({
      status: 1,
      homeScore: 0,
      awayScore: 0,
      week: 7,
      currentWeek: 7,
      currentWeekStillOpen: true,
    }),
    "unplayed"
  );
});
