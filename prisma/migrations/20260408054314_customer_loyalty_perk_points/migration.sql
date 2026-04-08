-- CreateTable
CREATE TABLE "customers" (
    "phone" VARCHAR(20) NOT NULL,
    "perk_points" INTEGER NOT NULL DEFAULT 0,
    "last_awarded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("phone")
);
