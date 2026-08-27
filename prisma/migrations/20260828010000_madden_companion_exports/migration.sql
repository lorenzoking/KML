-- AlterTable
ALTER TABLE "LeagueSetting" ADD COLUMN "maddenExportToken" TEXT;

-- CreateEnum
CREATE TYPE "MaddenExportKind" AS ENUM (
  'LEAGUE_TEAMS',
  'STANDINGS',
  'SCHEDULE',
  'TEAM_STATS',
  'PLAYER_STATS',
  'TEAM_ROSTER',
  'FREE_AGENTS',
  'UNKNOWN'
);

-- CreateTable
CREATE TABLE "MaddenExportDump" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "kind" "MaddenExportKind" NOT NULL DEFAULT 'UNKNOWN',
    "platform" TEXT,
    "leagueId" TEXT,
    "weekType" TEXT,
    "weekNumber" INTEGER,
    "teamId" TEXT,
    "dataType" TEXT,
    "payload" JSONB NOT NULL,
    "payloadKeys" TEXT[],
    "listCounts" JSONB,
    "success" BOOLEAN,
    "message" TEXT,
    "byteSize" INTEGER NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaddenExportDump_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MaddenExportDump_receivedAt_idx" ON "MaddenExportDump"("receivedAt");

-- CreateIndex
CREATE INDEX "MaddenExportDump_kind_idx" ON "MaddenExportDump"("kind");

-- CreateIndex
CREATE INDEX "MaddenExportDump_seasonId_idx" ON "MaddenExportDump"("seasonId");

-- CreateIndex
CREATE INDEX "MaddenExportDump_path_idx" ON "MaddenExportDump"("path");

-- AddForeignKey
ALTER TABLE "MaddenExportDump" ADD CONSTRAINT "MaddenExportDump_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE SET NULL ON UPDATE CASCADE;
