import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SHEET_2 } from '@/content/sheet2';
import { vektoryTitle } from '@/content/vektory';
import { SheetPage2 } from '@/components/tasks/vektory/SheetPage2';
import 'katex/dist/katex.min.css';
import '@/lib/graph/graph.css';
import '@/lib/sheet/theme.css';
import '@/lib/sheet/sheet.css';
import '@/lib/vektory/vektory.css';
import '../pechat2.css';

export const metadata: Metadata = {
  title: `${SHEET_2.vse} · ${vektoryTitle('Генератор')}`,
  robots: { index: false },
};

/**
 * «Всё одним файлом» генератора №2: листы ученика всех вариантов, затем
 * листы с решениями и таблица ответов — те же задачи по тому же адресу.
 */
export default function Pechat2VsePage() {
  return (
    <Suspense fallback={null}>
      <SheetPage2 vid="vse" />
    </Suspense>
  );
}
