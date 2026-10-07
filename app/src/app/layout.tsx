import type { Metadata, Viewport } from 'next';
import { ChunkReloadGuard } from '@/components/ChunkReloadGuard';
import { caveat, inter, ptSerif } from '@/lib/fonts';
import { Metrika } from '@/components/layout/Metrika';
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
        {children}
        <Metrika />
      </body>
    </html>
  );
}
