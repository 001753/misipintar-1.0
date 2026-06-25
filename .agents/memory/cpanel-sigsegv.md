---
name: cPanel build SIGSEGV fix
description: Complete root cause analysis and fix for SIGSEGV during next build --webpack on cPanel.
---

# cPanel build SIGSEGV — Complete Analysis & Fix

## Symptom
```
✓ Collecting page data using 1 worker in 5.8s
⨯ Next.js build worker exited with code: null and signal: SIGSEGV
```

## Full root cause chain (multiple, compounding)

During `next build`, a worker subprocess evaluates ALL page modules and server action modules to collect export metadata. Any code that runs at **module level** (top-level imports and statements) executes inside this worker. When the worker exits normally after collection, native C++ destructors and registered signal handlers run — if any of these are unstable (due to cPanel's low ulimit or mismatched environment), SIGSEGV occurs.

### Cause 1: `firebase-admin` static import (MAIN CRASH)
`tasks.ts` (server action) statically imports `fcm.ts`, which had `import * as admin from "firebase-admin"`. Webpack turns this into `require("firebase-admin")` at module load. `firebase-admin` includes gRPC native C++ code. On worker exit, gRPC native teardown → SIGSEGV.

### Cause 2: BullMQ/Firebase signal handlers via instrumentation
`instrumentation.ts`'s `register()` runs inside the build worker (NEXT_RUNTIME='nodejs'). It imports BullMQ and firebase-admin even when Redis/Firebase are unavailable, registering process-level signal handlers. Worker exit triggers these → SIGSEGV.

### Cause 3: `NEXT_PHASE` not injected into build worker subprocess
`NEXT_PHASE === 'phase-production-build'` is set in the main build process but Next.js 16 does NOT propagate it to the child worker subprocess. Guards based on NEXT_PHASE silently fail.

### Cause 4: `@prisma/client` static import
`import { PrismaClient } from '@prisma/client'` at the top of `prisma.ts` loads Prisma's module-level initialization code (engine lifecycle handlers, binary subprocess management setup). Even with the Proxy pattern preventing `new PrismaClient()`, the module-level import alone registers cleanup handlers that crash on worker exit.

### Cause 5: `midtrans-client` module-level instantiation
`midtrans.ts` had `new midtransClient.Snap({...})` and `new midtransClient.CoreApi({...})` at module level. Any page importing `subscription.ts` → `midtrans.ts` would trigger this.

## Complete fix (5 layers)

### Layer 1: Lazy require() for all packages with native code or heavy init

**`prisma.ts`** — remove `import { PrismaClient } from '@prisma/client'`; use `require()` inside `createPrismaClient()`:
```typescript
import type { PrismaClient as PrismaClientType } from '@prisma/client' // type-only, no JS output
function createPrismaClient() {
  const { PrismaClient } = require('@prisma/client') as typeof import('@prisma/client')
  return new PrismaClient({...})
}
```

**`fcm.ts`** — remove `import * as admin from "firebase-admin"`; use lazy `getAdmin()`:
```typescript
import type * as AdminType from "firebase-admin" // type-only
function getAdmin() { return require("firebase-admin") as typeof AdminType }
function initFirebase() {
  if (!FIREBASE_env_vars) { console.warn(...); return undefined } // getAdmin() never called
  const admin = getAdmin(); ...
}
```

**`firebase-admin.ts`** — same pattern as fcm.ts.

**`midtrans.ts`** — remove `import midtransClient` + module-level `new Snap({})`; use Proxy:
```typescript
import type midtransClientType from "midtrans-client" // type-only
function getMidtransClient() { return require("midtrans-client") }
export const snap = new Proxy({} as Snap, {
  get(_, prop) {
    if (!_snap) _snap = new (getMidtransClient()).Snap({...})
    return Reflect.get(_snap, prop, _snap)
  }
})
```

### Layer 2: NEXT_BUILD=1 in all build scripts (package.json)
```
"build": "NEXT_BUILD=1 ... next build --webpack"
"build:prod": "... NEXT_BUILD=1 ... next build --webpack"
"build:cpanel": "... NEXT_BUILD=1 ... next build --webpack"
```

### Layer 3: Dual guard in instrumentation.ts
```typescript
if (process.env.NEXT_PHASE === 'phase-production-build' || process.env.NEXT_BUILD === '1') return
```

### Layer 4: engineType = "binary" in prisma/schema.prisma
Uses standalone binary process for queries — avoids loading .node native addon.

## The master rule for cPanel Next.js apps
**Never use static top-level `import` for any package that:**
- Has native C++ bindings (.node files, gRPC, canvas, sharp, etc.)
- Registers process-level signal/exit handlers at module load
- Creates instances or connections at module level

Always use `import type` for TypeScript types + lazy `require()` inside function bodies for the actual runtime code.

**Packages requiring lazy treatment in this codebase:** `@prisma/client`, `firebase-admin`, `midtrans-client`.
Pure JS packages (ioredis v5, bullmq, bcryptjs, nodemailer) are safe as static imports.
