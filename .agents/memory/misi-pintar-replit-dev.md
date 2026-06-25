---
name: Misi Pintar Replit dev server
description: How the dev server is configured for Replit and cPanel, including build toolchain decisions.
---

## Dev server (Replit)

`npm run dev` runs `next dev --port 5000` — **no `--webpack` flag**.

Next.js 16.2.9 now uses **Turbopack by default** and is fully compatible with:
- Tailwind v4 via `@tailwindcss/postcss` in `postcss.config.mjs`
- `serverExternalPackages` for CJS-heavy packages (nodemailer, bullmq)

The previous `--webpack` flag was required when Turbopack broke on `@vercel/turbopack/postcss` with Tailwind v4, but that is fixed in 16.2.9.

## cPanel build (`npm run build:cpanel`)

- Runs `bash scripts/cpanel-install.sh` then `next build` (no `--webpack`, no `.babelrc`)
- `.babelrc` creation was removed — it disabled SWC and caused `Module not found` errors for packages like `next-nprogress-bar`
- `RAYON_NUM_THREADS=1 NODE_OPTIONS='--max-old-space-size=1024'` kept for shared hosting memory limits

**Why:** The `.babelrc` with `next/babel` preset disabled SWC entirely and prevented proper module resolution for ESM packages. Turbopack + native SWC handles everything correctly.

## serverExternalPackages

CJS-heavy packages listed in `next.config.ts`:
- `nodemailer`
- `bullmq`

Add any new CJS-only Node.js packages here to prevent Turbopack bundling failures.
