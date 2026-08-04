-- CreateEnum
CREATE TYPE "IdentityType" AS ENUM ('TEAM', 'COACH');

-- CreateEnum
CREATE TYPE "IdentityStatus" AS ENUM ('AVAILABLE', 'RESTRICTED', 'LEGACY');

-- CreateEnum
CREATE TYPE "HotSeatStatus" AS ENUM ('SECURE', 'STABLE', 'WATCH', 'PRESSURED', 'HOT_SEAT', 'FIRING_ELIGIBLE');

-- CreateEnum
CREATE TYPE "ReputationCategory" AS ENUM ('GENERAL', 'CONDUCT', 'EXPECTATION', 'GAME_MANAGEMENT', 'ROSTER', 'TANKING', 'TRADE', 'DRAFT', 'OWNERSHIP_REVIEW', 'CAROUSEL', 'BONUS', 'PENALTY');

-- CreateEnum
CREATE TYPE "CarouselMoveType" AS ENUM ('VOLUNTARY_BUYOUT', 'VACANCY_APPLICATION', 'REASSIGNMENT');

-- CreateEnum
CREATE TYPE "CarouselApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "PlayoffResult" AS ENUM ('NONE', 'WILD_CARD', 'DIVISIONAL', 'CONFERENCE', 'SUPER_BOWL', 'CHAMPION');

-- CreateEnum
CREATE TYPE "ExpectationResult" AS ENUM ('PENDING', 'MISSED', 'MET', 'EXCEEDED');

-- AlterTable
ALTER TABLE "Franchise" ADD COLUMN     "teamIdentityId" TEXT;

-- AlterTable
ALTER TABLE "LeagueSetting" ADD COLUMN     "buyoutMinCoachRep" INTEGER NOT NULL DEFAULT 85,
ADD COLUMN     "buyoutXpCost" INTEGER NOT NULL DEFAULT 25,
ADD COLUMN     "carouselOpen" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "firingThreshold" INTEGER NOT NULL DEFAULT 44,
ADD COLUMN     "hotSeatThreshold" INTEGER NOT NULL DEFAULT 59,
ADD COLUMN     "startingGmRepScore" INTEGER NOT NULL DEFAULT 75,
ADD COLUMN     "watchThreshold" INTEGER NOT NULL DEFAULT 70;

-- AlterTable
ALTER TABLE "ReputationAdjustment" ADD COLUMN     "category" "ReputationCategory" NOT NULL DEFAULT 'GENERAL',
ADD COLUMN     "evidenceUrl" TEXT,
ADD COLUMN     "gmAmount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "seasonId" TEXT,
ADD COLUMN     "week" INTEGER;

-- CreateTable
CREATE TABLE "IdentityCatalog" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "IdentityType" NOT NULL,
    "coreBenefit" TEXT NOT NULL,
    "restriction" TEXT NOT NULL,
    "changeRule" TEXT NOT NULL,
    "xpCost" INTEGER NOT NULL DEFAULT 0,
    "level" TEXT NOT NULL,
    "minRepScore" INTEGER NOT NULL DEFAULT 0,
    "status" "IdentityStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdentityCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "discordName" TEXT,
    "selectionPick" INTEGER,
    "coachIdentityId" TEXT,
    "expectationScore" INTEGER NOT NULL DEFAULT 0,
    "contractYearsLeft" INTEGER NOT NULL DEFAULT 3,
    "tankingStrikes" INTEGER NOT NULL DEFAULT 0,
    "gmStrikes" INTEGER NOT NULL DEFAULT 0,
    "hotSeatStatusOverride" "HotSeatStatus",
    "hotSeatNote" TEXT,
    "lastReviewAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachSeasonReview" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "playoffResult" "PlayoffResult" NOT NULL DEFAULT 'NONE',
    "expectationResult" "ExpectationResult" NOT NULL DEFAULT 'PENDING',
    "reviewNotes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachSeasonReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarouselVacancy" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "franchiseId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarouselVacancy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarouselApplication" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "currentTeamId" TEXT,
    "vacancyId" TEXT,
    "requestedTeamId" TEXT,
    "moveType" "CarouselMoveType" NOT NULL,
    "buyoutEligible" BOOLEAN NOT NULL DEFAULT false,
    "xpCost" INTEGER NOT NULL DEFAULT 0,
    "priorityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "CarouselApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "decisionNote" TEXT,
    "assignedTeamId" TEXT,
    "contractYears" INTEGER,
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarouselApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IdentityCatalog_slug_key" ON "IdentityCatalog"("slug");

