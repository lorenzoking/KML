import {
  PENALTY_LABELS,
  POSITION_LABELS,
  type CalculatedSigning,
  type CalculatorInput,
  type ContractPenaltyTier,
  type MaddenInputs,
} from "./types";

export function roundMoney(value: number, step = 0.1): number {
  if (!Number.isFinite(value)) return 0;
  const rounded = Math.round(value / step) * step;
  const decimals = step >= 1 ? 0 : (String(step).split(".")[1]?.length ?? 1);
  return Number(rounded.toFixed(decimals));
}

export function formatMillions(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return "—";
  const rounded = Number(value.toFixed(digits));
  return `$${rounded.toFixed(digits)}M`;
}

export function formatRatio(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return `${value.toFixed(2)}x`;
}

export function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

export function penaltyBadgeVariant(
  tier: ContractPenaltyTier
): "approved" | "pending" | "pressured" | "rejected" {
  if (tier === "NONE") return "approved";
  if (tier === "MINOR") return "pending";
  if (tier === "MODERATE") return "pressured";
  return "rejected";
}

export function formatMaddenExport(params: {
  playerName: string;
  position: string;
  teamAbbr?: string | null;
  optionLabel: string;
  inputs: MaddenInputs | null;
  extraLines?: string[];
}): string {
  const pos =
    POSITION_LABELS[params.position as keyof typeof POSITION_LABELS] ??
    params.position;
  const header = [
    "MADDEN 27 — EDIT PLAYER",
    params.optionLabel,
    params.teamAbbr ? `Team: ${params.teamAbbr}` : null,
    `Player: ${params.playerName || "—"}`,
    `Position: ${params.position} (${pos})`,
    "",
  ].filter((line) => line !== null);

  if (!params.inputs) {
    return [
      ...header,
      "VOID SIGNING",
      "Do not enter a contract. Player returns to free agency / original team.",
      ...(params.extraLines ?? []),
    ].join("\n");
  }

  return [
    ...header,
    `Contract Year: ${params.inputs.contractYear}`,
    `Length: ${params.inputs.length}`,
    `Total Salary: ${params.inputs.totalSalary.toFixed(1)}`,
    `Signing Bonus: ${params.inputs.signingBonus.toFixed(1)}`,
    "",
    `Effective APY: ${params.inputs.effectiveApy.toFixed(1)}M`,
    ...(params.extraLines ?? []),
  ].join("\n");
}

export function formatMaddenOneLiner(inputs: MaddenInputs | null): string {
  if (!inputs) return "VOID — return player to FA / original team";
  return `CY ${inputs.contractYear}  ·  Length ${inputs.length}  ·  Total Salary ${inputs.totalSalary.toFixed(1)}  ·  Signing Bonus ${inputs.signingBonus.toFixed(1)}`;
}

export function penaltySummary(calc: CalculatedSigning): string {
  const label = PENALTY_LABELS[calc.penaltyTier];
  if (calc.penaltyTier === "NONE") {
    return `${label}. Good-faith signing — edit to Blended or Market-Value freely.`;
  }
  if (calc.penaltyTier === "MINOR") {
    return `${label}. Edit to Market-Value. Lock this player: no re-sign / restructure for 1 season.`;
  }
  if (calc.penaltyTier === "MODERATE") {
    const cap = calc.capPenaltyMillions
      ? ` Next-season cap hit ${formatMillions(calc.capPenaltyMillions)}.`
      : "";
    return `${label}. Tampering tax — keep the player at market or above, never cheaper.${cap}`;
  }
  if (calc.voidSigning) {
    return `${label}. Void signing rights — player returns to FA / original team.`;
  }
  return `${label}. Void the signing, or keep the player at an above-market premium — never a discount.`;
}

export function asSignedLine(input: CalculatorInput): string {
  return `${input.asSignedLength} yr / ${formatMillions(input.asSignedTotalSalary)} tot / ${formatMillions(input.asSignedSigningBonus)} bonus`;
}
