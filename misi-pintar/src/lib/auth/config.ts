import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'
import { z } from 'zod'

const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW = 15 * 60

async function checkRateLimit(identifier: string): Promise<boolean> {
  if (!redis) return false
  try {
    const key = `login_attempts:${identifier}`
    const attempts = await redis.incr(key)
    if (attempts === 1) await redis.expire(key, RATE_LIMIT_WINDOW)
    return attempts > RATE_LIMIT_MAX
  } catch {
    return false
  }
}

async function clearRateLimit(identifier: string): Promise<void> {
  if (!redis) return
  try {
    await redis.del(`login_attempts:${identifier}`)
  } catch {
  }
}

async function recordLoginAttempt(
  identifier: string,
  ipAddress: string,
  success: boolean
) {
  try {
    await prisma.loginAttempt.create({
      data: { identifier, ipAddress, success },
    })
  } catch {
  }
}

const parentLoginSchema = z.object({
  email: z.string().email(),
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
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, request) {
        const parsed = parentLoginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { email, password } = parsed.data
        const ip =
          request?.headers?.get?.('x-forwarded-for') ?? '0.0.0.0'

        const blocked = await checkRateLimit(email)
        if (blocked) {
          await recordLoginAttempt(email, ip, false)
          throw new Error('TOO_MANY_ATTEMPTS')
        }

        const user = await prisma.user.findUnique({
          where: { email },
          include: { familySpace: true },
        })

        if (!user || user.role === 'CHILD') {
          await recordLoginAttempt(email, ip, false)
          return null
        }

        const valid = await bcrypt.compare(password, user.passwordHash)
        if (!valid) {
          await recordLoginAttempt(email, ip, false)
          return null
        }

        await recordLoginAttempt(email, ip, true)
        await clearRateLimit(email)

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          familySpaceId: user.familySpaceId,
          childId: null,
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
          request?.headers?.get?.('x-forwarded-for') ?? '0.0.0.0'

        const blocked = await checkRateLimit(identifier)
        if (blocked) {
          await recordLoginAttempt(identifier, ip, false)
          throw new Error('TOO_MANY_ATTEMPTS')
        }

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

        if (!child) {
          await recordLoginAttempt(identifier, ip, false)
          return null
        }

        const valid = await bcrypt.compare(password, child.passwordHash)
        if (!valid) {
          await recordLoginAttempt(identifier, ip, false)
          return null
        }

        await recordLoginAttempt(identifier, ip, true)
        await clearRateLimit(identifier)

        return {
          id: child.id,
          name: child.name,
          email: null,
          role: 'CHILD' as const,
          familySpaceId: familySpace.id,
          childId: child.id,
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
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id
      session.user.role = token.role
      session.user.familySpaceId = token.familySpaceId
      session.user.childId = token.childId
      return session
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET ?? process.env.SESSION_SECRET,
})
