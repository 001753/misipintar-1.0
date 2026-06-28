import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import NavigationProgressWrapper from "@/components/NavigationProgressWrapper";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import InstallPrompt from "@/components/InstallPrompt";

// force-dynamic pada root layout: semua route menjadi dinamis (0 halaman statis).
// Ini mencegah Next.js spawn worker thread untuk "Generating static pages" —
// worker thread tersebut crash (SIGABRT) di cPanel shared hosting karena
// ulimit -u (max user processes) yang ketat ketika ada 30+ halaman blog statis.
// Tradeoff: halaman marketing/blog di-render SSR saat request pertama (bukan pre-build).
// SEO tetap optimal karena Next.js tetap menggunakan Server-Side Rendering.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: {
    default: "MisiPintar - Solusi Misi Edukatif & Literasi Keuangan Anak",
    template: "%s | MisiPintar",
  },
  description:
    "Ubah kuota marah-marah menjadi kuota senyuman. Aplikasi manajemen tugas anak dan pembentukan karakter berbasis misi pintar untuk mendidik kedisiplinan sejak dini.",
  metadataBase: new URL("https://mp.jobenapp.cloud"),
  openGraph: {
    title: "MisiPintar - Solusi Misi Edukatif & Literasi Keuangan Anak",
    description:
      "Ubah kuota marah-marah menjadi kuota senyuman. Aplikasi manajemen tugas anak dan pembentukan karakter berbasis misi pintar untuk mendidik kedisiplinan sejak dini.",
    url: "https://mp.jobenapp.cloud",
    siteName: "MisiPintar",
    locale: "id_ID",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MisiPintar - Solusi Misi Edukatif & Literasi Keuangan Anak',
    description:
      'Ubah kuota marah-marah menjadi kuota senyuman. Aplikasi manajemen tugas anak berbasis gamifikasi. Gratis selamanya.',
    site: '@misipintar',
    creator: '@jobenapps',
  },
  ...(process.env.GOOGLE_SITE_VERIFICATION && {
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
    },
  }),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

const themeScript = `(function(){try{var s=localStorage.getItem('mp-theme');if(s==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full antialiased" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className="min-h-full flex flex-col bg-gray-50 dark:bg-gray-950 transition-colors duration-200" suppressHydrationWarning>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
        <ThemeProvider>
          <NavigationProgressWrapper />
          {children}
          <InstallPrompt />
        </ThemeProvider>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