-- CreateIndex
CREATE INDEX "IdentityCatalog_type_idx" ON "IdentityCatalog"("type");

-- CreateIndex
CREATE INDEX "IdentityCatalog_status_idx" ON "IdentityCatalog"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CoachProfile_userId_key" ON "CoachProfile"("userId");

-- CreateIndex
CREATE INDEX "CoachProfile_coachIdentityId_idx" ON "CoachProfile"("coachIdentityId");

-- CreateIndex
CREATE INDEX "CoachSeasonReview_seasonId_idx" ON "CoachSeasonReview"("seasonId");

-- CreateIndex
CREATE UNIQUE INDEX "CoachSeasonReview_userId_seasonId_key" ON "CoachSeasonReview"("userId", "seasonId");

-- CreateIndex
CREATE INDEX "CarouselVacancy_seasonId_idx" ON "CarouselVacancy"("seasonId");

-- CreateIndex
CREATE INDEX "CarouselVacancy_isOpen_idx" ON "CarouselVacancy"("isOpen");

-- CreateIndex
CREATE INDEX "CarouselApplication_seasonId_idx" ON "CarouselApplication"("seasonId");

-- CreateIndex
CREATE INDEX "CarouselApplication_status_idx" ON "CarouselApplication"("status");

-- CreateIndex
CREATE INDEX "CarouselApplication_applicantId_idx" ON "CarouselApplication"("applicantId");

-- CreateIndex
CREATE INDEX "ReputationAdjustment_seasonId_idx" ON "ReputationAdjustment"("seasonId");

-- CreateIndex
CREATE INDEX "ReputationAdjustment_category_idx" ON "ReputationAdjustment"("category");

-- CreateIndex
CREATE INDEX "ReputationAdjustment_createdAt_idx" ON "ReputationAdjustment"("createdAt");

-- AddForeignKey
ALTER TABLE "Franchise" ADD CONSTRAINT "Franchise_teamIdentityId_fkey" FOREIGN KEY ("teamIdentityId") REFERENCES "IdentityCatalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReputationAdjustment" ADD CONSTRAINT "ReputationAdjustment_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachProfile" ADD CONSTRAINT "CoachProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachProfile" ADD CONSTRAINT "CoachProfile_coachIdentityId_fkey" FOREIGN KEY ("coachIdentityId") REFERENCES "IdentityCatalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachSeasonReview" ADD CONSTRAINT "CoachSeasonReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachSeasonReview" ADD CONSTRAINT "CoachSeasonReview_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarouselVacancy" ADD CONSTRAINT "CarouselVacancy_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarouselVacancy" ADD CONSTRAINT "CarouselVacancy_franchiseId_fkey" FOREIGN KEY ("franchiseId") REFERENCES "Franchise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarouselApplication" ADD CONSTRAINT "CarouselApplication_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarouselApplication" ADD CONSTRAINT "CarouselApplication_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarouselApplication" ADD CONSTRAINT "CarouselApplication_currentTeamId_fkey" FOREIGN KEY ("currentTeamId") REFERENCES "Franchise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarouselApplication" ADD CONSTRAINT "CarouselApplication_requestedTeamId_fkey" FOREIGN KEY ("requestedTeamId") REFERENCES "Franchise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarouselApplication" ADD CONSTRAINT "CarouselApplication_vacancyId_fkey" FOREIGN KEY ("vacancyId") REFERENCES "CarouselVacancy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarouselApplication" ADD CONSTRAINT "CarouselApplication_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
