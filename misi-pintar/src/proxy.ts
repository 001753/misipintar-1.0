import { auth } from '@/lib/auth/config'
import { NextResponse } from 'next/server'

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

  // ─── Route /superadmin/* → hanya SUPER_ADMIN ─────────
  if (pathname.startsWith('/superadmin') && role !== 'SUPER_ADMIN') {
    return NextResponse.redirect(new URL('/unauthorized', req.url))
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
