import { z } from "zod";

const optionalScore = z.preprocess(
  (value) => (value === "" || value == null ? undefined : value),
  z.coerce.number().int().min(0).max(200).optional()
);

const optionalSimScore = z.preprocess(
  (value) => (value === "" || value == null ? undefined : value),
  z.coerce.number().int().min(1).max(5).optional()
);

export const gameSubmissionSchema = z
  .object({
    seasonNumber: z.coerce.number().int().min(1).max(50),
    week: z.coerce.number().int().min(1).max(30),
    gameType: z.enum([
      "REGULAR_SEASON",
      "PLAYOFF",
      "SUPER_BOWL",
      "PRESEASON",
      "SIMULATED",
      "OTHER",
    ]),
    opponentTeamId: z.string().min(1, "Opponent is required"),
    userScore: optionalScore,
    opponentScore: optionalScore,
    opponentSimScore: optionalSimScore,
    isForceWin: z.coerce.boolean().default(false),
    forceWinReason: z.enum(["GAME_CUT_OUT", "OPPONENT_UNAVAILABLE"]).optional(),
    isPrimetime: z.coerce.boolean().default(false),
    notes: z.string().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.isForceWin) {
      if (!data.forceWinReason) {
        ctx.addIssue({
          code: "custom",
          message: "Pick why you received the force win.",
          path: ["forceWinReason"],
        });
      }
      if (
        data.userScore != null &&
        data.opponentScore != null &&
        data.userScore <= data.opponentScore
      ) {
        ctx.addIssue({
          code: "custom",
          message: "A force win must show you ahead of the opponent.",
          path: ["userScore"],
        });
      }
      return;
    }

    if (data.opponentSimScore == null) {
      ctx.addIssue({
        code: "custom",
        message: "Opponent Sim Score must be 1–5",
        path: ["opponentSimScore"],
      });
    }
  });

export const forceWinScoreSchema = z
  .object({
    submissionId: z.string().min(1),
    userScore: z.coerce.number().int().min(0).max(200),
    opponentScore: z.coerce.number().int().min(0).max(200),
  })
  .refine((data) => data.userScore > data.opponentScore, {
    message: "A force win must show the available coach ahead of the opponent.",
    path: ["userScore"],
  });

export const simScoreSubmissionSchema = z.object({
  submissionId: z.string().min(1),
  simScore: z.coerce
    .number()
    .int()
    .min(1, "Opponent Sim Score must be 1–5")
    .max(5, "Opponent Sim Score must be 1–5"),
});

export const approvalSchema = z.object({
  submissionId: z.string().min(1),
  decision: z.enum(["APPROVE", "REJECT"]),
  decisionNote: z.string().max(500).optional(),
});

export const commissionerFileGameSchema = z
  .object({
    seasonNumber: z.coerce.number().int().min(1).max(50),
    week: z.coerce.number().int().min(1).max(30),
    gameType: z.enum([
      "REGULAR_SEASON",
      "PLAYOFF",
      "SUPER_BOWL",
      "PRESEASON",
      "SIMULATED",
      "OTHER",
    ]),
    userTeamId: z.string().min(1, "Pick the first team"),
    opponentTeamId: z.string().min(1, "Pick the second team"),
    userScore: z.coerce.number().int().min(0).max(200),
    opponentScore: z.coerce.number().int().min(0).max(200),
    opponentSimScore: z.coerce.number().int().min(1).max(5).default(3),
    userTeamSimScore: z.coerce.number().int().min(1).max(5).optional(),
    isPrimetime: z.coerce.boolean().default(false),
    awardXp: z.coerce.boolean().default(false),
    notes: z.string().max(500).optional(),
  })
  .refine((data) => data.userTeamId !== data.opponentTeamId, {
    message: "Pick two different teams.",
  });

export const assignTeamSchema = z.object({
  userId: z.string().min(1),
  franchiseId: z.string().min(1).nullable(),
});

export const requestTeamSchema = z.object({
  franchiseId: z.string().min(1, "Pick the team you drafted / want assigned"),
  displayName: z
    .string()
    .trim()
    .min(2, "Add the name coaches know you by")
    .max(60),
  note: z.string().trim().max(280).optional().or(z.literal("")),
});

