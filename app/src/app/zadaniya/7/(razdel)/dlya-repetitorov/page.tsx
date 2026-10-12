import type { Metadata } from 'next';
import { Repetitory7 } from '@/components/tasks/zadanie7/Repetitory7';
import { ZADANIE7, zadanie7Title } from '@/content/zadanie7';
import { ZADANIYA } from '@/lib/paths';

export const metadata: Metadata = {
  title: zadanie7Title('Для репетиторов'),
};

export default function Repetitory7Tab() {
  return <Repetitory7 base={`${ZADANIYA}/${ZADANIE7.slug}`} />;
}
