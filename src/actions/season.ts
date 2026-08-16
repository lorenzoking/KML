"use server";

import { revalidatePath } from "next/cache";
import {
  Prisma,
  SeasonStatus,
  SubmissionStatus,
} from "@prisma/client";
import { requireCommissioner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveSeason } from "@/lib/league";
import {
  advanceSeasonSchema,
  resetSeasonGamesSchema,
  voidGameSchema,
} from "@/lib/validations";
import { writeAuditLog } from "@/lib/audit";
import { reverseAutomaticReputation } from "@/lib/coach/reputation-from-game";

async function voidSubmissionInTx(
  tx: Prisma.TransactionClient,
  submissionId: string,
  commissionerId: string,
  voidReason: string
) {
  const submission = await tx.gameSubmission.findUnique({
    where: { id: submissionId },
    include: { result: true },
  });

  if (!submission) {
    throw new Error("Submission not found.");
  }

  if (submission.status === SubmissionStatus.VOIDED) {
    throw new Error("Game is already voided.");
  }

  await tx.gameSubmission.update({
    where: { id: submissionId },
    data: {
      status: SubmissionStatus.VOIDED,
      reviewedById: commissionerId,
      reviewedAt: new Date(),
      decisionNote: voidReason,
    },
  });

  if (submission.result) {
    await tx.gameResult.update({
      where: { id: submission.result.id },
      data: {
        isVoided: true,
        voidedAt: new Date(),
        voidedById: commissionerId,
        voidReason,
      },
    });
  }

  // Reverse automatic XP granted for this submission
  const autoXp = await tx.xPAdjustment.findMany({
    where: {
      submissionId,
      isAutomatic: true,
    },
  });

  for (const row of autoXp) {
    await tx.xPAdjustment.create({
      data: {
        userId: row.userId,
        franchiseId: row.franchiseId,
        seasonId: row.seasonId,
        amount: -row.amount,
        reason: `Void reversal: ${row.reason}`,
        isAutomatic: true,
        submissionId,
        createdById: commissionerId,
      },
    });
  }

  await reverseAutomaticReputation(tx, submissionId, commissionerId);

  return submission;
}

export async function voidGame(formData: FormData) {
  const commissioner = await requireCommissioner();

  const parsed = voidGameSchema.safeParse({
    submissionId: formData.get("submissionId"),
    voidReason: formData.get("voidReason"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid void request" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await voidSubmissionInTx(
        tx,
        parsed.data.submissionId,
        commissioner.id,
        parsed.data.voidReason
      );
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to void game",
    };
  }

  await writeAuditLog({
    actorId: commissioner.id,
    action: "VOID_GAME",
    entityType: "GameSubmission",
    entityId: parsed.data.submissionId,
    metadata: { voidReason: parsed.data.voidReason },
  });

  revalidateSeasonPaths();
  return { success: true };
}

export async function resetCurrentSeasonGames(formData: FormData) {
  const commissioner = await requireCommissioner();
  const { season } = await getActiveSeason();

  const parsed = resetSeasonGamesSchema.safeParse({
    confirm: formData.get("confirm"),
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    return {
      error:
        'Type RESET_GAMES in the confirm field and provide a reason to continue.',
    };
  }

  const submissions = await prisma.gameSubmission.findMany({
    where: {
      seasonId: season.id,
      status: { in: [SubmissionStatus.APPROVED, SubmissionStatus.PENDING] },
    },
    select: { id: true, status: true },
  });

  await prisma.$transaction(async (tx) => {
    for (const submission of submissions) {
      if (submission.status === SubmissionStatus.PENDING) {
        await tx.gameSubmission.update({
          where: { id: submission.id },
          data: {
            status: SubmissionStatus.REJECTED,
            reviewedById: commissioner.id,
            reviewedAt: new Date(),
            decisionNote: `Season games reset: ${parsed.data.reason}`,
          },
        });
        continue;
      }

      await voidSubmissionInTx(
        tx,
        submission.id,
        commissioner.id,
        `Season games reset: ${parsed.data.reason}`
      );
    }
  });

  await writeAuditLog({
    actorId: commissioner.id,
    action: "RESET_SEASON_GAMES",
    entityType: "Season",
    entityId: season.id,
    metadata: {
      reason: parsed.data.reason,
      affected: submissions.length,
      seasonNumber: season.number,
    },
  });

  revalidateSeasonPaths();
  return { success: true, affected: submissions.length };
}

export async function advanceToNextSeason(formData: FormData) {
  const commissioner = await requireCommissioner();
  const { season, settings } = await getActiveSeason();

  const parsed = advanceSeasonSchema.safeParse({
    confirm: formData.get("confirm"),
    carryMemberships: formData.get("carryMemberships") !== "false",
  });

  if (!parsed.success) {
    return {
      error: "Type ADVANCE_SEASON in the confirm field to archive and start the next season.",
    };
  }

  const nextNumber = season.number + 1;
  const existingNext = await prisma.season.findUnique({
    where: { number: nextNumber },
  });
  if (existingNext) {
    return {
      error: `Season ${nextNumber} already exists. Update league settings carefully or void games instead.`,
    };
  }

  const activeMemberships = parsed.data.carryMemberships
    ? await prisma.leagueMembership.findMany({
        where: {
          seasonId: season.id,
          isActive: true,
          user: { isActive: true, deletedAt: null },
        },
      })
    : [];

  const result = await prisma.$transaction(async (tx) => {
    // Reject leftover pending submissions on the closing season
    await tx.gameSubmission.updateMany({
      where: { seasonId: season.id, status: SubmissionStatus.PENDING },
      data: {
        status: SubmissionStatus.REJECTED,
        reviewedById: commissioner.id,
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

    const nextSeason = await tx.season.create({
      data: {
        number: nextNumber,
        name: `Season ${nextNumber}`,
        isActive: true,
        status: SeasonStatus.ACTIVE,
      },
    });

    if (activeMemberships.length > 0) {
      await tx.leagueMembership.createMany({
        data: activeMemberships.map((m) => ({
          userId: m.userId,
          franchiseId: m.franchiseId,
          seasonId: nextSeason.id,
          isActive: true,
          startedWeek: 1,
        })),
      });

      await tx.coachProfile.updateMany({
        where: { userId: { in: activeMemberships.map((m) => m.userId) } },
        data: {
          contractYearsLeft: {
            decrement: 1,
          },
        },
      });
      await tx.coachProfile.updateMany({
        where: {
          userId: { in: activeMemberships.map((m) => m.userId) },
          contractYearsLeft: { lt: 0 },
        },
        data: { contractYearsLeft: 0 },
      });
    }

    await tx.leagueSetting.update({
      where: { key: "default" },
      data: {
        currentSeason: nextNumber,
        currentWeek: 1,
      },
    });

    return nextSeason;
  });

  await writeAuditLog({
    actorId: commissioner.id,
    action: "ADVANCE_SEASON",
    entityType: "Season",
    entityId: result.id,
    metadata: {
      fromSeason: season.number,
      toSeason: nextNumber,
      carriedMemberships: activeMemberships.length,
      previousSeasonId: season.id,
      leagueName: settings.leagueName,
    },
  });

  revalidateSeasonPaths();
  revalidatePath("/admin/users");
  revalidatePath("/admin/teams");
  return { success: true, nextSeason: result.number };
}

function revalidateSeasonPaths() {
  revalidatePath("/admin");
  revalidatePath("/admin/season");
  revalidatePath("/admin/approvals");
  revalidatePath("/dashboard");
  revalidatePath("/games");
  revalidatePath("/standings");
  revalidatePath("/submissions");
  revalidatePath("/rules");
}
