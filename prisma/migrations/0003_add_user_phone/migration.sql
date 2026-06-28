-- Migration: tambah kolom phone ke tabel User
-- Kolom ini ada di schema.prisma sejak awal tapi terlewat di 0001_init.
-- IF NOT EXISTS agar aman dijalankan di DB yang sudah punya kolom ini.

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "User_phone_key" ON "User"("phone");
CREATE INDEX IF NOT EXISTS "User_phone_idx" ON "User"("phone");
