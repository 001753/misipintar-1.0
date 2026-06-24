import type { Metadata } from 'next'
import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import LandingPage from '@/components/landing/LandingPage'
import JsonLd from '@/components/JsonLd'

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

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'MisiPintar',
  alternateName: 'JobenApps',
  url: 'https://jobenapps.cloud',
  logo: {
    '@type': 'ImageObject',
    url: 'https://jobenapps.cloud/logo.png',
    width: 512,
    height: 512,
  },
  description:
    'Platform literasi keuangan dan gamifikasi keluarga #1 Indonesia. Ubah tugas anak menjadi misi seru berhadiah saldo virtual.',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Sentra Town, The Park Mall Solo Baru',
    addressLocality: 'Solo',
    addressRegion: 'Jawa Tengah',
    addressCountry: 'ID',
  },
  contactPoint: [
    {
      '@type': 'ContactPoint',
      telephone: '+62-814-6008-1343',
      contactType: 'customer support',
      contactOption: 'TollFree',
      areaServed: 'ID',
      availableLanguage: 'Indonesian',
    },
    {
      '@type': 'ContactPoint',
      email: 'admin@jobenapp.cloud',
      contactType: 'customer support',
      areaServed: 'ID',
      availableLanguage: 'Indonesian',
    },
  ],
  founder: {
    '@type': 'Organization',
    name: 'Joben Enterprise',
  },
  foundingLocation: {
    '@type': 'Place',
    name: 'Solo, Jawa Tengah, Indonesia',
  },
  areaServed: {
    '@type': 'Country',
    name: 'Indonesia',
  },
}

const webSiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'MisiPintar',
  alternateName: 'Misi Pintar',
  url: 'https://jobenapps.cloud',
  description:
    'Platform gamifikasi keuangan keluarga #1 Indonesia. Buat misi, kumpulkan reward, dan bangun karakter anak sejak dini.',
  inLanguage: 'id-ID',
  publisher: {
    '@type': 'Organization',
    name: 'MisiPintar',
    url: 'https://jobenapps.cloud',
  },
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://jobenapps.cloud/?q={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Apakah ini tidak membuat anak bermental matre/pamrih?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Justru sebaliknya. Misi Pintar mengajarkan bahwa uang adalah hasil dari kerja dan tanggung jawab — bukan sesuatu yang didapat gratis. Sistem reward dikaitkan dengan prestasi nyata dan nilai-nilai karakter, bukan sekadar "minta dan dapat". Penelitian menunjukkan anak yang belajar nilai uang sejak dini justru lebih bijak finansial saat dewasa.',
      },
    },
    {
      '@type': 'Question',
      name: 'Bagaimana jika saldo virtual dihabiskan untuk hal tidak berguna?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Orang tua punya kontrol penuh. Anda bisa mengatur ke mana saldo bisa digunakan — hanya untuk tabungan, atau bisa juga untuk "beli" hadiah virtual yang sudah Anda setujui. Ini justru sarana latihan membuat keputusan finansial dalam lingkungan yang aman dan terkontrol.',
      },
    },
    {
      '@type': 'Question',
      name: 'Apakah saldo virtual bisa dicairkan ke uang sungguhan?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Saldo virtual adalah representasi digital dari uang nyata yang sudah Anda janjikan. Cara pencairan terserah kesepakatan keluarga — bisa transfer langsung, atau ditukar hadiah fisik. Misi Pintar tidak terhubung ke sistem perbankan, sehingga sepenuhnya aman dan dalam kendali orang tua.',
      },
    },
    {
      '@type': 'Question',
      name: 'Berapa usia anak yang cocok menggunakan Misi Pintar?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Usia 5–15 tahun adalah rentang ideal. Anak usia 5–7 tahun bisa mulai dengan misi sederhana. Usia 8–12 tahun adalah fase emas dengan fitur penuh. Usia 13–15 tahun dapat menggunakan fitur tabungan bertujuan yang lebih kompleks untuk persiapan finansial remaja.',
      },
    },
    {
      '@type': 'Question',
      name: 'Apakah data keluarga aman dan privat?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Keamanan adalah prioritas utama. Data keluarga dienkripsi end-to-end, tidak dibagikan ke pihak ketiga, tidak ada iklan berbasis data anak. Kami mematuhi regulasi perlindungan data anak. Tidak ada informasi bank atau kartu kredit yang diperlukan.',
      },
    },
    {
      '@type': 'Question',
      name: 'Berapa lama fase gratis ini berlaku?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Kami berkomitmen memberikan akses gratis untuk 1 juta keluarga pertama sebagai bagian dari misi kami membangun Indonesia yang melek keuangan. Slot masih tersedia — daftar sekarang untuk mengunci akses gratis Anda.',
      },
    },
    {
      '@type': 'Question',
      name: 'Apa bedanya fitur Tabungan Virtual dengan celengan biasa?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Celengan biasa tidak punya tujuan, tidak ada bunga reward, tidak ada kunci komitmen, dan tidak ada momen perayaan. Kantong Impian Misi Pintar mengajarkan goal-based saving — anak menetapkan target spesifik, melihat progresnya setiap hari, mendapatkan bunga dari orang tua, dan merayakan pencapaian bersama keluarga.',
      },
    },
    {
      '@type': 'Question',
      name: 'Apakah bisa digunakan untuk lebih dari satu anak?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Ya! Satu FamilySpace bisa menampung beberapa profil anak sekaligus. Setiap anak punya dashboard sendiri, saldo terpisah, dan misi yang bisa dibedakan sesuai usia dan kebutuhan. Bahkan anak-anak bisa melihat progress satu sama lain sebagai motivasi.',
      },
    },
  ],
}

export default async function HomePage() {
  const session = await auth()

  if (session) {
    const role = session.user.role
    if (role === 'PARENT') redirect('/dashboard')
    if (role === 'CHILD') redirect('/child/dashboard')
    if (role === 'SUPER_ADMIN') redirect('/superadmin')
  }

  return (
    <>
      <JsonLd schema={organizationSchema} />
      <JsonLd schema={webSiteSchema} />
      <JsonLd schema={faqSchema} />
      <LandingPage />
    </>
  )
}
