/*
  Warnings:

  - You are about to drop the column `rating` on the `cases` table. All the data in the column will be lost.
  - Added the required column `initial_rating` to the `cases` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "cases" DROP COLUMN "rating",
ADD COLUMN     "follow_up_rating" SMALLINT,
ADD COLUMN     "initial_rating" SMALLINT NOT NULL,
ADD COLUMN     "recovery_delta" SMALLINT;

-- AlterTable
ALTER TABLE "feedbacks" ADD COLUMN     "browser" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "device_type" TEXT,
ADD COLUMN     "ip_address" TEXT,
ADD COLUMN     "os" TEXT,
ADD COLUMN     "user_agent" TEXT;

-- CreateIndex
CREATE INDEX "feedbacks_rating_idx" ON "feedbacks"("rating");

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_touchpoint_id_fkey" FOREIGN KEY ("touchpoint_id") REFERENCES "touchpoints"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
