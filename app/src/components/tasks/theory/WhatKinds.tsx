import { Chart } from '@/components/graph/Chart';
import { whatKinds } from '@/content/theoryLinear';
import { katex } from '@/lib/graph/katex';
import { kindScene } from '@/lib/scenes';

/**
 * Раздел «Какие бывают функции».
 *
 * Четыре известных графика: название, формула и чертёж. Чертежи
 * собирает движок graph/ по описанию сцены из lib/scenes.ts —
 * своего SVG здесь нет, как и во всём проекте.
 */
export function WhatKinds() {
  const { lead, cards } = whatKinds;

  return (
    <div className="kinds">
      <p className="kinds__lead">{lead}</p>

      <ul className="kinds__grid">
        {cards.map((card) => (
          <li className="kind" key={card.id}>
            <h4 className="kind__title">{card.title}</h4>
            <span
              className="kind__formula"
              /* Разметка своя, из конфига проекта: KaTeX собирает её
                 на сборке и сам кладёт внутрь MathML для скринридера. */
              dangerouslySetInnerHTML={{
                __html: katex.renderToString(card.formula, {
                  throwOnError: false,
                  displayMode: false,
                }),
              }}
            />
            <Chart className="kind__chart" scene={kindScene(card.id)} />
          </li>
        ))}
      </ul>
    </div>
  );
}
