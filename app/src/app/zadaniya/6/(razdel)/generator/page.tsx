import type { Metadata } from 'next';
import { Generator6 } from '@/components/tasks/zadanie6/Generator6';
import { ZADANIE6, zadanie6Title } from '@/content/zadanie6';
import { gruppy6, protoInfo6 } from '@/lib/zadanie6/protoInfo';
import { ZADANIYA } from '@/lib/paths';
import { VariantFromSection } from '@/components/variant/VariantEntry';

export const metadata: Metadata = {
  title: zadanie6Title('Генератор'),
};

/** Вкладка «Генератор» №6: листы ученика и учителя из одного набора, код комплекта в адресе. */
export default function Generator6Tab() {
  return (
    <>
      <VariantFromSection />
      <Generator6
        prototipy={protoInfo6()}
        gruppy={gruppy6()}
        base={`${ZADANIYA}/${ZADANIE6.slug}`}
      />
    </>
  );
}
