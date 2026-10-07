import type { Metadata, Viewport } from 'next';
import { ChunkReloadGuard } from '@/components/ChunkReloadGuard';
import { NavigationGuard } from '@/components/NavigationGuard';
import { assetUrl } from '@/lib/assetUrl';
import { caveat, inter, ptSerif } from '@/lib/fonts';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/seo';
import '@/styles/globals.css';

/* Картинка для ссылки в соцсетях и мессенджерах: 1200×630, собирается
   скриптом scripts/build-og-image.mjs и лежит в public/og/. */
const OG_IMAGE = assetUrl('/og/budetege-og.png');

export const metadata: Metadata = {
  /* Абсолютные адреса в canonical и Open Graph считаются от этого
     домена — https, без www. Страница с относительным «./» получает
     канонический адрес самой себя, с «/» на конце (trailingSlash). */
  metadataBase: new URL(SITE_URL),
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: './' },
  icons: {
    icon: [{ url: '/favicon.ico' }, { url: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.webmanifest',
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'ru_RU',
    url: './',
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    images: [OG_IMAGE],
  },
  /* Поисковикам разрешено всё по умолчанию; закрытые страницы задают
     robots сами (NOINDEX из lib/seo.ts). */
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${inter.variable} ${caveat.variable} ${ptSerif.variable}`}>
      <body>
        <ChunkReloadGuard />
        <NavigationGuard />
        {children}
      </body>
    </html>
  );
}
