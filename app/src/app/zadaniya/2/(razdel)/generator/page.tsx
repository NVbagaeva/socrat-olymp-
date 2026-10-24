import type { Metadata } from 'next';
import { Generator2Tab } from '@/components/tasks/vektory/Generator2Tab';
import { VEKTORY, vektoryTitle } from '@/content/vektory';
import { ZADANIYA } from '@/lib/paths';
import { VariantFromSection } from '@/components/variant/VariantEntry';

export const metadata: Metadata = {
  title: vektoryTitle('Генератор'),
};

/** Вкладка «Генератор» задания №2: вариант для печати. */
export default function Generator2Page() {
  return (
    <>
      <VariantFromSection />
      <Generator2Tab base={`${ZADANIYA}/${VEKTORY.slug}`} />
    </>
  );
}
