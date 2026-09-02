import assert from "node:assert/strict";
import { test } from "node:test";
import {
  defenseStatLine,
  emptyStatSums,
  passingStatLine,
  rosterSeasonLine,
  skillStatLine,
} from "./display";

test("skill line prints from-scrimmage with rush and receiving TDs", () => {
  assert.equal(
    skillStatLine({
      rushYds: 1245,
      rushTDs: 10,
      recYds: 412,
      recTDs: 4,
      recCatches: 32,
    }),
    "1,657 scrimmage yds · 14 TD · 1,245 rush, 10 TD · 32 for 412, 4 TD"
  );
});

test("skill line stays rush-only when there is no receiving", () => {
  assert.equal(
    skillStatLine({
      rushYds: 980,
      rushTDs: 8,
      recYds: 0,
      recTDs: 0,
      recCatches: 0,
    }),
    "980 rush yds · 8 TD"
  );
});

test("skill line stays receiving-only when there is no rushing", () => {
  assert.equal(
    skillStatLine({
      rushYds: 0,
      rushTDs: 0,
      recYds: 1012,
      recTDs: 8,
      recCatches: 68,
    }),
    "68 rec · 1,012 yds · 8 TD"
  );
});

test("defense line skips empty columns so coverage players are not 0-sack first", () => {
  assert.equal(
    defenseStatLine({ defSacks: 0, defInts: 5, defTackles: 52 }),
    "5 INT · 52 tkl"
  );
  assert.equal(
    defenseStatLine({ defSacks: 14.5, defInts: 0, defTackles: 48 }),
    "14.5 sacks · 48 tkl"
  );
  assert.equal(
    defenseStatLine({ defSacks: 11, defInts: 3, defTackles: 67 }),
    "11 sacks · 3 INT · 67 tkl"
  );
});

test("roster season line for backs includes receiving TDs, not just rec yards", () => {
  const stats = {
    ...emptyStatSums(),
    rushYds: 1245,
    rushTDs: 10,
    recYds: 412,
    recTDs: 4,
    recCatches: 32,
  };
  const expected =
    "1,657 scrimmage yds · 14 TD · 1,245 rush, 10 TD · 32 for 412, 4 TD";
  assert.equal(rosterSeasonLine("HB", stats), expected);
  assert.equal(rosterSeasonLine("RB", stats), expected);
});

test("passing line includes rushing TDs for dual-threat QBs", () => {
  assert.equal(
    passingStatLine(
      {
        passComp: 210,
        passAtt: 310,
        passYds: 2840,
        passTDs: 24,
        passInts: 6,
        rushYds: 412,
        rushTDs: 7,
      },
      { compact: true }
    ),
    "2,840 yds · 24 TD · 6 INT · 412 rush, 7 TD"
  );
});
