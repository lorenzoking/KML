import { FileSearch } from "lucide-react";
import { ContractCalculatorForm } from "@/components/contracts/contract-calculator-form";
import {
  ContractLeagueTable,
  RepeatOffenders,
  type LeagueSortId,
} from "@/components/contracts/contract-league-table";
import {
  ContractsTabs,
  resolveContractsTab,
} from "@/components/contracts/contracts-tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getSessionUser, isCommissioner } from "@/lib/auth";
import { getContractDesk, safeEnsureContractDesk } from "@/lib/contracts/ensure";
import { getActiveSeason, getUserMembership } from "@/lib/league";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Madden 27 Franchise Contract Calculator",
};

const SORT_IDS: LeagueSortId[] = ["overpay", "date", "team", "penalty"];

export default async function ContractsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; sort?: string; filter?: string; q?: string }>;
}) {
  const params = await searchParams;
  const tab = resolveContractsTab(params.tab);
  const user = await getSessionUser();
  const commissionerUi = user ? await isCommissioner(user) : false;

  await safeEnsureContractDesk();

  let desk: Awaited<ReturnType<typeof getContractDesk>> | null = null;
  try {
    desk = await getContractDesk();
  } catch {
    desk = null;
  }

  const { season } = await getActiveSeason();
  const membership = user ? await getUserMembership(user.id, season.id) : null;
  const franchises = await prisma.franchise.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, abbreviation: true },
  });

  const canLog = Boolean(
    user && (commissionerUi || membership)
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
          Madden 27 · Franchise desk
        </p>
        <h1 className="mt-1 text-2xl font-semibold uppercase tracking-[0.04em] sm:text-3xl">
          Madden 27 Franchise Contract Calculator
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-[var(--muted-foreground)]">
          The calculator suggests a realistic contract to type in Madden Edit
          Player. Default is a long-term deal. If the player still has years
          left, Length is leftover + new years together — say whether you are
          adding on or replacing. Madden often forces a 7–9 year placeholder;
          edit Length down. Penalties are a small APY bump, not a packed short
          contract.
        </p>
      </div>

      <ContractsTabs
        active={tab}
        adminHref={commissionerUi ? "/admin/contracts" : null}
      />

      {!desk ? (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
          Contract tables are not on this database yet. Run the latest Prisma
          migration, then refresh.
        </p>
      ) : tab === "calculator" ? (
        <ContractCalculatorForm
          comps={desk.comps}
          rules={desk.rules}
          franchises={
            commissionerUi || !membership
              ? franchises
              : franchises.filter((f) => f.id === membership.franchiseId)
          }
          defaultFranchiseId={membership?.franchiseId ?? ""}
          canLog={canLog}
          isCommissioner={commissionerUi}
        />
      ) : (
        <LeagueTab
          seasonId={season.id}
          sort={SORT_IDS.includes(params.sort as LeagueSortId) ? (params.sort as LeagueSortId) : "overpay"}
          filter={params.filter === "flagged" ? "flagged" : "all"}
          query={params.q?.trim() ?? ""}
        />
      )}
    </div>
  );
}

async function LeagueTab({
  seasonId,
  sort,
  filter,
  query,
}: {
  seasonId: string;
  sort: LeagueSortId;
  filter: "all" | "flagged";
  query: string;
}) {
  const orderBy =
    sort === "date"
      ? { createdAt: "desc" as const }
      : sort === "team"
        ? { franchise: { abbreviation: "asc" as const } }
        : sort === "penalty"
          ? { penaltyTier: "desc" as const }
          : { overpayRatio: "desc" as const };

  const signings = await prisma.playerContractSigning.findMany({
    where: {
      seasonId,
      ...(filter === "flagged" ? { penaltyTier: { not: "NONE" } } : {}),
      ...(query
        ? {
            OR: [
              { playerName: { contains: query, mode: "insensitive" } },
              { franchise: { abbreviation: { contains: query, mode: "insensitive" } } },
              { franchise: { name: { contains: query, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: {
      franchise: { select: { abbreviation: true, name: true } },
      submittedBy: { select: { name: true } },
    },
    orderBy,
  });

  const byTeam = new Map<
    string,
    {
      abbreviation: string;
      name: string;
      total: number;
      flagged: number;
      severe: number;
      maxRatio: number;
    }
  >();
  for (const row of signings) {
    const current = byTeam.get(row.franchise.abbreviation) ?? {
      abbreviation: row.franchise.abbreviation,
      name: row.franchise.name,
      total: 0,
      flagged: 0,
      severe: 0,
      maxRatio: 0,
    };
    current.total += 1;
    if (row.penaltyTier !== "NONE") current.flagged += 1;
    if (row.penaltyTier === "SEVERE") current.severe += 1;
    current.maxRatio = Math.max(current.maxRatio, row.overpayRatio);
    byTeam.set(row.franchise.abbreviation, current);
  }
  const offenders = [...byTeam.values()]
    .filter((row) => row.flagged > 0)
    .sort((a, b) => b.flagged - a.flagged || b.maxRatio - a.maxRatio)
    .slice(0, 9);

  return (
    <div className="space-y-5">
      <form className="flex flex-wrap gap-2" action="/contracts">
        <input type="hidden" name="tab" value="league" />
        <input type="hidden" name="sort" value={sort} />
        {filter === "flagged" ? <input type="hidden" name="filter" value="flagged" /> : null}
        <div className="relative min-w-[12rem] flex-1">
          <FileSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <Input
            name="q"
            defaultValue={query}
            placeholder="Player or team"
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>
      <RepeatOffenders rows={offenders} />
      <ContractLeagueTable rows={signings} sort={sort} filter={filter} query={query} />
    </div>
  );
}
