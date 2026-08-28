import Link from "next/link";
import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/empty-state";
import {
  AwardRaceGrid,
  MvpHero,
  SeasonPulseRow,
  WeekHeaters,
} from "@/components/league/award-board";
import { LeagueNav } from "@/components/league/league-nav";
import { getLeagueBoard } from "@/lib/madden/awards";
import { displayWeek, racePhaseLabel } from "@/lib/madden/display";
import { ensureMaddenLeague } from "@/lib/madden/query";
import { buildShareMetadata } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildShareMetadata({
  title: "Award races",
  description:
    "Early MVP, OPOTY, DPOTY, and Rookie of the Year races from the Madden 27 Companion stats.",
  path: "/league",
});

export default async function LeagueRacesPage() {
  await ensureMaddenLeague();
  const board = await getLeagueBoard();
  const mvp = board.races.find((race) => race.id === "mvp");
  const leader = mvp?.candidates[0];

  if (board.weekIndex == null || !leader) {
    return (
      <div className="space-y-6">
        <LeagueNav active="races" />
        <EmptyState
          title="Waiting on weekly stats"
          description="Export one completed week of stats from the Companion App."
        />
      </div>
    );
  }

  const week = displayWeek(board.weekIndex);
  const phase = racePhaseLabel(week);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
          {phase} hardware · through Week {week}
        </p>
        <h1 className="text-3xl font-semibold uppercase tracking-[0.04em] sm:text-5xl">
          Award races
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted-foreground)]">
          MVP, Offensive Player, Defensive Player, and Rookie of the Year from
          the live Companion totals. Scores live under Games — this desk is
          for who is eating.
        </p>
      </div>
      <LeagueNav active="races" />

      <MvpHero
        leader={leader}
        phase={phase}
        week={week}
        chase={mvp?.candidates[1] ?? null}
      />

      <SeasonPulseRow rows={board.pulse} />

      <AwardRaceGrid races={board.races} />

      <WeekHeaters week={week} heaters={board.heaters} />

      <p className="text-xs text-[var(--muted-foreground)]">
        Desk formula, not a vote — production plus winning for MVP, skill work
        for OPOTY, sacks and takeaways for DPOTY, year-zero players for ROY.{" "}
        <Link href="/league/leaders" className="text-[var(--primary)]">
          Full leaderboards
        </Link>
        {" · "}
        <Link href="/league/teams" className="text-[var(--primary)]">
          All 32 rosters
        </Link>
        {" · "}
        <Link href="/games" className="text-[var(--primary)]">
          Games
        </Link>
      </p>
    </div>
  );
}
