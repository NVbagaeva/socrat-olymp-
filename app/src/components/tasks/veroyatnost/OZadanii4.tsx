import { O_ZADANII_4 } from '@/content/veroyatnost-metody';
import { typeset } from '@/lib/tex';
import { METODY } from '@/lib/veroyatnost/model';
import { metodAnchor } from './KlyuchevyeMetody';

export interface OZadanii4Props {
  /** Адрес раздела без хвоста: /zadaniya/4. */
  base: string;
}

/**
 * Вкладка «О задании» задания №4 — раздел 01 референса.
 *
 * Пять шагов решения и пять плиток методов, каждая ведёт к своей
 * карточке во вкладке «Ключевые методы решения». Текст — из
 * референса, формулы набраны KaTeX на сборке.
 */
export function OZadanii4({ base }: OZadanii4Props) {
  return (
    <div className="z4-about">
      <section className="z4-about__lead">
        <h2 className="t-h2 z4-about__title">{O_ZADANII_4.title}</h2>
        <p className="z4-about__text">{O_ZADANII_4.lead}</p>
      </section>

      <ol className="z4-pipeline" aria-label="Порядок решения">
        {O_ZADANII_4.shagi.map((shag, i) => (
          <li key={shag.title} className="z4-pipeline__step">
            <span className="z4-pipeline__no" aria-hidden="true">
              {i + 1}
            </span>
            <span className="z4-pipeline__title">{shag.title}</span>
            <span className="z4-pipeline__lead">{shag.lead}</span>
          </li>
        ))}
      </ol>

      <section className="z4-about__metody">
        <h3 className="t-h4 z4-about__sub">{O_ZADANII_4.metodyTitle}</h3>
        <p className="z4-about__text">{O_ZADANII_4.metodyLead}</p>
        <ul className="z4-metody-grid">
          {METODY.map((m) => (
            <li key={m.id}>
              <a className="z4-metod-tile" href={`${base}/metody/#${metodAnchor(m.id)}`}>
                <span className="z4-metod-tile__no">Метод {m.nomer}</span>
                <span className="z4-metod-tile__title">{m.nazvanie}</span>
                <span
                  className="z4-metod-tile__formula"
                  dangerouslySetInnerHTML={{ __html: typeset(O_ZADANII_4.korotko[m.id]) }}
                />
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
