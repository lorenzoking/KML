import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyButton } from "@/components/contracts/copy-button";
import {
  asSignedLine,
  formatMillions,
  formatMaddenExport,
  formatMaddenOneLiner,
  formatRatio,
  penaltyBadgeVariant,
  penaltySummary,
} from "@/lib/contracts/format";
import { PENALTY_LABELS, POSITION_LABELS, TIER_LABELS } from "@/lib/contracts/types";
import type { CalculatedSigning, CalculatorInput, MaddenInputs } from "@/lib/contracts/types";
import { cn } from "@/lib/utils";

export function ContractResultPanel({
  calc,
  input,
  teamAbbr,
}: {
  calc: CalculatedSigning;
  input: CalculatorInput;
  teamAbbr?: string | null;
}) {
  const recommendedExport = formatMaddenExport({
    playerName: input.playerName,
    position: input.position,
    teamAbbr,
    optionLabel: `FINAL · ${calc.recommended.label}`,
    inputs: calc.recommended.inputs,
    extraLines: [
      `Overpay ratio: ${formatRatio(calc.overpayRatio)}`,
      `Penalty: ${PENALTY_LABELS[calc.penaltyTier]}`,
      penaltySummary(calc),
    ],
  });

  return (
    <div className="space-y-4">
      <Card
        className={cn(
          calc.penaltyTier === "SEVERE" &&
            "border-rose-500/50 bg-[color-mix(in_srgb,#f43f5e_8%,var(--surface-raised))]",
          calc.penaltyTier === "MODERATE" &&
            "border-orange-500/40 bg-[color-mix(in_srgb,#f97316_8%,var(--surface-raised))]",
          calc.penaltyTier === "MINOR" &&
            "border-amber-500/40 bg-[color-mix(in_srgb,#f59e0b_8%,var(--surface-raised))]",
          calc.penaltyTier === "NONE" &&
            "border-[color-mix(in_srgb,var(--primary)_40%,var(--border))]"
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">
                As-signed → verdict
              </p>
              <CardTitle className="mt-1 text-xl">
                {input.playerName || "Unnamed player"}{" "}
                <span className="text-base font-medium text-[var(--muted-foreground)]">
                  {input.position} · {TIER_LABELS[input.playerTier]}
                </span>
              </CardTitle>
            </div>
            <Badge variant={penaltyBadgeVariant(calc.penaltyTier)}>
              {PENALTY_LABELS[calc.penaltyTier]}
              {calc.longContractFlag ? " · long deal" : ""}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-4">
            <Stat label="As-signed" value={asSignedLine(input)} />
            <Stat label="As-signed APY" value={formatMillions(calc.asSignedApy)} />
            <Stat label="Market APY" value={formatMillions(calc.marketApy)} />
            <Stat label="Overpay ratio" value={formatRatio(calc.overpayRatio)} />
          </div>
          <p className="text-sm leading-relaxed">{penaltySummary(calc)}</p>
          {calc.lockRestructures ? (
            <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm">
              Cap flexibility lock: no re-signings or restructures for this player for 1
              season.
            </p>
          ) : null}
          {calc.capPenaltyMillions ? (
            <p className="rounded-xl border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-sm">
              Next-season cap penalty: {formatMillions(calc.capPenaltyMillions)} (
              {calc.rulesUsed.capPenaltyPercentOfOverage}% of the overage).
            </p>
          ) : null}
          {calc.voidSigning ? (
            <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm">
              Do not enter a Madden contract. Player returns to free agency / original team.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <OptionCard
          title="Blended / pure extension"
          subtitle={
            input.yearsRemaining > 0
              ? "Weights leftover years against new-money market"
              : "No leftover years — same rate as market, typical length"
          }
          inputs={calc.blended}
          math={calc.math.blended}
          recommended={calc.recommended.key === "BLENDED"}
          exportText={formatMaddenExport({
            playerName: input.playerName,
            position: input.position,
            teamAbbr,
            optionLabel: "OPTION A · Blended / pure extension",
            inputs: calc.blended,
          })}
          locked={calc.penaltyTier !== "NONE"}
        />
        <OptionCard
          title="Market-value reset"
          subtitle={`Immediate ${TIER_LABELS[input.playerTier].toLowerCase()} rate`}
          inputs={calc.market}
          math={calc.math.market}
          recommended={calc.recommended.key === "MARKET"}
          exportText={formatMaddenExport({
            playerName: input.playerName,
            position: input.position,
            teamAbbr,
            optionLabel: "OPTION B · Market-value reset",
            inputs: calc.market,
          })}
          locked={calc.penaltyTier !== "NONE"}
        />
      </div>

      {calc.penaltyAdjusted ? (
        <OptionCard
          title={calc.recommended.label}
          subtitle="Fewer years than market, more total money packed into that short deal"
          inputs={calc.penaltyAdjusted}
          math={calc.math.penalty}
          recommended
          exportText={formatMaddenExport({
            playerName: input.playerName,
            position: input.position,
            teamAbbr,
            optionLabel: `PENALTY · ${calc.recommended.label}`,
            inputs: calc.penaltyAdjusted,
          })}
          emphasis
        />
      ) : (
        <details className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/50 px-4 py-3 text-sm">
          <summary className="cursor-pointer font-medium">Overpay math</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[var(--muted-foreground)]">
            {calc.math.penalty.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </details>
      )}

      {calc.penaltyTier === "SEVERE" && !calc.voidSigning ? (
        <Card className="border-rose-500/40">
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base">Severe alternative: void signing</CardTitle>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Commissioner toggle — player returns to FA / original team. No Madden
                  contract.
                </p>
              </div>
              <CopyButton
                text={formatMaddenExport({
                  playerName: input.playerName,
                  position: input.position,
                  teamAbbr,
                  optionLabel: "SEVERE · VOID SIGNING",
                  inputs: null,
                })}
                label="Copy void"
              />
            </div>
          </CardHeader>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">Madden Edit Player block</CardTitle>
              <p className="text-sm text-[var(--muted-foreground)]">
                {POSITION_LABELS[input.position]} · {calc.recommended.label}
              </p>
            </div>
            <CopyButton text={recommendedExport} label="Copy final" />
          </div>
        </CardHeader>
        <CardContent>
          <pre className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--muted)]/40 p-3 font-mono text-xs leading-relaxed">
            {recommendedExport}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

function OptionCard({
  title,
  subtitle,
  inputs,
  math,
  recommended,
  exportText,
  locked,
  emphasis,
}: {
  title: string;
  subtitle: string;
  inputs: MaddenInputs;
  math: string[];
  recommended?: boolean;
  exportText: string;
  locked?: boolean;
  emphasis?: boolean;
}) {
  return (
    <Card
      className={cn(
        recommended &&
          "border-[color-mix(in_srgb,var(--primary)_55%,var(--border))] ring-1 ring-[color-mix(in_srgb,var(--primary)_35%,transparent)]",
        emphasis && "lg:col-span-2",
        locked && !recommended && "opacity-70"
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <p className="text-sm text-[var(--muted-foreground)]">{subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            {recommended ? <Badge variant="elite">Use this</Badge> : null}
            {locked && !recommended ? (
              <Badge variant="outline">Locked by penalty</Badge>
            ) : null}
            <CopyButton text={exportText} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <MaddenFields inputs={inputs} />
        <p className="font-mono text-xs text-[var(--muted-foreground)]">
          {formatMaddenOneLiner(inputs)}
        </p>
        <details className="text-sm">
          <summary className="cursor-pointer text-[var(--muted-foreground)]">
            Show the math
          </summary>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[var(--muted-foreground)]">
            {math.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </details>
      </CardContent>
    </Card>
  );
}

export function MaddenFields({ inputs }: { inputs: MaddenInputs }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <Stat label="Contract Year" value="1" mono />
      <Stat label="Length" value={String(inputs.length)} mono />
      <Stat label="Total Salary" value={inputs.totalSalary.toFixed(1)} mono />
      <Stat label="Signing Bonus" value={inputs.signingBonus.toFixed(1)} mono />
    </div>
  );
}

function Stat({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/30 px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
        {label}
      </p>
      <p className={cn("mt-0.5 text-sm font-semibold", mono && "font-mono")}>{value}</p>
    </div>
  );
}
