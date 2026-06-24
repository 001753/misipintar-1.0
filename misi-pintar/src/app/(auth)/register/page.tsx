import type { Metadata } from 'next'
import RegisterForm from './register-form'
import JsonLd from '@/components/JsonLd'

export const metadata: Metadata = {
  title: 'Daftar Gratis - Buat FamilySpace Sekarang',
  description:
    'Daftar MisiPintar gratis selamanya. Buat FamilySpace dalam 2 menit, tambahkan anak, dan mulai misi pertama hari ini. Tidak perlu kartu kredit.',
  keywords: [
    'daftar misipintar',
    'buat familyspace',
    'aplikasi tugas anak gratis',
    'register misipintar',
    'daftar aplikasi uang anak',
  ],
  alternates: {
    canonical: 'https://jobenapps.cloud/register',
  },
  openGraph: {
    title: 'Daftar Gratis - Buat FamilySpace Sekarang | MisiPintar',
    description:
      'Buat FamilySpace dalam 2 menit. Tambahkan anak, buat misi, dan mulai perjalanan finansial keluarga Anda hari ini.',
    url: 'https://jobenapps.cloud/register',
    siteName: 'MisiPintar',
    locale: 'id_ID',
    type: 'website',
  },
}

const softwareAppSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'MisiPintar',
  alternateName: 'Misi Pintar',
  url: 'https://jobenapps.cloud',
  applicationCategory: 'EducationalApplication',
  applicationSubCategory: 'Family Finance & Parenting',
  operatingSystem: 'Web, Android, iOS',
  inLanguage: 'id-ID',
  description:
    'Aplikasi manajemen misi keluarga dan literasi keuangan anak. Ubah tugas harian menjadi misi seru berhadiah saldo virtual. Anak belajar nilai kerja keras, orang tua tenang.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'IDR',
    availability: 'https://schema.org/InStock',
    priceValidUntil: '2026-12-31',
    description: 'Gratis selamanya untuk 1 juta keluarga pertama. Tidak perlu kartu kredit.',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    bestRating: '5',
    worstRating: '1',
    ratingCount: '312',
    reviewCount: '312',
  },
  featureList: [
    'Manajemen misi & tugas anak',
    'Saldo virtual & reward gamifikasi',
    'Kantong Impian (tabungan bertujuan)',
    'Multi-profil anak dalam satu FamilySpace',
    'Notifikasi real-time untuk orang tua',
    'Riwayat transaksi & laporan keuangan',
    'Kontrol penuh oleh orang tua',
  ],
  screenshot: 'https://jobenapps.cloud/screenshot.png',
  softwareVersion: '1.0.0',
  releaseNotes: 'Rilis perdana dengan fitur FamilySpace, Misi Pintar, dan Kantong Impian.',
  author: {
    '@type': 'Organization',
    name: 'JobenApps',
    alternateName: 'Joben Enterprise',
    url: 'https://jobenapps.cloud',
  },
  publisher: {
    '@type': 'Organization',
    name: 'JobenApps',
    url: 'https://jobenapps.cloud',
  },
  potentialAction: {
    '@type': 'RegisterAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://jobenapps.cloud/register',
    },
    name: 'Daftar Gratis Sekarang',
    description: 'Buat FamilySpace dalam 2 menit. Gratis selamanya.',
  },
}

export default function RegisterPage() {
  return (
    <>
      <JsonLd schema={softwareAppSchema} />
      <RegisterForm />
    </>
  )
}
