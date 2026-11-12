'use client';

import { clsx } from 'clsx';
import { Ikonka } from '../steklo';

/** Шаг подсказки: вопрос и кнопки-ответы, одна верная. Всё — готовый HTML. */
export interface VoprosPodskazki {
  voprosHtml: string;
  variantyHtml: string[];
  verno: number;
  /** Что сказать после верного ответа. */
  kommentariyHtml?: string;
}

export interface PodskazkaVoprosyLabels {
  /** Над первым вопросом: «Подсказка — вопросами». */
  title: string;
  verno: string;
  /** После неверной кнопки. */
  podumayte: string;
  /** Группа кнопок для читалок. */
  varianty: string;
  /** Когда пройдены все вопросы. */
  gotovo: string;
}

/**
 * Подсказка-вопросы: цепочка вопросов с кнопками-ответами. Следующий
 * вопрос открывается после верного ответа на предыдущий; пройденные
 * остаются на экране с верной кнопкой. Готового ответа задачи в
 * подсказке нет — ученик выходит на решение сам.
 *
 * Состояние (сколько вопросов открыто, какие кнопки мимо) держит
 * экран задачи: оно сохраняется в сессии тренировки. Компонент общий:
 * вопросы приходят готовым HTML (формулы набраны KaTeX).
 */
export function PodskazkaVoprosy({
  voprosy,
  otkryto,
  mimo,
  onVerno,
  onMimo,
  labels,
}: {
  voprosy: VoprosPodskazki[];
  /** Сколько вопросов открыто (с единицы). */
  otkryto: number;
  /** Неверные кнопки текущего вопроса. */
  mimo: readonly number[];
  onVerno: () => void;
  onMimo: (variant: number) => void;
  labels: PodskazkaVoprosyLabels;
}) {
  const vidno = voprosy.slice(0, Math.min(otkryto, voprosy.length));
  const vsePoydeno = otkryto > voprosy.length;
  return (
    <div className="trn-voprosy">
      <p className="trn-voprosy__title">
        <Ikonka name="lampa" /> {labels.title}
      </p>
      <ol className="trn-voprosy__spisok">
        {vidno.map((v, i) => {
          /* Текущий вопрос — последний открытый; когда пройдены все, текущего нет. */
          const tekushchiy = i === otkryto - 1 && !vsePoydeno;
          return (
            <li className="trn-vopros" key={i}>
              <p className="trn-vopros__tekst" dangerouslySetInnerHTML={{ __html: v.voprosHtml }} />
              <div className="trn-vopros__knopki" role="group" aria-label={labels.varianty}>
                {v.variantyHtml.map((html, j) => {
                  const verna = j === v.verno;
                  const mimoTut = tekushchiy && mimo.includes(j);
                  return (
                    <button
                      type="button"
                      key={j}
                      className={clsx(
                        'trn-vopros__knopka',
                        !tekushchiy && verna && 'is-verno',
                        mimoTut && 'is-mimo',
                      )}
                      disabled={!tekushchiy || mimoTut}
                      aria-pressed={!tekushchiy && verna}
                      onClick={() => (verna ? onVerno() : onMimo(j))}
                      dangerouslySetInnerHTML={{ __html: html }}
                    />
                  );
                })}
              </div>
              {!tekushchiy ? (
                <p className="trn-vopros__otklik is-verno" role="status">
                  <b>{labels.verno}</b>{' '}
                  {v.kommentariyHtml === undefined ? null : (
                    <span dangerouslySetInnerHTML={{ __html: v.kommentariyHtml }} />
                  )}
                </p>
              ) : mimo.length > 0 ? (
                <p className="trn-vopros__otklik" role="status">
                  {labels.podumayte}
                </p>
              ) : null}
            </li>
          );
        })}
      </ol>
      {vsePoydeno ? <p className="trn-voprosy__gotovo">{labels.gotovo}</p> : null}
    </div>
  );
}
