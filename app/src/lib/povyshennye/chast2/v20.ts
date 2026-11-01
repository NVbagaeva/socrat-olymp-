/**
 * №20 (варианты 3–4): возрастающая последовательность натуральных
 * a₁ = 1 < a₂ < … , каждый член не больше удвоенного предыдущего.
 * а) Может ли a_k = N₁? б) Наименьший номер n, при котором a_n = N₂.
 * в) Наибольшая сумма первых m членов.
 * Оценка: a_n ≤ 2^{n−1}; пример — удвоение, затем подходящий шаг.
 */

import type { Chast2Zadacha, Shablon2 } from './types';

export interface PV20 {
  k: number;
  N1: number;
  N2: number;
  m: number;
}

export function chislaV20(p: PV20) {
  const daA = p.N1 <= 2 ** (p.k - 1) && p.N1 >= p.k;
  let n = 1;
  while (2 ** (n - 1) < p.N2) n++;
  const summa = 2 ** p.m - 1;
  /* Пример к а): идём от a_k = N₁ назад, a_{j−1} = max(j − 1, ⌈a_j/2⌉). */
  const primerA: number[] = [];
  if (daA) {
    let t = p.N1;
    for (let j = p.k; j >= 1; j -= 1) {
      primerA.unshift(t);
      t = Math.max(j - 1, Math.ceil(t / 2));
    }
  }
  return { daA, n, summa, primerA };
}

function sobrat(p: PV20): Chast2Zadacha {
  const ch = chislaV20(p);
  const dvoyki = Array.from({ length: ch.n - 1 }, (_, i) => 2 ** i);
  const primerB = [...dvoyki, p.N2];
  return {
    no: 20,
    shablon: 'v20.udvoenie',
    uslovie:
      `Последовательность натуральных чисел $a_1,a_2,a_3,\\ldots$ возрастает, $a_1=1$, и каждый её член, начиная со второго, не больше удвоенного предыдущего.\n` +
      `а) Может ли $a_{${p.k}}=${p.N1}$?\n` +
      `б) При каком наименьшем $n$ может выполняться $a_n=${p.N2}$?\n` +
      `в) Какое наибольшее значение может принимать сумма $a_1+a_2+\\ldots+a_{${p.m}}$?`,
    risunok: null,
    punkty: [
      { bukva: 'а', pole: { vid: 'danet', verno: ch.daA } },
      { bukva: 'б', podpis: 'Наименьшее $n$', pole: { vid: 'chislo', verno: String(ch.n) } },
      { bukva: 'в', podpis: 'Наибольшая сумма', pole: { vid: 'chislo', verno: String(ch.summa) } },
    ],
    otvet: `а) ${ch.daA ? 'да' : 'нет'}; б) $${ch.n}$; в) $${ch.summa}$`,
    reshenie: [
      {
        title: 'Оценка',
        lines: [
          `Из $a_{j+1}\\le 2a_j$ и $a_1=1$ по индукции $a_j\\le 2^{j-1}$. Из возрастания $a_j\\ge j$.`,
        ],
      },
      {
        title: 'а)',
        lines: ch.daA
          ? [
              `Да. Пример: $${ch.primerA.join(',\\ ')}$ — последовательность возрастает, начинается с $1$, каждый член не больше удвоенного предыдущего, и $a_{${p.k}}=${p.N1}$.`,
            ]
          : [
              `Нет: должно быть $${p.k}\\le a_{${p.k}}\\le 2^{${p.k - 1}}=${2 ** (p.k - 1)}$, а $${p.N1}$ этому не удовлетворяет.`,
            ],
      },
      {
        title: 'б)',
        lines: [
          `$a_n=${p.N2}\\le2^{n-1}$, наименьшее такое $n$ — $${ch.n}$. Пример: $${primerB.join(',\\ ')}$ — каждый член не больше удвоенного предыдущего.`,
        ],
      },
      {
        title: 'в)',
        lines: [
          `$a_1+\\ldots+a_{${p.m}}\\le1+2+\\ldots+2^{${p.m - 1}}=2^{${p.m}}-1=${ch.summa}$; равенство — у последовательности $a_j=2^{j-1}$.`,
        ],
      },
    ],
    razbor: [
      { slovo: 'Оценка сверху', formula: 'a_j\\le2^{j-1}' },
      { slovo: 'Оценка снизу', formula: 'a_j\\ge j' },
      { slovo: 'б)', formula: `n=${ch.n}` },
      { slovo: 'в)', formula: String(ch.summa) },
    ],
    kontrol: { daA: ch.daA ? 1 : 0, n: ch.n, summa: ch.summa },
  };
}

export const V20_UDVOENIE: Shablon2<PV20> = {
  no: 20,
  prototip:
    'Возрастающая последовательность, члены не больше удвоенного предыдущего: оценки и примеры',
  sobrat,
};
