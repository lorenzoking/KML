import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ReputationBadge, StatusBadge } from "@/components/status-badge";
import { isCommissioner, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getActiveSeason,
  getFranchiseSeasonRecord,
  getReputation,
  getUserMembership,
  getXpTotal,
} from "@/lib/league";
import { getUserCareerStats } from "@/lib/career";
import { formatRecord } from "@/lib/utils";
import { GAME_TYPE_LABELS } from "@/lib/constants";
import { computeReputationScore } from "@/lib/reputation";
import { getReputationGrade } from "@/lib/coach/grades";
import { getJobSecurityStatus } from "@/lib/coach/job-security";

export default async function DashboardPage() {
  const user = await requireUser();
  const commissionerUi = await isCommissioner(user);
  const { settings, season } = await getActiveSeason();
  const [
    membership,
    xpTotal,
    reputation,
    career,
    coachProfile,
    pendingMine,
  ] = await Promise.all([
    getUserMembership(user.id, season.id),
    getXpTotal(user.id),
    getReputation(user.id),
    getUserCareerStats(user.id),
    prisma.coachProfile.findUnique({
      where: { userId: user.id },
      include: { coachIdentity: true },
    }),
    prisma.gameSubmission.findMany({
      where: { submitterId: user.id, status: "PENDING" },
      include: { opponentTeam: true, userTeam: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const teamStanding = membership
    ? await getFranchiseSeasonRecord(season.id, membership.franchiseId)
    : undefined;
  const gmRepScore = computeReputationScore(
    settings.startingGmRepScore,
    reputation.adjustments.map((row) => ({ amount: row.gmAmount }))
  );
  const jobStatus = getJobSecurityStatus({
    coachRepScore: reputation.score,
    gmRepScore,
    expectationScore: coachProfile?.expectationScore ?? 0,
    tankingStrikes: coachProfile?.tankingStrikes ?? 0,
    gmStrikes: coachProfile?.gmStrikes ?? 0,
    hotSeatThreshold: settings.hotSeatThreshold,
    firingThreshold: settings.firingThreshold,
    watchThreshold: settings.watchThreshold,
    override: coachProfile?.hotSeatStatusOverride,
  });

  const [recentApproved, pendingCount, recentLeague] = await Promise.all([
    membership
      ? prisma.gameSubmission.findMany({
          where: { submitterId: user.id, status: "APPROVED" },
          include: { opponentTeam: true, userTeam: true },
          orderBy: { reviewedAt: "desc" },
          take: 5,
        })
      : Promise.resolve([]),
    commissionerUi
      ? prisma.gameSubmission.count({ where: { status: "PENDING" } })
      : Promise.resolve(0),
    commissionerUi
      ? prisma.gameSubmission.findMany({
          include: {
            submitter: true,
            userTeam: true,
            opponentTeam: true,
          },
          orderBy: { createdAt: "desc" },
          take: 8,
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:flex sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
            {commissionerUi ? "Commissioner desk" : "Coach desk"}
          </p>
          <h1 className="text-2xl font-semibold uppercase tracking-[0.04em] sm:text-3xl sm:tracking-[0.06em]">
            Welcome, {user.name ?? "Coach"}
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Season {settings.currentSeason} · Week {settings.currentWeek}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          {membership ? (
            <Button asChild className="w-full sm:w-auto">
              <Link href="/games?tab=week#submit-result">Submit result</Link>
            </Button>
          ) : null}
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/games?tab=standings">Standings</Link>
          </Button>
          {commissionerUi ? (
            <Button asChild variant="outline" className="col-span-2 w-full sm:w-auto">
              <Link href="/admin/approvals">
                Approvals{pendingCount ? ` (${pendingCount})` : ""}
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="stagger grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
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

      {commissionerUi ? (
        <Card>
          <CardHeader>
            <CardTitle>Commissioner snapshot</CardTitle>
            <CardDescription>Quick links and recent activity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
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

      <Card>
        <CardHeader>
          <CardTitle>Coaching profile overview</CardTitle>
          <CardDescription>
            Snapshot of your current coaching profile and job security.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <ProfilePill
              label="Coach identity"
              value={coachProfile?.coachIdentity?.name ?? "Unassigned"}
            />
            <ProfilePill
              label="Team identity"
              value={membership?.franchise.teamIdentity?.name ?? "Unassigned"}
            />
            <ProfilePill
              label="Job security"
              value={jobStatus.replaceAll("_", " ")}
              badgeVariant={jobSecurityBadgeVariant(jobStatus)}
            />
            <ProfilePill
              label="Contract years left"
              value={String(coachProfile?.contractYearsLeft ?? 3)}
            />
            <ProfilePill
              label="Autopilot season"
              value={
                coachProfile?.isAutopilot
                  ? `Yes${coachProfile.autopilotSeason ? ` (S${coachProfile.autopilotSeason})` : ""}`
                  : "No"
              }
              badgeVariant={coachProfile?.isAutopilot ? "pressured" : undefined}
            />
            <ProfilePill
              label="Expectation score"
              value={String(coachProfile?.expectationScore ?? 0)}
            />
            <ProfilePill
              label="Strikes"
              value={`T${coachProfile?.tankingStrikes ?? 0} / G${coachProfile?.gmStrikes ?? 0}`}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-[var(--border)] px-3 py-2">
              <p className="text-xs text-[var(--muted-foreground)]">Coach reputation grade</p>
              <p className="text-sm font-medium">
                {reputation.score} ({getReputationGrade(reputation.score)})
              </p>
            </div>
            <div className="rounded-lg border border-[var(--border)] px-3 py-2">
              <p className="text-xs text-[var(--muted-foreground)]">GM reputation grade</p>
              <p className="text-sm font-medium">
                {gmRepScore} ({getReputationGrade(gmRepScore)})
              </p>
            </div>
          </div>

          <Button asChild variant="outline" size="sm">
            <Link href={`/coach/profiles/${user.id}`}>Open full coaching profile</Link>
          </Button>
        </CardContent>
      </Card>

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
                description="Submit a game from Games → Week results."
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

function ProfilePill({
  label,
  value,
  badgeVariant,
}: {
  label: string;
  value: string;
  badgeVariant?: "elite" | "stable" | "pressured" | "hotseat" | "outline";
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] px-3 py-2">
      <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
      {badgeVariant ? (
        <div className="mt-1">
          <Badge variant={badgeVariant}>{value}</Badge>
        </div>
      ) : (
        <p className="text-sm font-medium">{value}</p>
      )}
    </div>
  );
}

function jobSecurityBadgeVariant(status: string) {
  switch (status) {
    case "SECURE":
      return "elite" as const;
    case "STABLE":
      return "stable" as const;
    case "WATCH":
    case "PRESSURED":
      return "pressured" as const;
    case "HOT_SEAT":
    case "FIRING_ELIGIBLE":
      return "hotseat" as const;
    default:
      return "outline" as const;
  }
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
    <Card className="surface-hover">
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="break-words text-lg leading-tight sm:text-2xl">
          {value}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-[var(--muted-foreground)]">{hint}</p>
      </CardContent>
    </Card>
  );
}
