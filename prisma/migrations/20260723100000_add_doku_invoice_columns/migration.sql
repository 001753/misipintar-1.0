-- Migration ini HANYA menangani perubahan tabel dan index untuk integrasi DOKU.
-- ALTER TYPE ... ADD VALUE (MANDIRI_VA, EWALLET) ditangani TERPISAH di luar transaction
-- oleh deploy.sh menggunakan `prisma db execute`, karena PostgreSQL melarang
-- ALTER TYPE ADD VALUE di dalam transaction block (error code 25001).

ALTER TABLE "Invoice"
  ADD COLUMN IF NOT EXISTS "billingCycle" TEXT,
  ADD COLUMN IF NOT EXISTS "paymentProvider" TEXT NOT NULL DEFAULT 'MIDTRANS',
  ADD COLUMN IF NOT EXISTS "providerInvoiceNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "providerRequestId" TEXT,
  ADD COLUMN IF NOT EXISTS "providerTransactionId" TEXT,
  ADD COLUMN IF NOT EXISTS "paymentUrl" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_providerInvoiceNumber_key"
  ON "Invoice"("providerInvoiceNumber");

CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_providerRequestId_key"
  ON "Invoice"("providerRequestId");

CREATE INDEX IF NOT EXISTS "Invoice_paymentProvider_status_idx"
  ON "Invoice"("paymentProvider", "status");

CREATE INDEX IF NOT EXISTS "Invoice_providerTransactionId_idx"
  ON "Invoice"("providerTransactionId");
