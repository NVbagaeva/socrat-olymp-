import type { Metadata } from 'next';
import { Suspense } from 'react';
import { generatorPage } from '@/content/generator';
import { vektoryTitle } from '@/content/vektory';
import { SheetPage2 } from '@/components/tasks/vektory/SheetPage2';
import 'katex/dist/katex.min.css';
import '@/lib/graph/graph.css';
import '@/lib/sheet/theme.css';
import '@/lib/sheet/sheet.css';
import '@/lib/vektory/vektory.css';
import './pechat2.css';

export const metadata: Metadata = {
  title: `${generatorPage.student} · ${vektoryTitle('Генератор')}`,
  robots: { index: false },
};

/**
 * Лист для ученика задания №2: задачи со строкой «Ответ: ____»,
 * рисунки без катетов, без ответов. Параметры варианта — в адресе;
 * оболочки сайта нет.
 */
export default function Pechat2Page() {
  return (
    <Suspense fallback={null}>
      <SheetPage2 vid="uchenik" />
    </Suspense>
  );
}
