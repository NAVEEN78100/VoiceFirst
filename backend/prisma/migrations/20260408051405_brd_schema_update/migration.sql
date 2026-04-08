-- AlterTable
ALTER TABLE "feedbacks" ADD COLUMN     "channel" TEXT NOT NULL DEFAULT 'QR',
ADD COLUMN     "follow_up_requested" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "issue_tags" TEXT,
ADD COLUMN     "service_category" TEXT,
ADD COLUMN     "track_type" TEXT NOT NULL DEFAULT 'ANONYMOUS';
