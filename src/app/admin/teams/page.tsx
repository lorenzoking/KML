import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/forms/submit-button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addWaitlistEntry,
  assignUserToTeam,
  setWaitlistEntryActive,
} from "@/actions/teams";
import { prisma } from "@/lib/prisma";
import { getActiveSeason } from "@/lib/league";

export default async function TeamsAdminPage() {
  const { season } = await getActiveSeason();

  const [franchises, users, memberships, waitlist] = await Promise.all([
    prisma.franchise.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.user.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: [{ role: "asc" }, { name: "asc" }],
    }),
    prisma.leagueMembership.findMany({
      where: {
        seasonId: season.id,
        isActive: true,
        user: { deletedAt: null },
      },
      include: { user: true, franchise: true },
    }),
    prisma.waitlistEntry.findMany({
      include: { user: true },
      orderBy: [{ isActive: "desc" }, { position: "asc" }],
    }),
  ]);

  const byFranchise = Object.fromEntries(
    memberships.map((m) => [m.franchiseId, m])
  );
  const byUser = Object.fromEntries(memberships.map((m) => [m.userId, m]));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold uppercase tracking-wide">
          Team assignments
        </h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          One active coach per franchise for Season {season.number}.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assign / reassign coach</CardTitle>
          <CardDescription>
            Reassigning ends the current coaching stint but keeps prior team stats on
            the coach&apos;s career history.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={async (formData) => {
              "use server";
              await assignUserToTeam(formData);
            }}
            className="grid gap-3 sm:grid-cols-3"
          >
            <input type="hidden" name="returnTo" value="/admin/teams?updated=1" />
            <Select name="userId" required defaultValue="">
              <option value="" disabled>
                Select user
              </option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name ?? u.email}
                  {byUser[u.id]
                    ? ` (current: ${byUser[u.id].franchise.abbreviation})`
                    : ""}
                </option>
              ))}
            </Select>
            <Select name="franchiseId" required defaultValue="">
              <option value="" disabled>
                Select franchise
              </option>
              <option value="unassign">Unassign</option>
              {franchises.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                  {byFranchise[f.id]
                    ? ` — ${byFranchise[f.id].user.name ?? byFranchise[f.id].user.email}`
                    : " — open"}
                </option>
              ))}
            </Select>
            <SubmitButton>Save assignment</SubmitButton>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Waitlist</CardTitle>
          <CardDescription>
            Used to auto-fill fired teams before creating a carousel vacancy.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            action={async (formData) => {
              "use server";
              await addWaitlistEntry(formData);
            }}
            className="grid gap-3 md:grid-cols-4"
          >
            <Select name="userId" required defaultValue="">
              <option value="" disabled>
                Select user
              </option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name ?? u.email}
                </option>
              ))}
            </Select>
            <div className="space-y-1">
              <Label htmlFor="position">Position</Label>
              <Input id="position" name="position" type="number" min={1} required />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input id="notes" name="notes" />
            </div>
            <div className="md:col-span-4">
              <SubmitButton>Add waitlist entry</SubmitButton>
            </div>
          </form>

          <div className="space-y-2">
            {waitlist.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">No waitlist entries.</p>
            ) : (
              waitlist.map((entry) => (
                <div key={entry.id} className="flex flex-wrap items-end justify-between gap-2 rounded-md border p-2 text-sm">
                  <div>
                    <p className="font-medium">
                      #{entry.position} · {entry.user.name ?? entry.user.email}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {entry.notes || "No notes"} · {entry.isActive ? "Active" : "Inactive"}
                    </p>
                  </div>
                  <form
                    action={async (formData) => {
                      "use server";
                      await setWaitlistEntryActive(formData);
                    }}
                    className="flex items-center gap-2"
                  >
                    <input type="hidden" name="entryId" value={entry.id} />
                    <Select name="isActive" defaultValue={entry.isActive ? "false" : "true"}>
                      <option value={entry.isActive ? "false" : "true"}>
                        {entry.isActive ? "Deactivate" : "Activate"}
                      </option>
                    </Select>
                    <SubmitButton size="sm">Apply</SubmitButton>
                  </form>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {franchises.map((f) => {
          const m = byFranchise[f.id];
          return (
            <Card key={f.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">{f.abbreviation}</CardTitle>
                  <Badge variant="outline">
                    {f.conference} {f.division}
                  </Badge>
                </div>
                <CardDescription>{f.name}</CardDescription>
              </CardHeader>
              <CardContent>
                {m ? (
                  <p className="text-sm">
                    <span className="font-medium">{m.user.name}</span>
                    <span className="block text-xs text-[var(--muted-foreground)]">
                      {m.user.email}
                    </span>
                  </p>
                ) : (
                  <p className="text-sm text-[var(--muted-foreground)]">Open</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
