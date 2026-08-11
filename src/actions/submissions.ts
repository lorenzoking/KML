"use server";

import { revalidatePath } from "next/cache";
import { SubmissionStatus } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveSeason, getUserMembership } from "@/lib/league";
import { gameSubmissionSchema } from "@/lib/validations";
import { writeAuditLog } from "@/lib/audit";

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
    userScore: formData.get("userScore"),
    opponentScore: formData.get("opponentScore"),
    opponentSimScore: formData.get("opponentSimScore"),
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

  const submission = await prisma.gameSubmission.create({
    data: {
      seasonId: targetSeason.id,
      week: data.week,
      gameType: data.gameType,
      submitterId: user.id,
      userTeamId: membership.franchiseId,
      opponentTeamId: data.opponentTeamId,
      userScore: data.userScore,
      opponentScore: data.opponentScore,
      opponentSimScore: data.opponentSimScore,
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
      userScore: data.userScore,
      opponentScore: data.opponentScore,
      opponentSimScore: data.opponentSimScore,
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
