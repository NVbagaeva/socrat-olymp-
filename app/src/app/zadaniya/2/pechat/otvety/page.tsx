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
import '../pechat2.css';

export const metadata: Metadata = {
  title: `${generatorPage.teacher} · ${vektoryTitle('Генератор')}`,
  robots: { index: false },
};

/**
 * Лист с решениями задания №2: те же задачи, что у ученика по тому же
 * адресу, рисунок с катетами, разбор по шагам в каждой карточке и
 * сводная таблица ответов в конце. Свой адрес: с листа ученика сюда
 * ссылки нет.
 */
export default function Pechat2OtvetyPage() {
  return (
    <Suspense fallback={null}>
      <SheetPage2 vid="uchitel" />
    </Suspense>
  );
}
