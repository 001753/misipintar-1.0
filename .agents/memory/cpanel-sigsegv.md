---
name: cPanel build SIGSEGV fix
description: Complete root cause analysis and fix for SIGSEGV during next build on cPanel. All native addons and their import chains.
---

# cPanel build SIGSEGV — Complete Analysis & Fix

## Symptom
```
✓ Collecting page data using 1 worker in 5.7s
⨯ Next.js build worker exited with code: null and signal: SIGSEGV
```

## How the crash happens
During `next build`, a child worker process evaluates ALL page AND API route modules to determine static vs dynamic. Any code at module level (top-level imports + statements) runs inside this worker. When the worker exits, native C++ destructors and registered signal handlers run — on cPanel (low ulimit, RHEL kernel), unstable teardown → SIGSEGV.

## All native addons present in this codebase
Found via `find node_modules -name "*.node"`:
- `@next/swc-*` — Next.js SWC transpiler (safe, not loaded in worker)
- `@prisma/engines/libquery_engine-*.so.node` — Prisma library engine
- `@msgpackr-extract/*/node.*.node` — **msgpackr native serializer, loaded by bullmq**
- `@img/sharp-*` — image processing (safe, not loaded in worker)
- `lightningcss-*` — CSS processing (safe, not loaded in worker)

## Full root cause chain (ALL causes, in order of fix)

### Cause 1: firebase-admin (gRPC native) via static import
`tasks.ts` (server action) → `fcm.ts` → `import * as admin from "firebase-admin"` → gRPC native C++ → SIGSEGV on worker exit.

### Cause 2: BullMQ workers via instrumentation.ts (before NEXT_BUILD guard)
`instrumentation.ts` `register()` → `bullmq` → `@msgpackr-extract` native → SIGSEGV.

### Cause 3: `NEXT_PHASE` guard does NOT work in Next.js 16 build worker
`process.env.NEXT_PHASE === 'phase-production-build'` is NOT propagated to child worker subprocess. Must use `NEXT_BUILD=1` from package.json build script (env vars ARE inherited by child processes).

### Cause 4: @prisma/client static import registering engine lifecycle handlers
`import { PrismaClient } from '@prisma/client'` at top of prisma.ts loads Prisma module-level initialization (engine signal handler registration) even with Proxy preventing `new PrismaClient()`.

### Cause 5: midtrans-client module-level instantiation
`midtrans.ts` had `new midtransClient.Snap({...})` at module level — creates objects on import.

### Cause 6 (FINAL): bullmq → @msgpackr-extract via API route static import ← **LAST REMAINING CRASH**
`api/queue/worker/route.ts` had static `import { interestQueue, subscriptionQueue } from '@/queues'` → `queues/index.ts` had static `import { Queue } from 'bullmq'` → `bullmq` loads `msgpackr` → loads `@msgpackr-extract` native C++ addon → SIGSEGV on worker exit.

## Complete fix (6 layers)

### Layer 1: Lazy require() for @prisma/client in prisma.ts
Remove `import { PrismaClient } from '@prisma/client'`, use `import type` + `require('@prisma/client')` inside `createPrismaClient()`.

### Layer 2: Lazy require() for firebase-admin in fcm.ts + firebase-admin.ts
Remove static import, use `import type` + `require("firebase-admin")` inside `getAdmin()`. Guard with early return when Firebase env vars absent (so getAdmin() is never called during build).

### Layer 3: Lazy Proxy for midtrans-client in midtrans.ts
Use `import type` + `require("midtrans-client")` inside `getMidtransClient()`. Wrap `snap` and `coreApi` in Proxy so they're only instantiated on first method call.

### Layer 4: NEXT_BUILD=1 in all build scripts + dual guard in instrumentation.ts
```
"build": "NEXT_BUILD=1 ... next build --webpack"
```
```typescript
if (process.env.NEXT_PHASE === 'phase-production-build' || process.env.NEXT_BUILD === '1') return
```

### Layer 5: Lazy require() for bullmq in queues/index.ts
Remove static `import { Queue } from 'bullmq'`, use `require('bullmq')` inside `makeQueue()` function body. makeQueue() still called at module level but `require('bullmq')` inside is only executed when Redis IS configured.

### Layer 6: Dynamic import for @/queues in api/queue/worker/route.ts
Remove static `import { interestQueue, subscriptionQueue } from '@/queues'`, replace with `await import('@/queues')` inside each POST/GET handler function body.

### Layer 7: engineType = "binary" in prisma/schema.prisma
Uses standalone binary process — avoids loading .node native addon for Prisma engine.

## The master rule
**Never use static top-level `import` for any package that:**
- Has native C++ bindings (.node files)
- Registers process-level signal/exit handlers at module load
- Has heavy module-level initialization or uses msgpackr/hiredis

**Pattern:** `import type Foo from 'pkg'` for types + `require('pkg')` inside function bodies.

**Safe static imports (pure JS, no native):** ioredis v5, bcryptjs, next-auth, zod, date-fns, nanoid, nodemailer.

**Packages requiring lazy treatment in this codebase:**
- `@prisma/client` → lazy in `src/lib/prisma.ts`
- `firebase-admin` → lazy in `src/lib/notifications/fcm.ts` + `src/lib/firebase-admin.ts`
- `midtrans-client` → lazy Proxy in `src/lib/midtrans.ts`
- `bullmq` → lazy in `src/queues/index.ts` + dynamic import in `src/app/api/queue/worker/route.ts`
