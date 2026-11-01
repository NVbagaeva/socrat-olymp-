/**
 * №19 (варианты 25–26): система { |x| + |y| = c; (x − a)² + y² = R² },
 * c > R√2. Квадрат с вершинами (±c; 0), (0; ±c) и окружность радиуса R,
 * центр которой движется по оси Ox.
 *
 * По симметрии (a ↔ −a) достаточно a ≥ 0; у правой вершины (c; 0) стороны
 * x ± y = c, расстояние от центра до них (c − a)/√2:
 *   0 ≤ a < c − R√2 — окружность внутри квадрата, 0 решений;
 *   a = c − R√2 — касается двух сторон, 2;
 *   c − R√2 < a < c − R — пересекает каждую сторону дважды, 4;
 *   a = c − R — проходит через вершину, 3;
 *   c − R < a < c + R — по одной точке на стороне, 2;
 *   a = c + R — касается вершины снаружи, 1; дальше — 0.
 */

import type { Kusok, Mnozhestvo } from '@/lib/chast2/sravnenie';
import { rat } from '@/lib/zadanie15/core/rational';
import { sqrtRat, surdTex } from '@/lib/zadanie15/core/surd';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PN19 {
  c: number;
  R: number;
  /** Сколько решений спрашиваем. */
  N: 2 | 4;
}

interface Kon {
  v: number;
  tex: string;
}
interface Kus {
  lo: Kon;
  hi: Kon;
  tochka: boolean;
}

export function chislaN19(p: PN19) {
  const r2 = sqrtRat(rat(2 * p.R * p.R));
  const r2T = surdTex(r2);
  const r2v = p.R * Math.SQRT2;
  if (!(p.c > r2v + 1e-9)) throw new Error('n19: c ≤ R√2');
  const k = (v: number, tex: string): Kon => ({ v, tex });
  const A = k(p.c - r2v, `${p.c}-${r2T}`);
  const mA = k(r2v - p.c, `${r2T}-${p.c}`);
  const B = k(p.c - p.R, `${p.c - p.R}`);
  const mB = k(p.R - p.c, `${p.R - p.c}`);
  const Cc = k(p.c + p.R, `${p.c + p.R}`);
  const mC = k(-p.c - p.R, `${-p.c - p.R}`);
  const kuski: Kus[] =
    p.N === 2
      ? [
          { lo: mC, hi: mB, tochka: false },
          { lo: mA, hi: mA, tochka: true },
          { lo: A, hi: A, tochka: true },
          { lo: B, hi: Cc, tochka: false },
        ]
      : [
          { lo: mB, hi: mA, tochka: false },
          { lo: A, hi: B, tochka: false },
        ];
  /** Число решений при данном a — формулой (для контроля). */
  const chislo = (a: number): number => {
    const t = Math.abs(a);
    const e = 1e-9;
    if (t < A.v - e) return 0;
    if (Math.abs(t - A.v) <= e) return 2;
    if (t < B.v - e) return 4;
    if (Math.abs(t - B.v) <= e) return 3;
    if (t < Cc.v - e) return 2;
    if (Math.abs(t - Cc.v) <= e) return 1;
    return 0;
  };
  return { r2T, A, B, Cc, kuski, chislo };
}

const kusTex = (k: Kus) =>
  k.tochka ? `\\left\\{${k.lo.tex}\\right\\}` : `\\left(${k.lo.tex};\\ ${k.hi.tex}\\right)`;

