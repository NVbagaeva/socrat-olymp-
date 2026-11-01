import type { Metadata } from 'next';
import { Repetitory10 } from '@/components/tasks/zadanie10/Repetitory10';
import { ZADANIE10 } from '@/content/zadanie10';
import { kodNaSayte, PROTOTYPES } from '@/lib/zadanie10/prototypes';
import { ZADANIYA } from '@/lib/paths';
import { metaVkladki } from '@/content/seo';

export const metadata: Metadata = metaVkladki(10, 'repetitory');

export default function Repetitory10Tab() {
  const nazvaniya = Object.fromEntries(
    PROTOTYPES.map((p) => [p.id, `${kodNaSayte(p.id)} ${p.title}`]),
  );
  return <Repetitory10 base={`${ZADANIYA}/${ZADANIE10.slug}`} nazvaniya={nazvaniya} />;
}
