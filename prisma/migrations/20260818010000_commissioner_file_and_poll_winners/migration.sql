-- AlterTable
ALTER TABLE "GameSubmission" ADD COLUMN IF NOT EXISTS "skipXp" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "GameSubmission" ADD COLUMN IF NOT EXISTS "filedByCommissioner" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "StoryPollQuestion" ADD COLUMN IF NOT EXISTS "declaredWinnerOptionId" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "StoryPollQuestion_declaredWinnerOptionId_idx" ON "StoryPollQuestion"("declaredWinnerOptionId");

-- AddForeignKey
ALTER TABLE "StoryPollQuestion" DROP CONSTRAINT IF EXISTS "StoryPollQuestion_declaredWinnerOptionId_fkey";
ALTER TABLE "StoryPollQuestion" ADD CONSTRAINT "StoryPollQuestion_declaredWinnerOptionId_fkey" FOREIGN KEY ("declaredWinnerOptionId") REFERENCES "StoryPollOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;
