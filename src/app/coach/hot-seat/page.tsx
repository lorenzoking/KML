import Link from "next/link";
import { updateCoachProfile } from "@/actions/coach";
import { JobStatusBadge } from "@/components/coach/job-status-badge";
import { LeagueJobPulse } from "@/components/coach/league-job-pulse";
import { SubmitButton } from "@/components/forms/submit-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { isCommissioner, requireUser } from "@/lib/auth";
import { getCoachBoardRows, type CoachBoardRow } from "@/lib/coach/coach-board";
import {
  AT_RISK_JOB_STATUSES,
  JOB_STATUS_BANDS,
  JOB_STATUS_SEVERITY_ORDER,
  NEUTRAL_EXPECTATION_SCORE,
  effectiveExpectationScore,
  isExpectationUnset,
} from "@/lib/coach/job-security";
import { getActiveSeason } from "@/lib/league";

export default async function CoachHotSeatPage() {
  const user = await requireUser();
  const commissioner = await isCommissioner(user);
  const { season } = await getActiveSeason();
  const rows = await getCoachBoardRows(season.id);
  const atRiskCount = rows.filter((row) => AT_RISK_JOB_STATUSES.has(row.jobStatus)).length;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Job security</h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          Who is safe, watched, or actually on the hot seat.{" "}
          {atRiskCount === 0
            ? "Nobody is currently in danger."
            : `${atRiskCount} coach${atRiskCount === 1 ? "" : "es"} need attention.`}{" "}
          Unset ownership expectation counts as {NEUTRAL_EXPECTATION_SCORE}, not zero.
        </p>
      </div>

      <LeagueJobPulse rows={rows} />

      {JOB_STATUS_SEVERITY_ORDER.map((band) => {
        const group = rows
          .filter((row) => row.jobStatus === band.status)
          .sort((a, b) => a.jobScore - b.jobScore || a.coach.localeCompare(b.coach));
        if (group.length === 0) return null;

        const detailed = AT_RISK_JOB_STATUSES.has(band.status);

        return (
          <Card key={band.status} id={band.status.toLowerCase()} className="scroll-mt-24">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {band.label}
                    <span className="text-sm font-normal text-[var(--muted-foreground)]">
                      {group.length}
                    </span>
                  </CardTitle>
                  <CardDescription>{band.description}</CardDescription>
                </div>
                <JobStatusBadge status={band.status} />
              </div>
            </CardHeader>
            <CardContent>
              {detailed ? (
                <div className="space-y-3">
                  {group.map((row) => (
                    <CoachJobCard
                      key={row.userId}
                      row={row}
                      commissioner={commissioner}
                    />
                  ))}
                </div>
              ) : (
                <StableCoachTable rows={group} commissioner={commissioner} />
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function CoachJobCard({
  row,
  commissioner,
}: {
  row: CoachBoardRow;
  commissioner: boolean;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium">
            <Link href={`/coach/profiles/${row.userId}`} className="hover:underline">
              {row.coach}
            </Link>{" "}
            <span className="text-[var(--muted-foreground)]">· {row.teamAbbr}</span>
          </p>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            {row.record} · Rep {row.coachRepScore} {row.coachRepGrade} · GM {row.gmRepScore}{" "}
            {row.gmRepGrade} · Job score {Math.round(row.jobScore)}
          </p>
        </div>
        <JobStatusBadge status={row.jobStatus} />
      </div>
      <p className="mt-2 text-sm">{row.jobRecoveryNote}</p>
      <p className="mt-1 text-xs text-[var(--muted-foreground)]">
        Ownership {expectationLabel(row.expectationScore)} · Strikes T{row.tankingStrikes}/G
        {row.gmStrikes}
      </p>
      {commissioner ? <CommissionerOverride row={row} /> : null}
    </div>
  );
}

function StableCoachTable({
  rows,
  commissioner,
}: {
  rows: CoachBoardRow[];
  commissioner: boolean;
}) {
  return (
    <>
      <div className="space-y-2 md:hidden">
        {rows.map((row) => (
          <div key={row.userId} className="rounded-xl border border-[var(--border)] p-3">
            <div className="flex items-center justify-between gap-2">
              <Link href={`/coach/profiles/${row.userId}`} className="font-medium hover:underline">
                {row.coach}
              </Link>
              <span className="text-xs text-[var(--muted-foreground)]">{row.teamAbbr}</span>
            </div>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              {row.record} · Rep {row.coachRepScore} {row.coachRepGrade} · Job score{" "}
              {Math.round(row.jobScore)}
            </p>
            {commissioner ? <CommissionerOverride row={row} /> : null}
          </div>
        ))}
      </div>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Coach</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Record</TableHead>
              <TableHead>Rep</TableHead>
              <TableHead>Job score</TableHead>
              {commissioner ? <TableHead>Override</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.userId}>
                <TableCell>
                  <Link href={`/coach/profiles/${row.userId}`} className="font-medium hover:underline">
                    {row.coach}
                  </Link>
                </TableCell>
                <TableCell>{row.teamAbbr}</TableCell>
                <TableCell className="tabular-nums">{row.record}</TableCell>
                <TableCell className="tabular-nums">
                  {row.coachRepScore} {row.coachRepGrade}
                </TableCell>
                <TableCell className="tabular-nums">{Math.round(row.jobScore)}</TableCell>
                {commissioner ? (
                  <TableCell>
                    <CommissionerOverride row={row} compact />
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

function expectationLabel(score: number) {
  if (isExpectationUnset(score)) {
    return `unset (defaults to ${NEUTRAL_EXPECTATION_SCORE})`;
  }
  return String(effectiveExpectationScore(score));
}

function CommissionerOverride({
  row,
  compact = false,
}: {
  row: CoachBoardRow;
  compact?: boolean;
}) {
  return (
    <details className={compact ? "" : "mt-3"}>
      <summary className="cursor-pointer text-xs font-medium text-[var(--muted-foreground)]">
        Commissioner override
      </summary>
      <form
        action={async (formData) => {
          "use server";
          await updateCoachProfile(formData);
        }}
        className="mt-3 grid gap-2 md:grid-cols-5"
      >
        <input type="hidden" name="userId" value={row.userId} />
        <input type="hidden" name="contractYearsLeft" value={row.contractYearsLeft} />
        <input type="hidden" name="expectationScore" value={row.expectationScore} />
        <div>
          <Label htmlFor={`t-${row.userId}`}>Tanking strikes</Label>
          <Input
            id={`t-${row.userId}`}
            name="tankingStrikes"
            type="number"
            defaultValue={row.tankingStrikes}
          />
        </div>
        <div>
          <Label htmlFor={`g-${row.userId}`}>GM strikes</Label>
          <Input
            id={`g-${row.userId}`}
            name="gmStrikes"
            type="number"
            defaultValue={row.gmStrikes}
          />
        </div>
        <div>
          <Label htmlFor={`o-${row.userId}`}>Override</Label>
          <Select id={`o-${row.userId}`} name="hotSeatStatusOverride" defaultValue="">
            <option value="">Auto</option>
            {JOB_STATUS_BANDS.map((band) => (
              <option key={band.status} value={band.status}>
                {band.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="md:col-span-2">
          <Label htmlFor={`n-${row.userId}`}>Note</Label>
          <Input id={`n-${row.userId}`} name="hotSeatNote" placeholder="Review note" />
        </div>
        <div className="md:col-span-5">
          <SubmitButton size="sm">Update status</SubmitButton>
        </div>
      </form>
    </details>
  );
}
