"use server";

import { revalidatePath } from "next/cache";
import { SubmissionStatus } from "@/generated/prisma/client";
import { requireUser, isCommissioner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveSeason, getUserMembership } from "@/lib/league";
import { gameSubmissionSchema, simScoreSubmissionSchema, forceWinScoreSchema } from "@/lib/validations";
import { writeAuditLog } from "@/lib/audit";
import { findMaddenScoreForMatchup } from "@/lib/madden/matchup-score";

export async function submitGameResult(formData: FormData) {
  const user = await requireUser();
  const { season, settings } = await getActiveSeason();
  const membership = await getUserMembership(user.id, season.id);

  if (!membership) {
    return { error: "You must be assigned to a franchise before submitting." };
  }

  const parsed = gameSubmissionSchema.safeParse({
    seasonNumber: formData.get("seasonNumber") ?? settings.currentSeason,
    week: formData.get("week") ?? settings.currentWeek,
    gameType: formData.get("gameType"),
    opponentTeamId: formData.get("opponentTeamId"),
    userScore: formData.get("userScore") || undefined,
    opponentScore: formData.get("opponentScore") || undefined,
    opponentSimScore: formData.get("opponentSimScore") || undefined,
    isForceWin: formData.get("isForceWin") === "true",
    forceWinReason: formData.get("forceWinReason") || undefined,
    isPrimetime: formData.get("isPrimetime") === "true",
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid submission" };
  }

  const data = parsed.data;

  if (data.opponentTeamId === membership.franchiseId) {
    return { error: "Opponent cannot be your own team." };
  }

  const targetSeason =
    data.seasonNumber === season.number
      ? season
      : await prisma.season.findUnique({ where: { number: data.seasonNumber } });

  if (!targetSeason) {
    return { error: "Season not found." };
  }

  const duplicate = await prisma.gameSubmission.findFirst({
    where: {
      seasonId: targetSeason.id,
      week: data.week,
      // Voided/rejected games may be resubmitted
      status: { in: [SubmissionStatus.PENDING, SubmissionStatus.APPROVED] },
      OR: [
        {
          userTeamId: membership.franchiseId,
          opponentTeamId: data.opponentTeamId,
        },
        {
          userTeamId: data.opponentTeamId,
          opponentTeamId: membership.franchiseId,
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

  const maddenScore =
    data.userScore == null || data.opponentScore == null
      ? await findMaddenScoreForMatchup({
          week: data.week,
          userTeamId: membership.franchiseId,
          opponentTeamId: data.opponentTeamId,
        })
      : null;
  const userScore = data.userScore ?? maddenScore?.userScore ?? null;
  const opponentScore = data.opponentScore ?? maddenScore?.opponentScore ?? null;

  const submission = await prisma.gameSubmission.create({
    data: {
      seasonId: targetSeason.id,
      week: data.week,
      gameType: data.gameType,
      submitterId: user.id,
      userTeamId: membership.franchiseId,
      opponentTeamId: data.opponentTeamId,
      userScore,
      opponentScore,
      opponentSimScore: data.isForceWin ? null : (data.opponentSimScore ?? null),
      isForceWin: data.isForceWin,
      forceWinReason: data.isForceWin ? (data.forceWinReason ?? null) : null,
      isPrimetime: data.isPrimetime,
      notes: data.notes,
      status: SubmissionStatus.PENDING,
    },
  });

  await writeAuditLog({
    actorId: user.id,
    action: "SUBMIT_GAME_RESULT",
    entityType: "GameSubmission",
    entityId: submission.id,
    metadata: {
      week: data.week,
      userScore,
      opponentScore,
      opponentSimScore: data.isForceWin ? null : (data.opponentSimScore ?? null),
      isForceWin: data.isForceWin,
      forceWinReason: data.isForceWin ? (data.forceWinReason ?? null) : null,
      isPrimetime: data.isPrimetime,
    },
  });

  revalidatePath("/games");
  revalidatePath("/submissions");
  revalidatePath("/standings");
  revalidatePath("/dashboard");
  revalidatePath("/admin");
  revalidatePath("/admin/approvals");

  return { success: true, submissionId: submission.id };
}

export async function submitGameSimScore(formData: FormData) {
  const user = await requireUser();
  const { season } = await getActiveSeason();
  const membership = await getUserMembership(user.id, season.id);

  if (!membership) {
    return { error: "You must be assigned to a franchise before submitting a Sim Score." };
  }

  const parsed = simScoreSubmissionSchema.safeParse({
    submissionId: formData.get("submissionId"),
    simScore: formData.get("simScore"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid Sim Score" };
  }

  const submission = await prisma.gameSubmission.findUnique({
    where: { id: parsed.data.submissionId },
    include: {
      userTeam: { select: { abbreviation: true } },
      opponentTeam: { select: { abbreviation: true } },
      result: { select: { id: true } },
    },
  });

  if (!submission) return { error: "Game not found." };
  if (
    submission.status !== SubmissionStatus.PENDING &&
    submission.status !== SubmissionStatus.APPROVED
  ) {
    return { error: "Sim Scores can only be added on pending or approved games." };
  }

  const isUserTeam = membership.franchiseId === submission.userTeamId;
  const isOpponentTeam = membership.franchiseId === submission.opponentTeamId;
  if (!isUserTeam && !isOpponentTeam) {
    return { error: "Only the two teams in this game can submit a Sim Score." };
  }

  if (submission.isForceWin) {
    return { error: "Force wins do not use Sim Scores. The CPU sim score can be posted after the week advances." };
  }

  if (isUserTeam && submission.opponentSimScore != null) {
    return { error: "You already submitted a Sim Score for this opponent." };
  }

  if (isOpponentTeam && submission.userTeamSimScore != null) {
    return { error: "You already submitted a Sim Score for this opponent." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.gameSubmission.update({
      where: { id: submission.id },
      data: isUserTeam
        ? { opponentSimScore: parsed.data.simScore }
        : { userTeamSimScore: parsed.data.simScore },
    });
    if (submission.result) {
      await tx.gameResult.update({
        where: { id: submission.result.id },
        data: isUserTeam
          ? { opponentSimScore: parsed.data.simScore }
          : { userTeamSimScore: parsed.data.simScore },
      });
    }
  });

  await writeAuditLog({
    actorId: user.id,
    action: "SUBMIT_GAME_SIM_SCORE",
    entityType: "GameSubmission",
    entityId: submission.id,
    metadata: {
      simScore: parsed.data.simScore,
      ratedTeamId: isUserTeam ? submission.opponentTeamId : submission.userTeamId,
      ratedTeam: isUserTeam
        ? submission.opponentTeam.abbreviation
        : submission.userTeam.abbreviation,
    },
  });

  revalidatePath("/games");
  revalidatePath(`/games/${submission.id}`);
  revalidatePath("/dashboard");
  revalidatePath("/admin");
  revalidatePath("/admin/approvals");

  return { success: true };
}

export async function submitForceWinScore(formData: FormData) {
  const user = await requireUser();
  const { season } = await getActiveSeason();
  const membership = await getUserMembership(user.id, season.id);
  const commissioner = await isCommissioner(user);

  const parsed = forceWinScoreSchema.safeParse({
    submissionId: formData.get("submissionId"),
    userScore: formData.get("userScore"),
    opponentScore: formData.get("opponentScore"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid simulated score" };
  }

  const submission = await prisma.gameSubmission.findUnique({
    where: { id: parsed.data.submissionId },
    include: { result: { select: { id: true } } },
  });

  if (!submission) return { error: "Game not found." };
  if (!submission.isForceWin) {
    return { error: "Only force wins can add a simulated score this way." };
  }
  if (
    submission.status !== SubmissionStatus.PENDING &&
    submission.status !== SubmissionStatus.APPROVED
  ) {
    return { error: "This force win is no longer open." };
  }

  const isRecipient = membership?.franchiseId === submission.userTeamId;
  if (!commissioner && !isRecipient && submission.submitterId !== user.id) {
    return {
      error: "Only the available coach or a commissioner can post the simulated score.",
    };
  }

  const { userScore, opponentScore } = parsed.data;
  const winnerTeamId = submission.userTeamId;

  await prisma.$transaction(async (tx) => {
    await tx.gameSubmission.update({
      where: { id: submission.id },
      data: { userScore, opponentScore },
    });

    if (submission.result) {
      await tx.gameResult.update({
        where: { id: submission.result.id },
        data: {
          homeScore: userScore,
          awayScore: opponentScore,
          winnerTeamId,
          isForceWin: true,
        },
      });
      return;
    }

    if (submission.status === SubmissionStatus.APPROVED) {
      await tx.gameResult.create({
        data: {
          submissionId: submission.id,
          seasonId: submission.seasonId,
          week: submission.week,
          gameType: submission.gameType,
          homeTeamId: submission.userTeamId,
          awayTeamId: submission.opponentTeamId,
          homeScore: userScore,
          awayScore: opponentScore,
          opponentSimScore: null,
          userTeamSimScore: null,
          winnerTeamId,
          isForceWin: true,
          isPrimetime: submission.isPrimetime,
        },
      });
    }
  });

  await writeAuditLog({
    actorId: user.id,
    action: "SUBMIT_FORCE_WIN_SCORE",
    entityType: "GameSubmission",
    entityId: submission.id,
    metadata: { userScore, opponentScore },
  });

  revalidatePath("/games");
  revalidatePath(`/games/${submission.id}`);
  revalidatePath("/submissions");
  revalidatePath("/standings");
  revalidatePath("/dashboard");
  revalidatePath("/admin");
  revalidatePath("/admin/approvals");
  revalidatePath("/admin/season");

  return { success: true };
}
