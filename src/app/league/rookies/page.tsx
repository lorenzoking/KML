import Link from "next/link";
import type { Metadata } from "next";
import { TeamMark } from "@/components/games/scoreboard";
import { LeagueNav } from "@/components/league/league-nav";
import { ensureMaddenLeague } from "@/lib/madden/query";
import { getRookieClass } from "@/lib/madden/rookies";
import { buildShareMetadata } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildShareMetadata({
  title: "Rookie watch",
  description: "The first Kings Madden League rookie class, from the Companion rosters.",
  path: "/league/rookies",
});

export default async function RookieWatchPage() {
  await ensureMaddenLeague();
  const rookies = await getRookieClass();
  const headliners = rookies.players.filter((player) => player.overall >= 80);
  const byTeam = new Map<string, typeof rookies.players>();
  for (const player of rookies.players) {
    const rows = byTeam.get(player.teamAbbr) ?? [];
    rows.push(player);
    byTeam.set(player.teamAbbr, rows);
  }
  const teams = [...byTeam.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
          Season {rookies.seasonNumber} · first draft class
        </p>
        <h1 className="text-3xl font-semibold uppercase tracking-[0.04em] sm:text-5xl">
          Rookie watch
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted-foreground)]">
          {rookies.players.length} rookies on active rosters
          {rookies.practiceSquad > 0
            ? `, plus ${rookies.practiceSquad} on practice squads`
            : ""}
          . This is the first class the league drafted together.
        </p>
      </div>
      <LeagueNav active="rookies" />

      {headliners.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-[family-name:var(--font-display)] text-sm uppercase tracking-[0.16em] text-[var(--primary)]">
            Headliners
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {headliners.map((player) => (
              <Link
                key={player.id}
                href={`/league/teams/${player.teamAbbr.toLowerCase()}`}
                className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-3 hover:bg-[var(--muted)]"
              >
                <TeamMark abbr={player.teamAbbr} color={player.teamColor} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-[family-name:var(--font-display)] uppercase tracking-wide">
                    {player.name}
                  </p>
                  <p className="truncate text-xs text-[var(--muted-foreground)]">
                    {player.position} · {player.teamAbbr}
                    {player.coachName ? ` · ${player.coachName}` : ""}
                    {player.line ? ` · ${player.line}` : ""}
                  </p>
                </div>
                <p className="font-[family-name:var(--font-display)] text-xl text-[var(--primary)]">
                  {player.overall}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <h2 className="font-[family-name:var(--font-display)] text-sm uppercase tracking-[0.16em] text-[var(--primary)]">
          The class
        </h2>
        <div className="grid gap-3">
          {teams.map(([abbr, rows]) => (
            <div
              key={abbr}
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-3"
            >
              <Link
                href={`/league/teams/${abbr.toLowerCase()}`}
                className="mb-2 flex items-center gap-2"
              >
                <TeamMark abbr={abbr} color={rows[0]?.teamColor} size="sm" />
                <span className="font-[family-name:var(--font-display)] uppercase tracking-wide">
                  {rows[0]?.teamName ?? abbr}
                </span>
                <span className="text-xs text-[var(--muted-foreground)]">
                  {rows.length} rookie{rows.length === 1 ? "" : "s"}
                </span>
              </Link>
              <ul className="grid gap-1 sm:grid-cols-2">
                {rows.map((player) => (
                  <li
                    key={player.id}
                    className="flex items-baseline justify-between gap-3 rounded-xl px-2 py-1.5 text-sm"
                  >
                    <span className="min-w-0">
                      <span className="mr-2 text-xs text-[var(--primary)]">{player.position}</span>
                      <span className="font-medium">{player.name}</span>
                      {player.line ? (
                        <span className="mt-0.5 block truncate text-xs text-[var(--muted-foreground)]">
                          {player.line}
                        </span>
                      ) : null}
                    </span>
                    <span className="shrink-0 tabular-nums text-[var(--muted-foreground)]">
                      {player.overall}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
