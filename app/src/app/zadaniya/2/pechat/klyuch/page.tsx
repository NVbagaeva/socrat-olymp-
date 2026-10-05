import type { Metadata } from 'next';
import { Suspense } from 'react';
import { REPETITORY_2, vektoryTitle } from '@/content/vektory';
import { SheetPage2 } from '@/components/tasks/vektory/SheetPage2';
import 'katex/dist/katex.min.css';
import '@/lib/graph/graph.css';
import '@/lib/sheet/theme.css';
import '@/lib/sheet/sheet.css';
import '../pechat2.css';

export const metadata: Metadata = {
  title: `${REPETITORY_2.klyuch} · ${vektoryTitle(REPETITORY_2.title)}`,
  robots: { index: false },
};

/**
 * Ключ ответов банка для репетиторов: таблицы «вариант → ответ» по
 * прототипам. Ответы считаются в браузере по seed банка при открытии
 * страницы; в сборке и в репозитории их нет. Печать и сохранение в
 * PDF — кнопкой на странице.
 */
export default function Pechat2KlyuchPage() {
  return (
    <Suspense fallback={null}>
      <SheetPage2 vid="klyuch" />
    </Suspense>
  );
}
