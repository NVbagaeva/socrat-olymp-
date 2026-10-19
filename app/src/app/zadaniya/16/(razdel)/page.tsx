import type { Metadata } from 'next';
import { OZadanii16 } from '@/components/zadanie16/OZadanii16';
import { ZADANIE16, zadanie16Title } from '@/content/zadanie16';
import { ZADANIYA } from '@/lib/paths';

export const metadata: Metadata = {
  title: zadanie16Title('О задании'),
};

/** Вкладка «О задании» живёт на адресе самого раздела, как у №11. */
export default function OZadanii16Tab() {
  return <OZadanii16 base={`${ZADANIYA}/${ZADANIE16.slug}`} />;
}
