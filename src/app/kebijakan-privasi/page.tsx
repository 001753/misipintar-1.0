export const dynamic = 'force-dynamic'
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
    canonical: 'https://mp.jobenapp.cloud/kebijakan-privasi',
  },
  openGraph: {
    title: 'Kebijakan Privasi | MisiPintar',
    description:
      'Kami tidak pernah menjual data keluarga Anda. Keamanan data Anda adalah prioritas utama kami.',
    url: 'https://mp.jobenapp.cloud/kebijakan-privasi',
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
      name: 'Kebijakan Privasi',
      item: 'https://mp.jobenapp.cloud/kebijakan-privasi',
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
