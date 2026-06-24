---
name: Turbopack serverExternalPackages
description: CommonJS-heavy packages like nodemailer fail to resolve under Turbopack unless declared as server-external in next.config.ts.
---

## Rule
Any Node.js package with CommonJS internals (conditional exports, native bindings, or CJS-only distribution) must be added to `serverExternalPackages` in `next.config.ts` for Turbopack to resolve it correctly in API routes.

```ts
const nextConfig: NextConfig = {
  serverExternalPackages: ["nodemailer"], // add more as needed
  // ...
};
```

**Why:** Turbopack attempts to bundle server-side packages but fails on CJS packages with complex export maps. Declaring them external tells Next.js to leave them as `require()` calls at runtime, where Node.js resolves them natively.

**How to apply:** Whenever a new server-only package (SMTP, PDF rendering, native addons) throws "Module not found" only in Turbopack but is confirmed present in `node_modules`, add it to this list before assuming the package is missing.

Note: `@react-pdf/renderer` was already working — its exports may already be handled differently by Turbopack, or it went through a different resolution path.
