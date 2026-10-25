import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SheetPage } from '../../../../[task]/[type]/pechat/SheetPage';
import content from '@/content/sheet12.js';
import { generatorAllText } from '@/content/ves12';
import 'katex/dist/katex.min.css';
import '@/lib/graph/graph.css';
import '@/lib/sheet/theme.css';
import '@/lib/sheet/sheet.css';
import '../../../../[task]/[type]/pechat/pechat.css';

export const metadata: Metadata = {
  title: `${content.vse} · ${generatorAllText.pageTitle} — Будет на ЕГЭ`,
  robots: { index: false },
};

/** «Всё одним файлом» генератора по всем типам №12: листы ученика, затем учителя. */
export default function Page() {
  return (
    <Suspense fallback={null}>
      <SheetPage withAnswers vse subtopic={generatorAllText.sheetTitle} />
    </Suspense>
  );
}
