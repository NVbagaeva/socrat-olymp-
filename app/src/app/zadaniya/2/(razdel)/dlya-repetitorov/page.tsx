import type { Metadata } from 'next';
import { Repetitory2 } from '@/components/tasks/vektory/Repetitory2';
import { O_ZADANII, REPETITORY_2, VEKTORY, vektoryTitle } from '@/content/vektory';
import { typeset } from '@/lib/tex';
import { BANK } from '@/lib/vektory/bank';
import { PROTOTYPES } from '@/lib/vektory/prototypes';
import { ZADANIYA } from '@/lib/paths';

export const metadata: Metadata = {
  title: vektoryTitle(REPETITORY_2.title),
};

/**
 * Вкладка «Для репетиторов» задания №2: банк зафиксированных
 * вариантов и печатные листы из него. Названия прототипов набраны
 * KaTeX на сборке; ответов на странице нет — их считает лист.
 */
export default function Repetitory2Page() {
  const perPrototype = new Map(BANK.map((entry) => [entry.prototype, entry.variants.length]));
  return (
    <Repetitory2
      base={`${ZADANIYA}/${VEKTORY.slug}`}
      gruppy={O_ZADANII.gruppy.map((g) => ({ id: g.id, title: g.title }))}
      prototypes={PROTOTYPES.map((p) => ({
        id: p.id,
        gruppa: p.gruppa,
        titleHtml: typeset(p.nazvanie),
        variants: perPrototype.get(p.id) ?? 0,
      }))}
    />
  );
}
