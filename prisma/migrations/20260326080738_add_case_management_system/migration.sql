-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "CasePriority" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateTable
CREATE TABLE "cases" (
    "id" TEXT NOT NULL,
    "feedback_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "touchpoint_id" TEXT NOT NULL,
    "rating" SMALLINT NOT NULL,
    "priority" "CasePriority" NOT NULL DEFAULT 'HIGH',
    "status" "CaseStatus" NOT NULL DEFAULT 'OPEN',
    "can_contact" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "cases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cases_feedback_id_key" ON "cases"("feedback_id");

-- CreateIndex
CREATE INDEX "cases_branch_id_idx" ON "cases"("branch_id");

-- CreateIndex
CREATE INDEX "cases_status_idx" ON "cases"("status");

-- CreateIndex
CREATE INDEX "cases_priority_idx" ON "cases"("priority");

-- CreateIndex
CREATE INDEX "cases_created_at_idx" ON "cases"("created_at");

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_feedback_id_fkey" FOREIGN KEY ("feedback_id") REFERENCES "feedbacks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
