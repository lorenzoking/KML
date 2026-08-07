-- AlterTable
ALTER TABLE "User" ADD COLUMN     "requestedFranchiseId" TEXT,
ADD COLUMN     "teamRequestNote" TEXT,
ADD COLUMN     "teamRequestedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "User_requestedFranchiseId_idx" ON "User"("requestedFranchiseId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_requestedFranchiseId_fkey" FOREIGN KEY ("requestedFranchiseId") REFERENCES "Franchise"("id") ON DELETE SET NULL ON UPDATE CASCADE;
