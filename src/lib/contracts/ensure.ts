import { prisma } from "@/lib/prisma";
import { DEFAULT_CONTRACT_RULES, DEFAULT_MARKET_COMPS } from "./defaults";
import type { ContractRules, MarketComp } from "./types";
import { CONTRACT_POSITIONS } from "./types";

function isMissingTable(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String(error.code) : "";
  return code === "P2021" || code === "P2022";
}

export function rulesFromRow(row: {
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
  defaultSevereResolution: ContractRules["defaultSevereResolution"];
}): ContractRules {
  return {
    maxContractLength: row.maxContractLength,
    minContractLength: row.minContractLength,
    maxTotalSalaryMillions: row.maxTotalSalaryMillions,
    maxSigningBonusMillions: row.maxSigningBonusMillions,
    longContractYears: row.longContractYears,
    overpayNoneMax: row.overpayNoneMax,
    overpayMinorMax: row.overpayMinorMax,
    overpayModerateMax: row.overpayModerateMax,
    moderateMarketMultiplier: row.moderateMarketMultiplier,
    severeMarketMultiplier: row.severeMarketMultiplier,
    capPenaltyPercentOfOverage: row.capPenaltyPercentOfOverage,
    rookieScaleFallbackRatio: row.rookieScaleFallbackRatio,
    depthMarketRatio: row.depthMarketRatio,
    defaultSevereResolution: row.defaultSevereResolution,
  };
}

export function compFromRow(row: {
  position: MarketComp["position"];
  marketSetterName: string | null;
  topOfMarketApy: number;
  starterFloorApy: number;
  typicalBonusRatio: number;
  typicalLengthYears: number;
  guaranteePercent: number | null;
  sourceNote: string | null;
}): MarketComp {
  return {
    position: row.position,
    marketSetterName: row.marketSetterName,
    topOfMarketApy: row.topOfMarketApy,
    starterFloorApy: row.starterFloorApy,
    typicalBonusRatio: row.typicalBonusRatio,
    typicalLengthYears: row.typicalLengthYears,
    guaranteePercent: row.guaranteePercent,
    sourceNote: row.sourceNote,
  };
}

export async function ensureContractDesk() {
  try {
    const existingRules = await prisma.contractRuleSetting.findUnique({
      where: { key: "default" },
    });
    if (!existingRules) {
      await prisma.contractRuleSetting.create({
        data: { key: "default", ...DEFAULT_CONTRACT_RULES },
      });
    } else if (
      existingRules.moderateMarketMultiplier < 1 ||
      existingRules.severeMarketMultiplier < 1
    ) {
      // Older defaults used 0.90 / 0.75. A cheaper contract rewards the abuser
      // with a star and leftover cap, so floor those multipliers at market.
      await prisma.contractRuleSetting.update({
        where: { key: "default" },
        data: {
          moderateMarketMultiplier:
            existingRules.moderateMarketMultiplier < 1
              ? 1
              : existingRules.moderateMarketMultiplier,
          severeMarketMultiplier:
            existingRules.severeMarketMultiplier < 1
              ? DEFAULT_CONTRACT_RULES.severeMarketMultiplier
              : existingRules.severeMarketMultiplier,
        },
      });
    }

    const existingComps = await prisma.positionMarketComp.findMany({
      select: { position: true },
    });
    const have = new Set(existingComps.map((row) => row.position));
    const missing = DEFAULT_MARKET_COMPS.filter((comp) => !have.has(comp.position));
    if (missing.length > 0) {
      await prisma.positionMarketComp.createMany({
        data: missing,
      });
    }
  } catch (error) {
    if (isMissingTable(error)) return;
    throw error;
  }
}

export async function safeEnsureContractDesk() {
  try {
    await ensureContractDesk();
  } catch (error) {
    console.error("ensureContractDesk failed:", error);
  }
}

export async function getContractDesk() {
  await ensureContractDesk();
  const [rulesRow, comps] = await Promise.all([
    prisma.contractRuleSetting.findUniqueOrThrow({ where: { key: "default" } }),
    prisma.positionMarketComp.findMany(),
  ]);

  const byPosition = new Map(comps.map((comp) => [comp.position, compFromRow(comp)]));
  const ordered = CONTRACT_POSITIONS.map(
    (position) => byPosition.get(position) ?? DEFAULT_MARKET_COMPS.find((c) => c.position === position)!
  );

  return {
    rules: rulesFromRow(rulesRow),
    comps: ordered,
    rulesUpdatedAt: rulesRow.updatedAt,
  };
}
