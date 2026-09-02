import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { TeamMark } from "@/components/games/scoreboard";
import type { TeamScheduleRow } from "@/lib/schedule";
import { cn } from "@/lib/utils";

export function TeamSchedule({ rows }: { rows: TeamScheduleRow[] }) {
  return (
    <ol className="stagger space-y-2">
      {rows.map((row) => {
        if (row.bye) {
          return (
            <li
              key={row.week}
              className="flex items-center gap-3 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3"
            >
              <span className="w-10 shrink-0 font-[family-name:var(--font-display)] text-sm uppercase tracking-wide text-[var(--muted-foreground)]">
                W{row.week}
              </span>
              <span className="flex-1 text-sm font-medium">Bye week</span>
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
          <div className="flex items-center gap-3 px-4 py-3">
            <span className="w-10 shrink-0 font-[family-name:var(--font-display)] text-sm uppercase tracking-wide text-[var(--muted-foreground)]">
              W{row.week}
            </span>
            <TeamMark
              abbr={row.opponent.abbreviation}
              color={row.opponent.primaryColor}
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-[family-name:var(--font-display)] text-lg uppercase tracking-wide">
                {row.isHome ? "vs" : "@"} {row.opponent.abbreviation}
              </p>
              <p className="truncate text-xs text-[var(--muted-foreground)]">
                {row.opponent.name}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              {row.isPrimetime ? (
                <Badge variant="elite" className="text-[10px]">
                  PT
                </Badge>
              ) : null}
              {result ? (
                <p
                  className={cn(
                    "font-[family-name:var(--font-display)] text-xl tabular-nums",
                    result === "W" && "text-[var(--primary)]",
                    result === "L" && "text-rose-300",
                    result === "T" && "text-[var(--muted-foreground)]"
                  )}
                >
                  {row.isForceWin ? "FW " : ""}
                  {result} {row.myScore}–{row.oppScore}
                </p>
              ) : row.isForceWin ? (
                <Badge variant="pending">Force win</Badge>
              ) : row.status === "pending" ? (
                <Badge variant="pending">Pending</Badge>
              ) : (
                <Badge variant="outline">Open</Badge>
              )}
            </div>
          </div>
        );

        if (row.submissionId) {
          return (
            <li key={row.week}>
              <Link
                href={`/games/${row.submissionId}`}
                className="surface-hover block overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)]"
              >
                {inner}
              </Link>
            </li>
          );
        }

        return (
          <li
            key={row.week}
            className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)]"
          >
            {inner}
          </li>
        );
      })}
    </ol>
  );
}
