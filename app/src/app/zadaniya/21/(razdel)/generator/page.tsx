import type { Metadata } from 'next';
import { Generator21 } from '@/components/tasks/zadanie21/Generator21';
import { VariantFromSection } from '@/components/variant/VariantEntry';
import { zadanie21Title } from '@/content/zadanie21';
import { ZADANIYA } from '@/lib/paths';

export const metadata: Metadata = {
  title: zadanie21Title('Генератор'),
};

/** Вкладка «Генератор»: общий генератор листов. */
export default function Generator21Page() {
  return (
    <>
      <VariantFromSection />
      <Generator21 base={`${ZADANIYA}/21`} />
    </>
  );
}
