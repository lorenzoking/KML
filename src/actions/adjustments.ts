"use server";

import { revalidatePath } from "next/cache";
import { requireCommissioner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveSeason, getUserMembership } from "@/lib/league";
import {
  reputationAdjustmentSchema,
  xpAdjustmentSchema,
} from "@/lib/validations";
import { writeAuditLog } from "@/lib/audit";

export async function addXpAdjustment(formData: FormData) {
  const commissioner = await requireCommissioner();
  const { season } = await getActiveSeason();

  const parsed = xpAdjustmentSchema.safeParse({
    userId: formData.get("userId"),
    amount: formData.get("amount"),
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid XP adjustment" };
  }

  const membership = await getUserMembership(parsed.data.userId, season.id);

  const row = await prisma.xPAdjustment.create({
    data: {
      userId: parsed.data.userId,
      franchiseId: membership?.franchiseId,
      seasonId: season.id,
      amount: parsed.data.amount,
      reason: parsed.data.reason,
      isAutomatic: false,
      createdById: commissioner.id,
    },
  });

  await writeAuditLog({
    actorId: commissioner.id,
    action: "ADD_XP_ADJUSTMENT",
    entityType: "XPAdjustment",
    entityId: row.id,
    metadata: parsed.data,
  });

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function addReputationAdjustment(formData: FormData) {
  const commissioner = await requireCommissioner();

  const parsed = reputationAdjustmentSchema.safeParse({
    userId: formData.get("userId"),
    amount: formData.get("amount"),
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid reputation adjustment",
    };
  }

  const row = await prisma.reputationAdjustment.create({
    data: {
      userId: parsed.data.userId,
      amount: parsed.data.amount,
      reason: parsed.data.reason,
      createdById: commissioner.id,
    },
  });

  await writeAuditLog({
    actorId: commissioner.id,
    action: "ADD_REPUTATION_ADJUSTMENT",
    entityType: "ReputationAdjustment",
    entityId: row.id,
    metadata: parsed.data,
  });

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return { success: true };
}
