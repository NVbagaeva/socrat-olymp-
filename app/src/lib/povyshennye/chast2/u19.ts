/**
 * №19 (варианты 1–2): (x² − 2mx + a)·√(x − b) = 0 имеет ровно два различных корня.
 *
 * x = b — корень при любом a. Корни квадратного трёхчлена x = m ± √(m² − a)
 * считаются, только если x ≥ b; совпадение с b — тот же корень.
 * Критические a: a = m² (двойной корень m) и a = 2mb − b² (корень b).
 */

import { mnozhKontrol, mnozhPole, mnozhTex } from './kMnozh';
import { mnozhPoChislu } from './uObshchee';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PU19 {
  m: number;
  b: number;
}

export function chisloKorneyU19(p: PU19, a: number): number {
  const set = new Set<number>([p.b]);
  const D = p.m * p.m - a;
  if (D >= -1e-12) {
    const s = Math.sqrt(Math.max(0, D));
    for (const x of [p.m - s, p.m + s]) if (x >= p.b - 1e-12) set.add(Math.round(x * 1e9) / 1e9);
  }
  return set.size;
}

export function chislaU19(p: PU19) {
  if (!(p.b < p.m)) throw new Error('u19: b < m');
  const a1 = p.m * p.m;
  const a2 = 2 * p.m * p.b - p.b * p.b;
  const krit = [
    { v: a1, tex: String(a1) },
    { v: a2, tex: String(a2) },
  ];
  const kuski = mnozhPoChislu(krit, (a) => chisloKorneyU19(p, a), 2);
  return { a1, a2, kuski };
}

function sobrat(p: PU19): Chast2Zadacha {
  const ch = chislaU19(p);
  const otv = mnozhTex(ch.kuski);
  const tr = `x^2${p.m === 0 ? '' : `-${2 * p.m === 1 ? '' : 2 * p.m}x`}+a`;
  const kor = p.b === 0 ? '\\sqrt{x}' : `\\sqrt{x${p.b > 0 ? '-' : '+'}${Math.abs(p.b)}}`;
  return {
    no: 19,
    shablon: 'u19.trehchlenKoren',
    uslovie: `Найдите все значения $a$, при каждом из которых уравнение $\\left(${tr}\\right)\\cdot${kor}=0$ имеет ровно два различных корня.`,
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
        title: 'Область и корень $x=b$',
        lines: [
          `Уравнение определено при $x\\ge${p.b}$. Корень $x=${p.b}$ есть при любом $a$ (обращается в нуль корень). Остальные корни — корни трёхчлена $f(x)=${tr}$, лежащие правее $${p.b}$: $x=${p.m}\\pm\\sqrt{${p.m * p.m}-a}$ при $a\\le${ch.a1}$.`,
        ],
      },
      {
        title: 'Сколько корней трёхчлена справа от $b$',
        lines: [
          `Вершина параболы $x=${p.m}$ лежит правее $${p.b}$. Поэтому больший корень $${p.m}+\\sqrt{${p.m * p.m}-a}$ всегда не меньше $${p.b}$, а меньший $${p.m}-\\sqrt{${p.m * p.m}-a}$ не меньше $${p.b}$ тогда и только тогда, когда $f(${p.b})\\ge0$, то есть $a\\ge${ch.a2}$.`,
          `При $a=${ch.a2}$ меньший корень совпадает с $${p.b}$ — это тот же корень. При $a=${ch.a1}$ корень трёхчлена один ($x=${p.m}$).`,
        ],
      },
      {
        title: 'Подсчёт',
        lines: [
          `$a<${ch.a2}$: корни $${p.b}$ и больший корень трёхчлена — два. $a=${ch.a2}$: $${p.b}$ и $${2 * p.m - p.b}$ — два. $${ch.a2}<a<${ch.a1}$: три корня. $a=${ch.a1}$: $${p.b}$ и $${p.m}$ — два. $a>${ch.a1}$: один корень $${p.b}$.`,
          `Ответ: $a\\in${otv}$.`,
        ],
      },
    ],
    razbor: [
      { slovo: 'Корень $x=b$ есть всегда', formula: `x=${p.b}` },
      { slovo: 'Корни трёхчлена', formula: `x=${p.m}\\pm\\sqrt{${p.m * p.m}-a}` },
      { slovo: 'Меньший корень правее $b$', formula: `f(${p.b})\\ge0\\iff a\\ge${ch.a2}` },
      { slovo: 'Ответ', formula: otv },
    ],
    kontrol: { kuski: mnozhKontrol(ch.kuski), a1: ch.a1, a2: ch.a2 },
  };
}

export const U19_TREHCHLEN_KOREN: Shablon2<PU19> = {
  no: 19,
  prototip: 'Трёхчлен с параметром, умноженный на корень: число различных корней с учётом области',
  sobrat,
};
