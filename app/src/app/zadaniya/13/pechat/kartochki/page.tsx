import type { Metadata } from 'next';
import { Suspense } from 'react';
import { KartochkiPage13 } from '@/components/tasks/zadanie13/KartochkiPage13';
import { KARTOCHKI_13 } from '@/content/repetitory13';
import { zadanie13Title } from '@/content/zadanie13';
import 'katex/dist/katex.min.css';
import '@/lib/sheet/theme.css';
import '@/lib/sheet/sheet.css';
import '../pechat13.css';

export const metadata: Metadata = {
  title: zadanie13Title(KARTOCHKI_13.title),
  robots: { index: false },
};

/** Карточки «Определи тип» задания №13 для печати. Seed серии — в адресе; оболочки сайта нет. */
export default function Kartochki13Page() {
  return (
    <Suspense fallback={null}>
      <KartochkiPage13 />
    </Suspense>
  );
}
