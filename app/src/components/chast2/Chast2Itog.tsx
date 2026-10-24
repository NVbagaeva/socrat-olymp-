'use client';

import { clsx } from 'clsx';
import { Fragment, useState } from 'react';
import { Tex } from '@/components/ui/Tex';
import { MAX_BALL, MAX_PART1, MAX_PART2 } from '@/content/variantOnline/bally';
import { CHAST2_TEXT as T } from '@/content/variantOnline/chast2Text';
import { proverit, type Itog } from '@/lib/chast2/sravnenie';
import {
  ballyChast2,
  itogZadaniya,
  punktKey,
  vvodEst,
  vvodTex,
  type Chast2Ui,
} from '@/lib/chast2/sostoyanie';
import type { Chast2Zadacha } from '@/lib/povyshennye/chast2/types';
import { testScore } from '@/lib/variant/online/proverka';
import { Chast2Card } from './Chast2Card';

export interface Chast2ItogProps {
  part2: readonly Chast2Zadacha[];
  st: Chast2Ui;
  update: (fn: (s: Chast2Ui) => Chast2Ui) => void;
  /** Первичный балл части 1 и все ли 1–13 в варианте (для тестового балла). */
  part1: number;
  fullPart1: boolean;
}

/** Сверка ответов задания после завершения: по каждому пункту с полем. */
export function sverkaZadaniya(z: Chast2Zadacha, st: Chast2Ui): Itog | null {
  const itogi: Itog[] = [];
  /* Ни одного ответа — сверять нечего: «—», а не «не совпадает». */
  if (!z.punkty.some((p, i) => p.pole !== null && vvodEst(st.vvod[punktKey(z.no, i)] ?? null)))
    return null;
  z.punkty.forEach((p, i) => {
    if (p.pole === null) return;
    const v = st.vvod[punktKey(z.no, i)] ?? null;
    itogi.push(vvodEst(v) ? proverit(p.pole, v) : 'ne-sovpadaet');
  });
  return itogZadaniya(itogi);
}

/**
 * Часть 2 на экране результатов (самопроверка): счётчик баллов, таблица
 * «№ — ответ — сверка — балл» и у каждого задания — решение и критерии,
 * где ученик выбирает свой балл.
 */
export function Chast2Itog({ part2, st, update, part1, fullPart1 }: Chast2ItogProps) {
  const [open, setOpen] = useState<number | null>(null);
  const b = ballyChast2(
    part2.map((z) => z.no),
    st.ball,
  );
  const total = part1 + b.summa;
  return (
    <section className="c2-itog" aria-label={T.result.title} data-testid="c2-itog">
      <h3 className="vo-h3">{T.result.title}</h3>
      <p className="vo-note">{T.result.lead}</p>
      <p className="c2-counter" aria-live="polite" data-testid="c2-counter">
        {fullPart1 && b.max === MAX_PART2
          ? T.result.counter(part1, b.summa, total, testScore(total))
          : `Часть 1: ${part1} / ${MAX_PART1} · Часть 2: ${b.summa} / ${b.max}`}
      </p>
      <p className="c2-hint">
        {T.result.approx} {T.result.unscored(b.vsego - b.oceneno)}
      </p>
      <div className="vo-table-wrap">
        <table className="vo-table c2-table">
          <thead>
            <tr>
              {T.result.head.map((h, i) => (
                <th key={i} scope="col">
                  {h === '' ? <span className="sr-only">{T.result.open}</span> : h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {part2.map((z) => {
              const sv = sverkaZadaniya(z, st);
              const otvety = z.punkty
                .map((p, i) =>
                  p.pole === null
                    ? null
                    : {
                        b: p.bukva,
                        tex: vvodTex(p.pole, st.vvod[punktKey(z.no, i)] ?? null),
                      },
                )
                .filter((x) => x !== null);
              const ball = st.ball[z.no];
              return (
                <Fragment key={z.no}>
                  <tr data-testid={`c2-row-${z.no}`}>
                    <th scope="row">{z.no}</th>
                    <td className="c2-table__otvet">
                      {otvety.length === 0
                        ? '—'
                        : otvety.map((o, i) => (
                            <span key={i} className="c2-table__punkt">
                              {o.b === null ? '' : `${o.b}) `}
                              {o.tex === '' ? (
                                <span className="vo-mini">{T.result.noAnswer}</span>
                              ) : (
                                <Tex text={`$${o.tex}$`} />
                              )}
                            </span>
                          ))}
                    </td>
                    <td>
                      {sv === null ? (
                        '—'
                      ) : (
                        <span className={clsx('c2-sverka', `is-${sv}`)}>
                          {sv === 'uchitel' ? T.sverka.uchitelSamo : T.sverka[sv]}
                        </span>
                      )}
                    </td>
                    <td data-testid={`c2-ball-${z.no}`}>
                      {ball === undefined ? T.result.notScored : `${ball} / ${MAX_BALL[z.no]}`}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="vo-link"
                        aria-expanded={open === z.no}
                        data-testid={`c2-open-${z.no}`}
                        onClick={() => setOpen(open === z.no ? null : z.no)}
                      >
                        {open === z.no ? T.result.hide : T.result.open}
                      </button>
                    </td>
                  </tr>
                  {open === z.no ? (
                    <tr className="vo-table__razbor">
                      <td colSpan={5}>
                        <Chast2Card z={z} st={st} update={update} samo readOnly />
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
