export const CONTRACT_POSITIONS = [
  "QB",
  "RB",
  "WR",
  "TE",
  "OL",
  "EDGE",
  "DL",
  "LB",
  "CB",
  "S",
  "K",
  "P",
] as const;

export type ContractPosition = (typeof CONTRACT_POSITIONS)[number];

export const CONTRACT_PLAYER_TIERS = ["ELITE", "STARTER", "DEPTH"] as const;
export type ContractPlayerTier = (typeof CONTRACT_PLAYER_TIERS)[number];

export const CONTRACT_PENALTY_TIERS = [
  "NONE",
  "MINOR",
  "MODERATE",
  "SEVERE",
] as const;
export type ContractPenaltyTier = (typeof CONTRACT_PENALTY_TIERS)[number];

export const CONTRACT_SIGNING_STATUSES = [
  "LOGGED",
  "APPLIED",
  "VOIDED",
] as const;
export type ContractSigningStatus = (typeof CONTRACT_SIGNING_STATUSES)[number];

export const SEVERE_RESOLUTIONS = [
  "PENDING",
  "VOID_SIGNING",
  /** Keep the player on a short, expensive deal (legacy enum name). */
  "STEEP_BELOW_MARKET",
] as const;
export type SeverePenaltyResolution = (typeof SEVERE_RESOLUTIONS)[number];

export const POSITION_LABELS: Record<ContractPosition, string> = {
  QB: "Quarterback",
  RB: "Running Back",
  WR: "Wide Receiver",
  TE: "Tight End",
  OL: "Offensive Line",
  EDGE: "Edge",
  DL: "Interior DL",
  LB: "Linebacker",
  CB: "Cornerback",
  S: "Safety",
  K: "Kicker",
  P: "Punter",
};

export const TIER_LABELS: Record<ContractPlayerTier, string> = {
  ELITE: "Elite / market-setter",
  STARTER: "Starter",
  DEPTH: "Depth / rotational",
};

export const TIER_HELP: Record<ContractPlayerTier, string> = {
  ELITE: "Priced at the current top-of-market APY for this position.",
  STARTER: "Priced at the starter-tier floor / median APY for this position.",
  DEPTH: "Priced below starter floor (rotational / committee role).",
};

export const PENALTY_LABELS: Record<ContractPenaltyTier, string> = {
  NONE: "No penalty",
  MINOR: "Minor",
  MODERATE: "Moderate",
  SEVERE: "Severe",
};

export const STATUS_LABELS: Record<ContractSigningStatus, string> = {
  LOGGED: "Logged",
  APPLIED: "Edited in-game",
  VOIDED: "Voided",
};

export type MarketComp = {
  position: ContractPosition;
  marketSetterName: string | null;
  starterCompName: string | null;
  topOfMarketApy: number;
  starterFloorApy: number;
  typicalBonusRatio: number;
  typicalLengthYears: number;
  guaranteePercent: number | null;
  sourceNote: string | null;
};

export type MarketComparable = {
  tier: ContractPlayerTier;
  bandLabel: string;
  playerName: string | null;
  apy: number;
  typicalLengthYears: number;
  selected: boolean;
  role: string;
};

export type ContractRules = {
  maxContractLength: number;
  minContractLength: number;
  maxTotalSalaryMillions: number;
  maxSigningBonusMillions: number;
  longContractYears: number;
  overpayNoneMax: number;
  overpayMinorMax: number;
  overpayModerateMax: number;
  moderateMarketMultiplier: number;
  severeMarketMultiplier: number;
  capPenaltyPercentOfOverage: number;
  rookieScaleFallbackRatio: number;
  depthMarketRatio: number;
  defaultSevereResolution: SeverePenaltyResolution;
};

export type MaddenInputs = {
  length: number;
  contractYear: 1;
  totalSalary: number;
  signingBonus: number;
  effectiveApy: number;
  notes: string[];
};

export type PlayerOfferInput = {
  playerName: string;
  position: ContractPosition;
  playerTier: ContractPlayerTier;
  yearsRemaining: number;
  remainingDealApy: number | null;
};

export type OfferGuidance = {
  marketApy: number;
  maxGoodFaithApy: number;
  maxGoodFaithLength: number;
  maxGoodFaithRatio: number;
  realisticLabel: string;
  suggestionWhy: string;
  realistic: MaddenInputs;
  maxOffer: MaddenInputs;
  comparables: MarketComparable[];
  sourceNote: string | null;
  math: string[];
};

export type CalculatorInput = PlayerOfferInput & {
  asSignedLength: number;
  asSignedTotalSalary: number;
  asSignedSigningBonus: number;
};

export type RecommendedKey = "BLENDED" | "MARKET" | "PENALTY" | "VOID";

export type CalculatedSigning = {
  asSignedApy: number;
  marketApy: number;
  remainingApyUsed: number | null;
  remainingApyWasEstimated: boolean;
  overpayRatio: number;
  longContractFlag: boolean;
  penaltyTier: ContractPenaltyTier;
  penaltyReasons: string[];
  capPenaltyMillions: number | null;
  lockRestructures: boolean;
  voidSigning: boolean;
  blended: MaddenInputs;
  market: MaddenInputs;
  penaltyAdjusted: MaddenInputs | null;
  recommended: {
    key: RecommendedKey;
    label: string;
    inputs: MaddenInputs | null;
  };
  math: {
    blended: string[];
    market: string[];
    penalty: string[];
  };
  offers?: OfferGuidance;
  compsUsed: MarketComp;
  rulesUsed: ContractRules;
};

export type ContractSnapshot = CalculatedSigning & {
  input: CalculatorInput;
  severeResolution: SeverePenaltyResolution;
};
