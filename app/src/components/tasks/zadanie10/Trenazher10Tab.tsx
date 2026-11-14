import { TabScrollOnMount } from '../TabScroll';
import type { GruppaVybora } from '../trening';
import { GRUPPY10_VID, TRENAZHER10 } from '@/content/prikladnye10';
import { texPlain, typeset } from '@/lib/tex';
import type { KatalogBanka } from '@/lib/trening/bank';
import { zadachiPrototipa } from '@/lib/zadanie10/bank/index';
import { kartinkiPrototipov } from '@/lib/zadanie10/illyustracii';
import { GROUPS, PROTOTYPES, prototypesOfGroup } from '@/lib/zadanie10/prototypes';
import { Trenazher10 } from './Trenazher10';

/**
 * Каталог банка для браузера: только ключи задач, без условий и ответов.
 * Задачи открытого банка ФИПИ — `f`, аналоги — `a`. У прототипов из
 * курса задач ФИПИ нет: «Из банка ФИПИ» даёт по ним аналоги, как и в
 * прежнем тренажёре.
 */
function katalog10(): KatalogBanka {
  return Object.fromEntries(
    PROTOTYPES.map((p) => {
      const { fipi, analogi } = zadachiPrototipa(p.id);
      return [p.id, { f: fipi.map((z) => z.id), a: analogi.map((z) => z.id) }];
    }),
  );
}

/**
 * Вкладка «Тренажёр» задания №10 в «Стеклянной сцене»: стартовые режимы,
 * выбор тем (пять групп, 34 типа), экран задачи с картинкой сюжета,
 * итоги. Сами задачи на странице не лежат: тренировка собирается в
 * браузере из каталога, условия приезжают файлами прототипов
 * (public/data/zadanie10, без ответов).
 */
export function Trenazher10Tab({ base }: { base: string }) {
  const gruppy: GruppaVybora[] = GROUPS.map((g) => ({
    id: g.id,
    nazvanie: g.title,
    znakHtml: typeset(`$${GRUPPY10_VID[g.id].znak}$`),
    ton: GRUPPY10_VID[g.id].ton,
    tipy: prototypesOfGroup(g.id).map((p) => ({
      id: p.id,
      nazvanieHtml: `<span>${typeset(p.title)}</span>`,
    })),
  }));
  const nazvaniyaTekst = Object.fromEntries(PROTOTYPES.map((p) => [p.id, texPlain(p.title)]));
  return (
    <section className="trainer z10-trening trn-host" aria-labelledby="z10-trening-title">
      {/* Заголовок вкладки — для порядка заголовков и читалок; на экране его
          заменяет активная вкладка ленты. */}
      <h2 className="sr-only" id="z10-trening-title">
        {TRENAZHER10.title}
      </h2>
      <TabScrollOnMount />
      <Trenazher10
        base={base}
        gruppy={gruppy}
        nazvaniyaTekst={nazvaniyaTekst}
        katalog={katalog10()}
        kartinki={kartinkiPrototipov()}
      />
    </section>
  );
}
