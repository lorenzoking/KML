"use server";

import { revalidatePath } from "next/cache";
import {
  CarouselApplicationStatus,
  CarouselMoveType,
  IdentityType,
} from "@prisma/client";
import { requireCommissioner, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveSeason, getUserMembership } from "@/lib/league";
import {
  applyToCarouselSchema,
  assignIdentitySchema,
  carouselOpenSchema,
  coachLedgerEntrySchema,
  coachSeasonReviewSchema,
  createCarouselVacancySchema,
  reviewCarouselApplicationSchema,
  selectMyCoachIdentitySchema,
  selectMyTeamIdentitySchema,
  updateCoachProfileSchema,
  updateMyCoachProfileSchema,
} from "@/lib/validations";
import { writeAuditLog } from "@/lib/audit";
import { computeReputationScore } from "@/lib/reputation";
import { getJobSecurityStatus } from "@/lib/coach/job-security";
import { getBuyoutEligibility } from "@/lib/coach/buyout";
import { getCarouselPriorityScore } from "@/lib/coach/carousel-priority";
import { getUserCareerStats } from "@/lib/career";

function revalidateCoachPaths(userId?: string) {
  revalidatePath("/coach");
  revalidatePath("/coach/me");
  revalidatePath("/coach/xp");
  revalidatePath("/coach/profiles");
  revalidatePath("/coach/identities");
  revalidatePath("/coach/hot-seat");
  revalidatePath("/coach/carousel");
  revalidatePath("/coach/reputation");
  if (userId) revalidatePath(`/coach/profiles/${userId}`);
  revalidatePath("/dashboard");
  revalidatePath("/admin");
  revalidatePath("/admin/users");
}

export async function assignCoachIdentity(formData: FormData) {
  const commissioner = await requireCommissioner();
  const { season, settings } = await getActiveSeason();

  const parsed = assignIdentitySchema.safeParse({
    userId: formData.get("userId"),
    identityId: formData.get("identityId") || null,
    applyXpCost: formData.get("applyXpCost") === "true",
  });
  if (!parsed.success || !parsed.data.userId) {
    return { error: "Invalid coach identity assignment." };
  }

  const identity = parsed.data.identityId
    ? await prisma.identityCatalog.findUnique({ where: { id: parsed.data.identityId } })
    : null;
  if (identity && identity.type !== IdentityType.COACH) {
    return { error: "Selected identity is not a coach identity." };
  }

  await prisma.coachProfile.upsert({
    where: { userId: parsed.data.userId },
    update: {
      coachIdentityId: parsed.data.identityId,
      coachIdentityChosenSeason: parsed.data.identityId
        ? settings.currentSeason
        : null,
    },
    create: {
      userId: parsed.data.userId,
      coachIdentityId: parsed.data.identityId,
      coachIdentityChosenSeason: parsed.data.identityId
        ? settings.currentSeason
        : null,
    },
  });

  if (identity && parsed.data.applyXpCost && identity.xpCost > 0) {
    const membership = await getUserMembership(parsed.data.userId, season.id);
    await prisma.xPAdjustment.create({
      data: {
        userId: parsed.data.userId,
        franchiseId: membership?.franchiseId,
        seasonId: season.id,
        amount: -identity.xpCost,
        reason: `Coach identity change: ${identity.name}`,
        isAutomatic: false,
        createdById: commissioner.id,
      },
    });
  }

  await writeAuditLog({
    actorId: commissioner.id,
    action: "ASSIGN_COACH_IDENTITY",
    entityType: "CoachProfile",
    entityId: parsed.data.userId,
    metadata: {
      identityId: parsed.data.identityId,
      applyXpCost: parsed.data.applyXpCost,
    },
  });

  revalidateCoachPaths(parsed.data.userId);
  return { success: true };
}

