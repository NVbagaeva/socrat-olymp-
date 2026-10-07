import type { Metadata } from 'next';
import { Generator11 } from '@/components/tasks/zadanie11/Generator11';
import { ZADANIE11, zadanie11Meta } from '@/content/zadanie11';
import { dannyeTrenazhera } from '@/lib/zadanie11/trenazher/dannye';
import { ZADANIYA } from '@/lib/paths';

const VKLADKA = ZADANIE11.tabs.find((tab) => tab.id === 'generator')?.label ?? 'Генератор';

export const metadata: Metadata = {
  ...zadanie11Meta(VKLADKA),
};

/**
 * Вкладка «Генератор» задания №11 (макет generator.png): лист
 * ученика и лист учителя, варианты, PDF. Разделы и условия банка
 * без ответов собираются на сборке, лист — в браузере.
 */
export default function Generator11Tab() {
  const d = dannyeTrenazhera();
  return <Generator11 razdely={d.razdely} bank={d.bank} base={`${ZADANIYA}/${ZADANIE11.slug}`} />;
}
