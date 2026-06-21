import { auth } from '@/lib/auth/config'
import { NextResponse } from 'next/server'

// [6.1] IP allowlist opsional untuk /superadmin/*
// Set SUPERADMIN_ALLOWED_IPS=1.2.3.4,5.6.7.8 di env untuk membatasi akses
function checkSuperadminIP(req: Parameters<typeof auth>[0] & { headers: Headers }): boolean {
  const raw = process.env.SUPERADMIN_ALLOWED_IPS
  if (!raw) return true // tidak ada allowlist = semua IP boleh
  const allowed = raw.split(',').map((ip) => ip.trim()).filter(Boolean)
  const clientIP =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  return allowed.includes(clientIP)
}

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth
  const role = session?.user?.role

  // ─── Tidak terautentikasi ─────────────────────────────
  if (!session) {
    if (
      pathname.startsWith('/dashboard') ||
      pathname.startsWith('/child') ||
      pathname.startsWith('/superadmin')
    ) {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next()
  }

  // ─── Route /dashboard/* → hanya PARENT ───────────────
  if (pathname.startsWith('/dashboard') && role !== 'PARENT') {
    return NextResponse.redirect(new URL('/unauthorized', req.url))
  }

  // ─── Route /child/* → hanya CHILD ────────────────────
  if (pathname.startsWith('/child') && role !== 'CHILD') {
    return NextResponse.redirect(new URL('/unauthorized', req.url))
  }

  // ─── Route /superadmin/* → hanya SUPER_ADMIN + IP allowlist ─────────
  if (pathname.startsWith('/superadmin')) {
    if (role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }
    if (!checkSuperadminIP(req as Parameters<typeof auth>[0] & { headers: Headers })) {
      return NextResponse.json({ error: 'Forbidden — IP not allowed' }, { status: 403 })
    }
  }

  // ─── Redirect ke dashboard jika sudah login ───────────
  if (pathname === '/login' || pathname === '/register') {
    if (role === 'PARENT') return NextResponse.redirect(new URL('/dashboard', req.url))
    if (role === 'CHILD') return NextResponse.redirect(new URL('/child/dashboard', req.url))
    if (role === 'SUPER_ADMIN') return NextResponse.redirect(new URL('/superadmin', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/child/:path*',
    '/superadmin/:path*',
    '/login',
    '/register',
  ],
}
