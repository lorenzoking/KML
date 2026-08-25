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
  type MarketComparable,
  type OfferGuidance,
  type PlayerOfferInput,
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

  return withBonus(length, total, bonusRatio, rules, notes);
}

/** Pack more total money into fewer years. Never add years to dodge the $200M cap. */
export function toPenaltyMaddenInputs(params: {
  marketApy: number;
  typicalLength: number;
  penaltyLength: number;
  moneyMultiplier: number;
  bonusRatio: number;
  rules: ContractRules;
}): MaddenInputs {
  const notes: string[] = [];
  const minLen = Math.max(1, params.rules.minContractLength);
  const length = Math.max(minLen, Math.round(params.penaltyLength));
  const marketTotal = Math.max(0, params.marketApy) * Math.max(1, params.typicalLength);
  const multiplier = Math.max(1, params.moneyMultiplier);
  let total = roundMoney(marketTotal * multiplier);
  if (total > params.rules.maxTotalSalaryMillions) {
    total = roundMoney(params.rules.maxTotalSalaryMillions);
    notes.push(
      `Kept ${length} yrs and capped Total Salary at ${formatMillions(params.rules.maxTotalSalaryMillions)} — did not add years.`
    );
  }
  notes.push(
    `Penalty shape: ${length} yrs (typical market ${params.typicalLength}) and ${formatMillions(total)} total (${formatPercent(multiplier)} of a real ${params.typicalLength}-yr market deal).`
  );
  notes.push(
    `That is less control and more money per year than market ${formatMillions(params.marketApy)} APY.`
  );
  return withBonus(length, total, params.bonusRatio, params.rules, notes);
}

function withBonus(
  length: number,
  total: number,
  bonusRatio: number,
  rules: ContractRules,
  notes: string[]
): MaddenInputs {
  const rawBonus = total * clamp(bonusRatio, 0, 1.5);
  let signingBonus = roundMoney(rawBonus);
  if (signingBonus > rules.maxSigningBonusMillions) {
    signingBonus = roundMoney(rules.maxSigningBonusMillions);
    notes.push(
      `Signing bonus capped at ${formatMillions(rules.maxSigningBonusMillions)}.`
    );
  }
  notes.push("Contract Year always set to 1 (Madden Edit Player default).");
  return {
    length,
    contractYear: 1,
    totalSalary: total,
    signingBonus,
    effectiveApy: length > 0 ? roundMoney(total / length) : 0,
    notes,
  };
}

function penaltyShape(
  tier: ContractPenaltyTier,
  typicalLength: number,
  rules: ContractRules
): { length: number; moneyMultiplier: number } {
  const minLen = Math.max(1, rules.minContractLength);
  if (tier === "MINOR") {
    return {
      length: Math.max(minLen, typicalLength - 1),
      moneyMultiplier: 1.05,
    };
  }
  if (tier === "MODERATE") {
    return {
      length: Math.max(minLen, typicalLength - 2),
      moneyMultiplier: Math.max(1.1, rules.moderateMarketMultiplier),
    };
  }
  return {
    length: minLen,
    moneyMultiplier: Math.max(1.15, rules.severeMarketMultiplier),
  };
}

export function maxGoodFaithApy(marketApy: number, rules: ContractRules): number {
  const ceiling = marketApy * rules.overpayNoneMax;
  return roundMoney(Math.max(marketApy, ceiling - 0.1));
}

export function maxGoodFaithLength(rules: ContractRules): number {
  return Math.max(
    rules.minContractLength,
    Math.min(rules.maxContractLength, rules.longContractYears - 1)
  );
}

type DealStructure = {
  marketApy: number;
  typicalLength: number;
  blendedLength: number;
  blendedApy: number;
  remainingApyUsed: number | null;
  remainingApyWasEstimated: boolean;
  leftoverValue: number;
  newMoneyYears: number;
  newMoneyValue: number;
  blended: MaddenInputs;
  market: MaddenInputs;
};

function buildDealStructure(
  player: PlayerOfferInput,
  comp: MarketComp,
  rules: ContractRules
): DealStructure {
  const marketApy = marketApyForTier(comp, player.playerTier, rules);
  const typicalLength = clamp(
    comp.typicalLengthYears,
    rules.minContractLength,
    rules.maxContractLength
  );

  let remainingApyUsed: number | null = null;
  let remainingApyWasEstimated = false;
  if (player.yearsRemaining > 0) {
    if (player.remainingDealApy != null && player.remainingDealApy > 0) {
      remainingApyUsed = player.remainingDealApy;
    } else {
      remainingApyUsed = roundMoney(
        comp.starterFloorApy * rules.rookieScaleFallbackRatio
      );
      remainingApyWasEstimated = true;
    }
  }

  let blendedLength = typicalLength;
  if (player.yearsRemaining > 0 && player.yearsRemaining >= blendedLength) {
    blendedLength = Math.min(player.yearsRemaining + 1, rules.maxContractLength);
  }
  const newMoneyYears =
    player.yearsRemaining > 0
      ? Math.max(1, blendedLength - player.yearsRemaining)
      : blendedLength;
  const leftoverYears =
    player.yearsRemaining > 0
      ? Math.max(0, blendedLength - newMoneyYears)
      : 0;
  const leftoverValue = leftoverYears * (remainingApyUsed ?? 0);
  const newMoneyValue = newMoneyYears * marketApy;
  const blendedApy =
    player.yearsRemaining > 0 && blendedLength > 0
      ? (leftoverValue + newMoneyValue) / blendedLength
      : marketApy;

  return {
    marketApy,
    typicalLength,
    blendedLength,
    blendedApy,
    remainingApyUsed,
    remainingApyWasEstimated,
    leftoverValue,
    newMoneyYears,
    newMoneyValue,
    blended: toMaddenInputs(
      blendedApy,
      blendedLength,
      comp.typicalBonusRatio,
      rules
    ),
    market: toMaddenInputs(
      marketApy,
      typicalLength,
      comp.typicalBonusRatio,
      rules
    ),
  };
}

