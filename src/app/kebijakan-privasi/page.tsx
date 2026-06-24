import type { Metadata } from 'next'
import KebijanPrivasiPage from '@/components/landing/KebijanPrivasiPage'
import JsonLd from '@/components/JsonLd'

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

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Beranda',
      item: 'https://jobenapps.cloud',
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Kebijakan Privasi',
      item: 'https://jobenapps.cloud/kebijakan-privasi',
    },
  ],
}

export default function Page() {
  return (
    <>
      <JsonLd schema={breadcrumbSchema} />
      <KebijanPrivasiPage />
    </>
  )
}
