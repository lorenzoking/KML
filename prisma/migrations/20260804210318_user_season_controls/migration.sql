-- CreateEnum
CREATE TYPE "SeasonStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- AlterEnum
ALTER TYPE "SubmissionStatus" ADD VALUE 'VOIDED';

-- AlterTable
ALTER TABLE "GameResult" ADD COLUMN     "isVoided" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "voidReason" TEXT,
ADD COLUMN     "voidedAt" TIMESTAMP(3),
ADD COLUMN     "voidedById" TEXT;

-- AlterTable
ALTER TABLE "Season" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "status" "SeasonStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "adminNotes" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "GameResult_isVoided_idx" ON "GameResult"("isVoided");

-- AddForeignKey
ALTER TABLE "GameResult" ADD CONSTRAINT "GameResult_voidedById_fkey" FOREIGN KEY ("voidedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
