import { getActiveSeason } from "@/lib/league";
import { prisma } from "@/lib/prisma";
import { MaddenScheduleStatus } from "@/lib/madden/game-status";

export async function getMaddenWeekContext() {
  const { season, settings } = await getActiveSeason();
  const currentWeek = settings.currentWeek;
  const currentWeekStillOpen =
    (await prisma.maddenGame.count({
      where: {
        weekIndex: currentWeek - 1,
        status: MaddenScheduleStatus.UNPLAYED,
      },
    })) > 0;
  return { season, settings, currentWeek, currentWeekStillOpen };
}
