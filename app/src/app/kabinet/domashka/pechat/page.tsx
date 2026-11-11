import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthDisabled } from '@/components/auth/AuthDisabled';
import { HomeworkPrintScreen } from '@/components/dz/HomeworkPrintScreen';
import { AUTH_ENABLED } from '@/lib/auth/config';
import 'katex/dist/katex.min.css';
import '@/lib/graph/graph.css';
import '@/lib/sheet/theme.css';
import '@/lib/sheet/sheet.css';
import './pechat-dz.css';

export const metadata: Metadata = {
  title: 'Печать домашнего задания — Будет на ЕГЭ',
  robots: { index: false },
};

/**
 * Лист ученика и лист учителя домашнего задания: ?id=…&list=uchenik|uchitel,
 * kletka=1 — клетка для решения у ученика, uchenik=… — вариант одного
 * ученика. Как у листов №8 — только лист, без оболочки сайта.
 */
export default function DomashkaPechatPage() {
  if (!AUTH_ENABLED) return <AuthDisabled />;
  return (
    <Suspense fallback={null}>
      <HomeworkPrintScreen />
    </Suspense>
  );
}
