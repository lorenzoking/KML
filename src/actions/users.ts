"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { requireCommissioner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveSeason } from "@/lib/league";
import { updateUserSchema } from "@/lib/validations";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

export async function updateUser(formData: FormData) {
  const commissioner = await requireCommissioner();

  const parsed = updateUserSchema.safeParse({
    userId: formData.get("userId"),
    name: formData.get("name") || undefined,
    role: formData.get("role"),
    isActive: String(formData.get("isActive")) === "true",
    adminNotes: formData.get("adminNotes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid user update" };
  }

  const { userId, name, role, isActive, adminNotes } = parsed.data;

  if (userId === commissioner.id && role !== Role.COMMISSIONER) {
    return { error: "You cannot demote yourself from commissioner." };
  }

  if (userId === commissioner.id && !isActive) {
    return { error: "You cannot deactivate your own account." };
  }

  const existing = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
  });
  if (!existing) return { error: "User not found." };

  if (existing.role === Role.COMMISSIONER && role !== Role.COMMISSIONER) {
    const commissionerCount = await prisma.user.count({
      where: { role: Role.COMMISSIONER, isActive: true, deletedAt: null },
    });
    if (commissionerCount <= 1) {
      return { error: "Keep at least one active commissioner." };
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      name: name ?? existing.name,
      role,
      isActive,
      adminNotes: adminNotes ?? null,
    },
  });

  // If deactivated, end active coaching stints but keep historical stints/stats.
  if (!isActive) {
    const { season, settings } = await getActiveSeason();
    await prisma.leagueMembership.updateMany({
      where: { userId, seasonId: season.id, isActive: true },
      data: {
        isActive: false,
        endedAt: new Date(),
        endedWeek: settings.currentWeek,
      },
    });
  }

  await writeAuditLog({
    actorId: commissioner.id,
    action: "UPDATE_USER",
    entityType: "User",
    entityId: userId,
    metadata: { role, isActive, name, adminNotes },
  });

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin/teams");
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  redirect(`/admin/users/${userId}?updated=1`);
}

export async function deleteUser(formData: FormData) {
  const commissioner = await requireCommissioner();

  const parsed = z
    .object({
      userId: z.string().min(1),
      confirm: z.string().min(1),
      mode: z.enum(["soft", "hard"]).default("soft"),
    })
    .safeParse({
      userId: formData.get("userId"),
      confirm: formData.get("confirm"),
      mode: formData.get("mode") || "soft",
    });

  if (!parsed.success) {
    return { error: "Invalid delete request." };
  }

  const { userId, confirm, mode } = parsed.data;
  if (userId === commissioner.id) {
    return { error: "You cannot delete your own account." };
  }

  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) return { error: "User not found." };

  const expected =
    mode === "hard" ? `DELETE ${existing.email}` : `REMOVE ${existing.email}`;
  if (confirm.trim() !== expected) {
    return {
      error: `Type ${expected} exactly to confirm.`,
    };
  }

  if (existing.role === Role.COMMISSIONER) {
    const commissionerCount = await prisma.user.count({
      where: { role: Role.COMMISSIONER, isActive: true, deletedAt: null },
    });
    if (commissionerCount <= 1) {
      return { error: "Keep at least one active commissioner." };
    }
  }

  const { season, settings } = await getActiveSeason();
  await prisma.leagueMembership.updateMany({
    where: { userId, seasonId: season.id, isActive: true },
    data: {
      isActive: false,
      endedAt: new Date(),
      endedWeek: settings.currentWeek,
    },
  });

  if (mode === "hard") {
    await prisma.user.delete({ where: { id: userId } });
    await writeAuditLog({
      actorId: commissioner.id,
      action: "HARD_DELETE_USER",
      entityType: "User",
      entityId: userId,
      metadata: { email: existing.email },
    });
    revalidatePath("/admin/users");
    revalidatePath("/admin/teams");
    revalidatePath("/admin");
    redirect("/admin/users?removed=1");
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      isActive: false,
      deletedAt: new Date(),
    },
  });

  await writeAuditLog({
    actorId: commissioner.id,
    action: "SOFT_DELETE_USER",
    entityType: "User",
    entityId: userId,
    metadata: { email: existing.email },
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin/teams");
  revalidatePath("/admin");
  redirect("/admin/users?removed=1");
}
