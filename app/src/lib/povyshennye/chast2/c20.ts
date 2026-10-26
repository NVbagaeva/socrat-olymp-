/**
 * №20: две последовательности подряд идущих N-значных чисел: k чисел
 * (k ≥ k₀) со средним Q₁ и r·k чисел (r = 2 или 4) со средним Q₂.
 * а) Может ли Q₁ = Q₂ при чётном k (да); б) при нечётном (нет);
 * в) наименьшее или наибольшее значение |(Q₁ + Q₂)/2 − Q|, где Q —
 * среднее объединения без повторов.
 *
 * Q₁ = n + (k − 1)/2, Q₂ = m + (rk − 1)/2, Q₁ = Q₂ ⇔ n − m = (r − 1)k/2 —
 * целое только при чётном k. Разность в) равна (r − 1)|Q₁ − Q₂|/(2(r + 1)),
 * а для непересекающихся последовательностей
 * (r + 1)k/2 ≤ |Q₁ − Q₂| ≤ W − (r + 1)k/2, W — количество N-значных чисел.
 */

import { rat, type Rat } from '@/lib/zadanie15/core/rational';
import { ratDecTex } from './tex';
import type { Chast2Zadacha, Shablon2 } from './types';

const RAZR = {
  3: 'трёхзначных',
  4: 'четырёхзначных',
  5: 'пятизначных',
} as const;

export interface PC20 {
  razr: keyof typeof RAZR;
  r: 2 | 4;
  /** Наименьшее k. */
  k0: number;
  /** k пункта а (чётное) и б (нечётное). */
  ka: number;
  kb: number;
  rezhim: 'min' | 'max';
}

export function chislaC20(p: PC20) {
  const Lo = 10 ** (p.razr - 1);
  const U = 10 ** p.razr - 1;
  const W = U - Lo + 1;
  const { r, k0 } = p;
  /* |Δ| = (r − 1)/(2(r + 1))·|Q₁ − Q₂|. */
  const otv: Rat =
    p.rezhim === 'min' ? rat((r - 1) * k0, 4) : rat((r - 1) * (2 * W - (r + 1) * k0), 4 * (r + 1));
  return { Lo, U, W, otv };
}

/** Дробь TeX без лишнего: «\dfrac{k-1}{2}». */
const dr = (a: string, b: string | number) => `\\dfrac{${a}}{${b}}`;

