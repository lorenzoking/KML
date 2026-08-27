-- AlterTable
ALTER TABLE "MaddenExportDump" ADD COLUMN "indexedAt" TIMESTAMP(3);

-- CreateEnum
CREATE TYPE "MaddenStatCategory" AS ENUM (
  'PASSING',
  'RUSHING',
  'RECEIVING',
  'DEFENSE',
  'KICKING',
  'PUNTING'
);

-- CreateTable
CREATE TABLE "MaddenTeam" (
    "id" TEXT NOT NULL,
    "maddenTeamId" TEXT NOT NULL,
    "franchiseId" TEXT,
    "abbr" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "nickName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "division" TEXT NOT NULL,
    "conference" TEXT NOT NULL,
    "ovr" INTEGER NOT NULL DEFAULT 0,
    "userName" TEXT,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "ties" INTEGER NOT NULL DEFAULT 0,
    "ptsFor" INTEGER NOT NULL DEFAULT 0,
    "ptsAgainst" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaddenTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaddenPlayer" (
    "id" TEXT NOT NULL,
    "rosterId" TEXT NOT NULL,
    "maddenTeamId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "jerseyNum" INTEGER NOT NULL DEFAULT 0,
    "overall" INTEGER NOT NULL DEFAULT 0,
    "age" INTEGER NOT NULL DEFAULT 0,
    "yearsPro" INTEGER NOT NULL DEFAULT 0,
    "height" INTEGER NOT NULL DEFAULT 0,
    "weight" INTEGER NOT NULL DEFAULT 0,
    "devTrait" INTEGER NOT NULL DEFAULT 0,
    "college" TEXT NOT NULL DEFAULT '',
    "contractSalary" INTEGER NOT NULL DEFAULT 0,
    "contractYearsLeft" INTEGER NOT NULL DEFAULT 0,
    "isOnIR" BOOLEAN NOT NULL DEFAULT false,
    "isOnPracticeSquad" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaddenPlayer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaddenPlayerStat" (
    "id" TEXT NOT NULL,
    "rosterId" TEXT NOT NULL,
    "maddenTeamId" TEXT NOT NULL,
    "weekIndex" INTEGER NOT NULL,
    "category" "MaddenStatCategory" NOT NULL,
    "fullName" TEXT NOT NULL,
    "passYds" INTEGER NOT NULL DEFAULT 0,
    "passTDs" INTEGER NOT NULL DEFAULT 0,
    "passInts" INTEGER NOT NULL DEFAULT 0,
    "passAtt" INTEGER NOT NULL DEFAULT 0,
    "passComp" INTEGER NOT NULL DEFAULT 0,
    "passerRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rushYds" INTEGER NOT NULL DEFAULT 0,
    "rushTDs" INTEGER NOT NULL DEFAULT 0,
    "rushAtt" INTEGER NOT NULL DEFAULT 0,
    "recYds" INTEGER NOT NULL DEFAULT 0,
    "recTDs" INTEGER NOT NULL DEFAULT 0,
    "recCatches" INTEGER NOT NULL DEFAULT 0,
    "defTackles" INTEGER NOT NULL DEFAULT 0,
    "defSacks" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "defInts" INTEGER NOT NULL DEFAULT 0,
    "kickPts" INTEGER NOT NULL DEFAULT 0,
    "payload" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaddenPlayerStat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MaddenTeam_maddenTeamId_key" ON "MaddenTeam"("maddenTeamId");

-- CreateIndex
CREATE UNIQUE INDEX "MaddenTeam_franchiseId_key" ON "MaddenTeam"("franchiseId");

-- CreateIndex
CREATE INDEX "MaddenTeam_abbr_idx" ON "MaddenTeam"("abbr");

-- CreateIndex
CREATE INDEX "MaddenTeam_ovr_idx" ON "MaddenTeam"("ovr");

-- CreateIndex
CREATE UNIQUE INDEX "MaddenPlayer_rosterId_key" ON "MaddenPlayer"("rosterId");

-- CreateIndex
CREATE INDEX "MaddenPlayer_maddenTeamId_overall_idx" ON "MaddenPlayer"("maddenTeamId", "overall");

-- CreateIndex
CREATE INDEX "MaddenPlayer_position_idx" ON "MaddenPlayer"("position");

-- CreateIndex
CREATE UNIQUE INDEX "MaddenPlayerStat_rosterId_weekIndex_category_key" ON "MaddenPlayerStat"("rosterId", "weekIndex", "category");

-- CreateIndex
CREATE INDEX "MaddenPlayerStat_weekIndex_category_idx" ON "MaddenPlayerStat"("weekIndex", "category");

-- CreateIndex
CREATE INDEX "MaddenPlayerStat_maddenTeamId_weekIndex_idx" ON "MaddenPlayerStat"("maddenTeamId", "weekIndex");

-- AddForeignKey
ALTER TABLE "MaddenTeam" ADD CONSTRAINT "MaddenTeam_franchiseId_fkey" FOREIGN KEY ("franchiseId") REFERENCES "Franchise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaddenPlayer" ADD CONSTRAINT "MaddenPlayer_maddenTeamId_fkey" FOREIGN KEY ("maddenTeamId") REFERENCES "MaddenTeam"("maddenTeamId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaddenPlayerStat" ADD CONSTRAINT "MaddenPlayerStat_rosterId_fkey" FOREIGN KEY ("rosterId") REFERENCES "MaddenPlayer"("rosterId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaddenPlayerStat" ADD CONSTRAINT "MaddenPlayerStat_maddenTeamId_fkey" FOREIGN KEY ("maddenTeamId") REFERENCES "MaddenTeam"("maddenTeamId") ON DELETE CASCADE ON UPDATE CASCADE;
