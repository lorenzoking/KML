import Link from "next/link";
import { JobStatusBadge } from "@/components/coach/job-status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getReputationGradeLabel } from "@/lib/coach/grades";
import type { CoachBoardRow } from "@/lib/coach/coach-board";
import { cn } from "@/lib/utils";

export function rankByCoachReputation(rows: CoachBoardRow[]) {
  return [...rows].sort((a, b) => {
    if (b.coachRepScore !== a.coachRepScore) return b.coachRepScore - a.coachRepScore;
    return a.coach.localeCompare(b.coach);
  });
}

export function ReputationStandings({
  rows,
  limit,
  showJobStatus = true,
  compact = false,
}: {
  rows: CoachBoardRow[];
  limit?: number;
  showJobStatus?: boolean;
  compact?: boolean;
}) {
  const ranked = rankByCoachReputation(rows);
  const visible = limit ? ranked.slice(0, limit) : ranked;

  if (visible.length === 0) {
    return (
      <p className="text-sm text-[var(--muted-foreground)]">No coaches to rank yet.</p>
    );
  }

  return (
    <>
      <div className={cn("space-y-2", compact ? "md:hidden" : "lg:hidden")}>
        {visible.map((row, index) => (
          <Link
            key={row.userId}
            href={`/coach/profiles/${row.userId}`}
            className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] px-3 py-2.5"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                <span className="mr-2 tabular-nums text-[var(--muted-foreground)]">
                  {index + 1}.
                </span>
                {row.coach}
              </p>
              <p className="truncate text-xs text-[var(--muted-foreground)]">
                {row.teamAbbr ?? "FA"} · {row.record}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-semibold tabular-nums">
                {row.coachRepScore}{" "}
                <span className="text-[var(--muted-foreground)]">{row.coachRepGrade}</span>
              </p>
              {showJobStatus ? (
                <div className="mt-1 flex justify-end">
                  <JobStatusBadge status={row.jobStatus} />
                </div>
              ) : null}
            </div>
          </Link>
        ))}
      </div>

      <div className={cn(compact ? "hidden md:block" : "hidden lg:block")}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Coach</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Record</TableHead>
              <TableHead>Rep</TableHead>
              <TableHead>Grade</TableHead>
              {showJobStatus ? <TableHead>Job</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((row, index) => (
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
                <TableCell>{row.teamAbbr ?? "—"}</TableCell>
                <TableCell className="tabular-nums">{row.record}</TableCell>
                <TableCell className="font-semibold tabular-nums">
                  {row.coachRepScore}
                </TableCell>
                <TableCell>
                  <span className="font-medium">{row.coachRepGrade}</span>
                  <span className="ml-1.5 text-xs text-[var(--muted-foreground)]">
                    {getReputationGradeLabel(row.coachRepGrade)}
                  </span>
                </TableCell>
                {showJobStatus ? (
                  <TableCell>
                    <JobStatusBadge status={row.jobStatus} />
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
