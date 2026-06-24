import SyaratKetentuanPage from '@/components/landing/SyaratKetentuanPage'

export const metadata = {
  title: 'Syarat & Ketentuan – MisiPintar by JobenApps',
  description:
    'Baca syarat dan ketentuan penggunaan platform MisiPintar. Dokumen ini mengatur hak dan kewajiban antara pengguna dan Joben Enterprise.',
  keywords: ['syarat ketentuan misipintar', 'terms of service jobenapps', 'ketentuan penggunaan'],
  openGraph: {
    title: 'Syarat & Ketentuan – MisiPintar',
    description: 'Perjanjian penggunaan layanan MisiPintar oleh Joben Enterprise.',
    type: 'website',
    locale: 'id_ID',
  },
}

export default function Page() {
  return <SyaratKetentuanPage />
}
