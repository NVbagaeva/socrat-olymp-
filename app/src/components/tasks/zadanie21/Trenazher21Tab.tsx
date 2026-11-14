import { TabScrollOnMount } from '../TabScroll';
import type { GruppaVybora } from '../trening';
import { GRUPPY21_VID, TRENAZHER21 } from '@/content/naibolshee21';
import { GRUPPY21, prototypesOfGruppa } from '@/lib/zadanie21/gruppy';
import { PROTOTYPES } from '@/lib/zadanie21/prototypes';
import { katalog21 } from '@/lib/zadanie21/trening/katalog';
import { texPlain, typeset } from '@/lib/tex';
import { Trenazher21 } from './Trenazher21';

/**
 * Вкладка «Тренажёр»: стартовые режимы, выбор тем (семь групп), экран
 * задачи, итоги — общий тренажёр. Названия набраны KaTeX на сборке.
 * Задачи строит генератор в браузере по ключам каталога (по 20 на тип).
 */
export function Trenazher21Tab({ base }: { base: string }) {
  const gruppy: GruppaVybora[] = GRUPPY21.map((g) => ({
    id: String(g.id),
    nazvanie: texPlain(g.title),
    znakHtml: typeset(`$${GRUPPY21_VID[g.id].znak}$`),
    ton: GRUPPY21_VID[g.id].ton,
    tipy: prototypesOfGruppa(g.id).map((p) => ({
      id: p.id,
      nazvanieHtml: `<span>${typeset(p.title)}</span>`,
    })),
  }));
  const nazvaniyaTekst = Object.fromEntries(PROTOTYPES.map((p) => [p.id, texPlain(p.title)]));
  return (
    <section className="trainer z21-trening trn-host" aria-labelledby="z21-trening-title">
      <h2 className="sr-only" id="z21-trening-title">
        {TRENAZHER21.title}
      </h2>
      <TabScrollOnMount />
      <Trenazher21
        base={base}
        gruppy={gruppy}
        nazvaniyaTekst={nazvaniyaTekst}
        katalog={katalog21()}
      />
    </section>
  );
}
