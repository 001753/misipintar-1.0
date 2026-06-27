-- Migration 0003: Sinkronisasi schema — phone, OtpCode, qrisQr columns
-- Semua perubahan menggunakan IF NOT EXISTS / IF EXISTS agar idempotent
-- (aman dijalankan ulang jika sudah pernah diapply sebagian)

-- ── 1. Enum OtpPurpose ──────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "OtpPurpose" AS ENUM ('RESET_PASSWORD', 'VERIFY_PHONE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ── 2. Tabel OtpCode ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "OtpCode" (
    "id"         TEXT NOT NULL,
    "phone"      TEXT NOT NULL,
    "code"       TEXT NOT NULL,
    "purpose"    "OtpPurpose" NOT NULL,
    "attempts"   INTEGER NOT NULL DEFAULT 0,
    "resetToken" TEXT,
    "usedAt"     TIMESTAMP(3),
    "expiresAt"  TIMESTAMP(3) NOT NULL,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OtpCode_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "OtpCode_resetToken_key" ON "OtpCode"("resetToken");
CREATE INDEX IF NOT EXISTS "OtpCode_phone_purpose_idx" ON "OtpCode"("phone", "purpose");
CREATE INDEX IF NOT EXISTS "OtpCode_resetToken_idx" ON "OtpCode"("resetToken");
CREATE INDEX IF NOT EXISTS "OtpCode_expiresAt_idx" ON "OtpCode"("expiresAt");

-- ── 3. Kolom phone di User (nullable, unique) ────────────────────────────────
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "User_phone_key" ON "User"("phone");
CREATE INDEX IF NOT EXISTS "User_phone_idx" ON "User"("phone");

-- ── 4. Buat email nullable di User ──────────────────────────────────────────
-- (email sebelumnya NOT NULL di 0001_init; sekarang nullable karena login pakai phone)
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;

-- ── 5. Kolom QRIS di Invoice ─────────────────────────────────────────────────
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "qrisQrUrl" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "qrisQrString" TEXT;
