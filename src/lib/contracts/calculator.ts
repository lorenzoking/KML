import { formatMillions, formatPercent, formatRatio, roundMoney } from "./format";
import {
  PENALTY_LABELS,
  POSITION_LABELS,
  TIER_LABELS,
  type CalculatedSigning,
  type CalculatorInput,
  type ContractPenaltyTier,
  type ContractRules,
  type ContractTermGoal,
  type LengthPlan,
  type LeftoverMode,
  type MaddenInputs,
  type MarketComp,
  type MarketComparable,
  type OfferGuidance,
  type PlayerOfferInput,
  type RecommendedKey,
  type SeverePenaltyResolution,
} from "./types";

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

/** Slight APY bump at (almost) the suggested length. Madden often forces an unrealistic long placeholder — do not pack a short expensive deal. */
export function toPenaltyMaddenInputs(params: {
  marketApy: number;
  penaltyLength: number;
  apyMultiplier: number;
  bonusRatio: number;
  rules: ContractRules;
}): MaddenInputs {
  const multiplier = Math.max(1, params.apyMultiplier);
  const apy = Math.max(0, params.marketApy) * multiplier;
  const inputs = toMaddenInputs(
    apy,
    params.penaltyLength,
    params.bonusRatio,
    params.rules
  );
  return {
    ...inputs,
    notes: [
      ...inputs.notes,
      `Penalty is ${formatPercent(multiplier)} of market APY (${formatMillions(apy)}) over ${inputs.length} yrs — not a packed short contract.`,
    ],
  };
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
  suggestedLength: number,
  rules: ContractRules
): { length: number; apyMultiplier: number } {
  const minLen = Math.max(1, rules.minContractLength);
  const length = Math.max(minLen, suggestedLength);
  if (tier === "MINOR") {
    return { length, apyMultiplier: 1 };
  }
  if (tier === "MODERATE") {
    return {
      length,
      apyMultiplier: Math.max(1, rules.moderateMarketMultiplier),
    };
  }
  return {
    length: Math.max(minLen, suggestedLength - 1),
    apyMultiplier: Math.max(1, rules.severeMarketMultiplier),
  };
}

function yearsLabel(n: number) {
  return `${n} year${n === 1 ? "" : "s"}`;
}

function offerTerm(player: PlayerOfferInput): {
  termGoal: ContractTermGoal;
  leftoverMode: LeftoverMode;
} {
  return {
    termGoal: player.termGoal === "STANDARD" ? "STANDARD" : "LONG",
    leftoverMode: player.leftoverMode === "REPLACE" ? "REPLACE" : "ADD_ON",
  };
}

export function planLength(params: {
  leftoverYears: number;
  termGoal: ContractTermGoal;
  leftoverMode: LeftoverMode;
  typicalLength: number;
  rules: ContractRules;
}): LengthPlan {
  const leftover = Math.max(0, Math.round(params.leftoverYears));
  const { termGoal, leftoverMode, typicalLength, rules } = params;
  const targetTotal =
    termGoal === "LONG"
      ? rules.maxContractLength
      : clamp(typicalLength, rules.minContractLength, rules.maxContractLength);

  if (leftover <= 0) {
    const maddenLength = clamp(
      targetTotal,
      rules.minContractLength,
      rules.maxContractLength
    );
    return {
      leftoverYears: 0,
      newYears: maddenLength,
      maddenLength,
      leftoverMode: "NONE",
      termGoal,
      headline: `New contract. Type Length ${maddenLength}. Do not add extra years.`,
      detail:
        termGoal === "LONG"
          ? `Long-term: fill the ${rules.maxContractLength}-year Madden max.`
          : `Standard term for this position: ${maddenLength} years (typical NFL-style).`,
    };
  }

  if (leftoverMode === "REPLACE") {
    const maddenLength = clamp(
      targetTotal,
      rules.minContractLength,
      rules.maxContractLength
    );
    return {
      leftoverYears: leftover,
      newYears: maddenLength,
      maddenLength,
      leftoverMode: "REPLACE",
      termGoal,
      headline: `Replace leftover years. Type Length ${maddenLength} as a fresh deal — do not add the ${yearsLabel(leftover)} left onto it.`,
      detail: `They still have ${yearsLabel(leftover)} remaining. REPLACE means you wipe that and type a full ${maddenLength}-year contract in Edit Player.`,
    };
  }

  let newYears = Math.max(0, targetTotal - leftover);
  let maddenLength = leftover + newYears;
  if (maddenLength > rules.maxContractLength) {
    maddenLength = rules.maxContractLength;
    newYears = Math.max(0, maddenLength - leftover);
  }
  if (maddenLength < rules.minContractLength) {
    maddenLength = rules.minContractLength;
    newYears = Math.max(0, maddenLength - leftover);
  }

  const headline =
    newYears === 0
      ? `Do not add years — leftover already covers Length ${maddenLength}. Type ${maddenLength} in Edit Player.`
      : `Add ${yearsLabel(newYears)} onto the ${yearsLabel(leftover)} left → type Length ${maddenLength}.`;

  return {
    leftoverYears: leftover,
    newYears,
    maddenLength,
    leftoverMode: "ADD_ON",
    termGoal,
    headline,
    detail:
      leftover > rules.maxContractLength
        ? `Leftover already exceeds the ${rules.maxContractLength}-year Madden max. Edit Length down; do not add on.`
        : `Leftover ${leftover} + new ${newYears} = Length ${maddenLength} in Edit Player (full remaining term, not extra years on the side).`,
  };
}

