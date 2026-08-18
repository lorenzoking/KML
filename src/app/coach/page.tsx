import Link from "next/link";
import { JobStatusBadge } from "@/components/coach/job-status-badge";
import { LeagueJobPulse } from "@/components/coach/league-job-pulse";
import { ReputationStandings } from "@/components/coach/reputation-standings";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCoachBoardRows } from "@/lib/coach/coach-board";
import { AT_RISK_JOB_STATUSES, JOB_STATUS_BANDS } from "@/lib/coach/job-security";
import { getActiveSeason } from "@/lib/league";

type SearchParams = Promise<{
  q?: string;
  status?: string;
  conference?: string;
}>;

export default async function CoachOverviewPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim().toLowerCase();
  const status = (params.status ?? "").trim().toUpperCase();
  const conference = (params.conference ?? "").trim().toUpperCase();

  const { season, settings } = await getActiveSeason();
  const rows = await getCoachBoardRows(season.id);

  const filtered = rows.filter((row) => {
    const qMatch =
      !q ||
      row.coach.toLowerCase().includes(q) ||
      (row.teamAbbr ?? "").toLowerCase().includes(q) ||
      (row.coachIdentity ?? "").toLowerCase().includes(q);
    const statusMatch = !status || row.jobStatus === status;
    const conferenceMatch = !conference || row.conference === conference;
    return qMatch && statusMatch && conferenceMatch;
  });

  const atRisk = rows.filter((row) => AT_RISK_JOB_STATUSES.has(row.jobStatus));
  const hotSeatCount = rows.filter(
    (row) => row.jobStatus === "HOT_SEAT" || row.jobStatus === "FIRING_ELIGIBLE"
  ).length;
  const board = [...filtered].sort((a, b) => {
    if (b.coachRepScore !== a.coachRepScore) return b.coachRepScore - a.coachRepScore;
    return a.coach.localeCompare(b.coach);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">
          Season {settings.currentSeason} · Week {settings.currentWeek}
        </p>
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">League pulse</h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          {rows.length} coaches · {hotSeatCount} on the hot seat · {atRisk.length} watched or worse
        </p>
      </div>

      <LeagueJobPulse rows={rows} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle>Reputation standings</CardTitle>
              <CardDescription>Live coach ranking for the whole league.</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/coach/reputation">Full list</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <ReputationStandings rows={rows} limit={8} compact />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle>Needs attention</CardTitle>
              <CardDescription>
                Watch, Pressured, Hot Seat, and firing-eligible coaches.
              </CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/coach/hot-seat">Job board</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {atRisk.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">
                Nobody is on watch or worse. The league is stable.
              </p>
            ) : (
              <div className="space-y-2">
                {atRisk
                  .sort((a, b) => a.jobScore - b.jobScore)
                  .map((row) => (
                    <Link
                      key={row.userId}
                      href={`/coach/profiles/${row.userId}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {row.coach}{" "}
                          <span className="text-[var(--muted-foreground)]">
                            {row.teamAbbr}
                          </span>
                        </p>
                        <p className="truncate text-xs text-[var(--muted-foreground)]">
                          {row.record} · Rep {row.coachRepScore} {row.coachRepGrade}
                        </p>
                      </div>
                      <JobStatusBadge status={row.jobStatus} />
                    </Link>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coach board</CardTitle>
          <CardDescription>
            Every active coach, ranked by reputation. Filter to scan the league faster.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="grid gap-2 sm:grid-cols-4">
            <Input
              name="q"
              placeholder="Search coach, team, identity"
              defaultValue={params.q ?? ""}
            />
            <Select name="status" defaultValue={status || ""}>
              <option value="">All job statuses</option>
              {JOB_STATUS_BANDS.map((band) => (
                <option key={band.status} value={band.status}>
                  {band.label}
                </option>
              ))}
            </Select>
            <Select name="conference" defaultValue={conference || ""}>
              <option value="">All conferences</option>
              <option value="AFC">AFC</option>
              <option value="NFC">NFC</option>
            </Select>
            <Button type="submit" variant="outline">
              Filter
            </Button>
          </form>

          {board.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)]">No coaches match those filters.</p>
          ) : (
            <>
              <div className="space-y-2 md:hidden">
                {board.map((row, index) => (
                  <Link
                    key={row.userId}
                    href={`/coach/profiles/${row.userId}`}
                    className="block rounded-xl border border-[var(--border)] p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          <span className="mr-1.5 tabular-nums text-[var(--muted-foreground)]">
                            {index + 1}.
                          </span>
                          {row.coach}
                        </p>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          {row.teamAbbr} · {row.record} · XP {row.xp}
                        </p>
                      </div>
                      <JobStatusBadge status={row.jobStatus} />
                    </div>
                    <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                      Rep {row.coachRepScore} {row.coachRepGrade} · GM {row.gmRepScore}{" "}
                      {row.gmRepGrade}
                    </p>
                  </Link>
                ))}
              </div>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Coach</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead>Record</TableHead>
                      <TableHead>Rep</TableHead>
                      <TableHead>GM Rep</TableHead>
                      <TableHead>XP</TableHead>
                      <TableHead>Job security</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {board.map((row, index) => (
                      <TableRow key={row.userId}>
                        <TableCell className="tabular-nums text-[var(--muted-foreground)]">
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/coach/profiles/${row.userId}`}
                            className="font-medium hover:underline"
                          >
                            {row.coach}
                          </Link>
                        </TableCell>
                        <TableCell>{row.teamAbbr}</TableCell>
                        <TableCell className="tabular-nums">{row.record}</TableCell>
                        <TableCell className="tabular-nums">
                          {row.coachRepScore} {row.coachRepGrade}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {row.gmRepScore} {row.gmRepGrade}
                        </TableCell>
                        <TableCell className="tabular-nums">{row.xp}</TableCell>
                        <TableCell>
                          <JobStatusBadge status={row.jobStatus} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
