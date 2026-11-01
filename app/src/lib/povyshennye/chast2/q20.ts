/**
 * №20 (варианты 29–30): на доске несколько различных натуральных чисел,
 * каждое не больше M, их среднее арифметическое равно A (целое).
 *
 * n чисел: сумма nA лежит между 1 + … + n = n(n + 1)/2 и
 * M + (M − 1) + … + (M − n + 1) = n(2M − n + 1)/2, и любая сумма между
 * ними достижима (сдвигаем числа по одному). Отсюда n ≤ 2A − 1 и
 * n ≤ 2M − 2A + 1. а) ровно k₁ чисел; б) ровно k₂ чисел, все нечётные:
 * сумма k₂ нечётных чисел имеет чётность k₂, и k₂² ≤ k₂A ≤ (сумма k₂
 * наибольших нечётных); в) наибольшее n.
 */

import type { Chast2Zadacha, Shablon2 } from './types';

export interface PQ20 {
  M: number;
  A: number;
  k1: number;
  k2: number;
}

/** n различных чисел из набора (по возрастанию) с суммой T; null — нельзя. */
export function podobrat(nabor: readonly number[], n: number, T: number): number[] | null {
  if (n > nabor.length) return null;
  const idx = Array.from({ length: n }, (_, i) => i);
  const sum = () => idx.reduce((s, i) => s + nabor[i]!, 0);
  if (sum() > T) return null;
  /* Сдвигаем самый правый элемент, который можно сдвинуть, на одну позицию. */
  while (sum() < T) {
    let j = n - 1;
    while (j >= 0 && idx[j]! >= nabor.length - (n - j)) j -= 1;
    if (j < 0) return null;
    idx[j]! += 1;
  }
  return sum() === T ? idx.map((i) => nabor[i]!) : null;
}

export function chislaQ20(p: PQ20) {
  const vse = Array.from({ length: p.M }, (_, i) => i + 1);
  const nech = vse.filter((x) => x % 2 === 1);
  const a = podobrat(vse, p.k1, p.k1 * p.A);
  const b = podobrat(nech, p.k2, p.k2 * p.A);
  const nMax = Math.min(2 * p.A - 1, 2 * p.M - 2 * p.A + 1);
  const v = podobrat(vse, nMax, nMax * p.A);
  if (v === null) throw new Error('q20: в) нет примера');
  return { a, b, nMax, v };
}

function spisok(x: number[]): string {
  if (x.length <= 8) return x.join(',\\ ');
  return `${x.slice(0, 4).join(',\\ ')},\\ \\ldots,\\ ${x.slice(-3).join(',\\ ')}`;
}

