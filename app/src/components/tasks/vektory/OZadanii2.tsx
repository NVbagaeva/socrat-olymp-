import type { CSSProperties } from 'react';
import { Tex } from '@/components/ui/Tex';
import {
  DALSHE_2,
  OSHIBKI_2,
  PASPORT_2,
  TIPY_2,
  UMET_2,
  type Shag2,
  type Tip2,
} from '@/content/oZadanii2';
import { OPORNYE } from '@/content/opornye';
import { VEKTORY } from '@/content/vektory';
import { ZADANIYA } from '@/lib/paths';
import { PROTOTYPES } from '@/lib/vektory/prototypes';
import { katex } from '@/lib/graph/katex';
import { Paras } from '../theory/rich/parts';
import { Poyavlenie } from './Poyavlenie';
import { Risunok } from './Risunok';
import { TipyRaskrytie, type TipGruppa } from './TipyRaskrytie';

const BASE = `${ZADANIYA}/${VEKTORY.slug}`;

/**
 * Выкладка: KaTeX на сборке, дроби крупные (\dfrac остаётся \dfrac —
 * опция displayFrac, как в ключе учителя). В строчном режиме формула
 * переносится по знакам и не обрезается на телефоне.
 */
function Display({ tex, className }: { tex: string; className?: string }) {
  return (
    <span
      className={className === undefined ? 'z2o-math' : `z2o-math ${className}`}
      dangerouslySetInnerHTML={{
        __html: katex.renderToString('\\displaystyle ' + tex, {
          throwOnError: false,
          displayMode: false,
          displayFrac: true,
        }),
      }}
    />
  );
}
const TIPY_ID = 'z2o-tipy';

/**
 * Пара формул «…,\qquad …» — две строки выкладки. На узком экране
 * KaTeX переносил бы пару посередине формулы, поэтому каждая идёт
 * своей строкой; на широком они стоят рядом (flex с переносом).
 */
function razbit(tex: string): string[] {
  return tex.split(/,\\qquad\s*/);
}

function Strelka() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

/* ── Паспорт ────────────────────────────────────────────────────── */

/** Ответ в клетках бланка: каждый символ — своя клетка, минус — настоящий. */
function Kletki({ value }: { value: string }) {
  return (
    <span className="z2o-blank" aria-label={value.replace('-', '−')} role="img">
      {[...value].map((ch, i) => (
        <span className="z2o-blank__cell" key={i} aria-hidden="true">
          {ch === '-' ? '−' : ch}
        </span>
      ))}
    </span>
  );
}

function Pasport() {
  return (
    <section className="z2o-pasport z2o-glass" aria-labelledby="z2o-pasport-title" data-reveal="">
      <div className="z2o-pasport__main">
        <span className="z2o-pasport__no" aria-hidden="true">
          {PASPORT_2.nomer}
        </span>
        <div className="z2o-pasport__text">
          <ul className="z2o-chips" aria-label="Паспорт задания">
            <li className="z2o-chip">Задание №{PASPORT_2.nomer}</li>
            <li className="z2o-chip">{PASPORT_2.chast}</li>
            <li className="z2o-chip">{PASPORT_2.ball}</li>
            <li className="z2o-chip z2o-chip--warm">{PASPORT_2.tema}</li>
          </ul>
          <h2 className="z2o-pasport__title" id="z2o-pasport-title">
            {PASPORT_2.title}
          </h2>
          <p className="z2o-pasport__desc">{PASPORT_2.proveryaet}</p>
        </div>
      </div>
      <div className="z2o-pasport__otvet">
        <p className="z2o-eyebrow">{PASPORT_2.otvetTitle}</p>
        <p className="z2o-pasport__otvet-text">{PASPORT_2.otvet}</p>
        <div className="z2o-pasport__blanks">
          {PASPORT_2.obraztsy.map((value) => (
            <Kletki value={value} key={value} />
          ))}
        </div>
        <p className="z2o-pasport__note">
          {PASPORT_2.otvetNote} · {PROTOTYPES.length} {PASPORT_2.prototipov}
        </p>
      </div>
    </section>
  );
}

/* ── Что нужно уметь ────────────────────────────────────────────── */

