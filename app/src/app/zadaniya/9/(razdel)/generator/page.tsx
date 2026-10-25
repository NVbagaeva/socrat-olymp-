import type { Metadata } from 'next';
import { Generator9 } from '@/components/tasks/proizvodnaya/Generator9';
import { proizvodnayaTitle } from '@/content/proizvodnaya';
import { ZADANIYA } from '@/lib/paths';
import { VariantFromSection } from '@/components/variant/VariantEntry';

export const metadata: Metadata = {
  title: proizvodnayaTitle('Генератор'),
};

/** Вкладка «Генератор» задания №9: общий генератор листов. */
export default function Generator9Page() {
  return (
    <>
      <VariantFromSection />
      <Generator9 base={`${ZADANIYA}/9`} />
    </>
  );
}
