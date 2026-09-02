import Link from "next/link";
import type { Metadata } from "next";
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
  getWeekPlayerTotals,
  latestStatWeek,
  listStatWeeks,
} from "@/lib/madden/query";
import { buildShareMetadata } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildShareMetadata({
  title: "League leaders",
  description: "Madden 27 passing, rushing, receiving, and defense leaders.",
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
  const totals = seasonMode
    ? await getSeasonPlayerTotals()
    : await getWeekPlayerTotals(weekIndex);
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

      <Board
        title="Passing"
        headers={["Player", "Team", "Yds", "TD", "INT", "Rush", "Rush TD"]}
        rows={passing.map((row) => [
          leaderName(row),
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
          leaderName(row),
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
          leaderName(row),
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
          leaderName(row),
          row.teamAbbr,
          formatSacks(row.defSacks),
          String(row.defInts),
          formatStat(row.defTackles),
        ])}
      />
    </div>
  );
}

type LeaderRow = {
  name?: string;
  fullName?: string;
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
};

function leaderName(row: LeaderRow) {
  return row.name || row.fullName || "Unknown";
}

function topBy<T extends LeaderRow>(
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
  rows: string[][];
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
