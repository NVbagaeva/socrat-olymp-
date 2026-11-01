/**
 * №20 (варианты 1–2): из чисел 1, 2, …, n выбирают несколько так, что
 * ни одно из выбранных не делится на другое выбранное.
 * а) Можно ли выбрать k чисел? б) Наибольшее количество? в) Наибольшая сумма
 * при наибольшем количестве.
 * Цепочки по нечётной части m·2ʲ: их ⌈n/2⌉, в каждой не больше одного
 * выбранного, поэтому максимум ⌈n/2⌉; максимум суммы — верхняя половина.
 */

import type { Chast2Zadacha, Shablon2 } from './types';

export interface PU20 {
  n: number;
  /** Сколько чисел в пункте а). */
  k: number;
}

export function chislaU20(p: PU20) {
  if (!(p.n >= 8 && p.n <= 40)) throw new Error('u20: n');
  const maks = Math.ceil(p.n / 2);
  const daA = p.k <= maks;
  const verh = Array.from({ length: maks }, (_, i) => Math.floor(p.n / 2) + 1 + i);
  const summa = verh.reduce((s, x) => s + x, 0);
  return { maks, daA, verh, summa };
}

function sobrat(p: PU20): Chast2Zadacha {
  const ch = chislaU20(p);
  const primerA = Array.from(
    { length: Math.min(p.k, ch.maks) },
    (_, i) => ch.verh[ch.verh.length - 1 - i]!,
  ).reverse();
  return {
    no: 20,
    shablon: 'u20.nedelimye',
    uslovie:
      `Из натуральных чисел $1,\\ 2,\\ \\ldots,\\ ${p.n}$ выбирают несколько различных так, чтобы ни одно из выбранных чисел не делилось на другое выбранное.\n` +
      `а) Можно ли выбрать $${p.k}$ чисел?\n` +
      `б) Какое наибольшее количество чисел можно выбрать?\n` +
      `в) Какую наибольшую сумму могут иметь выбранные числа, если их выбрано наибольшее возможное количество?`,
    risunok: null,
    punkty: [
      { bukva: 'а', pole: { vid: 'danet', verno: ch.daA } },
      {
        bukva: 'б',
        podpis: 'Наибольшее количество',
        pole: { vid: 'chislo', verno: String(ch.maks) },
      },
      { bukva: 'в', podpis: 'Наибольшая сумма', pole: { vid: 'chislo', verno: String(ch.summa) } },
    ],
    otvet: `а) ${ch.daA ? 'да' : 'нет'}; б) $${ch.maks}$; в) $${ch.summa}$`,
    reshenie: [
      {
        title: 'Цепочки',
        lines: [
          `Каждое число из $1,\\ldots,${p.n}$ единственным образом записывается как $m\\cdot2^j$, где $m$ нечётно. Числа с одной и той же нечётной частью $m$ образуют цепочку $m,\\ 2m,\\ 4m,\\ldots$, и из любых двух чисел цепочки меньшее делит большее. Значит, из каждой цепочки можно выбрать не больше одного числа.`,
          `Нечётных чисел от $1$ до $${p.n}$ ровно $${ch.maks}$, поэтому цепочек $${ch.maks}$ и выбрать больше $${ch.maks}$ чисел нельзя.`,
        ],
      },
      {
        title: 'Пример',
        lines: [
          `Числа $${Math.floor(p.n / 2) + 1},\\ldots,${p.n}$ подходят: частное двух из них было бы целым, большим $1$, но тогда большее число было бы не меньше удвоенного меньшего, то есть больше $${p.n}$. Их $${ch.maks}$.`,
        ],
      },
      {
        title: 'а) и б)',
        lines: ch.daA
          ? [`а) Да: например, $${primerA.join(',\\ ')}$. б) Наибольшее количество — $${ch.maks}$.`]
          : [
              `а) Нет: $${p.k}>${ch.maks}$, а больше $${ch.maks}$ чисел выбрать нельзя. б) Наибольшее количество — $${ch.maks}$.`,
            ],
      },
      {
        title: 'в) Наибольшая сумма',
        lines: [
          `При $${ch.maks}$ выбранных числах из каждой цепочки взято ровно одно. Наибольшее число цепочки с нечётной частью $m$ — то $m\\cdot2^j\\le${p.n}$, у которого $2m\\cdot2^j>${p.n}$; оно лежит среди чисел $${Math.floor(p.n / 2) + 1},\\ldots,${p.n}$, и каждое из них — наибольшее в своей цепочке.`,
          `Поэтому сумма не больше $${Math.floor(p.n / 2) + 1}+\\ldots+${p.n}=${ch.summa}$, и она достигается на этом наборе. Ответ: $${ch.summa}$.`,
        ],
      },
    ],
    razbor: [
      { slovo: 'Цепочки $m\\cdot2^j$ с нечётным $m$', formula: `\\text{цепочек } ${ch.maks}` },
      { slovo: 'Из цепочки — не больше одного числа', formula: `\\le ${ch.maks}` },
      { slovo: 'Пример — верхняя половина', formula: `${Math.floor(p.n / 2) + 1},\\ldots,${p.n}` },
      { slovo: 'Наибольшая сумма', formula: String(ch.summa) },
    ],
    kontrol: { maks: ch.maks, summa: ch.summa, daA: ch.daA ? 1 : 0 },
  };
}

export const U20_NEDELIMYE: Shablon2<PU20> = {
  no: 20,
  prototip: 'Числа 1…n без пар «делитель — кратное»: цепочки по нечётной части, оценка и пример',
  sobrat,
};
