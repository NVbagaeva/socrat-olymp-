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
  title: stereoTitle('3', PECHAT_GEN_3.uchitel),
  robots: { index: false },
};

/**
 * Лист учителя общего генератора №3: чертежи с построениями, решения, ответы и строка источника у каждого варианта.
 * Параметры листа — в адресе; оболочки сайта нет.
 */
export default function Page() {
  return (
    <Suspense fallback={null}>
      <SheetPageGen3 vid="uchitel" razdely={info3()} />
    </Suspense>
  );
}
