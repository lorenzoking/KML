import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/forms/submit-button";
import { reviewSubmission } from "@/actions/approvals";
import { CommissionerFileGameForm } from "@/components/forms/commissioner-file-game-form";
import { prisma } from "@/lib/prisma";
import { GAME_TYPE_LABELS } from "@/lib/constants";
import { getActiveSeason } from "@/lib/league";
import { formatBothSimScores } from "@/lib/sim-score";
import { formatMatchupScore, hasFinalScores } from "@/lib/game-score";
import { format } from "date-fns";

export default async function ApprovalsPage() {
  const { settings } = await getActiveSeason();
  const [pending, history, franchises] = await Promise.all([
    prisma.gameSubmission.findMany({
      where: { status: "PENDING" },
      include: {
        submitter: true,
        userTeam: true,
        opponentTeam: true,
        season: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.gameSubmission.findMany({
      where: { status: { in: ["APPROVED", "REJECTED"] } },
      include: {
        submitter: true,
        userTeam: true,
        opponentTeam: true,
        reviewedBy: true,
      },
      orderBy: { reviewedAt: "desc" },
      take: 20,
    }),
    prisma.franchise.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, abbreviation: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold uppercase tracking-wide">
          Pending approvals
        </h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          Approve to create official results. Played games award XP; simulated
          games update standings only (no coach XP). Force wins award game-played
          XP to the available coach only — the CPU score can wait until after
          the week advances. If the desk has to file a
          score for coaches, use the form below — reputation still applies, XP
          does not. Primetime is taken from the checkbox or the official
          Primetime poll slate.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>File a result for coaches</CardTitle>
          <CardDescription>
            Posts immediately. Coaches do not earn XP. Coaching Reputation and
            standings still count.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CommissionerFileGameForm
            franchises={franchises}
            currentSeason={settings.currentSeason}
            currentWeek={settings.currentWeek}
          />
        </CardContent>
      </Card>

      {pending.length === 0 ? (
        <EmptyState
          title="Inbox zero"
          description="No pending game submissions right now."
        />
      ) : (
        <div className="space-y-4">
          {pending.map((s) => (
            <Card key={s.id}>
              <CardHeader>
                <CardTitle>
                  {formatMatchupScore(s)}
                </CardTitle>
                <CardDescription>
                  Season {s.season.number} · Week {s.week} ·{" "}
                  {GAME_TYPE_LABELS[s.gameType]}
                  {s.isForceWin ? " · Force win" : ""}
                  {s.isPrimetime ? " · Primetime" : ""}
                  {s.isForceWin
                    ? " · play XP only"
                    : s.skipXp || s.gameType === "SIMULATED"
                      ? " · no XP"
                      : ""}
                  {s.filedByCommissioner ? " · desk filed" : ""}
                  {s.isForceWin ? "" : ` · ${formatBothSimScores(s)}`} · submitted by{" "}
                  {s.submitter.name ?? s.submitter.email} ·{" "}
                  {format(s.createdAt, "MMM d, h:mm a")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {s.isForceWin ? (
                  <p className="rounded-md border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm">
                    Force win claim. Approving awards game-played XP to{" "}
                    {s.userTeam.abbreviation} only
                    {hasFinalScores(s)
                      ? ". The simulated score will count in standings, not for a win bonus."
                      : ". The simulated score can be posted after the week advances."}
                  </p>
                ) : s.opponentSimScore != null &&
                (s.opponentSimScore <= 2 ||
                (s.userTeamSimScore != null && s.userTeamSimScore <= 2)) ? (
                  <p className="rounded-md border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm">
                    Low Sim Score
                    {s.opponentSimScore <= 2
                      ? ` (${s.opponentTeam.abbreviation} ${s.opponentSimScore}/5)`
                      : ""}
                    {s.userTeamSimScore != null && s.userTeamSimScore <= 2
                      ? ` (${s.userTeam.abbreviation} ${s.userTeamSimScore}/5)`
                      : ""}{" "}
                    — may count toward Bad Sim Reputation for that coach if the
                    pattern continues.
                    {s.userTeamSimScore == null
                      ? ` ${s.opponentTeam.abbreviation} has not submitted a Sim Score yet.`
                      : ""}
                  </p>
                ) : s.userTeamSimScore == null ? (
                  <p className="rounded-md border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm">
                    {s.opponentTeam.abbreviation} has not submitted a Sim Score for{" "}
                    {s.userTeam.abbreviation} yet. They can add it from the game page.
                  </p>
                ) : null}
                {s.notes ? (
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Notes: {s.notes}
                  </p>
                ) : null}
                <form
                  action={async (formData) => {
                    "use server";
                    await reviewSubmission(formData);
                  }}
                  className="space-y-3"
                >
                  <input type="hidden" name="submissionId" value={s.id} />
                  <div className="space-y-2">
                    <Label htmlFor={`note-${s.id}`}>Decision note</Label>
                    <Input
                      id={`note-${s.id}`}
                      name="decisionNote"
                      placeholder="Optional note for audit history"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <SubmitButton name="decision" value="APPROVE">
                      {s.isForceWin
                        ? "Approve force win (play XP)"
                        : s.skipXp || s.gameType === "SIMULATED"
                          ? "Approve (no XP)"
                          : "Approve"}
                    </SubmitButton>
                    <SubmitButton
                      name="decision"
                      value="REJECT"
                      variant="destructive"
                    >
                      Reject
                    </SubmitButton>
                  </div>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent decisions</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <EmptyState title="No decisions yet" />
          ) : (
            <ul className="space-y-3">
              {history.map((s) => (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-3 text-sm"
                >
                  <div>
                    <p className="font-medium">
                      {formatMatchupScore(s)}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {s.isForceWin ? "Force win · " : `${formatBothSimScores(s)} · `}
                      {s.reviewedBy?.name ?? "Commissioner"}
                      {s.isForceWin
                        ? " · play XP only"
                        : s.skipXp || s.filedByCommissioner
                          ? " · no XP"
                          : ""}
                      {s.decisionNote ? ` · ${s.decisionNote}` : ""}
                    </p>
                  </div>
                  <StatusBadge status={s.status} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
