"use server";

import { revalidatePath } from "next/cache";
import { requireCommissioner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveSeason } from "@/lib/league";
import { assignTeamSchema } from "@/lib/validations";
import { writeAuditLog } from "@/lib/audit";

export async function assignUserToTeam(formData: FormData) {
  const commissioner = await requireCommissioner();
  const { season } = await getActiveSeason();

  const franchiseRaw = formData.get("franchiseId");
  const parsed = assignTeamSchema.safeParse({
    userId: formData.get("userId"),
    franchiseId: franchiseRaw === "" || franchiseRaw === "unassign" ? null : franchiseRaw,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid assignment" };
  }

  const { userId, franchiseId } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "User not found." };

  if (!franchiseId) {
    await prisma.leagueMembership.updateMany({
      where: { userId, seasonId: season.id },
      data: { isActive: false },
    });

    await writeAuditLog({
      actorId: commissioner.id,
      action: "UNASSIGN_TEAM",
      entityType: "User",
      entityId: userId,
      metadata: { seasonId: season.id },
    });

    revalidatePath("/admin/teams");
    revalidatePath("/dashboard");
    return { success: true };
  }

  const taken = await prisma.leagueMembership.findFirst({
    where: {
      franchiseId,
      seasonId: season.id,
      isActive: true,
      NOT: { userId },
    },
    include: { user: true, franchise: true },
  });

  if (taken) {
    return {
      error: `${taken.franchise.name} is already assigned to ${taken.user.name ?? taken.user.email}.`,
    };
  }

  await prisma.leagueMembership.upsert({
    where: {
      userId_seasonId: { userId, seasonId: season.id },
    },
    create: {
      userId,
      franchiseId,
      seasonId: season.id,
      isActive: true,
    },
    update: {
      franchiseId,
      isActive: true,
    },
  });

  await writeAuditLog({
    actorId: commissioner.id,
    action: "ASSIGN_TEAM",
    entityType: "LeagueMembership",
    entityId: userId,
    metadata: { franchiseId, seasonId: season.id },
  });

  revalidatePath("/admin/teams");
  revalidatePath("/dashboard");
  revalidatePath("/admin");
  return { success: true };
}
