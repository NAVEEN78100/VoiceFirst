-- AlterTable
ALTER TABLE "users" ADD COLUMN     "must_reset_password" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "name" TEXT;
