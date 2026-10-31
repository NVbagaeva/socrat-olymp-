import type { Metadata } from 'next';
import { OZadanii19 } from '@/components/zadanie19/OZadanii19';
import { ZADANIE19, zadanie19Title } from '@/content/zadanie19';
import { ZADANIYA } from '@/lib/paths';

export const metadata: Metadata = {
  title: zadanie19Title('О задании'),
};

/** Вкладка «О задании» живёт на адресе самого раздела, как у №16. */
export default function OZadanii19Tab() {
  return <OZadanii19 base={`${ZADANIYA}/${ZADANIE19.slug}`} />;
}
