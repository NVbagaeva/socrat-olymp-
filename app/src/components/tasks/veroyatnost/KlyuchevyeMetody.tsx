import type { ReactNode } from 'react';
import {
  CoordinateLine,
  HundredGrid,
  OutcomeGrid,
  OutcomeTiles,
  ProbabilityTree,
} from '@/components/probability';
import { tasksPage } from '@/content/tasks';
import {
  METODY_02,
  METODY_02_5,
  METODY_4,
  type MetodOpisanie02,
} from '@/content/veroyatnost-metody';
import type { Zadanie } from '@/content/veroyatnost';
import { BANK_5 } from '@/lib/veroyatnost';
import { METODY_5 } from '@/lib/veroyatnost/metody5';
import { METODY, metodPoId, type Method } from '@/lib/veroyatnost/model';
import { HLEB, PIROZHKI_PUTI, PIROZHKI_UROVNI, PIROZHKI_VETVI } from '@/lib/veroyatnost/primery';
import { MetodyKartochki5, type Kartochka5 } from './MetodyKartochki5';
import { Tex } from './Tex';

/**
 * Вкладка «Ключевые методы решения» заданий №4 и №5 — раздел 02
 * референса.
 *
 * У задания №4 пять карточек по одной схеме: когда применять →
 * алгоритм → компонент → как это выглядит → ошибки → правило. Тексты
 * приходят из content/veroyatnost-metody.ts, рисунки — те же
 * компоненты, что в карточке задачи, на параметрах из референса.
 *
 * У задания №5 десять карточек методов автора
 * (lib/veroyatnost/metody5.ts): номер в кружке, название, подпись,
 * формула в плашке там, где она есть. Карточка открывает модалку
 * (MetodyKartochki5); счётчик задач считается здесь по банку.
 *
 * Формулы набираются KaTeX здесь, на сервере: в браузер уходит
 * готовая вёрстка, а банк с ответами — нет.
 */

/** Идентификатор карточки метода в разметке: по нему ведут ссылки. */
export function metodAnchor(id: Method): string {
  return `metod-${METODY.find((m) => m.id === id)?.nomer ?? 0}`;
}

/* ── Рисунки из референса: те же параметры, что в разделе 02 ─────── */

const PIROZHKI = [
  ...Array.from({ length: 5 }, () => 'мясо'),
  ...Array.from({ length: 4 }, () => 'капуста'),
  ...Array.from({ length: 3 }, () => 'вишня'),
];

/* Рисунки пяти методов задания №4; у «формулы» (№5) рисунка нет. */
const RISUNKI: Partial<Record<Method, ReactNode>> = {
  'direct-count': (
    <OutcomeTiles
      outcomes={PIROZHKI}
      favorable={[9, 10, 11]}
      showCounts
      groups={[
        { label: 'с мясом', count: 5 },
        { label: 'с капустой', count: 4 },
        { label: 'с вишней', count: 3 },
      ]}
    />
  ),
  'outcome-table': (
    <OutcomeGrid
      rows={6}
      columns={6}
      rowTitle="1-й кубик"
      columnTitle="2-й кубик"
      cellContent={(r, c) => String(r + c + 2)}
      favorableCells={[
        [0, 5],
        [1, 4],
        [2, 3],
        [3, 2],
        [4, 1],
        [5, 0],
      ]}
      showCounts
    />
  ),
  'coordinate-line': (
    <CoordinateLine
      min={HLEB.min}
      max={HLEB.max}
      c={HLEB.c}
      d={HLEB.d}
      showLength
      highlightMode="answer"
    />
  ),
  'probability-tree': (
    <ProbabilityTree
      levels={PIROZHKI_UROVNI}
      branches={PIROZHKI_VETVI}
      highlightedPaths={PIROZHKI_PUTI}
      showProducts
      showSum
    />
  ),
  'convenient-number': (
    <HundredGrid
      groups={[
        { label: 'больше двух лет', share: 0.87, tone: 'strong' },
        { label: 'от года до двух', share: 0.06, tone: 'mid' },
        { label: 'меньше года', share: 0.07, tone: 'soft' },
      ]}
      highlightedGroup={1}
      showConversion
      unit="чайников"
    />
  ),
};

