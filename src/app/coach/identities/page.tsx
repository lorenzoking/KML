import Link from "next/link";
import { assignCoachIdentity, assignTeamIdentity } from "@/actions/coach";
import { CoachIdentityRulesSection } from "@/components/coach/coach-identity-rules";
import { TeamIdentityRulesSection } from "@/components/coach/team-identity-rules";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { isCommissioner, requireUser } from "@/lib/auth";
import { ensureDefaultCoachIdentities } from "@/lib/coach/ensure-coach-identities";
import { ensureDefaultTeamIdentities } from "@/lib/coach/ensure-team-identities";
import { getActiveSeason } from "@/lib/league";
import { prisma } from "@/lib/prisma";

export default async function CoachIdentitiesPage() {
  const user = await requireUser();
  const commissioner = await isCommissioner(user);
  const { season } = await getActiveSeason();

  await Promise.all([
    ensureDefaultTeamIdentities(),
    ensureDefaultCoachIdentities(),
  ]);

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
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
            Franchise philosophy
          </p>
          <h1 className="text-3xl font-semibold uppercase tracking-[0.04em]">
            Identities
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--muted-foreground)]">
            Every coach chooses their own Team Identity and Coaching Identity. Selections
            lock for three seasons; commissioners can override only when a forced change
            is needed.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/coach/me">Choose my identities</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/rules?tab=team-identity">Team Identity rules</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/rules?tab=coaching-identity">Coaching Identity rules</Link>
          </Button>
        </div>
      </div>

      <section id="team-identity" className="scroll-mt-24 space-y-4">
        <h2 className="text-2xl font-semibold uppercase tracking-wide">
          Team Identity
        </h2>
        <TeamIdentityRulesSection />
      </section>

      <section id="coaching-identity" className="scroll-mt-24 space-y-4">
        <h2 className="text-2xl font-semibold uppercase tracking-wide">
          Coaching Identity
        </h2>
        <CoachIdentityRulesSection />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Current assignments</CardTitle>
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

      {commissioner ? (
        <Card>
          <CardHeader>
            <CardTitle>Assign identities</CardTitle>
            <p className="text-sm text-[var(--muted-foreground)]">
              Coaches select their own identities on My Profile. Use this only to override
              or force a change after a selection is locked.
            </p>
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
                          {identity.name}
                        </option>
                      ))}
                    </Select>
                    <input type="hidden" name="applyXpCost" value="false" />
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
