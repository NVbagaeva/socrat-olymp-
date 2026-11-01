/**
 * №19 (варианты 13–14): (x² − 2|x| − a)·√(x + c) = 0, c > 0 целое.
 *
 * Корень x = −c есть всегда (обращается в нуль корень). Остальные корни —
 * решения x² − 2|x| = a при x > −c. График g(x) = x² − 2|x| — «W» с
 * минимумами −1 в точках ±1 и локальным максимумом 0 в нуле; часть
 * левее x = −c отрезана. Число корней меняется при a = −1, 0, g(−c).
 */

import { kuskiPoTochkam } from './oMnozh';
import { mnozhKontrol, mnozhPole, mnozhTex } from './kMnozh';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PO19 {
  c: number;
  /** Сколько корней. */
  n: number;
}

/** Число корней уравнения при данном a. */
export function chisloKorneyO19(c: number, a: number): number {
  const k: number[] = [-c];
  const D = 1 + a;
  if (D >= -1e-12) {
    const s = Math.sqrt(Math.max(0, D));
    for (const x of [1 + s, 1 - s]) if (x >= 0) k.push(x);
    for (const x of [-1 + s, -1 - s]) if (x < 0) k.push(x);
  }
  const ok = k.filter((x) => x >= -c - 1e-12);
  const vse = ok
    .sort((u, v) => u - v)
    .filter((x, i, m) => i === 0 || Math.abs(x - m[i - 1]!) > 1e-9);
  return vse.length;
}

export function chislaO19(p: PO19) {
  if (!(p.c >= 1)) throw new Error('o19: c ≥ 1');
  const gc = p.c * p.c - 2 * p.c;
  const tochki = [-1, 0, gc].map((v) => ({ v, tex: String(v) }));
  const kuski = kuskiPoTochkam(tochki, (a) => chisloKorneyO19(p.c, a) === p.n);
  if (kuski.length === 0) throw new Error('o19: пустой ответ');
  return { gc, kuski };
}

function sobrat(p: PO19): Chast2Zadacha {
  const ch = chislaO19(p);
  const otv = mnozhTex(ch.kuski);
  const nT = p.n === 2 ? 'ровно два' : p.n === 3 ? 'ровно три' : `ровно ${p.n}`;
  return {
    no: 19,
    shablon: 'o19.wKoren',
    uslovie: `Найдите все значения $a$, при каждом из которых уравнение $\\left(x^2-2|x|-a\\right)\\sqrt{x+${p.c}}=0$ имеет ${nT} различных корня.`,
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
        title: 'Распадается на два условия',
        lines: [
          `Уравнение равносильно совокупности: $x=-${p.c}$ или $\\begin{cases}x^2-2|x|=a,\\\\ x>-${p.c}.\\end{cases}$`,
          `Корень $x=-${p.c}$ есть при любом $a$.`,
        ],
      },
      {
        title: 'Графически',
        lines: [
          `График $y=x^2-2|x|$ симметричен относительно оси ординат: минимумы $-1$ при $x=\\pm1$, максимум $0$ при $x=0$. Рассматриваем его часть при $x>-${p.c}$; значение в точке $x=-${p.c}$ равно $${ch.gc}$.`,
          `Горизонтальная прямая $y=a$ пересекает эту часть графика в разном числе точек; число меняется при $a=-1$, $a=0$ и $a=${ch.gc}$. Прибавляем корень $x=-${p.c}$ (если $a=${ch.gc}$, корни совпадают).`,
        ],
      },
      { title: 'Ответ', lines: [`$a\\in${otv}$.`] },
    ],
    razbor: [
      { slovo: 'Корень $x=-c$ всегда', formula: `x=-${p.c}` },
      { slovo: 'Остальные — пересечения с прямой $y=a$', formula: `y=x^2-2|x|,\\ x>-${p.c}` },
      { slovo: 'Особые значения', formula: `a=-1,\\ 0,\\ ${ch.gc}` },
      { slovo: 'Ответ', formula: otv },
    ],
    kontrol: { kuski: mnozhKontrol(ch.kuski) },
  };
}

export const O19_W_KOREN: Shablon2<PO19> = {
  no: 19,
  prototip: 'Параметр: произведение с корнем, график y = x² − 2|x| на луче и горизонтальная прямая',
  sobrat,
};
