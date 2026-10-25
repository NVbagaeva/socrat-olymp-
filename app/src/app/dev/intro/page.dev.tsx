import type { Metadata } from 'next';
import { DevIntro } from './DevIntro';

/* Прототип заставки первого визита. Только для разработки: в обычной
   сборке файла page.dev.tsx для Next.js нет (next.config.ts). */
export const metadata: Metadata = {
  title: 'Прототип заставки — Будет на ЕГЭ',
  robots: { index: false, follow: false },
};

export default function DevIntroPage() {
  return <DevIntro />;
}
