import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Role, type User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";

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

export async function syncUserFromAuth(params: {
  email: string;
  name?: string | null;
  image?: string | null;
}) {
  const email = params.email.toLowerCase();
  const isCommissioner = commissionerEmails().includes(email);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    return prisma.user.create({
      data: {
        email,
        name: params.name ?? email.split("@")[0],
        image: params.image ?? undefined,
        role: isCommissioner ? Role.COMMISSIONER : Role.USER,
        isActive: true,
        deletedAt: null,
      },
    });
  }

  // Returning Google users always reappear in the manage-users list.
  return prisma.user.update({
    where: { id: existing.id },
    data: {
      name: params.name ?? existing.name,
      image: params.image ?? existing.image,
      deletedAt: null,
      role:
        isCommissioner && existing.role !== Role.COMMISSIONER
          ? Role.COMMISSIONER
          : existing.role,
    },
  });
}

export async function getSessionUser(): Promise<User | null> {
  if (isDevAuthEnabled()) {
    const jar = await cookies();
    const devId = jar.get(DEV_SESSION_COOKIE)?.value;
    if (devId) {
      return prisma.user.findFirst({
        where: { id: devId, deletedAt: null },
      });
    }
  }

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
