/*
  Warnings:

  - You are about to drop the column `description` on the `Issue` table. All the data in the column will be lost.
  - You are about to drop the column `severity` on the `Issue` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Issue" DROP COLUMN "description",
DROP COLUMN "severity";

-- DropEnum
DROP TYPE "IssueSeverity";
