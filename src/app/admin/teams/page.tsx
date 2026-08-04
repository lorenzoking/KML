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
import { assignUserToTeam } from "@/actions/teams";
import { prisma } from "@/lib/prisma";
import { getActiveSeason } from "@/lib/league";

export default async function TeamsAdminPage() {
  const { season } = await getActiveSeason();

  const [franchises, users, memberships] = await Promise.all([
    prisma.franchise.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.user.findMany({
      orderBy: [{ role: "asc" }, { name: "asc" }],
    }),
    prisma.leagueMembership.findMany({
      where: { seasonId: season.id, isActive: true },
      include: { user: true, franchise: true },
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
            Selecting a team moves the user onto that franchise for the active season.
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
