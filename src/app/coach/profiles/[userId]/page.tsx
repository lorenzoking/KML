import Link from "next/link";
import { notFound } from "next/navigation";
import { addCoachLedgerEntry, assignCoachIdentity, saveCoachSeasonReview, updateCoachProfile } from "@/actions/coach";
import { CoachAvatar } from "@/components/coach/coach-avatar";
import { CoachIdentityPicker } from "@/components/coach/coach-identity-picker";
import { TeamIdentityPicker } from "@/components/coach/team-identity-picker";
import { SubmitButton } from "@/components/forms/submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { isCommissioner, requireUser } from "@/lib/auth";
import { getUserCareerStats } from "@/lib/career";
import { getCoachBoardRow } from "@/lib/coach/coach-board";
import { ensureDefaultCoachIdentities } from "@/lib/coach/ensure-coach-identities";
import { ensureDefaultTeamIdentities } from "@/lib/coach/ensure-team-identities";
import { getCoachIdentityRuleBySlug } from "@/lib/coach/coach-identity-rules";
import { getTeamIdentityRuleBySlug } from "@/lib/coach/team-identity-rules";
import { formatJobStatus } from "@/lib/coach/job-security";
import { getActiveSeason } from "@/lib/league";
import { prisma } from "@/lib/prisma";

