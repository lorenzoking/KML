import type { Metadata } from "next";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { TeamMark } from "@/components/games/scoreboard";
import { getHallOfChampions } from "@/lib/champions";
import { buildShareMetadata } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildShareMetadata({
  title: "Hall of Champions",
  description: "Super Bowl champions of the Kings Madden League.",
  path: "/champions",
});

function recordLine(wins: number, losses: number, ties: number) {
  return ties > 0 ? `${wins}–${losses}–${ties}` : `${wins}–${losses}`;
}

export default async function ChampionsPage() {
  const titles = await getHallOfChampions();
  const latest = titles[0];

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
          Kings Madden League
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-4xl uppercase tracking-[0.06em] sm:text-5xl">
          Hall of Champions
        </h1>
        <p className="max-w-xl text-sm text-[var(--muted-foreground)] sm:text-base">
          Every season that has been played out. The Super Bowl score is the
          one that gets engraved.
        </p>
      </header>

      {latest ? (
        <section className="relative overflow-hidden rounded-3xl border border-[color-mix(in_srgb,var(--primary)_45%,var(--border))] bg-[var(--surface-raised)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(212,175,55,0.22),transparent_55%)]" />
          <div className="relative flex flex-col gap-6 p-6 sm:p-8">
            <div className="flex items-center gap-2 text-[var(--primary)]">
              <Trophy className="size-4" />
              <p className="text-xs font-semibold uppercase tracking-[0.2em]">
                Season {latest.seasonNumber}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <TeamMark abbr={latest.championAbbr} color={latest.championColor} size="lg" />
              <div className="min-w-0">
                <p className="font-[family-name:var(--font-display)] text-3xl uppercase tracking-wide sm:text-4xl">
                  {latest.championName}
                </p>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  def. {latest.runnerUpName ?? "the league"}{" "}
                  <span className="font-semibold text-[var(--foreground)]">
                    {latest.championScore}–{latest.runnerUpScore}
                  </span>
                </p>
              </div>
            </div>
            <p className="text-sm text-[var(--muted-foreground)]">
              {latest.coachName ? `${latest.coachName} · ` : ""}
              {recordLine(latest.wins, latest.losses, latest.ties)} regular season
            </p>
          </div>
        </section>
      ) : (
        <p className="rounded-2xl border border-dashed border-[var(--border)] px-4 py-8 text-sm text-[var(--muted-foreground)]">
          The first champion will be engraved when a season is archived.
        </p>
      )}

      {titles.length > 1 ? (
        <ul className="grid gap-3">
          {titles.slice(1).map((title) => (
            <li
              key={title.seasonNumber}
              className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3"
            >
              <TeamMark abbr={title.championAbbr} color={title.championColor} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="font-[family-name:var(--font-display)] uppercase tracking-wide">
                  Season {title.seasonNumber} · {title.championAbbr}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  def. {title.runnerUpAbbr ?? "—"} {title.championScore}–
                  {title.runnerUpScore}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <p className="text-sm text-[var(--muted-foreground)]">
        Season 1 scores stay on the{" "}
        <Link href="/games?season=1&tab=playoffs" className="text-[var(--primary)] underline-offset-4 hover:underline">
          Season 1 bracket
        </Link>
        .
      </p>
    </div>
  );
}
