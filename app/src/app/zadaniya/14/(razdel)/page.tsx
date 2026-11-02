import type { Metadata } from 'next';
import { OZadanii14 } from '@/components/zadanie14/OZadanii14';
import { ZADANIE14, zadanie14Title } from '@/content/zadanie14';
import { ZADANIYA } from '@/lib/paths';

export const metadata: Metadata = {
  title: zadanie14Title('О задании'),
};

/** Вкладка «О задании» живёт на адресе самого раздела. */
export default function OZadanii14Tab() {
  return <OZadanii14 base={`${ZADANIYA}/${ZADANIE14.slug}`} />;
}
