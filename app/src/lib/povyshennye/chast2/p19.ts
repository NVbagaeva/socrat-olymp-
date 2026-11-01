/**
 * №19 (варианты 27–28): система { x² + y² ≤ R²; (x − ua)² + (y − wa)² ≤ m²a² },
 * u² + w² = d², 0 < m < d.
 *
 * Первое — круг радиуса R с центром O. Второе при a = 0 — точка O (одно
 * решение), при a ≠ 0 — круг радиуса m|a| с центром на расстоянии d|a| от O.
 * Два круга с общей точкой имеют одну общую точку только при внешнем
 * касании: d|a| = R + m|a|, |a| = R/(d − m). Ответ: a ∈ {−R/(d − m); 0; R/(d − m)}.
 */

import { rat, ratTex, toNumber } from '@/lib/zadanie15/core/rational';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PP19 {
  R: number;
  u: number;
  w: number;
  m: number;
}

export function chislaP19(p: PP19) {
  const d = Math.round(Math.sqrt(p.u * p.u + p.w * p.w));
  if (d * d !== p.u * p.u + p.w * p.w || !(p.m > 0 && p.m < d)) throw new Error('p19: параметры');
  const a = rat(p.R, d - p.m);
  return { d, a };
}

/** «(x − 3a)²», «(y + 4a)²». */
function skobka(v: string, k: number): string {
  if (k === 0) return `${v}^2`;
  const m = Math.abs(k) === 1 ? '' : Math.abs(k);
  return `(${v}${k > 0 ? '-' : '+'}${m}a)^2`;
}

function sobrat(p: PP19): Chast2Zadacha {
  const ch = chislaP19(p);
  const aT = ratTex(ch.a);
  const sistema = `\\begin{cases}x^2+y^2\\le ${p.R * p.R},\\\\ ${skobka('x', p.u)}+${skobka('y', p.w)}\\le ${p.m === 1 ? '' : p.m * p.m}a^2\\end{cases}`;
  const korni = [`-${aT}`, '0', aT];
  const pole = (s: string) => s.replace(/\\dfrac/g, '\\frac');
  const otv = `-${aT};\\ 0;\\ ${aT}`;
  return {
    no: 19,
    shablon: 'p19.dvaKruga',
    uslovie: `Найдите все значения $a$, при каждом из которых система неравенств\n$${sistema}$\nимеет единственное решение.`,
    risunok: null,
    punkty: [
      { bukva: null, podpis: 'Значения $a$', pole: { vid: 'korni', verno: korni.map(pole) } },
    ],
    otvet: `$${otv}$`,
    reshenie: [
      {
        title: 'Что задают неравенства',
        lines: [
          `Первое неравенство — круг $\\omega_1$ радиуса $${p.R}$ с центром $O(0;\\ 0)$.`,
          `При $a=0$ второе неравенство: $x^2+y^2\\le0$, то есть единственная точка $(0;\\ 0)$, и она лежит в круге $\\omega_1$. Система имеет единственное решение — $a=0$ подходит.`,
          `При $a\\ne0$ второе неравенство — круг $\\omega_2$ радиуса $${p.m === 1 ? '' : p.m}|a|$ с центром $Q(${p.u}a;\\ ${p.w}a)$, $OQ=\\sqrt{${p.u * p.u}a^2+${p.w * p.w}a^2}=${ch.d}|a|$.`,
        ],
      },
      {
        title: 'Единственная общая точка двух кругов',
        lines: [
          `Если круги имеют общую внутреннюю точку, общих точек бесконечно много. Если $\\omega_2$ лежит внутри $\\omega_1$ и касается её изнутри — тоже бесконечно много (весь $\\omega_2$). Единственная общая точка бывает только при внешнем касании: $OQ=${p.R}+${p.m === 1 ? '' : p.m}|a|$.`,
          `$${ch.d}|a|=${p.R}+${p.m === 1 ? '' : p.m}|a|$, $|a|=\\dfrac{${p.R}}{${ch.d - p.m}}=${aT}$.`,
        ],
      },
      { title: 'Ответ', lines: [`Ответ: $${otv}$.`] },
    ],
    razbor: [
      { slovo: 'При $a=0$ второй круг — точка', formula: 'x=y=0' },
      { slovo: 'Расстояние между центрами', formula: `OQ=${ch.d}|a|` },
      { slovo: 'Внешнее касание', formula: `${ch.d}|a|=${p.R}+${p.m === 1 ? '' : p.m}|a|` },
      { slovo: 'Ответ', formula: otv },
    ],
    kontrol: { a: toNumber(ch.a), d: ch.d },
  };
}

export const P19_DVA_KRUGA: Shablon2<PP19> = {
  no: 19,
  prototip:
    'Параметр: два круга (второй вырождается в точку при a = 0), единственное решение — внешнее касание или точка',
  sobrat,
};