export async function assignTeamIdentity(formData: FormData) {
  const commissioner = await requireCommissioner();
  const { settings } = await getActiveSeason();

  const parsed = assignIdentitySchema.safeParse({
    franchiseId: formData.get("franchiseId"),
    identityId: formData.get("identityId") || null,
  });
  if (!parsed.success || !parsed.data.franchiseId) {
    return { error: "Invalid team identity assignment." };
  }

  const identity = parsed.data.identityId
    ? await prisma.identityCatalog.findUnique({ where: { id: parsed.data.identityId } })
    : null;
  if (identity && identity.type !== IdentityType.TEAM) {
    return { error: "Selected identity is not a team identity." };
  }

  await prisma.franchise.update({
    where: { id: parsed.data.franchiseId },
    data: {
      teamIdentityId: parsed.data.identityId,
      teamIdentityChosenSeason: parsed.data.identityId
        ? settings.currentSeason
        : null,
    },
  });

  await writeAuditLog({
    actorId: commissioner.id,
    action: "ASSIGN_TEAM_IDENTITY",
    entityType: "Franchise",
    entityId: parsed.data.franchiseId,
    metadata: { identityId: parsed.data.identityId },
  });

  revalidateCoachPaths();
  return { success: true };
}

export async function selectMyTeamIdentity(formData: FormData) {
  const user = await requireUser();
  const { season, settings } = await getActiveSeason();

  const parsed = selectMyTeamIdentitySchema.safeParse({
    identityId: formData.get("identityId"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid Team Identity." };
  }

  const membership = await getUserMembership(user.id, season.id);
  if (!membership) {
    return { error: "You need an assigned franchise before choosing a Team Identity." };
  }

  const identity = await prisma.identityCatalog.findUnique({
    where: { id: parsed.data.identityId },
  });
  if (!identity || identity.type !== IdentityType.TEAM) {
    return { error: "Selected identity is not a Team Identity." };
  }

  const franchise = await prisma.franchise.findUnique({
    where: { id: membership.franchiseId },
  });
  if (!franchise) return { error: "Franchise not found." };

  if (
    franchise.teamIdentityId &&
    franchise.teamIdentityId !== identity.id &&
    franchise.teamIdentityChosenSeason != null
  ) {
    const unlockSeason = franchise.teamIdentityChosenSeason + 3;
    if (settings.currentSeason < unlockSeason) {
      return {
        error: `Team Identity is locked until Season ${unlockSeason}. Ask a commissioner for an extraordinary change.`,
      };
    }
  }

  await prisma.franchise.update({
    where: { id: franchise.id },
    data: {
      teamIdentityId: identity.id,
      teamIdentityChosenSeason: settings.currentSeason,
    },
  });

  await writeAuditLog({
    actorId: user.id,
    action: "SELECT_MY_TEAM_IDENTITY",
    entityType: "Franchise",
    entityId: franchise.id,
    metadata: {
      identityId: identity.id,
      identitySlug: identity.slug,
      season: settings.currentSeason,
    },
  });

  revalidateCoachPaths(user.id);
  return { success: true };
}

export async function selectMyCoachIdentity(formData: FormData) {
  const user = await requireUser();
  const { settings } = await getActiveSeason();

  const parsed = selectMyCoachIdentitySchema.safeParse({
    identityId: formData.get("identityId"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid Coaching Identity." };
  }

  const identity = await prisma.identityCatalog.findUnique({
    where: { id: parsed.data.identityId },
  });
  if (!identity || identity.type !== IdentityType.COACH) {
    return { error: "Selected identity is not a Coaching Identity." };
  }

  const profile = await prisma.coachProfile.findUnique({ where: { userId: user.id } });

  if (
    profile?.coachIdentityId &&
    profile.coachIdentityId !== identity.id &&
    profile.coachIdentityChosenSeason != null
  ) {
    const unlockSeason = profile.coachIdentityChosenSeason + 3;
    if (settings.currentSeason < unlockSeason) {
      return {
        error: `Coaching Identity is locked until Season ${unlockSeason}. Ask a commissioner for an extraordinary change.`,
      };
    }
  }

  await prisma.coachProfile.upsert({
    where: { userId: user.id },
    update: {
      coachIdentityId: identity.id,
      coachIdentityChosenSeason: settings.currentSeason,
    },
    create: {
      userId: user.id,
      coachIdentityId: identity.id,
      coachIdentityChosenSeason: settings.currentSeason,
    },
  });

  await writeAuditLog({
    actorId: user.id,
    action: "SELECT_MY_COACH_IDENTITY",
    entityType: "CoachProfile",
    entityId: user.id,
    metadata: {
      identityId: identity.id,
      identitySlug: identity.slug,
      season: settings.currentSeason,
    },
  });

  revalidateCoachPaths(user.id);
  return { success: true };
}

export async function addCoachLedgerEntry(formData: FormData) {
  const commissioner = await requireCommissioner();
  const { season, settings } = await getActiveSeason();

  const parsed = coachLedgerEntrySchema.safeParse({
    userId: formData.get("userId"),
    amount: formData.get("amount"),
    gmAmount: formData.get("gmAmount"),
    xpAmount: formData.get("xpAmount"),
    category: formData.get("category"),
    reason: formData.get("reason"),
    week: formData.get("week") || undefined,
    evidenceUrl: formData.get("evidenceUrl") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid ledger entry." };
  }

  const membership = await getUserMembership(parsed.data.userId, season.id);
  const rep = await prisma.reputationAdjustment.create({
    data: {
      userId: parsed.data.userId,
      amount: parsed.data.amount,
      gmAmount: parsed.data.gmAmount,
      category: parsed.data.category,
      seasonId: season.id,
      week: parsed.data.week,
      reason: parsed.data.reason,
      evidenceUrl: parsed.data.evidenceUrl || undefined,
      createdById: commissioner.id,
    },
  });

  let xpRowId: string | null = null;
  if (parsed.data.xpAmount !== 0) {
    const xp = await prisma.xPAdjustment.create({
      data: {
        userId: parsed.data.userId,
        franchiseId: membership?.franchiseId,
        seasonId: season.id,
        amount: parsed.data.xpAmount,
        reason: `Coach ledger: ${parsed.data.reason}`,
        isAutomatic: false,
        createdById: commissioner.id,
      },
    });
    xpRowId = xp.id;
  }

  await writeAuditLog({
    actorId: commissioner.id,
    action: "ADD_COACH_LEDGER_ENTRY",
    entityType: "ReputationAdjustment",
    entityId: rep.id,
    metadata: { ...parsed.data, season: settings.currentSeason, xpRowId },
  });

  revalidateCoachPaths(parsed.data.userId);
  return { success: true };
}

export async function updateCoachProfile(formData: FormData) {
  const commissioner = await requireCommissioner();

  const parsed = updateCoachProfileSchema.safeParse({
    userId: formData.get("userId"),
    discordName: formData.get("discordName") || undefined,
    selectionPick: formData.get("selectionPick") || undefined,
    contractYearsLeft: formData.get("contractYearsLeft"),
    expectationScore: formData.get("expectationScore"),
    tankingStrikes: formData.get("tankingStrikes"),
    gmStrikes: formData.get("gmStrikes"),
    hotSeatStatusOverride: formData.get("hotSeatStatusOverride") || undefined,
    hotSeatNote: formData.get("hotSeatNote") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid coach profile update." };
  }

  const update = await prisma.coachProfile.upsert({
    where: { userId: parsed.data.userId },
    update: {
      discordName: parsed.data.discordName,
      selectionPick: parsed.data.selectionPick,
      contractYearsLeft: parsed.data.contractYearsLeft,
      expectationScore: parsed.data.expectationScore,
      tankingStrikes: parsed.data.tankingStrikes,
      gmStrikes: parsed.data.gmStrikes,
      hotSeatStatusOverride: parsed.data.hotSeatStatusOverride || null,
      hotSeatNote: parsed.data.hotSeatNote,
      lastReviewAt: new Date(),
    },
    create: {
      userId: parsed.data.userId,
      discordName: parsed.data.discordName,
      selectionPick: parsed.data.selectionPick,
      contractYearsLeft: parsed.data.contractYearsLeft,
      expectationScore: parsed.data.expectationScore,
      tankingStrikes: parsed.data.tankingStrikes,
      gmStrikes: parsed.data.gmStrikes,
      hotSeatStatusOverride: parsed.data.hotSeatStatusOverride || null,
      hotSeatNote: parsed.data.hotSeatNote,
      lastReviewAt: new Date(),
    },
  });

  await writeAuditLog({
    actorId: commissioner.id,
    action: "UPDATE_COACH_PROFILE",
    entityType: "CoachProfile",
    entityId: update.id,
    metadata: parsed.data,
  });

  revalidateCoachPaths(parsed.data.userId);
  return { success: true };
}

export async function updateMyCoachProfile(formData: FormData) {
  const user = await requireUser();

  const parsed = updateMyCoachProfileSchema.safeParse({
    coachName: formData.get("coachName"),
    avatarUrl: formData.get("avatarUrl") || "",
    discordName: formData.get("discordName") || "",
    bio: formData.get("bio") || "",
    motto: formData.get("motto") || "",
    hometown: formData.get("hometown") || "",
    favoriteScheme: formData.get("favoriteScheme") || "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid profile update." };
  }

  const avatarUrl = parsed.data.avatarUrl?.trim() || null;
  const discordName = parsed.data.discordName?.trim() || null;
  const bio = parsed.data.bio?.trim() || null;
  const motto = parsed.data.motto?.trim() || null;
  const hometown = parsed.data.hometown?.trim() || null;
  const favoriteScheme = parsed.data.favoriteScheme?.trim() || null;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { name: parsed.data.coachName },
    }),
    prisma.coachProfile.upsert({
      where: { userId: user.id },
      update: {
        avatarUrl,
        discordName,
        bio,
        motto,
        hometown,
        favoriteScheme,
      },
      create: {
        userId: user.id,
        avatarUrl,
        discordName,
        bio,
        motto,
        hometown,
        favoriteScheme,
      },
    }),
  ]);

  await writeAuditLog({
    actorId: user.id,
    action: "UPDATE_MY_COACH_PROFILE",
    entityType: "CoachProfile",
    entityId: user.id,
    metadata: {
      coachName: parsed.data.coachName,
      avatarUrl,
      discordName,
      hometown,
      favoriteScheme,
    },
  });

  revalidateCoachPaths(user.id);
  return { success: true };
}

export async function saveCoachSeasonReview(formData: FormData) {
  const commissioner = await requireCommissioner();
  const { season } = await getActiveSeason();

  const parsed = coachSeasonReviewSchema.safeParse({
    userId: formData.get("userId"),
    seasonId: formData.get("seasonId") || season.id,
    playoffResult: formData.get("playoffResult"),
    expectationResult: formData.get("expectationResult"),
    reviewNotes: formData.get("reviewNotes") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid season review." };
  }

  const row = await prisma.coachSeasonReview.upsert({
    where: {
      userId_seasonId: { userId: parsed.data.userId, seasonId: parsed.data.seasonId },
    },
    update: {
      playoffResult: parsed.data.playoffResult,
      expectationResult: parsed.data.expectationResult,
      reviewNotes: parsed.data.reviewNotes,
      reviewedAt: new Date(),
    },
    create: {
      userId: parsed.data.userId,
      seasonId: parsed.data.seasonId,
      playoffResult: parsed.data.playoffResult,
      expectationResult: parsed.data.expectationResult,
      reviewNotes: parsed.data.reviewNotes,
      reviewedAt: new Date(),
    },
  });

  await writeAuditLog({
    actorId: commissioner.id,
    action: "SAVE_COACH_SEASON_REVIEW",
    entityType: "CoachSeasonReview",
    entityId: row.id,
    metadata: parsed.data,
  });

  revalidateCoachPaths(parsed.data.userId);
  return { success: true };
}

export async function setCarouselOpen(formData: FormData) {
  const commissioner = await requireCommissioner();
  const parsed = carouselOpenSchema.safeParse({
    carouselOpen: formData.get("carouselOpen") === "true",
  });
  if (!parsed.success) return { error: "Invalid carousel setting." };

  await prisma.leagueSetting.update({
    where: { key: "default" },
    data: { carouselOpen: parsed.data.carouselOpen },
  });

  await writeAuditLog({
    actorId: commissioner.id,
    action: "SET_CAROUSEL_OPEN",
    entityType: "LeagueSetting",
    entityId: "default",
    metadata: parsed.data,
  });

  revalidateCoachPaths();
  return { success: true };
}

export async function createCarouselVacancy(formData: FormData) {
  const commissioner = await requireCommissioner();
  const { season } = await getActiveSeason();

  const parsed = createCarouselVacancySchema.safeParse({
    franchiseId: formData.get("franchiseId"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid vacancy request." };
  }

  const row = await prisma.carouselVacancy.create({
    data: {
      seasonId: season.id,
      franchiseId: parsed.data.franchiseId,
      reason: parsed.data.reason,
      isOpen: true,
    },
  });

  await writeAuditLog({
    actorId: commissioner.id,
    action: "CREATE_CAROUSEL_VACANCY",
    entityType: "CarouselVacancy",
    entityId: row.id,
    metadata: parsed.data,
  });

  revalidateCoachPaths();
  return { success: true };
}

export async function applyToCarousel(formData: FormData) {
  const user = await requireUser();
  const { season, settings } = await getActiveSeason();
  if (!settings.carouselOpen) {
    return { error: "Carousel is closed." };
  }

  const parsed = applyToCarouselSchema.safeParse({
    vacancyId: formData.get("vacancyId") || undefined,
    requestedTeamId: formData.get("requestedTeamId") || undefined,
    moveType: formData.get("moveType"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid carousel application." };
  }

  const [profile, repRows, seasonXp, membership, career] = await Promise.all([
    prisma.coachProfile.findUnique({ where: { userId: user.id } }),
    prisma.reputationAdjustment.findMany({ where: { userId: user.id } }),
    prisma.xPAdjustment.findMany({ where: { userId: user.id, seasonId: season.id } }),
    getUserMembership(user.id, season.id),
    getUserCareerStats(user.id),
  ]);

  const coachRepScore = computeReputationScore(settings.startingRepScore, repRows);
  const gmRepScore = computeReputationScore(
    settings.startingGmRepScore,
    repRows.map((r) => ({ amount: r.gmAmount }))
  );
  const status = getJobSecurityStatus({
    coachRepScore,
    gmRepScore,
    expectationScore: profile?.expectationScore ?? 0,
    tankingStrikes: profile?.tankingStrikes ?? 0,
    gmStrikes: profile?.gmStrikes ?? 0,
    hotSeatThreshold: settings.hotSeatThreshold,
    firingThreshold: settings.firingThreshold,
    watchThreshold: settings.watchThreshold,
    override: profile?.hotSeatStatusOverride,
  });
  const availableXp = seasonXp.reduce((sum, row) => sum + row.amount, 0);
  const buyout = getBuyoutEligibility({
    coachRepScore,
    availableXp,
    contractYearsLeft: profile?.contractYearsLeft ?? settings.startingContractYears,
    minCoachRepScore: settings.carouselMinCoachRep,
    baseCost: settings.buyoutXpCost,
    status,
  });
  const moveType =
    parsed.data.moveType === CarouselMoveType.VOLUNTARY_BUYOUT ||
    parsed.data.moveType === CarouselMoveType.VACANCY_APPLICATION ||
    parsed.data.moveType === CarouselMoveType.REASSIGNMENT
      ? CarouselMoveType.CHANGE_TEAM
      : parsed.data.moveType;

  if (coachRepScore < settings.carouselMinCoachRep) {
    return { error: `Coach reputation must be at least ${settings.carouselMinCoachRep}.` };
  }

  if (moveType === CarouselMoveType.RE_SIGN || moveType === CarouselMoveType.EXTEND) {
    if (!membership) {
      return { error: "You must be assigned to a team to re-sign or extend." };
    }
  }

  if (moveType === CarouselMoveType.CHANGE_TEAM) {
    if (!parsed.data.vacancyId && !parsed.data.requestedTeamId) {
      return { error: "Select a vacancy or requested team for a team change." };
    }
    if (!buyout.eligible) {
      return { error: buyout.reason };
    }
  }

  const totalGames = career.wins + career.losses + career.ties;
  const winPct = totalGames > 0 ? career.wins / totalGames : 0;
  const priority = getCarouselPriorityScore({
    coachRepScore,
    careerWinPct: winPct,
    userId: user.id,
  });

  const row = await prisma.carouselApplication.create({
    data: {
      seasonId: season.id,
      applicantId: user.id,
      currentTeamId: membership?.franchiseId,
      vacancyId: parsed.data.vacancyId || undefined,
      requestedTeamId: parsed.data.requestedTeamId || undefined,
      moveType,
      buyoutEligible: buyout.eligible,
      xpCost: moveType === CarouselMoveType.CHANGE_TEAM ? settings.buyoutXpCost : 0,
      priorityScore: priority,
      status: CarouselApplicationStatus.PENDING,
    },
  });

  await writeAuditLog({
    actorId: user.id,
    action: "APPLY_CAROUSEL",
    entityType: "CarouselApplication",
    entityId: row.id,
    metadata: parsed.data,
  });

  revalidateCoachPaths(user.id);
  return { success: true };
}

export async function reviewCarouselApplication(formData: FormData) {
  const commissioner = await requireCommissioner();
  const { season, settings } = await getActiveSeason();

  const parsed = reviewCarouselApplicationSchema.safeParse({
    applicationId: formData.get("applicationId"),
    decision: formData.get("decision"),
    decisionNote: formData.get("decisionNote") || undefined,
    contractYears: formData.get("contractYears") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid review payload." };
  }

  const application = await prisma.carouselApplication.findUnique({
    where: { id: parsed.data.applicationId },
    include: { vacancy: true, applicant: true },
  });
  if (!application) return { error: "Application not found." };

  if (parsed.data.decision === "WITHDRAW") {
    await prisma.carouselApplication.update({
      where: { id: application.id },
      data: {
        status: CarouselApplicationStatus.WITHDRAWN,
        decisionNote: parsed.data.decisionNote,
        reviewedById: commissioner.id,
      },
    });
    await writeAuditLog({
      actorId: commissioner.id,
      action: "REVIEW_CAROUSEL_APPLICATION",
      entityType: "CarouselApplication",
      entityId: application.id,
      metadata: parsed.data,
    });
    revalidateCoachPaths(application.applicantId);
    return { success: true };
  }

  if (parsed.data.decision === "DENY") {
    await prisma.carouselApplication.update({
      where: { id: application.id },
      data: {
        status: CarouselApplicationStatus.DENIED,
        decisionNote: parsed.data.decisionNote,
        reviewedById: commissioner.id,
      },
    });
    await writeAuditLog({
      actorId: commissioner.id,
      action: "REVIEW_CAROUSEL_APPLICATION",
      entityType: "CarouselApplication",
      entityId: application.id,
      metadata: parsed.data,
    });
    revalidateCoachPaths(application.applicantId);
    return { success: true };
  }

  const targetFranchiseId =
    application.requestedTeamId ?? application.vacancy?.franchiseId ?? null;
  const moveType =
    application.moveType === CarouselMoveType.VOLUNTARY_BUYOUT ||
    application.moveType === CarouselMoveType.VACANCY_APPLICATION ||
    application.moveType === CarouselMoveType.REASSIGNMENT
      ? CarouselMoveType.CHANGE_TEAM
      : application.moveType;
  if (moveType === CarouselMoveType.CHANGE_TEAM && !targetFranchiseId) {
    return { error: "No requested franchise found for approval." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.carouselApplication.update({
      where: { id: application.id },
      data: {
        status: CarouselApplicationStatus.APPROVED,
        decisionNote: parsed.data.decisionNote,
        reviewedById: commissioner.id,
        contractYears: parsed.data.contractYears ?? settings.startingContractYears,
      },
    });

    if (moveType === CarouselMoveType.CHANGE_TEAM) {
      if (!targetFranchiseId) {
        throw new Error("No requested franchise found for approval.");
      }

      await tx.leagueMembership.updateMany({
        where: { seasonId: season.id, isActive: true, userId: application.applicantId },
        data: {
          isActive: false,
          endedAt: new Date(),
          endedWeek: settings.currentWeek,
        },
      });

      await tx.leagueMembership.updateMany({
        where: { seasonId: season.id, isActive: true, franchiseId: targetFranchiseId },
        data: {
          isActive: false,
          endedAt: new Date(),
          endedWeek: settings.currentWeek,
        },
      });

      await tx.leagueMembership.create({
        data: {
          userId: application.applicantId,
          franchiseId: targetFranchiseId,
          seasonId: season.id,
          isActive: true,
          startedWeek: settings.currentWeek,
        },
      });

      if (application.vacancyId) {
        await tx.carouselVacancy.update({
          where: { id: application.vacancyId },
          data: { isOpen: false },
        });
      }

      if (application.xpCost > 0) {
        await tx.xPAdjustment.create({
          data: {
            userId: application.applicantId,
            franchiseId: targetFranchiseId,
            seasonId: season.id,
            amount: -application.xpCost,
            reason: "Carousel team change cost",
            isAutomatic: false,
            createdById: commissioner.id,
          },
        });
      }
    }

    await tx.coachProfile.upsert({
      where: { userId: application.applicantId },
      update: {
        contractYearsLeft: parsed.data.contractYears ?? settings.startingContractYears,
        isAutopilot: false,
        autopilotSeason: null,
      },
      create: {
        userId: application.applicantId,
        contractYearsLeft: parsed.data.contractYears ?? settings.startingContractYears,
        isAutopilot: false,
      },
    });
  });

  await writeAuditLog({
    actorId: commissioner.id,
    action: "REVIEW_CAROUSEL_APPLICATION",
    entityType: "CarouselApplication",
    entityId: application.id,
    metadata: parsed.data,
  });

  revalidateCoachPaths(application.applicantId);
  return { success: true };
}
