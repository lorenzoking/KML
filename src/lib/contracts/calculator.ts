import { formatMillions, formatPercent, formatRatio, roundMoney } from "./format";
import {
  PENALTY_LABELS,
  POSITION_LABELS,
  TIER_LABELS,
  type CalculatedSigning,
  type CalculatorInput,
  type ContractPenaltyTier,
  type ContractRules,
  type MaddenInputs,
  type MarketComp,
  type RecommendedKey,
  type SeverePenaltyResolution,
} from "./types";

const TIER_RANK: Record<ContractPenaltyTier, number> = {
  NONE: 0,
  MINOR: 1,
  MODERATE: 2,
  SEVERE: 3,
};

export function marketApyForTier(
  comp: MarketComp,
  tier: CalculatorInput["playerTier"],
  rules: ContractRules
): number {
  if (tier === "ELITE") return comp.topOfMarketApy;
  if (tier === "STARTER") return comp.starterFloorApy;
  return roundMoney(comp.starterFloorApy * rules.depthMarketRatio);
}

export function toMaddenInputs(
  targetApy: number,
  desiredLength: number,
  bonusRatio: number,
  rules: ContractRules
): MaddenInputs {
  const notes: string[] = [];
  const minLen = Math.max(1, rules.minContractLength);
  const maxLen = Math.max(minLen, rules.maxContractLength);
  let length = clamp(Math.round(desiredLength), minLen, maxLen);
  const safeApy = Math.max(0, targetApy);
  let total = roundMoney(safeApy * length);

  if (total > rules.maxTotalSalaryMillions) {
    const maxLenAtApy =
      safeApy > 0
        ? Math.floor(rules.maxTotalSalaryMillions / safeApy)
        : maxLen;
    if (maxLenAtApy >= minLen) {
      length = Math.min(length, maxLenAtApy);
      total = roundMoney(Math.min(safeApy * length, rules.maxTotalSalaryMillions));
      notes.push(
        `Shortened to ${length} yrs so APY stays near ${formatMillions(safeApy)} under the ${formatMillions(rules.maxTotalSalaryMillions)} Total Salary cap.`
      );
    } else {
      length = minLen;
      total = roundMoney(rules.maxTotalSalaryMillions);
      notes.push(
        `APY compressed: ${formatMillions(safeApy)} × ${length} would exceed the ${formatMillions(rules.maxTotalSalaryMillions)} Total Salary cap.`
      );
    }
  }

  const rawBonus = total * clamp(bonusRatio, 0, 1.5);
  let signingBonus = roundMoney(rawBonus);
  if (signingBonus > rules.maxSigningBonusMillions) {
    signingBonus = roundMoney(rules.maxSigningBonusMillions);
    notes.push(
      `Signing bonus capped at ${formatMillions(rules.maxSigningBonusMillions)}.`
    );
  }

  const effectiveApy = length > 0 ? roundMoney(total / length) : 0;
  notes.push("Contract Year always set to 1 (Madden Edit Player default).");

  return {
    length,
    contractYear: 1,
    totalSalary: total,
    signingBonus,
    effectiveApy,
    notes,
  };
}

