import { SubmissionStatus, type ForceWinReason, type GameType } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getLeagueSettings } from "@/lib/league";
import {
  awardsCoachXp,
  forceWinAwardsOpponentXp,
  isMaddenUndeclaredForceWinXpReason,
  xpFromApprovedGame,
} from "@/lib/xp";
import { hasFinalScores } from "@/lib/game-score";
import {
  applyReputationForApprovedGame,
  detectPrimetimeMatchup,
} from "@/lib/coach/reputation-from-game";

export type ReviewableSubmission = {
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

export async function approvePendingSubmission(
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
      const companionGrants = await tx.xPAdjustment.findMany({
        where: {
          seasonId: submission.seasonId,
          isAutomatic: true,
          reason: {
            startsWith: `Week ${submission.week} force win — Madden sim, no site claim`,
          },
        },
        select: { userId: true, reason: true },
      });
      const companionUserIds = new Set(
        companionGrants
          .filter((row) =>
            isMaddenUndeclaredForceWinXpReason(row.reason, submission.week)
          )
          .map((row) => row.userId)
      );
      const skipPlayXpFor = (userId: string) => companionUserIds.has(userId);

      const xpEntries = xpFromApprovedGame({
        xpGamePlayed: settings.xpGamePlayed,
        xpWinBonus: settings.xpWinBonus,
        won,
        gameType: submission.gameType,
        isForceWin: submission.isForceWin,
        forceWinReason: submission.forceWinReason,
      });

      for (const entry of xpEntries) {
        if (skipPlayXpFor(submission.submitterId) && !/win bonus/i.test(entry.reason)) {
          continue;
        }
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
          if (
            skipPlayXpFor(opponentMembership.userId) &&
            !/win bonus/i.test(entry.reason)
          ) {
            continue;
          }
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
