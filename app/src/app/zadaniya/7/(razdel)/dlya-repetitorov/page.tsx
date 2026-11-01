import type { Metadata } from 'next';
import { Repetitory7 } from '@/components/tasks/zadanie7/Repetitory7';
import { ZADANIE7 } from '@/content/zadanie7';
import { ZADANIYA } from '@/lib/paths';
import { metaVkladki } from '@/content/seo';

export const metadata: Metadata = metaVkladki(7, 'repetitory');

export default function Repetitory7Tab() {
  return <Repetitory7 base={`${ZADANIYA}/${ZADANIE7.slug}`} />;
}
