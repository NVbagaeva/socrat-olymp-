import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SheetPage14 } from '@/components/zadanie14/SheetPage14';
import { zadanie14Title } from '@/content/zadanie14';
import 'katex/dist/katex.min.css';
import '@/lib/sheet/theme.css';
import '@/lib/sheet/sheet.css';
import './../krug14.css';
import './pechat14.css';

export const metadata: Metadata = {
  title: zadanie14Title('Лист ученика'),
  robots: { index: false },
};

/** Лист ученика №14: параметры набора — в адресе, оболочки сайта нет. */
export default function Pechat14Page() {
  return (
    <Suspense fallback={null}>
      <SheetPage14 vid="uchenik" />
    </Suspense>
  );
}
