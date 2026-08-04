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

export const updateUserSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(1).max(80).optional(),
  role: z.enum(["COMMISSIONER", "USER"]),
  isActive: z.coerce.boolean(),
  adminNotes: z.string().max(2000).optional(),
});

export const voidGameSchema = z.object({
  submissionId: z.string().min(1),
  voidReason: z.string().min(2).max(300),
});

export const resetSeasonGamesSchema = z.object({
  confirm: z.literal("RESET_GAMES"),
  reason: z.string().min(2).max(300),
});

export const advanceSeasonSchema = z.object({
  confirm: z.literal("ADVANCE_SEASON"),
  carryMemberships: z.coerce.boolean().default(true),
});

export const assignIdentitySchema = z.object({
  userId: z.string().min(1).optional(),
  franchiseId: z.string().min(1).optional(),
  identityId: z.string().min(1).nullable(),
  applyXpCost: z.coerce.boolean().default(false),
});

export const coachLedgerEntrySchema = z.object({
  userId: z.string().min(1),
  amount: z.coerce.number().int().min(-50).max(50),
  gmAmount: z.coerce.number().int().min(-50).max(50).default(0),
  xpAmount: z.coerce.number().int().min(-100).max(100).default(0),
  category: z.enum([
    "GENERAL",
    "CONDUCT",
    "EXPECTATION",
    "GAME_MANAGEMENT",
    "ROSTER",
    "TANKING",
    "TRADE",
    "DRAFT",
    "OWNERSHIP_REVIEW",
    "CAROUSEL",
    "BONUS",
    "PENALTY",
  ]),
  reason: z.string().min(2).max(300),
  week: z.coerce.number().int().min(1).max(30).optional(),
  evidenceUrl: z.string().url().optional().or(z.literal("")),
});

export const updateCoachProfileSchema = z.object({
  userId: z.string().min(1),
  discordName: z.string().max(80).optional(),
  selectionPick: z.coerce.number().int().min(1).max(64).optional(),
  contractYearsLeft: z.coerce.number().int().min(0).max(7),
  expectationScore: z.coerce.number().int().min(0).max(100),
  tankingStrikes: z.coerce.number().int().min(0).max(10),
  gmStrikes: z.coerce.number().int().min(0).max(10),
  hotSeatStatusOverride: z
    .enum(["SECURE", "STABLE", "WATCH", "PRESSURED", "HOT_SEAT", "FIRING_ELIGIBLE"])
    .optional()
    .or(z.literal("")),
  hotSeatNote: z.string().max(300).optional(),
});

export const coachSeasonReviewSchema = z.object({
  userId: z.string().min(1),
  seasonId: z.string().min(1),
  playoffResult: z.enum([
    "NONE",
    "WILD_CARD",
    "DIVISIONAL",
    "CONFERENCE",
    "SUPER_BOWL",
    "CHAMPION",
  ]),
  expectationResult: z.enum(["PENDING", "MISSED", "MET", "EXCEEDED"]),
  reviewNotes: z.string().max(2000).optional(),
});

export const carouselOpenSchema = z.object({
  carouselOpen: z.coerce.boolean(),
});

export const createCarouselVacancySchema = z.object({
  franchiseId: z.string().min(1),
  reason: z.string().min(2).max(300),
});

export const applyToCarouselSchema = z.object({
  vacancyId: z.string().min(1).optional().or(z.literal("")),
  requestedTeamId: z.string().min(1).optional().or(z.literal("")),
  moveType: z.enum(["VOLUNTARY_BUYOUT", "VACANCY_APPLICATION", "REASSIGNMENT"]),
});

export const reviewCarouselApplicationSchema = z.object({
  applicationId: z.string().min(1),
  decision: z.enum(["APPROVE", "DENY", "WITHDRAW"]),
  decisionNote: z.string().max(300).optional(),
  contractYears: z.coerce.number().int().min(0).max(7).optional(),
});
