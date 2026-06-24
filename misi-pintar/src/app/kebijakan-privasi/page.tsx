import KebijanPrivasiPage from '@/components/landing/KebijanPrivasiPage'

export const metadata = {
  title: 'Kebijakan Privasi – MisiPintar by JobenApps',
  description:
    'Pelajari bagaimana MisiPintar mengumpulkan, menggunakan, dan melindungi data pribadi keluarga Anda dengan standar keamanan siber tertinggi.',
  keywords: ['kebijakan privasi misipintar', 'perlindungan data anak', 'privasi jobenapps'],
  openGraph: {
    title: 'Kebijakan Privasi – MisiPintar',
    description: 'Kami tidak pernah menjual data keluarga Anda. Keamanan data Anda adalah prioritas utama kami.',
    type: 'website',
    locale: 'id_ID',
  },
}

export default function Page() {
  return <KebijanPrivasiPage />
}
