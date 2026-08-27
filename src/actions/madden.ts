"use server";

import { revalidatePath } from "next/cache";
import { requireCommissioner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { newMaddenExportToken } from "@/lib/madden/companion";

export async function ensureMaddenExportToken() {
  await requireCommissioner();
  const settings = await prisma.leagueSetting.findUnique({
    where: { key: "default" },
    select: { id: true, maddenExportToken: true },
  });
  if (!settings) throw new Error("League settings not seeded.");
  if (settings.maddenExportToken) return settings.maddenExportToken;

  const token = newMaddenExportToken();
  await prisma.leagueSetting.update({
    where: { id: settings.id },
    data: { maddenExportToken: token },
  });
  return token;
}

export async function rotateMaddenExportToken() {
  const commissioner = await requireCommissioner();
  const token = newMaddenExportToken();
  const settings = await prisma.leagueSetting.update({
    where: { key: "default" },
    data: { maddenExportToken: token },
  });

  await writeAuditLog({
    actorId: commissioner.id,
    action: "ROTATE_MADDEN_EXPORT_TOKEN",
    entityType: "LeagueSetting",
    entityId: settings.id,
  });

  revalidatePath("/admin/madden");
  return { success: true };
}
