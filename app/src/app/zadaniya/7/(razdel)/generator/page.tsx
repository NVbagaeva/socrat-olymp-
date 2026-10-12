import type { Metadata } from 'next';
import { Generator7 } from '@/components/tasks/zadanie7/Generator7';
import { ZADANIE7, zadanie7Title } from '@/content/zadanie7';
import { gruppy7, protoInfo7 } from '@/lib/zadanie7/protoInfo';
import { ZADANIYA } from '@/lib/paths';

export const metadata: Metadata = {
  title: zadanie7Title('Генератор'),
};

export default function Generator7Tab() {
  return (
    <Generator7 prototipy={protoInfo7()} gruppy={gruppy7()} base={`${ZADANIYA}/${ZADANIE7.slug}`} />
  );
}
