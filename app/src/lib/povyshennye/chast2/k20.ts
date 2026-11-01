/**
 * №20 (варианты 19–20): n различных натуральных чисел со средним M.
 *
 * Сумма nM. Наибольшее число не больше nM − (1 + 2 + … + (n − 1)) и не
 * меньше M + (n − 1)/2 (иначе сумма меньше nM). Наименьшее число y не
 * больше M − (n − 1)/2: числа не меньше y, y + 1, …, y + n − 1.
 * а) Может ли наибольшее быть равно X? б) Может ли наименьшее быть
 * равно Y? в) Наибольшее возможное значение наибольшего числа.
 */

import type { Chast2Zadacha, Shablon2 } from './types';

export interface PK20 {
  n: number;
  M: number;
  X: number;
  Y: number;
}

/** n − 1 различных натуральных чисел, меньших X, с суммой T (или null). */
function dobor(n1: number, X: number, T: number): number[] | null {
  const a = Array.from({ length: n1 }, (_, i) => i + 1);
  let s = a.reduce((u, v) => u + v, 0);
  if (s > T) return null;
  /* Поднимаем числа с конца, не выходя за X − 1 и сохраняя различие. */
  for (let i = n1 - 1; i >= 0 && s < T; i -= 1) {
    const potolok = X - 1 - (n1 - 1 - i);
    const shag = Math.min(potolok - a[i]!, T - s);
    if (shag > 0) {
      a[i]! += shag;
      s += shag;
    }
  }
  return s === T ? a : null;
}

export function chislaK20(p: PK20) {
  const S = p.n * p.M;
  const maxMax = S - (p.n * (p.n - 1)) / 2;
  const minMax = Math.ceil(p.M + (p.n - 1) / 2);
  const daA = p.X >= minMax && p.X <= maxMax;
  const primerA = daA ? dobor(p.n - 1, p.X, S - p.X) : null;
  if (daA && primerA === null) throw new Error('k20: нет примера для а)');
  const maxMin = Math.floor(p.M - (p.n - 1) / 2);
  const daB = p.Y >= 1 && p.Y <= maxMin;
  let primerB: number[] | null = null;
  if (daB) {
    const nach = Array.from({ length: p.n - 1 }, (_, i) => p.Y + i);
    const posl = S - nach.reduce((u, v) => u + v, 0);
    if (!(posl > p.Y + p.n - 2)) throw new Error('k20: нет примера для б)');
    primerB = [...nach, posl];
  }
  return { S, maxMax, minMax, daA, primerA, maxMin, daB, primerB };
}

const spisok = (a: readonly number[]) => {
  if (a.length <= 6) return a.join(',\\ ');
  return `${a.slice(0, 3).join(',\\ ')},\\ \\ldots,\\ ${a.slice(-2).join(',\\ ')}`;
};

function sobrat(p: PK20): Chast2Zadacha {
  const ch = chislaK20(p);
  const n1 = p.n - 1;
  const uslovie =
    `На доске записано ${p.n} различных натуральных чисел, среднее арифметическое которых равно ${p.M}.\n` +
    `а) Может ли наибольшее из этих чисел быть равно ${p.X}?\n` +
    `б) Может ли наименьшее из этих чисел быть равно ${p.Y}?\n` +
    `в) Найдите наибольшее возможное значение наибольшего из этих чисел.`;
  const aLines = ch.daA
    ? [
        `Да. Сумма чисел равна $${p.n}\\cdot${p.M}=${ch.S}$. Пример: $${spisok(ch.primerA!)},\\ ${p.X}$ — ${p.n} различных чисел (последние перечислены по возрастанию), сумма $${ch.S}$, наибольшее равно $${p.X}$.`,
      ]
    : p.X > ch.maxMax
      ? [
          `Нет. Сумма чисел $${ch.S}$; остальные ${n1} различных натуральных чисел дают в сумме не меньше $1+2+\\ldots+${n1}=${(n1 * p.n) / 2}$, поэтому наибольшее не больше $${ch.S}-${(n1 * p.n) / 2}=${ch.maxMax}<${p.X}$.`,
        ]
      : [
          `Нет. Если наибольшее равно $${p.X}$, то остальные ${n1} чисел не больше $${p.X - 1},\\ ${p.X - 2},\\ \\ldots$, и сумма всех чисел не больше $${p.X}+${p.X - 1}+\\ldots+${p.X - n1}=${(p.n * (2 * p.X - n1)) / 2}<${ch.S}$.`,
        ];
  const bLines = ch.daB
    ? [
        `Да. Пример: $${spisok(ch.primerB!)}$ — числа различны, наименьшее $${p.Y}$, сумма $${ch.S}$.`,
      ]
    : [
        `Нет. Если наименьшее равно $${p.Y}$, то числа не меньше $${p.Y},\\ ${p.Y + 1},\\ \\ldots,\\ ${p.Y + n1}$, и сумма не меньше $${(p.n * (2 * p.Y + n1)) / 2}>${ch.S}$.`,
      ];
  return {
    no: 20,
    shablon: 'k20.srednee',
    uslovie,
    risunok: null,
    punkty: [
      { bukva: 'а', pole: { vid: 'danet', verno: ch.daA } },
      { bukva: 'б', pole: { vid: 'danet', verno: ch.daB } },
      {
        bukva: 'в',
        podpis: 'Наибольшее значение',
        pole: { vid: 'chislo', verno: String(ch.maxMax) },
      },
    ],
    otvet: `а) ${ch.daA ? 'да' : 'нет'}; б) ${ch.daB ? 'да' : 'нет'}; в) $${ch.maxMax}$`,
    reshenie: [
      { title: 'а) Наибольшее число', lines: aLines },
      { title: 'б) Наименьшее число', lines: bLines },
      {
        title: 'в) Оценка и пример',
        lines: [
          `Оценка: ${n1} чисел, отличных от наибольшего, различны и натуральны, их сумма не меньше $1+2+\\ldots+${n1}=${(n1 * p.n) / 2}$. Значит, наибольшее не больше $${ch.S}-${(n1 * p.n) / 2}=${ch.maxMax}$.`,
          `Пример: $1,\\ 2,\\ \\ldots,\\ ${n1},\\ ${ch.maxMax}$ — числа различны, сумма $${ch.S}$, среднее $${p.M}$.`,
          `Ответ в): $${ch.maxMax}$.`,
        ],
      },
    ],
    razbor: [
      { slovo: 'Сумма чисел', formula: `${p.n}\\cdot${p.M}=${ch.S}` },
      {
        slovo: 'Остальные числа не меньше $1,2,\\ldots$',
        formula: `1+\\ldots+${n1}=${(n1 * p.n) / 2}`,
      },
      { slovo: 'Наименьшее — оценка сверху', formula: `y\\le${ch.maxMin}` },
      { slovo: 'Ответ в)', formula: String(ch.maxMax) },
    ],
    kontrol: { a: ch.daA, b: ch.daB, v: ch.maxMax },
  };
}

export const K20_SREDNEE: Shablon2<PK20> = {
  no: 20,
  prototip:
    'Различные натуральные числа с данным средним: границы наибольшего и наименьшего, оценка и пример',
  sobrat,
};
