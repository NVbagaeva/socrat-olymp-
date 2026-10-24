import type { Metadata } from 'next';
import { Suspense } from 'react';
import { VariantPrint } from '@/components/variant/VariantPrint';
import '@/components/variant/sectionStyles';
import '@/lib/sheet/theme.css';
import '@/lib/sheet/sheet.css';
import '@/lib/sheet/probability-sheet.css';
import '@/app/zadaniya/1/pechat/pechat1.css';
import '@/app/zadaniya/2/pechat/pechat2.css';
import '@/app/zadaniya/3/pechat/pechat3.css';
import '@/app/zadaniya/9/pechat/pechat9.css';
import '@/lib/variant/variant-sheet.css';

export const metadata: Metadata = {
  title: 'Лист варианта — Будет на ЕГЭ',
  robots: { index: false },
};

/**
 * Лист «Собрать вариант» для печати: ученик, учитель, разбор или всё
 * одним файлом (?list=…). Набор приходит с экрана /variant/ — задачи
 * здесь не генерируются. Оболочки сайта нет.
 */
export default function VariantPrintPage() {
  return (
    <Suspense fallback={null}>
      <VariantPrint />
    </Suspense>
  );
}
