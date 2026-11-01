import type { Metadata, Viewport } from 'next';
import { ChunkReloadGuard } from '@/components/ChunkReloadGuard';
import { CookieNotice } from '@/components/CookieNotice';
import { FormulyPoShirine } from '@/components/FormulyPoShirine';
import { Metrika } from '@/components/Metrika';
import { NavigationGuard } from '@/components/NavigationGuard';
import { OnboardingLazy } from '@/components/onboarding/OnboardingLazy';
import { PodpisiChertezhey } from '@/components/PodpisiChertezhey';
import { caveat, inter, interGreek, ptSerif } from '@/lib/fonts';
import { assetUrl } from '@/lib/assetUrl';
import { ogMeta, SITE_URL, VERIFICATION } from '@/lib/seo';
import '@/styles/globals.css';
import { JsonLd } from '@/components/seo/JsonLd';
import { organizationLd, websiteLd } from '@/lib/schema';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Будет на ЕГЭ',
  description: 'Подготовка к ЕГЭ по профильной математике.',
  /* Адрес страницы с «/» на конце (trailingSlash) от главного зеркала. */
  alternates: { canonical: './' },
  ...ogMeta({ path: '/og/sayt.png', alt: 'Будет на ЕГЭ — подготовка к ЕГЭ по профильной математике' }, assetUrl),
  ...(VERIFICATION.yandex === '' && VERIFICATION.google === ''
    ? {}
    : {
        verification: {
          ...(VERIFICATION.yandex === '' ? {} : { yandex: VERIFICATION.yandex }),
          ...(VERIFICATION.google === '' ? {} : { google: VERIFICATION.google }),
        },
      }),
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ru"
      className={`${inter.variable} ${interGreek.variable} ${caveat.variable} ${ptSerif.variable}`}
    >
      <body>
        <ChunkReloadGuard />
        <NavigationGuard />
        <FormulyPoShirine />
        <PodpisiChertezhey />
        {children}
        <CookieNotice />
        <OnboardingLazy />
        <Metrika />
        <JsonLd data={organizationLd()} />
        <JsonLd data={websiteLd()} />
      </body>
    </html>
  );
}
