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
import './pechat18.css';

export const metadata: Metadata = {
  title: zadanie18Title(PECHAT_GEN_18.uchenik),
  robots: { index: false },
};

/**
 * Лист ученика генератора №18: условия с пунктами а) и б), чертежи и
 * строка «Ответ б): ____», без ответов. Параметры листа — в адресе;
 * оболочки сайта нет. Банк собран здесь, на сборке: ответы закрыты.
 */
export default function Page() {
  return (
    <Suspense fallback={null}>
      <SheetPageGen18 vid="uchenik" bank={bank18(typeset)} />
    </Suspense>
  );
}
