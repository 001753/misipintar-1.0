import type { Metadata } from 'next'
import TentangKamiPage from '@/components/landing/TentangKamiPage'

export const metadata: Metadata = {
  title: 'Tentang MisiPintar - Platform Literasi Keuangan Keluarga #1 Indonesia',
  description:
    'MisiPintar adalah platform edutech-fintech keluarga #1 di Indonesia yang membangun generasi cerdas finansial dan disiplin sejak dini melalui gamifikasi misi harian.',
  keywords: [
    'tentang misipintar',
    'jobenapps',
    'joben enterprise',
    'literasi keuangan anak indonesia',
    'edutech fintech keluarga',
  ],
  alternates: {
    canonical: 'https://jobenapps.cloud/tentang-kami',
  },
  openGraph: {
    title: 'Tentang MisiPintar - Platform Literasi Keuangan Keluarga #1 Indonesia',
    description:
      'Membangun 1 Juta Keluarga Pintar Indonesia. Platform gamifikasi keuangan keluarga #1 by JobenApps.',
    url: 'https://jobenapps.cloud/tentang-kami',
    siteName: 'MisiPintar',
    locale: 'id_ID',
    type: 'website',
  },
}

export default function Page() {
  return <TentangKamiPage />
}
