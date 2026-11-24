import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SheetPage21 } from '@/components/tasks/zadanie21/SheetPage21';
import { SHEET_21 } from '@/content/sheet21';
import { zadanie21Title } from '@/content/zadanie21';
import 'katex/dist/katex.min.css';
import '@/lib/sheet/theme.css';
import '@/lib/sheet/sheet.css';
import '../pechat21.css';

export const metadata: Metadata = {
  title: `${SHEET_21.vse} · ${zadanie21Title('Генератор')}`,
  robots: { index: false },
};

/** «Всё одним файлом»: листы ученика всех вариантов, затем листы учителя и ответы. */
export default function Pechat21VsePage() {
  return (
    <Suspense fallback={null}>
      <SheetPage21 vid="vse" />
    </Suspense>
  );
}
