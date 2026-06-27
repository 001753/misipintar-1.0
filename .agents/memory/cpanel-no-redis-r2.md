---
name: cPanel Redis & R2 alternatives
description: How Redis (BullMQ) and Cloudflare R2 were replaced for cPanel shared hosting.
---

# cPanel: Pengganti Redis & Cloudflare R2

## Redis / BullMQ → DB-based cron lock

**Rule:** Jika `REDIS_URL` tidak ada, worker BullMQ tidak jalan. Cron job dijalan via HTTP endpoint + PostgreSQL distributed lock.

**How to apply:**
- `CronLock` model di schema.prisma: upsert dengan `ON CONFLICT DO UPDATE WHERE expiresAt < now()`
- `acquireDbLock(id, ttlSeconds)` di `src/lib/db-lock.ts` — return false jika lock masih aktif
- Worker files (`interest.worker.ts`, `subscription.worker.ts`) menggunakan `acquireDbLock` / `releaseDbLock`
- Endpoint: `POST /api/cron/interest`, `/api/cron/tax`, `/api/cron/expire-subscriptions`
- Diamankan dengan `Authorization: Bearer $CRON_SECRET`

**Why:** cPanel shared hosting tidak menyediakan Redis. DB lock via upsert + conditional update adalah atomic dan aman untuk single-instance.

**cPanel cron setup:**
```
5 0 * * *   curl -s -X POST https://mp.jobenapp.cloud/api/cron/interest -H "Authorization: Bearer $CRON_SECRET"
5 1 1 * *   curl -s -X POST https://mp.jobenapp.cloud/api/cron/tax -H "Authorization: Bearer $CRON_SECRET"
0 * * * *   curl -s -X POST https://mp.jobenapp.cloud/api/cron/expire-subscriptions -H "Authorization: Bearer $CRON_SECRET"
```

## Cloudflare R2 → PostgreSQL bytea (FileUpload)

**Rule:** Jika `R2_ACCOUNT_ID` tidak ada, upload foto bukti tugas disimpan ke tabel `FileUpload` sebagai `Bytes` (bytea).

**How to apply:**
- `FileUpload` model di schema.prisma: `data Bytes`, index pada `childId` dan `familySpaceId`
- Upload endpoint `src/app/api/upload/proof/route.ts`: coba R2 dulu, fallback ke DB
- Serve endpoint `GET /api/files/[id]`: baca dari DB, kembalikan sebagai response dengan `Content-Type` asli
- URL yang disimpan: `${APP_URL}/api/files/${id}` (bukan placeholder)
- Cache-Control: `public, max-age=31536000, immutable` (file tidak berubah setelah upload)

**Why:** Untuk cPanel tanpa R2, penyimpanan bytea di PostgreSQL lebih andal daripada placeholder URL yang mematahkan fitur klaim tugas.

**Migration SQL:** `prisma/migrations/0002_cron_lock_and_file_upload/migration.sql`
Jalankan via `npx prisma migrate deploy` saat deploy ke cPanel.