export function maxGoodFaithApy(marketApy: number, rules: ContractRules): number {
  const ceiling = marketApy * rules.overpayNoneMax;
  return roundMoney(Math.max(marketApy, ceiling - 0.1));
}

export function maxGoodFaithLength(rules: ContractRules): number {
  return Math.max(rules.minContractLength, rules.maxContractLength);
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
  lengthPlan: LengthPlan;
  blended: MaddenInputs;
  market: MaddenInputs;
};

function buildDealStructure(
  player: PlayerOfferInput,
  comp: MarketComp,
  rules: ContractRules
): DealStructure {
  const { termGoal, leftoverMode } = offerTerm(player);
  const marketApy = marketApyForTier(comp, player.playerTier, rules);
  const typicalLength = clamp(
    comp.typicalLengthYears,
    rules.minContractLength,
    rules.maxContractLength
  );
  const lengthPlan = planLength({
    leftoverYears: player.yearsRemaining,
    termGoal,
    leftoverMode,
    typicalLength,
    rules,
  });

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

  const replace = lengthPlan.leftoverMode === "REPLACE";
  const newMoneyYears = lengthPlan.newYears;
  const leftoverYearsInDeal = Math.max(0, lengthPlan.maddenLength - newMoneyYears);
  const leftoverValue =
    replace || leftoverYearsInDeal === 0
      ? 0
      : leftoverYearsInDeal * (remainingApyUsed ?? 0);
  const newMoneyValue = newMoneyYears * marketApy;
  const blendedApy =
    !replace && player.yearsRemaining > 0 && lengthPlan.maddenLength > 0
      ? (leftoverValue + newMoneyValue) / lengthPlan.maddenLength
      : marketApy;

  return {
    marketApy,
    typicalLength,
    blendedLength: lengthPlan.maddenLength,
    blendedApy,
    remainingApyUsed,
    remainingApyWasEstimated,
    leftoverValue,
    newMoneyYears,
    newMoneyValue,
    lengthPlan,
    blended: toMaddenInputs(
      blendedApy,
      lengthPlan.maddenLength,
      comp.typicalBonusRatio,
      rules
    ),
    market: toMaddenInputs(
      marketApy,
      lengthPlan.maddenLength,
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
  rules: ContractRules
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

  if (player.playerTier === "ELITE") {
    return `This ${pos} is priced at the top of the market — ${eliteBit}.`;
  }
  if (player.playerTier === "STARTER") {
    return `This ${pos} is priced as a starter like ${starterBit}, below ${eliteBit}.`;
  }
  return `This ${pos} is priced as depth at ${formatMillions(selected?.apy ?? 0)} (${formatPercent(rules.depthMarketRatio)} of the ${starter?.playerName ?? "starter"} band), well below ${eliteBit}.`;
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
  const realistic = extension && deal.lengthPlan.leftoverMode !== "REPLACE"
    ? deal.blended
    : deal.market;
  const maxOffer = toMaddenInputs(
    maxApy,
    deal.lengthPlan.maddenLength,
    comp.typicalBonusRatio,
    rules
  );
  const ratio = deal.marketApy > 0 ? maxApy / deal.marketApy : 1;
  const comparables = buildComparables(player, comp, rules, deal.typicalLength);
  const selected = comparables.find((row) => row.selected);
  const why = suggestionWhy(player, comparables, rules);
  const selectedName = selected?.playerName
    ? ` — ${selected.playerName}`
    : "";
  const termLabel =
    deal.lengthPlan.termGoal === "LONG" ? "long-term" : "standard-term";

  return {
    marketApy: roundMoney(deal.marketApy),
    maxGoodFaithApy: maxApy,
    maxGoodFaithLength: maxLength,
    maxGoodFaithRatio: roundMoney(ratio, 0.01),
    realisticLabel: extension
      ? deal.lengthPlan.leftoverMode === "REPLACE"
        ? `Most realistic: ${termLabel} replacement`
        : `Most realistic: ${termLabel} add-on`
      : `Most realistic: ${termLabel} deal`,
    suggestionWhy: why,
    realistic,
    maxOffer,
    comparables,
    lengthPlan: deal.lengthPlan,
    sourceNote: comp.sourceNote,
    math: [
      `${player.position} ${POSITION_LABELS[player.position]} · ${TIER_LABELS[player.playerTier]}${selectedName}.`,
      why,
      deal.lengthPlan.detail,
      `NFL typical for this position is ${deal.typicalLength} yrs; Madden Length is ${deal.lengthPlan.maddenLength}.`,
      `Good-faith APY must stay under ${rules.overpayNoneMax.toFixed(2)}× market (${formatMillions(deal.marketApy * rules.overpayNoneMax)}). Max offer uses ${formatMillions(maxApy)} (${formatRatio(ratio)}).`,
      `Madden often forces a ${rules.longContractYears}+ year placeholder. Edit Length down to ${deal.lengthPlan.maddenLength}. Length alone is not a penalty — overpay is.`,
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
    lengthPlan,
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
    asSignedLength: input.asSignedLength,
    suggestedLength: lengthPlan.maddenLength,
  });

  const overageTotal = Math.max(0, asSignedApy - marketApy) * input.asSignedLength;
  const capPenaltyMillions =
    penaltyTier === "MODERATE" || penaltyTier === "SEVERE"
      ? roundMoney(overageTotal * (rules.capPenaltyPercentOfOverage / 100))
      : null;

  const voidSigning =
    penaltyTier === "SEVERE" && severeResolution === "VOID_SIGNING";

  let penaltyAdjusted: MaddenInputs | null = null;
  if (
    (penaltyTier === "MODERATE" || penaltyTier === "SEVERE") &&
    !voidSigning
  ) {
    const shape = penaltyShape(penaltyTier, lengthPlan.maddenLength, rules);
    penaltyAdjusted = toPenaltyMaddenInputs({
      marketApy,
      penaltyLength: shape.length,
      apyMultiplier: shape.apyMultiplier,
      bonusRatio: comp.typicalBonusRatio,
      rules,
    });
  }

  const leftoverMode = lengthPlan.leftoverMode === "REPLACE" ? "REPLACE" : "ADD_ON";
  const recommended = pickRecommended({
    penaltyTier,
    voidSigning,
    yearsRemaining: input.yearsRemaining,
    leftoverMode,
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
    lengthPlan.headline,
    lengthPlan.detail,
    input.yearsRemaining > 0
      ? remainingApyWasEstimated
        ? `Remaining years ${input.yearsRemaining} × estimated rookie-scale APY ${formatMillions(remainingApyUsed ?? 0)} (${formatPercent(rules.rookieScaleFallbackRatio)} of starter floor ${formatMillions(comp.starterFloorApy)}) = ${formatMillions(leftoverValue)} leftover value in the typed Length.`
        : `Remaining years ${input.yearsRemaining} × current APY ${formatMillions(remainingApyUsed ?? 0)} = ${formatMillions(leftoverValue)} leftover value in the typed Length.`
      : "No remaining years — do not add extra years onto a new contract.",
    lengthPlan.leftoverMode === "REPLACE"
      ? `REPLACE: leftover APY is ignored. New-money ${newMoneyYears} yrs × market ${formatMillions(marketApy)}.`
      : input.yearsRemaining > 0
        ? `ADD-ON: new-money ${newMoneyYears} yrs × market APY ${formatMillions(marketApy)} = ${formatMillions(newMoneyValue)}.`
        : `Suggested Madden Length ${lengthPlan.maddenLength} (NFL-typical ${typicalLength}).`,
    `Blended AAV = ${formatMillions(blendedApy)} over ${blendedLength} yrs.`,
    `Madden Total Salary = ${formatMillions(blended.effectiveApy)} × ${blended.length} = ${formatMillions(blended.totalSalary)} (cap ${formatMillions(rules.maxTotalSalaryMillions)}).`,
    `Signing Bonus = Total × typical ${input.position} bonus ratio ${formatPercent(comp.typicalBonusRatio)}${comp.guaranteePercent != null ? ` · real-world guarantee ~${formatPercent(comp.guaranteePercent)}` : ""} = ${formatMillions(blended.signingBonus)}.`,
    ...blended.notes,
  ];

  const marketMath = [
    `Market-Value Reset prices the player now at ${formatMillions(marketApy)} APY (${tier}).`,
    `Top of market ${formatMillions(comp.topOfMarketApy)}${comp.marketSetterName ? ` (${comp.marketSetterName})` : ""} · starter floor ${formatMillions(comp.starterFloorApy)}${comp.starterCompName ? ` (${comp.starterCompName})` : ""}.`,
    `Typical NFL length ${typicalLength} yrs → suggested Madden Length ${market.length}.`,
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
      ? longContractFlag
        ? `Madden often forces a ${rules.longContractYears}+ year placeholder. Edit Length down to ${lengthPlan.maddenLength}. Length alone is not a penalty.`
        : null
      : "Penalty is a small APY bump at (almost) the suggested length — not a packed short deal. The game bug that forces long offers is not treated as abuse.",
    penaltyTier !== "NONE" && penaltyAdjusted
      ? `Use ${penaltyAdjusted.length} yrs / ${formatMillions(penaltyAdjusted.totalSalary)} tot / ${formatMillions(penaltyAdjusted.effectiveApy)} APY (suggestion was ${lengthPlan.maddenLength} yrs / ${formatMillions(marketApy)} APY).`
      : null,
    penaltyTier === "MINOR"
      ? "Minor: use the suggestion as-is. No restructure lock. Treat it as a reminder to edit Length/APY toward market."
      : null,
    penaltyTier === "MODERATE"
      ? `Moderate: keep the suggested ${lengthPlan.maddenLength}-year length, bump APY to ${formatRatio(rules.moderateMarketMultiplier)} market, plus a next-season cap hit.`
      : null,
    penaltyTier === "SEVERE" && voidSigning
      ? "Severe default: void signing rights."
      : null,
    penaltyTier === "SEVERE" && !voidSigning && severeResolution === "PENDING"
      ? "Severe: commissioner chooses void vs one year off the suggestion at a small APY bump, plus cap hit and a restructure lock."
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
    lockRestructures: penaltyTier === "SEVERE" && !voidSigning,
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
  asSignedLength: number;
  suggestedLength: number;
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
      `${params.asSignedLength}-year Madden placeholder is ${params.rules.longContractYears}+ years. The game often forces unrealistic long offers — edit Length down to ${params.suggestedLength}. Length alone is not a penalty.`
    );
  }

  reasons.push(`Penalty tier: ${PENALTY_LABELS[tier]}.`);
  return { penaltyTier: tier, penaltyReasons: reasons };
}

function pickRecommended(params: {
  penaltyTier: ContractPenaltyTier;
  voidSigning: boolean;
  yearsRemaining: number;
  leftoverMode: LeftoverMode;
  blended: MaddenInputs;
  market: MaddenInputs;
  penaltyAdjusted: MaddenInputs | null;
}): CalculatedSigning["recommended"] {
  if (params.voidSigning) {
    return { key: "VOID", label: "Void signing", inputs: null };
  }
  if (params.penaltyTier === "MODERATE" || params.penaltyTier === "SEVERE") {
    return {
      key: "PENALTY",
      label:
        params.penaltyTier === "SEVERE"
          ? "Penalty: one year shorter, small APY bump"
          : "Penalty: same length, small APY bump",
      inputs: params.penaltyAdjusted,
    };
  }
  if (params.yearsRemaining > 0 && params.leftoverMode !== "REPLACE") {
    return {
      key: "BLENDED",
      label: "Add-on extension",
      inputs: params.blended,
    };
  }
  return {
    key: "MARKET" as RecommendedKey,
    label: "Market-value deal",
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
  if (calc.offers?.comparables?.length && calc.offers.lengthPlan) return calc.offers;
  if (!calc.compsUsed || !calc.rulesUsed) return calc.offers ?? null;
  return calculateOfferGuidance(player, calc.compsUsed, calc.rulesUsed);
}
