import { TabScrollOnMount } from '../TabScroll';
import type { GruppaVybora } from '../trening';
import { GRUPPY13_VID, TRENAZHER13 } from '@/content/ekonomicheskie13';
import { texPlain, typeset } from '@/lib/tex';
import type { KatalogBanka } from '@/lib/trening/bank';
import { BANK_13 } from '@/lib/zadanie13/bank';
import { PROTOTIPY_TRENAZHERA_13, SHEMY_13 } from '@/lib/zadanie13/trening/katalog';
import { TYPE_NAMES } from '@/lib/zadanie13/types';
import { Trenazher13 } from './Trenazher13';

/**
 * Каталог банка для браузера: только ключи задач «A-01|b3», без условий
 * и ответов. Источник у №13 задан прототипом целиком: задачи прототипа
 * из открытого банка ФИПИ — `f`, свои — `a`; «Из банка ФИПИ» не
 * подставляет вместо них свои (strogo).
 */
export function katalog13(): KatalogBanka {
  return Object.fromEntries(
    PROTOTIPY_TRENAZHERA_13.map((p) => {
      const ids = BANK_13.filter(([id]) => id === p.id).map(([id, seed]) => `${id}|${seed}`);
      return [
        p.id,
        p.source === 'fipi' ? { f: ids, a: [], strogo: true } : { f: [], a: ids, strogo: true },
      ];
    }),
  );
}

/** Группы-схемы и типы для выбора тем: названия набраны KaTeX на сборке. */
export function gruppy13(): GruppaVybora[] {
  return SHEMY_13.map((type) => ({
    id: type,
    nazvanie: TYPE_NAMES[type],
    znakHtml: typeset(`$${GRUPPY13_VID[type].znak}$`),
    ton: GRUPPY13_VID[type].ton,
    tipy: PROTOTIPY_TRENAZHERA_13.filter((p) => p.type === type).map((p) => ({
      id: p.id,
      nazvanieHtml: `<span>${typeset(p.title)}</span>`,
    })),
  }));
}

/**
 * Вкладка «Тренажёр» задания №13 в «Стеклянной сцене»: стартовые режимы
 * (с четвёртой карточкой «Определи тип»), выбор тем (четыре схемы, 66
 * типов), экран задачи, итоги. Задачи на странице не лежат: тренировка
 * собирается в браузере из каталога ключей, задачу строит движок по
 * ключу «прототип|seed».
 */
export function Trenazher13Tab({ base }: { base: string }) {
  const nazvaniyaTekst = Object.fromEntries(
    PROTOTIPY_TRENAZHERA_13.map((p) => [p.id, texPlain(p.title)]),
  );
  return (
    <section className="trainer z13-trening trn-host" aria-labelledby="z13-trening-title">
      {/* Заголовок вкладки — для порядка заголовков и читалок; на экране его
          заменяет активная вкладка ленты. */}
      <h2 className="sr-only" id="z13-trening-title">
        {TRENAZHER13.title}
      </h2>
      <TabScrollOnMount />
      <Trenazher13
        base={base}
        gruppy={gruppy13()}
        nazvaniyaTekst={nazvaniyaTekst}
        katalog={katalog13()}
      />
    </section>
  );
}
