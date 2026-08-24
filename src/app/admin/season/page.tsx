import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/forms/submit-button";
import { StatusBadge } from "@/components/status-badge";
import { formatMatchupScore } from "@/lib/game-score";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { getActiveSeason, listSeasons } from "@/lib/league";
import {
  advanceToNextSeason,
  advanceLeagueWeek,
  resetCurrentSeasonGames,
  voidGame,
} from "@/actions/season";
import { format } from "date-fns";
import {
  safeEnsureSeasonSchedule,
  safeGetMissingScheduledGames,
} from "@/lib/schedule";
import { CommissionerFileMissingGameForm } from "@/components/forms/commissioner-file-missing-game-form";

export default async function AdminSeasonPage() {
  const { season, settings } = await getActiveSeason();
  const seasons = await listSeasons();
  await safeEnsureSeasonSchedule(season.id);

  const [approvedGames, pendingCount, voidedCount, missingScores] = await Promise.all([
    prisma.gameSubmission.findMany({
      where: { seasonId: season.id, status: "APPROVED" },
      include: {
        userTeam: true,
        opponentTeam: true,
        submitter: true,
        result: true,
      },
      orderBy: [{ week: "asc" }, { createdAt: "asc" }],
    }),
    prisma.gameSubmission.count({
      where: { seasonId: season.id, status: "PENDING" },
    }),
    prisma.gameResult.count({
      where: { seasonId: season.id, isVoided: true },
    }),
    safeGetMissingScheduledGames(season.id, 1, settings.currentWeek),
  ]);

  const overdue = missingScores.filter((row) => row.week < settings.currentWeek);
  const currentMissing = missingScores.filter(
    (row) => row.week === settings.currentWeek
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold uppercase tracking-wide">
          Season controls
        </h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          Archive seasons and void games without erasing franchise history. Career
          XP and season records stay available for 10+ seasons.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active season</CardDescription>
            <CardTitle className="text-3xl">S{settings.currentSeason}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-[var(--muted-foreground)]">
            Week {settings.currentWeek}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Approved games</CardDescription>
            <CardTitle className="text-3xl">{approvedGames.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-[var(--muted-foreground)]">
            {pendingCount} pending · {voidedCount} voided
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total seasons tracked</CardDescription>
            <CardTitle className="text-3xl">{seasons.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-[var(--muted-foreground)]">
            Archived seasons keep standings history
          </CardContent>
        </Card>
      </div>

      <Card className="border-[color-mix(in_srgb,var(--primary)_28%,var(--border))]">
        <CardHeader>
          <CardTitle>Scheduled games missing scores</CardTitle>
          <CardDescription>
            2026 NFL regular-season slate through week {settings.currentWeek}.
            Advance even if games are still open — they stay on this list until
            someone files a result. File a missing score here; coaches do not
            earn XP.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <p className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm">
              <span className="block text-xs text-[var(--muted-foreground)]">
                Week {settings.currentWeek} open
              </span>
              <span className="text-lg font-semibold">{currentMissing.length}</span>
            </p>
            <p className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm">
              <span className="block text-xs text-[var(--muted-foreground)]">
                Prior weeks still open
              </span>
              <span className="text-lg font-semibold">{overdue.length}</span>
            </p>
            <form
              action={async () => {
                "use server";
                await advanceLeagueWeek();
              }}
            >
              <SubmitButton className="w-full">
                Advance to week {settings.currentWeek + 1}
              </SubmitButton>
            </form>
          </div>
          {missingScores.length === 0 ? (
            <EmptyState
              title="Slate is current"
              description="Every scheduled game through this week has a pending or approved score."
            />
          ) : (
            <ul className="space-y-3">
              {missingScores.map((row) => (
                <li
                  key={row.scheduledId}
                  className="space-y-3 rounded-lg border border-[var(--border)] px-3 py-3 text-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">
                      W{row.week} · {row.away.abbreviation} @ {row.home.abbreviation}
                    </span>
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {row.away.name} at {row.home.name}
                      {row.week < settings.currentWeek ? " · overdue" : ""}
                      {row.isPrimetime ? " · Primetime" : ""}
                    </span>
                  </div>
                  <CommissionerFileMissingGameForm
                    seasonNumber={season.number}
                    week={row.week}
                    homeTeamId={row.home.id}
                    awayTeamId={row.away.id}
                    homeAbbr={row.home.abbreviation}
                    awayAbbr={row.away.abbreviation}
                    isPrimetime={row.isPrimetime}
                  />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-amber-500/30">
          <CardHeader>
            <CardTitle>Reset current season games</CardTitle>
            <CardDescription>
              Voids every approved game in Season {season.number}, rejects pending
              submissions, and reverses automatic XP. Memberships and prior seasons
              are untouched.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              action={async (formData) => {
                "use server";
                await resetCurrentSeasonGames(formData);
              }}
              className="space-y-3"
            >
              <div className="space-y-2">
                <Label htmlFor="reason">Reason</Label>
                <Input
                  id="reason"
                  name="reason"
                  required
                  placeholder="e.g. Bad advance / need clean slate for S{season.number}"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-reset">
                  Type <code>RESET_GAMES</code> to confirm
                </Label>
                <Input id="confirm-reset" name="confirm" required />
              </div>
              <SubmitButton variant="destructive">
                Reset Season {season.number} games
              </SubmitButton>
            </form>
          </CardContent>
        </Card>

        <Card className="border-[var(--primary)]/30">
          <CardHeader>
            <CardTitle>Advance to next season</CardTitle>
            <CardDescription>
              Archives Season {season.number} (keeps all results/XP), creates Season{" "}
              {season.number + 1}, carries team assignments forward, and sets week to 1.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              action={async (formData) => {
                "use server";
                await advanceToNextSeason(formData);
              }}
              className="space-y-3"
            >
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="carryMemberships"
                  value="true"
                  defaultChecked
                />
                Carry current team assignments into the new season
              </label>
              <div className="space-y-2">
                <Label htmlFor="confirm-advance">
                  Type <code>ADVANCE_SEASON</code> to confirm
                </Label>
                <Input id="confirm-advance" name="confirm" required />
              </div>
              <SubmitButton>Archive S{season.number} & start S{season.number + 1}</SubmitButton>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Season archive</CardTitle>
          <CardDescription>Past seasons remain queryable for career stats</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Season</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Archived</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {seasons.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    S{s.number} · {s.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant={s.status === "ACTIVE" ? "stable" : "outline"}>
                      {s.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {s.archivedAt ? format(s.archivedAt, "MMM d, yyyy") : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Void individual games</CardTitle>
          <CardDescription>
            Remove one approved result from standings and reverse its automatic XP.
            The game stays in audit history as voided.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {approvedGames.length === 0 ? (
            <EmptyState title="No approved games this season" />
          ) : (
            <ul className="space-y-4">
              {approvedGames.map((game) => (
                <li
                  key={game.id}
                  className="rounded-lg border border-[var(--border)] p-3"
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">
                        Week {game.week}: {formatMatchupScore(game)}
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        Submitted by {game.submitter.name ?? game.submitter.email}
                      </p>
                    </div>
                    <StatusBadge status={game.status} />
                  </div>
                  <form
                    action={async (formData) => {
                      "use server";
                      await voidGame(formData);
                    }}
                    className="flex flex-wrap items-end gap-2"
                  >
                    <input type="hidden" name="submissionId" value={game.id} />
                    <div className="min-w-[220px] flex-1 space-y-1">
                      <Label htmlFor={`void-${game.id}`}>Void reason</Label>
                      <Input
                        id={`void-${game.id}`}
                        name="voidReason"
                        required
                        placeholder="Why is this result being voided?"
                      />
                    </div>
                    <SubmitButton size="sm" variant="destructive">
                      Void game
                    </SubmitButton>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
