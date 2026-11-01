import type { Metadata } from 'next';
import { Generator1 } from '@/components/tasks/planimetriya/Generator1';
import { ZADANIE1 } from '@/content/zadanie1';
import { ZADANIYA } from '@/lib/paths';
import { dannyeTrenazhera1 } from '@/lib/planimetriya/trenazher/dannye';
import '../../../11/zadanie11.css';
import '../../../komplekt.css';
import '../../trenazher1.css';
import { VariantFromSection } from '@/components/variant/VariantEntry';
import { metaVkladki } from '@/content/seo';
import { BlokRazdela } from '@/components/seo/BlokRazdela';

export const metadata: Metadata = metaVkladki(1, 'generator');

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
      <BlokRazdela no={1} vid="generator" />
    </>
  );
}
