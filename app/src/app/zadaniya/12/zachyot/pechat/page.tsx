import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ZachyotSheet } from '@/components/tasks/ves12/ZachyotSheet';
import { zachyotText } from '@/content/ves12';
import { ves12Catalog } from '@/lib/ves12/catalog';
import 'katex/dist/katex.min.css';
import '@/lib/graph/graph.css';
import '@/lib/sheet/theme.css';
import '@/lib/sheet/sheet.css';
import '../../../[task]/[type]/pechat/pechat.css';
import '@/components/tasks/ves12/ves12-sheet.css';

export const metadata: Metadata = {
  title: `Варианты для учеников · ${zachyotText.pageTitle} — Будет на ЕГЭ`,
  robots: { index: false },
};

/** Зачётная работа для печати: Варианты для учеников. Параметры — в адресе. */
export default function Page() {
  return (
    <Suspense fallback={null}>
      <ZachyotSheet catalog={ves12Catalog()} withAnswers={false} />
    </Suspense>
  );
}
