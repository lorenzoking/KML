import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge, ReputationBadge } from "@/components/status-badge";
import { SubmissionForm } from "@/components/forms/submission-form";
import { GamesTabs } from "@/components/games/games-tabs";
import {
  BoardHero,
  GamesHero,
  GamesLiveStrip,
  TeamMark,
  teamColor,
} from "@/components/games/scoreboard";
import { getSessionUser, isCommissioner } from "@/lib/auth";
import { formatLeagueDate } from "@/lib/datetime";
import { prisma } from "@/lib/prisma";
import {
  getActiveSeason,
  getSeasonStandings,
  getUserMembership,
  listSeasons,
} from "@/lib/league";
import { getMaddenLivePulse } from "@/lib/madden/query";
import { sumXp } from "@/lib/xp";
import {
  computeReputationScore,
  getReputationLabel,
} from "@/lib/reputation";
import { formatBothSimScores, myOutstandingSimScore } from "@/lib/sim-score";
import { formatMatchupScore } from "@/lib/game-score";
import { ScrollToHash } from "@/components/games/scroll-to-hash";
import { WeekSlate } from "@/components/games/week-slate";
import { TeamSchedule } from "@/components/games/team-schedule";
import { SimScoreForm } from "@/components/forms/sim-score-form";
import { MaddenLiveRefresh } from "@/components/league/madden-live-refresh";
import {
  buildTeamSchedule,
  buildWeekSlate,
  NFL_REGULAR_SEASON_WEEKS,
  safeEnsureSeasonSchedule,
} from "@/lib/schedule";

const franchiseSelect = {
  id: true,
  name: true,
  abbreviation: true,
  primaryColor: true,
} as const;

