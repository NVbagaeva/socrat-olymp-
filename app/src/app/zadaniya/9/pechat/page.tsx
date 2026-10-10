import type { Metadata } from 'next';
import { Suspense } from 'react';
import { generatorPage } from '@/content/generator';
import { proizvodnayaTitle } from '@/content/proizvodnaya';
import { SheetPage9 } from '@/components/tasks/proizvodnaya/SheetPage9';
import 'katex/dist/katex.min.css';
import '@/lib/graph/graph.css';
import '@/lib/sheet/theme.css';
import '@/lib/sheet/sheet.css';
import './pechat9.css';

export const metadata: Metadata = {
  title: `${generatorPage.student} · ${proizvodnayaTitle('Генератор')}`,
  robots: { index: false },
};

/**
 * Лист для ученика задания №9: рамки «Запомни» и разобранные примеры,
 * задачи с рисунками без построений и строкой «Ответ: ____». Параметры
 * варианта — в адресе; оболочки сайта нет.
 */
export default function Pechat9Page() {
  return (
    <Suspense fallback={null}>
      <SheetPage9 withAnswers={false} />
    </Suspense>
  );
}
