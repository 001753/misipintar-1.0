---
name: cPanel build SIGSEGV fix
description: Why next build --webpack crashes with SIGSEGV on cPanel and the correct fix.
---

# cPanel build SIGSEGV — Root Cause & Fix

## The symptom
```
✓ Collecting page data using 1 worker in 5.3s
⨯ Next.js build worker exited with code: null and signal: SIGSEGV
```

## Root cause
`instrumentation.ts` (`register()`) runs inside Next.js's build worker during the "Collecting page data" phase. When no Redis/Firebase is configured it logs warnings and returns early — BUT the dynamic imports still load `bullmq` (`Worker` class) and `firebase-admin`. These packages register process-level signal handlers (`SIGTERM`, `SIGINT`, etc.) at import time. When the worker process exits normally after finishing page data collection, those handlers fire and cause a SIGSEGV on cPanel's low-ulimit environment.

**Why `engineType = "binary"` alone doesn't fix it:** the crash is not from Prisma's native addon — it happens after Prisma is never even initialized, purely from the BullMQ/Firebase cleanup handlers at process exit.

## The fix
Guard `instrumentation.ts` against the build phase at the very top of `register()`:

```typescript
export async function register() {
  if (process.env.NEXT_PHASE === 'phase-production-build') return
  // ... rest of workers bootstrap
}
```

**Why:** `NEXT_PHASE` is set to `'phase-production-build'` during `next build`. Workers never need to run during build — they're only needed at server runtime. This single guard prevents all signal handler registration in the build worker.

## Also applied
`prisma/schema.prisma` has `engineType = "binary"` as an additional safety measure (avoids native .node addon in worker threads), though it's not the primary fix.

**How to apply:** Any time `instrumentation.ts` is modified, ensure the build-phase guard stays at the top.
