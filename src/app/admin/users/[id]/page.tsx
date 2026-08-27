import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/forms/submit-button";
import { Badge } from "@/components/ui/badge";
import { ReputationBadge, StatusBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { prisma } from "@/lib/prisma";
import { getActiveSeason } from "@/lib/league";
import { getUserCareerStats } from "@/lib/career";
import { deleteUser, updateUser } from "@/actions/users";
import { assignUserToTeam } from "@/actions/teams";
import { addXpAdjustment, addReputationAdjustment } from "@/actions/adjustments";
import { formatRecord } from "@/lib/utils";
import { GAME_TYPE_LABELS } from "@/lib/constants";
import { formatMatchupScore } from "@/lib/game-score";
import { formatLeagueDate } from "@/lib/datetime";

export default async function AdminUserDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ updated?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const { season } = await getActiveSeason();

  const user = await prisma.user.findFirst({
    where: { id, deletedAt: null },
    include: {
      memberships: {
        where: { seasonId: season.id },
        include: { franchise: true },
        orderBy: { assignedAt: "asc" },
      },
      requestedFranchise: true,
      submissions: {
        include: { userTeam: true, opponentTeam: true, season: true },
        orderBy: { createdAt: "desc" },
        take: 25,
      },
      xpAdjustmentsReceived: {
        orderBy: { createdAt: "desc" },
        take: 15,
        include: { createdBy: true, season: true },
      },
      reputationReceived: {
        orderBy: { createdAt: "desc" },
        take: 15,
        include: { createdBy: true },
      },
    },
  });

  if (!user) notFound();

  const [career, franchises] = await Promise.all([
    getUserCareerStats(user.id),
    prisma.franchise.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  const currentMembership = user.memberships.find((m) => m.isActive);

  return (
    <div className="space-y-6">
      {query.updated === "1" ? (
        <p className="success-banner rounded-md px-3 py-2 text-sm">
          User updated.
        </p>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
            <Link href="/admin/users" className="hover:text-[var(--foreground)]">
              Users
            </Link>{" "}
            / manage
          </p>
          <h2 className="text-2xl font-semibold uppercase tracking-wide">
            {user.name ?? "Unnamed coach"}
          </h2>
          <p className="text-sm text-[var(--muted-foreground)]">{user.email}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{user.role}</Badge>
          <Badge variant={user.isActive ? "stable" : "pressured"}>
            {user.isActive ? "Active" : "Inactive"}
          </Badge>
          <ReputationBadge
            label={career.reputationLabel}
            score={career.reputationScore}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Career record" value={formatRecord(career.wins, career.losses)} />
        <Metric label="Career XP" value={String(career.careerXp)} />
        <Metric label="Seasons played" value={String(career.seasonsPlayed)} />
        <Metric
          label="Current team"
          value={currentMembership?.franchise.abbreviation ?? "Unassigned"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account settings</CardTitle>
            <CardDescription>Role, active status, and commissioner notes</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              action={async (formData) => {
                "use server";
                await updateUser(formData);
              }}
              className="space-y-3"
            >
              <input type="hidden" name="userId" value={user.id} />
              <div className="space-y-2">
                <Label htmlFor="name">Display name</Label>
                <Input id="name" name="name" defaultValue={user.name ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select id="role" name="role" defaultValue={user.role}>
                  <option value="USER">Coach</option>
                  <option value="COMMISSIONER">Commissioner</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="isActive">Status</Label>
                <Select
                  id="isActive"
                  name="isActive"
                  defaultValue={user.isActive ? "true" : "false"}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminNotes">Admin notes</Label>
                <Textarea
                  id="adminNotes"
                  name="adminNotes"
                  defaultValue={user.adminNotes ?? ""}
                  placeholder="Internal notes about this coach"
                />
              </div>
              <SubmitButton>Save user</SubmitButton>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Season {season.number} team</CardTitle>
            <CardDescription>
              Firing/unassigning or moving teams keeps prior stints (and those stats)
              on this coach&apos;s career.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!currentMembership && user.requestedFranchise ? (
              <div className="rounded-lg border border-[color-mix(in_srgb,var(--primary)_35%,var(--border))] bg-[color-mix(in_srgb,var(--primary)_8%,transparent)] px-3 py-2 text-sm">
                <p className="font-medium">
                  Requested: {user.requestedFranchise.name} (
                  {user.requestedFranchise.abbreviation})
                </p>
                {user.teamRequestNote ? (
                  <p className="mt-1 text-[var(--muted-foreground)]">
                    Note: {user.teamRequestNote}
                  </p>
                ) : null}
              </div>
            ) : null}
            {user.memberships.length > 0 ? (
              <ul className="space-y-1 text-xs text-[var(--muted-foreground)]">
                {user.memberships.map((m) => (
                  <li key={m.id}>
                    {m.franchise.abbreviation}: weeks {m.startedWeek}
                    {m.endedWeek ? `–${m.endedWeek}` : "+"}{" "}
                    {m.isActive ? "(active)" : "(ended)"}
                  </li>
                ))}
              </ul>
            ) : null}
            <form
              action={async (formData) => {
                "use server";
                await assignUserToTeam(formData);
              }}
              className="space-y-3"
            >
              <input type="hidden" name="userId" value={user.id} />
              <input
                type="hidden"
                name="returnTo"
                value={`/admin/users/${user.id}?updated=1`}
              />
              <Select
                name="franchiseId"
                defaultValue={
                  currentMembership?.franchiseId ??
                  user.requestedFranchiseId ??
                  "unassign"
                }
              >
                <option value="unassign">Unassign / fire</option>
                {franchises.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                    {user.requestedFranchiseId === f.id ? " (requested)" : ""}
                  </option>
                ))}
              </Select>
              <SubmitButton>Update assignment</SubmitButton>
            </form>

            <div className="grid gap-3 sm:grid-cols-2">
              <form
                action={async (formData) => {
                  "use server";
                  await addXpAdjustment(formData);
                }}
                className="space-y-2 rounded-lg border border-[var(--border)] p-3"
              >
                <p className="text-sm font-medium">XP adjustment</p>
                <input type="hidden" name="userId" value={user.id} />
                <Input name="amount" type="number" placeholder="Amount" required />
                <Input name="reason" placeholder="Reason" required />
                <SubmitButton size="sm">Add XP</SubmitButton>
              </form>
              <form
                action={async (formData) => {
                  "use server";
                  await addReputationAdjustment(formData);
                }}
                className="space-y-2 rounded-lg border border-[var(--border)] p-3"
              >
                <p className="text-sm font-medium">Reputation adjustment</p>
                <input type="hidden" name="userId" value={user.id} />
                <Input name="amount" type="number" placeholder="Amount" required />
                <Input name="reason" placeholder="Reason" required />
                <SubmitButton size="sm">Add rep</SubmitButton>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Career coaching stints</CardTitle>
          <CardDescription>
            Fired/rehired coaches keep every team stint. Stats stay attached to the
            coach across seasons and mid-season moves.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {career.bySeason.length === 0 ? (
            <EmptyState title="No season history yet" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Season</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Weeks</TableHead>
                  <TableHead>Record</TableHead>
                  <TableHead>PF</TableHead>
                  <TableHead>PA</TableHead>
                  <TableHead>XP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...career.bySeason].reverse().map((row) => (
                  <TableRow key={row.stintId}>
                    <TableCell>
                      S{row.seasonNumber}
                      {!row.isActive ? (
                        <span className="ml-1 text-xs text-[var(--muted-foreground)]">
                          ended
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell>{row.franchiseAbbr ?? "—"}</TableCell>
                    <TableCell>
                      {row.startedWeek}
                      {row.endedWeek != null ? `–${row.endedWeek}` : "+"}
                    </TableCell>
                    <TableCell>{formatRecord(row.wins, row.losses)}</TableCell>
                    <TableCell>{row.pointsFor}</TableCell>
                    <TableCell>{row.pointsAgainst}</TableCell>
                    <TableCell>{row.xp || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="border-rose-500/30">
        <CardHeader>
          <CardTitle>Remove user</CardTitle>
          <CardDescription>
            Soft remove hides them from the league but keeps career history if you
            ever need audit data. Permanent delete erases the account and cascaded
            rows.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <form
            action={async (formData) => {
              "use server";
              await deleteUser(formData);
            }}
            className="space-y-3 rounded-lg border border-[var(--border)] p-3"
          >
            <input type="hidden" name="userId" value={user.id} />
            <input type="hidden" name="mode" value="soft" />
            <p className="text-sm font-medium">Remove from league</p>
            <Label htmlFor="soft-confirm">
              Type <code>REMOVE {user.email}</code>
            </Label>
            <Input id="soft-confirm" name="confirm" required />
            <SubmitButton variant="destructive" size="sm">
              Remove user
            </SubmitButton>
          </form>
          <form
            action={async (formData) => {
              "use server";
              await deleteUser(formData);
            }}
            className="space-y-3 rounded-lg border border-rose-500/40 p-3"
          >
            <input type="hidden" name="userId" value={user.id} />
            <input type="hidden" name="mode" value="hard" />
            <p className="text-sm font-medium">Permanently delete</p>
            <Label htmlFor="hard-confirm">
              Type <code>DELETE {user.email}</code>
            </Label>
            <Input id="hard-confirm" name="confirm" required />
            <SubmitButton variant="destructive" size="sm">
              Permanently delete
            </SubmitButton>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent submissions</CardTitle>
          </CardHeader>
          <CardContent>
            {user.submissions.length === 0 ? (
              <EmptyState title="No submissions" />
            ) : (
              <ul className="space-y-3 text-sm">
                {user.submissions.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-2 border-b border-[var(--border)] pb-2"
                  >
                    <div>
                      <p className="font-medium">
                        S{s.season.number} W{s.week}: {formatMatchupScore(s)}
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {GAME_TYPE_LABELS[s.gameType]} ·{" "}
                        {formatLeagueDate(s.createdAt, "MMM d, yyyy")}
                      </p>
                    </div>
                    <StatusBadge status={s.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>XP & reputation ledger</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                XP
              </p>
              {user.xpAdjustmentsReceived.length === 0 ? (
                <p className="text-sm text-[var(--muted-foreground)]">No XP entries</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {user.xpAdjustmentsReceived.map((x) => (
                    <li key={x.id} className="flex justify-between gap-2">
                      <span>
                        {x.reason}
                        <span className="block text-xs text-[var(--muted-foreground)]">
                          {x.season ? `S${x.season.number}` : "Career"} ·{" "}
                          {formatLeagueDate(x.createdAt, "MMM d")}
                        </span>
                      </span>
                      <span className="font-medium">
                        {x.amount > 0 ? `+${x.amount}` : x.amount}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                Reputation
              </p>
              {user.reputationReceived.length === 0 ? (
                <p className="text-sm text-[var(--muted-foreground)]">No reputation entries</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {user.reputationReceived.map((r) => (
                    <li key={r.id} className="flex justify-between gap-2">
                      <span>
                        {r.reason}
                        <span className="block text-xs text-[var(--muted-foreground)]">
                          {formatLeagueDate(r.createdAt, "MMM d, yyyy")}
                        </span>
                      </span>
                      <span className="font-medium">
                        {r.amount > 0 ? `+${r.amount}` : r.amount}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}
