-- Messaging pipeline upgrade: queue lifecycle, channel tracking, webhook reconciliation, fallback controls.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MessageStatus') THEN
    CREATE TYPE "MessageStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'FAILED');
  END IF;
END $$;

ALTER TYPE "MessageStatus" ADD VALUE IF NOT EXISTS 'SENT';
ALTER TYPE "MessageStatus" ADD VALUE IF NOT EXISTS 'DELIVERED';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MessageChannel') THEN
    CREATE TYPE "MessageChannel" AS ENUM ('WHATSAPP', 'SMS');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "message_logs" (
  "id" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "touchpoint_id" TEXT NOT NULL,
  "staff_id" TEXT,
  "branch_id" TEXT NOT NULL,
  "case_id" TEXT,
  "status" "MessageStatus" NOT NULL DEFAULT 'PENDING',
  "initial_channel" "MessageChannel" NOT NULL DEFAULT 'WHATSAPP',
  "channel_used" "MessageChannel",
  "token" TEXT NOT NULL,
  "survey_url" TEXT NOT NULL,
  "whatsapp_message_id" TEXT,
  "sms_message_id" TEXT,
  "queued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processing_started_at" TIMESTAMP(3),
  "sent_at" TIMESTAMP(3),
  "delivered_at" TIMESTAMP(3),
  "failed_at" TIMESTAMP(3),
  "sms_fallback_triggered_at" TIMESTAMP(3),
  "retry_count" INTEGER NOT NULL DEFAULT 0,
  "error_message" TEXT,
  "provider_response" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "message_logs_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "message_logs" ADD COLUMN IF NOT EXISTS "case_id" TEXT;
ALTER TABLE "message_logs" ADD COLUMN IF NOT EXISTS "initial_channel" "MessageChannel" NOT NULL DEFAULT 'WHATSAPP';
ALTER TABLE "message_logs" ADD COLUMN IF NOT EXISTS "channel_used" "MessageChannel";
ALTER TABLE "message_logs" ADD COLUMN IF NOT EXISTS "survey_url" TEXT;
ALTER TABLE "message_logs" ADD COLUMN IF NOT EXISTS "whatsapp_message_id" TEXT;
ALTER TABLE "message_logs" ADD COLUMN IF NOT EXISTS "sms_message_id" TEXT;
ALTER TABLE "message_logs" ADD COLUMN IF NOT EXISTS "queued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "message_logs" ADD COLUMN IF NOT EXISTS "processing_started_at" TIMESTAMP(3);
ALTER TABLE "message_logs" ADD COLUMN IF NOT EXISTS "sent_at" TIMESTAMP(3);
ALTER TABLE "message_logs" ADD COLUMN IF NOT EXISTS "delivered_at" TIMESTAMP(3);
ALTER TABLE "message_logs" ADD COLUMN IF NOT EXISTS "failed_at" TIMESTAMP(3);
ALTER TABLE "message_logs" ADD COLUMN IF NOT EXISTS "sms_fallback_triggered_at" TIMESTAMP(3);
ALTER TABLE "message_logs" ADD COLUMN IF NOT EXISTS "provider_response" JSONB;

UPDATE "message_logs"
SET "status" = 'SENT'
WHERE "status"::text IN ('SENT_WHATSAPP', 'SENT_SMS');

CREATE UNIQUE INDEX IF NOT EXISTS "message_logs_token_key" ON "message_logs"("token");
CREATE UNIQUE INDEX IF NOT EXISTS "message_logs_whatsapp_message_id_key" ON "message_logs"("whatsapp_message_id");
CREATE INDEX IF NOT EXISTS "message_logs_phone_idx" ON "message_logs"("phone");
CREATE INDEX IF NOT EXISTS "message_logs_status_idx" ON "message_logs"("status");
CREATE INDEX IF NOT EXISTS "message_logs_token_idx" ON "message_logs"("token");
CREATE INDEX IF NOT EXISTS "message_logs_queued_at_idx" ON "message_logs"("queued_at");
CREATE INDEX IF NOT EXISTS "message_logs_processing_started_at_idx" ON "message_logs"("processing_started_at");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'message_logs_touchpoint_id_fkey'
  ) THEN
    ALTER TABLE "message_logs"
      ADD CONSTRAINT "message_logs_touchpoint_id_fkey"
      FOREIGN KEY ("touchpoint_id") REFERENCES "touchpoints"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'message_logs_staff_id_fkey'
  ) THEN
    ALTER TABLE "message_logs"
      ADD CONSTRAINT "message_logs_staff_id_fkey"
      FOREIGN KEY ("staff_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
