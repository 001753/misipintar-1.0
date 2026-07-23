-- Tambahkan kanal pembayaran DOKU tanpa mengubah histori invoice lama.
ALTER TYPE "PayMethod" ADD VALUE IF NOT EXISTS 'MANDIRI_VA';
ALTER TYPE "PayMethod" ADD VALUE IF NOT EXISTS 'EWALLET';

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