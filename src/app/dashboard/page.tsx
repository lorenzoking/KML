import Link from "next/link";
import { Role } from "@prisma/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ReputationBadge, StatusBadge } from "@/components/status-badge";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getActiveSeason,
  getReputation,
  getSeasonStandings,
  getUserMembership,
  getXpTotal,
} from "@/lib/league";
import { getUserCareerStats } from "@/lib/career";
import { formatRecord } from "@/lib/utils";
import { GAME_TYPE_LABELS } from "@/lib/constants";

export default async function DashboardPage() {
  const user = await requireUser();
  const { settings, season } = await getActiveSeason();
  const membership = await getUserMembership(user.id, season.id);
  const standings = await getSeasonStandings(season.id);
  const teamStanding = membership
    ? standings.find((s) => s.franchiseId === membership.franchiseId)
    : undefined;
  const xpTotal = await getXpTotal(user.id);
  const reputation = await getReputation(user.id);
  const career = await getUserCareerStats(user.id);

  const recentApproved = membership
    ? await prisma.gameSubmission.findMany({
        where: {
          submitterId: user.id,
          status: "APPROVED",
        },
        include: { opponentTeam: true, userTeam: true },
        orderBy: { reviewedAt: "desc" },
        take: 5,
      })
    : [];

  const pendingMine = await prisma.gameSubmission.findMany({
    where: { submitterId: user.id, status: "PENDING" },
    include: { opponentTeam: true, userTeam: true },
    orderBy: { createdAt: "desc" },
  });

  const pendingCount =
    user.role === Role.COMMISSIONER
      ? await prisma.gameSubmission.count({ where: { status: "PENDING" } })
      : 0;

  const recentLeague =
    user.role === Role.COMMISSIONER
      ? await prisma.gameSubmission.findMany({
          include: {
            submitter: true,
            userTeam: true,
            opponentTeam: true,
          },
          orderBy: { createdAt: "desc" },
          take: 8,
        })
      : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
            {user.role === Role.COMMISSIONER ? "Commissioner desk" : "Coach desk"}
          </p>
          <h1 className="text-3xl font-semibold uppercase tracking-[0.06em]">
            Welcome, {user.name ?? "Coach"}
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Season {settings.currentSeason} · Week {settings.currentWeek}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/submissions">Submit result</Link>
          </Button>
          {user.role === Role.COMMISSIONER ? (
            <Button asChild variant="outline">
              <Link href="/admin/approvals">
                Approvals{pendingCount ? ` (${pendingCount})` : ""}
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Assigned team"
          value={membership?.franchise.name ?? "Unassigned"}
          hint={membership?.franchise.abbreviation ?? "Ask commissioner for a team"}
        />
        <StatCard
          label="Season record"
          value={
            teamStanding
              ? formatRecord(teamStanding.wins, teamStanding.losses)
              : "0-0"
          }
          hint={teamStanding?.form ? `Form ${teamStanding.form}` : "No games yet"}
        />
        <StatCard
          label="Career record"
          value={formatRecord(career.wins, career.losses)}
          hint={`${career.seasonsPlayed} season${career.seasonsPlayed === 1 ? "" : "s"}`}
        />
        <StatCard
          label="Season XP"
          value={String(
            career.bySeason.find((s) => s.seasonId === season.id)?.xp ?? 0
          )}
          hint={`Career XP ${xpTotal}`}
        />
        <StatCard label="Career XP" value={String(career.careerXp)} hint="All seasons combined" />
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Coach reputation</CardDescription>
            <CardTitle className="text-3xl">{reputation.score}</CardTitle>
          </CardHeader>
          <CardContent>
            <ReputationBadge label={reputation.label} />
          </CardContent>
        </Card>
      </div>

      {user.role === Role.COMMISSIONER ? (
        <Card>
          <CardHeader>
            <CardTitle>Commissioner snapshot</CardTitle>
            <CardDescription>Quick links and recent activity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link href="/admin/approvals">Pending approvals ({pendingCount})</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/admin/teams">Assign teams</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/admin/settings">League settings</Link>
              </Button>
            </div>
            {recentLeague.length === 0 ? (
              <EmptyState title="No submissions yet" />
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {recentLeague.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                    <span>
                      {s.userTeam.abbreviation} {s.userScore}–{s.opponentScore}{" "}
                      {s.opponentTeam.abbreviation}
                      <span className="text-[var(--muted-foreground)]">
                        {" "}
                        · W{s.week} · {s.submitter.name}
                      </span>
                    </span>
                    <StatusBadge status={s.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pending submissions</CardTitle>
            <CardDescription>Awaiting commissioner review</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingMine.length === 0 ? (
              <EmptyState
                title="No pending results"
                description="Submit a game from the Submissions page."
              />
            ) : (
              <ul className="space-y-3">
                {pendingMine.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
                  >
                    <span>
                      W{s.week}: {s.userTeam.abbreviation} {s.userScore}–
                      {s.opponentScore} {s.opponentTeam.abbreviation}
                    </span>
                    <StatusBadge status={s.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent approved games</CardTitle>
            <CardDescription>Official results for your team</CardDescription>
          </CardHeader>
          <CardContent>
            {recentApproved.length === 0 ? (
              <EmptyState title="No approved games yet" />
            ) : (
              <ul className="space-y-3">
                {recentApproved.map((s) => (
                  <li
                    key={s.id}
                    className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">
                        {s.userTeam.abbreviation} {s.userScore}–{s.opponentScore}{" "}
                        {s.opponentTeam.abbreviation}
                      </span>
                      <StatusBadge status={s.status} />
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Week {s.week} · {GAME_TYPE_LABELS[s.gameType]}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl leading-tight">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-[var(--muted-foreground)]">{hint}</p>
      </CardContent>
    </Card>
  );
}