function displayCompName(name: string | null): string | null {
  if (!name) return null;
  const trimmed = name.trim();
  if (!trimmed || /^positional market$/i.test(trimmed)) return null;
  return trimmed;
}

function buildComparables(
  player: PlayerOfferInput,
  comp: MarketComp,
  rules: ContractRules,
  typicalLength: number
): MarketComparable[] {
  const depthApy = roundMoney(comp.starterFloorApy * rules.depthMarketRatio);
  return [
    {
      tier: "ELITE",
      bandLabel: TIER_LABELS.ELITE,
      playerName: displayCompName(comp.marketSetterName),
      apy: comp.topOfMarketApy,
      typicalLengthYears: typicalLength,
      selected: player.playerTier === "ELITE",
      role: "Top APY at this position",
    },
    {
      tier: "STARTER",
      bandLabel: TIER_LABELS.STARTER,
      playerName: displayCompName(comp.starterCompName),
      apy: comp.starterFloorApy,
      typicalLengthYears: typicalLength,
      selected: player.playerTier === "STARTER",
      role: "Starter-tier floor / median",
    },
    {
      tier: "DEPTH",
      bandLabel: TIER_LABELS.DEPTH,
      playerName: null,
      apy: depthApy,
      typicalLengthYears: typicalLength,
      selected: player.playerTier === "DEPTH",
      role: `${formatPercent(rules.depthMarketRatio)} of the starter floor`,
    },
  ];
}

function suggestionWhy(
  player: PlayerOfferInput,
  comparables: MarketComparable[],
  rules: ContractRules,
  extension: boolean
): string {
  const pos = POSITION_LABELS[player.position];
  const elite = comparables.find((row) => row.tier === "ELITE");
  const starter = comparables.find((row) => row.tier === "STARTER");
  const selected = comparables.find((row) => row.selected) ?? starter;
  const eliteBit = elite?.playerName
    ? `${elite.playerName} at ${formatMillions(elite.apy)}`
    : `the ${formatMillions(elite?.apy ?? 0)} market-setter`;
  const starterBit = starter?.playerName
    ? `${starter.playerName} at ${formatMillions(starter.apy)}`
    : `the starter floor at ${formatMillions(starter?.apy ?? 0)}`;
  const blend = extension
    ? " Leftover years are blended in, then new money is priced at this rate."
    : "";

  if (player.playerTier === "ELITE") {
    return `This ${pos} is priced at the top of the market — ${eliteBit}.${blend}`;
  }
  if (player.playerTier === "STARTER") {
    return `This ${pos} is priced as a starter like ${starterBit}, below ${eliteBit}.${blend}`;
  }
  return `This ${pos} is priced as depth at ${formatMillions(selected?.apy ?? 0)} (${formatPercent(rules.depthMarketRatio)} of the ${starter?.playerName ?? "starter"} band), well below ${eliteBit}.${blend}`;
}

