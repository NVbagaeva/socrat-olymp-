'use client';

import Link from 'next/link';
import { Tex } from '@/components/ui/Tex';
import { REPETITORY_9 } from '@/content/proizvodnaya';
import { defaultSheetParams9, sheetQuery9 } from '@/lib/proizvodnaya/sheet9';

export interface Repetitory9Props {
  /** Адрес раздела: /zadaniya/9. */
  base: string;
  gruppy: readonly { id: string; title: string }[];
  /** Прототипы: код, группа, название (набрано KaTeX), число аналогов. */
  prototypes: readonly { id: string; gruppa: string; titleHtml: string; variants: number }[];
}

/**
 * Вкладка «Для репетиторов» задания №9: методические заметки (как
 * объяснять, типичные ошибки, порядок тренировки, хитрости), таблица
 * прототипов с числом аналогов и ссылка на лист учителя генератора.
 * Адрес листа собирают sheetQuery9 и defaultSheetParams9.
 */
export function Repetitory9({ base, gruppy, prototypes }: Repetitory9Props) {
  const teacherHref = (ids: string[]) =>
    `${base}/pechat/otvety/?${sheetQuery9({ ...defaultSheetParams9(), prototypes: ids })}`;
  const total = prototypes.reduce((sum, p) => sum + p.variants, 0);

  return (
    <section className="z9-rep">
      <header className="z9-rep__head">
        <h2 className="t-h2">{REPETITORY_9.title}</h2>
        <p className="z9-about__text">{REPETITORY_9.lead}</p>
      </header>

      <div className="z9-rep__cards">
        <article className="z9-rep-card">
          <h3 className="z9-rep-card__title">{REPETITORY_9.list.title}</h3>
          <p className="z9-rep-card__lead">{REPETITORY_9.list.lead}</p>
          <div className="z9-rep-card__actions">
            <Link className="btn btn--primary" href={`${base}/generator/`}>
              {REPETITORY_9.list.generator}
            </Link>
            <a className="btn btn--secondary" href={teacherHref([])} target="_blank" rel="noopener">
              {REPETITORY_9.list.uchitel}
            </a>
          </div>
        </article>
      </div>

      <section aria-labelledby="z9-rep-metodika">
        <h3 className="t-h3 z9-rep__sub" id="z9-rep-metodika">
          {REPETITORY_9.metodika.title}
        </h3>
        <ul className="z9-rep__notes">
          {REPETITORY_9.metodika.items.map((item) => (
            <li className="z9-rep-note" key={item.id}>
              <h4 className="z9-rep-note__title">{item.title}</h4>
              <p className="z9-rep-note__text">
                <Tex text={item.text} />
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="z9-rep-oshibki">
        <h3 className="t-h3 z9-rep__sub" id="z9-rep-oshibki">
          {REPETITORY_9.oshibkiTitle}
        </h3>
        <ol className="z9-rep__list">
          {REPETITORY_9.oshibki.map((text) => (
            <li key={text}>
              <Tex text={text} />
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="z9-rep-poryadok">
        <h3 className="t-h3 z9-rep__sub" id="z9-rep-poryadok">
          {REPETITORY_9.poryadokTitle}
        </h3>
        <ol className="z9-rep__list">
          {REPETITORY_9.poryadok.map((text) => (
            <li key={text}>{text}</li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="z9-rep-hitrosti">
        <h3 className="t-h3 z9-rep__sub" id="z9-rep-hitrosti">
          {REPETITORY_9.hitrostiTitle}
        </h3>
        <ul className="z9-rep__notes">
          {REPETITORY_9.hitrosti.map((item) => (
            <li className="z9-rep-note" key={item.id}>
              <h4 className="z9-rep-note__title">{item.title}</h4>
              <p className="z9-rep-note__text">
                <Tex text={item.text} />
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="z9-rep-tablitsa">
        <h3 className="t-h3 z9-rep__sub" id="z9-rep-tablitsa">
          {REPETITORY_9.tablitsaTitle}
        </h3>
        <p className="z9-about__hint">
          {REPETITORY_9.tablitsaLead} Всего аналогов: {total}.
        </p>
        {gruppy.map((gruppa) => (
          <div className="z9-rep-group" key={gruppa.id}>
            <h4 className="z9-group__title">
              <span className="z9-group__code" aria-hidden="true">
                {gruppa.id}
              </span>
              {gruppa.title}
            </h4>
            <div className="z9-tabl">
              <table className="z9-tabl__table z9-rep-table">
                <thead>
                  <tr>
                    <th scope="col">Код</th>
                    <th scope="col">Прототип</th>
                    <th scope="col">Аналогов</th>
                    <th scope="col">
                      <span className="sr-only">Лист</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {prototypes
                    .filter((p) => p.gruppa === gruppa.id)
                    .map((p) => (
                      <tr key={p.id}>
                        <th scope="row">{p.id}</th>
                        <td dangerouslySetInnerHTML={{ __html: p.titleHtml }} />
                        <td className="z9-rep-table__n">{p.variants}</td>
                        <td>
                          <a
                            className="btn btn--ghost btn--sm"
                            href={teacherHref([p.id])}
                            target="_blank"
                            rel="noopener"
                          >
                            Лист учителя
                          </a>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </section>
    </section>
  );
}
