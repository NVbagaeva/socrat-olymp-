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
import '../../procenty.css';

export const metadata: Metadata = {
  title: zadanie11Title(PECHAT_11.vse),
  robots: { index: false },
};

/**
 * Всё одним файлом: листы ученика всех вариантов, затем листы
 * учителя с решениями и ответами. Параметры листа — в адресе.
 */
export default function Pechat11VsePage() {
  return (
    <Suspense fallback={null}>
      <SheetPage11 vid="vse" bank={dannyeTrenazhera().bank} />
    </Suspense>
  );
}
