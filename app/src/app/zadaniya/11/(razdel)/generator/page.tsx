import type { Metadata } from 'next';
import { Generator11 } from '@/components/tasks/zadanie11/Generator11';
import { ZADANIE11 } from '@/content/zadanie11';
import { dannyeTrenazhera } from '@/lib/zadanie11/trenazher/dannye';
import { ZADANIYA } from '@/lib/paths';
import { VariantFromSection } from '@/components/variant/VariantEntry';
import { metaVkladki } from '@/content/seo';
import { BlokRazdela } from '@/components/seo/BlokRazdela';

export const metadata: Metadata = metaVkladki(11, 'generator');

/**
 * Вкладка «Генератор» задания №11 (макет generator.png): лист
 * ученика и лист учителя, варианты, PDF. Разделы и условия банка
 * без ответов собираются на сборке, лист — в браузере.
 */
export default function Generator11Tab() {
  const d = dannyeTrenazhera();
  return (
    <>
      <VariantFromSection />
      <Generator11 razdely={d.razdely} bank={d.bank} base={`${ZADANIYA}/${ZADANIE11.slug}`} />
      <BlokRazdela no={11} vid="generator" />
    </>
  );
}
