"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyButton } from "@/components/contracts/copy-button";
import { MaddenFields, Stat } from "@/components/contracts/madden-fields";
import {
  formatMaddenExport,
  formatMaddenOneLiner,
  formatMillions,
  formatRatio,
} from "@/lib/contracts/format";
import type { MaddenInputs, MarketComparable, OfferGuidance } from "@/lib/contracts/types";
import { cn } from "@/lib/utils";

export function OfferGuidancePanel({
  offers,
  playerName,
  position,
  teamAbbr,
  asSigned,
  longContractYears,
  onUseNumbers,
}: {
  offers: OfferGuidance;
  playerName: string;
  position: string;
  teamAbbr?: string | null;
  asSigned?: { apy: number; length: number } | null;
  longContractYears: number;
  onUseNumbers?: (inputs: MaddenInputs) => void;
}) {
  const overMax =
    asSigned != null && asSigned.apy > offers.maxGoodFaithApy + 1e-6;
  const plan = offers.lengthPlan;
  const selected = offers.comparables.find((row) => row.selected);
  const exportText = formatMaddenExport({
    playerName,
    position,
    teamAbbr,
    optionLabel: "SUGGESTION · type this in Edit Player",
    inputs: offers.realistic,
    extraLines: [
      ...(plan ? [plan.headline, plan.detail] : []),
      offers.suggestionWhy,
    ],
  });
  const maxExport = formatMaddenExport({
    playerName,
    position,
    teamAbbr,
    optionLabel: "MAX REALISTIC · no penalty",
    inputs: offers.maxOffer,
  });

  return (
    <div className="space-y-4">
      <Card className="border-[color-mix(in_srgb,var(--primary)_55%,var(--border))] ring-1 ring-[color-mix(in_srgb,var(--primary)_35%,transparent)]">
        <CardHeader className="pb-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">
            Madden Edit Player suggestion
          </p>
          <CardTitle className="mt-1 text-xl sm:text-2xl">
            Type this contract in Madden
          </CardTitle>
          <p className="text-sm text-[var(--muted-foreground)]">
            Open the player → Edit Player → enter these four fields. Length is
            the full remaining term (leftover + new years together), not extra
            years on the side.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {plan ? (
            <div className="rounded-xl border border-[color-mix(in_srgb,var(--primary)_30%,var(--border))] bg-[color-mix(in_srgb,var(--primary)_8%,transparent)] px-3 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--primary)]">
                Madden Length
              </p>
              <p className="mt-1 text-sm font-semibold leading-relaxed">
                {plan.headline}
              </p>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                {plan.detail}
              </p>
              <p className="mt-2 font-mono text-sm">
                {plan.leftoverMode === "REPLACE"
                  ? `Replace leftover ${plan.leftoverYears} → type Length ${plan.maddenLength}`
                  : plan.leftoverYears > 0
                    ? `Leftover ${plan.leftoverYears} + new ${plan.newYears} = Length ${plan.maddenLength}`
                    : `Length ${plan.maddenLength} · do not add extra years`}
              </p>
            </div>
          ) : null}
          <p className="rounded-xl border border-[color-mix(in_srgb,var(--primary)_30%,var(--border))] bg-[color-mix(in_srgb,var(--primary)_8%,transparent)] px-3 py-2 text-sm leading-relaxed">
            {offers.suggestionWhy ||
              "Type the four fields below in Madden Edit Player."}
          </p>
          <MaddenFields inputs={offers.realistic} size="lg" />
          {offers.realistic.notes
            .filter((note) => !note.includes("Contract Year always"))
            .map((note) => (
              <p
                key={note}
                className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm"
              >
                {note}
              </p>
            ))}
          <p className="font-mono text-sm text-[var(--muted-foreground)]">
            {formatMaddenOneLiner(offers.realistic)} ·{" "}
            {formatMillions(offers.realistic.effectiveApy)} APY
          </p>
          <div className="flex flex-wrap gap-2">
            <CopyButton
              text={exportText}
              label="Copy for Madden Edit Player"
              variant="default"
              size="default"
            />
            {onUseNumbers ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => onUseNumbers(offers.realistic)}
              >
                Fill as-signed with this suggestion
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Compared to these NFL deals</CardTitle>
          <p className="text-sm text-[var(--muted-foreground)]">
            {selected
              ? `The calculator used the ${selected.bandLabel.toLowerCase()} band for this player.`
              : "Spotrac-style comps by position and tier."}
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          {(offers.comparables ?? []).map((row) => (
            <ComparableRow key={row.tier} row={row} />
          ))}
          {offers.sourceNote ? (
            <p className="pt-1 text-xs text-[var(--muted-foreground)]">
              Source: {offers.sourceNote}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <CardTitle className="text-base">Max you can type without a penalty</CardTitle>
              <p className="text-sm text-[var(--muted-foreground)]">
                Only walk APY up to this if you have to win the bidding. Same
                length as the suggestion. If Madden forces a{" "}
                {longContractYears}+ year placeholder, edit Length down — length
                alone is not a penalty.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="pending">Ceiling</Badge>
              <CopyButton text={maxExport} label="Copy max" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-4">
            <Stat label="Max APY" value={formatMillions(offers.maxOffer.effectiveApy)} />
            <Stat
              label="Vs market"
              value={formatRatio(
                offers.marketApy > 0
                  ? offers.maxOffer.effectiveApy / offers.marketApy
                  : offers.maxGoodFaithRatio
              )}
            />
            <Stat
              label="Suggested length"
              value={`${offers.realistic.length} yrs`}
            />
            <Stat
              label="Max total"
              value={formatMillions(offers.maxOffer.totalSalary)}
            />
          </div>
          <MaddenFields inputs={offers.maxOffer} />
          {onUseNumbers ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onUseNumbers(offers.maxOffer)}
            >
              Fill as-signed with the max
            </Button>
          ) : null}
          {asSigned ? (
            <p
              className={cn(
                "rounded-xl px-3 py-2 text-sm",
                overMax
                  ? "border border-rose-500/40 bg-rose-500/10"
                  : "border border-[color-mix(in_srgb,var(--primary)_35%,var(--border))] bg-[color-mix(in_srgb,var(--primary)_8%,transparent)]"
              )}
            >
              {overMax
                ? `As-signed ${formatMillions(asSigned.apy)} APY is over the max realistic APY (${formatMillions(offers.maxGoodFaithApy)}). Penalty will fire on the money, not the year count.`
                : `As-signed ${formatMillions(asSigned.apy)} APY over ${asSigned.length} yrs stays within the max realistic APY. If Length is ${longContractYears}+, still edit it down to ${offers.realistic.length}.`}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <details className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/50 px-4 py-3 text-sm">
        <summary className="cursor-pointer font-medium">How these numbers are built</summary>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-[var(--muted-foreground)]">
          {offers.math.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}

function ComparableRow({ row }: { row: MarketComparable }) {
  const posName = row.playerName ?? row.role;
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2.5",
        row.selected
          ? "border-[color-mix(in_srgb,var(--primary)_50%,var(--border))] bg-[color-mix(in_srgb,var(--primary)_10%,transparent)]"
          : "border-[var(--border)] bg-[var(--muted)]/20"
      )}
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold">
          {posName}
          {row.playerName ? (
            <span className="ml-2 text-xs font-medium text-[var(--muted-foreground)]">
              {row.role}
            </span>
          ) : null}
        </p>
        <p className="text-xs text-[var(--muted-foreground)]">{row.bandLabel}</p>
      </div>
      <div className="flex items-center gap-2">
        <p className="font-mono text-sm font-semibold">
          {formatMillions(row.apy)} APY
          <span className="ml-2 text-xs font-medium text-[var(--muted-foreground)]">
            · NFL-typical {row.typicalLengthYears} yr
          </span>
        </p>
        {row.selected ? <Badge variant="elite">Used for this player</Badge> : null}
      </div>
    </div>
  );
}