function Kartochka({ metod }: { metod: MetodOpisanie02 }) {
  const opisanie = METODY.find((m) => m.id === metod.id);
  if (opisanie === undefined) {
    return null;
  }
  return (
    <article className="z4-metod" id={metodAnchor(metod.id)}>
      <header className="z4-metod__head">
        <span className="z4-metod__no">Метод {opisanie.nomer}</span>
        <h2 className="z4-metod__title">{opisanie.nazvanie}</h2>
        <p className="z4-metod__sut">{metod.sut}</p>
      </header>

      <div className="z4-metod__grid">
        <section className="z4-metod__block">
          <h3 className="z4-metod__sub">{METODY_02.razdely.kogda}</h3>
          <ul className="z4-metod__list">
            {metod.kogda.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="z4-metod__block">
          <h3 className="z4-metod__sub">{METODY_02.razdely.algoritm}</h3>
          <ol className="z4-metod__steps">
            {metod.algoritm.map((item) => (
              <li key={item}>
                <Tex text={item} />
              </li>
            ))}
          </ol>
        </section>

        <section className="z4-metod__block z4-metod__block--komponent">
          <h3 className="z4-metod__sub">{METODY_02.razdely.komponent}</h3>
          <dl className="z4-metod__params">
            {metod.komponent.parametry.map((p) => (
              <div key={p.prop} className="z4-metod__param">
                <dt>
                  <code>{p.prop}</code>
                </dt>
                <dd>{p.opisanie}</dd>
              </div>
            ))}
          </dl>
        </section>

        <figure className="z4-metod__figure">
          <div className="z4-metod__risunok">{RISUNKI[metod.id]}</div>
          <figcaption>{metod.komponent.podpis}</figcaption>
        </figure>

        <section className="z4-metod__block">
          <h3 className="z4-metod__sub">{METODY_02.razdely.kakVyglyadit}</h3>
          <p className="z4-metod__text">{metod.kakVyglyadit}</p>
        </section>

        <section className="z4-metod__block">
          <h3 className="z4-metod__sub">{METODY_02.razdely.oshibki}</h3>
          <ul className="z4-metod__list z4-metod__list--oshibki">
            {metod.oshibki.map((item) => (
              <li key={item}>
                <Tex text={item} />
              </li>
            ))}
          </ul>
        </section>
      </div>

      <footer className="z4-metod__pravilo">
        <p className="z4-metod__pravilo-text">{metod.pravilo}</p>
        <Tex className="z4-metod__formula" text={`$${metod.formula}$`} />
      </footer>
    </article>
  );
}

/**
 * Карточки методов задания №5. Счётчик «задач в банке» — число задач
 * задачника, отнесённых к методу (варианты с источником «задачник»
 * у прототипов этого блока); сгенерированные варианты не считаются.
 */
function kartochki5(): Kartochka5[] {
  return METODY_5.map((m) => ({
    id: m.id,
    nomer: m.nomer,
    nazvanie: m.nazvanie,
    opisanie: m.opisanie,
    formula: m.formula === undefined ? null : <Tex text={`$${m.formula}$`} />,
    schet: METODY_02_5.modal.vBanke(
      BANK_5.filter((p) => p.blok === m.id).reduce(
        (sum, p) => sum + p.varianty.filter((v) => v.source === 'задачник').length,
        0,
      ),
    ),
    href: `${tasksPage.href}/5/trenazher/${m.id}/`,
  }));
}

export interface KlyuchevyeMetodyProps {
  /** Чья вкладка: пять методов референса у №4, десять автора у №5. */
  zadanie?: Zadanie;
}

export function KlyuchevyeMetody({ zadanie = 4 }: KlyuchevyeMetodyProps) {
  if (zadanie === 5) {
    return (
      <div className="z4-metody z5-metody">
        <header className="z4-metody__head">
          <h2 className="t-h2 z4-metody__title">{METODY_02_5.title}</h2>
        </header>
        <MetodyKartochki5 items={kartochki5()} />
      </div>
    );
  }

  return (
    <div className="z4-metody">
      <header className="z4-metody__head">
        <h2 className="t-h2 z4-metody__title">{METODY_02.title}</h2>
        <p className="z4-metody__lead">{METODY_02.lead}</p>
        <nav className="z4-metody__nav" aria-label="Методы">
          {METODY_4.map((metod) => {
            const m = metodPoId(metod.id);
            return (
              <a key={m.id} className="z4-metody__link" href={`#${metodAnchor(m.id)}`}>
                <span className="z4-metody__link-no">{m.nomer}</span>
                {m.nazvanie}
              </a>
            );
          })}
        </nav>
      </header>

      {METODY_4.map((metod) => (
        <Kartochka key={metod.id} metod={metod} />
      ))}
    </div>
  );
}
