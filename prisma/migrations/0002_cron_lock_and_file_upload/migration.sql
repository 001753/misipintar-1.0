-- Migration: CronLock dan FileUpload
-- Dijalankan otomatis via: npx prisma migrate deploy

-- ── CronLock: DB-based distributed lock pengganti Redis mutex ───────────────
CREATE TABLE IF NOT EXISTS "CronLock" (
    "id"        TEXT NOT NULL,
    "lockedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CronLock_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "CronLock_expiresAt_idx" ON "CronLock"("expiresAt");

-- ── FileUpload: penyimpanan file di PostgreSQL pengganti Cloudflare R2 ───────
CREATE TABLE IF NOT EXISTS "FileUpload" (
    "id"            TEXT NOT NULL,
    "filename"      TEXT NOT NULL,
    "contentType"   TEXT NOT NULL,
    "size"          INTEGER NOT NULL,
    "data"          BYTEA NOT NULL,
    "childId"       TEXT NOT NULL,
    "familySpaceId" TEXT NOT NULL,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FileUpload_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "FileUpload_childId_idx" ON "FileUpload"("childId");
CREATE INDEX IF NOT EXISTS "FileUpload_familySpaceId_idx" ON "FileUpload"("familySpaceId");
