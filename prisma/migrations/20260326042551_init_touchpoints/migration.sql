-- CreateEnum
CREATE TYPE "TouchpointType" AS ENUM ('BRANCH_DESK', 'STAFF', 'ATM', 'OTHER');

-- CreateTable
CREATE TABLE "branches" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "location" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "touchpoints" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "TouchpointType" NOT NULL DEFAULT 'OTHER',
    "token" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "staff_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "touchpoints_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "branches_code_key" ON "branches"("code");

-- CreateIndex
CREATE UNIQUE INDEX "touchpoints_token_key" ON "touchpoints"("token");

-- CreateIndex
CREATE INDEX "touchpoints_token_idx" ON "touchpoints"("token");

-- CreateIndex
CREATE INDEX "touchpoints_branch_id_idx" ON "touchpoints"("branch_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "touchpoints" ADD CONSTRAINT "touchpoints_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "touchpoints" ADD CONSTRAINT "touchpoints_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
