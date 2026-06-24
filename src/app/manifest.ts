import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MisiPintar - Literasi Keuangan Keluarga',
    short_name: 'MisiPintar',
    description:
      'Ubah tugas harian anak menjadi misi seru berhadiah saldo virtual. Anak belajar nilai kerja keras, orang tua tenang. Gratis selamanya.',
    start_url: '/',
    display: 'standalone',
    background_color: '#020617',
    theme_color: '#10b981',
    orientation: 'portrait',
    scope: '/',
    lang: 'id',
    dir: 'ltr',
    categories: ['education', 'finance', 'lifestyle', 'kids'],
    icons: [
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    shortcuts: [
      {
        name: 'Daftar Gratis',
        short_name: 'Daftar',
        description: 'Buat FamilySpace dalam 2 menit',
        url: '/register',
        icons: [{ src: '/icon', sizes: '512x512', type: 'image/png' }],
      },
      {
        name: 'Masuk Akun',
        short_name: 'Masuk',
        description: 'Login ke FamilySpace',
        url: '/login',
        icons: [{ src: '/icon', sizes: '512x512', type: 'image/png' }],
      },
    ],
    screenshots: [
      {
        src: '/opengraph-image',
        sizes: '1200x630',
        type: 'image/png',
        // @ts-expect-error — form_factor is valid per spec but not yet in TS types
        form_factor: 'wide',
        label: 'MisiPintar — Beranda',
      },
    ],
  }
}
