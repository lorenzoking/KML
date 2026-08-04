"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCommissioner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveSeason } from "@/lib/league";
import { assignTeamSchema } from "@/lib/validations";
import { writeAuditLog } from "@/lib/audit";

async function endActiveStints(params: {
  userId?: string;
  franchiseId?: string;
  seasonId: string;
  endedWeek: number;
}) {
  await prisma.leagueMembership.updateMany({
    where: {
      seasonId: params.seasonId,
      isActive: true,
      ...(params.userId ? { userId: params.userId } : {}),
      ...(params.franchiseId ? { franchiseId: params.franchiseId } : {}),
    },
    data: {
      isActive: false,
      endedAt: new Date(),
      endedWeek: params.endedWeek,
    },
  });
}

export async function assignUserToTeam(formData: FormData) {
  const commissioner = await requireCommissioner();
  const { season, settings } = await getActiveSeason();
  const currentWeek = settings.currentWeek;

  const franchiseRaw = formData.get("franchiseId");
  const parsed = assignTeamSchema.safeParse({
    userId: formData.get("userId"),
    franchiseId:
      franchiseRaw === "" || franchiseRaw === "unassign" ? null : franchiseRaw,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid assignment" };
  }

  const { userId, franchiseId } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.deletedAt) return { error: "User not found." };

  // Fire / unassign: keep historical stint so Bills stats remain on their career.
  if (!franchiseId) {
    await endActiveStints({
      userId,
      seasonId: season.id,
      endedWeek: currentWeek,
    });

    await writeAuditLog({
      actorId: commissioner.id,
      action: "UNASSIGN_TEAM",
      entityType: "User",
      entityId: userId,
      metadata: { seasonId: season.id, endedWeek: currentWeek },
    });

    revalidateAssignmentPaths(userId);
    redirect(safeReturnTo(formData, userId));
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
      error: `${taken.franchise.name} is already assigned to ${taken.user.name ?? taken.user.email}. Unassign them first or choose another team.`,
    };
  }

  const current = await prisma.leagueMembership.findFirst({
    where: { userId, seasonId: season.id, isActive: true },
  });

  // Already on this team — no-op
  if (current?.franchiseId === franchiseId) {
    redirect(safeReturnTo(formData, userId));
  }

  // End prior stint (e.g. Bills) without deleting it, then create new stint (e.g. Chiefs).
  if (current) {
    await endActiveStints({
      userId,
      seasonId: season.id,
      endedWeek: currentWeek,
    });
  }

  await prisma.leagueMembership.create({
    data: {
      userId,
      franchiseId,
      seasonId: season.id,
      isActive: true,
      startedWeek: currentWeek,
    },
  });

  await writeAuditLog({
    actorId: commissioner.id,
    action: "ASSIGN_TEAM",
    entityType: "LeagueMembership",
    entityId: userId,
    metadata: {
      franchiseId,
      seasonId: season.id,
      startedWeek: currentWeek,
      previousFranchiseId: current?.franchiseId ?? null,
    },
  });

  revalidateAssignmentPaths(userId);
  redirect(safeReturnTo(formData, userId));
}

function safeReturnTo(formData: FormData, userId: string) {
  const raw = String(formData.get("returnTo") || "");
  if (raw.startsWith("/admin")) return raw;
  return `/admin/users/${userId}?updated=1`;
}

function revalidateAssignmentPaths(userId: string) {
  revalidatePath("/admin/teams");
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/dashboard");
  revalidatePath("/admin");
  revalidatePath("/standings");
}
