import { SubmissionStatus } from "@/generated/prisma/client";
import { NFL_REGULAR_SEASON_WEEKS } from "@/lib/league-week";
import { franchiseIdForMaddenTeam } from "@/lib/madden/franchises";
import { syncMaddenScoresToOpenGames } from "@/lib/madden/sync-scores";
import { prisma } from "@/lib/prisma";

/**
 * When Companion has a real slate for this season, that slate replaces the
 * placeholder NFL schedule. Weeks Madden has not exported yet stay off the
 * board so coaches are not looking at the wrong opponents.
 */
export async function applyCompanionSchedule(seasonId: string, seasonNumber: number) {
  const games = await prisma.maddenGame.findMany({
    where: {
      seasonNumber,
      weekIndex: { lt: NFL_REGULAR_SEASON_WEEKS },
    },
    include: {
      homeTeam: {
        select: { franchiseId: true, abbr: true, nickName: true, displayName: true },
      },
      awayTeam: {
        select: { franchiseId: true, abbr: true, nickName: true, displayName: true },
      },
    },
  });
  if (games.length === 0) return false;

  const companionWeeks = new Set(games.map((game) => game.weekIndex + 1));
  const scheduledWeeks = await prisma.scheduledGame.findMany({
    where: { seasonId, week: { lte: NFL_REGULAR_SEASON_WEEKS } },
    distinct: ["week"],
    select: { week: true },
  });

  for (const row of scheduledWeeks) {
    if (companionWeeks.has(row.week)) continue;
    if (await weekHasLiveScore(seasonId, row.week)) continue;
    await prisma.scheduledGame.deleteMany({
      where: { seasonId, week: row.week },
    });
  }

  const scheduleIds: string[] = [];
  for (const week of companionWeeks) {
    if (await weekHasLiveScore(seasonId, week)) continue;
    const slate = games.filter((game) => game.weekIndex + 1 === week);
    const rows = [];
    for (const game of slate) {
      const homeTeamId = await franchiseIdForMaddenTeam(game.homeTeam);
      const awayTeamId = await franchiseIdForMaddenTeam(game.awayTeam);
      if (!homeTeamId || !awayTeamId || homeTeamId === awayTeamId) continue;
      rows.push({
        seasonId,
        week,
        homeTeamId,
        awayTeamId,
        isPrimetime: game.isGameOfTheWeek,
      });
      scheduleIds.push(game.scheduleId);
    }
    if (rows.length === 0) continue;
    await prisma.scheduledGame.deleteMany({ where: { seasonId, week } });
    await prisma.scheduledGame.createMany({ data: rows });
  }

  if (scheduleIds.length > 0) {
    await syncMaddenScoresToOpenGames(scheduleIds, { weekType: "reg" });
  }
  return true;
}

async function weekHasLiveScore(seasonId: string, week: number) {
  const live = await prisma.gameSubmission.count({
    where: {
      seasonId,
      week,
      status: { in: [SubmissionStatus.PENDING, SubmissionStatus.APPROVED] },
    },
  });
  return live > 0;
}
