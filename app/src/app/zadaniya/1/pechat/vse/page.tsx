import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SheetPage1 } from '@/components/tasks/planimetriya/SheetPage1';
import { PECHAT_1 } from '@/content/repetitory1';
import { zadanie1Title } from '@/content/zadanie1';
import { dannyeTrenazhera1 } from '@/lib/planimetriya/trenazher/dannye';
import 'katex/dist/katex.min.css';
import '@/lib/sheet/theme.css';
import '@/lib/sheet/sheet.css';
import '@/lib/planimetriya/planimetriya.css';
import '../pechat1.css';

export const metadata: Metadata = {
  title: zadanie1Title(PECHAT_1.vse),
  robots: { index: false },
};

/**
 * Всё одним файлом: листы ученика всех вариантов, затем листы
 * учителя с решениями и ответами. Параметры листа — в адресе.
 */
export default function Pechat1VsePage() {
  return (
    <Suspense fallback={null}>
      <SheetPage1 vid="vse" bank={dannyeTrenazhera1().bank} />
    </Suspense>
  );
}
