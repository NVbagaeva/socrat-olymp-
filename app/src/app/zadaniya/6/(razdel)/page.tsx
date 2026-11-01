import type { Metadata } from 'next';
import { OZadanii6 } from '@/components/tasks/zadanie6/OZadanii6';
import { ZADANIE6 } from '@/content/zadanie6';
import { ZADANIYA } from '@/lib/paths';
import { metaVkladki } from '@/content/seo';

export const metadata: Metadata = metaVkladki(6, 'o-zadanii');

/** Вкладка «О задании» задания №6. */
export default function OZadanii6Tab() {
  return <OZadanii6 base={`${ZADANIYA}/${ZADANIE6.slug}`} />;
}
