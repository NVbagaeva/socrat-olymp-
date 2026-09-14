import type { Metadata, Viewport } from 'next';
import { caveat, inter } from '@/lib/fonts';
import { AppStateProvider } from '@/state/AppState';
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
    <html lang="ru" className={`${inter.variable} ${caveat.variable}`}>
      <body>
        {/* Состояние раздела доступно на любой странице: провайдер
            клиентский, содержимое страниц остаётся серверным. */}
        <AppStateProvider>{children}</AppStateProvider>
      </body>
    </html>
  );
}
