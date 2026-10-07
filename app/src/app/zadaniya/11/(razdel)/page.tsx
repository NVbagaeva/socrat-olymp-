import type { Metadata } from 'next';
import { OZadanii11 } from '@/components/tasks/zadanie11/OZadanii11';
import { ZADANIE11, zadanie11Meta } from '@/content/zadanie11';
import { ZADANIYA } from '@/lib/paths';

export const metadata: Metadata = {
  ...zadanie11Meta('О задании'),
};

/** Вкладка «О задании» живёт на адресе самого раздела, как у №2, №4 и №8. */
export default function OZadanii11Tab() {
  return <OZadanii11 base={`${ZADANIYA}/${ZADANIE11.slug}`} />;
}
