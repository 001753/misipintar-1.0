-- DOKU Request-Id is the provider's notification retry/replay identifier.
-- It must be unique so concurrent duplicate notifications cannot both enter
-- the payment state transition.
ALTER TABLE "PaymentLog"
  ADD COLUMN IF NOT EXISTS "providerRequestId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "PaymentLog_providerRequestId_key"
  ON "PaymentLog"("providerRequestId");