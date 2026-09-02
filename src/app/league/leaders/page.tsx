import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LeagueNav } from "@/components/league/league-nav";
import { displayWeek, formatSacks, formatStat } from "@/lib/madden/display";
import {
  ensureMaddenLeague,
  getSeasonPlayerTotals,
  getTeamStatTotals,
  getWeekPlayerTotals,
  latestStatWeek,
  listStatWeeks,
} from "@/lib/madden/query";
import { buildShareMetadata } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildShareMetadata({
  title: "League leaders",
  description:
    "Madden 27 player and team leaders — passing, rushing, receiving, defense, kicking, and team tape.",
  path: "/league/leaders",
});

export default async function LeagueLeadersPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  await ensureMaddenLeague();
  const params = await searchParams;
  const weeks = await listStatWeeks();
  const latest = await latestStatWeek();
  const weekIndex =
    params.week === "season"
      ? null
      : params.week
        ? Number(params.week)
        : latest;

  if (latest == null) {
    return (
      <div className="space-y-6">
        <LeagueNav active="leaders" />
        <EmptyState title="No player stats indexed yet" />
      </div>
    );
  }

  const seasonMode = weekIndex == null;
  const [source, teamSource] = await Promise.all([
    seasonMode ? getSeasonPlayerTotals() : getWeekPlayerTotals(weekIndex),
    getTeamStatTotals(seasonMode ? null : weekIndex),
  ]);
  const totals: LeaderRow[] = source.map((row) => ({
    name: "name" in row ? row.name : row.fullName,
    teamAbbr: row.teamAbbr,
    passYds: row.passYds,
    passTDs: row.passTDs,
    passInts: row.passInts,
    rushYds: row.rushYds,
    rushTDs: row.rushTDs,
    recYds: row.recYds,
    recTDs: row.recTDs,
    recCatches: row.recCatches,
    defSacks: row.defSacks,
    defInts: row.defInts,
    defTackles: row.defTackles,
    kickPts: row.kickPts,
  }));
  const passing = topBy(totals, (row) => row.passYds, (row) => row.passYds > 0);
  const rushing = topBy(totals, (row) => row.rushYds, (row) => row.rushYds > 0);
  const receiving = topBy(
    totals,
    (row) => row.recYds,
    (row) => row.recCatches > 0 || row.recYds > 0
  );
  const defense = topBy(
    totals,
    (row) => row.defSacks * 12 + row.defInts * 12 + row.defTackles * 0.4,
    (row) => row.defSacks > 0 || row.defInts > 0 || row.defTackles > 0
  );
  const kicking = topBy(totals, (row) => row.kickPts, (row) => row.kickPts > 0);
  const offenseHasPts = teamSource.some((row) => row.offPts > 0);
  const defenseHasPts = teamSource.some((row) => row.defPts > 0);
  const teamOffense = topBy(
    teamSource,
    (row) =>
      offenseHasPts ? row.offPts : row.offPassYds + row.offRushYds,
    (row) =>
      row.offPassYds > 0 ||
      row.offRushYds > 0 ||
      row.offPts > 0 ||
      row.offPassTDs > 0 ||
      row.offRushTDs > 0
  );
  const teamDefense = topBy(
    teamSource,
    (row) => (defenseHasPts ? -row.defPts : -row.defTotalYds),
    (row) => row.defTotalYds > 0 || row.defSacks > 0 || row.defPts > 0
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold uppercase tracking-[0.04em]">
          Leaders
        </h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          {seasonMode
            ? "Season totals from every weekly export we have."
            : `Week ${displayWeek(weekIndex)} lines from the Companion App.`}
        </p>
      </div>
      <LeagueNav active="leaders" />

      <div className="flex flex-wrap gap-2">
        <Link
          href="/league/leaders?week=season"
          className={`rounded-lg border px-3 py-1.5 text-sm ${
            seasonMode
              ? "border-[var(--primary)] text-[var(--primary)]"
              : "border-[var(--border)]"
          }`}
        >
          Season
        </Link>
        {weeks.map((week) => (
          <Link
            key={week}
            href={`/league/leaders?week=${week}`}
            className={`rounded-lg border px-3 py-1.5 text-sm ${
              weekIndex === week
                ? "border-[var(--primary)] text-[var(--primary)]"
                : "border-[var(--border)]"
            }`}
          >
            Week {displayWeek(week)}
          </Link>
        ))}
      </div>

      <div>
        <h2 className="font-[family-name:var(--font-display)] text-2xl uppercase tracking-wide">
          Players
        </h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Individual Companion lines. Rushing and receiving both print on skill
          boards.
        </p>
      </div>
      <Board
        title="Passing"
        headers={["Player", "Team", "Yds", "TD", "INT", "Rush", "Rush TD"]}
        rows={passing.map((row) => [
          row.name,
          row.teamAbbr,
          formatStat(row.passYds),
          String(row.passTDs),
          String(row.passInts),
          formatStat(row.rushYds),
          String(row.rushTDs),
        ])}
      />
      <Board
        title="Rushing"
        headers={["Player", "Team", "Rush", "TD", "Rec", "Rec Yds", "Rec TD"]}
        rows={rushing.map((row) => [
          row.name,
          row.teamAbbr,
          formatStat(row.rushYds),
          String(row.rushTDs),
          String(row.recCatches),
          formatStat(row.recYds),
          String(row.recTDs),
        ])}
      />
      <Board
        title="Receiving"
        headers={["Player", "Team", "Rec", "Yds", "TD", "Rush", "Rush TD"]}
        rows={receiving.map((row) => [
          row.name,
          row.teamAbbr,
          String(row.recCatches),
          formatStat(row.recYds),
          String(row.recTDs),
          formatStat(row.rushYds),
          String(row.rushTDs),
        ])}
      />
      <Board
        title="Defense"
        headers={["Player", "Team", "Sacks", "INT", "Tackles"]}
        rows={defense.map((row) => [
          row.name,
          row.teamAbbr,
          formatSacks(row.defSacks),
          String(row.defInts),
          formatStat(row.defTackles),
        ])}
      />
      <Board
        title="Kicking"
        headers={["Player", "Team", "Pts"]}
        rows={kicking.map((row) => [
          row.name,
          row.teamAbbr,
          formatStat(row.kickPts),
        ])}
      />

      <div className="pt-2">
        <h2 className="font-[family-name:var(--font-display)] text-2xl uppercase tracking-wide">
          Team tape
        </h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Companion team stats for the same window — scoring first on offense,
          fewest points allowed on defense.
        </p>
      </div>
      <Board
        title="Team offense"
        headers={["Team", "Pass", "Rush", "TDs", "Pts"]}
        rows={teamOffense.map((row) => [
          <Link
            key={`${row.teamAbbr}-off`}
            href={`/league/teams/${row.teamAbbr}`}
            className="hover:text-[var(--primary)]"
          >
            {row.teamAbbr}
          </Link>,
          formatStat(row.offPassYds),
          formatStat(row.offRushYds),
          formatStat(row.offPassTDs + row.offRushTDs),
          formatStat(row.offPts, Number.isInteger(row.offPts) ? 0 : 1),
        ])}
      />
      <Board
        title="Team defense"
        headers={["Team", "Yds allwd", "Sacks", "Pts allwd"]}
        rows={teamDefense.map((row) => [
          <Link
            key={`${row.teamAbbr}-def`}
            href={`/league/teams/${row.teamAbbr}`}
            className="hover:text-[var(--primary)]"
          >
            {row.teamAbbr}
          </Link>,
          formatStat(row.defTotalYds),
          formatSacks(row.defSacks),
          formatStat(row.defPts, Number.isInteger(row.defPts) ? 0 : 1),
        ])}
      />
    </div>
  );
}

type LeaderRow = {
  name: string;
  teamAbbr: string;
  passYds: number;
  passTDs: number;
  passInts: number;
  rushYds: number;
  rushTDs: number;
  recYds: number;
  recTDs: number;
  recCatches: number;
  defSacks: number;
  defInts: number;
  defTackles: number;
  kickPts: number;
};

function topBy<T>(
  rows: T[],
  metric: (row: T) => number,
  eligible: (row: T) => boolean,
  take = 10
) {
  return [...rows]
    .filter(eligible)
    .sort((a, b) => metric(b) - metric(a))
    .slice(0, take);
}

function Board({
  title,
  headers,
  rows,
}: {
  title: string;
  headers: string[];
  rows: Array<Array<string | number | ReactNode>>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Top 10</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">No rows.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {headers.map((header) => (
                  <TableHead key={header}>{header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow key={`${title}-${index}`}>
                  {row.map((cell, cellIndex) => (
                    <TableCell
                      key={cellIndex}
                      className={cellIndex === 0 ? "font-medium" : undefined}
                    >
                      {cell}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
