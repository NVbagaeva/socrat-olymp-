import type { Metadata } from 'next';
import { OZadanii7 } from '@/components/tasks/zadanie7/OZadanii7';
import { ZADANIE7 } from '@/content/zadanie7';
import { ZADANIYA } from '@/lib/paths';
import { metaVkladki } from '@/content/seo';

export const metadata: Metadata = metaVkladki(7, 'o-zadanii');

/** Вкладка «О задании» задания №7. */
export default function OZadanii7Tab() {
  return <OZadanii7 base={`${ZADANIYA}/${ZADANIE7.slug}`} />;
}