export function calculateSigning(
  input: CalculatorInput,
  comp: MarketComp,
  rules: ContractRules,
  severeResolution: SeverePenaltyResolution = rules.defaultSevereResolution
): CalculatedSigning {
  const asSignedApy =
    input.asSignedLength > 0
      ? input.asSignedTotalSalary / input.asSignedLength
      : 0;
  const marketApy = marketApyForTier(comp, input.playerTier, rules);
  const overpayRatio = marketApy > 0 ? asSignedApy / marketApy : Infinity;
  const longContractFlag = input.asSignedLength >= rules.longContractYears;

  let remainingApyUsed: number | null = null;
  let remainingApyWasEstimated = false;
  if (input.yearsRemaining > 0) {
    if (input.remainingDealApy != null && input.remainingDealApy > 0) {
      remainingApyUsed = input.remainingDealApy;
    } else {
      remainingApyUsed = roundMoney(
        comp.starterFloorApy * rules.rookieScaleFallbackRatio
      );
      remainingApyWasEstimated = true;
    }
  }

  const typicalLength = clamp(
    comp.typicalLengthYears,
    rules.minContractLength,
    rules.maxContractLength
  );

  let blendedLength = typicalLength;
  if (input.yearsRemaining > 0 && input.yearsRemaining >= blendedLength) {
    blendedLength = Math.min(
      input.yearsRemaining + 1,
      rules.maxContractLength
    );
  }
  const newMoneyYears =
    input.yearsRemaining > 0
      ? Math.max(1, blendedLength - input.yearsRemaining)
      : blendedLength;
  const leftoverYears =
    input.yearsRemaining > 0
      ? Math.max(0, blendedLength - newMoneyYears)
      : 0;
  const leftoverValue = leftoverYears * (remainingApyUsed ?? 0);
  const newMoneyValue = newMoneyYears * marketApy;
  const blendedApy =
    input.yearsRemaining > 0 && blendedLength > 0
      ? (leftoverValue + newMoneyValue) / blendedLength
      : marketApy;

  const blended = toMaddenInputs(
    blendedApy,
    blendedLength,
    comp.typicalBonusRatio,
    rules
  );
  const market = toMaddenInputs(
    marketApy,
    typicalLength,
    comp.typicalBonusRatio,
    rules
  );

  const { penaltyTier, penaltyReasons } = resolvePenaltyTier({
    overpayRatio,
    longContractFlag,
    rules,
    asSignedApy,
    marketApy,
    asSignedLength: input.asSignedLength,
  });

  const overageTotal = Math.max(0, asSignedApy - marketApy) * input.asSignedLength;
  const capPenaltyMillions =
    penaltyTier === "MODERATE" || penaltyTier === "SEVERE"
      ? roundMoney(overageTotal * (rules.capPenaltyPercentOfOverage / 100))
      : null;

  const voidSigning =
    penaltyTier === "SEVERE" && severeResolution === "VOID_SIGNING";

  const moderateMultiplier = Math.max(1, rules.moderateMarketMultiplier);
  const severeMultiplier = Math.max(1, rules.severeMarketMultiplier);

  let penaltyAdjusted: MaddenInputs | null = null;
  if (penaltyTier === "MODERATE" && moderateMultiplier > 1) {
    penaltyAdjusted = toMaddenInputs(
      marketApy * moderateMultiplier,
      typicalLength,
      comp.typicalBonusRatio,
      rules
    );
  } else if (penaltyTier === "SEVERE" && !voidSigning && severeMultiplier > 1) {
    penaltyAdjusted = toMaddenInputs(
      marketApy * severeMultiplier,
      typicalLength,
      comp.typicalBonusRatio,
      rules
    );
  } else if (penaltyTier === "SEVERE" && !voidSigning) {
    penaltyAdjusted = market;
  }

  const recommended = pickRecommended({
    penaltyTier,
    voidSigning,
    yearsRemaining: input.yearsRemaining,
    blended,
    market,
    penaltyAdjusted,
  });

  const pos = POSITION_LABELS[input.position];
  const tier = TIER_LABELS[input.playerTier];
  const setter = comp.marketSetterName
    ? ` (market-setter: ${comp.marketSetterName})`
    : "";

  const blendedMath = [
    `Position ${input.position} ${pos} · ${tier}.`,
    `Market-value APY for this tier: ${formatMillions(marketApy)}${setter}.`,
    input.yearsRemaining > 0
      ? remainingApyWasEstimated
        ? `Remaining years ${input.yearsRemaining} × estimated rookie-scale APY ${formatMillions(remainingApyUsed ?? 0)} (${formatPercent(rules.rookieScaleFallbackRatio)} of starter floor ${formatMillions(comp.starterFloorApy)}) = ${formatMillions(leftoverValue)} leftover value.`
        : `Remaining years ${input.yearsRemaining} × current APY ${formatMillions(remainingApyUsed ?? 0)} = ${formatMillions(leftoverValue)} leftover value.`
      : "No remaining years — blended extension equals new-money market rate.",
    input.yearsRemaining > 0
      ? `New-money years ${newMoneyYears} × market APY ${formatMillions(marketApy)} = ${formatMillions(newMoneyValue)}.`
      : `Typical ${input.position} length ${typicalLength} yrs (capped at ${rules.maxContractLength}).`,
    `Blended AAV = ${formatMillions(blendedApy)} over ${blendedLength} yrs.`,
    `Madden Total Salary = ${formatMillions(blended.effectiveApy)} × ${blended.length} = ${formatMillions(blended.totalSalary)} (cap ${formatMillions(rules.maxTotalSalaryMillions)}).`,
    `Signing Bonus = Total × typical ${input.position} bonus ratio ${formatPercent(comp.typicalBonusRatio)}${comp.guaranteePercent != null ? ` · real-world guarantee ~${formatPercent(comp.guaranteePercent)}` : ""} = ${formatMillions(blended.signingBonus)}.`,
    ...blended.notes,
  ];

  const marketMath = [
    `Market-Value Reset prices the player now at ${formatMillions(marketApy)} APY (${tier}).`,
    `Top of market ${formatMillions(comp.topOfMarketApy)} · starter floor ${formatMillions(comp.starterFloorApy)}.`,
    `Typical length ${typicalLength} yrs → Madden Length ${market.length}.`,
    `Total Salary ${formatMillions(market.totalSalary)} · Signing Bonus ${formatMillions(market.signingBonus)} (${formatPercent(comp.typicalBonusRatio)} typical bonus).`,
    ...market.notes,
  ];

  const penaltyMath = [
    `As-signed APY = ${formatMillions(input.asSignedTotalSalary)} ÷ ${input.asSignedLength} yrs = ${formatMillions(asSignedApy)}.`,
    `Market-value APY = ${formatMillions(marketApy)}.`,
    `Overpay ratio = ${formatMillions(asSignedApy)} ÷ ${formatMillions(marketApy)} = ${formatRatio(overpayRatio)}.`,
    `Tiers: under ${rules.overpayNoneMax.toFixed(2)}x none · ${rules.overpayNoneMax.toFixed(2)}–${rules.overpayMinorMax.toFixed(2)}x minor · ${rules.overpayMinorMax.toFixed(2)}–${rules.overpayModerateMax.toFixed(2)}x moderate · over ${rules.overpayModerateMax.toFixed(2)}x severe.`,
    ...penaltyReasons,
    capPenaltyMillions
      ? `Overage ${formatMillions(overageTotal)} × ${rules.capPenaltyPercentOfOverage}% = ${formatMillions(capPenaltyMillions)} next-season cap penalty.`
      : null,
    "Under-market APY is never used as a penalty — that would reward the signing with a star and extra cap space.",
    penaltyTier === "MODERATE" && rules.moderateMarketMultiplier < 1
      ? `Configured moderate multiplier ${formatPercent(rules.moderateMarketMultiplier)} was below market; floored to 100%.`
      : null,
    penaltyTier === "SEVERE" &&
    !voidSigning &&
    rules.severeMarketMultiplier < 1
      ? `Configured severe multiplier ${formatPercent(rules.severeMarketMultiplier)} was below market; floored to ${formatPercent(severeMultiplier)}.`
      : null,
    "Under-market APY is never used as a penalty — that would reward the signing with a star and extra cap space.",
    penaltyTier === "MINOR"
      ? "Commissioner edits to Market-Value (not cheaper) and locks re-sign / restructure on this player for 1 season."
      : null,
    penaltyTier === "MODERATE"
      ? moderateMultiplier > 1
        ? `Tampering tax: ${formatPercent(moderateMultiplier)} of market APY (premium, never a discount) plus next-season cap hit.`
        : "Tampering tax: keep Market-Value (no discount) plus next-season cap hit and a restructure lock."
      : null,
    penaltyTier === "SEVERE" && voidSigning
      ? "Severe default: void signing rights."
      : null,
    penaltyTier === "SEVERE" && !voidSigning && severeResolution === "PENDING"
      ? "Severe: commissioner chooses void vs keeping the player at an above-market premium."
      : null,
    penaltyTier === "SEVERE" &&
    severeResolution === "STEEP_BELOW_MARKET" &&
    penaltyAdjusted
      ? `Keep-player premium: ${formatPercent(severeMultiplier)} of market APY — above market, not a discount.`
      : null,
  ].filter((line): line is string => Boolean(line));

  return {
    asSignedApy: roundMoney(asSignedApy),
    marketApy: roundMoney(marketApy),
    remainingApyUsed,
    remainingApyWasEstimated,
    overpayRatio: Number.isFinite(overpayRatio)
      ? roundMoney(overpayRatio, 0.01)
      : 99,
    longContractFlag,
    penaltyTier,
    penaltyReasons,
    capPenaltyMillions,
    lockRestructures:
      penaltyTier === "MINOR" ||
      penaltyTier === "MODERATE" ||
      (penaltyTier === "SEVERE" && !voidSigning),
    voidSigning,
    blended,
    market,
    penaltyAdjusted:
      penaltyTier === "MINOR" ? null : penaltyAdjusted,
    recommended,
    math: {
      blended: blendedMath,
      market: marketMath,
      penalty: penaltyMath,
    },
    compsUsed: comp,
    rulesUsed: rules,
  };
}