function sobrat(p: PC20): Chast2Zadacha {
  const { Lo, U, W, otv } = chislaC20(p);
  const { r, k0, ka, kb } = p;
  if (ka % 2 !== 0 || kb % 2 !== 1 || ka < k0 || kb < k0 || (r + 1) * k0 > W)
    throw new Error('c20: параметры не те');
  if (Lo + ((r - 1) * ka) / 2 + ka - 1 > U || Lo + r * ka - 1 > U)
    throw new Error('c20: пример а) не помещается');
  const slovo = RAZR[p.razr];
  const rk = `${r}k`;
  const naib = p.rezhim === 'min' ? 'наименьшее' : 'наибольшее';
  const uslovie =
    `Первая последовательность состоит из $k$ $(k\\ge${k0})$ подряд идущих ${slovo} натуральных чисел, среднее арифметическое которых равно $Q_1$. ` +
    `Вторая последовательность состоит из $${rk}$ подряд идущих ${slovo} натуральных чисел, среднее арифметическое которых равно $Q_2$.\n` +
    `а) Может ли $Q_1=Q_2$ при $k=${ka}$?\n` +
    `б) Может ли $Q_1=Q_2$ при $k=${kb}$?\n` +
    `в) Найдите ${naib} возможное значение модуля разности среднего арифметического $\\dfrac{Q_1+Q_2}{2}$ и среднего арифметического набора, составленного из членов первой и второй последовательностей, если в этом наборе нет одинаковых чисел.`;

  const D = ((r - 1) * ka) / 2;
  const n = Lo + D;
  const otvT = ratDecTex(otv);
  const kk = (r + 1) / 2;
  const kkT = Number.isInteger(kk) ? String(kk) : dr(String(r + 1), 2);
  const koef = dr(String(r - 1), 2 * (r + 1));
  const otvPole = otvT.replace(/\\dfrac/g, '\\frac');

  const vLines =
    p.rezhim === 'min'
      ? [
          `Значит, $|Q_1-Q_2|\\ge${kkT}k\\ge${kkT}\\cdot${k0}$, и модуль разности не меньше $${koef}\\cdot${kkT}\\cdot${k0}=${otvT}$.`,
          `Это значение достигается: $k=${k0}$, первая последовательность $${Lo},\\ldots,${Lo + k0 - 1}$, вторая — $${Lo + k0},\\ldots,${Lo + k0 + r * k0 - 1}$. Тогда $Q_2-Q_1=${k0}+${dr(`${r - 1}\\cdot${k0}`, 2)}=${ratDecTex(rat((r + 1) * k0, 2))}$ и модуль разности равен $${otvT}$.`,
        ]
      : [
          `Все числа ${slovo}: от $${Lo}$ до $${U}$, их $${W}$. В первом случае $m+${rk}-1\\le${U}$ и $n\\ge${Lo}$, поэтому $Q_2-Q_1\\le${U}-${rk}+1-${Lo}+${dr(`${r - 1}k`, 2)}=${W}-${kkT}k$. Во втором случае $n+k-1\\le${U}$, $m\\ge${Lo}$, и так же $Q_1-Q_2\\le${W}-${kkT}k$.`,
          `Так как $k\\ge${k0}$, получаем $|Q_1-Q_2|\\le${W}-${kkT}\\cdot${k0}=${ratDecTex(rat(2 * W - (r + 1) * k0, 2))}$, и модуль разности не больше $${koef}\\cdot${ratDecTex(rat(2 * W - (r + 1) * k0, 2))}=${otvT}$.`,
          `Это значение достигается: $k=${k0}$, первая последовательность $${Lo},\\ldots,${Lo + k0 - 1}$, вторая — $${U - r * k0 + 1},\\ldots,${U}$.`,
        ];

  return {
    no: 20,
    shablon: 'c20.srednie',
    uslovie,
    risunok: null,
    punkty: [
      { bukva: 'а', podpis: 'Ответ', pole: { vid: 'danet', verno: true } },
      { bukva: 'б', podpis: 'Ответ', pole: { vid: 'danet', verno: false } },
      {
        bukva: 'в',
        podpis: `${naib[0]!.toUpperCase()}${naib.slice(1)} значение`,
        pole: { vid: 'chislo', verno: otvPole },
      },
    ],
    otvet: `а) да; б) нет; в) $${otvT}$`,
    reshenie: [
      {
        title: 'Средние последовательностей',
        lines: [
          `Пусть первая последовательность — $n,\\ n+1,\\ldots,\\ n+k-1$, вторая — $m,\\ m+1,\\ldots,\\ m+${rk}-1$. Среднее подряд идущих чисел равно полусумме крайних:`,
          `$Q_1=n+${dr('k-1', 2)}$, $Q_2=m+${dr(`${rk}-1`, 2)}$, откуда $Q_1=Q_2\\iff n-m=${dr(`${r - 1 === 1 ? '' : r - 1}k`, 2)}$.`,
        ],
      },
      {
        title: 'а) Пример',
        lines: [
          `При $k=${ka}$ нужно $n-m=${D}$. Возьмём вторую последовательность $${Lo},\\ldots,${Lo + r * ka - 1}$ и первую $${n},\\ldots,${n + ka - 1}$: $Q_2=${ratDecTex(rat(2 * Lo + r * ka - 1, 2))}$, $Q_1=${ratDecTex(rat(2 * n + ka - 1, 2))}$ — средние равны. Ответ: да.`,
        ],
      },
      {
        title: 'б) Нечётное $k$',
        lines: [
          `При $k=${kb}$ число $${dr(`${r - 1 === 1 ? '' : `${r - 1}\\cdot`}${kb}`, 2)}$ не целое (числитель нечётный), а $n-m$ — целое. Значит, $Q_1\\ne Q_2$. Ответ: нет.`,
        ],
      },
      {
        title: 'в) Разность средних',
        lines: [
          `В наборе $k+${rk}=${r + 1}k$ чисел, их сумма $kQ_1+${rk}Q_2$, среднее $Q=${dr(`Q_1+${r}Q_2`, r + 1)}$.`,
          `$${dr('Q_1+Q_2', 2)}-Q=${dr(`${r + 1}(Q_1+Q_2)-2Q_1-${2 * r}Q_2`, 2 * (r + 1))}=${koef}\\,(Q_1-Q_2)$.`,
        ],
      },
      {
        title: 'в) Оценка',
        lines: [
          `Одинаковых чисел нет, поэтому одна последовательность целиком левее другой. Если первая левее, то $m\\ge n+k$ и $Q_2-Q_1=m-n+${dr(`${r - 1 === 1 ? '' : r - 1}k`, 2)}\\ge${kkT}k$. Если вторая левее, то $n\\ge m+${rk}$ и $Q_1-Q_2=n-m-${dr(`${r - 1 === 1 ? '' : r - 1}k`, 2)}\\ge${kkT}k$.`,
          ...vLines,
        ],
      },
    ],
    razbor: [
      {
        slovo: 'Среднее подряд идущих чисел — полусумма крайних',
        formula: `Q_1=n+${dr('k-1', 2)},\\ Q_2=m+${dr(`${rk}-1`, 2)}`,
      },
      { slovo: 'а) Подбираем начала последовательностей', formula: `n-m=${D}` },
      {
        slovo: 'б) Разность начал должна быть целой — не выходит',
        formula: `n-m=${dr(`${r - 1 === 1 ? '' : `${r - 1}\\cdot`}${kb}`, 2)}`,
      },
      { slovo: 'в) Разность средних выражаем через $Q_1-Q_2$', formula: `${koef}\\,|Q_1-Q_2|` },
      { slovo: `в) Оцениваем и строим пример`, formula: otvT },
    ],
    kontrol: { otv: Number(otv.n) / Number(otv.d), Lo, U },
  };
}

export const C20_SREDNIE: Shablon2<PC20> = {
  no: 20,
  prototip:
    'Две последовательности подряд идущих чисел: равенство средних, оценка разности средних',
  sobrat,
};
