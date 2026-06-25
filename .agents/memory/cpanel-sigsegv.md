---
name: cPanel build SIGSEGV fix
description: Why next build --webpack crashes with SIGSEGV on cPanel and the complete multi-layer fix.
---

# cPanel build SIGSEGV — Complete Root Cause & Fix

## Symptom
```
✓ Collecting page data using 1 worker in 5.3s
⨯ Next.js build worker exited with code: null and signal: SIGSEGV
```

## Full root cause chain

1. **`tasks.ts` (server action) is evaluated by the build worker** during "Collecting page data"
2. `tasks.ts` statically imports `@/lib/notifications/fcm`
3. `fcm.ts` had `import * as admin from "firebase-admin"` at the **top level**
4. Webpack (serverExternalPackages) turns this into `require("firebase-admin")` at module load time
5. `firebase-admin` includes `@grpc/grpc-js` with **native C++ bindings**
6. When the build worker process exits after finishing page collection, gRPC native teardown crashes → SIGSEGV

Same problem existed in `firebase-admin.ts` with `import admin from "firebase-admin"`.

## Why `NEXT_PHASE` guard didn't help
`NEXT_PHASE === 'phase-production-build'` is set in the main build process but **NOT injected into the child worker subprocess** by Next.js 16.x. So the instrumentation guard silently failed.

## Three-layer fix applied

### Layer 1: Lazy require() in fcm.ts and firebase-admin.ts
Replaced static top-level import with a `getAdmin()` helper using `require()` inside the function:

```typescript
// REMOVED: import * as admin from "firebase-admin"
import type * as AdminType from "firebase-admin"; // type-only, no JS output

function getAdmin(): typeof AdminType {
  return require("firebase-admin") as typeof AdminType;
}

function initFirebase() {
  if (!process.env.FIREBASE_PROJECT_ID || ...) {
    console.warn("...");
    return undefined; // ← getAdmin() never called → native code never loads
  }
  const admin = getAdmin(); // only reached when Firebase IS configured
  ...
}
```

**Why this works:** cPanel has no Firebase env vars → `initFirebase()` returns early → `getAdmin()` / `require("firebase-admin")` never executes → gRPC native code never loads → no SIGSEGV.

### Layer 2: NEXT_BUILD=1 env var in all build scripts (package.json)
```
"build": "NEXT_BUILD=1 ... next build --webpack"
"build:prod": "... NEXT_BUILD=1 ... next build --webpack"
"build:cpanel": "... NEXT_BUILD=1 ... next build --webpack"
```

### Layer 3: Dual guard in instrumentation.ts
```typescript
if (process.env.NEXT_PHASE === 'phase-production-build' || process.env.NEXT_BUILD === '1') return
```
Prevents worker bootstrap (BullMQ, Firebase) from running in the build worker even if imports somehow happen.

## Key principle
**Never use static top-level `import` for packages with native bindings in files that get imported by server actions or pages.** Use `require()` inside function bodies so native code loads lazily and only when actually needed at runtime.

**How to apply:** If adding new server-only modules with native bindings (e.g., sharp, canvas, grpc-based SDKs), always use lazy `require()` pattern — never a static import.
