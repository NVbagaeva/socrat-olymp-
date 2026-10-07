'use client';

import { useState } from 'react';
import { Option, OptionGroup } from '../configurator';
import {
  sheetLayouts,
  sheetThemes,
  type SheetLayoutId,
  type SheetThemeId,
} from '@/content/generator';
import { REPETITORY_2 } from '@/content/vektory';
import { sheetQuery2 } from '@/lib/vektory/sheet2';

export interface Repetitory2Props {
  /** Адрес раздела: страницы печати лежат под ним. */
  base: string;
  gruppy: readonly { id: string; title: string }[];
  /** Прототипы: код, название (набрано KaTeX), сколько вариантов в банке. */
  prototypes: readonly { id: string; gruppa: string; titleHtml: string; variants: number }[];
}

/**
 * Вкладка «Для репетиторов» задания №2: банк из десяти зафиксированных
 * вариантов на прототип и печатные листы из него.
 *
 * Листы собираются в браузере по seed банка (bank=1 в адресе):
 * ученику — задачи без катетов, репетитору — те же задачи с
 * решениями по шагам, и отдельно ключ ответов. Ни ответов, ни PDF
 * в сборке нет: печать и сохранение в PDF — кнопкой на странице
 * листа.
 */
export function Repetitory2({ base, gruppy, prototypes }: Repetitory2Props) {
  const [theme, setTheme] = useState<SheetThemeId>('print');
  const [layout, setLayout] = useState<SheetLayoutId>('single');

  function href(vid: 'uchenik' | 'uchitel', ids: string[]): string {
    const query = sheetQuery2({
      prototypes: ids,
      count: 0,
      variants: 1,
      seed: '',
      theme,
      layout,
      kind: '',
      date: '',
      bank: true,
    });
    return `${base}/pechat/${vid === 'uchitel' ? 'otvety/' : ''}?${query}`;
  }
  const klyuchHref = `${base}/pechat/klyuch/?t=${theme}`;
  const total = prototypes.reduce((sum, p) => sum + p.variants, 0);

  return (
    <section className="z2-rep">
      <header className="z2-rep__head">
        <h2 className="t-h2 z2-rep__title">{REPETITORY_2.title}</h2>
        <p className="z2-rep__lead">{REPETITORY_2.lead}</p>
      </header>

      <div className="z2-rep__params cfg-params">
        <OptionGroup id="z2-rep-theme" label={REPETITORY_2.tema}>
          {sheetThemes.map((item) => (
            <Option
              key={item.id}
              checked={theme === item.id}
              onSelect={() => setTheme(item.id)}
              title={item.title}
            />
          ))}
        </OptionGroup>
        <OptionGroup id="z2-rep-layout" label={REPETITORY_2.kolonki}>
          {sheetLayouts.map((item) => (
            <Option
              key={item.id}
              checked={layout === item.id}
              onSelect={() => setLayout(item.id)}
              title={item.title}
            />
          ))}
        </OptionGroup>
      </div>

      <div className="z2-rep__cards">
        <article className="z2-rep-card">
          <h3 className="z2-rep-card__title">{REPETITORY_2.vseTitle}</h3>
          <p className="z2-rep-card__lead">{REPETITORY_2.vseLead.replace('190', String(total))}</p>
          <div className="z2-rep-card__actions">
            <a
              className="btn btn--primary"
              href={href('uchenik', ['all'])}
              target="_blank"
              rel="noopener"
            >
              {REPETITORY_2.uchenik}
            </a>
            <a
              className="btn btn--secondary"
              href={href('uchitel', ['all'])}
              target="_blank"
              rel="noopener"
            >
              {REPETITORY_2.uchitel}
            </a>
          </div>
        </article>
        <article className="z2-rep-card">
          <h3 className="z2-rep-card__title">{REPETITORY_2.klyuch}</h3>
          <p className="z2-rep-card__lead">{REPETITORY_2.klyuchLead}</p>
          <div className="z2-rep-card__actions">
            <a className="btn btn--primary" href={klyuchHref} target="_blank" rel="noopener">
              {REPETITORY_2.klyuch}
            </a>
          </div>
          <p className="z2-rep-card__note t-caption">{REPETITORY_2.pechatLead}</p>
        </article>
      </div>

      <h3 className="t-h3 z2-rep__sub">{REPETITORY_2.poPrototipam}</h3>
      <p className="z2-rep__lead">{REPETITORY_2.poPrototipamLead}</p>
      {gruppy.map((gruppa) => (
        <section className="z2-rep-group" key={gruppa.id} aria-labelledby={`z2-rep-${gruppa.id}`}>
          <h4 className="z2-op-group__title" id={`z2-rep-${gruppa.id}`}>
            <span className="z2-group__code" aria-hidden="true">
              {gruppa.id}
            </span>
            {gruppa.title}
          </h4>
          <table className="z2-rep-table">
            <thead>
              <tr>
                <th scope="col">Код</th>
                <th scope="col">Прототип</th>
                <th scope="col">{REPETITORY_2.variantov}</th>
                <th scope="col">
                  <span className="sr-only">Листы</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {prototypes
                .filter((p) => p.gruppa === gruppa.id)
                .map((p) => (
                  <tr key={p.id}>
                    <th scope="row" className="z2-rep-table__code">
                      {p.id}
                    </th>
                    <td dangerouslySetInnerHTML={{ __html: p.titleHtml }} />
                    <td className="z2-rep-table__n">{p.variants}</td>
                    <td className="z2-rep-table__links">
                      <a
                        className="btn btn--secondary btn--sm"
                        href={href('uchenik', [p.id])}
                        target="_blank"
                        rel="noopener"
                      >
                        {REPETITORY_2.uchenik}
                      </a>
                      <a
                        className="btn btn--ghost btn--sm"
                        href={href('uchitel', [p.id])}
                        target="_blank"
                        rel="noopener"
                      >
                        {REPETITORY_2.uchitel}
                      </a>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </section>
      ))}
    </section>
  );
}
