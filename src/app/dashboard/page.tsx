import Link from "next/link";
import type { ReactNode } from "react";
import type { StoryCategory } from "@prisma/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ReputationBadge, StatusBadge } from "@/components/status-badge";
import { isCommissioner, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getActiveSeason,
  getFranchiseSeasonRecord,
  getReputation,
  getUserMembership,
  getXpTotal,
} from "@/lib/league";
import { getUserCareerStats } from "@/lib/career";
import { formatRecord } from "@/lib/utils";
import { GAME_TYPE_LABELS } from "@/lib/constants";
import { computeReputationScore } from "@/lib/reputation";
import { getReputationGrade } from "@/lib/coach/grades";
import { getJobSecurityStatus } from "@/lib/coach/job-security";
import { BrandLogo } from "@/components/brand/brand-logo";
import {
  ensureDefaultLeagueStories,
  getPublishedStories,
  STORY_CATEGORY_LABELS,
} from "@/lib/stories";
import { StoryBody } from "@/components/stories/story-body";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ teamRequested?: string }>;
}) {
  const user = await requireUser();
  const commissionerUi = await isCommissioner(user);
  const { settings, season } = await getActiveSeason();
  const params = await searchParams;

  await ensureDefaultLeagueStories(season.id);

  const [
    membership,
    xpTotal,
    reputation,
    career,
    coachProfile,
    pendingMine,
    stories,
    weekGames,
    teamRequestUser,
  ] = await Promise.all([
    getUserMembership(user.id, season.id),
    getXpTotal(user.id),
    getReputation(user.id),
    getUserCareerStats(user.id),
    prisma.coachProfile.findUnique({
      where: { userId: user.id },
      include: { coachIdentity: true },
    }),
    prisma.gameSubmission.findMany({
      where: { submitterId: user.id, status: "PENDING" },
      include: { opponentTeam: true, userTeam: true },
      orderBy: { createdAt: "desc" },
    }),
    getPublishedStories({ take: 10 }),
    prisma.gameSubmission.findMany({
      where: {
        seasonId: season.id,
        week: settings.currentWeek,
        status: { in: ["APPROVED", "PENDING"] },
      },
      include: { userTeam: true, opponentTeam: true },
      orderBy: [{ status: "asc" }, { createdAt: "asc" }],
      take: 8,
    }),
    prisma.user.findUnique({
      where: { id: user.id },
      include: { requestedFranchise: true },
    }),
  ]);

  const teamStanding = membership
    ? await getFranchiseSeasonRecord(season.id, membership.franchiseId)
    : undefined;
  const gmRepScore = computeReputationScore(
    settings.startingGmRepScore,
    reputation.adjustments.map((row) => ({ amount: row.gmAmount }))
  );
  const jobStatus = getJobSecurityStatus({
    coachRepScore: reputation.score,
    gmRepScore,
    expectationScore: coachProfile?.expectationScore ?? 0,
    tankingStrikes: coachProfile?.tankingStrikes ?? 0,
    gmStrikes: coachProfile?.gmStrikes ?? 0,
    hotSeatThreshold: settings.hotSeatThreshold,
    firingThreshold: settings.firingThreshold,
    watchThreshold: settings.watchThreshold,
    override: coachProfile?.hotSeatStatusOverride,
  });

  const [recentApproved, pendingCount] = await Promise.all([
    membership
      ? prisma.gameSubmission.findMany({
          where: { submitterId: user.id, status: "APPROVED" },
          include: { opponentTeam: true, userTeam: true },
          orderBy: { reviewedAt: "desc" },
          take: 5,
        })
      : Promise.resolve([]),
    commissionerUi
      ? prisma.gameSubmission.count({ where: { status: "PENDING" } })
      : Promise.resolve(0),
  ]);

  const DASHBOARD_LINK_ONLY_SLUGS = new Set(["season-1-team-draft-grades"]);

  const deskStories = stories.filter(
    (s) => !DASHBOARD_LINK_ONLY_SLUGS.has(s.slug)
  );
  const featured =
    deskStories.find((s) => s.isFeatured) ??
    deskStories.find((s) => s.category === "DRAFT") ??
    deskStories[0];
  const secondaryStories = deskStories.filter((s) => s.id !== featured?.id);

  const byCategory = (category: StoryCategory) =>
    secondaryStories.filter((s) => s.category === category);

  const gamesOfWeekStories = byCategory("GAME_OF_WEEK");
  const potwStories = byCategory("PLAYER_OF_WEEK");
  const coachingStories = byCategory("COACHING");
  const draftStories = byCategory("DRAFT");
  const otherStories = secondaryStories.filter(
    (s) =>
      !["GAME_OF_WEEK", "PLAYER_OF_WEEK", "COACHING", "DRAFT"].includes(s.category)
  );

  const firstName = (user.name ?? "Coach").split(" ")[0];

  return (
    <div className="space-y-8">
      {params.teamRequested === "1" ? (
        <p className="success-banner rounded-md px-3 py-2 text-sm">
          Team request sent. A commissioner will assign you soon.
        </p>
      ) : null}

      {!membership ? (
        <Card className="border-[color-mix(in_srgb,var(--primary)_35%,var(--border))]">
          <CardHeader>
            <CardTitle>
              {teamRequestUser?.requestedFranchise
                ? `Requested: ${teamRequestUser.requestedFranchise.name}`
                : "Tell us which team you drafted"}
            </CardTitle>
            <CardDescription>
              {teamRequestUser?.requestedFranchise
                ? "Your request is visible to commissioners. You can still update it until you are assigned."
                : "Google only shows your Gmail name. Request your franchise so we know who to assign."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/request-team">
                {teamRequestUser?.requestedFranchise
                  ? "Update team request"
                  : "Request your team"}
              </Link>
            </Button>
            {teamRequestUser?.teamRequestNote ? (
              <p className="w-full text-sm text-[var(--muted-foreground)]">
                Note: {teamRequestUser.teamRequestNote}
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <section className="field-stripe relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] px-5 py-8 shadow-[0_20px_60px_rgba(0,0,0,0.14)] animate-rise sm:px-8 sm:py-10">
        <div className="absolute -right-10 -top-8 opacity-20">
          <BrandLogo size="lg" className="h-40 w-40 sm:h-52 sm:w-52" />
        </div>
        <div className="absolute -right-16 -top-20 size-64 rounded-full bg-[var(--primary)]/15 blur-3xl" />
        <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-[color-mix(in_srgb,var(--primary)_18%,transparent)] to-transparent" />
        <div className="relative grid gap-6 lg:grid-cols-[1.4fr_0.8fr] lg:items-end">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <BrandLogo size="sm" className="drop-shadow-[0_0_16px_rgba(212,175,55,0.4)]" />
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
                Welcome to the league desk
              </p>
            </div>
            <h1 className="max-w-2xl text-3xl font-semibold uppercase leading-[1.05] tracking-[0.04em] sm:text-5xl">
              {firstName}, the season has a story — and you&apos;re in it
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-[var(--muted-foreground)] sm:text-base">
              This is your home for the Kings Madden League narrative: draft chapters,
              games of the week, coaching pressure, and the weekly honors that make the
              league feel alive.
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium">
              <span>
                Season {settings.currentSeason} · Week {settings.currentWeek}
              </span>
              <span className="text-[var(--muted-foreground)]">
                {membership?.franchise.name ?? "Awaiting franchise assignment"}
              </span>
              <span className="text-[var(--muted-foreground)]">
                {formatRecord(career.wins, career.losses)} career
              </span>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {membership ? (
                <Button asChild>
                  <Link href="/games?tab=week#submit-result">Submit result</Link>
                </Button>
              ) : (
                <Button asChild>
                  <Link href="/request-team">Request team</Link>
                </Button>
              )}
              <Button asChild variant="outline">
                <Link href="/games?tab=standings">Standings</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/storylines">Storylines</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/coach">Coach Hub</Link>
              </Button>
              {commissionerUi ? (
                <Button asChild variant="outline">
                  <Link href="/admin/approvals">
                    Approvals{pendingCount ? ` (${pendingCount})` : ""}
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>

          <div className="stagger grid grid-cols-2 gap-2 sm:gap-3">
            <MiniStat
              label="Your team"
              value={membership?.franchise.abbreviation ?? "—"}
              hint={teamStanding ? formatRecord(teamStanding.wins, teamStanding.losses) : "0-0"}
            />
            <MiniStat
              label="Job security"
              value={jobStatus.replaceAll("_", " ")}
              hint={`${coachProfile?.contractYearsLeft ?? 3} yrs left`}
            />
            <MiniStat
              label="Coach grade"
              value={getReputationGrade(reputation.score)}
              hint={`Rep ${reputation.score}`}
            />
            <MiniStat
              label="Season XP"
              value={String(
                career.bySeason.find((s) => s.seasonId === season.id)?.xp ?? 0
              )}
              hint={`Career ${xpTotal}`}
            />
          </div>
        </div>
      </section>

      {featured ? (
        <section className="animate-rise">
          <Card className="overflow-hidden border-[color-mix(in_srgb,var(--primary)_35%,var(--border))]">
            <CardHeader className="space-y-3 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--primary)_8%,transparent)]">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="elite">Front page</Badge>
                <Badge variant="outline">
                  {STORY_CATEGORY_LABELS[featured.category]}
                </Badge>
              </div>
              <div>
                {featured.eyebrow ? (
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">
                    {featured.eyebrow}
                  </p>
                ) : null}
                <CardTitle className="mt-1 text-2xl sm:text-3xl">{featured.title}</CardTitle>
                <CardDescription className="mt-2 max-w-3xl text-sm sm:text-base">
                  {featured.summary}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm">
                  <Link href={`/storylines/${featured.slug}`}>Open full story</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/storylines">All storylines</Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/storylines/season-1-team-draft-grades">
                    Team draft grades
                  </Link>
                </Button>
                {commissionerUi ? (
                  <Button asChild variant="outline" size="sm">
                    <Link href="/admin/stories">Edit stories</Link>
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-3">
        <StoryColumn
          title="Games of the week"
          description="The matchups and moments driving the week."
          stories={gamesOfWeekStories}
          fallback={
            weekGames.length > 0 ? (
              <ul className="space-y-2">
                {weekGames.map((g) => (
                  <li
                    key={g.id}
                    className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
                  >
                    <span className="font-medium">
                      {g.userTeam.abbreviation} {g.userScore}–{g.opponentScore}{" "}
                      {g.opponentTeam.abbreviation}
                    </span>
                    <span className="mt-1 block text-xs text-[var(--muted-foreground)]">
                      Week {g.week} · {g.status}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title="No week-one results yet"
                description="Once games are submitted, this desk fills with the week’s drama."
              />
            )
          }
        />
        <StoryColumn
          title="Players of the week"
          description="Names that deserve the spotlight."
          stories={potwStories}
          fallback={
            <EmptyState
              title="Honors desk is open"
              description="Commissioners will post weekly standouts as the season rolls."
            />
          }
        />
        <StoryColumn
          title="Coaching storylines"
          description="Pressure, contracts, and carousel heat."
          stories={coachingStories}
          fallback={
            <EmptyState
              title="Pressure is coming"
              description="Hot seats and carousel moves will show up here as the season develops."
            />
          }
        />
      </section>

      {draftStories.length > 0 || otherStories.length > 0 ? (
        <section className="stagger grid gap-4 md:grid-cols-2">
          {[...draftStories, ...otherStories].map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Your coaching chapter</CardTitle>
            <CardDescription>
              Identity, reputation, and job security at a glance.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <ProfilePill
                label="Coach identity"
                value={coachProfile?.coachIdentity?.name ?? "Unassigned"}
              />
              <ProfilePill
                label="Team identity"
                value={membership?.franchise.teamIdentity?.name ?? "Unassigned"}
              />
              <ProfilePill
                label="Job security"
                value={jobStatus.replaceAll("_", " ")}
                badgeVariant={jobSecurityBadgeVariant(jobStatus)}
              />
              <ProfilePill
                label="Reputation"
                value={`${reputation.score} (${getReputationGrade(reputation.score)})`}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <ReputationBadge label={reputation.label} />
              <Button asChild variant="outline" size="sm">
                <Link href={`/coach/profiles/${user.id}`}>Full profile</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/coach/carousel">Carousel</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Your pending results</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingMine.length === 0 ? (
                <EmptyState
                  title="No pending results"
                  description="Submit from Games when your match finishes."
                />
              ) : (
                <ul className="space-y-2">
                  {pendingMine.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
                    >
                      <span>
                        W{s.week}: {s.userTeam.abbreviation} {s.userScore}–
                        {s.opponentScore} {s.opponentTeam.abbreviation}
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
              <CardTitle>Recent approved games</CardTitle>
            </CardHeader>
            <CardContent>
              {recentApproved.length === 0 ? (
                <EmptyState title="No approved games yet" />
              ) : (
                <ul className="space-y-2">
                  {recentApproved.map((s) => (
                    <li
                      key={s.id}
                      className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">
                          {s.userTeam.abbreviation} {s.userScore}–{s.opponentScore}{" "}
                          {s.opponentTeam.abbreviation}
                        </span>
                        <StatusBadge status={s.status} />
                      </div>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        Week {s.week} · {GAME_TYPE_LABELS[s.gameType]}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

function MiniStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)]/80 px-3 py-3 backdrop-blur-sm">
      <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
        {label}
      </p>
      <p className="mt-1 font-[family-name:var(--font-display)] text-lg font-semibold uppercase tracking-wide">
        {value}
      </p>
      <p className="text-xs text-[var(--muted-foreground)]">{hint}</p>
    </div>
  );
}

function StoryColumn({
  title,
  description,
  stories,
  fallback,
}: {
  title: string;
  description: string;
  stories: Awaited<ReturnType<typeof getPublishedStories>>;
  fallback: ReactNode;
}) {
  return (
    <Card className="surface-hover">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {stories.length === 0
          ? fallback
          : stories.map((story) => <StoryCard key={story.id} story={story} compact />)}
      </CardContent>
    </Card>
  );
}

function StoryCard({
  story,
  compact = false,
}: {
  story: Awaited<ReturnType<typeof getPublishedStories>>[number];
  compact?: boolean;
}) {
  return (
    <article
      className={
        compact
          ? "rounded-xl border border-[var(--border)] p-3"
          : "rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-4"
      }
    >
      <div className="mb-2 flex flex-wrap gap-2">
        <Badge variant="outline">{STORY_CATEGORY_LABELS[story.category]}</Badge>
        {story.week ? <Badge variant="default">Week {story.week}</Badge> : null}
      </div>
      {story.eyebrow ? (
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--primary)]">
          {story.eyebrow}
        </p>
      ) : null}
      <h3 className="mt-1 font-[family-name:var(--font-display)] text-base font-semibold uppercase tracking-wide">
        {story.title}
      </h3>
      <p className="mt-2 text-sm text-[var(--muted-foreground)]">{story.summary}</p>
      <Link
        href={`/storylines/${story.slug}`}
        className="mt-3 inline-block text-sm font-medium text-[var(--primary)] hover:underline"
      >
        Read story
      </Link>
    </article>
  );
}

function ProfilePill({
  label,
  value,
  badgeVariant,
}: {
  label: string;
  value: string;
  badgeVariant?: "elite" | "stable" | "pressured" | "hotseat" | "outline";
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] px-3 py-2">
      <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
      {badgeVariant ? (
        <div className="mt-1">
          <Badge variant={badgeVariant}>{value}</Badge>
        </div>
      ) : (
        <p className="text-sm font-medium">{value}</p>
      )}
    </div>
  );
}

function jobSecurityBadgeVariant(status: string) {
  switch (status) {
    case "SECURE":
      return "elite" as const;
    case "STABLE":
      return "stable" as const;
    case "WATCH":
    case "PRESSURED":
      return "pressured" as const;
    case "HOT_SEAT":
    case "FIRING_ELIGIBLE":
      return "hotseat" as const;
    default:
      return "outline" as const;
  }
}
