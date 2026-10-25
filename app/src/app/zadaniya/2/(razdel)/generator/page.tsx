import type { Metadata } from 'next';
import { Generator2 } from '@/components/tasks/vektory/Generator2';
import { VEKTORY, vektoryTitle } from '@/content/vektory';
import { ZADANIYA } from '@/lib/paths';
import { VariantFromSection } from '@/components/variant/VariantEntry';

export const metadata: Metadata = {
  title: vektoryTitle('Генератор'),
};

/** Вкладка «Генератор» задания №2: общий генератор листов. */
export default function Generator2Page() {
  return (
    <>
      <VariantFromSection />
      <Generator2 base={`${ZADANIYA}/${VEKTORY.slug}`} />
    </>
  );
}
