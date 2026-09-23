import { clsx } from 'clsx';
import { Chart } from '@/components/graph/Chart';
import { REMEMBER_TITLE, type QuadraticCard, type QuadraticSection as Section } from '@/content/theoryQuadratic';
import { katex } from '@/lib/graph/katex';
import { quadraticTheoryScene } from '@/lib/scenes';
import { MathTitle } from '../MathTitle';
import { Phrases } from '../Phrases';
import { WarnIcon } from '../VerdictIcons';
import { ForwardIcon } from './ForwardIcon';
import { ParabolaPlayground } from './ParabolaPlayground';
import { phrases } from '../markup';

/** Формула набором KaTeX: разметка собирается на сборке. */
function formula(tex: string, display = false) {
  return {
    __html: katex.renderToString(tex, { throwOnError: false, displayMode: display }),
  };
}

function Card({ card }: { card: QuadraticCard }) {
  return (
    <li
      className={clsx(
        'qth-card',
        card.scene !== undefined && 'qth-card--chart',
        card.forward === true && 'qth-card--forward',
      )}
    >
      <h4 className="qth-card__title">
        {card.forward === true ? <ForwardIcon /> : null}
        <MathTitle text={card.title} />
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
        <Chart className="qth-card__chart" scene={quadraticTheoryScene(card.scene)} />
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
export function QuadraticSection({ section }: { section: Section }) {
  return (
    <div className="qth">
      <p className="qth__lead">
        <Phrases parts={phrases(section.lead)} />
      </p>

      <ul className="qth__cards">
        {section.cards.map((card) => (
          <Card card={card} key={card.id} />
        ))}
      </ul>

      {section.playground === true ? <ParabolaPlayground /> : null}

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
