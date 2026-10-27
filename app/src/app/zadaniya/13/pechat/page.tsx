import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SheetPage13 } from '@/components/tasks/zadanie13/SheetPage13';
import { PECHAT_13 } from '@/content/generator13';
import { zadanie13Title } from '@/content/zadanie13';
import 'katex/dist/katex.min.css';
import '@/lib/sheet/theme.css';
import '@/lib/sheet/sheet.css';
import '../reshenie13.css';
import './pechat13.css';

export const metadata: Metadata = {
  title: zadanie13Title(PECHAT_13.uchenik),
  robots: { index: false },
};

/** Лист ученика задания №13: условия, без ответов. У названия — QR онлайн-версии набора. Параметры листа — в адресе; оболочки сайта нет. */
export default function Pechat13Page() {
  return (
    <Suspense fallback={null}>
      <SheetPage13 vid="uchenik" />
    </Suspense>
  );
}
