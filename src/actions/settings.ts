"use server";

import { revalidatePath } from "next/cache";
import { requireCommissioner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { settingsSchema } from "@/lib/validations";
import { writeAuditLog } from "@/lib/audit";

export async function updateLeagueSettings(formData: FormData) {
  const commissioner = await requireCommissioner();

  const parsed = settingsSchema.safeParse({
    leagueName: formData.get("leagueName"),
    currentSeason: formData.get("currentSeason"),
    currentWeek: formData.get("currentWeek"),
    xpGamePlayed: formData.get("xpGamePlayed"),
    xpWinBonus: formData.get("xpWinBonus"),
    startingRepScore: formData.get("startingRepScore"),
    carouselMinCoachRep: formData.get("carouselMinCoachRep"),
    buyoutXpCost: formData.get("buyoutXpCost"),
    startingContractYears: formData.get("startingContractYears"),
    rulesMarkdown: formData.get("rulesMarkdown"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid settings" };
  }

  const data = parsed.data;

  let season = await prisma.season.findUnique({
    where: { number: data.currentSeason },
  });

  if (!season) {
    season = await prisma.season.create({
      data: {
        number: data.currentSeason,
        name: `Season ${data.currentSeason}`,
        isActive: true,
      },
    });
  }

  await prisma.season.updateMany({
    data: { isActive: false },
  });
  await prisma.season.update({
    where: { id: season.id },
    data: { isActive: true },
  });

  await prisma.leagueSetting.update({
    where: { key: "default" },
    data: {
      leagueName: data.leagueName,
      currentSeason: data.currentSeason,
      currentWeek: data.currentWeek,
      xpGamePlayed: data.xpGamePlayed,
      xpWinBonus: data.xpWinBonus,
      startingRepScore: data.startingRepScore,
      carouselMinCoachRep: data.carouselMinCoachRep,
      buyoutMinCoachRep: data.carouselMinCoachRep,
      buyoutXpCost: data.buyoutXpCost,
      startingContractYears: data.startingContractYears,
      rulesMarkdown: data.rulesMarkdown,
    },
  });

  await writeAuditLog({
    actorId: commissioner.id,
    action: "UPDATE_LEAGUE_SETTINGS",
    entityType: "LeagueSetting",
    entityId: "default",
    metadata: data,
  });

  revalidatePath("/admin/settings");
  revalidatePath("/rules");
  revalidatePath("/dashboard");
  revalidatePath("/");
  return { success: true };
}
