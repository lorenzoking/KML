import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { SubmissionForm } from "@/components/forms/submission-form";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveSeason, getUserMembership } from "@/lib/league";
import { GAME_TYPE_LABELS } from "@/lib/constants";
import { format } from "date-fns";

export default async function SubmissionsPage() {
  const user = await requireUser();
  const { settings, season } = await getActiveSeason();
  const membership = await getUserMembership(user.id, season.id);

  const franchises = await prisma.franchise.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, abbreviation: true },
  });

  const history = await prisma.gameSubmission.findMany({
    where: { submitterId: user.id },
    include: { userTeam: true, opponentTeam: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold uppercase tracking-[0.06em]">
          Game submissions
        </h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          New results start as pending until a commissioner approves them.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Submit result</CardTitle>
            <CardDescription>
              Season {settings.currentSeason} · Week {settings.currentWeek}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!membership ? (
              <EmptyState
                title="No franchise assigned"
                description="Ask your commissioner to assign you a team before submitting."
              />
            ) : (
              <SubmissionForm
                franchises={franchises.filter(
                  (f) => f.id !== membership.franchiseId
                )}
                currentSeason={settings.currentSeason}
                currentWeek={settings.currentWeek}
                userTeamName={membership.franchise.name}
              />
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Submission history</CardTitle>
            <CardDescription>Your audit trail of submitted games</CardDescription>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <EmptyState title="No submissions yet" />
            ) : (
              <ul className="space-y-3">
                {history.map((s) => (
                  <li
                    key={s.id}
                    className="rounded-lg border border-[var(--border)] px-3 py-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">
                        {s.userTeam.abbreviation} {s.userScore}–{s.opponentScore}{" "}
                        {s.opponentTeam.abbreviation}
                      </p>
                      <StatusBadge status={s.status} />
                    </div>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      Week {s.week} · {GAME_TYPE_LABELS[s.gameType]} ·{" "}
                      {format(s.createdAt, "MMM d, yyyy h:mm a")}
                    </p>
                    {s.decisionNote ? (
                      <p className="mt-1 text-xs">Decision: {s.decisionNote}</p>
                    ) : null}
                    {s.notes ? (
                      <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                        Notes: {s.notes}
                      </p>
                    ) : null}
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
