import { TabScrollOnMount } from '../TabScroll';
import type { GruppaVybora } from '../trening';
import { O_ZADANII_9 } from '@/content/proizvodnaya';
import { GRUPPY9_VID, TRENAZHER9 } from '@/content/proizvodnaya9';
import { prototypesOfGroup } from '@/lib/proizvodnaya/skills';
import { PROTOTYPES } from '@/lib/proizvodnaya/prototypes';
import { katalog9 } from '@/lib/proizvodnaya/trening/katalog';
import { texPlain, typeset } from '@/lib/tex';
import { Trenazher9 } from './Trenazher9';

/**
 * Вкладка «Тренажёр» задания №9 в «Стеклянной сцене»: стартовые режимы,
 * выбор тем (пять групп, 31 тип), экран задачи, итоги — общий тренажёр.
 * Названия набраны KaTeX на сборке. Задачи строит генератор в браузере
 * по ключам каталога (банк зафиксированных вариантов, по 20 на тип).
 */
export function Trenazher9Tab({ base }: { base: string }) {
  const gruppy: GruppaVybora[] = O_ZADANII_9.gruppy.map((g) => ({
    id: g.id,
    nazvanie: g.title,
    znakHtml: typeset(`$${GRUPPY9_VID[g.id].znak}$`),
    ton: GRUPPY9_VID[g.id].ton,
    tipy: prototypesOfGroup(g.id).map((p) => ({
      id: p.id,
      nazvanieHtml: `<span>${typeset(p.nazvanie)}</span>`,
    })),
  }));
  const nazvaniyaTekst = Object.fromEntries(PROTOTYPES.map((p) => [p.id, texPlain(p.nazvanie)]));
  return (
    <section className="trainer z9-trening trn-host" aria-labelledby="z9-trening-title">
      {/* Заголовок вкладки — для порядка заголовков и читалок; на экране его
          заменяет активная вкладка ленты. */}
      <h2 className="sr-only" id="z9-trening-title">
        {TRENAZHER9.title}
      </h2>
      <TabScrollOnMount />
      <Trenazher9
        base={base}
        gruppy={gruppy}
        nazvaniyaTekst={nazvaniyaTekst}
        katalog={katalog9()}
      />
    </section>
  );
}
