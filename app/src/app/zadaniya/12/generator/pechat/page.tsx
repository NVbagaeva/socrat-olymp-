import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SheetPage } from '../../../[task]/[type]/pechat/SheetPage';
import { generatorPage } from '@/content/generator';
import { generatorAllText } from '@/content/ves12';
import 'katex/dist/katex.min.css';
import '@/lib/graph/graph.css';
import '@/lib/sheet/theme.css';
import '@/lib/sheet/sheet.css';
import '../../../[task]/[type]/pechat/pechat.css';

export const metadata: Metadata = {
  title: `${generatorPage.student} · ${generatorAllText.pageTitle} — Будет на ЕГЭ`,
  robots: { index: false },
};

/** Лист генератора по всем типам №12. Параметры — в адресе. */
export default function Page() {
  return (
    <Suspense fallback={null}>
      <SheetPage withAnswers={false} subtopic={generatorAllText.sheetTitle} />
    </Suspense>
  );
}
