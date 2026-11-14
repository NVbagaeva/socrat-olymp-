'use client';

import { useState } from 'react';
import { PodskazkaVoprosy } from '../trening/PodskazkaVoprosy';
import { TRENAZHER11 } from '@/content/tekstovye11';
import type { Razbor11 } from '@/lib/zadanie11/trening/reshatel';
import type { Tablitsa } from '@/lib/zadanie11/types';
import { voprosy11 } from './shagi11';
import { Tablitsa11 } from './Tablitsa11';

/**
 * Клетки таблиц, которые ученик заполняет сам: в них есть неизвестная
 * (x, y, z). Порядок — по столбцам слева направо, как в подсказках.
 * (Перенесено из прежней карточки задачи №11 без изменений.)
 */
export function pustyeKletki(tables: readonly Tablitsa[]): string[] {
  const out: string[] = [];
  tables.forEach((t, ti) => {
    for (let c = 1; c < t.head.length; c += 1) {
      t.rows.forEach((row, r) => {
        const tex = (row[c] ?? '').replace(/\\(?:dfrac|tfrac|frac|cdot|text|mathrm|times)/g, '');
        if (/[xyz]/.test(tex)) out.push(`${ti}|${r}:${c}`);
      });
    }
  });
  return out;
}

/**
 * Подсказка №11: вопросы с кнопками (общая подсказка-вопросы) и под ними
 * таблица модели. Пройдено k вопросов из n — открыта такая же доля
 * клеток с неизвестной; любую клетку можно открыть нажатием. Как в
 * прежнем тренажёре.
 */
export function Podskazka11({
  razbor,
  otkryto,
  dalshe,
}: {
  razbor: Razbor11;
  /** Сколько вопросов открыто (с единицы). */
  otkryto: number;
  dalshe: () => void;
}) {
  const [mimo, setMimo] = useState<number[]>([]);
  const [otkrytye, setOtkrytye] = useState<string[]>([]);
  const voprosy = voprosy11(razbor);
  const T = TRENAZHER11.ekran;
  const pustye = pustyeKletki(razbor.tables);
  const proydeno = Math.min(otkryto - 1, voprosy.length);
  const poShagam =
    voprosy.length === 0 ? pustye.length : Math.round((pustye.length * proydeno) / voprosy.length);
  const zakryto = new Set(pustye.filter((k, i) => i >= poShagam && !otkrytye.includes(k)));
  return (
    <>
      <PodskazkaVoprosy
        voprosy={voprosy}
        otkryto={otkryto}
        mimo={mimo}
        onVerno={() => {
          setMimo([]);
          dalshe();
        }}
        onMimo={(j) => setMimo([...mimo, j])}
        labels={T.voprosy}
      />
      {razbor.tables.length === 0 ? null : (
        <section className="z11-podskazka-tab" aria-label={T.tablitsa}>
          <p className="stk-podpis">{T.tablitsa}</p>
          {razbor.tables.map((t, ti) => (
            <Tablitsa11
              key={ti}
              table={t}
              skryto={
                new Set(
                  [...zakryto]
                    .filter((k) => k.startsWith(`${ti}|`))
                    .map((k) => k.slice(k.indexOf('|') + 1)),
                )
              }
              onOtkryt={(k) => setOtkrytye([...otkrytye, `${ti}|${k}`])}
            />
          ))}
          {zakryto.size > 0 ? <p className="z11-podskazka-tab__note">{T.tablitsaNote}</p> : null}
        </section>
      )}
    </>
  );
}
