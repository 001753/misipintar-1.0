---
name: Misi Pintar Replit dev server
description: Build toolchain decisions for Replit dev and cPanel production builds.
---

## Dev server (Replit)

`npm run dev` → `next dev --port 5000` — **Turbopack** (default Next.js 16, no flag needed).
Turbopack berjalan normal di Replit karena node_modules bukan symlink.

## Production / cPanel build

`npm run build:cpanel` → `next build --webpack` — **WAJIB pakai --webpack di cPanel**.

### Root cause Turbopack panic di cPanel

cPanel menginstall `node_modules` sebagai **symlink** yang menunjuk ke `~/nodevenv/<app>/`.
Turbopack menolak symlink di luar project root → panic:
`Symlink [project]/node_modules is invalid, it points out of the filesystem root`

Webpack mengikuti symlink via resolusi Node.js standar → tidak ada masalah.

### Mengapa TIDAK pakai .babelrc

Sebelumnya `.babelrc` dengan `next/babel` preset ditambahkan sementara agar Babel menggantikan SWC.
Ini **merusak Server Actions** karena Babel tidak handle `"use server"` directive dengan benar.

Solusi: `--webpack` tanpa `.babelrc` → webpack tetap pakai **SWC loader bawaan Next.js**
(via `@swc/helpers` yang sudah ada di dependencies). `RAYON_NUM_THREADS=1` membatasi
thread Rust/SWC agar tidak memicu EAGAIN di shared hosting.

**Why:** Urutan prioritas: `--webpack` (no panic) > no `.babelrc` (SWC tetap aktif, Server Actions jalan).

## serverExternalPackages + webpack externals

Paket CJS-heavy dikecualikan di dua tempat agar kompatibel dengan kedua bundler:
- `serverExternalPackages: ["nodemailer", "bullmq"]` → berlaku untuk Turbopack (dev)
- `webpack.externals += "bullmq"` → berlaku untuk webpack (cPanel build)
- `config.parallelism = 1` di webpack config → batasi memory usage saat build di shared hosting
