import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ReputationBadge } from "@/components/status-badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/forms/submit-button";
import { prisma } from "@/lib/prisma";
import { getActiveSeason, getLeagueSettings } from "@/lib/league";
import { sumXp } from "@/lib/xp";
import {
  computeReputationScore,
  getReputationLabel,
} from "@/lib/reputation";
import {
  ensureUserByEmail,
  syncUsersFromSupabaseAuth,
} from "@/actions/users";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    role?: string;
    active?: string;
    removed?: string;
    synced?: string;
    scanned?: string;
    restored?: string;
    error?: string;
  }>;
}) {
  const params = await searchParams;
  const { season } = await getActiveSeason();
  const settings = await getLeagueSettings();

  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    orderBy: [{ role: "asc" }, { name: "asc" }],
    include: {
      memberships: {
        where: { seasonId: season.id, isActive: true },
        include: { franchise: true },
      },
      xpAdjustmentsReceived: { select: { amount: true } },
      reputationReceived: { select: { amount: true } },
    },
  });

  let filtered = users;
  if (params.q) {
    const q = params.q.toLowerCase();
    filtered = filtered.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        (u.name ?? "").toLowerCase().includes(q) ||
        u.memberships[0]?.franchise.abbreviation.toLowerCase().includes(q)
    );
  }
  if (params.role === "COMMISSIONER" || params.role === "USER") {
    filtered = filtered.filter((u) => u.role === params.role);
  }
  if (params.active === "true") filtered = filtered.filter((u) => u.isActive);
  if (params.active === "false") filtered = filtered.filter((u) => !u.isActive);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold uppercase tracking-wide">Users</h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          Every Google sign-in creates or updates a manageable league profile here.
        </p>
      </div>

      {params.removed === "1" ? (
        <p className="rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
          User removed.
        </p>
      ) : null}

      {params.synced === "1" ? (
        <p className="rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
          Synced from Supabase Auth. Scanned {params.scanned ?? "0"} auth users;
          created/restored {params.restored ?? "0"} app profiles.
        </p>
      ) : null}

      {params.error ? (
        <p className="rounded-md bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-300">
          {params.error}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Keep users in sync</CardTitle>
          <CardDescription>
            Google Auth users live in Supabase Auth. Manage users reads the app
            User table. Sync restores any Auth accounts missing here (for example
            after a seed wipe). Roles already saved on app users are preserved.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            action={async () => {
              "use server";
              await syncUsersFromSupabaseAuth();
            }}
          >
            <SubmitButton>Sync users from Supabase Auth</SubmitButton>
          </form>

          <form
            action={async (formData) => {
              "use server";
              await ensureUserByEmail(formData);
            }}
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="email">Add / restore by email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="coach@gmail.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Display name</Label>
              <Input id="name" name="name" placeholder="Optional" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select id="role" name="role" defaultValue="USER">
                <option value="USER">Coach</option>
                <option value="COMMISSIONER">Commissioner</option>
              </Select>
            </div>
            <div className="sm:col-span-2 lg:col-span-4">
              <SubmitButton variant="outline">Save user profile</SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Filter</CardTitle>
          <CardDescription>
            {filtered.length} of {users.length} users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-wrap gap-2">
            <input
              name="q"
              defaultValue={params.q}
              placeholder="Search name, email, team"
              className="h-10 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 text-sm"
            />
            <select
              name="role"
              defaultValue={params.role ?? ""}
              className="h-10 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 text-sm"
            >
              <option value="">All roles</option>
              <option value="COMMISSIONER">Commissioner</option>
              <option value="USER">Coach</option>
            </select>
            <select
              name="active"
              defaultValue={params.active ?? ""}
              className="h-10 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 text-sm"
            >
              <option value="">Active + inactive</option>
              <option value="true">Active only</option>
              <option value="false">Inactive only</option>
            </select>
            <button
              type="submit"
              className="h-10 rounded-md bg-[var(--primary)] px-4 text-sm font-medium text-[var(--primary-foreground)]"
            >
              Apply
            </button>
          </form>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          title="No users yet"
          description="When coaches sign in with Google, they appear here automatically."
        />
      ) : (
        <Card>
          <CardContent className="pt-5">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Coach</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>XP</TableHead>
                  <TableHead>Rep</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((user) => {
                  const xp = sumXp(user.xpAdjustmentsReceived);
                  const score = computeReputationScore(
                    settings.startingRepScore,
                    user.reputationReceived
                  );
                  const team = user.memberships[0]?.franchise;
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="font-medium">{user.name ?? "Unnamed"}</div>
                        <div className="text-xs text-[var(--muted-foreground)]">
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.role}</Badge>
                      </TableCell>
                      <TableCell>{team ? team.abbreviation : "—"}</TableCell>
                      <TableCell>{xp}</TableCell>
                      <TableCell>
                        <ReputationBadge
                          label={getReputationLabel(score)}
                          score={score}
                        />
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.deletedAt
                              ? "outline"
                              : user.isActive
                                ? "stable"
                                : "pressured"
                          }
                        >
                          {user.deletedAt
                            ? "Removed"
                            : user.isActive
                              ? "Active"
                              : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {!user.deletedAt ? (
                          <Link
                            href={`/admin/users/${user.id}`}
                            className="text-sm font-medium text-[var(--primary)] hover:underline"
                          >
                            Manage
                          </Link>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
