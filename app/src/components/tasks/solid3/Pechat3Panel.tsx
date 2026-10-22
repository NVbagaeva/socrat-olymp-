'use client';

import { useState } from 'react';
import { SHEET_3 } from '@/content/sheet3';
import { ZADACH_MAX, ZADACH_MIN, adresLista } from '@/lib/zadanie3/pechat';

/** Новый seed набора: по кнопке, а не при отрисовке (разметка сервера совпадает). */
function novyySeed(): number {
  return (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0 || 1;
}

export interface RazdelPechati {
  /** Адрес листа ученика раздела, со слешем на конце. */
  base: string;
  nazvanie: string;
}

/**
 * Лист для печати: раздел, число задач и набор. Обе ссылки ведут на
 * один и тот же набор (seed в адресе) — лист ученика и лист учителя
 * всегда про одни и те же задачи.
 */
export function Pechat3Panel({ razdely }: { razdely: readonly RazdelPechati[] }) {
  const [n, setN] = useState(6);
  const [seed, setSeed] = useState(1);
  const [vybor, setVybor] = useState(0);
  const q = adresLista({ n, seed, theme: 'color' });
  const g = SHEET_3.generator;
  const base = razdely[vybor]?.base ?? razdely[0]?.base ?? '';
  return (
    <section className="z3t-print" aria-labelledby="z3t-print-h">
      <h2 id="z3t-print-h" className="z3t-print__title">
        {g.title}
      </h2>
      <p className="z3t-print__lead">{g.lead}</p>
      <div className="z3t-print__row">
        <label className="z3t-print__field">
          {g.razdel}
          <select value={vybor} onChange={(e) => setVybor(Number(e.target.value))}>
            {razdely.map((r, i) => (
              <option key={r.base} value={i}>
                {r.nazvanie}
              </option>
            ))}
          </select>
        </label>
        <label className="z3t-print__field">
          {g.skolko}
          <select value={n} onChange={(e) => setN(Number(e.target.value))}>
            {Array.from({ length: ZADACH_MAX - ZADACH_MIN + 1 }, (_, i) => i + ZADACH_MIN).map(
              (k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ),
            )}
          </select>
        </label>
        <button type="button" className="btn btn--ghost" onClick={() => setSeed(novyySeed())}>
          {g.novyy}
        </button>
        <a className="btn btn--primary" href={`${base}?${q}`} target="_blank" rel="noopener">
          {g.uchenik}
        </a>
        <a className="btn btn--ghost" href={`${base}otvety/?${q}`} target="_blank" rel="noopener">
          {g.uchitel}
        </a>
      </div>
    </section>
  );
}
