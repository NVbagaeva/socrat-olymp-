import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SheetPage21 } from '@/components/tasks/zadanie21/SheetPage21';
import { generatorPage } from '@/content/generator';
import { zadanie21Title } from '@/content/zadanie21';
import 'katex/dist/katex.min.css';
import '@/lib/sheet/theme.css';
import '@/lib/sheet/sheet.css';
import './pechat21.css';

export const metadata: Metadata = {
  title: `${generatorPage.student} · ${zadanie21Title('Генератор')}`,
  robots: { index: false },
};

/** Лист ученика: задачи со строкой «Ответ: ____», без ответов. Параметры — в адресе. */
export default function Pechat21Page() {
  return (
    <Suspense fallback={null}>
      <SheetPage21 vid="uchenik" />
    </Suspense>
  );
}
