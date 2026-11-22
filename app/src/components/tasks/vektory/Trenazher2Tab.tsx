import { TabScrollOnMount } from '../TabScroll';
import type { GruppaVybora } from '../trening';
import { O_ZADANII } from '@/content/vektory';
import { GRUPPY2_VID, TRENAZHER2 } from '@/content/vektory2';
import { texPlain, typeset } from '@/lib/tex';
import { PROTOTYPES } from '@/lib/vektory/prototypes';
import { katalog2 } from '@/lib/vektory/trening/katalog';
import { Trenazher2 } from './Trenazher2';

/**
 * Вкладка «Тренажёр» задания №2 в «Стеклянной сцене»: стартовые режимы,
 * выбор тем (три группы, 19 типов), экран задачи, итоги. Названия
 * набраны KaTeX на сборке. Задачи строит генератор в браузере по ключам
 * каталога (по 50 проверенных seed на тип).
 */
export function Trenazher2Tab({ base }: { base: string }) {
  const gruppy: GruppaVybora[] = O_ZADANII.gruppy.map((g) => ({
    id: g.id,
    nazvanie: g.title,
    znakHtml: typeset(`$${GRUPPY2_VID[g.id].znak}$`),
    ton: GRUPPY2_VID[g.id].ton,
    tipy: PROTOTYPES.filter((p) => p.gruppa === g.id).map((p) => ({
      id: p.id,
      nazvanieHtml: `<span>${typeset(p.nazvanie)}</span>`,
    })),
  }));
  const nazvaniyaTekst = Object.fromEntries(PROTOTYPES.map((p) => [p.id, texPlain(p.nazvanie)]));
  return (
    <section className="trainer z2-trening trn-host" aria-labelledby="z2-trening-title">
      {/* Заголовок вкладки — для порядка заголовков и читалок; на экране его
          заменяет активная вкладка ленты. */}
      <h2 className="sr-only" id="z2-trening-title">
        {TRENAZHER2.title}
      </h2>
      <TabScrollOnMount />
      <Trenazher2
        base={base}
        gruppy={gruppy}
        nazvaniyaTekst={nazvaniyaTekst}
        katalog={katalog2()}
      />
    </section>
  );
}
