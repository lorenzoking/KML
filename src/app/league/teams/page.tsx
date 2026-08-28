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
import { formatRecord } from "@/lib/madden/display";
import { ensureMaddenLeague, getMaddenTeams } from "@/lib/madden/query";
import { buildShareMetadata } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildShareMetadata({
  title: "League rosters",
  description: "Full Madden 27 team rosters exported from the Companion App.",
  path: "/league/teams",
});

export default async function LeagueTeamsPage() {
  await ensureMaddenLeague();
  const teams = await getMaddenTeams();
  const divisions = new Map<string, typeof teams>();
  for (const team of teams) {
    const key = team.division || team.conference || "League";
    const rows = divisions.get(key) ?? [];
    rows.push(team);
    divisions.set(key, rows);
  }

  if (teams.length === 0) {
    return (
      <div className="space-y-6">
        <LeagueNav active="rosters" />
        <EmptyState
          title="No rosters indexed"
          description="Export League Info and team rosters from the Companion App."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
          Thirty-two clubs
        </p>
        <h1 className="text-3xl font-semibold uppercase tracking-[0.04em]">
          Rosters
        </h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Every franchise the Companion App sent. Open a club for the full
          roster and each player’s season stats.
        </p>
      </div>
      <LeagueNav active="rosters" />

      {[...divisions.entries()].map(([division, rows]) => (
        <Card key={division}>
          <CardHeader>
            <CardTitle>{division}</CardTitle>
            <CardDescription>{rows.length} clubs</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            {rows.map((team) => {
              const coach =
                team.franchise?.memberships[0]?.user.name || team.userName;
              return (
                <Link
                  key={team.id}
                  href={`/league/teams/${team.abbr}`}
                  className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-3 text-sm hover:bg-[var(--muted)]"
                >
                  <div>
                    <p className="font-semibold">
                      {team.abbr} {team.displayName}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {coach ? `Coach ${coach}` : "CPU / unassigned"} ·{" "}
                      {team._count.players} players
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">
                      {formatRecord(team.wins, team.losses, team.ties)}
                    </Badge>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      {team.ovr} OVR
                    </p>
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
