---
name: Misi Pintar Replit dev server
description: How to run the Next.js 16 + Tailwind v4 dev server on Replit without Turbopack errors
---

## Rule
Always run the dev server with `--webpack` flag: `node_modules/.bin/next dev --webpack --port 5000`

**Why:** Next.js 16 defaults to Turbopack in dev mode. Tailwind CSS v4 uses `@tailwindcss/postcss` which Turbopack tries to resolve as `@vercel/turbopack/postcss` — a package that is NOT bundled with Next.js 16.2.9. This causes a fatal build error on the CSS file. Switching to webpack avoids the issue entirely.

**How to apply:** The Replit workflow command must always include `--webpack`. If `@swc/helpers` is missing, install it (`npm install @swc/helpers`) — webpack mode requires it. Turbopack root config in `next.config.ts` does NOT fix this.