function sobrat(p: PQ20): Chast2Zadacha {
  const ch = chislaQ20(p);
  const uslovie =
    `На доске написано несколько (не менее двух) различных натуральных чисел, каждое из которых не больше $${p.M}$. Среднее арифметическое этих чисел равно $${p.A}$.\n` +
    `а) Может ли на доске быть ровно $${p.k1}$ чисел?\n` +
    `б) Может ли на доске быть ровно $${p.k2}$ чисел, если все они нечётные?\n` +
    `в) Какое наибольшее количество чисел может быть на доске?`;
  const aLines =
    ch.a !== null
      ? [
          `Да: $${spisok(ch.a)}$ — $${p.k1}$ различных чисел, их сумма $${p.k1 * p.A}$, среднее $${p.A}$.`,
        ]
      : [
          `Нет. Сумма $${p.k1}$ чисел должна быть $${p.k1 * p.A}$, но ${
            (p.k1 * (p.k1 + 1)) / 2 > p.k1 * p.A
              ? `сумма $${p.k1}$ различных натуральных чисел не меньше $1+2+\\ldots+${p.k1}=${(p.k1 * (p.k1 + 1)) / 2}$`
              : `сумма $${p.k1}$ различных чисел, не больших $${p.M}$, не больше $${p.M}+${p.M - 1}+\\ldots+${p.M - p.k1 + 1}=${(p.k1 * (2 * p.M - p.k1 + 1)) / 2}$`
          }.`,
        ];
  const maxNech = (() => {
    const n = Array.from({ length: p.M }, (_, i) => i + 1).filter((x) => x % 2 === 1);
    return n.slice(-p.k2).reduce((s, x) => s + x, 0);
  })();
  const bLines =
    ch.b !== null
      ? [`Да: $${spisok(ch.b)}$ — $${p.k2}$ различных нечётных чисел с суммой $${p.k2 * p.A}$.`]
      : (p.k2 * p.A - p.k2) % 2 !== 0
        ? [
            `Нет. Сумма $${p.k2}$ нечётных чисел — ${p.k2 % 2 === 0 ? 'чётное' : 'нечётное'} число, а должна равняться $${p.k2}\\cdot${p.A}=${p.k2 * p.A}$ — ${(p.k2 * p.A) % 2 === 0 ? 'чётному' : 'нечётному'} числу.`,
          ]
        : [
            `Нет. Сумма $${p.k2}$ различных нечётных чисел ${
              p.k2 * p.k2 > p.k2 * p.A
                ? `не меньше $1+3+\\ldots+${2 * p.k2 - 1}=${p.k2 * p.k2}>${p.k2 * p.A}$`
                : `не больше суммы $${p.k2}$ наибольших нечётных чисел, не превосходящих $${p.M}$, то есть $${maxNech}<${p.k2 * p.A}$`
            }.`,
          ];
  const n = ch.nMax;
  const vLines = [
    `Оценка. Если чисел $n$, их сумма $n\\cdot${p.A}$. Она не меньше $1+2+\\ldots+n=\\dfrac{n(n+1)}{2}$, откуда $n\\le 2\\cdot${p.A}-1=${2 * p.A - 1}$; и не больше $${p.M}+${p.M - 1}+\\ldots+(${p.M}-n+1)=\\dfrac{n(${2 * p.M}-n+1)}{2}$, откуда $n\\le ${2 * p.M}-2\\cdot${p.A}+1=${2 * p.M - 2 * p.A + 1}$. Значит, $n\\le ${n}$.`,
    `Пример на $${n}$ чисел: $${spisok(ch.v)}$ — их сумма $${n * p.A}$, среднее $${p.A}$.`,
  ];
  const otv = `а) ${ch.a ? 'да' : 'нет'}; б) ${ch.b ? 'да' : 'нет'}; в) $${n}$`;
  return {
    no: 20,
    shablon: 'q20.sredneeNabora',
    uslovie,
    risunok: null,
    punkty: [
      { bukva: 'а', pole: { vid: 'danet', verno: ch.a !== null } },
      { bukva: 'б', pole: { vid: 'danet', verno: ch.b !== null } },
      { bukva: 'в', podpis: 'Наибольшее количество', pole: { vid: 'chislo', verno: String(n) } },
    ],
    otvet: otv,
    reshenie: [
      { title: `а) $${p.k1}$ чисел`, lines: aLines },
      { title: `б) $${p.k2}$ нечётных чисел`, lines: bLines },
      { title: 'в) Оценка и пример', lines: [...vLines, `Ответ: ${otv}.`] },
    ],
    razbor: [
      { slovo: 'Сумма $n$ чисел равна $nA$', formula: `S=n\\cdot ${p.A}` },
      {
        slovo: 'Наименьшая и наибольшая возможные суммы',
        formula: `\\dfrac{n(n+1)}{2}\\le S\\le\\dfrac{n(2M-n+1)}{2}`,
      },
      { slovo: 'Чётность суммы нечётных чисел', formula: 'S\\equiv n\\pmod 2' },
      { slovo: 'Ответ в)', formula: String(n) },
    ],
    kontrol: { a: ch.a !== null, b: ch.b !== null, v: n },
  };
}

export const Q20_SREDNEE_NABORA: Shablon2<PQ20> = {
  no: 20,
  prototip:
    'Различные натуральные числа не больше M со средним A: заданное количество, все нечётные, наибольшее количество',
  sobrat,
};
