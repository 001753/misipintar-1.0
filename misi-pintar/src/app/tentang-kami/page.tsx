import TentangKamiPage from '@/components/landing/TentangKamiPage'

export const metadata = {
  title: 'Tentang Kami – MisiPintar by JobenApps',
  description:
    'MisiPintar adalah platform edutech-fintech keluarga #1 di Indonesia yang membangun generasi cerdas finansial dan disiplin sejak dini melalui gamifikasi misi harian.',
  keywords: [
    'tentang misipintar',
    'jobenapps',
    'joben enterprise',
    'literasi keuangan anak indonesia',
    'edutech fintech keluarga',
  ],
  openGraph: {
    title: 'Tentang Kami – MisiPintar by JobenApps',
    description: 'Membangun 1 Juta Keluarga Pintar Indonesia. Platform gamifikasi keuangan keluarga #1.',
    type: 'website',
    locale: 'id_ID',
  },
}

export default function Page() {
  return <TentangKamiPage />
}
