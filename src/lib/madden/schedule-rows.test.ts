import assert from "node:assert/strict";
import { test } from "node:test";
import {
  dedupeWeekMatchups,
  pathWeekFromExportPath,
  planCompanionWeek,
  selectCompanionScheduleRows,
} from "./schedule-rows";

function game(
  partial: Record<string, unknown> & { scheduleId: string; weekIndex: number }
) {
  return {
    homeTeamId: partial.homeTeamId ?? "1",
    awayTeamId: partial.awayTeamId ?? "2",
    homeScore: 0,
    awayScore: 0,
    status: 1,
    seasonIndex: 1,
    stageIndex: 1,
    ...partial,
  };
}

test("export path week is the 0-based segment, and All Weeks is not a week", () => {
  assert.equal(
    pathWeekFromExportPath("/xbsx/99/week/reg/3/schedules"),
    3
  );
  assert.equal(pathWeekFromExportPath("/xbsx/99/week/reg/all/schedules"), null);
  assert.equal(pathWeekFromExportPath("/xbsx/99/week/reg/-1/schedules"), null);
});

test("week 4 export keeps that week and drops other weeks bundled in the body", () => {
  const rows = selectCompanionScheduleRows(
    [
      game({ scheduleId: "w1", weekIndex: 0, homeTeamId: "1", awayTeamId: "2" }),
      game({ scheduleId: "w4", weekIndex: 3, homeTeamId: "3", awayTeamId: "4" }),
    ],
    { weekType: "reg", pathWeek: 3 }
  );
  assert.deepEqual(
    rows.map((row) => row.scheduleId),
    ["w4"]
  );
  assert.equal(rows[0]?.weekIndex, 3);
});

test("All Weeks history keeps the latest season and ignores preseason", () => {
  const rows = selectCompanionScheduleRows(
    [
      game({
        scheduleId: "old",
        weekIndex: 3,
        seasonIndex: 0,
        homeTeamId: "1",
        awayTeamId: "2",
      }),
      game({
        scheduleId: "pre",
        weekIndex: 3,
        seasonIndex: 1,
        stageIndex: 0,
        homeTeamId: "3",
        awayTeamId: "4",
      }),
      game({
        scheduleId: "now",
        weekIndex: 3,
        seasonIndex: 1,
        homeTeamId: "5",
        awayTeamId: "6",
      }),
    ],
    { weekType: null, pathWeek: null }
  );
  assert.deepEqual(
    rows.map((row) => row.scheduleId),
    ["now"]
  );
});

test("a dump that stamps every game onto one week is ignored", () => {
  const rows = Array.from({ length: 20 }, (_, index) =>
    game({
      scheduleId: `g${index}`,
      weekIndex: 3,
      homeTeamId: String(index * 2 + 1),
      awayTeamId: String(index * 2 + 2),
    })
  );
  assert.deepEqual(
    selectCompanionScheduleRows(rows, { weekType: "reg", pathWeek: 3 }),
    []
  );
  assert.deepEqual(
    selectCompanionScheduleRows(rows, { weekType: "reg", pathWeek: null }),
    []
  );
});

test("preseason week type never fills the regular-season board", () => {
  assert.deepEqual(
    selectCompanionScheduleRows(
      [game({ scheduleId: "pre", weekIndex: 3, stageIndex: 1 })],
      { weekType: "pre", pathWeek: 3 }
    ),
    []
  );
});

test("one filed game does not freeze the rest of the week", () => {
  const plan = planCompanionWeek({
    existing: [
      { id: "filed", homeTeamId: "BUF", awayTeamId: "KC", isPrimetime: false },
      { id: "old", homeTeamId: "NYJ", awayTeamId: "NE", isPrimetime: false },
    ],
    incoming: [
      { homeTeamId: "BUF", awayTeamId: "KC", isPrimetime: false },
      { homeTeamId: "NYJ", awayTeamId: "MIA", isPrimetime: true },
    ],
    livePairs: [{ homeTeamId: "KC", awayTeamId: "BUF" }],
  });
  assert.deepEqual(plan.deleteIds, ["old"]);
  assert.deepEqual(plan.create, [
    { homeTeamId: "NYJ", awayTeamId: "MIA", isPrimetime: true },
  ]);
});

test("duplicate teams in one week keep the newest matchup", () => {
  const kept = dedupeWeekMatchups([
    { homeTeamId: "BUF", awayTeamId: "MIA", scheduleId: "new" },
    { homeTeamId: "BUF", awayTeamId: "KC", scheduleId: "old" },
  ]);
  assert.deepEqual(
    kept.map((game) => game.scheduleId),
    ["new"]
  );
});
