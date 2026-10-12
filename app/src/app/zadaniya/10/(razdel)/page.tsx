import type { Metadata } from 'next';
import { OZadanii10 } from '@/components/tasks/zadanie10/OZadanii10';
import { ZADANIE10, zadanie10Title } from '@/content/zadanie10';
import { ZADANIYA } from '@/lib/paths';

export const metadata: Metadata = {
  title: zadanie10Title('О задании'),
};

/** Вкладка «О задании» задания №10. */
export default function OZadanii10Tab() {
  return <OZadanii10 base={`${ZADANIYA}/${ZADANIE10.slug}`} />;
}
