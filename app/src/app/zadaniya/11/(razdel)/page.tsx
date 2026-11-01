import type { Metadata } from 'next';
import { OZadanii11 } from '@/components/tasks/zadanie11/OZadanii11';
import { ZADANIE11 } from '@/content/zadanie11';
import { ZADANIYA } from '@/lib/paths';
import { metaVkladki } from '@/content/seo';

export const metadata: Metadata = metaVkladki(11, 'o-zadanii');

/** Вкладка «О задании» живёт на адресе самого раздела, как у №2, №4 и №8. */
export default function OZadanii11Tab() {
  return <OZadanii11 base={`${ZADANIYA}/${ZADANIE11.slug}`} />;
}
