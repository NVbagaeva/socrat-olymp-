import type { Metadata } from 'next';
import { Suspense } from 'react';
import contentSheet8 from '@/content/sheet8.js';
import { vychisleniyaTitle } from '@/content/vychisleniya';
import { SheetPage8 } from '@/components/tasks/vychisleniya/SheetPage8';
import 'katex/dist/katex.min.css';
import '@/lib/graph/graph.css';
import '@/lib/sheet/theme.css';
import '@/lib/sheet/sheet.css';
import '../pechat8.css';

export const metadata: Metadata = {
  title: `${contentSheet8.vse} · ${vychisleniyaTitle('Генератор')}`,
  robots: { index: false },
};

/**
 * «Всё одним файлом» генератора №8: листы ученика всех вариантов, затем
 * листы с разбором и таблица ответов — те же задачи по тому же адресу.
 */
export default function Pechat8VsePage() {
  return (
    <Suspense fallback={null}>
      <SheetPage8 vid="vse" />
    </Suspense>
  );
}
