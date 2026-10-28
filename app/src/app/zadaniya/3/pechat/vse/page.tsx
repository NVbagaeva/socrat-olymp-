import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SheetPageGen3 } from '@/components/tasks/solid3/SheetPageGen3';
import { PECHAT_GEN_3 } from '@/content/generator3';
import { stereoTitle } from '@/content/stereo/zadaniya';
import { info3 } from '@/lib/zadanie3/gen/info';
import 'katex/dist/katex.min.css';
import '@/lib/sheet/theme.css';
import '@/lib/sheet/sheet.css';
import '../pechat3.css';

export const metadata: Metadata = {
  title: stereoTitle('3', PECHAT_GEN_3.vse),
  robots: { index: false },
};

/**
 * «Всё одним файлом»: листы учеников всех вариантов, затем листы учителя.
 * Параметры листа — в адресе; оболочки сайта нет.
 */
export default function Page() {
  return (
    <Suspense fallback={null}>
      <SheetPageGen3 vid="vse" razdely={info3()} />
    </Suspense>
  );
}
