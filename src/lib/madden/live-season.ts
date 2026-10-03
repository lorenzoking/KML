import { prisma } from "@/lib/prisma";

/** The season Companion exports should write, and live league pages should read. */
export async function liveMaddenSeason() {
  const season = await prisma.season.findFirst({
    where: { isActive: true },
    select: { id: true, number: true },
  });
  if (season) return season;
  const settings = await prisma.leagueSetting.findUnique({
    where: { key: "default" },
    select: { currentSeason: true },
  });
  return { id: "", number: settings?.currentSeason ?? 1 };
}
