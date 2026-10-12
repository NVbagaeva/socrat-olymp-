import type { Metadata } from 'next';
import { OZadanii7 } from '@/components/tasks/zadanie7/OZadanii7';
import { ZADANIE7, zadanie7Title } from '@/content/zadanie7';
import { ZADANIYA } from '@/lib/paths';

export const metadata: Metadata = {
  title: zadanie7Title('О задании'),
};

/** Вкладка «О задании» задания №7. */
export default function OZadanii7Tab() {
  return <OZadanii7 base={`${ZADANIYA}/${ZADANIE7.slug}`} />;
}
