/**
 * №16 (варианты 5–6): log_q |x − a| ≤ k (или ≥ k).
 *
 * Область x ≠ a. ≤ k: 0 < |x − a| ≤ q^k — два промежутка без точки a.
 * ≥ k: |x − a| ≥ q^k — два луча.
 */

import { mnozhKontrol, mnozhPole, mnozhTex, type Kus } from './kMnozh';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PW16 {
  q: number;
  k: number;
  a: number;
  znak: 'le' | 'ge';
}

export function chislaW16(p: PW16) {
  if (!(p.q > 1 && p.k >= 1)) throw new Error('w16: данные');
  const t = p.q ** p.k;
  const L = { tex: String(p.a - t), v: p.a - t };
  const R = { tex: String(p.a + t), v: p.a + t };
  const A = { tex: String(p.a), v: p.a };
  const kuski: Kus[] =
    p.znak === 'le'
      ? [
          { lo: L, hi: A, loZ: true, hiZ: false },
          { lo: A, hi: R, loZ: false, hiZ: true },
        ]
      : [
          { lo: null, hi: L, loZ: false, hiZ: true },
          { lo: R, hi: null, loZ: true, hiZ: false },
        ];
  return { t, kuski };
}

function sobrat(p: PW16): Chast2Zadacha {
  const ch = chislaW16(p);
  const zn = p.znak === 'le' ? '\\le' : '\\ge';
  const m = p.a === 0 ? '|x|' : `|x${p.a > 0 ? '-' : '+'}${Math.abs(p.a)}|`;
  const otv = mnozhTex(ch.kuski);
  return {
    no: 16,
    shablon: 'w16.logModul',
    uslovie: `Решите неравенство $\\log_{${p.q}}${m}${zn}${p.k}$.`,
    risunok: null,
    punkty: [
      {
        bukva: null,
        podpis: 'Множество решений',
        pole: { vid: 'promezhutki', verno: mnozhPole(ch.kuski) },
      },
    ],
    otvet: `$${otv}$`,
    reshenie: [
      { title: 'Область', lines: [`Логарифм определён при $${m}>0$, то есть $x\\ne${p.a}$.`] },
      {
        title: 'Переход к модулю',
        lines: [
          `$${p.k}=\\log_{${p.q}}${ch.t}$, основание больше $1$, функция возрастает: $${m}${zn}${ch.t}$.`,
          p.znak === 'le'
            ? `$-${ch.t}\\le x-${p.a}\\le${ch.t}$, $x\\ne${p.a}$: $${otv}$.`
            : `$x-${p.a}\\le-${ch.t}$ или $x-${p.a}\\ge${ch.t}$: $${otv}$.`,
        ],
      },
      { title: 'Ответ', lines: [`Ответ: $${otv}$.`] },
    ],
    razbor: [
      { slovo: 'Область: модуль положителен', formula: `x\\ne${p.a}` },
      { slovo: 'Логарифм возрастает', formula: `${m}${zn}${ch.t}` },
      { slovo: 'Ответ', formula: otv },
    ],
    kontrol: { kuski: mnozhKontrol(ch.kuski) },
  };
}

export const W16_LOG_MODUL: Shablon2<PW16> = {
  no: 16,
  prototip: 'Логарифм модуля: область без точки, два промежутка или два луча',
  sobrat,
};
