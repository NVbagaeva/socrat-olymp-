import type { Metadata } from 'next';
import { Suspense } from 'react';
import { generatorPage } from '@/content/generator';
import { proizvodnayaTitle } from '@/content/proizvodnaya';
import { SheetPage9 } from '@/components/tasks/proizvodnaya/SheetPage9';
import 'katex/dist/katex.min.css';
import '@/lib/graph/graph.css';
import '@/lib/sheet/theme.css';
import '@/lib/sheet/sheet.css';
import '../pechat9.css';

export const metadata: Metadata = {
  title: `${generatorPage.teacher} · ${proizvodnayaTitle('Генератор')}`,
  robots: { index: false },
};

/**
 * Лист учителя задания №9: те же задачи, что у ученика по тому же
 * адресу, разбор по этапам и рисунок построений в каждой карточке,
 * сводная таблица ответов в конце. Свой адрес: с листа ученика сюда
 * ссылки нет.
 */
export default function Pechat9OtvetyPage() {
  return (
    <Suspense fallback={null}>
      <SheetPage9 withAnswers />
    </Suspense>
  );
}
