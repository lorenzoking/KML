import Link from "next/link";
import { assignCoachIdentity, assignTeamIdentity } from "@/actions/coach";
import { TeamIdentityRulesSection } from "@/components/coach/team-identity-rules";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { isCommissioner, requireUser } from "@/lib/auth";
import { ensureDefaultTeamIdentities } from "@/lib/coach/ensure-team-identities";
import { getActiveSeason } from "@/lib/league";
import { prisma } from "@/lib/prisma";

export default async function CoachIdentitiesPage() {
  const user = await requireUser();
  const commissioner = await isCommissioner(user);
  const { season } = await getActiveSeason();

  await ensureDefaultTeamIdentities();

  const [teamIdentities, coachIdentities, memberships] = await Promise.all([
    prisma.identityCatalog.findMany({
      where: { type: "TEAM" },
      orderBy: { name: "asc" },
    }),
    prisma.identityCatalog.findMany({
      where: { type: "COACH" },
      orderBy: { name: "asc" },
    }),
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
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
            Franchise philosophy
          </p>
          <h1 className="text-3xl font-semibold uppercase tracking-[0.04em]">
            Identities
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--muted-foreground)]">
            Team Identity is a commitment. Pick the path that matches how your franchise
            actually builds — then live with the trade-offs.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/rules#team-identity">Also in league rules</Link>
        </Button>
      </div>

      <TeamIdentityRulesSection />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Coach identity catalog</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {coachIdentities.length === 0 ? (
              <p className="text-[var(--muted-foreground)]">No coach identities yet.</p>
            ) : (
              coachIdentities.map((identity) => (
                <div key={identity.id} className="rounded-md border p-3">
                  <p className="font-medium">{identity.name}</p>
                  <p>{identity.coreBenefit}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Min rep {identity.minRepScore} · XP Cost {identity.xpCost}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current team identities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {memberships.map((row) => (
              <div key={row.id} className="rounded-md border p-3">
                <p className="font-medium">
                  {row.franchise.abbreviation} ·{" "}
                  {row.user.name?.trim() || "Unnamed coach"}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Team: {row.franchise.teamIdentity?.name ?? "Unassigned"} · Coach:{" "}
                  {row.user.coachProfile?.coachIdentity?.name ?? "Unassigned"}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {commissioner ? (
        <Card>
          <CardHeader>
            <CardTitle>Assign identities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {memberships.map((row) => (
              <div key={row.id} className="rounded-md border p-3">
                <p className="text-sm font-medium">
                  {row.franchise.abbreviation} ·{" "}
                  {row.user.name?.trim() || "Unnamed coach"}
                </p>
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
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
