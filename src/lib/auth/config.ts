import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { createHash } from 'node:crypto'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { normalizePhone } from '@/lib/whatsapp'
import {
  checkLoginRateLimit,
  clearLoginRateLimit,
  recordLoginAttempt,
} from '@/lib/auth/loginGuard'

const parentLoginSchema = z.object({
  phone: z.string().min(8),
  password: z.string().min(1),
})

const adminLoginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
})

const childLoginSchema = z.object({
  spaceCode: z.string().length(6),
  username: z.string().min(1),
  password: z.string().min(1),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      id: 'parent-credentials',
      name: 'Parent',
      credentials: {
        phone: { label: 'No. WhatsApp', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, request) {
        const parsed = parentLoginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { phone, password } = parsed.data
        const normalizedPhone = normalizePhone(phone)
        const ip =
          request?.headers?.get?.('x-forwarded-for')?.split(',')[0]?.trim() ?? '0.0.0.0'

        await checkLoginRateLimit(normalizedPhone, ip)

        // Akses keluarga hanya tersedia bagi akun PARENT yang benar-benar
        // terhubung ke FamilySpace. Admin masuk lewat provider terpisah.
        const user = await prisma.user.findFirst({
          where: {
            phone: normalizedPhone,
          },
          include: { familySpace: true },
        })

        if (!user || user.role !== 'PARENT' || !user.familySpaceId) {
          await recordLoginAttempt(normalizedPhone, ip, false)
          return null
        }

        const valid = await bcrypt.compare(password, user.passwordHash)
        if (!valid) {
          await recordLoginAttempt(normalizedPhone, ip, false)
          return null
        }

        await recordLoginAttempt(normalizedPhone, ip, true)
        await clearLoginRateLimit(normalizedPhone)

        return {
          id: user.id,
          email: user.email ?? user.phone ?? '',
          name: user.name,
          role: user.role,
          familySpaceId: user.familySpaceId,
          childId: null,
          phone: user.phone,
        }
      },
    }),

    Credentials({
      id: 'admin-credentials',
      name: 'Admin',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, request) {
        const parsed = adminLoginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const email = parsed.data.email.toLowerCase()
        const ip =
          request?.headers?.get?.('x-forwarded-for')?.split(',')[0]?.trim() ?? '0.0.0.0'
        const identifier = `admin:${createHash('sha256').update(email).digest('hex')}`

        await checkLoginRateLimit(identifier, ip)

        const user = await prisma.user.findFirst({
          where: { email: { equals: email, mode: 'insensitive' } },
          include: { familySpace: true },
        })

        if (!user) {
          await recordLoginAttempt(identifier, ip, false)
          return null
        }

        const isPlatformAdmin = user.role === 'SUPER_ADMIN'
        const hasSchoolAdminAccess = isPlatformAdmin
          ? false
          : Boolean(await prisma.schoolMembership.findFirst({
              where: {
                userId: user.id,
                status: 'ACTIVE',
                role: { in: ['OWNER', 'ADMIN'] },
              },
              select: { id: true },
            }))

        if (!isPlatformAdmin && !hasSchoolAdminAccess) {
          await recordLoginAttempt(identifier, ip, false)
          return null
        }

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash)
        if (!valid) {
          await recordLoginAttempt(identifier, ip, false)
          return null
        }

        await recordLoginAttempt(identifier, ip, true)
        await clearLoginRateLimit(identifier)

        return {
          id: user.id,
          email: user.email ?? '',
          name: user.name,
          role: user.role,
          familySpaceId: user.familySpaceId,
          childId: null,
          phone: user.phone,
        }
      },
    }),

    Credentials({
      id: 'child-credentials',
      name: 'Child',
      credentials: {
        spaceCode: { label: 'Kode Keluarga', type: 'text' },
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, request) {
        const parsed = childLoginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { spaceCode, username, password } = parsed.data
        const identifier = `${spaceCode}:${username}`
        const ip =
          request?.headers?.get?.('x-forwarded-for')?.split(',')[0]?.trim() ?? '0.0.0.0'

        await checkLoginRateLimit(identifier, ip)

        const familySpace = await prisma.familySpace.findUnique({
          where: { spaceCode },
        })
        if (!familySpace) {
          await recordLoginAttempt(identifier, ip, false)
          return null
        }

        const child = await prisma.child.findUnique({
          where: {
            familySpaceId_username: {
              familySpaceId: familySpace.id,
              username,
            },
          },
        })

        if (!child || child.deletedAt) {
          await recordLoginAttempt(identifier, ip, false)
          return null
        }

        const valid = await bcrypt.compare(password, child.passwordHash)
        if (!valid) {
          await recordLoginAttempt(identifier, ip, false)
          return null
        }

        await recordLoginAttempt(identifier, ip, true)
        await clearLoginRateLimit(identifier)

        return {
          id: child.id,
          name: child.name,
          email: null,
          role: 'CHILD' as const,
          familySpaceId: familySpace.id,
          childId: child.id,
          phone: null,
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!
        token.role = (user as any).role
        token.familySpaceId = (user as any).familySpaceId ?? null
        token.childId = (user as any).childId ?? null
        token.phone = (user as any).phone ?? null
      }
      return token
    },
    async session({ session, token }) {
      const t = token as Record<string, unknown>
      session.user.id = t.id as string
      session.user.role = t.role as 'PARENT' | 'CHILD' | 'SUPER_ADMIN'
      session.user.familySpaceId = (t.familySpaceId as string | null) ?? null
      session.user.childId = (t.childId as string | null) ?? null
      session.user.phone = (t.phone as string | null) ?? null
      return session
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60,
    updateAge: 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET ?? process.env.SESSION_SECRET,
  trustHost: true,
})
