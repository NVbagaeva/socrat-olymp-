import type { Metadata } from 'next';
import { OZadanii1 } from '@/components/tasks/planimetriya/OZadanii1';
import { ZADANIE1, zadanie1Title } from '@/content/zadanie1';
import { ZADANIYA } from '@/lib/paths';

export const metadata: Metadata = {
  title: zadanie1Title('О задании'),
};

/** Вкладка «О задании» живёт на адресе самого раздела, как у №2 и №11. */
export default function OZadanii1Tab() {
  return <OZadanii1 base={`${ZADANIYA}/${ZADANIE1.slug}`} />;
}
