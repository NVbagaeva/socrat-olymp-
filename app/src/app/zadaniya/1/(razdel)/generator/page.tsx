import type { Metadata } from 'next';
import { Generator1 } from '@/components/tasks/planimetriya/Generator1';
import { ZADANIE1, zadanie1Title } from '@/content/zadanie1';
import { ZADANIYA } from '@/lib/paths';
import { dannyeTrenazhera1 } from '@/lib/planimetriya/trenazher/dannye';
import '../../../11/zadanie11.css';
import '../../../komplekt.css';
import '../../trenazher1.css';
import { VariantFromSection } from '@/components/variant/VariantEntry';

const VKLADKA = ZADANIE1.tabs.find((tab) => tab.id === 'generator')?.label ?? 'Генератор';

export const metadata: Metadata = {
  title: zadanie1Title(VKLADKA),
};

/**
 * Вкладка «Генератор» задания №1 — как у №11: лист ученика и лист
 * учителя из одного набора, варианты, рамки теории, PDF. Блоки и
 * числа задач банка без ответов собираются на сборке, лист — в
 * браузере.
 */
export default function Generator1Tab() {
  const d = dannyeTrenazhera1();
  return (
    <>
      <VariantFromSection />
      <Generator1 razdely={d.razdely} bank={d.bank} base={`${ZADANIYA}/${ZADANIE1.slug}`} />
    </>
  );
}
