---
name: Misi Pintar project setup
description: Key setup quirks for the Misi Pintar Next.js app running on Replit
---

# Misi Pintar — Setup Quirks

## Prisma v7 db push
Prisma v7 removed `url` from schema.prisma datasource block. To run migrations:
```
cd misi-pintar && npx prisma db push --url "$DATABASE_URL"
```
The `prisma.config.ts` uses PrismaPg adapter for runtime but CLI commands need the `--url` flag.

**Why:** Prisma v7 moved connection config out of schema into prisma.config.ts, but CLI still needs explicit URL for migrate/push.

## App runs from subdirectory
The Next.js app lives in `misi-pintar/` subdirectory. Workflow: `cd misi-pintar && npm run dev`
Port: 5000

## Plans must be seeded
Before users can register, seed plans via: `GET /api/seed/plans` (dev only, blocked in production).

## Redis is optional
Redis is used for login rate limiting. If `REDIS_URL` is not set, rate limiting is disabled gracefully (warn logged, not crash).

## Firebase is optional  
Firebase Admin is used for push notifications. If `FIREBASE_*` env vars not set, messaging is `undefined` (warn logged, not crash).

## NEXTAUTH_SECRET fallback
Auth config falls back to `SESSION_SECRET` if `NEXTAUTH_SECRET` is not set (both are in Replit secrets).