function Umet() {
  return (
    <section className="z2o-umet" aria-labelledby="z2o-umet-title">
      <header className="z2o-head" data-reveal="">
        <h2 className="z2o-h2" id="z2o-umet-title">
          {UMET_2.title}
        </h2>
        <p className="z2o-lead">{UMET_2.lead}</p>
      </header>
      <div className="z2o-umet__grid">
        <figure className="z2o-umet__fig z2o-glass" data-reveal="">
          <Risunok className="z2o-umet__pic" config={UMET_2.risunok} />
          <figcaption className="z2o-umet__caption">{UMET_2.podpis}</figcaption>
        </figure>
        <ol className="z2o-chain">
          {UMET_2.navyki.map((n, i) => (
            <li
              className="z2o-chain__item"
              key={n.title}
              data-reveal=""
              style={{ '--i': i } as CSSProperties}
            >
              <span className="z2o-chain__no" aria-hidden="true">
                {i + 1}
              </span>
              <div className="z2o-chain__body">
                <h3 className="z2o-chain__title">{n.title}</h3>
                <Display className="z2o-chain__formula" tex={n.formula} />
                <span className="z2o-chain__value">
                  {razbit(n.naRisunke).map((line) => (
                    <Display tex={line} key={line} />
                  ))}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ── Типы задач ─────────────────────────────────────────────────── */

function Kartochka({ tip }: { tip: Tip2 }) {
  return (
    <>
      <span className="z2t-card__pic" aria-hidden="true">
        <Risunok
          config={{
            vectors: tip.risunok.vectors,
            window: 'tight',
            ...(tip.risunok.grid === undefined ? {} : { grid: tip.risunok.grid }),
          }}
        />
      </span>
      <span className="z2t-card__text">
        <span className="z2t-card__no">{tip.no}</span>
        <h4 className="z2t-card__title">{tip.nazvanie}</h4>
        <span className="z2t-card__nayti">{tip.nayti}</span>
        <span className="z2t-card__meta">
          <span className="z2t-card__protos">{tip.prototipy}</span>
          <span className="z2t-card__go" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </span>
        </span>
      </span>
    </>
  );
}

function Shag({ shag, no }: { shag: Shag2; no: number }) {
  return (
    <li className={shag.check === true ? 'z2r-step is-check' : 'z2r-step'}>
      <span className="z2r-step__no" aria-hidden="true">
        {shag.check === true ? '✓' : no}
      </span>
      <div className="z2r-step__body">
        <p className="z2r-step__label">{shag.label}</p>
        <Paras paras={shag.paras} className="z2r-step__p" />
        {shag.lines === undefined ? null : (
          <div className="z2r-step__lines">
            {shag.lines.flatMap(razbit).map((line) => (
              <Display tex={line} key={line} />
            ))}
          </div>
        )}
      </div>
    </li>
  );
}

function Razbor({ tip }: { tip: Tip2 }) {
  /* Номера шагов: проверка идёт без номера, с галочкой. */
  const nomera = tip.shagi.map(
    (_, i) => tip.shagi.slice(0, i + 1).filter((sh) => sh.check !== true).length,
  );
  return (
    <article className="z2r" aria-labelledby={`${tip.id}-razbor-title`}>
      <header className="z2r__head">
        <p className="z2o-eyebrow">
          {TIPY_2.razbor} · {tip.no}
        </p>
        <h3 className="z2r__title" id={`${tip.id}-razbor-title`}>
          {tip.nazvanie}
        </h3>
      </header>
      <div className="z2r__uslovie">
        <p className="z2r__label">{TIPY_2.usloviye}</p>
        <p className="z2r__uslovie-text">
          <Tex text={tip.uslovie} />
        </p>
      </div>
      <div className="z2r__grid">
        <figure className="z2r__fig">
          <Risunok config={tip.risunok} />
        </figure>
        <div className="z2r__reshenie">
          <p className="z2r__label">{TIPY_2.reshenie}</p>
          <ol className="z2r__steps">
            {tip.shagi.map((shag, i) => (
              <Shag shag={shag} no={nomera[i] ?? 0} key={shag.label} />
            ))}
          </ol>
          <p className="z2r__otvet">
            <span>{TIPY_2.otvet}:</span> <Tex text={tip.otvet} />
          </p>
        </div>
      </div>
      <div className="z2r__foot">
        <a className="z2-btn z2-btn--primary" href={`${BASE}/${OPORNYE.tail}${tip.opornye}/`}>
          {TIPY_2.opornye}
          <Strelka />
        </a>
        <a className="z2-btn z2-btn--secondary" href={`${BASE}/trenazher/?tip=${tip.trenazher}`}>
          {TIPY_2.trenazher}
        </a>
      </div>
    </article>
  );
}

function Tipy() {
  const gruppy: TipGruppa[] = TIPY_2.gruppy.map((g) => ({
    id: g.id,
    head: (
      <header className="z2t-gruppa__head" data-reveal="">
        <span className="z2t-gruppa__code" aria-hidden="true">
          {g.id === 'baza' ? '0' : g.id}
        </span>
        <h3 className="z2t-gruppa__title" id={`z2t-${g.id}`}>
          {g.title}
        </h3>
        <p className="z2t-gruppa__lead">{g.lead}</p>
      </header>
    ),
    items: g.tipy.map((tip) => ({
      id: tip.id,
      label: tip.nazvanie,
      wide: tip.wide === true,
      card: <Kartochka tip={tip} />,
      panel: <Razbor tip={tip} />,
    })),
  }));

  return (
    <section className="z2o-tipy" aria-labelledby={TIPY_ID}>
      <header className="z2o-head" data-reveal="">
        <h2 className="z2o-h2" id={TIPY_ID}>
          {TIPY_2.title}
        </h2>
        <p className="z2o-lead">{TIPY_2.lead}</p>
      </header>
      <TipyRaskrytie
        gruppy={gruppy}
        headingId={TIPY_ID}
        words={{ open: TIPY_2.otkryt, close: TIPY_2.zakryt, back: TIPY_2.nazad }}
      />
    </section>
  );
}

/* ── Типичные ошибки ────────────────────────────────────────────── */

function Oshibki() {
  return (
    <section className="z2o-oshibki" aria-labelledby="z2o-oshibki-title">
      <header className="z2o-head" data-reveal="">
        <h2 className="z2o-h2" id="z2o-oshibki-title">
          {OSHIBKI_2.title}
        </h2>
        <p className="z2o-lead">{OSHIBKI_2.lead}</p>
      </header>
      <ol className="z2o-oshibki__list">
        {OSHIBKI_2.spisok.map((o, i) => (
          <li
            className="z2o-oshibka"
            key={o.id}
            data-reveal=""
            style={{ '--i': i } as CSSProperties}
          >
            <h3 className="z2o-oshibka__title">{o.title}</h3>
            <p className="z2o-oshibka__text">
              <Tex text={o.text} />
            </p>
            <div className="z2o-oshibka__primer">
              <p className="z2o-oshibka__context">
                <Tex text={o.primer} />
              </p>
              <dl className="z2o-sravn">
                <div className="z2o-sravn__row z2o-sravn__row--ne">
                  <dt>{OSHIBKI_2.neverno}</dt>
                  <dd>
                    <Display tex={o.neverno} />
                  </dd>
                </div>
                <div className="z2o-sravn__row z2o-sravn__row--da">
                  <dt>{OSHIBKI_2.verno}</dt>
                  <dd>
                    <Display tex={o.verno} />
                  </dd>
                </div>
              </dl>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ── Дальше ─────────────────────────────────────────────────────── */

function Dalshe() {
  const dveri = [
    { key: 'teoriya', tone: 'blue', href: `${BASE}/teoriya/`, ...DALSHE_2.teoriya },
    { key: 'trenazher', tone: 'warm', href: `${BASE}/trenazher/`, ...DALSHE_2.trenazher },
  ] as const;
  return (
    <section className="z2o-dalshe" aria-labelledby="z2o-dalshe-title">
      <h2 className="z2o-h2 z2o-dalshe__title" id="z2o-dalshe-title">
        {DALSHE_2.title}
      </h2>
      <div className="z2o-dalshe__grid">
        {dveri.map((d) => (
          <a className={`z2o-dver z2o-dver--${d.tone}`} href={d.href} key={d.key} data-reveal="">
            <span className="z2o-dver__title">{d.title}</span>
            <span className="z2o-dver__text">{d.text}</span>
            <span className="z2o-dver__action">
              {d.action}
              <Strelka />
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}

/**
 * Вкладка «О задании» задания №2.
 *
 * Паспорт задания, «Что нужно уметь» с рисунком движка, восемь типов
 * задач с разбором по клику, типичные ошибки с примерами и переходы в
 * теорию и тренажёр. Тексты и данные — content/oZadanii2.ts, рисунки —
 * движок lib/vektory, формулы набирает KaTeX на сборке.
 */
export function OZadanii2() {
  return (
    <div className="z2o">
      <span className="z2o-aury" aria-hidden="true" />
      <Poyavlenie root=".z2o" />
      <Pasport />
      <Umet />
      <Tipy />
      <Oshibki />
      <Dalshe />
    </div>
  );
}
