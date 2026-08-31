import { revalidatePath } from "next/cache";
import { SubmissionStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { maddenUndeclaredForceWinXpReason } from "@/lib/xp";
import { maddenResultKind } from "@/lib/madden/game-status";
import { franchiseIdForMaddenTeam } from "@/lib/madden/franchises";
import { getMaddenWeekContext } from "@/lib/madden/week-context";

async function matchupHasSiteTicket(
  seasonId: string,
  week: number,
  homeFranchiseId: string,
  awayFranchiseId: string
) {
  const ticket = await prisma.gameSubmission.findFirst({
    where: {
      seasonId,
      week,
      status: {
        in: [
          SubmissionStatus.PENDING,
          SubmissionStatus.APPROVED,
          SubmissionStatus.REJECTED,
        ],
      },
      OR: [
        { userTeamId: homeFranchiseId, opponentTeamId: awayFranchiseId },
        { userTeamId: awayFranchiseId, opponentTeamId: homeFranchiseId },
      ],
    },
    select: { id: true },
  });
  return Boolean(ticket);
}

/**
 * Leftover CPU sims (Madden status 3 after the week is closed) with no site
 * ticket: game-played XP for the winning coach only.
 */
export async function awardUndeclaredForceWinXp(scheduleIds: string[]) {
  if (scheduleIds.length === 0) return 0;

  let ctx: Awaited<ReturnType<typeof getMaddenWeekContext>>;
  try {
    ctx = await getMaddenWeekContext();
  } catch (error) {
    console.error("Undeclared force-win XP skipped — no active season", error);
    return 0;
  }
  const { season, settings } = ctx;

  const games = await prisma.maddenGame.findMany({
    where: {
      scheduleId: { in: scheduleIds },
    },
    include: {
      homeTeam: { select: { franchiseId: true, abbr: true } },
      awayTeam: { select: { franchiseId: true, abbr: true } },
    },
  });

  let granted = 0;

  for (const game of games) {
    const week = game.weekIndex + 1;
    if (
      maddenResultKind({
        status: game.status,
        homeScore: game.homeScore,
        awayScore: game.awayScore,
        week,
        currentWeek: ctx.currentWeek,
        currentWeekStillOpen: ctx.currentWeekStillOpen,
      }) !== "simulated"
    ) {
      continue;
    }
    if (game.homeScore === game.awayScore) continue;

    const homeFranchiseId = await franchiseIdForMaddenTeam(game.homeTeam);
    const awayFranchiseId = await franchiseIdForMaddenTeam(game.awayTeam);
    if (!homeFranchiseId || !awayFranchiseId) continue;

    if (await matchupHasSiteTicket(season.id, week, homeFranchiseId, awayFranchiseId)) {
      continue;
    }

    const homeWon = game.homeScore > game.awayScore;
    const winnerFranchiseId = homeWon ? homeFranchiseId : awayFranchiseId;
    const reason = maddenUndeclaredForceWinXpReason(week, game.scheduleId);

    const already = await prisma.xPAdjustment.findFirst({
      where: { seasonId: season.id, reason },
      select: { id: true },
    });
    if (already) continue;

    const winnerMembership = await prisma.leagueMembership.findFirst({
      where: {
        franchiseId: winnerFranchiseId,
        seasonId: season.id,
        isActive: true,
        user: { isActive: true, deletedAt: null },
      },
      select: { userId: true },
    });
    if (!winnerMembership) continue;

    await prisma.xPAdjustment.create({
      data: {
        userId: winnerMembership.userId,
        franchiseId: winnerFranchiseId,
        seasonId: season.id,
        amount: settings.xpGamePlayed,
        reason,
        isAutomatic: true,
      },
    });

    await writeAuditLog({
      action: "MADDEN_UNDECLARED_FORCE_WIN_XP",
      entityType: "MaddenGame",
      entityId: game.id,
      metadata: {
        scheduleId: game.scheduleId,
        week,
        winnerFranchiseId,
        userId: winnerMembership.userId,
        homeScore: game.homeScore,
        awayScore: game.awayScore,
      },
    });

    granted += 1;
  }

  if (granted > 0) {
    try {
      revalidatePath("/dashboard");
      revalidatePath("/coach");
      revalidatePath("/admin");
    } catch (error) {
      console.error("Failed to revalidate after undeclared force-win XP", error);
    }
  }

  return granted;
}
