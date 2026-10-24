import type { Metadata } from 'next';
import { Generator9Tab } from '@/components/tasks/proizvodnaya/Generator9Tab';
import { proizvodnayaTitle } from '@/content/proizvodnaya';
import { ZADANIYA } from '@/lib/paths';
import { VariantFromSection } from '@/components/variant/VariantEntry';

export const metadata: Metadata = {
  title: proizvodnayaTitle('Генератор'),
};

/** Вкладка «Генератор» задания №9: вариант для печати. */
export default function Generator9Page() {
  return (
    <>
      <VariantFromSection />
      <Generator9Tab base={`${ZADANIYA}/9`} />
    </>
  );
}
