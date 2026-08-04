"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DEV_SESSION_COOKIE, isDevAuthEnabled } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";

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

export async function signOut() {
  const jar = await cookies();
  jar.delete(DEV_SESSION_COOKIE);

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
  if (!user) return { error: "User not found" };

  const jar = await cookies();
  jar.set(DEV_SESSION_COOKIE, user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });

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
