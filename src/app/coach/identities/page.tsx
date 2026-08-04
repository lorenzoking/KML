import { assignCoachIdentity, assignTeamIdentity } from "@/actions/coach";
import { SubmitButton } from "@/components/forms/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { isCommissioner, requireUser } from "@/lib/auth";
import { getActiveSeason } from "@/lib/league";
import { prisma } from "@/lib/prisma";

export default async function CoachIdentitiesPage() {
  const user = await requireUser();
  const commissioner = isCommissioner(user);
  const { season } = await getActiveSeason();

  const [teamIdentities, coachIdentities, memberships] = await Promise.all([
    prisma.identityCatalog.findMany({ where: { type: "TEAM" }, orderBy: { name: "asc" } }),
    prisma.identityCatalog.findMany({ where: { type: "COACH" }, orderBy: { name: "asc" } }),
    prisma.leagueMembership.findMany({
      where: { seasonId: season.id, isActive: true, user: { deletedAt: null } },
      include: {
        user: { include: { coachProfile: { include: { coachIdentity: true } } } },
        franchise: { include: { teamIdentity: true } },
      },
      orderBy: { franchise: { sortOrder: "asc" } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Team identity catalog</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {teamIdentities.map((identity) => (
              <div key={identity.id} className="rounded-md border p-3">
                <p className="font-medium">{identity.name}</p>
                <p>{identity.coreBenefit}</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Restriction: {identity.restriction}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Coach identity catalog</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {coachIdentities.map((identity) => (
              <div key={identity.id} className="rounded-md border p-3">
                <p className="font-medium">{identity.name}</p>
                <p>{identity.coreBenefit}</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Min rep {identity.minRepScore} · XP Cost {identity.xpCost}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current assignments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {memberships.map((row) => (
            <div key={row.id} className="rounded-md border p-3">
              <p className="text-sm font-medium">
                {row.franchise.abbreviation} · {row.user.name ?? row.user.email}
              </p>
              <p className="text-xs text-[var(--muted-foreground)]">
                Team identity: {row.franchise.teamIdentity?.name ?? "Unassigned"} · Coach
                identity: {row.user.coachProfile?.coachIdentity?.name ?? "Unassigned"}
              </p>

              {commissioner ? (
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <form
                    action={async (formData) => {
                      "use server";
                      await assignTeamIdentity(formData);
                    }}
                    className="space-y-2"
                  >
                    <input type="hidden" name="franchiseId" value={row.franchiseId} />
                    <Label htmlFor={`team-${row.franchiseId}`}>Team identity</Label>
                    <Select
                      id={`team-${row.franchiseId}`}
                      name="identityId"
                      defaultValue={row.franchise.teamIdentityId ?? ""}
                    >
                      <option value="">Unassigned</option>
                      {teamIdentities.map((identity) => (
                        <option key={identity.id} value={identity.id}>
                          {identity.name}
                        </option>
                      ))}
                    </Select>
                    <SubmitButton size="sm">Save team identity</SubmitButton>
                  </form>

                  <form
                    action={async (formData) => {
                      "use server";
                      await assignCoachIdentity(formData);
                    }}
                    className="space-y-2"
                  >
                    <input type="hidden" name="userId" value={row.userId} />
                    <Label htmlFor={`coach-${row.userId}`}>Coach identity</Label>
                    <Select
                      id={`coach-${row.userId}`}
                      name="identityId"
                      defaultValue={row.user.coachProfile?.coachIdentityId ?? ""}
                    >
                      <option value="">Unassigned</option>
                      {coachIdentities.map((identity) => (
                        <option key={identity.id} value={identity.id}>
                          {identity.name} (Cost {identity.xpCost})
                        </option>
                      ))}
                    </Select>
                    <input type="hidden" name="applyXpCost" value="true" />
                    <SubmitButton size="sm">Save coach identity</SubmitButton>
                  </form>
                </div>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
