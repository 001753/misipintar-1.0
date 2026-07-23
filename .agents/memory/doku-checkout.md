---
name: DOKU Checkout integration
description: Durable constraints for the hosted DOKU Checkout payment flow.
---

New subscription invoices use DOKU Hosted Checkout and are activated only after a validated server notification. Existing Midtrans invoices remain processable as legacy records, while QRIS creation paths are disabled without deleting historical records.

**Why:** The product needs a provider-neutral invoice history and must prevent client callbacks, duplicate notifications, or legacy QRIS routes from granting access.

**How to apply:** Keep DOKU notification validation tied to the exact raw request body, request target, amount, invoice reference, and idempotent invoice update. Keep the DOKU payment method allowlist explicit and exclude QRIS.