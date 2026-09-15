import Image from 'next/image';
import { Chart } from '@/components/graph/Chart';
import { graphNotFunction } from '@/content/theoryLinear';
import { katex } from '@/lib/graph/katex';
import { lineKindScene, verticalTestScene } from '@/lib/scenes';
import { Phrases } from './Phrases';
import { CheckIcon, CrossIcon, PinIcon, WarnIcon } from './VerdictIcons';

/** Формула набором KaTeX: разметка собирается на сборке. */
function formula(tex: string) {
  return {
    __html: katex.renderToString(tex, { throwOnError: false, displayMode: false }),
  };
}

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
  const { hint, cards, illustration, compare, remember, verticalTest } = graphNotFunction;

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
              {/* Разметка своя, из конфига проекта: KaTeX собирает её
                  на сборке и сам кладёт внутрь MathML для скринридера. */}
              <span className="nofn-card__formula" dangerouslySetInnerHTML={formula(card.formula)} />
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

        <div className="nofn__bottom">
          {/* Фон у файла прозрачный: ни рамки, ни подложки под ним нет.
              Облачко нарисовано внутри картинки. */}
          <Image
            className="nofn__art"
            src={illustration.src}
            alt={illustration.alt}
            width={illustration.width}
            height={illustration.height}
            loading="lazy"
          />

          <section className="nofn-note">
            <h4 className="nofn-note__title">
              <PinIcon />
              {compare.title}
            </h4>
            <ul className="compare">
              {compare.rows.map((row) => (
                <li className={`compare__row compare__row--${row.verdict}`} key={row.formula}>
                  <span className="compare__formula" dangerouslySetInnerHTML={formula(row.formula)} />
                  <span className="compare__arrow" aria-hidden="true">
                    →
                  </span>
                  <span className="compare__verdict">
                    {row.verdict === 'function' ? <CheckIcon /> : <CrossIcon />}
                    {row.label}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="nofn-note nofn-note--warm">
            <h4 className="nofn-note__title">
              <WarnIcon />
              {remember.title}
            </h4>
            <p className="nofn-note__text">
              <Phrases parts={remember.text} />
            </p>
            <p className="nofn-note__text">
              <Phrases parts={remember.why} />
            </p>
          </section>

          <section className="nofn-test">
            <h4 className="nofn-note__title">{verticalTest.title}</h4>
            <div className="nofn-test__body">
              <div className="nofn-test__text">
                <p className="nofn-note__text">{verticalTest.lead}</p>
                <ul className="nofn-test__list">
                  {verticalTest.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <p className="nofn-note__text">
                  <Phrases parts={verticalTest.example} />
                </p>
              </div>
              <Chart className="nofn-test__chart" scene={verticalTestScene()} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
