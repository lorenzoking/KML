import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge, ReputationBadge } from "@/components/status-badge";
import { SubmissionForm } from "@/components/forms/submission-form";
import { GamesTabs } from "@/components/games/games-tabs";
import { getSessionUser, isCommissioner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getActiveSeason,
  getSeasonStandings,
  getUserMembership,
  listSeasons,
} from "@/lib/league";
import { sumXp } from "@/lib/xp";
import {
  computeReputationScore,
  getReputationLabel,
} from "@/lib/reputation";
import { formatBothSimScores } from "@/lib/sim-score";
import { formatMatchupScore } from "@/lib/game-score";
import { ScrollToHash } from "@/components/games/scroll-to-hash";
import { WeekSlate } from "@/components/games/week-slate";
import { TeamSchedule } from "@/components/games/team-schedule";
import {
  buildTeamSchedule,
  buildWeekSlate,
  NFL_REGULAR_SEASON_WEEKS,
  safeEnsureSeasonSchedule,
} from "@/lib/schedule";

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
  const [user, active, seasons] = await Promise.all([
    getSessionUser(),
    getActiveSeason(),
    listSeasons(),
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
    select: { id: true, name: true, abbreviation: true },
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
              homeTeam: { select: { id: true, name: true, abbreviation: true } },
              awayTeam: { select: { id: true, name: true, abbreviation: true } },
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
              homeTeam: { select: { id: true, name: true, abbreviation: true } },
              awayTeam: { select: { id: true, name: true, abbreviation: true } },
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

  const canSubmit =
    Boolean(user?.isActive) &&
    season.id === activeSeason.id &&
    Boolean(membership);

  return (
    <div className="space-y-6">
      {tab === "week" ? <ScrollToHash id="submit-result" /> : null}
      <div className="grid gap-4 sm:flex sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold uppercase tracking-[0.04em] sm:text-3xl sm:tracking-[0.06em]">
            Games
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Weekly results, team schedules, and score submission in one place.
          </p>
        </div>
        {canSubmit ? (
          <Button asChild className="w-full sm:w-auto">
            {tab === "week" ? (
              <a href="#submit-result">Submit your result</a>
            ) : (
              <Link href="/games?tab=week#submit-result">Submit your result</Link>
            )}
          </Button>
        ) : null}
      </div>

      <GamesTabs active={tab} query={tabQuery} />

      <Card>
        <CardContent className="pt-4 sm:pt-5">
          <form className="grid gap-2 sm:flex sm:flex-wrap">
            <input type="hidden" name="tab" value={tab} />
            <select
              name="season"
              defaultValue={String(season.number)}
              className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 text-base shadow-sm sm:h-10 sm:w-auto sm:text-sm"
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
                className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 text-base shadow-sm sm:h-10 sm:w-auto sm:text-sm"
              >
                {Array.from({ length: 22 }, (_, i) => i + 1).map((week) => (
                  <option key={week} value={week}>
                    Week {week}
                    {season.id === activeSeason.id &&
                    week === settings.currentWeek
                      ? " (current)"
                      : ""}
                  </option>
                ))}
              </select>
            ) : tab === "schedule" ? (
              <select
                name="team"
                defaultValue={selectedTeamAbbr}
                className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 text-base shadow-sm sm:h-10 sm:w-auto sm:text-sm"
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
                  className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 text-base shadow-sm sm:h-10 sm:w-auto sm:text-sm"
                />
                <select
                  name="conference"
                  defaultValue={params.conference ?? ""}
                  className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 text-base shadow-sm sm:h-10 sm:w-auto sm:text-sm"
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
        </CardContent>
      </Card>

      {tab === "week" ? (
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-2">
            <Card id="submit-result" className="scroll-mt-24 animate-rise">
              <CardHeader>
                <CardTitle>Submit Sim Score</CardTitle>
                <CardDescription>
                  Season {settings.currentSeason} · Week {settings.currentWeek}.
                  Rate your opponent — Madden scores and coach XP come from the
                  Companion export. If the game cut out or your opponent could
                  not play, mark a force win instead.
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
                  <CardTitle>Your recent submissions</CardTitle>
                </CardHeader>
                <CardContent>
                  {myHistory.length === 0 ? (
                    <EmptyState title="No submissions yet" />
                  ) : (
                    <ul className="space-y-3">
                      {myHistory.map((s) => (
                        <li key={s.id}>
                          <Link
                            href={`/games/${s.id}`}
                            className="block rounded-lg border border-[var(--border)] px-3 py-2 text-sm transition-colors hover:bg-[var(--muted)]"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium">
                                S{s.season.number} W{s.week}:{" "}
                                {formatMatchupScore(s)}
                              </span>
                              <StatusBadge status={s.status} />
                            </div>
                            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                              {formatBothSimScores(s)}
                            </p>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            ) : null}
          </div>

          <div className="space-y-6 lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>
                  Week {selectedWeek} slate · Season {season.number}
                </CardTitle>
                <CardDescription>
                  {weekSlate.length > 0
                    ? `${weekSlate.length} scheduled games · ${missingThisWeek} still need a score.`
                    : "Official scores appear after commissioner approval."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {weekSlate.length > 0 ? (
                  <>
                    <WeekSlate
                      rows={weekSlate}
                      myTeamId={myTeamId}
                      isCommissioner={commissionerUi}
                      seasonNumber={season.number}
                    />
                    {commissionerUi && missingThisWeek > 0 ? (
                      <Button asChild variant="outline" size="sm">
                        <Link href="/admin/season">Missing results</Link>
                      </Button>
                    ) : null}
                  </>
                ) : (
                  <EmptyState
                    title="No scheduled games this week"
                    description="Playoff or extra games still show after a coach submits."
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : tab === "schedule" ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedTeam
                ? `${selectedTeam.name} schedule`
                : "Team schedule"}
            </CardTitle>
            <CardDescription>
              2026 NFL regular season · 17 games + one bye. Open games still
              need a submitted score.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {teamScheduleRows.length === 0 ? (
              <EmptyState
                title="Schedule not loaded"
                description="The 2026 NFL slate will appear here after the database migration runs."
              />
            ) : (
              <TeamSchedule rows={teamScheduleRows} />
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {standings.every((s) => s.wins + s.losses + s.ties === 0) ? (
            <EmptyState
              title="No approved games yet"
              description="Standings fill in after commissioners approve weekly results."
            />
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Season {season.number} standings</CardTitle>
              <CardDescription>
                Derived from approved, non-voided results only.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Coach</TableHead>
                    <TableHead>W</TableHead>
                    <TableHead>L</TableHead>
                    <TableHead>PF</TableHead>
                    <TableHead>PA</TableHead>
                    <TableHead>Form</TableHead>
                    <TableHead>XP</TableHead>
                    <TableHead>Rep</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {standings.map((row, idx) => {
                    const coach = coachByFranchise[row.franchiseId];
                    return (
                      <TableRow key={row.franchiseId}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>
                          <Link
                            href={`/games?tab=schedule&season=${season.number}&team=${row.abbreviation}`}
                            className="hover:text-[var(--primary)]"
                          >
                            <div className="font-medium">{row.name}</div>
                            <div className="text-xs text-[var(--muted-foreground)]">
                              {row.conference} {row.division}
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell>{coach?.name ?? "—"}</TableCell>
                        <TableCell>{row.wins}</TableCell>
                        <TableCell>{row.losses}</TableCell>
                        <TableCell>{row.pointsFor}</TableCell>
                        <TableCell>{row.pointsAgainst}</TableCell>
                        <TableCell>
                          {row.form ? (
                            <Badge variant="outline">{row.form}</Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>{coach?.xp ?? 0}</TableCell>
                        <TableCell>
                          {coach ? (
                            <ReputationBadge
                              label={coach.label}
                              score={coach.score}
                            />
                          ) : (
                            "—"
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

