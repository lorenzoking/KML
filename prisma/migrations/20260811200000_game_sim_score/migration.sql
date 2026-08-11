-- AlterTable
ALTER TABLE "GameSubmission" ADD COLUMN "simScore" INTEGER;

-- Backfill existing rows so NOT NULL can be applied
UPDATE "GameSubmission" SET "simScore" = 3 WHERE "simScore" IS NULL;

ALTER TABLE "GameSubmission" ALTER COLUMN "simScore" SET NOT NULL;

-- AlterTable
ALTER TABLE "GameResult" ADD COLUMN "simScore" INTEGER;

-- Copy from linked submissions where available
UPDATE "GameResult" gr
SET "simScore" = gs."simScore"
FROM "GameSubmission" gs
WHERE gr."submissionId" = gs.id;
