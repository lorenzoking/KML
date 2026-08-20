import type { ReactNode } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import { CommissionerFileMissingGameForm } from "@/components/forms/commissioner-file-missing-game-form";
import type { WeekSlateRow } from "@/lib/schedule";

export function WeekSlate({
  rows,
  myTeamId,
  isCommissioner = false,
  seasonNumber,
}: {
  rows: WeekSlateRow[];
  myTeamId?: string;
  isCommissioner?: boolean;
  seasonNumber?: number;
}) {
  if (rows.length === 0) return null;

  const missing = rows.filter((row) => row.status === "missing");
  const pending = rows.filter((row) => row.status === "pending");
  const approved = rows.filter((row) => row.status === "approved");

  return (
    <div className="space-y-6">
      {missing.length > 0 ? (
        <SlateGroup title="Not submitted" hint={`${missing.length} still open`}>
          {missing.map((row) => (
            <SlateRow
              key={row.scheduledId}
              row={row}
              myTeamId={myTeamId}
              isCommissioner={isCommissioner}
              seasonNumber={seasonNumber}
            />
          ))}
        </SlateGroup>
      ) : null}
      {pending.length > 0 ? (
        <SlateGroup title="Pending approval">
          {pending.map((row) => (
            <SlateRow key={row.scheduledId} row={row} myTeamId={myTeamId} />
          ))}
        </SlateGroup>
      ) : null}
      {approved.length > 0 ? (
        <SlateGroup title="Official results">
          {approved.map((row) => (
            <SlateRow key={row.scheduledId} row={row} myTeamId={myTeamId} />
          ))}
        </SlateGroup>
      ) : null}
    </div>
  );
}

function SlateGroup({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          {title}
        </p>
        {hint ? (
          <p className="text-xs text-[var(--muted-foreground)]">{hint}</p>
        ) : null}
      </div>
      <ul className="space-y-3">{children}</ul>
    </div>
  );
}

function SlateRow({
  row,
  myTeamId,
  isCommissioner = false,
  seasonNumber,
}: {
  row: WeekSlateRow;
  myTeamId?: string;
  isCommissioner?: boolean;
  seasonNumber?: number;
}) {
  const mine =
    myTeamId === row.home.id || myTeamId === row.away.id;
  const inner = (
    <div
      className={`rounded-lg border px-4 py-3 ${
        row.status === "missing"
          ? "border-dashed border-[var(--border)]"
          : "border-[var(--border)]"
      } ${mine ? "bg-[color-mix(in_srgb,var(--primary)_8%,transparent)]" : ""}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={row.status === "approved" ? "text-lg font-semibold tracking-wide" : "font-medium"}>
          {row.away.abbreviation} @ {row.home.abbreviation}
          {row.homeScore != null && row.awayScore != null
            ? ` · ${row.away.abbreviation} ${row.awayScore}–${row.homeScore} ${row.home.abbreviation}`
            : ""}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {row.isPrimetime ? <Badge variant="elite">Primetime</Badge> : null}
          {mine ? <Badge variant="outline">You</Badge> : null}
          {row.status === "approved" ? (
            <StatusBadge status="APPROVED" />
          ) : row.status === "pending" ? (
            <StatusBadge status="PENDING" />
          ) : (
            <Badge variant="outline">Not in</Badge>
          )}
        </div>
      </div>
      <p className="mt-1 text-xs text-[var(--muted-foreground)]">
        {row.away.name} at {row.home.name}
        {row.status === "missing" && !isCommissioner ? " · waiting on a score" : ""}
      </p>
      {isCommissioner && row.status === "missing" && seasonNumber != null ? (
        <div className="mt-3">
          <CommissionerFileMissingGameForm
            seasonNumber={seasonNumber}
            week={row.week}
            homeTeamId={row.home.id}
            awayTeamId={row.away.id}
            homeAbbr={row.home.abbreviation}
            awayAbbr={row.away.abbreviation}
            isPrimetime={row.isPrimetime}
          />
        </div>
      ) : null}
    </div>
  );

  if (row.submissionId) {
    return (
      <li>
        <Link
          href={`/games/${row.submissionId}`}
          className="block transition-colors hover:bg-[var(--muted)]"
        >
          {inner}
        </Link>
      </li>
    );
  }

  return <li>{inner}</li>;
}
