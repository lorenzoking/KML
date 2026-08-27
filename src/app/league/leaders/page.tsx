import Link from "next/link";
import type { Metadata } from "next";
import { MaddenStatCategory } from "@/generated/prisma/client";
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
import { displayWeek, playerName } from "@/lib/madden/display";
import {
  ensureMaddenLeague,
  getLeaders,
  getSeasonLeaders,
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
  const [passing, rushing, receiving, defense] = seasonMode
    ? await Promise.all([
        getSeasonLeaders(MaddenStatCategory.PASSING),
        getSeasonLeaders(MaddenStatCategory.RUSHING),
        getSeasonLeaders(MaddenStatCategory.RECEIVING),
        getSeasonLeaders(MaddenStatCategory.DEFENSE),
      ])
    : await Promise.all([
        getLeaders(weekIndex, MaddenStatCategory.PASSING),
        getLeaders(weekIndex, MaddenStatCategory.RUSHING),
        getLeaders(weekIndex, MaddenStatCategory.RECEIVING),
        getLeaders(weekIndex, MaddenStatCategory.DEFENSE),
      ]);

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
        headers={["Player", "Team", "Yds", "TD", "INT", "Rating"]}
        rows={passing.map((row) => [
          row.fullName || playerName(row.player),
          row.team.abbr,
          String(row.passYds),
          String(row.passTDs),
          String(row.passInts),
          seasonMode ? "—" : row.passerRating.toFixed(1),
        ])}
      />
      <Board
        title="Rushing"
        headers={["Player", "Team", "Yds", "TD", "Att"]}
        rows={rushing.map((row) => [
          row.fullName || playerName(row.player),
          row.team.abbr,
          String(row.rushYds),
          String(row.rushTDs),
          String(row.rushAtt),
        ])}
      />
      <Board
        title="Receiving"
        headers={["Player", "Team", "Rec", "Yds", "TD"]}
        rows={receiving.map((row) => [
          row.fullName || playerName(row.player),
          row.team.abbr,
          String(row.recCatches),
          String(row.recYds),
          String(row.recTDs),
        ])}
      />
      <Board
        title="Defense"
        headers={["Player", "Team", "Sacks", "INT", "Tackles"]}
        rows={defense.map((row) => [
          row.fullName || playerName(row.player),
          row.team.abbr,
          String(row.defSacks),
          String(row.defInts),
          String(row.defTackles),
        ])}
      />
    </div>
  );
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
