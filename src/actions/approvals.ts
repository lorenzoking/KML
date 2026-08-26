"use server";

import { revalidatePath } from "next/cache";
import { SubmissionStatus, type ForceWinReason, type GameType } from "@/generated/prisma/client";
import { requireCommissioner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveSeason, getLeagueSettings } from "@/lib/league";
import {
  approvalSchema,
  commissionerFileGameSchema,
} from "@/lib/validations";
import { writeAuditLog } from "@/lib/audit";
import { awardsCoachXp, forceWinAwardsOpponentXp, xpFromApprovedGame } from "@/lib/xp";
import { hasFinalScores } from "@/lib/game-score";
import {
  applyReputationForApprovedGame,
  detectPrimetimeMatchup,
} from "@/lib/coach/reputation-from-game";

type ReviewableSubmission = {
  id: string;
  seasonId: string;
  week: number;
  gameType: GameType;
  submitterId: string;
  userTeamId: string;
  opponentTeamId: string;
  userScore: number | null;
  opponentScore: number | null;
  opponentSimScore: number | null;
  userTeamSimScore: number | null;
  isForceWin: boolean;
  forceWinReason: ForceWinReason | null;
  isPrimetime: boolean;
  skipXp: boolean;
  userTeam: { id: string; name: string; abbreviation: string };
  opponentTeam: { id: string; name: string; abbreviation: string };
};

async function approvePendingSubmission(
  commissionerId: string,
  submission: ReviewableSubmission,
  decisionNote: string
) {
  const settings = await getLeagueSettings();
  const scored = hasFinalScores(submission);
  const won = scored && submission.userScore! > submission.opponentScore!;
  const lost = scored && submission.userScore! < submission.opponentScore!;
  const winnerTeamId = submission.isForceWin
    ? submission.userTeamId
    : won
      ? submission.userTeamId
      : lost
        ? submission.opponentTeamId
        : null;
  const markedPrimetime = submission.isPrimetime;
  let isPrimetime = markedPrimetime;
  const grantXp = awardsCoachXp(submission.gameType, submission.skipXp);

  await prisma.$transaction(async (tx) => {
    isPrimetime =
      markedPrimetime ||
      (await detectPrimetimeMatchup(
        tx,
        submission.seasonId,
        submission.userTeamId,
        submission.opponentTeamId
      ));

    await tx.gameSubmission.update({
      where: { id: submission.id },
      data: {
        status: SubmissionStatus.APPROVED,
        reviewedById: commissionerId,
        reviewedAt: new Date(),
        decisionNote,
        isPrimetime,
      },
    });

    if (scored) {
      await tx.gameResult.create({
        data: {
          submissionId: submission.id,
          seasonId: submission.seasonId,
          week: submission.week,
          gameType: submission.gameType,
          homeTeamId: submission.userTeamId,
          awayTeamId: submission.opponentTeamId,
          homeScore: submission.userScore!,
          awayScore: submission.opponentScore!,
          opponentSimScore: submission.opponentSimScore,
          userTeamSimScore: submission.userTeamSimScore,
          winnerTeamId,
          isForceWin: submission.isForceWin,
          isPrimetime,
        },
      });
    }

    if (grantXp) {
      const xpEntries = xpFromApprovedGame({
        xpGamePlayed: settings.xpGamePlayed,
        xpWinBonus: settings.xpWinBonus,
        won,
        gameType: submission.gameType,
        isForceWin: submission.isForceWin,
        forceWinReason: submission.forceWinReason,
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
            createdById: commissionerId,
          },
        });
      }

      const awardOpponentXp =
        !submission.isForceWin ||
        forceWinAwardsOpponentXp(submission.forceWinReason);

      const opponentMembership = awardOpponentXp
        ? await tx.leagueMembership.findFirst({
            where: {
              franchiseId: submission.opponentTeamId,
              seasonId: submission.seasonId,
              isActive: true,
            },
          })
        : null;

      if (opponentMembership) {
        const oppXp = xpFromApprovedGame({
          xpGamePlayed: settings.xpGamePlayed,
          xpWinBonus: settings.xpWinBonus,
          won: lost,
          gameType: submission.gameType,
          isForceWin: submission.isForceWin,
          forceWinReason: submission.forceWinReason,
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
              createdById: commissionerId,
            },
          });
        }
      }
    }

    if (scored && !submission.isForceWin) {
      await applyReputationForApprovedGame(tx, {
        submissionId: submission.id,
        seasonId: submission.seasonId,
        week: submission.week,
        gameType: submission.gameType,
        userTeam: {
          id: submission.userTeam.id,
          name: submission.userTeam.name,
          abbreviation: submission.userTeam.abbreviation,
        },
        opponentTeam: {
          id: submission.opponentTeam.id,
          name: submission.opponentTeam.name,
          abbreviation: submission.opponentTeam.abbreviation,
        },
        userScore: submission.userScore!,
        opponentScore: submission.opponentScore!,
        winnerTeamId,
        submitterId: submission.submitterId,
        isPrimetime,
        createdById: commissionerId,
      });
    }
  });

  return { winnerTeamId, isPrimetime, grantXp };
}

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

  const { winnerTeamId, isPrimetime, grantXp } = await approvePendingSubmission(
    commissioner.id,
    submission,
    decisionNote || "Approved"
  );

  await writeAuditLog({
    actorId: commissioner.id,
    action: "APPROVE_GAME_SUBMISSION",
    entityType: "GameSubmission",
    entityId: submissionId,
    metadata: {
      winnerTeamId,
      userScore: submission.userScore,
      opponentScore: submission.opponentScore,
      opponentSimScore: submission.opponentSimScore,
      gameType: submission.gameType,
      awardsXp: grantXp,
      skipXp: submission.skipXp,
      isForceWin: submission.isForceWin,
      forceWinReason: submission.forceWinReason,
      isPrimetime,
    },
  });

  revalidateAll();
  return { success: true };
}

