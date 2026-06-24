import type { Metadata } from 'next'
import TentangKamiPage from '@/components/landing/TentangKamiPage'
import JsonLd from '@/components/JsonLd'

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
    canonical: 'https://mp.jobenapp.cloud/tentang-kami',
  },
  openGraph: {
    title: 'Tentang MisiPintar - Platform Literasi Keuangan Keluarga #1 Indonesia',
    description:
      'Membangun 1 Juta Keluarga Pintar Indonesia. Platform gamifikasi keuangan keluarga #1 by JobenApps.',
    url: 'https://mp.jobenapp.cloud/tentang-kami',
    siteName: 'MisiPintar',
    locale: 'id_ID',
    type: 'website',
  },
}

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Beranda',
      item: 'https://mp.jobenapp.cloud',
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Tentang Kami',
      item: 'https://mp.jobenapp.cloud/tentang-kami',
    },
  ],
}

export default function Page() {
  return (
    <>
      <JsonLd schema={breadcrumbSchema} />
      <TentangKamiPage />
    </>
  )
}
