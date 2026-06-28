import type { MetadataRoute } from 'next'

const BASE = 'https://mp.jobenapp.cloud'
const NOW = new Date()

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    // ── Halaman utama ──────────────────────────────────────────
    {
      url: `${BASE}/`,
      lastModified: NOW,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE}/register`,
      lastModified: NOW,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE}/login`,
      lastModified: NOW,
      changeFrequency: 'monthly',
      priority: 0.7,
    },

    // ── Blog ───────────────────────────────────────────────────
    {
      url: `${BASE}/blog`,
      lastModified: NOW,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE}/blog/kenapa-anak-tidak-tahu-harga-barang`,
      lastModified: NOW,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE}/blog/delayed-gratification-rahasia-anak-sukses`,
      lastModified: NOW,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE}/blog/7-misi-harian-membentuk-karakter-disiplin`,
      lastModified: NOW,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE}/blog/tiga-kantong-uang-metode-terbukti`,
      lastModified: NOW,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE}/blog/kisah-nyata-keluarga-andi-dari-game-ke-tabungan`,
      lastModified: NOW,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE}/blog/qris-ewallet-bahaya-uang-tidak-terasa`,
      lastModified: NOW,
      changeFrequency: 'monthly',
      priority: 0.6,
    },

    // ── Halaman informasi ──────────────────────────────────────
    {
      url: `${BASE}/tentang-kami`,
      lastModified: NOW,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE}/hubungi-kami`,
      lastModified: NOW,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE}/syarat-ketentuan`,
      lastModified: NOW,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE}/kebijakan-privasi`,
      lastModified: NOW,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]
}
