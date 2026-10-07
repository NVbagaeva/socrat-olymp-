import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SheetPage11 } from '@/components/tasks/zadanie11/SheetPage11';
import { PECHAT_11 } from '@/content/repetitory11';
import { zadanie11Title } from '@/content/zadanie11';
import { dannyeTrenazhera } from '@/lib/zadanie11/trenazher/dannye';
import 'katex/dist/katex.min.css';
import '@/lib/sheet/theme.css';
import '@/lib/sheet/sheet.css';
import './pechat11.css';
import '../procenty.css';

export const metadata: Metadata = {
  title: zadanie11Title(PECHAT_11.uchenik),
  robots: { index: false },
};

/**
 * Лист ученика задания №11: условия и строка «Ответ: ____», без
 * ответов. Параметры листа — в адресе; оболочки сайта нет.
 */
export default function Pechat11Page() {
  return (
    <Suspense fallback={null}>
      <SheetPage11 vid="uchenik" bank={dannyeTrenazhera().bank} />
    </Suspense>
  );
}
