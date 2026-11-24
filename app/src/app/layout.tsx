import type { Metadata, Viewport } from 'next';
import { ChunkReloadGuard } from '@/components/ChunkReloadGuard';
import { CookieNotice } from '@/components/CookieNotice';
import { FormulyPoShirine } from '@/components/FormulyPoShirine';
import { MotionLevel } from '@/components/MotionLevel';
import { NavigationGuard } from '@/components/NavigationGuard';
import { OnboardingLazy } from '@/components/onboarding/OnboardingLazy';
import { PodpisiChertezhey } from '@/components/PodpisiChertezhey';
import { caveat, inter, interGreek, ptSerif } from '@/lib/fonts';
import { MOTION_LEVEL_SCRIPT } from '@/lib/motion';
import { ogStranicy, SITE_URL } from '@/lib/og';
import { UVEDOMLENIYA_PUSH_ON } from '@/lib/uvedomleniya/config';
import '@/styles/globals.css';

export const metadata: Metadata = {
  /* Абсолютные адреса картинок превью: мессенджеры относительные не берут. */
  metadataBase: new URL(SITE_URL),
  title: 'Будет на ЕГЭ',
  description: 'Подготовка к ЕГЭ по профильной математике.',
  /* Превью ссылки на всех страницах. Заголовка здесь нет: без него
     мессенджер берёт <title> и описание самой страницы. */
  openGraph: ogStranicy(),
  /* Картинку для X не повторяем (images: []): иначе Next.js
     продублирует её тегами twitter:image, а X берёт og:image. */
  twitter: { card: 'summary_large_image', images: [] },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  /* Push (PR 3г): на iPhone push работает только у сайта, добавленного на
     экран «Домой», — для этого нужен manifest. Без флага его нет. */
  ...(UVEDOMLENIYA_PUSH_ON ? { manifest: '/manifest.webmanifest' } : {}),
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  /* То же, что color-scheme в base.css, но до загрузки CSS. */
  colorScheme: 'only light',
  /* Цвет панели браузера на телефоне — фон сайта (--ice). */
  themeColor: '#f5f9ff',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ru"
      className={`${inter.variable} ${interGreek.variable} ${caveat.variable} ${ptSerif.variable}`}
      /* Атрибут data-motion-level ставит скрипт в <head> до гидратации —
         React о нём не знает. */
      suppressHydrationWarning
    >
      <head>
        {/* Уровень движения до первой отрисовки (lib/motion.ts). */}
        <script dangerouslySetInnerHTML={{ __html: MOTION_LEVEL_SCRIPT }} />
      </head>
      <body>
        <ChunkReloadGuard />
        <MotionLevel />
        <NavigationGuard />
        <FormulyPoShirine />
        <PodpisiChertezhey />
        {children}
        <CookieNotice />
        <OnboardingLazy />
      </body>
    </html>
  );
}
