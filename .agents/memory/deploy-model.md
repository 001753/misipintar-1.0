---
name: MisiPintar deploy model (adopsi SKANSAGIRI)
description: Pola deploy 8-langkah untuk cPanel + Phusion Passenger. Idempoten — aman dijalankan berulang.
---

## Script utama: deploy.sh

Jalankan dari root project:
```bash
bash deploy.sh          # deploy branch main
bash deploy.sh develop  # deploy branch lain
```

## 8 Langkah

1. Validasi prasyarat (.env, DATABASE_URL, git)
2. Backup .env dan app.js ke .deploy_protect_$PID/
3. git reset --hard origin/<branch>  (pull bersih)
4. Restore .env dan app.js
5. Deteksi npm sistem cPanel (/opt/cpanel/ea-nodejsNN/bin/npm)
6. npm install ke ./node_modules lokal (hapus node_modules lama dulu)
7. prisma generate → prisma migrate deploy → next build --webpack → verifikasi → copy static
8. touch tmp/restart.txt → Passenger restart otomatis

## File yang TIDAK pernah di-overwrite oleh deploy

- `.env` — secrets
- `app.js` — entry point versi cPanel

## Rollback otomatis

Jika langkah 7 gagal, `.next/` lama dipulihkan dari `.next_backup_$$`.
Passenger di-restart dengan versi lama → site tetap online.

## Logging

- `deploy.log` — log setiap run deploy
- `logs/app.log` — log runtime Passenger (rotation 512KB)
- `logs/app.log.1`, `logs/app.log.2` — arsip rotation

## Build flag wajib cPanel

```bash
export RAYON_NUM_THREADS=1
export TOKIO_WORKER_THREADS=1
export UV_THREADPOOL_SIZE=1
export NODE_OPTIONS=--max-old-space-size=1024
next build --webpack
```

Turbopack DILARANG di cPanel — symlink nodevenv → panic.

## Constraint penting

- `app.js` WAJIB CJS (`"use strict"`, `require`) — MisiPintar tidak punya `"type":"module"`.
- `.babelrc` JANGAN ditambahkan — akan disable SWC dan rusak Server Actions.
- Port selalu 5000.
- `next.config.ts` tidak boleh diubah — `SERVER_EXTERNAL_PACKAGES` sudah benar.
