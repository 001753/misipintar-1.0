import type { Metadata } from 'next'
import KebijanPrivasiPage from '@/components/landing/KebijanPrivasiPage'

export const metadata: Metadata = {
  title: 'Kebijakan Privasi',
  description:
    'Pelajari bagaimana MisiPintar mengumpulkan, menggunakan, dan melindungi data pribadi keluarga Anda dengan standar keamanan siber tertinggi. Kami tidak pernah menjual data Anda.',
  keywords: [
    'kebijakan privasi misipintar',
    'perlindungan data anak',
    'privasi jobenapps',
  ],
  alternates: {
    canonical: 'https://jobenapps.cloud/kebijakan-privasi',
  },
  openGraph: {
    title: 'Kebijakan Privasi | MisiPintar',
    description:
      'Kami tidak pernah menjual data keluarga Anda. Keamanan data Anda adalah prioritas utama kami.',
    url: 'https://jobenapps.cloud/kebijakan-privasi',
    siteName: 'MisiPintar',
    locale: 'id_ID',
    type: 'website',
  },
}

export default function Page() {
  return <KebijanPrivasiPage />
}
