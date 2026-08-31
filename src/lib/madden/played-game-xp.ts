import { revalidatePath } from "next/cache";
import { SubmissionStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { franchiseIdForMaddenTeam } from "@/lib/madden/franchises";
import { maddenResultKind } from "@/lib/madden/game-status";
import { getMaddenWeekContext } from "@/lib/madden/week-context";

const COMPANION_MISFILED_SIM_NOTE = "CPU sim — treated as an undeclared force win";

function weekPlayXpNet(rows: { amount: number; reason: string }[], week: number) {
  const re = new RegExp(`week ${week}.*(game played|force win)`, "i");
  return rows.filter((row) => re.test(row.reason)).reduce((sum, row) => sum + row.amount, 0);
}

function weekWinBonusNet(rows: { amount: number; reason: string }[], week: number) {
  const re = new RegExp(`week ${week} win bonus`, "i");
  return rows.filter((row) => re.test(row.reason)).reduce((sum, row) => sum + row.amount, 0);
}

async function coachForPlayedGame(
  seasonId: string,
  franchiseId: string,
  week: number
) {
  const covering = await prisma.leagueMembership.findFirst({
    where: {
      seasonId,
      franchiseId,
      startedWeek: { lte: week },
      OR: [{ endedWeek: null }, { endedWeek: { gte: week } }],
      user: { deletedAt: null },
    },
    select: { userId: true },
    orderBy: { assignedAt: "desc" },
  });
  if (covering) return covering.userId;
  const current = await prisma.leagueMembership.findFirst({
    where: {
      seasonId,
      franchiseId,
      isActive: true,
      user: { isActive: true, deletedAt: null },
    },
    select: { userId: true },
  });
  return current?.userId ?? null;
}

async function grantPlayedXp(params: {
  userId: string;
  franchiseId: string;
  seasonId: string;
  week: number;
  amount: number;
  reason: string;
  submissionId?: string | null;
}) {
  await prisma.xPAdjustment.create({
    data: {
      userId: params.userId,
      franchiseId: params.franchiseId,
      seasonId: params.seasonId,
      amount: params.amount,
      reason: params.reason,
      isAutomatic: true,
      submissionId: params.submissionId ?? undefined,
    },
  });
}

/**
 * Played Madden games (status 2, or a scored game while the current week
 * is still open) award game-played XP to both coaches and a win bonus to
 * the winner. Companion leftover sims do not use this path.
 */
export async function ensurePlayedGameXp(scheduleIds?: string[]) {
  let ctx: Awaited<ReturnType<typeof getMaddenWeekContext>>;
  try {
    ctx = await getMaddenWeekContext();
  } catch (error) {
    console.error("Played-game XP skipped — no active season", error);
    return 0;
  }

  const games = await prisma.maddenGame.findMany({
    where: scheduleIds?.length ? { scheduleId: { in: scheduleIds } } : undefined,
    include: {
      homeTeam: { select: { franchiseId: true, abbr: true } },
      awayTeam: { select: { franchiseId: true, abbr: true } },
    },
  });

  let granted = 0;

  for (const game of games) {
    const week = game.weekIndex + 1;
    const kind = maddenResultKind({
      status: game.status,
      homeScore: game.homeScore,
      awayScore: game.awayScore,
      week,
      currentWeek: ctx.currentWeek,
      currentWeekStillOpen: ctx.currentWeekStillOpen,
    });
    if (kind !== "played") continue;
    if (game.homeScore === game.awayScore) continue;

    const homeFranchiseId = await franchiseIdForMaddenTeam(game.homeTeam);
    const awayFranchiseId = await franchiseIdForMaddenTeam(game.awayTeam);
    if (!homeFranchiseId || !awayFranchiseId) continue;

    const submission = await prisma.gameSubmission.findFirst({
      where: {
        seasonId: ctx.season.id,
        week,
        status: { in: [SubmissionStatus.PENDING, SubmissionStatus.APPROVED] },
        OR: [
          { userTeamId: homeFranchiseId, opponentTeamId: awayFranchiseId },
          { userTeamId: awayFranchiseId, opponentTeamId: homeFranchiseId },
        ],
      },
      include: { result: { select: { id: true } } },
    });

    if (
      submission?.isForceWin &&
      submission.notes?.includes(COMPANION_MISFILED_SIM_NOTE)
    ) {
      await prisma.gameSubmission.update({
        where: { id: submission.id },
        data: { isForceWin: false, forceWinReason: null },
      });
      if (submission.result) {
        await prisma.gameResult.update({
          where: { id: submission.result.id },
          data: { isForceWin: false },
        });
      }
      submission.isForceWin = false;
    }

    if (submission?.isForceWin) continue;
    if (submission?.gameType === "SIMULATED") continue;

    const homeWon = game.homeScore > game.awayScore;
    const sides = [
      { franchiseId: homeFranchiseId, won: homeWon },
      { franchiseId: awayFranchiseId, won: !homeWon },
    ] as const;

    for (const side of sides) {
      const userId = await coachForPlayedGame(ctx.season.id, side.franchiseId, week);
      if (!userId) continue;

      const existing = await prisma.xPAdjustment.findMany({
        where: { seasonId: ctx.season.id, franchiseId: side.franchiseId },
        select: { amount: true, reason: true },
      });

      if (weekPlayXpNet(existing, week) <= 0) {
        await grantPlayedXp({
          userId,
          franchiseId: side.franchiseId,
          seasonId: ctx.season.id,
          week,
          amount: ctx.settings.xpGamePlayed,
          reason: `Week ${week} game played`,
          submissionId: submission?.id,
        });
        granted += 1;
      }

      if (side.won && weekWinBonusNet(existing, week) <= 0) {
        await grantPlayedXp({
          userId,
          franchiseId: side.franchiseId,
          seasonId: ctx.season.id,
          week,
          amount: ctx.settings.xpWinBonus,
          reason: `Week ${week} win bonus`,
          submissionId: submission?.id,
        });
        granted += 1;
      }
    }
  }

  if (granted > 0) {
    await writeAuditLog({
      action: "MADDEN_PLAYED_GAME_XP",
      entityType: "XPAdjustment",
      metadata: { granted, scheduleCount: games.length },
    });
    try {
      revalidatePath("/dashboard");
      revalidatePath("/coach");
      revalidatePath("/admin");
      revalidatePath("/standings");
    } catch (error) {
      console.error("Failed to revalidate after played-game XP", error);
    }
  }

  return granted;
}
