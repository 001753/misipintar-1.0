---
name: Replit Next.js version constraint
description: Next.js 15.3.4 is blocked by Replit's security policy; stay on ^16.2.9. Build fixes for cPanel SIGABRT do not require a version downgrade.
---

## Rule
Do NOT attempt to install `next@15.3.4` or `eslint-config-next@15.3.4` on Replit.
The package firewall returns HTTP 403 and the install fails.

**Why:** Replit's security policy blocks that specific version.
The project runs correctly on `next@^16.2.9` (resolves to 16.2.9).

## How to apply
When the cPanel build guide says "Fix 1: ganti versi Next ke 15.3.4", skip that step on Replit.
The actual SIGABRT fixes that work are:
- FCM/firebase-admin: async lazy init with `NEXT_BUILD === '1'` guard
- Redis (ioredis): `NEXT_BUILD === '1'` guard in createRedisClient()
- All page.tsx files: `export const dynamic = 'force-dynamic'`
- next.config.ts: `staticPageGenerationTimeout: 1` (already present)
