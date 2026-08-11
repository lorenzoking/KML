"use server";

import { revalidatePath } from "next/cache";
import { SubmissionStatus } from "@prisma/client";
import { requireCommissioner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLeagueSettings } from "@/lib/league";
import { approvalSchema } from "@/lib/validations";
import { writeAuditLog } from "@/lib/audit";
import { awardsCoachXp, xpFromApprovedGame } from "@/lib/xp";

export async function reviewSubmission(formData: FormData) {
  const commissioner = await requireCommissioner();

  const parsed = approvalSchema.safeParse({
    submissionId: formData.get("submissionId"),
    decision: formData.get("decision"),
    decisionNote: formData.get("decisionNote") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid review" };
  }

  const { submissionId, decision, decisionNote } = parsed.data;

  const submission = await prisma.gameSubmission.findUnique({
    where: { id: submissionId },
    include: {
      submitter: true,
      userTeam: true,
      opponentTeam: true,
      result: true,
    },
  });

  if (!submission) return { error: "Submission not found." };
  if (submission.status !== SubmissionStatus.PENDING) {
    return { error: "Only pending submissions can be reviewed." };
  }

  if (decision === "REJECT") {
    await prisma.gameSubmission.update({
      where: { id: submissionId },
      data: {
        status: SubmissionStatus.REJECTED,
        reviewedById: commissioner.id,
        reviewedAt: new Date(),
        decisionNote: decisionNote || "Rejected by commissioner",
      },
    });

    await writeAuditLog({
      actorId: commissioner.id,
      action: "REJECT_GAME_SUBMISSION",
      entityType: "GameSubmission",
      entityId: submissionId,
      metadata: { decisionNote },
    });

    revalidateAll();
    return { success: true };
  }

  const settings = await getLeagueSettings();
  const won = submission.userScore > submission.opponentScore;
  const lost = submission.userScore < submission.opponentScore;
  const winnerTeamId = won
    ? submission.userTeamId
    : lost
      ? submission.opponentTeamId
      : null;

  await prisma.$transaction(async (tx) => {
    await tx.gameSubmission.update({
      where: { id: submissionId },
      data: {
        status: SubmissionStatus.APPROVED,
        reviewedById: commissioner.id,
        reviewedAt: new Date(),
        decisionNote: decisionNote || "Approved",
      },
    });

    await tx.gameResult.create({
      data: {
        submissionId: submission.id,
        seasonId: submission.seasonId,
        week: submission.week,
        gameType: submission.gameType,
        homeTeamId: submission.userTeamId,
        awayTeamId: submission.opponentTeamId,
        homeScore: submission.userScore,
        awayScore: submission.opponentScore,
        simScore: submission.simScore,
        winnerTeamId,
      },
    });

    // Simulated games update standings/results but do not award coach XP.
    if (awardsCoachXp(submission.gameType)) {
      const xpEntries = xpFromApprovedGame({
        xpGamePlayed: settings.xpGamePlayed,
        xpWinBonus: settings.xpWinBonus,
        won,
        gameType: submission.gameType,
      });

      for (const entry of xpEntries) {
        await tx.xPAdjustment.create({
          data: {
            userId: submission.submitterId,
            franchiseId: submission.userTeamId,
            seasonId: submission.seasonId,
            amount: entry.amount,
            reason: `Week ${submission.week} ${entry.reason.toLowerCase()}`,
            isAutomatic: true,
            submissionId: submission.id,
            createdById: commissioner.id,
          },
        });
      }

      // Award opponent coach if assigned
      const opponentMembership = await tx.leagueMembership.findFirst({
        where: {
          franchiseId: submission.opponentTeamId,
          seasonId: submission.seasonId,
          isActive: true,
        },
      });

      if (opponentMembership) {
        const oppWon = lost;
        const oppXp = xpFromApprovedGame({
          xpGamePlayed: settings.xpGamePlayed,
          xpWinBonus: settings.xpWinBonus,
          won: oppWon,
          gameType: submission.gameType,
        });
        for (const entry of oppXp) {
          await tx.xPAdjustment.create({
            data: {
              userId: opponentMembership.userId,
              franchiseId: submission.opponentTeamId,
              seasonId: submission.seasonId,
              amount: entry.amount,
              reason: `Week ${submission.week} ${entry.reason.toLowerCase()}`,
              isAutomatic: true,
              submissionId: submission.id,
              createdById: commissioner.id,
            },
          });
        }
      }
    }
  });

  await writeAuditLog({
    actorId: commissioner.id,
    action: "APPROVE_GAME_SUBMISSION",
    entityType: "GameSubmission",
    entityId: submissionId,
    metadata: {
      winnerTeamId,
      userScore: submission.userScore,
      opponentScore: submission.opponentScore,
      simScore: submission.simScore,
      gameType: submission.gameType,
      awardsXp: awardsCoachXp(submission.gameType),
    },
  });

  revalidateAll();
  return { success: true };
}

function revalidateAll() {
  revalidatePath("/admin");
  revalidatePath("/admin/approvals");
  revalidatePath("/games");
  revalidatePath("/submissions");
  revalidatePath("/dashboard");
  revalidatePath("/standings");
}
