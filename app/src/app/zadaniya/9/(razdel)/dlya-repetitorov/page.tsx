import type { Metadata } from 'next';
import { Repetitory9 } from '@/components/tasks/proizvodnaya/Repetitory9';
import { O_ZADANII_9, PROIZVODNAYA, REPETITORY_9, proizvodnayaTitle } from '@/content/proizvodnaya';
import { PROTOTYPES } from '@/lib/proizvodnaya/prototypes';
import { typeset } from '@/lib/tex';
import { ZADANIYA } from '@/lib/paths';

export const metadata: Metadata = {
  title: proizvodnayaTitle(REPETITORY_9.title),
};

/**
 * Число аналогов на прототип. Банк зафиксированных вариантов
 * (lib/proizvodnaya/bank.ts) пишет другая часть работы; пока его нет,
 * в каждом прототипе десять аналогов.
 * TODO: взять число из BANK, когда файл появится.
 */
const ANALOGOV = 10;

/** Вкладка «Для репетиторов» задания №9. Названия набраны KaTeX на сборке. */
export default function Repetitory9Page() {
  return (
    <Repetitory9
      base={`${ZADANIYA}/${PROIZVODNAYA.slug}`}
      gruppy={O_ZADANII_9.gruppy.map((g) => ({ id: g.id, title: g.title }))}
      prototypes={PROTOTYPES.map((p) => ({
        id: p.id,
        gruppa: p.gruppa,
        titleHtml: typeset(p.nazvanie),
        variants: ANALOGOV,
      }))}
    />
  );
}
