import type { Metadata } from 'next'
import HubungiKamiClient from './hubungi-kami-client'
import JsonLd from '@/components/JsonLd'

export const metadata: Metadata = {
  title: 'Hubungi Kami - Dukungan & Bantuan',
  description:
    'Hubungi tim MisiPintar melalui WhatsApp, email, atau kunjungi kantor kami. Respons WA dalam 15 menit pada jam kerja. Kami siap membantu Anda.',
  keywords: [
    'hubungi misipintar',
    'kontak misipintar',
    'support misipintar',
    'bantuan misipintar',
    'whatsapp misipintar',
  ],
  alternates: {
    canonical: 'https://jobenapps.cloud/hubungi-kami',
  },
  openGraph: {
    title: 'Hubungi Kami - Dukungan & Bantuan | MisiPintar',
    description:
      'Tim MisiPintar siap membantu. Respons WhatsApp rata-rata 15 menit, email dibalas dalam 1×24 jam kerja.',
    url: 'https://jobenapps.cloud/hubungi-kami',
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
      name: 'Hubungi Kami',
      item: 'https://jobenapps.cloud/hubungi-kami',
    },
  ],
}

export default function HubungiKamiPage() {
  return (
    <>
      <JsonLd schema={breadcrumbSchema} />
      <HubungiKamiClient />
    </>
  )
}
