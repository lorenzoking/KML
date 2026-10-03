"use server";

import { revalidatePath } from "next/cache";
import {
  Prisma,
  SubmissionStatus,
} from "@/generated/prisma/client";
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
import { safeEnsureSeasonSchedule, safeGetMissingScheduledGames } from "@/lib/schedule";
import { displayLeagueWeek, nextLeagueWeek } from "@/lib/league-week";
import { safeEnsurePlayoffSchedule } from "@/lib/playoff-schedule";
import { rollLeagueToNextSeason } from "@/lib/season-roll";

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

  const parsed = advanceSeasonSchema.safeParse({
    confirm: formData.get("confirm"),
    carryMemberships: formData.get("carryMemberships") !== "false",
  });

  if (!parsed.success) {
    return {
      error: "Type ADVANCE_SEASON in the confirm field to archive and start the next season.",
    };
  }

  const result = await rollLeagueToNextSeason({
    actorId: commissioner.id,
    carryMemberships: parsed.data.carryMemberships,
  });
  if ("error" in result) return result;

  revalidateSeasonPaths();
  revalidatePath("/admin/users");
  revalidatePath("/admin/teams");
  return { success: true, nextSeason: result.nextSeason };
}

function revalidateSeasonPaths() {
  revalidatePath("/admin");
  revalidatePath("/admin/season");
  revalidatePath("/admin/approvals");
  revalidatePath("/dashboard");
  revalidatePath("/games");
  revalidatePath("/champions");
  revalidatePath("/");
  revalidatePath("/standings");
  revalidatePath("/submissions");
  revalidatePath("/rules");
}

export async function advanceLeagueWeek() {
  const commissioner = await requireCommissioner();
  const { season, settings } = await getActiveSeason();

  const fromWeek = settings.currentWeek;
  const toWeek = nextLeagueWeek(fromWeek);
  if (toWeek == null) {
    return {
      error:
        "Already at the Super Bowl. Archive the season to start the next one.",
    };
  }

  const missing = await safeGetMissingScheduledGames(
    season.id,
    fromWeek,
    fromWeek
  );

  await prisma.leagueSetting.update({
    where: { key: "default" },
    data: { currentWeek: toWeek },
  });

  await safeEnsurePlayoffSchedule(season.id, toWeek);

  await writeAuditLog({
    actorId: commissioner.id,
    action: "ADVANCE_WEEK",
    entityType: "LeagueSetting",
    entityId: "default",
    metadata: {
      fromWeek,
      toWeek,
      fromLabel: displayLeagueWeek(fromWeek),
      toLabel: displayLeagueWeek(toWeek),
      missingCount: missing.length,
      missing: missing.map(
        (row) => `${row.away.abbreviation}@${row.home.abbreviation}`
      ),
    },
  });

  revalidateSeasonPaths();
  revalidatePath("/admin/settings");
  return {
    success: true,
    fromWeek,
    toWeek,
    missingCount: missing.length,
  };
}
