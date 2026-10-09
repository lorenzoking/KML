import { SubmissionStatus } from "@/generated/prisma/client";
import {
  NFL_REGULAR_SEASON_WEEKS,
  siteWeekFromMaddenIndex,
} from "@/lib/league-week";
import { franchiseIdForMaddenTeam } from "@/lib/madden/franchises";
import {
  dedupeWeekMatchups,
  planCompanionWeek,
} from "@/lib/madden/schedule-rows";
import { syncMaddenScoresToOpenGames } from "@/lib/madden/sync-scores";
import { prisma } from "@/lib/prisma";

/**
 * When Companion has a real slate for this season, that slate replaces the
 * placeholder NFL schedule. Weeks Madden has not exported yet stay off the
 * board so coaches are not looking at the wrong opponents.
 *
 * A filed result locks that matchup only. The rest of the week still updates,
 * so one Sim Score cannot freeze Week 4 after a fresh export.
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
    orderBy: { updatedAt: "desc" },
  });
  if (games.length === 0) return false;

  const byWeek = new Map<number, typeof games>();
  for (const game of games) {
    const week = siteWeekFromMaddenIndex(game.weekIndex);
    if (week < 1 || week > NFL_REGULAR_SEASON_WEEKS) continue;
    const slate = byWeek.get(week) ?? [];
    slate.push(game);
    byWeek.set(week, slate);
  }

  const [scheduled, live] = await Promise.all([
    prisma.scheduledGame.findMany({
      where: { seasonId, week: { lte: NFL_REGULAR_SEASON_WEEKS } },
      select: {
        id: true,
        week: true,
        homeTeamId: true,
        awayTeamId: true,
        isPrimetime: true,
      },
    }),
    prisma.gameSubmission.findMany({
      where: {
        seasonId,
        week: { lte: NFL_REGULAR_SEASON_WEEKS },
        status: { in: [SubmissionStatus.PENDING, SubmissionStatus.APPROVED] },
      },
      select: { week: true, userTeamId: true, opponentTeamId: true },
    }),
  ]);

  const scheduledByWeek = new Map<number, typeof scheduled>();
  for (const game of scheduled) {
    const slate = scheduledByWeek.get(game.week) ?? [];
    slate.push(game);
    scheduledByWeek.set(game.week, slate);
  }
  const liveByWeek = new Map<number, typeof live>();
  for (const game of live) {
    const slate = liveByWeek.get(game.week) ?? [];
    slate.push(game);
    liveByWeek.set(game.week, slate);
  }

  const scheduleIds: string[] = [];
  for (const [week, slate] of byWeek) {
    const ranked = [...slate].sort((a, b) => {
      const mapped = (game: typeof a) =>
        game.homeTeam.franchiseId && game.awayTeam.franchiseId ? 1 : 0;
      const preference = mapped(b) - mapped(a);
      if (preference !== 0) return preference;
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });
    const deduped = dedupeWeekMatchups(ranked);
    const incoming = [];
    let unmapped = 0;
    for (const game of deduped) {
      const homeTeamId = await franchiseIdForMaddenTeam(game.homeTeam);
      const awayTeamId = await franchiseIdForMaddenTeam(game.awayTeam);
      if (!homeTeamId || !awayTeamId || homeTeamId === awayTeamId) {
        unmapped += 1;
        continue;
      }
      incoming.push({
        homeTeamId,
        awayTeamId,
        isPrimetime: game.isGameOfTheWeek,
      });
    }
    if (incoming.length === 0) {
      console.error(
        `Companion week ${week} was not applied; no games mapped to a franchise`
      );
      continue;
    }
    if (unmapped > 0) {
      console.error(
        `Companion week ${week} is missing ${unmapped} game(s) that did not map to a franchise`
      );
    }

    const plan = planCompanionWeek({
      existing: scheduledByWeek.get(week) ?? [],
      incoming,
      livePairs: (liveByWeek.get(week) ?? []).map((game) => ({
        homeTeamId: game.userTeamId,
        awayTeamId: game.opponentTeamId,
      })),
    });
    if (plan.deleteIds.length === 0 && plan.create.length === 0) {
      scheduleIds.push(...deduped.map((game) => game.scheduleId));
      continue;
    }

    try {
      await prisma.$transaction(async (tx) => {
        if (plan.deleteIds.length > 0) {
          await tx.scheduledGame.deleteMany({
            where: { id: { in: plan.deleteIds } },
          });
        }
        if (plan.create.length > 0) {
          await tx.scheduledGame.createMany({
            data: plan.create.map((row) => ({
              seasonId,
              week,
              homeTeamId: row.homeTeamId,
              awayTeamId: row.awayTeamId,
              isPrimetime: row.isPrimetime,
            })),
            skipDuplicates: true,
          });
        }
      });
      scheduleIds.push(...deduped.map((game) => game.scheduleId));
    } catch (error) {
      console.error("Companion schedule week failed", week, error);
    }
  }

  for (const [week, existing] of scheduledByWeek) {
    if (byWeek.has(week)) continue;
    const plan = planCompanionWeek({
      existing,
      incoming: [],
      livePairs: (liveByWeek.get(week) ?? []).map((game) => ({
        homeTeamId: game.userTeamId,
        awayTeamId: game.opponentTeamId,
      })),
    });
    if (plan.deleteIds.length === 0) continue;
    await prisma.scheduledGame.deleteMany({
      where: { id: { in: plan.deleteIds } },
    });
  }

  if (scheduleIds.length > 0) {
    await syncMaddenScoresToOpenGames(scheduleIds, { weekType: "reg" });
  }
  return true;
}
