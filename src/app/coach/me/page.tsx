import Link from "next/link";
import { redirect } from "next/navigation";
import { updateMyCoachProfile } from "@/actions/coach";
import { CoachAvatar } from "@/components/coach/coach-avatar";
import { CoachIdentityPicker } from "@/components/coach/coach-identity-picker";
import { TeamIdentityPicker } from "@/components/coach/team-identity-picker";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { isCommissioner, requireUser } from "@/lib/auth";
import { ensureDefaultCoachIdentities } from "@/lib/coach/ensure-coach-identities";
import { ensureDefaultTeamIdentities } from "@/lib/coach/ensure-team-identities";
import { getActiveSeason, getUserMembership } from "@/lib/league";
import { prisma } from "@/lib/prisma";

export default async function MyCoachProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string; error?: string }>;
}) {
  const user = await requireUser();
  const commissionerUi = await isCommissioner(user);
  const params = await searchParams;
  const { season, settings } = await getActiveSeason();

  await Promise.all([ensureDefaultTeamIdentities(), ensureDefaultCoachIdentities()]);

  const [fresh, membership, teamIdentities, coachIdentities] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      include: { coachProfile: { include: { coachIdentity: true } } },
    }),
    getUserMembership(user.id, season.id),
    prisma.identityCatalog.findMany({
      where: { type: "TEAM" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
    prisma.identityCatalog.findMany({
      where: { type: "COACH" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
  ]);

  if (!fresh) redirect("/sign-in");

  const profile = fresh.coachProfile;
  const franchise = membership?.franchise ?? null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
            Coach hub
          </p>
          <h1 className="text-3xl font-semibold uppercase tracking-[0.04em]">
            My profile
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Set your coach details, Team Identity, and Coaching Identity — independent of
            your Google account name. Identities lock for three seasons after you save.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/coach/profiles/${user.id}`}>View public profile</Link>
        </Button>
      </div>

      {params.updated === "1" ? (
        <p className="success-banner rounded-md px-3 py-2 text-sm">
          Profile saved.
        </p>
      ) : null}
      {params.error ? (
        <p className="rounded-md bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-300">
          {params.error}
        </p>
      ) : null}

      {franchise ? (
        <TeamIdentityPicker
          options={teamIdentities}
          currentIdentity={franchise.teamIdentity}
          chosenSeason={franchise.teamIdentityChosenSeason}
          currentSeason={settings.currentSeason}
          franchiseName={franchise.name}
          franchiseId={franchise.id}
          allowAdminOverride={commissionerUi}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Team Identity</CardTitle>
            <CardDescription>
              Once a commissioner assigns your franchise, you can choose your Team
              Identity here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm">
              <Link href="/request-team">Request your team</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <CoachIdentityPicker
        options={coachIdentities}
        currentIdentity={profile?.coachIdentity}
        chosenSeason={profile?.coachIdentityChosenSeason}
        currentSeason={settings.currentSeason}
        targetUserId={user.id}
        allowAdminOverride={commissionerUi}
      />

      <Card>
        <CardHeader>
          <CardTitle>Coach profile</CardTitle>
          <CardDescription>
            {membership
              ? `Currently assigned: ${membership.franchise.name}`
              : "No franchise assigned yet"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex items-center gap-4">
            <CoachAvatar user={fresh} size="lg" />
            <div className="text-sm">
              <p className="font-[family-name:var(--font-display)] text-lg font-semibold uppercase tracking-wide">
                {fresh.name ?? "Unnamed coach"}
              </p>
              <p className="text-[var(--muted-foreground)]">{fresh.email}</p>
              {profile?.motto ? (
                <p className="mt-1 italic text-[var(--muted-foreground)]">
                  “{profile.motto}”
                </p>
              ) : null}
            </div>
          </div>

          <form
            action={async (formData) => {
              "use server";
              const result = await updateMyCoachProfile(formData);
              if (result?.error) {
                redirect(`/coach/me?error=${encodeURIComponent(result.error)}`);
              }
              redirect("/coach/me?updated=1");
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="coachName">Coach name</Label>
              <Input
                id="coachName"
                name="coachName"
                required
                defaultValue={fresh.name ?? ""}
                placeholder="e.g. Lefty, Curry, Big Al"
              />
              <p className="text-xs text-[var(--muted-foreground)]">
                This is how you appear on standings, storylines, and the coach board.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatarUrl">Profile picture URL (optional)</Label>
              <Input
                id="avatarUrl"
                name="avatarUrl"
                type="url"
                defaultValue={profile?.avatarUrl ?? ""}
                placeholder="https://…"
              />
              <p className="text-xs text-[var(--muted-foreground)]">
                Paste a direct image link. Leave blank to use your Google photo (if any).
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="discordName">Discord</Label>
                <Input
                  id="discordName"
                  name="discordName"
                  defaultValue={profile?.discordName ?? ""}
                  placeholder="username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hometown">Hometown / city</Label>
                <Input
                  id="hometown"
                  name="hometown"
                  defaultValue={profile?.hometown ?? ""}
                  placeholder="Where you’re from"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="favoriteScheme">Favorite scheme / style</Label>
              <Input
                id="favoriteScheme"
                name="favoriteScheme"
                defaultValue={profile?.favoriteScheme ?? ""}
                placeholder="e.g. Cover 3, Air raid, Smashmouth"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="motto">Motto / tagline</Label>
              <Input
                id="motto"
                name="motto"
                defaultValue={profile?.motto ?? ""}
                placeholder="Short line under your name"
                maxLength={120}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">About your coach</Label>
              <Textarea
                id="bio"
                name="bio"
                defaultValue={profile?.bio ?? ""}
                placeholder="Background, goals for the season, trash talk — keep it league-friendly."
                maxLength={500}
              />
            </div>

            <SubmitButton>Save profile</SubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
