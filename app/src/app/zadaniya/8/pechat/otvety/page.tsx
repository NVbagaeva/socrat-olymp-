import type { Metadata } from 'next';
import { Suspense } from 'react';
import { generatorPage } from '@/content/generator';
import { vychisleniyaTitle } from '@/content/vychisleniya';
import { SheetPage8 } from '@/components/tasks/vychisleniya/SheetPage8';
import 'katex/dist/katex.min.css';
import '@/lib/graph/graph.css';
import '@/lib/sheet/theme.css';
import '@/lib/sheet/sheet.css';
import '../pechat8.css';

export const metadata: Metadata = {
  title: `${generatorPage.teacher} · ${vychisleniyaTitle('Генератор')}`,
  robots: { index: false },
};

/**
 * Лист с ответами задания №8: те же задачи, что у ученика по тому
 * же адресу, разбор в каждой карточке и сводная таблица ответов
 * в конце. Свой адрес: с листа ученика сюда ссылки нет.
 */
export default function Pechat8OtvetyPage() {
  return (
    <Suspense fallback={null}>
      <SheetPage8 withAnswers />
    </Suspense>
  );
}
