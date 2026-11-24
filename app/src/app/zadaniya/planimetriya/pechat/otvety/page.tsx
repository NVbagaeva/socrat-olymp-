import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SheetPage1 } from '@/components/tasks/planimetriya/SheetPage1';
import { PECHAT_1 } from '@/content/repetitory1';
import { dannyeTrenazhera1 } from '@/lib/planimetriya/trenazher/dannye';
import 'katex/dist/katex.min.css';
import '@/lib/sheet/theme.css';
import '@/lib/sheet/sheet.css';
import '@/lib/planimetriya/planimetriya.css';
import '../pechat1.css';
import { zadanie1Zagolovok } from '@/lib/seo-razdely';

export const metadata: Metadata = {
  title: zadanie1Zagolovok(PECHAT_1.uchitel),
  robots: { index: false },
};

/**
 * Лист учителя задания №1: те же задачи, чертежи со всеми
 * построениями, решения по шагам и ответы. Параметры — в адресе.
 */
export default function Pechat1OtvetyPage() {
  return (
    <Suspense fallback={null}>
      <SheetPage1 vid="uchitel" bank={dannyeTrenazhera1().bank} />
    </Suspense>
  );
}
