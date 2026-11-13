import { TabScrollOnMount } from '../TabScroll';
import type { GruppaVybora } from '../trening';
import { GRUPPY6_VID, TRENAZHER6 } from '@/content/sluchainye6';
import { texPlain, typeset } from '@/lib/tex';
import type { KatalogBanka } from '@/lib/trening/bank';
import { zadachiPrototipa } from '@/lib/zadanie6/bank/index';
import { GROUPS, PROTOTYPES, prototypesOfGroup } from '@/lib/zadanie6/prototypes';
import { Trenazher6 } from './Trenazher6';

/**
 * Каталог банка для браузера: только ключи задач, без условий и ответов.
 * Исходные задачи (образцы и демоверсия) — `f`, аналоги — `a`, сюжетные
 * среди них — `s` (для переключателя формулировки).
 */
function katalog6(): KatalogBanka {
  return Object.fromEntries(
    PROTOTYPES.map((p) => {
      const { istochniki, analogi } = zadachiPrototipa(p.id);
      return [
        p.id,
        {
          f: istochniki.map((z) => z.id),
          a: analogi.map((z) => z.id),
          s: [...istochniki, ...analogi].filter((z) => z.stil === 'syuzhet').map((z) => z.id),
        },
      ];
    }),
  );
}

/**
 * Вкладка «Тренажёр» задания №6 в «Стеклянной сцене»: стартовые режимы,
 * выбор тем (пять групп, 15 типов), экран задачи, итоги. Названия
 * набраны KaTeX на сборке. Сами задачи на странице не лежат: тренировка
 * собирается в браузере из каталога, условия приезжают файлами
 * прототипов (public/data/zadanie6, без ответов).
 */
export function Trenazher6Tab({ base }: { base: string }) {
  const gruppy: GruppaVybora[] = GROUPS.map((g) => ({
    id: g.id,
    nazvanie: g.title,
    znakHtml: typeset(`$${GRUPPY6_VID[g.id].znak}$`),
    ton: GRUPPY6_VID[g.id].ton,
    /* Название с формулой — одним куском: в чипе выбора и в метке над
       условием текст и формула идут одной строкой. */
    tipy: prototypesOfGroup(g.id).map((p) => ({
      id: p.id,
      nazvanieHtml: `<span>${typeset(p.title)}</span>`,
    })),
  }));
  const nazvaniyaTekst = Object.fromEntries(PROTOTYPES.map((p) => [p.id, texPlain(p.title)]));
  return (
    <section className="trainer z6-trening trn-host" aria-labelledby="z6-trening-title">
      {/* Заголовок вкладки — для порядка заголовков и читалок; на экране его
          заменяет активная вкладка ленты. */}
      <h2 className="sr-only" id="z6-trening-title">
        {TRENAZHER6.title}
      </h2>
      <TabScrollOnMount />
      <Trenazher6
        base={base}
        gruppy={gruppy}
        nazvaniyaTekst={nazvaniyaTekst}
        katalog={katalog6()}
      />
    </section>
  );
}
