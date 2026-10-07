import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SheetPage11 } from '@/components/tasks/zadanie11/SheetPage11';
import { PECHAT_11 } from '@/content/repetitory11';
import { zadanie11Title } from '@/content/zadanie11';
import { dannyeTrenazhera } from '@/lib/zadanie11/trenazher/dannye';
import 'katex/dist/katex.min.css';
import '@/lib/sheet/theme.css';
import '@/lib/sheet/sheet.css';
import '../pechat11.css';

export const metadata: Metadata = {
  title: zadanie11Title(PECHAT_11.uchitel),
  robots: { index: false },
};

/**
 * Лист учителя задания №11: те же задачи, решения по этапам с
 * таблицами модели, ответы. Параметры листа — в адресе.
 */
export default function Pechat11OtvetyPage() {
  return (
    <Suspense fallback={null}>
      <SheetPage11 vid="uchitel" bank={dannyeTrenazhera().bank} />
    </Suspense>
  );
}
