---
name: cPanel build SIGABRT and Turbopack symlink fix
description: cPanel node_modules is a symlink — Turbopack panics on it. Must use --webpack for production builds. SIGABRT with webpack is fixed by lazy require() for all native binaries + force-dynamic + workerThreads:false.
---

## Rules

1. **Always use `--webpack` in the cPanel deploy build command.** Turbopack (Next.js 16 default) panics with `TurbopackInternalError: Symlink [project]/node_modules is invalid, it points out of the filesystem root` because cPanel's Node.js hosting symlinks `node_modules` to a venv path outside the project root.

2. **The SIGABRT root cause:** During "Collecting page data", Next.js runs a build worker that evaluates page modules. Any file with a **static top-level `import X from 'pkg'`** for a native binary (BullMQ → @msgpackr-extract, ioredis, nodemailer, firebase-admin) installs signal handlers that crash the worker on exit → SIGABRT.

3. **The fix — all 4 native-binary packages must use lazy require() inside their functions:**
   - `src/lib/mailer.ts` — `require("nodemailer")` inside `getTransporter()`, NOT at top of file
   - `src/queues/workers/notification.worker.ts` — `require("bullmq")` inside `startNotificationWorker()`
   - `src/lib/jobs/cleanupLoginAttempts.ts` — `require("bullmq")` inside `startCleanupLoginAttemptsWorker()`
   - `src/app/api/sse/route.ts` — `require("ioredis")` inside `createSubscriberClient()`
   - FCM (`src/lib/notifications/fcm.ts`) — `await import('firebase-admin/...')` inside async fn (already done)
   - Redis (`src/lib/redis.ts`) — lazy init with `NEXT_BUILD === '1'` guard (already done)

4. **`import type { ... } from 'pkg'` is SAFE** — TypeScript erases type-only imports at compile time, zero runtime impact.

5. **Additional build safety guards:**
   - `instrumentation.ts` guards: `if (NEXT_PHASE === 'phase-production-build' || NEXT_BUILD === '1') return`
   - `export const dynamic = 'force-dynamic'` on all server pages
   - `experimental.workerThreads: false` in next.config.ts
   - `staticPageGenerationTimeout: 1` in next.config.ts

**Why:** Static `import` at module level is evaluated when webpack bundles the file into the build worker's module graph. Even if the import is inside a guarded branch at runtime, the binary's native constructor runs at module evaluation time — before any runtime guard executes.

**How to apply:** deploy.sh build command must always be:
```bash
NEXT_BUILD=1 NODE_ENV=production ./node_modules/.bin/next build --webpack
```
