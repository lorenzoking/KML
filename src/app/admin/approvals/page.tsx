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
import { prisma } from "@/lib/prisma";
import { GAME_TYPE_LABELS } from "@/lib/constants";
import { format } from "date-fns";

export default async function ApprovalsPage() {
  const [pending, history] = await Promise.all([
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
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold uppercase tracking-wide">
          Pending approvals
        </h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          Approve to create official results. Played games award XP; simulated
          games update standings only (no coach XP). Reject keeps audit history.
        </p>
      </div>

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
                  {s.userTeam.name} {s.userScore}–{s.opponentScore}{" "}
                  {s.opponentTeam.name}
                </CardTitle>
                <CardDescription>
                  Season {s.season.number} · Week {s.week} ·{" "}
                  {GAME_TYPE_LABELS[s.gameType]}
                  {s.gameType === "SIMULATED" ? " · no XP" : ""} ·{" "}
                  {s.opponentTeam.abbreviation} Sim {s.opponentSimScore}/5 · submitted by{" "}
                  {s.submitter.name ?? s.submitter.email} ·{" "}
                  {format(s.createdAt, "MMM d, h:mm a")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {s.opponentSimScore <= 2 ? (
                  <p className="rounded-md border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm">
                    Low opponent Sim Score ({s.opponentTeam.abbreviation}{" "}
                    {s.opponentSimScore}/5) — may count toward Bad Sim Reputation for
                    that coach if the pattern continues.
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
                      {s.gameType === "SIMULATED"
                        ? "Approve (standings only)"
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
                      {s.userTeam.abbreviation} {s.userScore}–{s.opponentScore}{" "}
                      {s.opponentTeam.abbreviation}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {s.opponentTeam.abbreviation} Sim {s.opponentSimScore}/5 ·{" "}
                      {s.reviewedBy?.name ?? "Commissioner"}
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