export default async function CoachProfileDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const currentUser = await requireUser();
  const commissioner = await isCommissioner(currentUser);
  const { userId } = await params;
  const { season, settings } = await getActiveSeason();

  await Promise.all([ensureDefaultTeamIdentities(), ensureDefaultCoachIdentities()]);

  const [user, career, row, identities, teamIdentities, review, reputationRows] =
    await Promise.all([
      prisma.user.findFirst({
        where: { id: userId, deletedAt: null },
        include: {
          coachProfile: { include: { coachIdentity: true } },
          memberships: {
            where: { seasonId: season.id, isActive: true },
            include: { franchise: { include: { teamIdentity: true } } },
            take: 1,
          },
        },
      }),
      getUserCareerStats(userId),
      getCoachBoardRow(userId, season.id),
      prisma.identityCatalog.findMany({
        where: { type: "COACH" },
        orderBy: { name: "asc" },
      }),
      prisma.identityCatalog.findMany({
        where: { type: "TEAM" },
        orderBy: { name: "asc" },
        select: { id: true, name: true, slug: true },
      }),
      prisma.coachSeasonReview.findUnique({
        where: { userId_seasonId: { userId, seasonId: season.id } },
      }),
      prisma.reputationAdjustment.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
    ]);
  if (!user) notFound();

  const activeMembership = user.memberships[0];

  const isSelf = currentUser.id === user.id;
  const profile = user.coachProfile;
  const teamIdentityRule = getTeamIdentityRuleBySlug(
    activeMembership?.franchise.teamIdentity?.slug
  );
  const coachIdentityRule = getCoachIdentityRuleBySlug(profile?.coachIdentity?.slug);
  const coachIdentityOptions = identities.map((identity) => ({
    id: identity.id,
    name: identity.name,
    slug: identity.slug,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-4">
          <CoachAvatar user={user} size="lg" />
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold uppercase tracking-wide">
              {user.name?.trim() || "Unnamed coach"}
            </h1>
            {profile?.motto ? (
              <p className="mt-1 text-sm italic text-[var(--muted-foreground)]">
                “{profile.motto}”
              </p>
            ) : null}
            {profile?.hometown ? (
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                From {profile.hometown}
              </p>
            ) : null}
          </div>
        </div>
        {isSelf ? (
          <Button asChild variant="outline" size="sm">
            <Link href="/coach/me">Edit my profile</Link>
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric title="Team" value={activeMembership?.franchise.abbreviation ?? "Unassigned"} />
        <Metric
          title="Team Identity"
          value={activeMembership?.franchise.teamIdentity?.name ?? "Unassigned"}
        />
        <Metric
          title="Coach Identity"
          value={profile?.coachIdentity?.name ?? "Unassigned"}
        />
        <Metric title="Job security" value={row ? formatJobStatus(row.jobStatus) : "N/A"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {teamIdentityRule ? (
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{teamIdentityRule.shortLabel}</Badge>
                <CardTitle>{teamIdentityRule.name}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-[var(--muted-foreground)]">
              <p className="font-medium text-[var(--foreground)]">{teamIdentityRule.tagline}</p>
              <p>{teamIdentityRule.summary}</p>
              <p className="italic">Philosophy: {teamIdentityRule.philosophy}</p>
              <Link
                href="/rules?tab=team-identity"
                className="inline-block text-[var(--primary)] hover:underline"
              >
                Read full Team Identity rules
              </Link>
            </CardContent>
          </Card>
        ) : null}

        {coachIdentityRule ? (
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{coachIdentityRule.shortLabel}</Badge>
                <CardTitle>{coachIdentityRule.name}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-[var(--muted-foreground)]">
              <p>{coachIdentityRule.summary}</p>
              <p className="italic">Philosophy: {coachIdentityRule.philosophy}</p>
              <Link
                href="/rules?tab=coaching-identity"
                className="inline-block text-[var(--primary)] hover:underline"
              >
                Read full Coaching Identity rules
              </Link>
            </CardContent>
          </Card>
        ) : null}
      </div>

      {isSelf || commissioner ? (
        <>
          {activeMembership ? (
            <TeamIdentityPicker
              options={teamIdentities}
              currentIdentity={activeMembership.franchise.teamIdentity}
              chosenSeason={activeMembership.franchise.teamIdentityChosenSeason}
              currentSeason={settings.currentSeason}
              franchiseName={activeMembership.franchise.name}
              franchiseId={activeMembership.franchise.id}
              returnTo={`/coach/profiles/${user.id}`}
              allowAdminOverride={commissioner}
            />
          ) : null}
          <CoachIdentityPicker
            options={coachIdentityOptions}
            currentIdentity={profile?.coachIdentity}
            chosenSeason={profile?.coachIdentityChosenSeason}
            currentSeason={settings.currentSeason}
            targetUserId={user.id}
            returnTo={`/coach/profiles/${user.id}`}
            allowAdminOverride={commissioner}
          />
        </>
      ) : null}

      {(profile?.bio ||
        profile?.discordName ||
        profile?.favoriteScheme ||
        profile?.selectionPick) && (
        <Card>
          <CardHeader>
            <CardTitle>Coach details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {profile?.bio ? (
              <p className="leading-relaxed text-[var(--muted-foreground)]">{profile.bio}</p>
            ) : null}
            <div className="grid gap-2 sm:grid-cols-2">
              {profile?.discordName ? <p>Discord: {profile.discordName}</p> : null}
              {profile?.favoriteScheme ? (
                <p>Favorite scheme: {profile.favoriteScheme}</p>
              ) : null}
              {profile?.selectionPick ? <p>Draft pick: #{profile.selectionPick}</p> : null}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Season snapshot</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <p>Coach rep: {row ? `${row.coachRepScore} (${row.coachRepGrade})` : "N/A"}</p>
          <p>GM rep: {row ? `${row.gmRepScore} (${row.gmRepGrade} · ${row.gmRepStatus})` : "N/A"}</p>
          <p>Career record: {`${career.wins}-${career.losses}-${career.ties}`}</p>
          <p>Career XP: {career.careerXp}</p>
          <p>Contract years left: {row?.contractYearsLeft ?? 3}</p>
          <p>
            Autopilot:{" "}
            {user.coachProfile?.isAutopilot
              ? `Yes${user.coachProfile.autopilotSeason ? ` (S${user.coachProfile.autopilotSeason})` : ""}`
              : "No"}
          </p>
          <p>Recovery note: {row?.jobRecoveryNote ?? "N/A"}</p>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Career stints</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {career.bySeason.map((s) => (
              <div key={s.stintId} className="rounded-md border p-2">
                S{s.seasonNumber} {s.franchiseAbbr ?? "—"} · Wk {s.startedWeek}
                {s.endedWeek ? `-${s.endedWeek}` : "+"} · {s.wins}-{s.losses}-{s.ties}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent ledgers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {reputationRows.map((entry) => (
              <div key={entry.id} className="rounded-md border p-2">
                <p>{entry.reason}</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Coach {entry.amount > 0 ? "+" : ""}
                  {entry.amount}, GM {entry.gmAmount > 0 ? "+" : ""}
                  {entry.gmAmount}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {commissioner ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Commissioner edits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form
                action={async (formData) => {
                  "use server";
                  await updateCoachProfile(formData);
                }}
                className="space-y-2"
              >
                <input type="hidden" name="userId" value={user.id} />
                <Label htmlFor="discordName">Discord name</Label>
                <Input
                  id="discordName"
                  name="discordName"
                  defaultValue={user.coachProfile?.discordName ?? ""}
                />
                <Label htmlFor="selectionPick">Selection pick</Label>
                <Input
                  id="selectionPick"
                  name="selectionPick"
                  type="number"
                  defaultValue={user.coachProfile?.selectionPick ?? undefined}
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="contractYearsLeft">Contract years</Label>
                    <Input
                      id="contractYearsLeft"
                      name="contractYearsLeft"
                      type="number"
                      defaultValue={user.coachProfile?.contractYearsLeft ?? 3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="expectationScore">Expectation score</Label>
                    <Input
                      id="expectationScore"
                      name="expectationScore"
                      type="number"
                      defaultValue={user.coachProfile?.expectationScore ?? 0}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="tankingStrikes">Tanking strikes</Label>
                    <Input
                      id="tankingStrikes"
                      name="tankingStrikes"
                      type="number"
                      defaultValue={user.coachProfile?.tankingStrikes ?? 0}
                    />
                  </div>
                  <div>
                    <Label htmlFor="gmStrikes">GM strikes</Label>
                    <Input
                      id="gmStrikes"
                      name="gmStrikes"
                      type="number"
                      defaultValue={user.coachProfile?.gmStrikes ?? 0}
                    />
                  </div>
                </div>
                <Label htmlFor="hotSeatStatusOverride">Hot seat override</Label>
                <Select
                  id="hotSeatStatusOverride"
                  name="hotSeatStatusOverride"
                  defaultValue={user.coachProfile?.hotSeatStatusOverride ?? ""}
                >
                  <option value="">Auto (no override)</option>
                  {["SECURE", "STABLE", "WATCH", "PRESSURED", "HOT_SEAT", "FIRING_ELIGIBLE"].map(
                    (option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    )
                  )}
                </Select>
                <Label htmlFor="hotSeatNote">Hot seat note</Label>
                <Textarea
                  id="hotSeatNote"
                  name="hotSeatNote"
                  defaultValue={user.coachProfile?.hotSeatNote ?? ""}
                />
                <SubmitButton>Save profile</SubmitButton>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Identity, review, and ledger</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <form
                action={async (formData) => {
                  "use server";
                  await assignCoachIdentity(formData);
                }}
                className="space-y-2"
              >
                <input type="hidden" name="userId" value={user.id} />
                <Label htmlFor="identityId">Coach identity</Label>
                <Select
                  id="identityId"
                  name="identityId"
                  defaultValue={user.coachProfile?.coachIdentityId ?? ""}
                >
                  <option value="">Unassigned</option>
                  {identities.map((identity) => (
                    <option key={identity.id} value={identity.id}>
                      {identity.name} (Cost {identity.xpCost})
                    </option>
                  ))}
                </Select>
                <Label htmlFor="applyXpCost">Apply XP cost?</Label>
                <Select id="applyXpCost" name="applyXpCost" defaultValue="false">
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </Select>
                <SubmitButton>Save identity</SubmitButton>
              </form>

              <form
                action={async (formData) => {
                  "use server";
                  await saveCoachSeasonReview(formData);
                }}
                className="space-y-2"
              >
                <input type="hidden" name="userId" value={user.id} />
                <input type="hidden" name="seasonId" value={season.id} />
                <Label htmlFor="playoffResult">Playoff result</Label>
                <Select id="playoffResult" name="playoffResult" defaultValue={review?.playoffResult ?? "NONE"}>
                  {["NONE", "WILD_CARD", "DIVISIONAL", "CONFERENCE", "SUPER_BOWL", "CHAMPION"].map(
                    (option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    )
                  )}
                </Select>
                <Label htmlFor="expectationResult">Expectation result</Label>
                <Select
                  id="expectationResult"
                  name="expectationResult"
                  defaultValue={review?.expectationResult ?? "PENDING"}
                >
                  {["PENDING", "MISSED", "MET", "EXCEEDED"].map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
                <Label htmlFor="reviewNotes">Review notes</Label>
                <Textarea id="reviewNotes" name="reviewNotes" defaultValue={review?.reviewNotes ?? ""} />
                <SubmitButton>Save season review</SubmitButton>
              </form>

              <form
                action={async (formData) => {
                  "use server";
                  await addCoachLedgerEntry(formData);
                }}
                className="space-y-2"
              >
                <input type="hidden" name="userId" value={user.id} />
                <Label htmlFor="amount">Coach rep delta</Label>
                <Input id="amount" name="amount" type="number" defaultValue={0} />
                <Label htmlFor="gmAmount">GM rep delta</Label>
                <Input id="gmAmount" name="gmAmount" type="number" defaultValue={0} />
                <Label htmlFor="xpAmount">XP delta</Label>
                <Input id="xpAmount" name="xpAmount" type="number" defaultValue={0} />
                <Label htmlFor="category">Category</Label>
                <Select id="category" name="category" defaultValue="GENERAL">
                  {[
                    "GENERAL",
                    "CONDUCT",
                    "EXPECTATION",
                    "GAME_MANAGEMENT",
                    "ROSTER",
                    "TANKING",
                    "TRADE",
                    "DRAFT",
                    "OWNERSHIP_REVIEW",
                    "CAROUSEL",
                    "BONUS",
                    "PENALTY",
                    "SIM_SCORE",
                  ].map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
                <Label htmlFor="reason">Reason</Label>
                <Input id="reason" name="reason" required />
                <Label htmlFor="week">Week (optional)</Label>
                <Input id="week" name="week" type="number" />
                <Label htmlFor="evidenceUrl">Evidence URL (optional)</Label>
                <Input id="evidenceUrl" name="evidenceUrl" />
                <SubmitButton>Add ledger entry</SubmitButton>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-[var(--muted-foreground)]">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
