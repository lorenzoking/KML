"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCommissioner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveSeason } from "@/lib/league";
import {
  assignTeamSchema,
  createWaitlistEntrySchema,
  updateWaitlistEntrySchema,
} from "@/lib/validations";
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
    const current = await prisma.leagueMembership.findFirst({
      where: { userId, seasonId: season.id, isActive: true },
      include: { franchise: true },
    });

    await endActiveStints({
      userId,
      seasonId: season.id,
      endedWeek: currentWeek,
    });

    let replacedByWaitlist = false;
    if (current?.franchiseId) {
      const nextWaitlist = await prisma.waitlistEntry.findFirst({
        where: {
          isActive: true,
          user: { deletedAt: null, isActive: true },
        },
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      });

      if (nextWaitlist) {
        await endActiveStints({
          userId: nextWaitlist.userId,
          seasonId: season.id,
          endedWeek: currentWeek,
        });
        await prisma.leagueMembership.create({
          data: {
            userId: nextWaitlist.userId,
            franchiseId: current.franchiseId,
            seasonId: season.id,
            isActive: true,
            startedWeek: currentWeek,
          },
        });
        await prisma.waitlistEntry.update({
          where: { id: nextWaitlist.id },
          data: { isActive: false },
        });
        await prisma.coachProfile.upsert({
          where: { userId: nextWaitlist.userId },
          update: { isAutopilot: false, autopilotSeason: null },
          create: { userId: nextWaitlist.userId, isAutopilot: false },
        });
        replacedByWaitlist = true;
      } else {
        const existingVacancy = await prisma.carouselVacancy.findFirst({
          where: {
            seasonId: season.id,
            franchiseId: current.franchiseId,
            isOpen: true,
          },
        });
        if (!existingVacancy) {
          await prisma.carouselVacancy.create({
            data: {
              seasonId: season.id,
              franchiseId: current.franchiseId,
              reason: `Fired coach (${user.name ?? user.email})`,
              isOpen: true,
            },
          });
        }
      }
    }

    const openVacancyCount = await prisma.carouselVacancy.count({
      where: { seasonId: season.id, isOpen: true },
    });
    const autopilot = replacedByWaitlist || openVacancyCount === 0;
    await prisma.coachProfile.upsert({
      where: { userId },
      update: {
        isAutopilot: autopilot,
        autopilotSeason: autopilot ? season.number : null,
      },
      create: {
        userId,
        isAutopilot: autopilot,
        autopilotSeason: autopilot ? season.number : null,
      },
    });

    await writeAuditLog({
      actorId: commissioner.id,
      action: "UNASSIGN_TEAM",
      entityType: "User",
      entityId: userId,
      metadata: {
        seasonId: season.id,
        endedWeek: currentWeek,
        replacedByWaitlist,
        autopilot,
      },
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
  await prisma.coachProfile.upsert({
    where: { userId },
    update: { isAutopilot: false, autopilotSeason: null },
    create: { userId, isAutopilot: false },
  });
  // Clear signup team request once they are officially assigned.
  await prisma.user.update({
    where: { id: userId },
    data: {
      requestedFranchiseId: null,
      teamRequestNote: null,
      teamRequestedAt: null,
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

export async function addWaitlistEntry(formData: FormData) {
  const commissioner = await requireCommissioner();
  const parsed = createWaitlistEntrySchema.safeParse({
    userId: formData.get("userId"),
    position: formData.get("position"),
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid waitlist entry." };
  }

  const existing = await prisma.waitlistEntry.findFirst({
    where: { userId: parsed.data.userId, isActive: true },
  });
  if (existing) return { error: "User already has an active waitlist entry." };

  const row = await prisma.waitlistEntry.create({
    data: parsed.data,
  });
  await writeAuditLog({
    actorId: commissioner.id,
    action: "ADD_WAITLIST_ENTRY",
    entityType: "WaitlistEntry",
    entityId: row.id,
    metadata: parsed.data,
  });
  revalidateAssignmentPaths(parsed.data.userId);
  revalidatePath("/coach/carousel");
  return { success: true };
}

export async function setWaitlistEntryActive(formData: FormData) {
  const commissioner = await requireCommissioner();
  const parsed = updateWaitlistEntrySchema.safeParse({
    entryId: formData.get("entryId"),
    isActive: formData.get("isActive") === "true",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid waitlist update." };
  }

  const row = await prisma.waitlistEntry.update({
    where: { id: parsed.data.entryId },
    data: { isActive: parsed.data.isActive },
  });
  await writeAuditLog({
    actorId: commissioner.id,
    action: "SET_WAITLIST_ENTRY_ACTIVE",
    entityType: "WaitlistEntry",
    entityId: row.id,
    metadata: parsed.data,
  });
  revalidateAssignmentPaths(row.userId);
  return { success: true };
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
  revalidatePath("/coach/profiles");
}
