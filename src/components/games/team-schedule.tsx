import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { TeamScheduleRow } from "@/lib/schedule";

export function TeamSchedule({ rows }: { rows: TeamScheduleRow[] }) {
  return (
    <ol className="divide-y divide-[var(--border)] overflow-hidden rounded-xl border border-[var(--border)]">
      {rows.map((row) => {
        if (row.bye) {
          return (
            <li
              key={row.week}
              className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
            >
              <span className="w-14 shrink-0 text-[var(--muted-foreground)]">
                W{row.week}
              </span>
              <span className="flex-1 font-medium">Bye</span>
              <Badge variant="outline">Bye</Badge>
            </li>
          );
        }

        const result =
          row.myScore != null && row.oppScore != null
            ? row.myScore > row.oppScore
              ? "W"
              : row.myScore < row.oppScore
                ? "L"
                : "T"
            : null;
        const inner = (
          <div className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
            <span className="w-14 shrink-0 text-[var(--muted-foreground)]">
              W{row.week}
            </span>
            <span className="min-w-0 flex-1 font-medium">
              {row.isHome ? "vs" : "@"} {row.opponent.abbreviation}
              <span className="ml-2 font-normal text-[var(--muted-foreground)]">
                {row.opponent.name}
              </span>
            </span>
            <span className="flex shrink-0 flex-wrap items-center gap-2">
              {row.isPrimetime ? (
                <Badge variant="elite">PT</Badge>
              ) : null}
              {result ? (
                <Badge
                  variant={
                    result === "W"
                      ? "approved"
                      : result === "L"
                        ? "rejected"
                        : "outline"
                  }
                >
                  {result} {row.myScore}–{row.oppScore}
                </Badge>
              ) : row.status === "pending" ? (
                <Badge variant="pending">Pending</Badge>
              ) : (
                <Badge variant="outline">Open</Badge>
              )}
            </span>
          </div>
        );

        if (row.submissionId) {
          return (
            <li key={row.week}>
              <Link
                href={`/games/${row.submissionId}`}
                className="block transition-colors hover:bg-[var(--muted)]"
              >
                {inner}
              </Link>
            </li>
          );
        }

        return (
          <li key={row.week} className={row.status === "missing" ? "opacity-90" : ""}>
            {inner}
          </li>
        );
      })}
    </ol>
  );
}

