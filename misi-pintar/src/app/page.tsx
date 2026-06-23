import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import LandingPage from '@/components/landing/LandingPage'

export const metadata = {
  title: 'Misi Pintar — Aplikasi Literasi Keuangan Keluarga #1 di Indonesia',
  description:
    'Ubah PR sekolah, baca buku, dan tugas rumah jadi misi seru berhadiah saldo saku virtual. Anak belajar mandiri, orang tua tenang. Gratis selamanya.',
  keywords: ['aplikasi uang anak', 'literasi keuangan anak', 'tabungan virtual anak', 'misi pintar'],
  openGraph: {
    title: 'Misi Pintar — Kuota Senyuman untuk Keluarga Indonesia',
    description: 'Misi seru berhadiah saldo virtual. 100% gratis.',
    type: 'website',
    locale: 'id_ID',
  },
}

export default async function HomePage() {
  const session = await auth()

  if (session) {
    const role = session.user.role
    if (role === 'PARENT') redirect('/dashboard')
    if (role === 'CHILD') redirect('/child/dashboard')
    if (role === 'SUPER_ADMIN') redirect('/superadmin')
  }

  return <LandingPage />
}