function resolvePenaltyTier(params: {
  overpayRatio: number;
  longContractFlag: boolean;
  rules: ContractRules;
  asSignedApy: number;
  marketApy: number;
  asSignedLength: number;
}): { penaltyTier: ContractPenaltyTier; penaltyReasons: string[] } {
  const reasons: string[] = [];
  let tier: ContractPenaltyTier = "NONE";
  const ratio = params.overpayRatio;

  if (!Number.isFinite(ratio) || ratio >= params.rules.overpayModerateMax) {
    tier = "SEVERE";
    reasons.push(
      `Overpay ${formatRatio(ratio)} is over ${params.rules.overpayModerateMax.toFixed(2)}x — severe placeholder / abuse range.`
    );
  } else if (ratio >= params.rules.overpayMinorMax) {
    tier = "MODERATE";
    reasons.push(
      `Overpay ${formatRatio(ratio)} is ${params.rules.overpayMinorMax.toFixed(2)}–${params.rules.overpayModerateMax.toFixed(2)}x — moderate tampering tax.`
    );
  } else if (ratio >= params.rules.overpayNoneMax) {
    tier = "MINOR";
    reasons.push(
      `Overpay ${formatRatio(ratio)} is ${params.rules.overpayNoneMax.toFixed(2)}–${params.rules.overpayMinorMax.toFixed(2)}x — minor penalty.`
    );
  } else {
    reasons.push(
      `Overpay ${formatRatio(ratio)} is under ${params.rules.overpayNoneMax.toFixed(2)}x — treat as good-faith.`
    );
  }

  if (params.longContractFlag) {
    reasons.push(
      `${params.asSignedLength}-year deal is ${params.rules.longContractYears}+ years — length itself is an exploit vector.`
    );
    if (TIER_RANK[tier] < TIER_RANK.MINOR) {
      tier = "MINOR";
      reasons.push("Automatic minor penalty for suspiciously long contract.");
    }
  }

  reasons.push(`Penalty tier: ${PENALTY_LABELS[tier]}.`);
  return { penaltyTier: tier, penaltyReasons: reasons };
}

