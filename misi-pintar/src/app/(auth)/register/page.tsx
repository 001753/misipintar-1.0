import type { Metadata } from 'next'
import RegisterForm from './register-form'

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

export default function RegisterPage() {
  return <RegisterForm />
}
