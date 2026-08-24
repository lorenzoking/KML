import Link from "next/link";
import Image from "next/image";
import { CalendarDays, ClipboardCheck, Flag, ListOrdered, Send, Shirt, Star, Trophy, User, UserRound, Vote } from "lucide-react";
import { CoachAvatar } from "@/components/coach/coach-avatar";
import { JobStatusBadge } from "@/components/coach/job-status-badge";
import { Group, GroupRow, HomeSection, Shortcut } from "@/components/dashboard/ios";
import { cn, formatRecord } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { extractStoryCoverImage } from "@/components/stories/story-body";
import { isCommissioner, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getActiveSeason,
  getReputation,
  getSeasonStandings,
  getUserMembership,
  getXpTotal,
} from "@/lib/league";
import { getUserCareerStats } from "@/lib/career";
import { computeGmReputationScore } from "@/lib/reputation";
import { getReputationGrade, getReputationGradeLabel } from "@/lib/coach/grades";
import { formatJobStatus, getJobSecurityStatus } from "@/lib/coach/job-security";
import {
  buildDashboardPulse,
  coachHonorific,
} from "@/lib/coach/dashboard-pulse";
import { myOutstandingSimScore } from "@/lib/sim-score";
import { formatMatchupScore, hasFinalScores } from "@/lib/game-score";
import { ensureDefaultLeagueStories, getPublishedStories } from "@/lib/stories";
import { safeGetOpenPollsNeedingVote } from "@/lib/story-engagement";
import {
  byeWeekForAbbr,
  safeEnsureSeasonSchedule,
  safeGetMissingScheduledGames,
  safeGetTeamScheduledGame,
} from "@/lib/schedule";

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
  await safeEnsureSeasonSchedule(season.id);

  const [
    membership,
    xpTotal,
    reputation,
    career,
    coachProfile,
    pendingMine,
    stories,
    teamRequestUser,
    standings,
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
    prisma.user.findUnique({
      where: { id: user.id },
      include: { requestedFranchise: true },
    }),
    getSeasonStandings(season.id),
  ]);

  const gmRepScore = computeGmReputationScore(
    settings.startingGmRepScore,
    reputation.adjustments
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

  const [weekGame, pendingCount, myLiveGames, recentApproved, openPolls, openVacancies, scheduledThisWeek, missingScores] =
    await Promise.all([
    membership
      ? prisma.gameSubmission.findFirst({
          where: {
            seasonId: season.id,
            week: settings.currentWeek,
            status: { in: ["PENDING", "APPROVED"] },
            OR: [
              { userTeamId: membership.franchiseId },
              { opponentTeamId: membership.franchiseId },
            ],
          },
          include: { opponentTeam: true, userTeam: true },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve(null),
    commissionerUi
      ? prisma.gameSubmission.count({ where: { status: "PENDING" } })
      : Promise.resolve(0),
    membership
      ? prisma.gameSubmission.findMany({
          where: {
            seasonId: season.id,
            status: { in: ["PENDING", "APPROVED"] },
            OR: [
              { userTeamId: membership.franchiseId },
              { opponentTeamId: membership.franchiseId },
            ],
          },
          include: { opponentTeam: true, userTeam: true },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
    membership
      ? prisma.gameSubmission.findMany({
          where: {
            status: "APPROVED",
            OR: [
              { userTeamId: membership.franchiseId },
              { opponentTeamId: membership.franchiseId },
            ],
          },
          include: { opponentTeam: true, userTeam: true },
          orderBy: { reviewedAt: "desc" },
          take: 4,
        })
      : Promise.resolve([]),
    safeGetOpenPollsNeedingVote(user.id),
    settings.carouselOpen
      ? prisma.carouselVacancy.count({
          where: { seasonId: season.id, isOpen: true },
        })
      : Promise.resolve(0),
    membership
      ? safeGetTeamScheduledGame(
          season.id,
          settings.currentWeek,
          membership.franchiseId
        )
      : Promise.resolve(null),
    commissionerUi
      ? safeGetMissingScheduledGames(season.id, 1, settings.currentWeek)
      : Promise.resolve([]),
  ]);

  const featured =
    stories.find((s) => s.isFeatured) ??
    stories.find((s) => s.category === "FEATURE") ??
    stories[0];
  const featuredCover = featured ? extractStoryCoverImage(featured.body) : null;
  const honorsStory = stories
    .filter((story) => story.category === "PLAYER_OF_WEEK" && story.id !== featured?.id)
    .sort((a, b) => (b.week ?? -1) - (a.week ?? -1))[0];
  const honorsCover = honorsStory ? extractStoryCoverImage(honorsStory.body) : null;

  const coachName = coachHonorific(user.name);
  const seasonXp =
    career.bySeason.find((s) => s.seasonId === season.id)?.xp ?? 0;
  const standingRow = membership
    ? standings.find((row) => row.franchiseId === membership.franchiseId)
    : undefined;
  const record = standingRow
    ? formatRecord(standingRow.wins, standingRow.losses)
    : "0-0";
  const conferenceRank = membership
    ? standings
        .filter((row) => row.conference === membership.franchise.conference)
        .findIndex((row) => row.franchiseId === membership.franchiseId) + 1
    : 0;

  const pendingThisWeek = pendingMine.filter(
    (game) => game.id !== weekGame?.id
  );
  const recentOnly = recentApproved.filter((game) => game.id !== weekGame?.id).slice(0, 3);
  const outstandingSim = membership
    ? myLiveGames
        .map((game) => ({
          game,
          outstanding: myOutstandingSimScore(game, membership.franchiseId),
        }))
        .filter(
          (row): row is typeof row & { outstanding: NonNullable<typeof row.outstanding> } =>
            Boolean(
              !row.game.isForceWin &&
                row.outstanding &&
                !row.outstanding.alreadySubmitted
            )
        )
        .sort((a, b) => {
          const aNow = a.game.week === settings.currentWeek ? 0 : 1;
          const bNow = b.game.week === settings.currentWeek ? 0 : 1;
          return aNow - bNow || a.game.week - b.game.week;
        })
    : [];

  const latestRep =
    reputation.adjustments.find((row) => row.amount !== 0) ?? null;
  const pulse = buildDashboardPulse({
    displayName: user.name,
    teamName: membership?.franchise.name ?? null,
    teamAbbr: membership?.franchise.abbreviation ?? null,
    coachIdentity: coachProfile?.coachIdentity?.name ?? null,
    currentWeek: settings.currentWeek,
    jobStatus,
    reputationScore: reputation.score,
    weekGame,
    myFranchiseId: membership?.franchiseId ?? null,
    latestRep: latestRep
      ? { amount: latestRep.amount, reason: latestRep.reason, week: latestRep.week }
      : null,
    featured: featured
      ? {
          title: featured.title,
          summary: featured.summary,
          body: featured.body,
          eyebrow: featured.eyebrow,
        }
      : null,
  });
  const teamColor =
    membership?.franchise.primaryColor &&
    membership.franchise.primaryColor.toLowerCase() !== "#000000"
      ? membership.franchise.primaryColor
      : "#d4af37";

  const toDos: Array<{
    href: string;
    icon: typeof Star;
    iconClassName: string;
    title: string;
    subtitle: string;
  }> = [];

  if (!membership) {
    toDos.push({
      href: "/request-team",
      icon: Flag,
      iconClassName: "bg-[var(--primary)] text-[var(--primary-foreground)]",
      title: teamRequestUser?.requestedFranchise
        ? `Requested ${teamRequestUser.requestedFranchise.abbreviation}`
        : "Request your team",
      subtitle: teamRequestUser?.requestedFranchise
        ? "Waiting on a commissioner to assign you"
        : "Tell us which franchise you drafted",
    });
  }

  if (!coachProfile?.coachIdentityId) {
    toDos.push({
      href: "/coach/me",
      icon: UserRound,
      iconClassName:
        "bg-[color-mix(in_srgb,var(--primary)_18%,var(--muted))] text-[var(--primary)]",
      title: "Pick a coach identity",
      subtitle: "How you want to be known around the league",
    });
  }

  if (membership && !membership.franchise.teamIdentityId) {
    toDos.push({
      href: "/coach/me",
      icon: Shirt,
      iconClassName: "bg-[#1a1a1a] text-[var(--primary)] dark:bg-[#2a2a2a]",
      title: "Pick a team identity",
      subtitle: `Set the identity for ${membership.franchise.abbreviation}`,
    });
  }

  const scheduledOpp = scheduledThisWeek
    ? scheduledThisWeek.homeTeam.id === membership?.franchiseId
      ? scheduledThisWeek.awayTeam
      : scheduledThisWeek.homeTeam
    : null;
  const scheduledIsHome = scheduledThisWeek
    ? scheduledThisWeek.homeTeam.id === membership?.franchiseId
    : false;
  const isByeWeek = Boolean(
    membership &&
      byeWeekForAbbr(membership.franchise.abbreviation) === settings.currentWeek
  );

  if (membership && weekGame?.isForceWin && !hasFinalScores(weekGame)) {
    toDos.push({
      href: `/games/${weekGame.id}`,
      icon: Send,
      iconClassName: "bg-[var(--primary)] text-[var(--primary-foreground)]",
      title: "Post the simulated score",
      subtitle: `Week ${weekGame.week} force win vs ${
        weekGame.userTeamId === membership.franchiseId
          ? weekGame.opponentTeam.abbreviation
          : weekGame.userTeam.abbreviation
      } — after the week advances`,
    });
  }

  if (membership && scheduledOpp && !weekGame && !isByeWeek) {
    toDos.push({
      href: "/games?tab=week#submit-result",
      icon: Send,
      iconClassName: "bg-[var(--primary)] text-[var(--primary-foreground)]",
      title: "Submit this week's score",
      subtitle: `Week ${settings.currentWeek}: ${scheduledIsHome ? "vs" : "@"} ${scheduledOpp.abbreviation}`,
    });
  }

  for (const { game, outstanding } of outstandingSim) {
    const rated =
      outstanding.ratedTeamId === game.userTeamId ? game.userTeam : game.opponentTeam;
    const thisWeek = game.week === settings.currentWeek;
    toDos.push({
      href: `/games/${game.id}`,
      icon: Star,
      iconClassName: "bg-amber-500 text-white",
      title: thisWeek
        ? "Submit opponent Sim Score"
        : "Sim Score needed",
      subtitle: `Week ${game.week}: rate ${rated.abbreviation} · ${formatMatchupScore(game)}`,
    });
  }

  for (const poll of openPolls) {
    toDos.push({
      href: poll.href,
      icon: Vote,
      iconClassName: "bg-[var(--primary)] text-[var(--primary-foreground)]",
      title: poll.remaining === poll.total ? "Vote in the poll" : "Finish your poll picks",
      subtitle:
        poll.remaining === poll.total
          ? poll.title
          : `${poll.title} · ${poll.remaining} of ${poll.total} still open`,
    });
  }

  if (settings.carouselOpen && openVacancies > 0) {
    toDos.push({
      href: "/coach/carousel",
      icon: Flag,
      iconClassName: "bg-amber-500 text-white",
      title: "Carousel is open",
      subtitle: `${openVacancies} job${openVacancies === 1 ? "" : "s"} on the board`,
    });
  }

  for (const game of pendingThisWeek) {
    toDos.push({
      href: `/games/${game.id}`,
      icon: ClipboardCheck,
      iconClassName: "bg-[#1a1a1a] text-[var(--primary)] dark:bg-[#2a2a2a]",
      title: game.isForceWin ? "Force win pending approval" : "Result pending approval",
      subtitle: `W${game.week}: ${formatMatchupScore(game)}`,
    });
  }

  if (commissionerUi && pendingCount > 0) {
    toDos.push({
      href: "/admin/approvals",
      icon: ClipboardCheck,
      iconClassName: "bg-[var(--primary)] text-[var(--primary-foreground)]",
      title: "Approvals waiting",
      subtitle: `${pendingCount} result${pendingCount === 1 ? "" : "s"} to review`,
    });
  }

  if (commissionerUi && missingScores.length > 0) {
    toDos.push({
      href: "/admin/season",
      icon: CalendarDays,
      iconClassName: "bg-amber-500 text-white",
      title: "Scores still missing",
      subtitle: `${missingScores.length} scheduled game${missingScores.length === 1 ? "" : "s"} through week ${settings.currentWeek}`,
    });
  }

  return (
    <div
      className="relative isolate mx-auto w-full max-w-2xl space-y-8"
      style={{ ["--team" as string]: teamColor }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 left-1/2 h-80 w-[150%] -translate-x-1/2"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, color-mix(in srgb, ${teamColor} 46%, transparent) 0%, transparent 58%), radial-gradient(ellipse at 88% 8%, color-mix(in srgb, var(--primary) 34%, transparent) 0%, transparent 52%)`,
        }}
      />

      {params.teamRequested === "1" ? (
        <p className="success-banner relative rounded-2xl px-4 py-3 text-sm">
          Team request sent. A commissioner will assign you soon.
        </p>
      ) : null}

      <header className="relative animate-rise space-y-3 pt-1">
        <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">
          Season {settings.currentSeason} · Week {settings.currentWeek}
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-[2.15rem] font-semibold leading-[1.02] tracking-[0.03em] sm:text-[2.55rem]">
          <span className="text-[var(--primary)]">Coach</span> {coachName}
        </h1>
        <p className="max-w-xl text-[15px] leading-relaxed text-[var(--foreground)]/90">
          {pulse.message}
        </p>
      </header>

      {membership ? (
        <Link
          href={`/coach/profiles/${user.id}`}
          className="relative animate-rise flex items-center gap-3 overflow-hidden rounded-[1.6rem] border border-[color-mix(in_srgb,var(--team)_35%,var(--border))] bg-[color-mix(in_srgb,var(--team)_10%,var(--surface-raised))] px-4 py-3.5 pl-5 shadow-[0_8px_28px_rgba(0,0,0,0.06)] transition-transform active:scale-[0.99]"
        >
          <span
            aria-hidden
            className="absolute inset-y-0 left-0 w-1.5"
            style={{ background: teamColor }}
          />
          <CoachAvatar
            user={{
              name: user.name,
              image: user.image,
              coachProfile,
            }}
            size="md"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[17px] font-semibold leading-tight">
              {membership.franchise.name}
            </p>
            <p className="mt-0.5 truncate text-[13px] text-[var(--muted-foreground)]">
              {membership.franchise.abbreviation} · {record}
              {conferenceRank
                ? ` · ${membership.franchise.conference} #${conferenceRank}`
                : ""}
            </p>
          </div>
          <JobStatusBadge status={jobStatus} />
        </Link>
      ) : null}

      {toDos.length > 0 ? (
        <HomeSection label="Needs you">
          <Group className="border-[color-mix(in_srgb,var(--primary)_28%,var(--border))] bg-[color-mix(in_srgb,var(--primary)_7%,var(--surface-raised))]">
            {toDos.map((item) => (
              <GroupRow
                key={`${item.href}-${item.title}`}
                href={item.href}
                icon={item.icon}
                iconClassName={item.iconClassName}
                title={item.title}
                subtitle={item.subtitle}
              />
            ))}
          </Group>
        </HomeSection>
      ) : null}

      <HomeSection label={`Week ${settings.currentWeek}`}>
        {membership && weekGame ? (
          <WeekMatchup
            game={weekGame}
            myFranchiseId={membership.franchiseId}
            needsSim={outstandingSim.some((row) => row.game.id === weekGame.id)}
          />
        ) : membership && isByeWeek ? (
          <div className="rounded-[1.6rem] border border-[var(--border)] bg-[var(--surface-raised)] px-5 py-5 shadow-[0_8px_28px_rgba(0,0,0,0.06)]">
            <p className="text-[17px] font-semibold">Bye week</p>
            <p className="mt-1 text-[14px] leading-relaxed text-[var(--muted-foreground)]">
              {membership.franchise.abbreviation} is off this week on the 2026
              NFL slate.
            </p>
            <Button asChild variant="outline" className="mt-4 h-12 w-full rounded-2xl">
              <Link
                href={`/games?tab=schedule&team=${membership.franchise.abbreviation}`}
              >
                Full schedule
              </Link>
            </Button>
          </div>
        ) : membership && scheduledOpp ? (
          <div className="rounded-[1.6rem] border border-[color-mix(in_srgb,var(--primary)_30%,var(--border))] bg-[color-mix(in_srgb,var(--primary)_8%,var(--surface-raised))] px-5 py-5 shadow-[0_8px_28px_rgba(0,0,0,0.06)]">
            <p className="text-[13px] font-medium text-[var(--muted-foreground)]">
              {scheduledIsHome ? "Home" : "Away"}
              {scheduledThisWeek?.isPrimetime ? " · Primetime" : ""}
            </p>
            <p className="mt-2 text-[17px] font-semibold">
              {scheduledIsHome ? "vs" : "@"} {scheduledOpp.abbreviation}
            </p>
            <p className="mt-1 text-[14px] leading-relaxed text-[var(--muted-foreground)]">
              {scheduledOpp.name}. Play it, then drop the score so the desk can
              lock the week.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Button asChild className="h-12 rounded-2xl">
                <Link href="/games?tab=week#submit-result">Submit result</Link>
              </Button>
              <Button asChild variant="outline" className="h-12 rounded-2xl">
                <Link
                  href={`/games?tab=schedule&team=${membership.franchise.abbreviation}`}
                >
                  Full schedule
                </Link>
              </Button>
            </div>
          </div>
        ) : membership ? (
          <div className="rounded-[1.6rem] border border-[color-mix(in_srgb,var(--primary)_30%,var(--border))] bg-[color-mix(in_srgb,var(--primary)_8%,var(--surface-raised))] px-5 py-5 shadow-[0_8px_28px_rgba(0,0,0,0.06)]">
            <p className="text-[17px] font-semibold">Your game isn’t in yet</p>
            <p className="mt-1 text-[14px] leading-relaxed text-[var(--muted-foreground)]">
              Play this week, then drop the score. That’s the only result the
              desk needs from you right now.
            </p>
            <Button asChild className="mt-4 h-12 w-full rounded-2xl">
              <Link href="/games?tab=week#submit-result">Submit result</Link>
            </Button>
          </div>
        ) : (
          <div className="rounded-[1.6rem] border border-[var(--border)] bg-[var(--surface-raised)] px-5 py-5 shadow-[0_8px_28px_rgba(0,0,0,0.06)]">
            <p className="text-[17px] font-semibold">No franchise yet</p>
            <p className="mt-1 text-[14px] leading-relaxed text-[var(--muted-foreground)]">
              Request your team and this slot becomes your weekly matchup.
            </p>
          </div>
        )}
      </HomeSection>

      <nav className="stagger grid grid-cols-4 gap-1 px-1">
        <Shortcut href="/games?tab=week" label="Games" icon={Trophy} tone="gold" />
        <Shortcut
          href={
            membership
              ? `/games?tab=schedule&team=${membership.franchise.abbreviation}`
              : "/games?tab=schedule"
          }
          label="Schedule"
          icon={CalendarDays}
          tone="ink"
        />
        <Shortcut
          href="/games?tab=standings"
          label="Standings"
          icon={ListOrdered}
          tone="soft"
        />
        {membership ? (
          <Shortcut
            href={`/coach/profiles/${user.id}`}
            label="Profile"
            icon={User}
            tone="gold"
          />
        ) : (
          <Shortcut href="/games?tab=week#submit-result" label="Submit" icon={Send} tone="warn" />
        )}
      </nav>

      {featured ? (
        <HomeSection label="Front page">
          <Link
            href={`/storylines/${featured.slug}`}
            className="group relative block overflow-hidden rounded-[1.6rem] border border-[color-mix(in_srgb,var(--primary)_40%,var(--border))] bg-black shadow-[0_16px_40px_rgba(212,175,55,0.16)] transition-transform active:scale-[0.99]"
          >
            {featuredCover ? (
              <div className="relative aspect-[4/5] sm:aspect-[16/10]">
                <Image
                  src={featuredCover.src}
                  alt={featuredCover.alt}
                  fill
                  priority
                  className="object-cover object-top transition duration-500 group-hover:scale-[1.02]"
                  sizes="(max-width: 768px) 100vw, 672px"
                />
              </div>
            ) : (
              <div className="aspect-[16/10] bg-[linear-gradient(160deg,#1a1408,black)]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 space-y-2 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
                {featured.eyebrow ?? "Front page"}
                {openPolls.some((poll) => poll.href === `/storylines/${featured.slug}`)
                  ? " · Lock-in open"
                  : ""}
              </p>
              <h2 className="font-[family-name:var(--font-body)] text-[1.45rem] font-semibold leading-tight tracking-tight text-white sm:text-[1.7rem]">
                {featured.title}
              </h2>
              <p className="line-clamp-2 text-[14px] leading-relaxed text-white/75">
                {featured.summary}
              </p>
            </div>
          </Link>
        </HomeSection>
      ) : null}

      {honorsStory ? (
        <HomeSection label="Honors desk">
          <Link
            href={`/storylines/${honorsStory.slug}`}
            className="group flex overflow-hidden rounded-[1.6rem] border border-[color-mix(in_srgb,var(--primary)_45%,var(--border))] bg-[var(--surface-raised)] shadow-[0_10px_28px_rgba(212,175,55,0.12)] transition-transform active:scale-[0.99]"
          >
            {honorsCover ? (
              <div className="relative min-h-[8.5rem] w-[38%] shrink-0 self-stretch bg-black sm:w-48">
                <Image
                  src={honorsCover.src}
                  alt={honorsCover.alt}
                  fill
                  className="object-cover object-top transition duration-500 group-hover:scale-[1.03]"
                  sizes="180px"
                />
              </div>
            ) : (
              <div className="w-[38%] shrink-0 bg-[linear-gradient(160deg,#1a1408,black)] sm:w-48" />
            )}
            <div className="min-w-0 flex-1 space-y-1.5 px-4 py-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">
                {honorsStory.eyebrow ?? "Players of the week"}
              </p>
              <h2 className="font-[family-name:var(--font-body)] text-[1.05rem] font-semibold leading-tight tracking-tight sm:text-[1.2rem]">
                {honorsStory.title}
              </h2>
              <p className="line-clamp-2 text-[13px] leading-relaxed text-[var(--muted-foreground)]">
                {honorsStory.summary}
              </p>
            </div>
          </Link>
        </HomeSection>
      ) : null}

      <HomeSection label="Your season">
        <div className="stagger grid grid-cols-2 gap-3">
          <StatTile
            href="/games?tab=standings"
            label="Record"
            value={record}
            hint={
              membership
                ? `${membership.franchise.conference} #${conferenceRank || "—"}`
                : "Awaiting team"
            }
          />
          <StatTile
            href="/coach/hot-seat"
            label="Job"
            value={formatJobStatus(jobStatus)}
            hint={`${coachProfile?.contractYearsLeft ?? 3} yrs left`}
          />
          <StatTile
            href="/coach/reputation"
            label="Grade"
            value={getReputationGrade(reputation.score)}
            hint={`${reputation.score} · ${getReputationGradeLabel(getReputationGrade(reputation.score))}`}
          />
          <StatTile
            href="/coach/xp"
            label="XP"
            value={String(seasonXp)}
            hint={`Career ${xpTotal}`}
          />
        </div>
      </HomeSection>

      {recentOnly.length > 0 ? (
        <HomeSection label="Latest results">
          <Group>
            {recentOnly.map((game) => {
              const sides = matchupSides(game, membership?.franchiseId);
              return (
                <GroupRow
                  key={game.id}
                  href={`/games/${game.id}`}
                  icon={Trophy}
                  title={`${sides.mine.abbreviation} ${sides.myScore}–${sides.theirScore} ${sides.theirs.abbreviation}`}
                  subtitle={`Week ${game.week}`}
                  trailing={
                    sides.won ? (
                      <Badge variant="approved">W</Badge>
                    ) : sides.lost ? (
                      <Badge variant="rejected">L</Badge>
                    ) : null
                  }
                />
              );
            })}
          </Group>
        </HomeSection>
      ) : null}
    </div>
  );
}

function StatTile({
  href,
  label,
  value,
  hint,
}: {
  href: string;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-[1.4rem] border border-[color-mix(in_srgb,var(--primary)_22%,var(--border))] bg-[color-mix(in_srgb,var(--primary)_6%,var(--surface-raised))] px-4 py-4 shadow-[0_8px_28px_rgba(0,0,0,0.04)] transition-transform active:scale-[0.98]"
    >
      <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--primary)]">
        {label}
      </p>
      <p className="mt-1.5 font-[family-name:var(--font-body)] text-[1.35rem] font-semibold leading-none tracking-tight">
        {value}
      </p>
      <p className="mt-1.5 text-[12px] text-[var(--muted-foreground)]">{hint}</p>
    </Link>
  );
}

function WeekMatchup({
  game,
  myFranchiseId,
  needsSim = false,
}: {
  game: {
    id: string;
    status: string;
    userScore: number | null;
    opponentScore: number | null;
    userTeamId: string;
    opponentTeamId: string;
    isForceWin?: boolean;
    userTeam: { abbreviation: string; name: string };
    opponentTeam: { abbreviation: string; name: string };
  };
  myFranchiseId: string;
  needsSim?: boolean;
}) {
  const sides = matchupSides(game, myFranchiseId);
  const pending = game.status === "PENDING";
  const forceWin = Boolean(game.isForceWin);
  const scored = hasFinalScores(game);

  return (
    <Link
      href={`/games/${game.id}`}
      className={cn(
        "block overflow-hidden rounded-[1.6rem] border px-5 py-5 shadow-[0_8px_28px_rgba(0,0,0,0.06)] transition-transform active:scale-[0.99]",
        needsSim
          ? "border-amber-400/40 bg-[color-mix(in_srgb,#f59e0b_12%,var(--surface-raised))]"
          : pending
            ? "border-[color-mix(in_srgb,var(--primary)_35%,var(--border))] bg-[color-mix(in_srgb,var(--primary)_10%,var(--surface-raised))]"
            : forceWin
              ? "border-[color-mix(in_srgb,var(--primary)_35%,var(--border))] bg-[color-mix(in_srgb,var(--primary)_10%,var(--surface-raised))]"
              : sides.won
                ? "border-[color-mix(in_srgb,var(--primary)_40%,var(--border))] bg-[color-mix(in_srgb,var(--primary)_12%,var(--surface-raised))]"
                : sides.lost
                  ? "border-[color-mix(in_srgb,var(--team)_40%,var(--border))] bg-[color-mix(in_srgb,var(--team)_14%,var(--surface-raised))]"
                  : "border-[var(--border)] bg-[var(--surface-raised)]"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] font-medium text-[var(--muted-foreground)]">
          {needsSim
            ? "Rate your opponent"
            : forceWin && !scored
              ? "Force win · score pending"
              : forceWin
                ? "Force win"
                : pending
                  ? "Waiting on approval"
                  : "Final"}
        </p>
        {needsSim ? (
          <Badge variant="pending">Sim Score</Badge>
        ) : forceWin ? (
          <Badge variant="outline">Force win</Badge>
        ) : pending ? (
          <Badge variant="pending">Pending</Badge>
        ) : sides.won ? (
          <Badge variant="approved">Win</Badge>
        ) : sides.lost ? (
          <Badge variant="rejected">Loss</Badge>
        ) : (
          <Badge variant="outline">Tie</Badge>
        )}
      </div>
      <div className="mt-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[2rem] font-semibold leading-none tracking-tight">
            {sides.mine.abbreviation}
          </p>
          <p className="mt-2 text-[2.15rem] font-semibold leading-none tabular-nums tracking-tight">
            {sides.myScore}
          </p>
          <p className="mt-1.5 truncate text-[13px] text-[var(--muted-foreground)]">
            {sides.mine.name}
          </p>
        </div>
        <p className="pt-2 text-[13px] font-medium text-[var(--muted-foreground)]">vs</p>
        <div className="min-w-0 text-right">
          <p className="text-[2rem] font-semibold leading-none tracking-tight">
            {sides.theirs.abbreviation}
          </p>
          <p className="mt-2 text-[2.15rem] font-semibold leading-none tabular-nums tracking-tight">
            {sides.theirScore}
          </p>
          <p className="mt-1.5 truncate text-[13px] text-[var(--muted-foreground)]">
            {sides.theirs.name}
          </p>
        </div>
      </div>
    </Link>
  );
}

function matchupSides(
  game: {
    userScore: number | null;
    opponentScore: number | null;
    userTeamId: string;
    opponentTeamId: string;
    userTeam: { abbreviation: string; name: string };
    opponentTeam: { abbreviation: string; name: string };
  },
  myFranchiseId?: string
) {
  const mineIsUserTeam = myFranchiseId === game.userTeamId;
  const mine = mineIsUserTeam ? game.userTeam : game.opponentTeam;
  const theirs = mineIsUserTeam ? game.opponentTeam : game.userTeam;
  const myScore = mineIsUserTeam ? game.userScore : game.opponentScore;
  const theirScore = mineIsUserTeam ? game.opponentScore : game.userScore;
  return {
    mine,
    theirs,
    myScore: myScore ?? "—",
    theirScore: theirScore ?? "—",
    won: myScore != null && theirScore != null && myScore > theirScore,
    lost: myScore != null && theirScore != null && myScore < theirScore,
  };
}
