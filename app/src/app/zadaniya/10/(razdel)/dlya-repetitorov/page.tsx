import type { Metadata } from 'next';
import { Repetitory10 } from '@/components/tasks/zadanie10/Repetitory10';
import { ZADANIE10, zadanie10Title } from '@/content/zadanie10';
import { kodNaSayte, PROTOTYPES } from '@/lib/zadanie10/prototypes';
import { ZADANIYA } from '@/lib/paths';

export const metadata: Metadata = {
  title: zadanie10Title('Для репетиторов'),
};

export default function Repetitory10Tab() {
  const nazvaniya = Object.fromEntries(
    PROTOTYPES.map((p) => [p.id, `${kodNaSayte(p.id)} ${p.title}`]),
  );
  return <Repetitory10 base={`${ZADANIYA}/${ZADANIE10.slug}`} nazvaniya={nazvaniya} />;
}
