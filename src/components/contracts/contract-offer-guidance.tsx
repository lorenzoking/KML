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
import { POSITION_LABELS, type MaddenInputs, type OfferGuidance } from "@/lib/contracts/types";
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
    asSigned != null &&
    (asSigned.apy > offers.maxGoodFaithApy + 1e-6 ||
      asSigned.length >= longContractYears);

  return (
    <div className="space-y-4">
      <Card className="border-[color-mix(in_srgb,var(--primary)_40%,var(--border))]">
        <CardHeader className="pb-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">
            Before you type
          </p>
          <CardTitle className="mt-1 text-xl">Realistic offer vs max</CardTitle>
          <p className="text-sm text-[var(--muted-foreground)]">
            Start with the realistic deal. Walk APY up toward the max only if you
            have to win the bidding. Past that APY, or {longContractYears}+ years,
            and the penalty fires.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-4">
            <Stat label="Market APY" value={formatMillions(offers.marketApy)} />
            <Stat
              label="Max APY (no penalty)"
              value={formatMillions(offers.maxGoodFaithApy)}
            />
            <Stat
              label="That max vs market"
              value={formatRatio(offers.maxGoodFaithRatio)}
            />
            <Stat
              label="Longest without a length flag"
              value={`${offers.maxGoodFaithLength} yrs`}
            />
          </div>
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
                ? `As-signed ${formatMillions(asSigned.apy)} APY over ${asSigned.length} yrs is over the max realistic offer (${formatMillions(offers.maxGoodFaithApy)} APY, under ${longContractYears} yrs). Penalty will fire.`
                : `As-signed ${formatMillions(asSigned.apy)} APY over ${asSigned.length} yrs stays within the max realistic offer.`}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <OfferCard
          title={offers.realisticLabel}
          subtitle="What you should actually type for this player"
          badge="Start here"
          badgeVariant="elite"
          inputs={offers.realistic}
          playerName={playerName}
          position={position}
          teamAbbr={teamAbbr}
          optionLabel={`REALISTIC · ${offers.realisticLabel}`}
          onUseNumbers={onUseNumbers}
        />
        <OfferCard
          title="Max offer (no penalty)"
          subtitle={`Highest APY that stays under ${formatRatio(offers.maxGoodFaithRatio)} market. Same length as the realistic deal.`}
          badge="Ceiling"
          badgeVariant="pending"
          inputs={offers.maxOffer}
          playerName={playerName}
          position={position}
          teamAbbr={teamAbbr}
          optionLabel="MAX REALISTIC · no penalty"
          onUseNumbers={onUseNumbers}
        />
      </div>

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

function OfferCard({
  title,
  subtitle,
  badge,
  badgeVariant,
  inputs,
  playerName,
  position,
  teamAbbr,
  optionLabel,
  onUseNumbers,
}: {
  title: string;
  subtitle: string;
  badge: string;
  badgeVariant: "elite" | "pending";
  inputs: MaddenInputs;
  playerName: string;
  position: string;
  teamAbbr?: string | null;
  optionLabel: string;
  onUseNumbers?: (inputs: MaddenInputs) => void;
}) {
  const exportText = formatMaddenExport({
    playerName,
    position,
    teamAbbr,
    optionLabel,
    inputs,
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <p className="text-sm text-[var(--muted-foreground)]">{subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={badgeVariant}>{badge}</Badge>
            <CopyButton text={exportText} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <MaddenFields inputs={inputs} />
        <p className="font-mono text-xs text-[var(--muted-foreground)]">
          {formatMaddenOneLiner(inputs)} · {formatMillions(inputs.effectiveApy)} APY
        </p>
        {onUseNumbers ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onUseNumbers(inputs)}
          >
            Fill as-signed with these numbers
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
