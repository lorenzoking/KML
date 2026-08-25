import Link from "next/link";
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
import {
  formatMillions,
  formatRatio,
  penaltyBadgeVariant,
} from "@/lib/contracts/format";
import { PENALTY_LABELS, STATUS_LABELS } from "@/lib/contracts/types";
import type { ContractPenaltyTier, ContractSigningStatus } from "@/lib/contracts/types";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export type LeagueSigningRow = {
  id: string;
  playerName: string;
  position: string;
  playerTier: string;
  asSignedLength: number;
  asSignedTotalSalary: number;
  asSignedApy: number;
  marketApy: number;
  overpayRatio: number;
  penaltyTier: ContractPenaltyTier;
  longContractFlag: boolean;
  status: ContractSigningStatus;
  createdAt: Date;
  franchise: { abbreviation: string; name: string };
  submittedBy: { name: string | null };
};

const SORTS = [
  { id: "overpay", label: "Overpay" },
  { id: "date", label: "Newest" },
  { id: "team", label: "Team" },
  { id: "penalty", label: "Penalty" },
] as const;

export type LeagueSortId = (typeof SORTS)[number]["id"];

export function ContractLeagueTable({
  rows,
  sort,
  filter,
  query,
}: {
  rows: LeagueSigningRow[];
  sort: LeagueSortId;
  filter: "all" | "flagged";
  query?: string;
}) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title={query ? "No matching signings" : "No signings logged this season"}
        description="Log an as-signed Madden contract from the calculator to start the history."
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {SORTS.map((item) => (
          <Link
            key={item.id}
            href={leagueHref({ sort: item.id, filter, q: query })}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium",
              sort === item.id
                ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]"
                : "border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
            )}
          >
            {item.label}
          </Link>
        ))}
        <Link
          href={leagueHref({
            sort,
            filter: filter === "flagged" ? "all" : "flagged",
            q: query,
          })}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium",
            filter === "flagged"
              ? "border-rose-500/60 bg-rose-500/15 text-rose-200"
              : "border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
          )}
        >
          {filter === "flagged" ? "Flagged only" : "Show flagged"}
        </Link>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Player</TableHead>
            <TableHead>Team</TableHead>
            <TableHead>As-signed</TableHead>
            <TableHead>APY vs market</TableHead>
            <TableHead>Overpay</TableHead>
            <TableHead>Penalty</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                <Link href={`/contracts/${row.id}`} className="font-medium hover:underline">
                  {row.playerName}
                </Link>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {row.position} · {row.playerTier.toLowerCase()}
                  {row.longContractFlag ? " · 7+ yrs" : ""}
                </p>
              </TableCell>
              <TableCell>
                <span className="font-medium">{row.franchise.abbreviation}</span>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {row.submittedBy.name ?? "Coach"}
                </p>
              </TableCell>
              <TableCell className="font-mono text-xs">
                {row.asSignedLength} yr / {formatMillions(row.asSignedTotalSalary)}
              </TableCell>
              <TableCell className="font-mono text-xs">
                {formatMillions(row.asSignedApy)} / {formatMillions(row.marketApy)}
              </TableCell>
              <TableCell className="font-semibold">{formatRatio(row.overpayRatio)}</TableCell>
              <TableCell>
                <Badge variant={penaltyBadgeVariant(row.penaltyTier)}>
                  {PENALTY_LABELS[row.penaltyTier]}
                </Badge>
              </TableCell>
              <TableCell>
                <p className="text-xs">{STATUS_LABELS[row.status]}</p>
                <p className="text-[11px] text-[var(--muted-foreground)]">
                  {format(row.createdAt, "MMM d")}
                </p>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function leagueHref({
  sort,
  filter,
  q,
}: {
  sort: string;
  filter: string;
  q?: string;
}) {
  const params = new URLSearchParams();
  params.set("tab", "league");
  if (sort !== "overpay") params.set("sort", sort);
  if (filter === "flagged") params.set("filter", "flagged");
  if (q) params.set("q", q);
  return `/contracts?${params.toString()}`;
}

export function RepeatOffenders({
  rows,
}: {
  rows: Array<{
    abbreviation: string;
    name: string;
    total: number;
    flagged: number;
    severe: number;
    maxRatio: number;
  }>;
}) {
  if (rows.length === 0) return null;
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
        Repeat flags this season
      </h3>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((row) => (
          <div
            key={row.abbreviation}
            className="rounded-xl border border-[var(--border)] bg-[var(--card)]/60 px-3 py-2 text-sm"
          >
            <p className="font-semibold">
              {row.abbreviation}{" "}
              <span className="font-normal text-[var(--muted-foreground)]">{row.name}</span>
            </p>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              {row.flagged} flagged / {row.total} logged
              {row.severe ? ` · ${row.severe} severe` : ""} · peak {formatRatio(row.maxRatio)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
