import { Chart } from '@/components/graph/Chart';
import { graphNotFunction } from '@/content/theoryLinear';
import { katex } from '@/lib/graph/katex';
import { lineKindScene } from '@/lib/scenes';
import { Phrases } from './Phrases';
import { CheckIcon, CrossIcon } from './VerdictIcons';

/**
 * Раздел «Когда график не функция».
 *
 * Заголовок с бейджем рисует общая разметка блока теории, поэтому
 * раздел начинается сразу с плашки: она стоит в строке заголовка,
 * у правого края, и попадает туда сеткой самого блока.
 *
 * Чертежи собирает движок graph/ по описанию сцены из lib/scenes.ts —
 * своего SVG здесь нет, как и во всём проекте.
 */
export function GraphNotFunction() {
  const { hint, cards } = graphNotFunction;

  return (
    <div className="nofn">
      <p className="nofn__hint">{hint}</p>

      <div className="nofn__rest">
        <ul className="nofn__cards">
          {cards.map((card) => (
            <li className={`nofn-card nofn-card--${card.verdict}`} key={card.id}>
              <span className="nofn-card__no" aria-hidden="true">
                {card.no}
              </span>
              <span
                className="nofn-card__formula"
                /* Разметка своя, из конфига проекта: KaTeX собирает её
                   на сборке и сам кладёт внутрь MathML для скринридера. */
                dangerouslySetInnerHTML={{
                  __html: katex.renderToString(card.formula, {
                    throwOnError: false,
                    displayMode: false,
                  }),
                }}
              />
              <span className="nofn-card__caption">{card.caption}</span>

              <Chart className="nofn-card__chart" scene={lineKindScene(card.id)} />

              <span className="verdict">
                {card.verdict === 'function' ? <CheckIcon /> : <CrossIcon />}
                {card.verdictLabel}
              </span>

              <p className="nofn-card__explain">
                <Phrases parts={card.explain} />
              </p>
              <p className="nofn-card__note">
                <Phrases parts={card.note} />
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