function pickRecommended(params: {
  penaltyTier: ContractPenaltyTier;
  voidSigning: boolean;
  yearsRemaining: number;
  blended: MaddenInputs;
  market: MaddenInputs;
  penaltyAdjusted: MaddenInputs | null;
}): CalculatedSigning["recommended"] {
  if (params.voidSigning) {
    return { key: "VOID", label: "Void signing", inputs: null };
  }
  if (params.penaltyTier === "MODERATE") {
    if (params.penaltyAdjusted) {
      return {
        key: "PENALTY",
        label: "Penalty-adjusted (APY premium + cap tax)",
        inputs: params.penaltyAdjusted,
      };
    }
    return {
      key: "MARKET",
      label: "Market-Value + next-season cap tax (locked)",
      inputs: params.market,
    };
  }
  if (params.penaltyTier === "SEVERE") {
    return {
      key: "PENALTY",
      label: "Penalty-adjusted (above-market premium)",
      inputs: params.penaltyAdjusted,
    };
  }
  if (params.penaltyTier === "MINOR") {
    return {
      key: "MARKET",
      label: "Market-Value (locked by minor penalty)",
      inputs: params.market,
    };
  }
  if (params.yearsRemaining > 0) {
    return {
      key: "BLENDED",
      label: "Blended / pure extension",
      inputs: params.blended,
    };
  }
  return {
    key: "MARKET" as RecommendedKey,
    label: "Market-Value reset",
    inputs: params.market,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