export default async function GamesPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
    season?: string;
    week?: string;
    team?: string;
    conference?: string;
    q?: string;
  }>;
}) {
  const params = await searchParams;
  const tab =
    params.tab === "standings"
      ? "standings"
      : params.tab === "schedule"
        ? "schedule"
        : "week";
  const [user, active, seasons, pulse] = await Promise.all([
    getSessionUser(),
    getActiveSeason(),
    listSeasons(),
    getMaddenLivePulse(),
  ]);
  const { settings, season: activeSeason } = active;
  const commissionerUi = user ? await isCommissioner(user) : false;
  const selectedSeasonNumber = params.season
    ? Number(params.season)
    : activeSeason.number;
  const season =
    seasons.find((s) => s.number === selectedSeasonNumber) ?? activeSeason;

  await safeEnsureSeasonSchedule(season.id);

  const selectedWeek = params.week
    ? Number(params.week)
    : season.id === activeSeason.id
      ? settings.currentWeek
      : 1;

  const membershipPromise = user
    ? getUserMembership(user.id, activeSeason.id)
    : Promise.resolve(null);

  const franchisesPromise = prisma.franchise.findMany({
    orderBy: { sortOrder: "asc" },
    select: franchiseSelect,
  });

  const weekDataPromise =
    tab === "week"
      ? Promise.all([
          prisma.gameSubmission.findMany({
            where: {
              seasonId: season.id,
              week: selectedWeek,
              status: { in: ["APPROVED", "PENDING", "VOIDED", "REJECTED"] },
            },
            include: {
              userTeam: true,
              opponentTeam: true,
              submitter: true,
              result: true,
            },
            orderBy: [{ status: "asc" }, { createdAt: "asc" }],
          }),
          user
            ? prisma.gameSubmission.findMany({
                where: {
                  OR: [
                    { submitterId: user.id },
                    {
                      status: { in: ["PENDING", "APPROVED"] },
                      opponentTeam: {
                        memberships: {
                          some: {
                            userId: user.id,
                            seasonId: season.id,
                            isActive: true,
                          },
                        },
                      },
                    },
                  ],
                },
                include: { userTeam: true, opponentTeam: true, season: true },
                orderBy: { createdAt: "desc" },
                take: 12,
              })
            : Promise.resolve([]),
          prisma.scheduledGame.findMany({
            where: { seasonId: season.id, week: selectedWeek },
            include: {
              homeTeam: { select: franchiseSelect },
              awayTeam: { select: franchiseSelect },
            },
          }),
        ])
      : Promise.resolve([[], [], []] as const);

  const scheduleDataPromise =
    tab === "schedule"
      ? Promise.all([
          prisma.scheduledGame.findMany({
            where: { seasonId: season.id },
            include: {
              homeTeam: { select: franchiseSelect },
              awayTeam: { select: franchiseSelect },
            },
            orderBy: { week: "asc" },
          }),
          prisma.gameSubmission.findMany({
            where: {
              seasonId: season.id,
              status: { in: ["PENDING", "APPROVED"] },
            },
            select: {
              id: true,
              status: true,
              userTeamId: true,
              opponentTeamId: true,
              userScore: true,
              opponentScore: true,
              isForceWin: true,
            },
          }),
        ])
      : Promise.resolve([[], []] as const);

  const standingsDataPromise =
    tab === "standings"
      ? Promise.all([
          getSeasonStandings(season.id),
          prisma.leagueMembership.findMany({
            where: { seasonId: season.id, isActive: true },
            include: {
              user: {
                include: {
                  xpAdjustmentsReceived: {
                    where: { seasonId: season.id },
                    select: { amount: true, seasonId: true },
                  },
                  reputationReceived: { select: { amount: true } },
                },
              },
            },
          }),
        ])
      : Promise.resolve([[], []] as const);

  const [
    membership,
    franchises,
    [weekGames, myHistory, scheduledWeek],
    [teamScheduled, teamSubmissions],
    [rawStandings, memberships],
  ] = await Promise.all([
    membershipPromise,
    franchisesPromise,
    weekDataPromise,
    scheduleDataPromise,
    standingsDataPromise,
  ]);

  // Public viewers only see approved/voided history; coaches see games they're in.
  const myTeamId = membership?.franchiseId;
  const visibleGames = weekGames.filter((game) => {
    if (game.status === "APPROVED" || game.status === "VOIDED") return true;
    if (!user) return false;
    if (commissionerUi) return true;
    if (game.submitterId === user.id) return true;
    return Boolean(
      myTeamId &&
        (game.userTeamId === myTeamId || game.opponentTeamId === myTeamId)
    );
  });

  const weekSlate = buildWeekSlate(
    [...scheduledWeek],
    visibleGames.filter((game) => game.status === "PENDING" || game.status === "APPROVED")
  );
  const missingThisWeek = weekSlate.filter((row) => row.status === "missing").length;

  const selectedTeamAbbr = (
    params.team ||
    membership?.franchise.abbreviation ||
    franchises[0]?.abbreviation ||
    "SEA"
  ).toUpperCase();
  const selectedTeam =
    franchises.find((row) => row.abbreviation === selectedTeamAbbr) ??
    franchises[0];
  const teamScheduleRows = selectedTeam
    ? buildTeamSchedule(
        selectedTeam.id,
        [...teamScheduled].filter(
          (game) =>
            game.homeTeamId === selectedTeam.id ||
            game.awayTeamId === selectedTeam.id
        ),
        [...teamSubmissions]
      )
    : [];

  const myScheduled =
    membership && scheduledWeek.length > 0
      ? scheduledWeek.find(
          (game) =>
            game.homeTeam.id === membership.franchiseId ||
            game.awayTeam.id === membership.franchiseId
        )
      : null;
  const scheduledOpponent = myScheduled
    ? myScheduled.homeTeam.id === membership?.franchiseId
      ? myScheduled.awayTeam
      : myScheduled.homeTeam
    : null;

  const tabQuery = {
    season: String(season.number),
    week: String(selectedWeek),
    team: selectedTeamAbbr,
    conference: params.conference,
    q: params.q,
  };

  let standings = rawStandings;
  if (params.conference === "AFC" || params.conference === "NFC") {
    standings = standings.filter((s) => s.conference === params.conference);
  }
  if (params.q) {
    const q = params.q.toLowerCase();
    standings = standings.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.abbreviation.toLowerCase().includes(q)
    );
  }

  const coachByFranchise = Object.fromEntries(
    memberships.map((m) => {
      const seasonXp = sumXp(m.user.xpAdjustmentsReceived);
      const score = computeReputationScore(
        settings.startingRepScore,
        m.user.reputationReceived
      );
      return [
        m.franchiseId,
        {
          name: m.user.name?.trim() || "Unnamed coach",
          xp: seasonXp,
          score,
          label: getReputationLabel(score),
        },
      ];
    })
  );

  const myWeekGame =
    membership && tab === "week"
      ? weekGames.find(
          (game) =>
            (game.status === "PENDING" || game.status === "APPROVED") &&
            (game.userTeamId === membership.franchiseId ||
              game.opponentTeamId === membership.franchiseId)
        )
      : null;
  const myWeekOutstanding =
    membership && myWeekGame
      ? myOutstandingSimScore(myWeekGame, membership.franchiseId)
      : null;
  const myWeekRatedTeam =
    myWeekGame && myWeekOutstanding
      ? myWeekOutstanding.ratedTeamId === myWeekGame.userTeamId
        ? myWeekGame.userTeam
        : myWeekGame.opponentTeam
      : null;

  const canSubmit =
    Boolean(user?.isActive) &&
    season.id === activeSeason.id &&
    Boolean(membership);

  const liveLabel =
    pulse.pending > 0
      ? `Indexing ${pulse.pending} new dump${pulse.pending === 1 ? "" : "s"} from Madden…`
      : pulse.indexedAt
        ? `Companion live · ${formatLeagueDate(pulse.indexedAt, "MMM d, h:mm a")}`
        : "Waiting on the next Companion export";
  const weekFinals = weekSlate.filter((row) => row.status === "approved").length;
  const weekOpen = weekSlate.filter((row) => row.status === "missing").length;
  const weekPrimetime = weekSlate.filter((row) => row.isPrimetime).length;
  const colorByFranchise = Object.fromEntries(
    franchises.map((franchise) => [franchise.id, franchise.primaryColor])
  );
  const playedSchedule = teamScheduleRows.filter(
    (row) => !row.bye && row.myScore != null && row.oppScore != null
  );
  const scheduleWins = playedSchedule.filter(
    (row) => !row.bye && row.myScore! > row.oppScore!
  ).length;
  const scheduleLosses = playedSchedule.filter(
    (row) => !row.bye && row.myScore! < row.oppScore!
  ).length;
  const scheduleTies = playedSchedule.filter(
    (row) => !row.bye && row.myScore === row.oppScore
  ).length;
  const standingsLeader = standings[0];
  const gamesCounted =
    standings.reduce(
      (sum, row) => sum + row.wins + row.losses + row.ties,
      0
    ) / 2;

  const filterControlClass =
    "h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 text-base shadow-sm sm:h-10 sm:w-auto sm:text-sm";

  return (
    <div className="space-y-6">
      {tab === "week" ? <ScrollToHash id="submit-result" /> : null}
      <MaddenLiveRefresh stamp={pulse.stamp} pending={pulse.pending} />

      {tab === "week" ? (
        <GamesHero
          week={selectedWeek}
          seasonNumber={season.number}
          isCurrentWeek={
            season.id === activeSeason.id && selectedWeek === settings.currentWeek
          }
          finals={weekFinals}
          open={weekOpen}
          primetime={weekPrimetime}
          liveLabel={liveLabel}
          deskHref={
            selectedWeek === 9
              ? "/storylines/season-1-week-9-primetime"
              : undefined
          }
          deskLabel={
            selectedWeek === 9 ? "Week 9 Games of the Week" : undefined
          }
        />
      ) : tab === "schedule" ? (
        <BoardHero
          kicker={`Season ${season.number} · 17 games + bye`}
          title={selectedTeam?.name ?? "Team schedule"}
          subtitle="The 2026 NFL slate. Open games still need a score on the board."
          color={selectedTeam?.primaryColor}
          watermark={selectedTeam?.abbreviation}
          tiles={[
            {
              label: "Record",
              value:
                scheduleTies > 0
                  ? `${scheduleWins}–${scheduleLosses}–${scheduleTies}`
                  : `${scheduleWins}–${scheduleLosses}`,
            },
            { label: "Played", value: String(playedSchedule.length) },
            {
              label: "Open",
              value: String(
                teamScheduleRows.filter((row) => !row.bye && row.status === "missing")
                  .length
              ),
            },
          ]}
        />
      ) : (
        <BoardHero
          kicker={`Season ${season.number} · approved results only`}
          title="Standings"
          subtitle="Wins, scoring, XP, and reputation from the commissioner-approved board."
          color={
            standingsLeader
              ? colorByFranchise[standingsLeader.franchiseId]
              : undefined
          }
          watermark={standingsLeader?.abbreviation}
          tiles={[
            {
              label: "Front",
              value: standingsLeader?.abbreviation ?? "—",
            },
            { label: "Games", value: String(Math.round(gamesCounted)) },
            {
              label: "Lead",
              value: standingsLeader
                ? `${standingsLeader.wins}–${standingsLeader.losses}`
                : "—",
            },
          ]}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <GamesLiveStrip label={liveLabel} />
        {canSubmit ? (
          <Button asChild size="sm">
            {tab === "week" ? (
              <a href="#submit-result">Submit Sim Score</a>
            ) : (
              <Link href="/games?tab=week#submit-result">Submit Sim Score</Link>
            )}
          </Button>
        ) : null}
      </div>

      <GamesTabs active={tab} query={tabQuery} />

      <form className="flex flex-wrap gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-3">
        <input type="hidden" name="tab" value={tab} />
        <select
          name="season"
          defaultValue={String(season.number)}
          className={filterControlClass}
        >
          {seasons.map((s) => (
            <option key={s.id} value={s.number}>
              Season {s.number}
              {s.status === "ARCHIVED" ? " (archived)" : ""}
            </option>
          ))}
        </select>
        {tab === "week" ? (
          <select
            name="week"
            defaultValue={String(selectedWeek)}
            className={filterControlClass}
          >
            {Array.from({ length: 22 }, (_, i) => i + 1).map((week) => (
              <option key={week} value={week}>
                Week {week}
                {season.id === activeSeason.id && week === settings.currentWeek
                  ? " (current)"
                  : ""}
              </option>
            ))}
          </select>
        ) : tab === "schedule" ? (
          <select
            name="team"
            defaultValue={selectedTeamAbbr}
            className={filterControlClass}
          >
            {franchises.map((franchise) => (
              <option key={franchise.id} value={franchise.abbreviation}>
                {franchise.abbreviation} · {franchise.name}
                {membership?.franchiseId === franchise.id ? " (you)" : ""}
              </option>
            ))}
          </select>
        ) : (
          <>
            <input
              name="q"
              defaultValue={params.q}
              placeholder="Search team"
              className={filterControlClass}
            />
            <select
              name="conference"
              defaultValue={params.conference ?? ""}
              className={filterControlClass}
            >
              <option value="">All conferences</option>
              <option value="AFC">AFC</option>
              <option value="NFC">NFC</option>
            </select>
          </>
        )}
        <button
          type="submit"
          className="h-11 w-full rounded-xl bg-[var(--primary)] px-4 text-sm font-semibold text-[var(--primary-foreground)] shadow-sm transition hover:brightness-110 sm:h-10 sm:w-auto"
        >
          Apply
        </button>
      </form>

      {tab === "week" ? (
        <div className="space-y-8">
          <section className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
                  Scoreboard
                </p>
                <h2 className="font-[family-name:var(--font-display)] text-2xl uppercase tracking-wide">
                  Week {selectedWeek} slate
                </h2>
              </div>
              {commissionerUi && missingThisWeek > 0 ? (
                <Button asChild variant="outline" size="sm">
                  <Link href="/admin/season">Missing results</Link>
                </Button>
              ) : null}
            </div>
            {weekSlate.length > 0 ? (
              <WeekSlate
                rows={weekSlate}
                myTeamId={myTeamId}
                isCommissioner={commissionerUi}
                seasonNumber={season.number}
              />
            ) : (
              <EmptyState
                title="No scheduled games this week"
                description="Playoff or extra games still show after a coach submits."
              />
            )}
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card id="submit-result" className="scroll-mt-24 animate-rise">
              <CardHeader>
                <CardTitle>
                  {myWeekGame &&
                  !myWeekGame.isForceWin &&
                  myWeekOutstanding &&
                  !myWeekOutstanding.alreadySubmitted
                    ? "Submit opponent Sim Score"
                    : "Submit Sim Score"}
                </CardTitle>
                <CardDescription>
                  {myWeekGame
                    ? `This Week ${myWeekGame.week} matchup is already on the board. Rate your opponent — the Companion export already posted the score and XP.`
                    : `Season ${settings.currentSeason} · Week ${settings.currentWeek}. Rate your opponent — Madden scores and coach XP come from the Companion export. If the game cut out or your opponent could not play, mark a force win instead.`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!user ? (
                  <EmptyState
                    title="Sign in to submit"
                    description="Coaches submit a Sim Score after they play. Game scores and XP come from the Madden Companion export. Use a force win if the game cut out or the opponent could not play."
                  />
                ) : !user.isActive ? (
                  <EmptyState title="Account inactive" />
                ) : season.id !== activeSeason.id ? (
                  <EmptyState
                    title="Viewing an archived season"
                    description="Switch back to the active season to submit a new result."
                  />
                ) : !membership ? (
                  <EmptyState
                    title="No franchise assigned"
                    description="Ask a commissioner to assign you a team before submitting."
                  />
                ) : myWeekGame?.isForceWin ? (
                  <div className="space-y-3">
                    <EmptyState
                      title="Force win on the board"
                      description="This matchup does not take a Sim Score. Open the game if you still need to post the simulated score after the week advances."
                    />
                    <Button asChild variant="outline" className="w-full">
                      <Link href={`/games/${myWeekGame.id}`}>Open game</Link>
                    </Button>
                  </div>
                ) : myWeekGame &&
                  myWeekOutstanding &&
                  !myWeekOutstanding.alreadySubmitted &&
                  myWeekRatedTeam ? (
                  <div id="sim-score" className="scroll-mt-24">
                    <SimScoreForm
                      submissionId={myWeekGame.id}
                      opponentName={myWeekRatedTeam.name}
                      opponentAbbr={myWeekRatedTeam.abbreviation}
                    />
                    <p className="mt-3 text-xs text-[var(--muted-foreground)]">
                      <Link
                        href={`/games/${myWeekGame.id}#sim-score`}
                        className="font-medium text-[var(--primary)] hover:underline"
                      >
                        Open the game page
                      </Link>{" "}
                      if you want the recap while you rate.
                    </p>
                  </div>
                ) : myWeekGame && myWeekOutstanding?.alreadySubmitted ? (
                  <div className="space-y-3">
                    <EmptyState
                      title={`You already rated ${myWeekRatedTeam?.abbreviation ?? "your opponent"}`}
                      description="Your Sim Score is in. Open the game if you want the recap or box score."
                    />
                    <Button asChild variant="outline" className="w-full">
                      <Link href={`/games/${myWeekGame.id}`}>Open game</Link>
                    </Button>
                  </div>
                ) : (
                  <SubmissionForm
                    franchises={franchises.filter(
                      (f) => f.id !== membership.franchiseId
                    )}
                    currentSeason={settings.currentSeason}
                    currentWeek={settings.currentWeek}
                    userTeamName={membership.franchise.name}
                    scheduledOpponent={scheduledOpponent}
                    scheduledIsHome={
                      myScheduled
                        ? myScheduled.homeTeam.id === membership.franchiseId
                        : undefined
                    }
                    scheduledPrimetime={myScheduled?.isPrimetime}
                    isByeWeek={
                      selectedWeek <= NFL_REGULAR_SEASON_WEEKS &&
                      scheduledWeek.length > 0 &&
                      !myScheduled
                    }
                  />
                )}
                {!user ? (
                  <div className="mt-4">
                    <Button asChild className="w-full">
                      <Link href="/sign-in?next=/games">Sign in to submit</Link>
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {user ? (
              <Card>
                <CardHeader>
                  <CardTitle>Your recent tape</CardTitle>
                </CardHeader>
                <CardContent>
                  {myHistory.length === 0 ? (
                    <EmptyState title="No submissions yet" />
                  ) : (
                    <ul className="space-y-2">
                      {myHistory.map((s) => (
                        <li key={s.id}>
                          <Link
                            href={`/games/${s.id}`}
                            className="surface-hover flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-3 py-2.5"
                          >
                            <TeamMark
                              abbr={s.userTeam.abbreviation}
                              color={s.userTeam.primaryColor}
                              size="sm"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-[family-name:var(--font-display)] uppercase tracking-wide">
                                S{s.season.number} W{s.week} · {formatMatchupScore(s)}
                              </p>
                              <p className="truncate text-xs text-[var(--muted-foreground)]">
                                {formatBothSimScores(s)}
                              </p>
                            </div>
                            <StatusBadge status={s.status} />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      ) : tab === "schedule" ? (
        teamScheduleRows.length === 0 ? (
          <EmptyState
            title="Schedule not loaded"
            description="The 2026 NFL slate will appear here after the database migration runs."
          />
        ) : (
          <TeamSchedule rows={teamScheduleRows} />
        )
      ) : (
        <>
          {standings.every((s) => s.wins + s.losses + s.ties === 0) ? (
            <EmptyState
              title="No approved games yet"
              description="Standings fill in after commissioners approve weekly results."
            />
          ) : null}

          <ol className="stagger space-y-2">
            {standings.map((row, idx) => {
              const coach = coachByFranchise[row.franchiseId];
              const hex = teamColor(colorByFranchise[row.franchiseId]);
              return (
                <li key={row.franchiseId}>
                  <Link
                    href={`/games?tab=schedule&season=${season.number}&team=${row.abbreviation}`}
                    className="surface-hover block overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)]"
                  >
                    <div className="flex items-stretch gap-3 p-3 sm:p-4">
                      <span
                        className="w-1.5 self-stretch rounded-full"
                        style={{ background: hex }}
                      />
                      <span className="w-6 shrink-0 text-sm tabular-nums text-[var(--muted-foreground)]">
                        {idx + 1}
                      </span>
                      <TeamMark
                        abbr={row.abbreviation}
                        color={colorByFranchise[row.franchiseId]}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-[family-name:var(--font-display)] text-xl uppercase tracking-wide">
                          {row.abbreviation}
                        </p>
                        <p className="truncate text-xs text-[var(--muted-foreground)]">
                          {row.name} · {row.conference} {row.division}
                          {coach ? ` · ${coach.name}` : ""}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-[family-name:var(--font-display)] text-2xl tabular-nums text-[var(--primary)]">
                          {row.wins}–{row.losses}
                          {row.ties ? `–${row.ties}` : ""}
                        </p>
                        <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
                          PF {row.pointsFor} · PA {row.pointsAgainst}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 border-t border-[var(--border)] px-3 py-2 sm:px-4">
                      {row.form ? (
                        <span className="flex gap-1">
                          {row.form.split("").map((letter, formIdx) => (
                            <span
                              key={`${row.franchiseId}-${formIdx}`}
                              className={
                                letter === "W"
                                  ? "font-[family-name:var(--font-display)] text-[var(--primary)]"
                                  : letter === "L"
                                    ? "font-[family-name:var(--font-display)] text-rose-300"
                                    : "font-[family-name:var(--font-display)] text-[var(--muted-foreground)]"
                              }
                            >
                              {letter}
                            </span>
                          ))}
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--muted-foreground)]">
                          No form yet
                        </span>
                      )}
                      <span className="ml-auto flex flex-wrap items-center gap-2 text-xs text-[var(--muted-foreground)]">
                        <Badge variant="outline">XP {coach?.xp ?? 0}</Badge>
                        {coach ? (
                          <ReputationBadge
                            label={coach.label}
                            score={coach.score}
                          />
                        ) : (
                          "—"
                        )}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ol>
        </>
      )}
    </div>
  );
}

