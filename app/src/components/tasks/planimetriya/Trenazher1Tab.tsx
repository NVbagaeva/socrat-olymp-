import { TabScrollOnMount } from '../TabScroll';
import type { GruppaVybora } from '../trening';
import { GRUPPY1_TON, TRENAZHER1 } from '@/content/planimetriya1';
import { O_ZADANII_1 } from '@/content/zadanie1';
import { texPlain, typeset } from '@/lib/tex';
import { katalog1 } from '@/lib/planimetriya/trening/katalog';
import { PROTOTIPY } from '@/lib/planimetriya/stseny';
import type { Blok } from '@/lib/planimetriya/stseny/dsl';
import { klyuchProto } from '@/lib/planimetriya/trenazher/sessiya';
import { IkonkaBloka1 } from './IkonkaBloka1';
import { Trenazher1Bank } from './Trenazher1Bank';

/** Группы №1 — блоки I–X с прототипами: для выбора тем и прогресса. */
export function gruppy1(): GruppaVybora[] {
  return O_ZADANII_1.tipy.map((t) => {
    const blok = t.blok as Blok;
    return {
      id: blok,
      nazvanie: texPlain(t.title),
      znakHtml: '',
      znak: <IkonkaBloka1 blok={blok} />,
      ton: GRUPPY1_TON[blok],
      tipy: PROTOTIPY.filter((p) => p.blok === blok).map((p) => ({
        id: klyuchProto(p.id),
        nazvanieHtml: `<span>${typeset(p.nazvanie)}</span>`,
      })),
    };
  });
}

/**
 * Вкладка «Тренажёр» задания №1 в «Стеклянной сцене»: стартовые режимы,
 * выбор тем (десять групп, 75 типов), экран задачи с чертежом, итоги.
 * Названия набраны KaTeX на сборке. Задач на странице нет: тренировка —
 * ключи из каталога, задачу по ключу строит движок планиметрии в
 * браузере (lib/planimetriya/trening).
 */
export function Trenazher1Tab({ base }: { base: string }) {
  const nazvaniyaTekst = Object.fromEntries(
    PROTOTIPY.map((p) => [klyuchProto(p.id), texPlain(p.nazvanie)]),
  );
  return (
    <section className="trainer z1-trening trn-host" aria-labelledby="z1-trening-title">
      <h2 className="sr-only" id="z1-trening-title">
        {TRENAZHER1.title}
      </h2>
      <TabScrollOnMount />
      <Trenazher1Bank
        base={base}
        gruppy={gruppy1()}
        nazvaniyaTekst={nazvaniyaTekst}
        katalog={katalog1()}
      />
    </section>
  );
}
