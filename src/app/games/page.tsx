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
import { getSessionUser } from "@/lib/auth";
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
import { GAME_TYPE_LABELS } from "@/lib/constants";
import { format } from "date-fns";

export default async function GamesPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
    season?: string;
    week?: string;
    conference?: string;
    q?: string;
  }>;
}) {
  const params = await searchParams;
  const tab = params.tab === "standings" ? "standings" : "week";
  const user = await getSessionUser();

  const { settings, season: activeSeason } = await getActiveSeason();
  const seasons = await listSeasons();
  const selectedSeasonNumber = params.season
    ? Number(params.season)
    : activeSeason.number;
  const season =
    seasons.find((s) => s.number === selectedSeasonNumber) ?? activeSeason;

  const selectedWeek = params.week
    ? Number(params.week)
    : season.id === activeSeason.id
      ? settings.currentWeek
      : 1;

  const membership = user
    ? await getUserMembership(user.id, activeSeason.id)
    : null;

  const franchises = await prisma.franchise.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, abbreviation: true },
  });

  const weekGames = await prisma.gameSubmission.findMany({
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
  });

  // Public viewers only see approved/voided history; coaches see their pending too.
  const visibleGames = weekGames.filter((game) => {
    if (game.status === "APPROVED" || game.status === "VOIDED") return true;
    if (!user) return false;
    if (user.role === "COMMISSIONER") return true;
    return game.submitterId === user.id;
  });

  const approvedWeekGames = visibleGames.filter((g) => g.status === "APPROVED");
  const pendingWeekGames = visibleGames.filter((g) => g.status === "PENDING");

  let standings = await getSeasonStandings(season.id);
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

  const memberships = await prisma.leagueMembership.findMany({
    where: { seasonId: season.id, isActive: true },
    include: {
      user: {
        include: {
          xpAdjustmentsReceived: {
            select: { amount: true, seasonId: true },
          },
          reputationReceived: true,
        },
      },
    },
  });

  const coachByFranchise = Object.fromEntries(
    memberships.map((m) => {
      const seasonXp = sumXp(
        m.user.xpAdjustmentsReceived.filter((x) => x.seasonId === season.id)
      );
      const score = computeReputationScore(
        settings.startingRepScore,
        m.user.reputationReceived
      );
      return [
        m.franchiseId,
        {
          name: m.user.name ?? m.user.email,
          xp: seasonXp,
          score,
          label: getReputationLabel(score),
        },
      ];
    })
  );

  const myHistory = user
    ? await prisma.gameSubmission.findMany({
        where: { submitterId: user.id },
        include: { userTeam: true, opponentTeam: true, season: true },
        orderBy: { createdAt: "desc" },
        take: 12,
      })
    : [];

  const tabQuery = {
    season: String(season.number),
    week: String(selectedWeek),
    conference: params.conference,
    q: params.q,
  };

  const canSubmit =
    Boolean(user?.isActive) &&
    season.id === activeSeason.id &&
    Boolean(membership);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold uppercase tracking-[0.06em]">
            Games
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Weekly results, standings, and score submission in one place.
          </p>
        </div>
        {canSubmit ? (
          <Button asChild>
            <a href="#submit-result">Submit your result</a>
          </Button>
        ) : null}
      </div>

      <GamesTabs active={tab} query={tabQuery} />

      <Card>
        <CardContent className="flex flex-wrap gap-2 pt-5">
          <form className="flex flex-wrap gap-2">
            <input type="hidden" name="tab" value={tab} />
            <select
              name="season"
              defaultValue={String(season.number)}
              className="h-10 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 text-sm"
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
                className="h-10 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 text-sm"
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
            ) : (
              <>
                <input
                  name="q"
                  defaultValue={params.q}
                  placeholder="Search team"
                  className="h-10 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 text-sm"
                />
                <select
                  name="conference"
                  defaultValue={params.conference ?? ""}
                  className="h-10 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 text-sm"
                >
                  <option value="">All conferences</option>
                  <option value="AFC">AFC</option>
                  <option value="NFC">NFC</option>
                </select>
              </>
            )}
            <button
              type="submit"
              className="h-10 rounded-md bg-[var(--primary)] px-4 text-sm font-medium text-[var(--primary-foreground)]"
            >
              Apply
            </button>
          </form>
        </CardContent>
      </Card>

      {tab === "week" ? (
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-2">
            <Card id="submit-result">
              <CardHeader>
                <CardTitle>Submit result</CardTitle>
                <CardDescription>
                  Season {settings.currentSeason} · Week {settings.currentWeek}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!user ? (
                  <EmptyState
                    title="Sign in to submit"
                    description="Coaches submit scores after their game. Commissioners approve before they count."
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
                        <li
                          key={s.id}
                          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium">
                              S{s.season.number} W{s.week}:{" "}
                              {s.userTeam.abbreviation} {s.userScore}–
                              {s.opponentScore} {s.opponentTeam.abbreviation}
                            </span>
                            <StatusBadge status={s.status} />
                          </div>
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
                  Week {selectedWeek} results · Season {season.number}
                </CardTitle>
                <CardDescription>
                  Official scores appear after commissioner approval.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {approvedWeekGames.length === 0 && pendingWeekGames.length === 0 ? (
                  <EmptyState
                    title="No games posted for this week"
                    description="Submit a result after you play, or check another week."
                  />
                ) : null}

                {approvedWeekGames.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                      Official results
                    </p>
                    <ul className="space-y-3">
                      {approvedWeekGames.map((game) => (
                        <li
                          key={game.id}
                          className="rounded-lg border border-[var(--border)] px-4 py-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-lg font-semibold tracking-wide">
                              {game.userTeam.abbreviation} {game.userScore}–{" "}
                              {game.opponentScore} {game.opponentTeam.abbreviation}
                            </p>
                            <StatusBadge status={game.status} />
                          </div>
                          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                            {game.userTeam.name} vs {game.opponentTeam.name} ·{" "}
                            {GAME_TYPE_LABELS[game.gameType]} ·{" "}
                            {game.submitter.name ?? game.submitter.email}
                            {game.reviewedAt
                              ? ` · ${format(game.reviewedAt, "MMM d")}`
                              : ""}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {pendingWeekGames.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                      Pending approval
                    </p>
                    <ul className="space-y-3">
                      {pendingWeekGames.map((game) => (
                        <li
                          key={game.id}
                          className="rounded-lg border border-dashed border-[var(--border)] px-4 py-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-medium">
                              {game.userTeam.abbreviation} {game.userScore}–
                              {game.opponentScore} {game.opponentTeam.abbreviation}
                            </p>
                            <StatusBadge status={game.status} />
                          </div>
                          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                            Waiting on commissioners ·{" "}
                            {game.submitter.name ?? game.submitter.email}
                          </p>
                        </li>
                      ))}
                    </ul>
                    {user?.role === "COMMISSIONER" ? (
                      <Button asChild variant="outline" size="sm">
                        <Link href="/admin/approvals">Review approvals</Link>
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
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
                          <div className="font-medium">{row.name}</div>
                          <div className="text-xs text-[var(--muted-foreground)]">
                            {row.conference} {row.division}
                          </div>
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
