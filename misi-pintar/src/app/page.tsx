import type { Metadata } from 'next'
import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import LandingPage from '@/components/landing/LandingPage'

export const metadata: Metadata = {
  title: {
    absolute: 'MisiPintar - Ubah Kuota Marah-Marah Jadi Kuota Senyuman',
  },
  description:
    'Ubah PR sekolah, baca buku, dan tugas rumah jadi misi seru berhadiah saldo saku virtual. Anak belajar mandiri, orang tua tenang. Gratis selamanya.',
  keywords: [
    'aplikasi uang saku anak',
    'literasi keuangan anak',
    'tabungan virtual anak',
    'misi pintar',
    'aplikasi tugas anak',
    'familyspace',
    'jobenapps',
  ],
  alternates: {
    canonical: 'https://jobenapps.cloud',
  },
  openGraph: {
    title: 'MisiPintar - Ubah Kuota Marah-Marah Jadi Kuota Senyuman',
    description:
      'Misi seru berhadiah saldo virtual. Anak belajar nilai kerja keras, orang tua tenang. 100% gratis selamanya.',
    url: 'https://jobenapps.cloud',
    siteName: 'MisiPintar',
    locale: 'id_ID',
    type: 'website',
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
