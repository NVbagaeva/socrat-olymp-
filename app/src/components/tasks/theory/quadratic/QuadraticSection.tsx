import type { ReactNode } from 'react';
import { clsx } from 'clsx';
import { Chart } from '@/components/graph/Chart';
import { REMEMBER_TITLE, type TheoryCard, type TheorySection } from '@/content/theoryQuadratic';
import { katex } from '@/lib/graph/katex';
import { quadraticTheoryScene } from '@/lib/scenes';
import { Phrases } from '../Phrases';
import { WarnIcon } from '../VerdictIcons';
import { ForwardIcon } from './ForwardIcon';
import { ParabolaPlaygroundLazy } from './ParabolaPlaygroundLazy';
import { phrases } from './markup';

/** Формула набором KaTeX: разметка собирается на сборке. */
function formula(tex: string, display = false) {
  return {
    __html: katex.renderToString(tex, { throwOnError: false, displayMode: display }),
  };
}

/** Чертёж по ключу сцены: у каждой подтемы свой набор сцен. */
type SceneFor = (id: string) => unknown;

/**
 * Готовый рисунок по ключу — для разделов, где чертёж рисует не
 * движок графиков, а другой (векторы задания №2). Задан — вместо
 * Chart ставится то, что он вернул.
 */
type FigureFor = (id: string) => ReactNode;

function Card({
  card,
  sceneFor,
  figureFor,
}: {
  card: TheoryCard<string>;
  sceneFor: SceneFor;
  figureFor?: FigureFor;
}) {
  return (
    <li
      className={clsx(
        'qth-card',
        (card.scene !== undefined || card.illustration !== undefined) && 'qth-card--chart',
        card.forward === true && 'qth-card--forward',
      )}
    >
      <h4 className="qth-card__title">
        {card.forward === true ? <ForwardIcon /> : null}
        <Phrases parts={phrases(card.title)} />
      </h4>

      <div className="qth-card__text">
        {card.formula !== undefined ? (
          <div className="qth-card__formula">
            {/* Разметка своя, из конфига проекта: KaTeX собирает её на
                сборке и сам кладёт внутрь MathML для скринридера. */}
            <span dangerouslySetInnerHTML={formula(card.formula, true)} />
            {card.formulaNotes !== undefined ? (
              <ul className="qth-card__notes">
                {card.formulaNotes.map((item) => (
                  <li key={item}>
                    <Phrases parts={phrases(item)} />
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {card.text.map((paragraph) => (
          <p className="qth-card__p" key={paragraph}>
            <Phrases parts={phrases(paragraph)} />
          </p>
        ))}

        {card.lines !== undefined ? (
          <div className="qth-card__lines">
            {card.lines.map((line) => (
              <span className="qth-card__line" key={line} dangerouslySetInnerHTML={formula(line)} />
            ))}
          </div>
        ) : null}

        {card.table !== undefined ? (
          <table className="qth-card__table">
            <thead>
              <tr>
                {card.table.head.map((cell, index) => (
                  <th key={index} scope="col">
                    <Phrases parts={phrases(cell)} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {card.table.rows.map((row) => (
                <tr key={row[0]}>
                  {row.map((cell, index) => (
                    <td key={index}>
                      <Phrases parts={phrases(cell)} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>

      {card.scene !== undefined ? (
        figureFor !== undefined ? (
          figureFor(card.scene)
        ) : (
          <Chart className="qth-card__chart" scene={sceneFor(card.scene)} />
        )
      ) : null}

      {card.illustration !== undefined ? (
        <figure className="qth-card__chart qth-illustration">
          {card.illustration.src === undefined ? (
            <span className="qth-illustration__empty" aria-hidden="true">
              Здесь будет иллюстрация
            </span>
          ) : (
            /* Картинку автор кладёт в public; размеры задаёт CSS. */
            <img
              className="qth-illustration__img"
              src={card.illustration.src}
              alt={card.illustration.alt ?? ''}
              width={card.illustration.width}
              height={card.illustration.height}
              loading="lazy"
              decoding="async"
            />
          )}
          <figcaption className="qth-illustration__caption">{card.illustration.caption}</figcaption>
        </figure>
      ) : null}
    </li>
  );
}

/**
 * Раздел теории квадратичной функции: лид, карточки, плашка «Запомни».
 *
 * Разметка одна на все семь разделов: они различаются только данными
 * из content/theoryQuadratic.ts. Чертежи собирает движок graph/ по
 * описанию сцены из lib/scenes.ts — своего SVG здесь нет, как и во
 * всём проекте. Плашка «Запомни» — та же тёплая плашка, что у
 * линейной подтемы.
 */
export function QuadraticSection({
  section,
  sceneFor = quadraticTheoryScene as SceneFor,
  figureFor,
}: {
  section: TheorySection<string>;
  /** Чертежи подтемы. Не задано — сцены квадратичной функции. */
  sceneFor?: SceneFor;
  /** Готовые рисунки по ключу вместо чертежей движка графиков. */
  figureFor?: FigureFor;
}) {
  return (
    <div className="qth">
      <p className="qth__lead">
        <Phrases parts={phrases(section.lead)} />
      </p>

      <ul className="qth__cards">
        {section.cards.map((card) => (
          <Card card={card} sceneFor={sceneFor} figureFor={figureFor} key={card.id} />
        ))}
      </ul>

      {section.playground === true ? <ParabolaPlaygroundLazy /> : null}

      <section className="nofn-note nofn-note--warm qth__note">
        <h4 className="nofn-note__title">
          <WarnIcon />
          {REMEMBER_TITLE}
        </h4>
        {section.remember.map((paragraph) => (
          <p className="nofn-note__text qth__note-text" key={paragraph}>
            <Phrases parts={phrases(paragraph)} />
          </p>
        ))}
      </section>
    </div>
  );
}
