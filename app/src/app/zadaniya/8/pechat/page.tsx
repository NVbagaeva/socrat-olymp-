import type { Metadata } from 'next';
import { Suspense } from 'react';
import { generatorPage } from '@/content/generator';
import { vychisleniyaTitle } from '@/content/vychisleniya';
import { SheetPage8 } from '@/components/tasks/vychisleniya/SheetPage8';
import 'katex/dist/katex.min.css';
import '@/lib/graph/graph.css';
import '@/lib/sheet/theme.css';
import '@/lib/sheet/sheet.css';
import './pechat8.css';

export const metadata: Metadata = {
  title: `${generatorPage.student} · ${vychisleniyaTitle('Генератор')}`,
  robots: { index: false },
};

/**
 * Лист для ученика задания №8: задачи со строкой «Ответ: ____»,
 * без ответов. Параметры варианта — в адресе; оболочки сайта нет.
 */
export default function Pechat8Page() {
  return (
    <Suspense fallback={null}>
      <SheetPage8 withAnswers={false} />
    </Suspense>
  );
}
