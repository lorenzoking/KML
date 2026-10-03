import { SeasonStatus, SubmissionStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { SUPER_BOWL_WEEK } from "@/lib/league-week";
import { releaseIndexedCompanionPayloads } from "@/lib/madden/index-dumps";
import { ensureSeasonSchedule } from "@/lib/schedule";

export async function rollLeagueToNextSeason(params: {
  actorId: string | null;
  carryMemberships: boolean;
}) {
  const season = await prisma.season.findFirst({
    where: { isActive: true },
    orderBy: { number: "desc" },
  });
  if (!season) return { error: "No active season to archive." };

  const settings = await prisma.leagueSetting.findUnique({
    where: { key: "default" },
  });
  if (!settings) return { error: "League settings are missing." };

  const nextNumber = season.number + 1;
  const existingNext = await prisma.season.findUnique({
    where: { number: nextNumber },
  });
  if (existingNext) {
    return { error: `Season ${nextNumber} already exists.` };
  }

  const activeMemberships = params.carryMemberships
    ? await prisma.leagueMembership.findMany({
        where: {
          seasonId: season.id,
          isActive: true,
          user: { isActive: true, deletedAt: null },
        },
      })
    : [];

  const titleGame = await prisma.gameResult.findFirst({
    where: {
      seasonId: season.id,
      week: SUPER_BOWL_WEEK,
      isVoided: false,
      winnerTeamId: { not: null },
    },
    orderBy: { createdAt: "desc" },
  });

  const nextSeason = await prisma.$transaction(async (tx) => {
    await tx.gameSubmission.updateMany({
      where: { seasonId: season.id, status: SubmissionStatus.PENDING },
      data: {
        status: SubmissionStatus.REJECTED,
        reviewedById: params.actorId,
        reviewedAt: new Date(),
        decisionNote: "Rejected automatically when season was archived",
      },
    });

    await tx.season.update({
      where: { id: season.id },
      data: {
        isActive: false,
        status: SeasonStatus.ARCHIVED,
        archivedAt: new Date(),
      },
    });

    const created = await tx.season.create({
      data: {
        number: nextNumber,
        name: `Season ${nextNumber}`,
        isActive: true,
        status: SeasonStatus.ACTIVE,
      },
    });

    if (activeMemberships.length > 0) {
      await tx.leagueMembership.createMany({
        data: activeMemberships.map((membership) => ({
          userId: membership.userId,
          franchiseId: membership.franchiseId,
          seasonId: created.id,
          isActive: true,
          startedWeek: 1,
        })),
      });

      await tx.coachProfile.updateMany({
        where: { userId: { in: activeMemberships.map((membership) => membership.userId) } },
        data: { contractYearsLeft: { decrement: 1 } },
      });
      await tx.coachProfile.updateMany({
        where: {
          userId: { in: activeMemberships.map((membership) => membership.userId) },
          contractYearsLeft: { lt: 0 },
        },
        data: { contractYearsLeft: 0 },
      });
    }

    if (titleGame?.winnerTeamId) {
      const championIsHome = titleGame.winnerTeamId === titleGame.homeTeamId;
      await tx.seasonTitle.create({
        data: {
          seasonNumber: season.number,
          championFranchiseId: titleGame.winnerTeamId,
          runnerUpFranchiseId: championIsHome
            ? titleGame.awayTeamId
            : titleGame.homeTeamId,
          championScore: championIsHome ? titleGame.homeScore : titleGame.awayScore,
          runnerUpScore: championIsHome ? titleGame.awayScore : titleGame.homeScore,
        },
      });
    }

    await tx.leagueSetting.update({
      where: { key: "default" },
      data: {
        currentSeason: nextNumber,
        currentWeek: 1,
      },
    });

    await tx.maddenTeam.updateMany({
      data: { wins: 0, losses: 0, ties: 0, ptsFor: 0, ptsAgainst: 0 },
    });

    return created;
  });

  await ensureSeasonSchedule(nextSeason.id);
  await releaseIndexedCompanionPayloads();

  await writeAuditLog({
    actorId: params.actorId,
    action: "ADVANCE_SEASON",
    entityType: "Season",
    entityId: nextSeason.id,
    metadata: {
      fromSeason: season.number,
      toSeason: nextNumber,
      carriedMemberships: activeMemberships.length,
      previousSeasonId: season.id,
      leagueName: settings.leagueName,
      championFranchiseId: titleGame?.winnerTeamId ?? null,
    },
  });

  return { success: true as const, nextSeason: nextSeason.number };
}
