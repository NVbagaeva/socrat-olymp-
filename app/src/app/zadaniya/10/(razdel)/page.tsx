import type { Metadata } from 'next';
import { OZadanii10 } from '@/components/tasks/zadanie10/OZadanii10';
import { ZADANIE10 } from '@/content/zadanie10';
import { ZADANIYA } from '@/lib/paths';
import { metaVkladki } from '@/content/seo';

export const metadata: Metadata = metaVkladki(10, 'o-zadanii');

/** Вкладка «О задании» задания №10. */
export default function OZadanii10Tab() {
  return <OZadanii10 base={`${ZADANIYA}/${ZADANIE10.slug}`} />;
}
