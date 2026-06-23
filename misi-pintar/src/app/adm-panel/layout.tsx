import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Admin Panel — Misi Pintar',
  robots: 'noindex, nofollow',
}

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (session?.user.role === 'SUPER_ADMIN') redirect('/superadmin')

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      {children}
    </div>
  )
}
