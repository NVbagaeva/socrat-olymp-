import { TabScrollOnMount } from '../TabScroll';
import type { GruppaVybora } from '../trening';
import { GRUPPY3, TIPY3, TRENAZHER3 } from '@/content/zadanie3';
import { texPlain, typeset } from '@/lib/tex';
import { katalog3 } from '@/lib/zadanie3/trening/dannye';
import { Figurka } from './Figurka';
import { Trenazher3 } from './Trenazher3';
import './zadanie3.css';

/**
 * Вкладка «Тренажёр» задания №3 в «Стеклянной сцене»: стартовые режимы,
 * выбор тем (семь групп, 15 типов), экран задачи, итоги. Названия
 * набраны KaTeX на сборке; значки групп — фигуры, нарисованные движком
 * чертежей. Сами задачи на странице не лежат: тренировка собирается в
 * браузере из каталога, данные приезжают файлами прототипов.
 */
export function Trenazher3Tab({ base }: { base: string }) {
  const gruppy: GruppaVybora[] = GRUPPY3.map((g) => ({
    id: g.id,
    nazvanie: g.nazvanie,
    znakHtml: '',
    znak: <Figurka prototip={g.znak} />,
    ton: g.ton,
    tipy: g.tipy.map((id) => ({ id, nazvanieHtml: typeset(TIPY3[id]?.nazvanie ?? id) })),
  }));
  const nazvaniyaTekst = Object.fromEntries(
    Object.entries(TIPY3).map(([id, t]) => [id, texPlain(t.nazvanie)]),
  );
  return (
    <section className="trainer z3-trening trn-host" aria-labelledby="z3-trening-title">
      {/* Заголовок вкладки — для порядка заголовков и читалок; на экране его
          заменяет активная вкладка ленты. */}
      <h2 className="sr-only" id="z3-trening-title">
        {TRENAZHER3.title}
      </h2>
      <TabScrollOnMount />
      <Trenazher3
        base={base}
        gruppy={gruppy}
        nazvaniyaTekst={nazvaniyaTekst}
        katalog={katalog3()}
      />
    </section>
  );
}
