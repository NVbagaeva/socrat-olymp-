import type { Metadata } from 'next';
import { Generator8 } from '@/components/tasks/vychisleniya/Generator8';
import { vychisleniyaTitle } from '@/content/vychisleniya';
import { ZADANIYA } from '@/lib/paths';
import { VariantFromSection } from '@/components/variant/VariantEntry';

export const metadata: Metadata = {
  title: vychisleniyaTitle('Генератор'),
};

/** Вкладка «Генератор» задания №8: общий генератор листов. */
export default function Generator8Page() {
  return (
    <>
      <VariantFromSection />
      <Generator8 base={`${ZADANIYA}/8`} />
    </>
  );
}
