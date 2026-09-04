import type { ReactNode } from "react";
import { CommissionerFileMissingGameForm } from "@/components/forms/commissioner-file-missing-game-form";
import { MatchupCard } from "@/components/games/scoreboard";
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

  const ordered = [...rows].sort((a, b) => {
    const aMine = myTeamId === a.home.id || myTeamId === a.away.id;
    const bMine = myTeamId === b.home.id || myTeamId === b.away.id;
    if (aMine !== bMine) return aMine ? -1 : 1;
    const rank = { missing: 0, pending: 1, approved: 2 };
    return (
      rank[a.status] - rank[b.status] ||
      Number(b.isPrimetime) - Number(a.isPrimetime)
    );
  });

  const featured = rows
    .filter((row) => row.isPrimetime)
    .sort((a, b) => {
      const rank = { missing: 0, pending: 1, approved: 2 };
      return (
        rank[a.status] - rank[b.status] ||
        a.home.abbreviation.localeCompare(b.home.abbreviation)
      );
    });
  const rest = ordered.filter((row) => !row.isPrimetime);
  const missing = rest.filter((row) => row.status === "missing");
  const pending = rest.filter((row) => row.status === "pending");
  const approved = rest.filter((row) => row.status === "approved");

  return (
    <div className="space-y-8">
      {featured.length > 0 ? (
        <SlateGroup
          title="Games of the week"
          hint={`${featured.length} on the desk`}
        >
          {featured.map((row) => (
            <li key={row.scheduledId}>
              <MatchupCard
                row={row}
                myTeamId={myTeamId}
                footer={
                  isCommissioner &&
                  seasonNumber != null &&
                  row.status === "missing" ? (
                    <CommissionerFileMissingGameForm
                      seasonNumber={seasonNumber}
                      week={row.week}
                      homeTeamId={row.home.id}
                      awayTeamId={row.away.id}
                      homeAbbr={row.home.abbreviation}
                      awayAbbr={row.away.abbreviation}
                      isPrimetime={row.isPrimetime}
                    />
                  ) : undefined
                }
              />
            </li>
          ))}
        </SlateGroup>
      ) : null}
      {missing.length > 0 ? (
        <SlateGroup title="Upcoming" hint={`${missing.length} still open`}>
          {missing.map((row) => (
            <li key={row.scheduledId}>
              <MatchupCard
                row={row}
                myTeamId={myTeamId}
                footer={
                  isCommissioner && seasonNumber != null ? (
                    <CommissionerFileMissingGameForm
                      seasonNumber={seasonNumber}
                      week={row.week}
                      homeTeamId={row.home.id}
                      awayTeamId={row.away.id}
                      homeAbbr={row.home.abbreviation}
                      awayAbbr={row.away.abbreviation}
                      isPrimetime={row.isPrimetime}
                    />
                  ) : undefined
                }
              />
            </li>
          ))}
        </SlateGroup>
      ) : null}
      {pending.length > 0 ? (
        <SlateGroup title="In review" hint={`${pending.length} pending`}>
          {pending.map((row) => (
            <li key={row.scheduledId}>
              <MatchupCard row={row} myTeamId={myTeamId} />
            </li>
          ))}
        </SlateGroup>
      ) : null}
      {approved.length > 0 ? (
        <SlateGroup title="Final" hint={`${approved.length} in the books`}>
          {approved.map((row) => (
            <li key={row.scheduledId}>
              <MatchupCard row={row} myTeamId={myTeamId} />
            </li>
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
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-[family-name:var(--font-display)] text-sm font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
          {title}
        </h2>
        {hint ? (
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
            {hint}
          </p>
        ) : null}
      </div>
      <ul className="stagger grid gap-3 md:grid-cols-2">{children}</ul>
    </section>
  );
}
