import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { ZachyotRun } from '@/components/tasks/ves12/ZachyotRun';
import { zachyotText } from '@/content/ves12';
import { ves12Catalog } from '@/lib/ves12/catalog';
import 'katex/dist/katex.min.css';
import '@/lib/graph/graph.css';
import '../../../zadaniya.css';
import '../../../[task]/[type]/trainer.css';
import '../../../[task]/[type]/prep.css';
import '@/components/tasks/ves12/ves12.css';

export const metadata: Metadata = {
  title: `${zachyotText.pageTitle} — Будет на ЕГЭ`,
  robots: { index: false },
};

/**
 * Онлайн-режим зачётной работы для ученика: варианты из адреса работы.
 * Параметры в адресе — страница одна на все работы.
 */
export default function ZachyotRunPage() {
  return (
    <AppShell active="tasks">
      <main className="app-main exam-page">
        {/* useSearchParams требует границы ожидания: без неё статический
            экспорт страницу не собирает. */}
        <Suspense fallback={null}>
          <ZachyotRun catalog={ves12Catalog()} />
        </Suspense>
      </main>
    </AppShell>
  );
}
