/**
 * №19 (варианты 5–6): x² − s|x| + t = a имеет ровно N решений (N = 3 или 4).
 *
 * График y = x² − s|x| + t: локальный максимум t в нуле, минимумы
 * t − s²/4 при x = ±s/2. Ровно 3 решения при a = t, ровно 4 — при
 * t − s²/4 < a < t.
 */

import { mnozhKontrol, mnozhPole, mnozhTex } from './kMnozh';
import { mnozhPoChislu } from './uObshchee';
import { rat, ratTex, sub, toNumber } from '@/lib/zadanie15/core/rational';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PW19 {
  s: number;
  t: number;
  N: 3 | 4;
}

export function chisloW19(p: PW19, a: number): number {
  const set = new Set<number>();
  /* x ≥ 0: x² − s x + t − a = 0. */
  const D = p.s * p.s - 4 * (p.t - a);
  if (D >= -1e-12) {
    const r = Math.sqrt(Math.max(0, D));
    for (const x of [(p.s - r) / 2, (p.s + r) / 2]) {
      if (x >= -1e-12) {
        set.add(Math.round(x * 1e9) / 1e9);
        set.add(Math.round(-x * 1e9) / 1e9 + 0);
      }
    }
  }
  return new Set([...set].map((x) => (Object.is(x, -0) ? 0 : x))).size;
}

export function chislaW19(p: PW19) {
  if (!(p.s > 0 && p.s % 2 === 0)) throw new Error('w19: s чётное');
  const min = sub(rat(p.t), rat(p.s * p.s, 4));
  const krit = [
    { v: toNumber(min), tex: ratTex(min) },
    { v: p.t, tex: String(p.t) },
  ];
  return { min, kuski: mnozhPoChislu(krit, (a) => chisloW19(p, a), p.N) };
}

function sobrat(p: PW19): Chast2Zadacha {
  const ch = chislaW19(p);
  const otv = mnozhTex(ch.kuski);
  const f = `x^2-${p.s}|x|${p.t >= 0 ? '+' : ''}${p.t}`;
  return {
    no: 19,
    shablon: 'w19.vGrafik',
    uslovie: `Найдите все значения $a$, при каждом из которых уравнение $${f}=a$ имеет ровно ${p.N === 3 ? 'три' : 'четыре'} различных решения.`,
    risunok: null,
    punkty: [
      {
        bukva: null,
        podpis: 'Множество значений $a$',
        pole: { vid: 'promezhutki', verno: mnozhPole(ch.kuski) },
      },
    ],
    otvet: `$a\\in${otv}$`,
    reshenie: [
      {
        title: 'График левой части',
        lines: [
          `Функция $f(x)=${f}$ чётная. При $x\\ge0$ это парабола $x^2-${p.s}x+${p.t}$ с вершиной $(${p.s / 2};\\ ${ratTex(ch.min)})$; при $x<0$ — её отражение. График состоит из двух дуг парабол, симметричных относительно оси ординат: значение $f(0)=${p.t}$ — локальный максимум, наименьшее значение $${ratTex(ch.min)}$ при $x=\\pm${p.s / 2}$.`,
        ],
      },
      {
        title: 'Горизонтальная прямая $y=a$',
        lines: [
          `При $a<${ratTex(ch.min)}$ решений нет, при $a=${ratTex(ch.min)}$ — два, при $${ratTex(ch.min)}<a<${p.t}$ — четыре, при $a=${p.t}$ — три (в том числе $x=0$), при $a>${p.t}$ — два.`,
          `Ответ: $a\\in${otv}$.`,
        ],
      },
      { title: 'Ответ', lines: [`Ответ: $a\\in${otv}$.`] },
    ],
    razbor: [
      {
        slovo: 'Чётная функция, две симметричные дуги парабол',
        formula: `f(0)=${p.t},\\ f_{\\min}=${ratTex(ch.min)}`,
      },
      { slovo: 'Минимум и локальный максимум', formula: `x=\\pm${p.s / 2},\\ x=0` },
      { slovo: 'Пересечения с прямой $y=a$', formula: otv },
    ],
    kontrol: { kuski: mnozhKontrol(ch.kuski) },
  };
}

export const W19_V_GRAFIK: Shablon2<PW19> = {
  no: 19,
  prototip: 'Уравнение x² − s|x| + t = a: число решений по графику из двух дуг парабол',
  sobrat,
};
