"use server";

import { createHash, timingSafeEqual } from "crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  clearAppSession,
  isCommissionerBackupLoginEnabled,
  isDevAuthEnabled,
  setAppSession,
  syncUserFromAuth,
} from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { writeAuditLog } from "@/lib/audit";

function normalizeOrigin(raw: string) {
  return raw.replace(/\/$/, "");
}

async function getAppOrigin() {
  const headerStore = await headers();
  const host =
    headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const proto =
    headerStore.get("x-forwarded-proto") ??
    (host?.includes("localhost") ? "http" : "https");

  if (host) {
    return normalizeOrigin(`${proto}://${host}`);
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    return normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL);
  }

  return "http://localhost:3000";
}

function passwordsMatch(input: string, expected: string) {
  const a = createHash("sha256").update(input).digest();
  const b = createHash("sha256").update(expected).digest();
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function signInWithGoogle() {
  if (!isSupabaseConfigured()) {
    return { error: "Supabase is not configured. Use demo login locally." };
  }

  const supabase = await createClient();
  const origin = await getAppOrigin();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error || !data.url) {
    return { error: error?.message ?? "Unable to start Google sign-in" };
  }

  redirect(data.url);
}

export async function signInWithCommissionerPassword(formData: FormData) {
  if (!isCommissionerBackupLoginEnabled()) {
    return { error: "Commissioner password login is not configured." };
  }

  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");

  const expectedEmail = process.env.COMMISSIONER_BACKUP_EMAIL!.trim().toLowerCase();
  const expectedPassword = process.env.COMMISSIONER_BACKUP_PASSWORD!;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  if (
    !passwordsMatch(email, expectedEmail) ||
    !passwordsMatch(password, expectedPassword)
  ) {
    return { error: "Invalid commissioner credentials." };
  }

  const user = await syncUserFromAuth({
    email: expectedEmail,
    name: process.env.COMMISSIONER_BACKUP_NAME || "League Commissioners",
    forceCommissioner: true,
  });

  if (!user.isActive) {
    return { error: "This commissioner account is inactive." };
  }

  await setAppSession(user.id);

  await writeAuditLog({
    actorId: user.id,
    action: "COMMISSIONER_PASSWORD_LOGIN",
    entityType: "User",
    entityId: user.id,
    metadata: { method: "backup_password" },
  });

  redirect("/dashboard");
}

export async function signOut() {
  await clearAppSession();

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  redirect("/");
}

export async function devSignIn(userId: string) {
  if (!isDevAuthEnabled()) {
    return { error: "Dev auth is disabled" };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.deletedAt) return { error: "User not found" };

  await setAppSession(user.id);
  redirect("/dashboard");
}

export async function listDevUsers() {
  if (!isDevAuthEnabled()) return [];
  return prisma.user.findMany({
    where: { deletedAt: null },
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      memberships: {
        where: { isActive: true },
        include: { franchise: true },
        take: 1,
      },
    },
  });
}
