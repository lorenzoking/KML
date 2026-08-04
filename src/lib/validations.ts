import { z } from "zod";

export const gameSubmissionSchema = z
  .object({
    seasonNumber: z.coerce.number().int().min(1).max(50),
    week: z.coerce.number().int().min(1).max(30),
    gameType: z.enum([
      "REGULAR_SEASON",
      "PLAYOFF",
      "SUPER_BOWL",
      "PRESEASON",
      "OTHER",
    ]),
    opponentTeamId: z.string().min(1, "Opponent is required"),
    userScore: z.coerce.number().int().min(0).max(200),
    opponentScore: z.coerce.number().int().min(0).max(200),
    notes: z.string().max(500).optional(),
  })
  .refine((data) => data.userScore !== data.opponentScore || true, {
    message: "Scores recorded",
  });

export const approvalSchema = z.object({
  submissionId: z.string().min(1),
  decision: z.enum(["APPROVE", "REJECT"]),
  decisionNote: z.string().max(500).optional(),
});

export const assignTeamSchema = z.object({
  userId: z.string().min(1),
  franchiseId: z.string().min(1).nullable(),
});

export const settingsSchema = z.object({
  leagueName: z.string().min(2).max(80),
  currentSeason: z.coerce.number().int().min(1).max(50),
  currentWeek: z.coerce.number().int().min(1).max(30),
  xpGamePlayed: z.coerce.number().int().min(0).max(100),
  xpWinBonus: z.coerce.number().int().min(0).max(100),
  startingRepScore: z.coerce.number().int().min(0).max(100),
  rulesMarkdown: z.string().max(20000),
});

export const xpAdjustmentSchema = z.object({
  userId: z.string().min(1),
  amount: z.coerce.number().int().min(-100).max(100),
  reason: z.string().min(2).max(300),
});

export const reputationAdjustmentSchema = z.object({
  userId: z.string().min(1),
  amount: z.coerce.number().int().min(-50).max(50),
  reason: z.string().min(2).max(300),
});