function sobrat(p: PN19): Chast2Zadacha {
  const ch = chislaN19(p);
  const otv = ch.kuski.map(kusTex).join('\\cup');
  const pole: Mnozhestvo = {
    kuski: ch.kuski.map((k): Kusok =>
      k.tochka
        ? { t: 'tochka', x: k.lo.tex }
        : { t: 'interval', lo: k.lo.tex, loZakr: false, hi: k.hi.tex, hiZakr: false },
    ),
  };
  const sistema = `\\begin{cases}|x|+|y|=${p.c},\\\\ x^2+y^2=2ax-a^2+${p.R * p.R}\\end{cases}`;
  const slovo = p.N === 2 ? 'ровно два решения' : 'ровно четыре решения';
  return {
    no: 19,
    shablon: 'n19.kvadratOkr',
    uslovie: `Найдите все значения $a$, при каждом из которых система уравнений\n$${sistema}$\nимеет ${slovo}.`,
    risunok: null,
    punkty: [
      { bukva: null, podpis: 'Множество значений $a$', pole: { vid: 'promezhutki', verno: pole } },
    ],
    otvet: `$${otv}$`,
    reshenie: [
      {
        title: 'Графики',
        lines: [
          `Первое уравнение задаёт квадрат с вершинами $(\\pm${p.c};\\ 0)$ и $(0;\\ \\pm${p.c})$: на каждой четверти это отрезок прямой $\\pm x\\pm y=${p.c}$.`,
          `Второе: $(x-a)^2+y^2=${p.R * p.R}$ — окружность радиуса $${p.R}$ с центром $(a;\\ 0)$ на оси $Ox$. Картинка симметрична относительно оси $Oy$ при замене $a$ на $-a$, поэтому достаточно разобрать $a\\ge 0$ (окружность у правой вершины $(${p.c};\\ 0)$).`,
        ],
      },
      {
        title: 'Положения окружности при $a\\ge0$',
        lines: [
          `Расстояние от центра до сторон $x\\pm y=${p.c}$ равно $\\dfrac{${p.c}-a}{\\sqrt2}$. Касание изнутри: $\\dfrac{${p.c}-a}{\\sqrt2}=${p.R}$, $a=${ch.A.tex}$; при меньших $a$ окружность внутри квадрата — решений нет ($${p.c}>${ch.r2T}$, поэтому до левых сторон она не дотягивается).`,
          `$${ch.A.tex}<a<${ch.B.tex}$: каждая из двух правых сторон пересекается дважды (оба пересечения лежат на отрезках, пока вершина $(${p.c};\\ 0)$ вне круга) — 4 решения. $a=${ch.B.tex}$: окружность проходит через вершину — 3 решения.`,
          `$${ch.B.tex}<a<${ch.Cc.tex}$: вершина внутри круга, на каждой стороне по одной точке — 2 решения; $a=${ch.Cc.tex}$ — касание в вершине, 1 решение; $a>${ch.Cc.tex}$ — решений нет.`,
        ],
      },
      {
        title: 'Ответ',
        lines: [
          p.N === 2
            ? `Два решения: $a=${ch.A.tex}$ (касание) и $${ch.B.tex}<a<${ch.Cc.tex}$; с симметричными отрицательными значениями — $${otv}$.`
            : `Четыре решения: $${ch.A.tex}<a<${ch.B.tex}$ и симметричные отрицательные значения $-(${ch.B.tex})<a<-(${ch.A.tex})$.`,
          `Ответ: $${otv}$.`,
        ],
      },
    ],
    razbor: [
      {
        slovo: 'Квадрат и окружность с центром на оси $Ox$',
        formula: `|x|+|y|=${p.c},\\ (x-a)^2+y^2=${p.R * p.R}`,
      },
      { slovo: 'Касание сторон изнутри', formula: `a=\\pm(${ch.A.tex})` },
      {
        slovo: 'Окружность через вершину и касание снаружи',
        formula: `a=\\pm${ch.B.tex},\\ a=\\pm${ch.Cc.tex}`,
      },
      { slovo: 'Ответ', formula: otv },
    ],
    kontrol: {
      A: ch.A.v,
      B: ch.B.v,
      C: ch.Cc.v,
      kuski: ch.kuski.flatMap((k) => [k.lo.v, k.hi.v, k.tochka ? 1 : 0]),
    },
  };
}

export const N19_KVADRAT_OKR: Shablon2<PN19> = {
  no: 19,
  prototip: 'Параметр: квадрат |x| + |y| = c и окружность с центром (a; 0), число решений',
  sobrat,
};
