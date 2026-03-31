/*
  Warnings:

  - The values [OPEN] on the enum `CaseStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "CaseStatus_new" AS ENUM ('NEW', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');
ALTER TABLE "public"."cases" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "cases" ALTER COLUMN "status" TYPE "CaseStatus_new" USING ("status"::text::"CaseStatus_new");
ALTER TYPE "CaseStatus" RENAME TO "CaseStatus_old";
ALTER TYPE "CaseStatus_new" RENAME TO "CaseStatus";
DROP TYPE "public"."CaseStatus_old";
ALTER TABLE "cases" ALTER COLUMN "status" SET DEFAULT 'NEW';
COMMIT;

-- AlterTable
ALTER TABLE "cases" ALTER COLUMN "status" SET DEFAULT 'NEW';
