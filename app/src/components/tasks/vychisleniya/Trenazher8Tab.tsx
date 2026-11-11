import { TabScrollOnMount } from '../TabScroll';
import type { GruppaVybora } from '../trening';
import { GRUPPY8, TIPY8 } from '@/content/vychisleniya8';
import { prototypeById } from '@/lib/vychisleniya/prototypes';
import { typeset } from '@/lib/tex';
import { Trenazher8 } from './Trenazher8';

/**
 * Вкладка «Тренажёр» задания №8.
 *
 * Названия групп и типов с формулами набираются KaTeX здесь, на
 * сборке, и уходят в клиентский тренажёр готовой разметкой: самому
 * тренажёру KaTeX нужен только для задач, которые он собирает в
 * браузере.
 */
export function Trenazher8Tab({ base }: { base: string }) {
  const gruppy: GruppaVybora[] = GRUPPY8.map((g) => ({
    id: g.id,
    nazvanie: g.nazvanie,
    znakHtml: typeset(`$${g.znak}$`),
    ton: g.ton,
    tipy: g.prototypes.map((id) => ({
      id,
      nazvanieHtml: typeset(TIPY8[id]?.nazvanie ?? prototypeById(id)?.nazvanie ?? id),
    })),
  }));
  return (
    <section className="trainer z8-trening trn-host">
      <TabScrollOnMount />
      <Trenazher8 base={base} gruppy={gruppy} />
    </section>
  );
}
