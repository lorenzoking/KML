-- Rename sim score columns to reflect they rate the opponent, not the submitter
ALTER TABLE "GameSubmission" RENAME COLUMN "simScore" TO "opponentSimScore";
ALTER TABLE "GameResult" RENAME COLUMN "simScore" TO "opponentSimScore";
