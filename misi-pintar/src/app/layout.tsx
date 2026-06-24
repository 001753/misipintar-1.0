import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: {
    default: "MisiPintar - Solusi Misi Edukatif & Literasi Keuangan Anak",
    template: "%s | MisiPintar",
  },
  description:
    "Ubah kuota marah-marah menjadi kuota senyuman. Aplikasi manajemen tugas anak dan pembentukan karakter berbasis misi pintar untuk mendidik kedisiplinan sejak dini.",
  metadataBase: new URL("https://jobenapps.cloud"),
  openGraph: {
    title: "MisiPintar - Solusi Misi Edukatif & Literasi Keuangan Anak",
    description:
      "Ubah kuota marah-marah menjadi kuota senyuman. Aplikasi manajemen tugas anak dan pembentukan karakter berbasis misi pintar untuk mendidik kedisiplinan sejak dini.",
    url: "https://jobenapps.cloud",
    siteName: "MisiPintar",
    locale: "id_ID",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

const themeScript = `(function(){try{var s=localStorage.getItem('mp-theme');var p=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';if((s||p)==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`;

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
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
