import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Role, type User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { writeAuditLog } from "@/lib/audit";

/** Shared cookie for password backup login and local demo login. */
export const APP_SESSION_COOKIE = "kml_app_session";
/** @deprecated kept cleared on sign-out for older sessions */
export const DEV_SESSION_COOKIE = "kml_dev_user";

function commissionerEmails() {
  return (process.env.COMMISSIONER_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isDevAuthEnabled() {
  return process.env.AUTH_DEV_BYPASS === "true";
}

export function isCommissionerBackupLoginEnabled() {
  return Boolean(
    process.env.COMMISSIONER_BACKUP_EMAIL?.trim() &&
      process.env.COMMISSIONER_BACKUP_PASSWORD
  );
}

async function ensureCoachProfile(userId: string) {
  await prisma.coachProfile.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
}

export async function syncUserFromAuth(params: {
  email: string;
  name?: string | null;
  image?: string | null;
  forceCommissioner?: boolean;
}) {
  const email = params.email.toLowerCase();
  const isCommissioner =
    params.forceCommissioner || commissionerEmails().includes(email);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    const created = await prisma.user.create({
      data: {
        email,
        name: params.name ?? email.split("@")[0],
        image: params.image ?? undefined,
        role: isCommissioner ? Role.COMMISSIONER : Role.USER,
        isActive: true,
        deletedAt: null,
      },
    });

    await ensureCoachProfile(created.id);

    await writeAuditLog({
      actorId: created.id,
      action: "USER_SIGNED_UP",
      entityType: "User",
      entityId: created.id,
      metadata: {
        email: created.email,
        name: created.name,
        role: created.role,
        method: params.forceCommissioner ? "commissioner_backup" : "google",
      },
    });

    return created;
  }

  // Never demote an existing commissioner via OAuth sync, and never drop
  // an assigned role when a previously seeded/wiped user signs back in.
  const nextRole =
    isCommissioner || existing.role === Role.COMMISSIONER
      ? Role.COMMISSIONER
      : existing.role;

  const updated = await prisma.user.update({
    where: { id: existing.id },
    data: {
      name: params.name ?? existing.name,
      image: params.image ?? existing.image,
      // Signing in again restores soft-deleted accounts so they reappear
      // under Manage users without losing role/history.
      deletedAt: null,
      isActive: existing.deletedAt ? true : existing.isActive,
      role: nextRole,
    },
  });

  await ensureCoachProfile(updated.id);
  return updated;
}

export async function setAppSession(userId: string) {
  const jar = await cookies();
  jar.set(APP_SESSION_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function clearAppSession() {
  const jar = await cookies();
  jar.delete(APP_SESSION_COOKIE);
  jar.delete(DEV_SESSION_COOKIE);
}

async function getAppSessionUser() {
  const jar = await cookies();
  const userId =
    jar.get(APP_SESSION_COOKIE)?.value ?? jar.get(DEV_SESSION_COOKIE)?.value;
  if (!userId) return null;
  return prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
  });
}

export async function getSessionUser(): Promise<User | null> {
  const appSessionUser = await getAppSessionUser();
  if (appSessionUser) return appSessionUser;

  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) return null;

    const appUser = await syncUserFromAuth({
      email: user.email,
      name: user.user_metadata?.full_name ?? user.user_metadata?.name,
      image: user.user_metadata?.avatar_url,
    });

    if (appUser.deletedAt) return null;
    return appUser;
  } catch (error) {
    console.error("getSessionUser failed:", error);
    return null;
  }
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");
  if (!user.isActive) redirect("/sign-in?error=inactive");
  return user;
}

export async function requireCommissioner() {
  const user = await requireUser();
  if (user.role !== Role.COMMISSIONER) {
    redirect("/dashboard");
  }
  return user;
}

export function isCommissioner(user: User) {
  return user.role === Role.COMMISSIONER;
}
