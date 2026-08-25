-- CreateEnum
CREATE TYPE "ContractPosition" AS ENUM ('QB', 'RB', 'WR', 'TE', 'OL', 'EDGE', 'DL', 'LB', 'CB', 'S', 'K', 'P');

-- CreateEnum
CREATE TYPE "ContractPlayerTier" AS ENUM ('ELITE', 'STARTER', 'DEPTH');

-- CreateEnum
CREATE TYPE "ContractPenaltyTier" AS ENUM ('NONE', 'MINOR', 'MODERATE', 'SEVERE');

-- CreateEnum
CREATE TYPE "ContractSigningStatus" AS ENUM ('LOGGED', 'APPLIED', 'VOIDED');

-- CreateEnum
CREATE TYPE "SeverePenaltyResolution" AS ENUM ('PENDING', 'VOID_SIGNING', 'STEEP_BELOW_MARKET');

-- CreateTable
CREATE TABLE "ContractRuleSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL DEFAULT 'default',
    "maxContractLength" INTEGER NOT NULL DEFAULT 6,
    "minContractLength" INTEGER NOT NULL DEFAULT 2,
    "maxTotalSalaryMillions" DOUBLE PRECISION NOT NULL DEFAULT 200,
    "maxSigningBonusMillions" DOUBLE PRECISION NOT NULL DEFAULT 250,
    "longContractYears" INTEGER NOT NULL DEFAULT 7,
    "overpayNoneMax" DOUBLE PRECISION NOT NULL DEFAULT 1.15,
    "overpayMinorMax" DOUBLE PRECISION NOT NULL DEFAULT 1.50,
    "overpayModerateMax" DOUBLE PRECISION NOT NULL DEFAULT 2.00,
    "moderateMarketMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 0.90,
    "severeMarketMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 0.75,
    "capPenaltyPercentOfOverage" DOUBLE PRECISION NOT NULL DEFAULT 25,
    "rookieScaleFallbackRatio" DOUBLE PRECISION NOT NULL DEFAULT 0.35,
    "depthMarketRatio" DOUBLE PRECISION NOT NULL DEFAULT 0.55,
    "defaultSevereResolution" "SeverePenaltyResolution" NOT NULL DEFAULT 'PENDING',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractRuleSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PositionMarketComp" (
    "id" TEXT NOT NULL,
    "position" "ContractPosition" NOT NULL,
    "marketSetterName" TEXT,
    "topOfMarketApy" DOUBLE PRECISION NOT NULL,
    "starterFloorApy" DOUBLE PRECISION NOT NULL,
    "typicalBonusRatio" DOUBLE PRECISION NOT NULL,
    "typicalLengthYears" INTEGER NOT NULL,
    "guaranteePercent" DOUBLE PRECISION,
    "sourceNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PositionMarketComp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerContractSigning" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "franchiseId" TEXT NOT NULL,
    "submittedById" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,
    "position" "ContractPosition" NOT NULL,
    "playerTier" "ContractPlayerTier" NOT NULL DEFAULT 'STARTER',
    "yearsRemaining" INTEGER NOT NULL DEFAULT 0,
    "remainingDealApy" DOUBLE PRECISION,
    "asSignedLength" INTEGER NOT NULL,
    "asSignedTotalSalary" DOUBLE PRECISION NOT NULL,
    "asSignedSigningBonus" DOUBLE PRECISION NOT NULL,
    "asSignedApy" DOUBLE PRECISION NOT NULL,
    "marketApy" DOUBLE PRECISION NOT NULL,
    "overpayRatio" DOUBLE PRECISION NOT NULL,
    "penaltyTier" "ContractPenaltyTier" NOT NULL,
    "longContractFlag" BOOLEAN NOT NULL DEFAULT false,
    "recommendedOption" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "status" "ContractSigningStatus" NOT NULL DEFAULT 'LOGGED',
    "severeResolution" "SeverePenaltyResolution" NOT NULL DEFAULT 'PENDING',
    "commissionerNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerContractSigning_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContractRuleSetting_key_key" ON "ContractRuleSetting"("key");

-- CreateIndex
CREATE UNIQUE INDEX "PositionMarketComp_position_key" ON "PositionMarketComp"("position");

-- CreateIndex
CREATE INDEX "PlayerContractSigning_seasonId_overpayRatio_idx" ON "PlayerContractSigning"("seasonId", "overpayRatio");

-- CreateIndex
CREATE INDEX "PlayerContractSigning_seasonId_penaltyTier_idx" ON "PlayerContractSigning"("seasonId", "penaltyTier");

-- CreateIndex
CREATE INDEX "PlayerContractSigning_franchiseId_idx" ON "PlayerContractSigning"("franchiseId");

-- CreateIndex
CREATE INDEX "PlayerContractSigning_createdAt_idx" ON "PlayerContractSigning"("createdAt");

-- CreateIndex
CREATE INDEX "PlayerContractSigning_seasonId_playerName_idx" ON "PlayerContractSigning"("seasonId", "playerName");

-- AddForeignKey
ALTER TABLE "PlayerContractSigning" ADD CONSTRAINT "PlayerContractSigning_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerContractSigning" ADD CONSTRAINT "PlayerContractSigning_franchiseId_fkey" FOREIGN KEY ("franchiseId") REFERENCES "Franchise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerContractSigning" ADD CONSTRAINT "PlayerContractSigning_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