export const settingsSchema = z.object({
  leagueName: z.string().min(2).max(80),
  currentSeason: z.coerce.number().int().min(1).max(50),
  currentWeek: z.coerce.number().int().min(1).max(30),
  xpGamePlayed: z.coerce.number().int().min(0).max(100),
  xpWinBonus: z.coerce.number().int().min(0).max(100),
  startingRepScore: z.coerce.number().int().min(0).max(100),
  carouselMinCoachRep: z.coerce.number().int().min(0).max(100),
  buyoutXpCost: z.coerce.number().int().min(0).max(100),
  startingContractYears: z.coerce.number().int().min(1).max(7),
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

export const selectMyTeamIdentitySchema = z.object({
  identityId: z.string().min(1, "Pick a Team Identity"),
});

export const selectMyCoachIdentitySchema = z.object({
  identityId: z.string().min(1, "Pick a Coaching Identity"),
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
    "SIM_SCORE",
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

export const updateMyCoachProfileSchema = z.object({
  coachName: z
    .string()
    .trim()
    .min(2, "Coach name must be at least 2 characters")
    .max(60, "Coach name is too long"),
  avatarUrl: z
    .string()
    .trim()
    .url("Profile picture must be a valid image URL")
    .max(500)
    .optional()
    .or(z.literal("")),
  discordName: z.string().trim().max(80).optional().or(z.literal("")),
  bio: z.string().trim().max(500).optional().or(z.literal("")),
  motto: z.string().trim().max(120).optional().or(z.literal("")),
  hometown: z.string().trim().max(80).optional().or(z.literal("")),
  favoriteScheme: z.string().trim().max(80).optional().or(z.literal("")),
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
  moveType: z.enum([
    "RE_SIGN",
    "EXTEND",
    "CHANGE_TEAM",
    "VOLUNTARY_BUYOUT",
    "VACANCY_APPLICATION",
    "REASSIGNMENT",
  ]),
});

export const reviewCarouselApplicationSchema = z.object({
  applicationId: z.string().min(1),
  decision: z.enum(["APPROVE", "DENY", "WITHDRAW"]),
  decisionNote: z.string().max(300).optional(),
  contractYears: z.coerce.number().int().min(0).max(7).optional(),
});

export const createWaitlistEntrySchema = z.object({
  userId: z.string().min(1),
  position: z.coerce.number().int().min(1).max(64),
  notes: z.string().max(300).optional(),
});

export const updateWaitlistEntrySchema = z.object({
  entryId: z.string().min(1),
  isActive: z.coerce.boolean(),
});

export const createLeagueStorySchema = z.object({
  title: z.string().min(4).max(140),
  eyebrow: z.string().max(80).optional(),
  summary: z.string().min(8).max(400),
  body: z.string().min(20).max(12000),
  category: z.enum([
    "FEATURE",
    "GAME_OF_WEEK",
    "PLAYER_OF_WEEK",
    "COACHING",
    "DRAFT",
    "LEAGUE",
  ]),
  week: z.coerce.number().int().min(1).max(30).optional(),
  isFeatured: z.coerce.boolean().default(false),
  isPublished: z.coerce.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});

export const updateLeagueStorySchema = createLeagueStorySchema.extend({
  storyId: z.string().min(1),
});

const contractPosition = z.enum([
  "QB",
  "RB",
  "WR",
  "TE",
  "OL",
  "EDGE",
  "DL",
  "LB",
  "CB",
  "S",
  "K",
  "P",
]);

const optionalMillions = z.preprocess(
  (value) => (value === "" || value == null ? undefined : value),
  z.coerce.number().min(0).max(600).optional()
);

export const logContractSigningSchema = z.object({
  playerName: z.string().trim().min(2, "Player name is required").max(80),
  position: contractPosition,
  playerTier: z.enum(["ELITE", "STARTER", "DEPTH"]),
  yearsRemaining: z.coerce.number().int().min(0).max(10).default(0),
  remainingDealApy: optionalMillions,
  termGoal: z.enum(["STANDARD", "LONG"]).default("LONG"),
  leftoverMode: z.enum(["ADD_ON", "REPLACE"]).default("ADD_ON"),
  asSignedLength: z.coerce.number().int().min(1).max(10),
  asSignedTotalSalary: z.coerce.number().min(0).max(600),
  asSignedSigningBonus: z.coerce.number().min(0).max(600),
  franchiseId: z.string().min(1, "Pick the signing team"),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export const updateContractRulesSchema = z.object({
  maxContractLength: z.coerce.number().int().min(3).max(8),
  minContractLength: z.coerce.number().int().min(1).max(5),
  maxTotalSalaryMillions: z.coerce.number().min(50).max(600),
  maxSigningBonusMillions: z.coerce.number().min(50).max(500),
  longContractYears: z.coerce.number().int().min(5).max(10),
  overpayNoneMax: z.coerce.number().min(1).max(2),
  overpayMinorMax: z.coerce.number().min(1.1).max(3),
  overpayModerateMax: z.coerce.number().min(1.2).max(5),
  moderateMarketMultiplier: z.coerce
    .number()
    .min(1, "Moderate APY must be 1.00× market or higher")
    .max(1.5),
  severeMarketMultiplier: z.coerce
    .number()
    .min(1, "Severe APY must be 1.00× market or higher")
    .max(2),
  capPenaltyPercentOfOverage: z.coerce.number().min(0).max(100),
  rookieScaleFallbackRatio: z.coerce.number().min(0.1).max(1),
  depthMarketRatio: z.coerce.number().min(0.2).max(1),
  defaultSevereResolution: z.enum([
    "PENDING",
    "VOID_SIGNING",
    "STEEP_BELOW_MARKET",
  ]),
});

export const updatePositionCompSchema = z.object({
  position: contractPosition,
  marketSetterName: z.string().trim().max(80).optional().or(z.literal("")),
  starterCompName: z.string().trim().max(80).optional().or(z.literal("")),
  topOfMarketApy: z.coerce.number().min(0).max(100),
  starterFloorApy: z.coerce.number().min(0).max(80),
  typicalBonusPercent: z.coerce.number().min(0).max(100),
  typicalLengthYears: z.coerce.number().int().min(1).max(8),
  guaranteePercent: z.preprocess(
    (value) => (value === "" || value == null ? undefined : value),
    z.coerce.number().min(0).max(100).optional()
  ),
  sourceNote: z.string().trim().max(240).optional().or(z.literal("")),
});

export const contractSigningIdSchema = z.object({
  signingId: z.string().min(1),
  commissionerNote: z.string().trim().max(500).optional().or(z.literal("")),
});

export const resolveSevereSigningSchema = z.object({
  signingId: z.string().min(1),
  resolution: z.enum(["VOID_SIGNING", "STEEP_BELOW_MARKET"]),
  commissionerNote: z.string().trim().max(500).optional().or(z.literal("")),
});
