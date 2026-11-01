import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SheetPageGen18 } from '@/components/zadanie18/SheetPageGen18';
import { PECHAT_GEN_18 } from '@/content/generator18';
import { zadanie18Title } from '@/content/zadanie18';
import { typeset } from '@/lib/tex';
import { bank18 } from '@/lib/zadanie18/trenazher/bank';
import 'katex/dist/katex.min.css';
import '@/lib/sheet/theme.css';
import '@/lib/sheet/sheet.css';
import '@/components/skhemy/skhemy.css';
import '../pechat18.css';

export const metadata: Metadata = {
  title: zadanie18Title(PECHAT_GEN_18.vse),
  robots: { index: false },
};

/**
 * «Всё одним файлом» генератора №18: листы учеников всех вариантов,
 * затем листы учителя. Параметры листа — в адресе;
 * оболочки сайта нет. Банк собран здесь, на сборке: ответы закрыты.
 */
export default function Page() {
  return (
    <Suspense fallback={null}>
      <SheetPageGen18 vid="vse" bank={bank18(typeset)} />
    </Suspense>
  );
}
