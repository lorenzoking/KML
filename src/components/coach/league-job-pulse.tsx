import Link from "next/link";
import type { CoachBoardRow } from "@/lib/coach/coach-board";
import {
  JOB_STATUS_PULSE_ORDER,
  jobStatusBadgeVariant,
} from "@/lib/coach/job-security";
import { cn } from "@/lib/utils";

export function LeagueJobPulse({
  rows,
  hrefBase = "/coach/hot-seat",
}: {
  rows: CoachBoardRow[];
  hrefBase?: string;
}) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(row.jobStatus, (counts.get(row.jobStatus) ?? 0) + 1);
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {JOB_STATUS_PULSE_ORDER.map((band) => {
        const count = counts.get(band.status) ?? 0;
        const variant = jobStatusBadgeVariant(band.status);
        return (
          <Link
            key={band.status}
            href={`${hrefBase}#${band.status.toLowerCase()}`}
            className={cn(
              "rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-3 transition-colors hover:border-[color-mix(in_oklab,var(--primary)_35%,var(--border))]",
              count === 0 && "opacity-60"
            )}
          >
            <p className="text-2xl font-semibold tabular-nums tracking-tight">{count}</p>
            <p
              className={cn(
                "mt-1 text-[11px] font-semibold uppercase tracking-[0.12em]",
                variant === "elite" && "text-[var(--primary)]",
                variant === "stable" && "text-[var(--muted-foreground)]",
                variant === "pressured" && "text-amber-700 dark:text-amber-300",
                variant === "hotseat" && "text-red-700 dark:text-red-400"
              )}
            >
              {band.short}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
