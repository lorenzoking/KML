import Link from "next/link";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LeagueNav } from "@/components/league/league-nav";
import { MaddenStatCategory } from "@/generated/prisma/client";
import { displayWeek, playerName } from "@/lib/madden/display";
import {
  ensureMaddenLeague,
  getLeaders,
  getWeekGames,
  latestStatWeek,
} from "@/lib/madden/query";
import { buildShareMetadata } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildShareMetadata({
  title: "League tape",
  description: "Live Madden 27 scores, leaders, and weekly tape from the Companion App.",
  path: "/league",
});

export default async function LeagueTapePage() {
  await ensureMaddenLeague();
  const weekIndex = await latestStatWeek();
  if (weekIndex == null) {
    return (
      <div className="space-y-6">
        <LeagueNav active="tape" />
        <EmptyState
          title="Waiting on weekly stats"
          description="Export one completed week of stats from the Companion App."
        />
      </div>
    );
  }

  const week = displayWeek(weekIndex);
  const [games, passing, rushing, receiving, defense] = await Promise.all([
    getWeekGames(weekIndex),
    getLeaders(weekIndex, MaddenStatCategory.PASSING, 5),
    getLeaders(weekIndex, MaddenStatCategory.RUSHING, 5),
    getLeaders(weekIndex, MaddenStatCategory.RECEIVING, 5),
    getLeaders(weekIndex, MaddenStatCategory.DEFENSE, 5),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
          On the tape · Week {week}
        </p>
        <h1 className="text-3xl font-semibold uppercase tracking-[0.04em]">
          League
        </h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Scores, heaters, and rosters from the Madden 27 Companion export.
          This board updates when the next weekly dump lands.
        </p>
      </div>
      <LeagueNav active="tape" />

      <Card>
        <CardHeader>
          <CardTitle>Week {week} finals</CardTitle>
          <CardDescription>Pulled from the franchise schedule export.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {games.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)]">
              No completed games in this week’s export.
            </p>
          ) : (
            games.map((game) => (
              <div
                key={game.id}
                className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-3"
              >
                <div>
                  <p className="font-semibold">
                    {game.awayTeam.abbr} {game.awayScore}
                  </p>
                  <p className="font-semibold">
                    {game.homeTeam.abbr} {game.homeScore}
                  </p>
                </div>
                {game.isGameOfTheWeek ? (
                  <Badge variant="elite">GOTW</Badge>
                ) : (
                  <Badge variant="outline">Final</Badge>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <LeaderCard
          title="Passing"
          rows={passing.map((row) => ({
            id: row.id,
            name: row.fullName || playerName(row.player),
            team: row.team.abbr,
            line: `${row.passYds} yds · ${row.passTDs} TD · ${row.passInts} INT`,
          }))}
        />
        <LeaderCard
          title="Rushing"
          rows={rushing.map((row) => ({
            id: row.id,
            name: row.fullName || playerName(row.player),
            team: row.team.abbr,
            line: `${row.rushYds} yds · ${row.rushTDs} TD · ${row.rushAtt} att`,
          }))}
        />
        <LeaderCard
          title="Receiving"
          rows={receiving.map((row) => ({
            id: row.id,
            name: row.fullName || playerName(row.player),
            team: row.team.abbr,
            line: `${row.recCatches} rec · ${row.recYds} yds · ${row.recTDs} TD`,
          }))}
        />
        <LeaderCard
          title="Defense"
          rows={defense.map((row) => ({
            id: row.id,
            name: row.fullName || playerName(row.player),
            team: row.team.abbr,
            line: `${row.defSacks} sacks · ${row.defInts} INT · ${row.defTackles} tkl`,
          }))}
        />
      </div>

      <p className="text-sm text-[var(--muted-foreground)]">
        <Link href="/league/leaders" className="text-[var(--primary)]">
          Full leaderboards
        </Link>
        {" · "}
        <Link href="/league/teams" className="text-[var(--primary)]">
          All 32 rosters
        </Link>
        {" · "}
        <Link href="/storylines" className="text-[var(--primary)]">
          Storylines from this tape
        </Link>
      </p>
    </div>
  );
}

function LeaderCard({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ id: string; name: string; team: string; line: string }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">No lines yet.</p>
        ) : (
          rows.map((row, index) => (
            <div
              key={row.id}
              className="flex items-baseline justify-between gap-3 text-sm"
            >
              <p>
                <span className="text-[var(--muted-foreground)]">{index + 1}.</span>{" "}
                <span className="font-medium">{row.name}</span>{" "}
                <span className="text-[var(--muted-foreground)]">{row.team}</span>
              </p>
              <p className="shrink-0 text-xs text-[var(--muted-foreground)]">
                {row.line}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
