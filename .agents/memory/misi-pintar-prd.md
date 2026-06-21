---
name: Misi Pintar PRD rules
description: Non-negotiable architecture rules from PRD v4.1 for Misi Pintar
---

# Misi Pintar PRD v4.1 — Architecture Rules

## Core constraints (never violate)
1. **familySpaceId always from SESSION** — never from client params/URL. Every Prisma query for tenant data MUST filter by `familySpaceId` from server session.
2. **Zero client-side math** — all financial calculations (balance, interest, tax) on server only.
3. **Server Actions only** for mutations touching balance/transactions. No API routes for financial ops.
4. **prisma.$transaction()** required for any operation touching balance. No balance update without atomic transaction.
5. **TransactionLedger is IMMUTABLE** — no delete or update functions on this table ever.
6. **AdminAuditLog** for every superadmin action — not console.log.
7. **NOT e-money** — Midtrans only for subscription billing, not child wallet transfers.

## Phase order (must be followed)
Phase 0 Setup → 1 Auth/FamilySpace → 2 Child/Task → 3 Ledger → 4 Midtrans → 5 FCM/SSE → 6 SuperAdmin → 7 Rate Limiting → 8 Tests → 9 Audit/Webhook → 10 Legal

## Current status (as of Phase 3 completion)
- Phase 0-3 complete: auth, family space, child management, task management, ledger transfer, interest/tax engine, history pages
- 9/9 vitest tests passing (Phase 2 suite)
- Plans seeded (Starter/Pro/Educator/School)
- Child `deletedAt` soft delete field added to schema
- AdminAuditLog.adminId is required (not nullable) — cron workers cannot write to it; use console.log only
- BullMQ v5 uses `pattern` not `cron` in RepeatOptions

## Plan limits JSON shape
```json
{ "maxChildren": 2, "maxTasksPerMonth": 10 }
```
`-1` means unlimited (PRO plan).

## Upload endpoint
`POST /api/upload/proof` — CHILD only, max 5MB, JPG/PNG/WebP. Cloudflare R2 optional (placeholder URL returned if R2 not configured).
