-- Stable key used while reserving a DOKU checkout. The partial unique index
-- prevents two pending invoices for the same family/plan/cycle reservation,
-- while allowing a new invoice after the previous one is paid or failed.
ALTER TABLE "Invoice"
  ADD COLUMN IF NOT EXISTS "checkoutKey" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_pending_checkoutKey_key"
  ON "Invoice"("checkoutKey")
  WHERE "checkoutKey" IS NOT NULL AND "status" = 'PENDING';