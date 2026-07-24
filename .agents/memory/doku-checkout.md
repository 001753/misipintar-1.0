---
name: DOKU Checkout integration
description: Durable constraints for the hosted DOKU Checkout payment flow.
---

New subscription invoices use DOKU Hosted Checkout and are activated only after a validated server notification. Existing Midtrans invoices remain processable as legacy records, while QRIS creation paths are disabled without deleting historical records.

**Why:** The product needs a provider-neutral invoice history and must prevent client callbacks, duplicate notifications, or legacy QRIS routes from granting access.

**How to apply:** Keep DOKU notification validation tied to the exact raw request body, request target, amount, invoice reference, timestamp window, unique Request-Id, and idempotent invoice update. Keep the DOKU payment method allowlist explicit and exclude QRIS.

For webhook replay protection, persist the provider Request-Id in a unique nullable field on payment logs and insert it in the same transaction as invoice/subscription state changes. Only a PENDING, non-expired invoice may transition to PAID.

**Why:** A lookup-before-insert replay check is not atomic under concurrent delivery, and recording the notification outside the state transaction can consume a Request-Id when the state transaction later rolls back.

**How to apply:** Treat a unique-constraint conflict on the stored DOKU Request-Id as an acknowledged duplicate; allow the provider to retry if the enclosing state transaction failed.

Checkout creation uses a per-family PostgreSQL advisory transaction lock plus a unique pending checkout key for plan, cycle, and amount. Expired pending reservations are marked EXPIRED before a replacement is created.

**Why:** A read-then-create idempotency check is not safe for parallel clicks, and stale pending rows otherwise block replacement invoices under a partial unique index.

**How to apply:** Keep provider checkout creation inside the guarded reservation flow; reuse an existing URL, report an in-progress reservation, or create a replacement only after stale pending rows are expired.