import type { DefaultSession } from 'next-auth'

// ─── NextAuth augmentations ───────────────────────────────
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: 'PARENT' | 'CHILD' | 'SUPER_ADMIN'
      familySpaceId: string | null
      childId: string | null
      phone: string | null
    } & DefaultSession['user']
  }
}

// next-auth/jwt augmentation is handled via type assertions in auth/config.ts
// because next-auth v5 beta does not expose a stable next-auth/jwt module path

// ─── Shared action result type ────────────────────────────
export type ActionResult<T = null> =
  | { success: true; data: T }
  | { success: false; error: string }
