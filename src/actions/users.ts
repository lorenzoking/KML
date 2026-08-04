"use server";

import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";
import { requireCommissioner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateUserSchema } from "@/lib/validations";
import { writeAuditLog } from "@/lib/audit";

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

  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) return { error: "User not found." };

  if (
    existing.role === Role.COMMISSIONER &&
    role !== Role.COMMISSIONER
  ) {
    const commissionerCount = await prisma.user.count({
      where: { role: Role.COMMISSIONER, isActive: true },
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
  return { success: true };
}