export async function commissionerFileGame(formData: FormData) {
  const commissioner = await requireCommissioner();
  const { season, settings } = await getActiveSeason();

  const parsed = commissionerFileGameSchema.safeParse({
    seasonNumber: formData.get("seasonNumber") ?? settings.currentSeason,
    week: formData.get("week") ?? settings.currentWeek,
    gameType: formData.get("gameType"),
    userTeamId: formData.get("userTeamId"),
    opponentTeamId: formData.get("opponentTeamId"),
    userScore: formData.get("userScore"),
    opponentScore: formData.get("opponentScore"),
    opponentSimScore: formData.get("opponentSimScore") || 3,
    userTeamSimScore: formData.get("userTeamSimScore") || undefined,
    isPrimetime: formData.get("isPrimetime") === "true",
    awardXp: formData.get("awardXp") === "true",
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid result" };
  }

  const data = parsed.data;
  const targetSeason =
    data.seasonNumber === season.number
      ? season
      : await prisma.season.findUnique({ where: { number: data.seasonNumber } });

  if (!targetSeason) return { error: "Season not found." };

  const duplicate = await prisma.gameSubmission.findFirst({
    where: {
      seasonId: targetSeason.id,
      week: data.week,
      status: { in: [SubmissionStatus.PENDING, SubmissionStatus.APPROVED] },
      OR: [
        {
          userTeamId: data.userTeamId,
          opponentTeamId: data.opponentTeamId,
        },
        {
          userTeamId: data.opponentTeamId,
          opponentTeamId: data.userTeamId,
        },
      ],
    },
  });

  if (duplicate) {
    return {
      error:
        "A pending or approved submission already exists for this matchup/week.",
    };
  }

  const homeMembership = await prisma.leagueMembership.findFirst({
    where: {
      franchiseId: data.userTeamId,
      seasonId: targetSeason.id,
      isActive: true,
      user: { deletedAt: null },
    },
    select: { userId: true },
  });

  const notes =
    data.notes?.trim() ||
    (data.awardXp
      ? "Commissioner filed — coaches did not submit. XP awarded."
      : "Commissioner filed — coaches did not submit, no XP awarded.");

  const skipXp = !data.awardXp;

  const created = await prisma.gameSubmission.create({
    data: {
      seasonId: targetSeason.id,
      week: data.week,
      gameType: data.gameType,
      submitterId: homeMembership?.userId ?? commissioner.id,
      userTeamId: data.userTeamId,
      opponentTeamId: data.opponentTeamId,
      userScore: data.userScore,
      opponentScore: data.opponentScore,
      opponentSimScore: data.opponentSimScore,
      userTeamSimScore: data.userTeamSimScore ?? null,
      isPrimetime: data.isPrimetime,
      notes,
      skipXp,
      filedByCommissioner: true,
      status: SubmissionStatus.PENDING,
    },
    include: {
      userTeam: true,
      opponentTeam: true,
    },
  });

  const { winnerTeamId, isPrimetime, grantXp } = await approvePendingSubmission(
    commissioner.id,
    created,
    data.awardXp ? "Commissioner filed" : "Commissioner filed — no coach XP"
  );

  await writeAuditLog({
    actorId: commissioner.id,
    action: "COMMISSIONER_FILE_GAME",
    entityType: "GameSubmission",
    entityId: created.id,
    metadata: {
      winnerTeamId,
      userScore: created.userScore,
      opponentScore: created.opponentScore,
      opponentSimScore: created.opponentSimScore,
      gameType: created.gameType,
      awardsXp: grantXp,
      skipXp,
      isPrimetime,
    },
  });

  revalidateAll();
  return { success: true, submissionId: created.id };
}

function revalidateAll() {
  revalidatePath("/admin");
  revalidatePath("/admin/approvals");
  revalidatePath("/admin/season");
  revalidatePath("/games", "layout");
  revalidatePath("/submissions");
  revalidatePath("/dashboard");
  revalidatePath("/standings");
  revalidatePath("/storylines", "layout");
  revalidatePath("/coach");
  revalidatePath("/coach/reputation");
  revalidatePath("/coach/hot-seat");
}
