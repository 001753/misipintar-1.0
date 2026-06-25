---
name: Misi Pintar Replit dev server
description: Build toolchain decisions for Replit dev and cPanel production builds, including module audit results.
---

## Dev server (Replit)

`npm run dev` → `next dev --port 5000` — **Turbopack** (default Next.js 16, no flag needed).

## Production / cPanel build

`npm run build:cpanel` → `next build --webpack` — **WAJIB pakai --webpack di cPanel**.

### Root cause Turbopack panic di cPanel

cPanel menginstall `node_modules` sebagai **symlink** ke `~/nodevenv/<app>/`.
Turbopack menolak symlink di luar project root → panic:
`Symlink [project]/node_modules is invalid, it points out of the filesystem root`
Webpack mengikuti symlink via resolusi Node.js → tidak ada masalah.

### Mengapa TIDAK pakai .babelrc

`.babelrc` dengan `next/babel` men-disable SWC → merusak Server Actions.
Solusi: `--webpack` tanpa `.babelrc` → webpack pakai SWC loader bawaan Next.js via `@swc/helpers`.

## Konstanta SERVER_EXTERNAL_PACKAGES (next.config.ts)

Satu sumber kebenaran untuk paket yang tidak boleh di-bundle, dipakai oleh
`serverExternalPackages` (Turbopack) DAN `webpack.externals` (cPanel build):

```ts
const SERVER_EXTERNAL_PACKAGES = [
  "nodemailer",      // CJS-heavy
  "bullmq",          // CJS + dynamic require
  "@prisma/client",  // native .node binary
  "prisma",          // native .node binary
  "@react-pdf/renderer", // ESM-only (type:"module")
  "nanoid",          // ESM-only (type:"module", v5+)
] as const;
```

**Why dual registration:** `serverExternalPackages` hanya berlaku untuk Turbopack.
Webpack butuh entri terpisah di `webpack.externals`. Keduanya harus sinkron.

## Audit paket ESM-only terverifikasi (tidak perlu di-external)

Paket berikut BUKAN ESM-only — aman di-bundle webpack:
- `firebase-admin` — CJS
- `@aws-sdk/client-s3` — dual CJS/ESM
- `ioredis` — CJS
- `midtrans-client` — CJS
- `preact` — dual
- `recharts` — dual
- `framer-motion` — dual
- `date-fns` — dual
- `zod` — dual

## Fix src/lib/midtrans.ts

`require("crypto")` inline dihapus → `import crypto from "crypto"` di top-level.
**Why:** Dynamic `require()` di dalam fungsi bisa gagal di bundler mode tertentu.
