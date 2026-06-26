---
name: cPanel build SIGABRT and Turbopack symlink fix
description: cPanel node_modules is a symlink — Turbopack panics on it. Must use --webpack for production builds. SIGABRT with webpack is fixed by lazy FCM/Redis + force-dynamic + workerThreads:false.
---

## Rules

1. **Always use `--webpack` in the cPanel deploy build command.** Turbopack (Next.js 16 default) panics with `TurbopackInternalError: Symlink [project]/node_modules is invalid, it points out of the filesystem root` because cPanel's Node.js hosting symlinks `node_modules` to a venv path outside the project root.

2. **The SIGABRT that previously plagued `--webpack` is now fixed by:**
   - `NEXT_BUILD=1` env var set in deploy.sh before `next build`
   - FCM (`src/lib/notifications/fcm.ts`) fully async lazy init with `NEXT_BUILD === '1'` guard
   - Firebase Admin (`src/lib/firebase-admin.ts`) fully async lazy init with `NEXT_BUILD === '1'` guard
   - Redis (`src/lib/redis.ts`) has `NEXT_BUILD === '1'` guard in `createRedisClient()`
   - `export const dynamic = 'force-dynamic'` on all server component page.tsx files
   - `force-dynamic` moved to layouts for client component pages (auth, forgot-password, adm-panel)
   - `experimental.workerThreads: false` in next.config.ts
   - `staticPageGenerationTimeout: 1` in next.config.ts

3. **`turbopack: {}` in next.config.ts** resolves the "webpack config with no turbopack config" dev warning — leave it in place for local dev (Turbopack), but the cPanel build uses `--webpack` which ignores it safely.

**Why:** cPanel shared hosting (`nodevenv`) symlinks node_modules to `/home/user/nodevenv/public_html/app/22/lib/node_modules`. Turbopack's sandboxed resolver treats this symlink as pointing outside the filesystem root and hard-panics. Webpack resolves symlinks fine.

**How to apply:** deploy.sh build command must always be:
```bash
NEXT_BUILD=1 NODE_ENV=production ./node_modules/.bin/next build --webpack
```
