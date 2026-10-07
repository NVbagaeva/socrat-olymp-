import type { Metadata, Viewport } from 'next';
import { ChunkReloadGuard } from '@/components/ChunkReloadGuard';
import { NavigationGuard } from '@/components/NavigationGuard';
import { caveat, inter, ptSerif } from '@/lib/fonts';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Будет на ЕГЭ',
  description: 'Подготовка к ЕГЭ по профильной математике.',
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
    <html lang="ru" className={`${inter.variable} ${caveat.variable} ${ptSerif.variable}`}>
      <body>
        <ChunkReloadGuard />
        <NavigationGuard />
        {children}
      </body>
    </html>
  );
}
