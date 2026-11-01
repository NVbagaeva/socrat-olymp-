import type { Metadata } from 'next';
import { OZadanii1 } from '@/components/tasks/planimetriya/OZadanii1';
import { ZADANIE1 } from '@/content/zadanie1';
import { ZADANIYA } from '@/lib/paths';
import { metaVkladki } from '@/content/seo';

export const metadata: Metadata = metaVkladki(1, 'o-zadanii');

/** Вкладка «О задании» живёт на адресе самого раздела, как у №2 и №11. */
export default function OZadanii1Tab() {
  return <OZadanii1 base={`${ZADANIYA}/${ZADANIE1.slug}`} />;
}
