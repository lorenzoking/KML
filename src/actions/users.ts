"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Role } from "@prisma/client";
import { requireCommissioner, requireUser, syncUserFromAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveSeason, getUserMembership } from "@/lib/league";
import { requestTeamSchema, updateUserSchema } from "@/lib/validations";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

export async function requestTeam(formData: FormData) {
  const user = await requireUser();
  const { season } = await getActiveSeason();

  const membership = await getUserMembership(user.id, season.id);
  if (membership) {
    return { error: "You already have a team assignment for this season." };
  }

  const parsed = requestTeamSchema.safeParse({
    franchiseId: formData.get("franchiseId"),
    displayName: formData.get("displayName") || "",
    note: formData.get("note") || "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid team request." };
  }

  const franchise = await prisma.franchise.findUnique({
    where: { id: parsed.data.franchiseId },
  });
  if (!franchise) return { error: "That team was not found." };

  const displayName = parsed.data.displayName.trim();
  const note = parsed.data.note?.trim();

  await prisma.user.update({
    where: { id: user.id },
    data: {
      requestedFranchiseId: franchise.id,
      teamRequestNote: note || null,
      teamRequestedAt: new Date(),
      name: displayName,
    },
  });

  await writeAuditLog({
    actorId: user.id,
    action: "REQUEST_TEAM",
    entityType: "User",
    entityId: user.id,
    metadata: {
      franchiseId: franchise.id,
      franchise: franchise.abbreviation,
      note: note || null,
      displayName,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/request-team");
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${user.id}`);
  revalidatePath("/admin");
  redirect("/dashboard?teamRequested=1");
}

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

async function removeUserAccount(params: {
  commissionerId: string;
  userId: string;
  mode: "soft" | "hard";
}) {
  const { commissionerId, userId, mode } = params;
  if (userId === commissionerId) {
    return { error: "You cannot delete your own account." };
  }

  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing || existing.deletedAt) return { error: "User not found." };

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
      actorId: commissionerId,
      action: "HARD_DELETE_USER",
      entityType: "User",
      entityId: userId,
      metadata: { email: existing.email },
    });
  } else {
    await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });

    await writeAuditLog({
      actorId: commissionerId,
      action: "SOFT_DELETE_USER",
      entityType: "User",
      entityId: userId,
      metadata: { email: existing.email },
    });
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin/teams");
  revalidatePath("/admin");
  return { success: true as const };
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
  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) return { error: "User not found." };

  const expected =
    mode === "hard" ? `DELETE ${existing.email}` : `REMOVE ${existing.email}`;
  if (confirm.trim() !== expected) {
    return {
      error: `Type ${expected} exactly to confirm.`,
    };
  }

  const result = await removeUserAccount({
    commissionerId: commissioner.id,
    userId,
    mode,
  });
  if (result.error) return result;

  redirect("/admin/users?removed=1");
}

/** Soft-remove from the users list with a browser confirm (no typed email). */
export async function quickRemoveUser(formData: FormData) {
  const commissioner = await requireCommissioner();
  const userId = String(formData.get("userId") || "");
  if (!userId) return { error: "User is required." };

  const result = await removeUserAccount({
    commissionerId: commissioner.id,
    userId,
    mode: "soft",
  });
  if (result.error) {
    redirect(`/admin/users?error=${encodeURIComponent(result.error)}`);
  }

  redirect("/admin/users?removed=1");
}

/**
 * Upsert every Supabase Auth user into the app User table.
 * Use this after a seed wipe or when Auth users are missing from Manage users.
 * Existing roles/history are preserved; soft-deleted rows are restored.
 */
export async function syncUsersFromSupabaseAuth() {
  const commissioner = await requireCommissioner();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) {
    redirect(
      `/admin/users?error=${encodeURIComponent(
        "Missing SUPABASE_SERVICE_ROLE_KEY. Add it in Vercel/local env, then retry sync."
      )}`
    );
  }

  const admin = createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let page = 1;
  const perPage = 200;
  let createdOrRestored = 0;
  let scanned = 0;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) {
      redirect(
        `/admin/users?error=${encodeURIComponent(
          `Supabase Auth sync failed: ${error.message}`
        )}`
      );
    }

    const users = data.users ?? [];
    if (users.length === 0) break;

    for (const authUser of users) {
      if (!authUser.email) continue;
      scanned += 1;
      const before = await prisma.user.findUnique({
        where: { email: authUser.email.toLowerCase() },
      });
      await syncUserFromAuth({
        email: authUser.email,
        name:
          authUser.user_metadata?.full_name ??
          authUser.user_metadata?.name ??
          authUser.email.split("@")[0],
        image: authUser.user_metadata?.avatar_url,
      });
      if (!before || before.deletedAt) createdOrRestored += 1;
    }

    if (users.length < perPage) break;
    page += 1;
  }

  await writeAuditLog({
    actorId: commissioner.id,
    action: "SYNC_USERS_FROM_SUPABASE_AUTH",
    entityType: "User",
    entityId: "bulk",
    metadata: { scanned, createdOrRestored },
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin/teams");
  revalidatePath("/admin");
  revalidatePath("/coach");
  redirect(
    `/admin/users?synced=1&scanned=${scanned}&restored=${createdOrRestored}`
  );
}

export async function ensureUserByEmail(formData: FormData) {
  const commissioner = await requireCommissioner();

  const parsed = z
    .object({
      email: z.string().email(),
      name: z.string().max(80).optional(),
      role: z.enum(["COMMISSIONER", "USER"]).default("USER"),
    })
    .safeParse({
      email: formData.get("email"),
      name: formData.get("name") || undefined,
      role: formData.get("role") || "USER",
    });

  if (!parsed.success) {
    redirect(
      `/admin/users?error=${encodeURIComponent(
        "Enter a valid email to add/restore a user."
      )}`
    );
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });

  const user = await syncUserFromAuth({
    email,
    name: parsed.data.name ?? existing?.name,
    forceCommissioner: parsed.data.role === "COMMISSIONER",
  });

  if (parsed.data.role === "USER" && user.role === Role.COMMISSIONER) {
    // Keep existing commissioner unless explicitly demoting via Manage user page.
  } else if (parsed.data.role === "COMMISSIONER" && user.role !== Role.COMMISSIONER) {
    await prisma.user.update({
      where: { id: user.id },
      data: { role: Role.COMMISSIONER, deletedAt: null, isActive: true },
    });
  } else if (!existing) {
    await prisma.user.update({
      where: { id: user.id },
      data: { role: parsed.data.role },
    });
  }

  await writeAuditLog({
    actorId: commissioner.id,
    action: existing ? "RESTORE_USER_BY_EMAIL" : "ENSURE_USER_BY_EMAIL",
    entityType: "User",
    entityId: user.id,
    metadata: { email, role: parsed.data.role },
  });

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${user.id}`);
  redirect(`/admin/users/${user.id}?updated=1`);
}
