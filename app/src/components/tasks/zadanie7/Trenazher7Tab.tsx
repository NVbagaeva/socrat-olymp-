import { TabScrollOnMount } from '../TabScroll';
import type { GruppaVybora } from '../trening';
import { GRUPPY7_VID, TRENAZHER7 } from '@/content/uravneniya7';
import { texPlain, typeset } from '@/lib/tex';
import { zadachiPrototipa } from '@/lib/zadanie7/bank/index';
import { GROUPS, PROTOTYPES, prototypesOfGroup } from '@/lib/zadanie7/prototypes';
import type { Katalog7 } from '@/lib/zadanie7/trening/session';
import { Trenazher7 } from './Trenazher7';

/** Каталог банка для браузера: только ключи задач, без условий и ответов. */
function katalog7(): Katalog7 {
  return Object.fromEntries(
    PROTOTYPES.map((p) => {
      const { fipi, analogi } = zadachiPrototipa(p.id);
      return [p.id, { f: fipi.map((z) => z.id), a: analogi.map((z) => z.id) }];
    }),
  );
}

/**
 * Вкладка «Тренажёр» задания №7 в «Стеклянной сцене»: стартовые режимы,
 * выбор тем (пять групп, 35 типов), экран задачи, итоги. Названия
 * набраны KaTeX на сборке. Сами задачи на странице не лежат: тренировка
 * собирается в браузере из каталога, условия приезжают файлами
 * прототипов (public/data/zadanie7, без ответов).
 */
export function Trenazher7Tab({ base }: { base: string }) {
  const gruppy: GruppaVybora[] = GROUPS.map((g) => ({
    id: g.id,
    nazvanie: g.title,
    znakHtml: typeset(`$${GRUPPY7_VID[g.id].znak}$`),
    ton: GRUPPY7_VID[g.id].ton,
    /* Название с формулой — одним куском: в чипе выбора и в метке над
       условием текст и формула идут одной строкой. */
    tipy: prototypesOfGroup(g.id).map((p) => ({
      id: p.id,
      nazvanieHtml: `<span>${typeset(p.title)}</span>`,
    })),
  }));
  const nazvaniyaTekst = Object.fromEntries(PROTOTYPES.map((p) => [p.id, texPlain(p.title)]));
  return (
    <section className="trainer z7-trening trn-host" aria-labelledby="z7-trening-title">
      {/* Заголовок вкладки — для порядка заголовков и читалок; на экране его
          заменяет активная вкладка ленты. */}
      <h2 className="sr-only" id="z7-trening-title">
        {TRENAZHER7.title}
      </h2>
      <TabScrollOnMount />
      <Trenazher7
        base={base}
        gruppy={gruppy}
        nazvaniyaTekst={nazvaniyaTekst}
        katalog={katalog7()}
      />
    </section>
  );
}
