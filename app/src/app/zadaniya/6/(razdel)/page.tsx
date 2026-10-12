import type { Metadata } from 'next';
import { OZadanii6 } from '@/components/tasks/zadanie6/OZadanii6';
import { ZADANIE6, zadanie6Title } from '@/content/zadanie6';
import { ZADANIYA } from '@/lib/paths';

export const metadata: Metadata = {
  title: zadanie6Title('О задании'),
};

/** Вкладка «О задании» задания №6. */
export default function OZadanii6Tab() {
  return <OZadanii6 base={`${ZADANIYA}/${ZADANIE6.slug}`} />;
}
