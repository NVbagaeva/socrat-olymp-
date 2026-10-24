import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SheetPage13 } from '@/components/tasks/zadanie13/SheetPage13';
import { PECHAT_13 } from '@/content/generator13';
import { zadanie13Title } from '@/content/zadanie13';
import 'katex/dist/katex.min.css';
import '@/lib/sheet/theme.css';
import '@/lib/sheet/sheet.css';
import '../pechat13.css';

export const metadata: Metadata = {
  title: zadanie13Title(PECHAT_13.uchitel),
  robots: { index: false },
};

/** Лист учителя задания №13: сводка ответов и решения. Ответы считает движок в браузере. Параметры листа — в адресе; оболочки сайта нет. */
export default function Pechat13Page() {
  return (
    <Suspense fallback={null}>
      <SheetPage13 vid="uchitel" />
    </Suspense>
  );
}
