-- CreateEnum
CREATE TYPE "IssueSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- AlterTable
ALTER TABLE "Issue" ADD COLUMN     "pageOrFeature" TEXT,
ADD COLUMN     "role" TEXT,
ADD COLUMN     "severity" "IssueSeverity";
