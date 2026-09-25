-- CreateEnum
CREATE TYPE "ResumeProcessingStatus" AS ENUM ('UPLOADED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "Resume" ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "extractedText" TEXT,
ADD COLUMN     "progress" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "status" "ResumeProcessingStatus" NOT NULL DEFAULT 'UPLOADED';

-- CreateIndex
CREATE INDEX "Resume_status_idx" ON "Resume"("status");
