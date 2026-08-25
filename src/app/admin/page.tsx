import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { formatMatchupScore } from "@/lib/game-score";
import { EmptyState } from "@/components/ui/empty-state";
import { prisma } from "@/lib/prisma";
import { getActiveSeason } from "@/lib/league";
import { addXpAdjustment, addReputationAdjustment } from "@/actions/adjustments";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/forms/submit-button";
import { format } from "date-fns";

export default async function AdminPage() {
  const { settings, season } = await getActiveSeason();

  const [pendingCount, approvedCount, userCount, assignedCount, pendingTeamRequests, recent, audits, users] =
    await Promise.all([
      prisma.gameSubmission.count({ where: { status: "PENDING" } }),
      prisma.gameSubmission.count({ where: { status: "APPROVED" } }),
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.leagueMembership.count({
        where: { seasonId: season.id, isActive: true },
      }),
      prisma.user.count({
        where: {
          deletedAt: null,
          requestedFranchiseId: { not: null },
          memberships: { none: { seasonId: season.id, isActive: true } },
        },
      }),
      prisma.gameSubmission.findMany({
        include: { submitter: true, userTeam: true, opponentTeam: true },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      prisma.auditLog.findMany({
        include: { actor: true },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.user.findMany({
        where: { role: "USER", deletedAt: null },
        orderBy: { name: "asc" },
        include: {
          memberships: {
            where: { seasonId: season.id, isActive: true },
            include: { franchise: true },
          },
        },
      }),
    ]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric title="Pending approvals" value={String(pendingCount)} />
        <Metric title="Approved games" value={String(approvedCount)} />
        <Metric title="Users" value={String(userCount)} />
        <Metric
          title="Teams assigned"
          value={`${assignedCount}/32`}
          hint={`Season ${settings.currentSeason} · Week ${settings.currentWeek}`}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link href="/admin/approvals">Review approvals</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/users">Manage users</Link>
        </Button>
        {pendingTeamRequests > 0 ? (
          <Button asChild variant="outline">
            <Link href="/admin/users?needsTeam=1">
              Team requests ({pendingTeamRequests})
            </Link>
          </Button>
        ) : null}
        <Button asChild variant="outline">
          <Link href="/admin/teams">Manage teams</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/season">Season controls</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/stories">Primetime polls</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/contracts">Contract comps</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/settings">Edit settings</Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent submissions</CardTitle>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <EmptyState title="No submissions" />
            ) : (
              <ul className="space-y-3">
                {recent.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span>
                      {formatMatchupScore(s)}
                      <span className="text-[var(--muted-foreground)]">
                        {" "}
                        · {s.submitter.name}
                      </span>
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
            <CardTitle>Audit trail</CardTitle>
            <CardDescription>Major admin and approval actions</CardDescription>
          </CardHeader>
          <CardContent>
            {audits.length === 0 ? (
              <EmptyState title="No audit events" />
            ) : (
              <ul className="space-y-3 text-sm">
                {audits.map((a) => (
                  <li key={a.id} className="border-b border-[var(--border)] pb-2">
                    <p className="font-medium">{a.action}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {a.actor?.name ?? "System"} ·{" "}
                      {format(a.createdAt, "MMM d, h:mm a")} · {a.entityType}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Manual XP adjustment</CardTitle>
          </CardHeader>
          <CardContent>
            <AdjustmentForm
              users={users}
              amountLabel="XP change"
              formAction={async (formData) => {
                "use server";
                await addXpAdjustment(formData);
              }}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Coach reputation adjustment</CardTitle>
          </CardHeader>
          <CardContent>
            <AdjustmentForm
              users={users}
              amountLabel="Rep change"
              formAction={async (formData) => {
                "use server";
                await addReputationAdjustment(formData);
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Metric({
  title,
  value,
  hint,
}: {
  title: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
      {hint ? (
        <CardContent>
          <p className="text-xs text-[var(--muted-foreground)]">{hint}</p>
        </CardContent>
      ) : null}
    </Card>
  );
}

function AdjustmentForm({
  users,
  formAction,
  amountLabel,
}: {
  users: {
    id: string;
    name: string | null;
    email: string;
    memberships: { franchise: { abbreviation: string } }[];
  }[];
  formAction: (formData: FormData) => Promise<void>;
  amountLabel: string;
}) {
  return (
    <form action={formAction} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor={`userId-${amountLabel}`}>Coach</Label>
        <Select id={`userId-${amountLabel}`} name="userId" required defaultValue="">
          <option value="" disabled>
            Select coach
          </option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name ?? u.email}
              {u.memberships[0] ? ` (${u.memberships[0].franchise.abbreviation})` : ""}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`amount-${amountLabel}`}>{amountLabel}</Label>
        <Input
          id={`amount-${amountLabel}`}
          name="amount"
          type="number"
          required
          placeholder="e.g. 3 or -5"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`reason-${amountLabel}`}>Reason</Label>
        <Input id={`reason-${amountLabel}`} name="reason" required />
      </div>
      <SubmitButton>Save adjustment</SubmitButton>
    </form>
  );
}
