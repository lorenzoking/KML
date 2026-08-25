"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import { isCommissioner, requireCommissioner, requireUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { calculateSigning } from "@/lib/contracts/calculator";
import { getContractDesk } from "@/lib/contracts/ensure";
import type { ContractSnapshot } from "@/lib/contracts/types";
import { getActiveSeason, getUserMembership } from "@/lib/league";
import { prisma } from "@/lib/prisma";
import {
  contractSigningIdSchema,
  logContractSigningSchema,
  resolveSevereSigningSchema,
  updateContractRulesSchema,
  updatePositionCompSchema,
} from "@/lib/validations";

function revalidateContracts() {
  revalidatePath("/contracts");
  revalidatePath("/admin/contracts");
  revalidatePath("/dashboard");
}

function asSnapshot(calc: ContractSnapshot): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(calc)) as Prisma.InputJsonValue;
}

export async function logContractSigning(formData: FormData) {
  const user = await requireUser();
  const commissionerUi = await isCommissioner(user);
  const { season } = await getActiveSeason();
  const membership = await getUserMembership(user.id, season.id);

  const parsed = logContractSigningSchema.safeParse({
    playerName: formData.get("playerName"),
    position: formData.get("position"),
    playerTier: formData.get("playerTier"),
    yearsRemaining: formData.get("yearsRemaining") || 0,
    remainingDealApy: formData.get("remainingDealApy") || undefined,
    termGoal: formData.get("termGoal") || "LONG",
    leftoverMode: formData.get("leftoverMode") || "ADD_ON",
    asSignedLength: formData.get("asSignedLength"),
    asSignedTotalSalary: formData.get("asSignedTotalSalary"),
    asSignedSigningBonus: formData.get("asSignedSigningBonus") || 0,
    franchiseId: formData.get("franchiseId"),
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid signing" };
  }

  const data = parsed.data;
  if (!commissionerUi) {
    if (!membership) {
      return { error: "You must be assigned to a franchise before logging a signing." };
    }
    if (data.franchiseId !== membership.franchiseId) {
      return { error: "You can only log signings for your own team." };
    }
  }

  const franchise = await prisma.franchise.findUnique({
    where: { id: data.franchiseId },
  });
  if (!franchise) return { error: "Team not found." };

  const desk = await getContractDesk();
  const comp = desk.comps.find((row) => row.position === data.position);
  if (!comp) return { error: "No market comps for that position. Ask a commissioner to paste Spotrac numbers." };

  const input = {
    playerName: data.playerName,
    position: data.position,
    playerTier: data.playerTier,
    yearsRemaining: data.yearsRemaining,
    remainingDealApy: data.remainingDealApy ?? null,
    termGoal: data.termGoal,
    leftoverMode: data.leftoverMode,
    asSignedLength: data.asSignedLength,
    asSignedTotalSalary: data.asSignedTotalSalary,
    asSignedSigningBonus: data.asSignedSigningBonus,
  };

  const calc = calculateSigning(
    input,
    comp,
    desk.rules,
    desk.rules.defaultSevereResolution
  );
  const voidNow = calc.voidSigning;
  const snapshot: ContractSnapshot = {
    ...calc,
    input,
    severeResolution: voidNow
      ? "VOID_SIGNING"
      : calc.penaltyTier === "SEVERE"
        ? desk.rules.defaultSevereResolution
        : "PENDING",
  };

  const signing = await prisma.playerContractSigning.create({
    data: {
      seasonId: season.id,
      franchiseId: data.franchiseId,
      submittedById: user.id,
      playerName: data.playerName,
      position: data.position,
      playerTier: data.playerTier,
      yearsRemaining: data.yearsRemaining,
      remainingDealApy: data.remainingDealApy,
      asSignedLength: data.asSignedLength,
      asSignedTotalSalary: data.asSignedTotalSalary,
      asSignedSigningBonus: data.asSignedSigningBonus,
      asSignedApy: calc.asSignedApy,
      marketApy: calc.marketApy,
      overpayRatio: calc.overpayRatio,
      penaltyTier: calc.penaltyTier,
      longContractFlag: calc.longContractFlag,
      recommendedOption: calc.recommended.key,
      snapshot: asSnapshot(snapshot),
      status: voidNow ? "VOIDED" : "LOGGED",
      severeResolution: snapshot.severeResolution,
      commissionerNote: data.notes?.trim() || undefined,
    },
  });

  await writeAuditLog({
    actorId: user.id,
    action: "LOG_CONTRACT_SIGNING",
    entityType: "PlayerContractSigning",
    entityId: signing.id,
    metadata: {
      playerName: data.playerName,
      position: data.position,
      franchise: franchise.abbreviation,
      overpayRatio: calc.overpayRatio,
      penaltyTier: calc.penaltyTier,
    },
  });

  revalidateContracts();
  revalidatePath(`/contracts/${signing.id}`);
  return { success: true, signingId: signing.id };
}

export async function updateContractRules(formData: FormData) {
  const commissioner = await requireCommissioner();
  const parsed = updateContractRulesSchema.safeParse({
    maxContractLength: formData.get("maxContractLength"),
    minContractLength: formData.get("minContractLength"),
    maxTotalSalaryMillions: formData.get("maxTotalSalaryMillions"),
    maxSigningBonusMillions: formData.get("maxSigningBonusMillions"),
    longContractYears: formData.get("longContractYears"),
    overpayNoneMax: formData.get("overpayNoneMax"),
    overpayMinorMax: formData.get("overpayMinorMax"),
    overpayModerateMax: formData.get("overpayModerateMax"),
    moderateMarketMultiplier: formData.get("moderateMarketMultiplier"),
    severeMarketMultiplier: formData.get("severeMarketMultiplier"),
    capPenaltyPercentOfOverage: formData.get("capPenaltyPercentOfOverage"),
    rookieScaleFallbackRatio: formData.get("rookieScaleFallbackRatio"),
    depthMarketRatio: formData.get("depthMarketRatio"),
    defaultSevereResolution: formData.get("defaultSevereResolution"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid rules" };
  }

  const data = parsed.data;
  if (data.minContractLength >= data.maxContractLength) {
    return { error: "Min length must be below max length." };
  }
  if (data.overpayNoneMax >= data.overpayMinorMax) {
    return { error: "Good-faith max must be below the minor-penalty max." };
  }
  if (data.overpayMinorMax >= data.overpayModerateMax) {
    return { error: "Minor max must be below the severe threshold." };
  }

  await prisma.contractRuleSetting.upsert({
    where: { key: "default" },
    update: data,
    create: { key: "default", ...data },
  });

  await writeAuditLog({
    actorId: commissioner.id,
    action: "UPDATE_CONTRACT_RULES",
    entityType: "ContractRuleSetting",
    entityId: "default",
    metadata: data,
  });

  revalidateContracts();
  return { success: true };
}

export async function updateAllPositionComps(formData: FormData) {
  const commissioner = await requireCommissioner();
  const desk = await getContractDesk();
  const errors: string[] = [];

  for (const comp of desk.comps) {
    const parsed = updatePositionCompSchema.safeParse({
      position: comp.position,
      marketSetterName: formData.get(`${comp.position}_marketSetterName`),
      starterCompName: formData.get(`${comp.position}_starterCompName`),
      topOfMarketApy: formData.get(`${comp.position}_topOfMarketApy`),
      starterFloorApy: formData.get(`${comp.position}_starterFloorApy`),
      typicalBonusPercent: formData.get(`${comp.position}_typicalBonusPercent`),
      typicalLengthYears: formData.get(`${comp.position}_typicalLengthYears`),
      guaranteePercent: formData.get(`${comp.position}_guaranteePercent`) || undefined,
      sourceNote: formData.get(`${comp.position}_sourceNote`) || undefined,
    });

    if (!parsed.success) {
      errors.push(
        `${comp.position}: ${parsed.error.issues[0]?.message ?? "invalid"}`
      );
      continue;
    }

    const row = parsed.data;
    await prisma.positionMarketComp.upsert({
      where: { position: row.position },
      update: {
        marketSetterName: row.marketSetterName?.trim() || null,
        starterCompName: row.starterCompName?.trim() || null,
        topOfMarketApy: row.topOfMarketApy,
        starterFloorApy: row.starterFloorApy,
        typicalBonusRatio: row.typicalBonusPercent / 100,
        typicalLengthYears: row.typicalLengthYears,
        guaranteePercent:
          row.guaranteePercent == null ? null : row.guaranteePercent / 100,
        sourceNote: row.sourceNote?.trim() || null,
      },
      create: {
        position: row.position,
        marketSetterName: row.marketSetterName?.trim() || null,
        starterCompName: row.starterCompName?.trim() || null,
        topOfMarketApy: row.topOfMarketApy,
        starterFloorApy: row.starterFloorApy,
        typicalBonusRatio: row.typicalBonusPercent / 100,
        typicalLengthYears: row.typicalLengthYears,
        guaranteePercent:
          row.guaranteePercent == null ? null : row.guaranteePercent / 100,
        sourceNote: row.sourceNote?.trim() || null,
      },
    });
  }

  if (errors.length > 0) {
    return { error: errors.join(" · ") };
  }

  await writeAuditLog({
    actorId: commissioner.id,
    action: "UPDATE_POSITION_MARKET_COMPS",
    entityType: "PositionMarketComp",
    metadata: { positions: desk.comps.map((c) => c.position) },
  });

  revalidateContracts();
  return { success: true };
}

export async function markContractApplied(formData: FormData) {
  const commissioner = await requireCommissioner();
  const parsed = contractSigningIdSchema.safeParse({
    signingId: formData.get("signingId"),
    commissionerNote: formData.get("commissionerNote") || undefined,
  });
  if (!parsed.success) return { error: "Missing signing." };

  const signing = await prisma.playerContractSigning.findUnique({
    where: { id: parsed.data.signingId },
  });
  if (!signing) return { error: "Signing not found." };
  if (signing.status === "VOIDED") {
    return { error: "A voided signing cannot be marked applied." };
  }

  await prisma.playerContractSigning.update({
    where: { id: signing.id },
    data: {
      status: "APPLIED",
      commissionerNote:
        parsed.data.commissionerNote?.trim() || signing.commissionerNote,
    },
  });

  await writeAuditLog({
    actorId: commissioner.id,
    action: "APPLY_CONTRACT_SIGNING",
    entityType: "PlayerContractSigning",
    entityId: signing.id,
  });

  revalidateContracts();
  revalidatePath(`/contracts/${signing.id}`);
  return { success: true };
}

export async function voidContractSigning(formData: FormData) {
  const commissioner = await requireCommissioner();
  const parsed = contractSigningIdSchema.safeParse({
    signingId: formData.get("signingId"),
    commissionerNote: formData.get("commissionerNote") || undefined,
  });
  if (!parsed.success) return { error: "Missing signing." };

  const signing = await prisma.playerContractSigning.findUnique({
    where: { id: parsed.data.signingId },
  });
  if (!signing) return { error: "Signing not found." };

  await prisma.playerContractSigning.update({
    where: { id: signing.id },
    data: {
      status: "VOIDED",
      severeResolution: "VOID_SIGNING",
      recommendedOption: "VOID",
      commissionerNote:
        parsed.data.commissionerNote?.trim() || signing.commissionerNote,
    },
  });

  await writeAuditLog({
    actorId: commissioner.id,
    action: "VOID_CONTRACT_SIGNING",
    entityType: "PlayerContractSigning",
    entityId: signing.id,
  });

  revalidateContracts();
  revalidatePath(`/contracts/${signing.id}`);
  return { success: true };
}

export async function resolveSevereSigning(formData: FormData) {
  const commissioner = await requireCommissioner();
  const parsed = resolveSevereSigningSchema.safeParse({
    signingId: formData.get("signingId"),
    resolution: formData.get("resolution"),
    commissionerNote: formData.get("commissionerNote") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid resolution" };
  }

  const signing = await prisma.playerContractSigning.findUnique({
    where: { id: parsed.data.signingId },
  });
  if (!signing) return { error: "Signing not found." };
  if (signing.penaltyTier !== "SEVERE") {
    return { error: "Only severe signings need this resolution." };
  }

  const snap = signing.snapshot as unknown as ContractSnapshot;
  if (!snap?.input || !snap.compsUsed || !snap.rulesUsed) {
    return { error: "This signing is missing its calculation snapshot." };
  }

  const calc = calculateSigning(
    snap.input,
    snap.compsUsed,
    snap.rulesUsed,
    parsed.data.resolution
  );
  const snapshot: ContractSnapshot = {
    ...calc,
    input: snap.input,
    severeResolution: parsed.data.resolution,
  };

  await prisma.playerContractSigning.update({
    where: { id: signing.id },
    data: {
      recommendedOption: calc.recommended.key,
      snapshot: asSnapshot(snapshot),
      status: calc.voidSigning ? "VOIDED" : signing.status === "VOIDED" ? "LOGGED" : signing.status,
      severeResolution: parsed.data.resolution,
      commissionerNote:
        parsed.data.commissionerNote?.trim() || signing.commissionerNote,
    },
  });

  await writeAuditLog({
    actorId: commissioner.id,
    action: "RESOLVE_SEVERE_CONTRACT",
    entityType: "PlayerContractSigning",
    entityId: signing.id,
    metadata: { resolution: parsed.data.resolution },
  });

  revalidateContracts();
  revalidatePath(`/contracts/${signing.id}`);
  return { success: true };
}
