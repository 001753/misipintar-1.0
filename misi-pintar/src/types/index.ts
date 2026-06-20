import type { DefaultSession, DefaultJWT } from 'next-auth'

// ─── NextAuth augmentations ───────────────────────────────
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: 'PARENT' | 'CHILD' | 'SUPER_ADMIN'
      familySpaceId: string | null
      childId: string | null
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string
    role: 'PARENT' | 'CHILD' | 'SUPER_ADMIN'
    familySpaceId: string | null
    childId: string | null
  }
}

// ─── Shared action result type ────────────────────────────
export type ActionResult<T = null> =
  | { success: true; data: T }
  | { success: false; error: string }
