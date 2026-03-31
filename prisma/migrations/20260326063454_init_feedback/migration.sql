-- CreateTable
CREATE TABLE "feedbacks" (
    "id" TEXT NOT NULL,
    "rating" SMALLINT NOT NULL,
    "comment" TEXT,
    "phone" VARCHAR(20),
    "touchpoint_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "feedbacks_touchpoint_id_idx" ON "feedbacks"("touchpoint_id");

-- CreateIndex
CREATE INDEX "feedbacks_branch_id_idx" ON "feedbacks"("branch_id");

-- CreateIndex
CREATE INDEX "feedbacks_created_at_idx" ON "feedbacks"("created_at");

-- AddForeignKey
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_touchpoint_id_fkey" FOREIGN KEY ("touchpoint_id") REFERENCES "touchpoints"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
