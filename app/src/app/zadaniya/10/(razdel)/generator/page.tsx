import type { Metadata } from 'next';
import { Generator10 } from '@/components/tasks/zadanie10/Generator10';
import { ZADANIE10, zadanie10Title } from '@/content/zadanie10';
import { gruppy10, protoInfo10 } from '@/lib/zadanie10/protoInfo';
import { ZADANIYA } from '@/lib/paths';
import { VariantFromSection } from '@/components/variant/VariantEntry';

export const metadata: Metadata = {
  title: zadanie10Title('Генератор'),
};

export default function Generator10Tab() {
  return (
    <>
      <VariantFromSection />
      <Generator10
        prototipy={protoInfo10()}
        gruppy={gruppy10()}
        base={`${ZADANIYA}/${ZADANIE10.slug}`}
      />
    </>
  );
}