export function calculateOfferGuidance(
  player: PlayerOfferInput,
  comp: MarketComp,
  rules: ContractRules
): OfferGuidance {
  const deal = buildDealStructure(player, comp, rules);
  const maxApy = maxGoodFaithApy(deal.marketApy, rules);
  const maxLength = maxGoodFaithLength(rules);
  const extension = player.yearsRemaining > 0;
  const realistic = extension ? deal.blended : deal.market;
  const intendedLength = extension ? deal.blendedLength : deal.typicalLength;
  const maxOffer = toMaddenInputs(
    maxApy,
    intendedLength,
    comp.typicalBonusRatio,
    rules
  );
  const ratio = deal.marketApy > 0 ? maxApy / deal.marketApy : 1;
  const comparables = buildComparables(player, comp, rules, deal.typicalLength);
  const selected = comparables.find((row) => row.selected);
  const why = suggestionWhy(player, comparables, rules, extension);
  const selectedName = selected?.playerName
    ? ` — ${selected.playerName}`
    : "";

  return {
    marketApy: roundMoney(deal.marketApy),
    maxGoodFaithApy: maxApy,
    maxGoodFaithLength: maxLength,
    maxGoodFaithRatio: roundMoney(ratio, 0.01),
    realisticLabel: extension
      ? "Most realistic: blended extension"
      : "Most realistic: market-value deal",
    suggestionWhy: why,
    realistic,
    maxOffer,
    comparables,
    sourceNote: comp.sourceNote,
    math: [
      `${player.position} ${POSITION_LABELS[player.position]} · ${TIER_LABELS[player.playerTier]}${selectedName}.`,
      why,
      extension
        ? `Leftover ${player.yearsRemaining} yr${player.yearsRemaining === 1 ? "" : "s"} at ${formatMillions(deal.remainingApyUsed ?? 0)}${deal.remainingApyWasEstimated ? " (rookie-scale estimate)" : ""} blended with ${deal.newMoneyYears} new-money yr${deal.newMoneyYears === 1 ? "" : "s"} at market.`
        : `Typical ${player.position} length is ${deal.typicalLength} yrs.`,
      `Good-faith APY must stay under ${rules.overpayNoneMax.toFixed(2)}× market (${formatMillions(deal.marketApy * rules.overpayNoneMax)}). Max offer uses ${formatMillions(maxApy)} (${formatRatio(ratio)}).`,
      `Do not sign ${rules.longContractYears}+ years — length itself is an automatic penalty even if APY looks fine. Hard ceiling ${maxLength} yrs.`,
      `Type the suggested contract in Madden Edit Player (Contract Year, Length, Total Salary, Signing Bonus). Only walk APY up toward the max if you have to win the bidding.`,
    ],
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
  const deal = buildDealStructure(input, comp, rules);
  const {
    marketApy,
    typicalLength,
    blendedLength,
    blendedApy,
    remainingApyUsed,
    remainingApyWasEstimated,
    leftoverValue,
    newMoneyYears,
    newMoneyValue,
    blended,
    market,
  } = deal;
  const offers = calculateOfferGuidance(input, comp, rules);
  const overpayRatio = marketApy > 0 ? asSignedApy / marketApy : Infinity;
  const longContractFlag = input.asSignedLength >= rules.longContractYears;

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

  let penaltyAdjusted: MaddenInputs | null = null;
  if (penaltyTier !== "NONE" && !voidSigning) {
    const shape = penaltyShape(penaltyTier, typicalLength, rules);
    penaltyAdjusted = toPenaltyMaddenInputs({
      marketApy,
      typicalLength,
      penaltyLength: shape.length,
      moneyMultiplier: shape.moneyMultiplier,
      bonusRatio: comp.typicalBonusRatio,
      rules,
    });
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
    `Top of market ${formatMillions(comp.topOfMarketApy)}${comp.marketSetterName ? ` (${comp.marketSetterName})` : ""} · starter floor ${formatMillions(comp.starterFloorApy)}${comp.starterCompName ? ` (${comp.starterCompName})` : ""}.`,
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
    penaltyTier === "NONE"
      ? null
      : "Penalty contract is the opposite of the exploit: fewer years and more money, never a discount.",
    penaltyTier !== "NONE" && penaltyAdjusted
      ? `Use ${penaltyAdjusted.length} yrs / ${formatMillions(penaltyAdjusted.totalSalary)} tot / ${formatMillions(penaltyAdjusted.effectiveApy)} APY (market was ${typicalLength} yrs / ${formatMillions(marketApy)} APY).`
      : null,
    penaltyTier === "MINOR"
      ? "Minor: cut 1 year off typical length, pack 105% of market total into that shorter deal, lock re-sign / restructure 1 season."
      : null,
    penaltyTier === "MODERATE"
      ? "Moderate: cut 2 years, pack extra total money into the short deal, plus next-season cap hit and a restructure lock."
      : null,
    penaltyTier === "SEVERE" && voidSigning
      ? "Severe default: void signing rights."
      : null,
    penaltyTier === "SEVERE" && !voidSigning && severeResolution === "PENDING"
      ? "Severe: commissioner chooses void vs a min-length deal with more money packed in."
      : null,
    penaltyTier === "SEVERE" &&
    severeResolution === "STEEP_BELOW_MARKET" &&
    penaltyAdjusted
      ? `Keep-player penalty: ${penaltyAdjusted.length} yrs at ${formatMillions(penaltyAdjusted.effectiveApy)} APY.`
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
    penaltyAdjusted,
    recommended,
    math: {
      blended: blendedMath,
      market: marketMath,
      penalty: penaltyMath,
    },
    offers,
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
  if (
    params.penaltyTier === "MINOR" ||
    params.penaltyTier === "MODERATE" ||
    params.penaltyTier === "SEVERE"
  ) {
    return {
      key: "PENALTY",
      label: "Penalty: fewer years, more money",
      inputs: params.penaltyAdjusted,
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

export function resolveOfferGuidance(
  calc: Pick<CalculatedSigning, "offers" | "compsUsed" | "rulesUsed">,
  player: PlayerOfferInput
): OfferGuidance | null {
  if (calc.offers?.comparables?.length) return calc.offers;
  if (!calc.compsUsed || !calc.rulesUsed) return calc.offers ?? null;
  return calculateOfferGuidance(player, calc.compsUsed, calc.rulesUsed);
}
