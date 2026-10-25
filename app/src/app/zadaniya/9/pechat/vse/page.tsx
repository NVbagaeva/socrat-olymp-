import type { Metadata } from 'next';
import { Suspense } from 'react';
import contentSheet9 from '@/content/sheet9.js';
import { proizvodnayaTitle } from '@/content/proizvodnaya';
import { SheetPage9 } from '@/components/tasks/proizvodnaya/SheetPage9';
import 'katex/dist/katex.min.css';
import '@/lib/graph/graph.css';
import '@/lib/sheet/theme.css';
import '@/lib/sheet/sheet.css';
import '../pechat9.css';

export const metadata: Metadata = {
  title: `${contentSheet9.vse} · ${proizvodnayaTitle('Генератор')}`,
  robots: { index: false },
};

/**
 * «Всё одним файлом» генератора №9: листы ученика всех вариантов, затем
 * листы учителя с разбором и таблица ответов — те же задачи по тому же адресу.
 */
export default function Pechat9VsePage() {
  return (
    <Suspense fallback={null}>
      <SheetPage9 vid="vse" />
    </Suspense>
  );
}
