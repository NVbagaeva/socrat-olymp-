import type { Metadata } from 'next';
import { Suspense } from 'react';
import { VariantPrint } from '@/components/variant/VariantPrint';
import '@/components/variant/sectionStyles';
import '@/lib/sheet/theme.css';
import '@/lib/sheet/sheet.css';
import '@/lib/sheet/probability-sheet.css';
import '@/app/zadaniya/planimetriya/pechat/pechat1.css';
import '@/app/zadaniya/vektory/pechat/pechat2.css';
import '@/app/zadaniya/stereometriya/pechat/pechat3.css';
import '@/app/zadaniya/proizvodnaya/pechat/pechat9.css';
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
