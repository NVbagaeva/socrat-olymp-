/**
 * №20 (варианты 17–18): возрастающая арифметическая прогрессия из
 * натуральных чисел, сумма n членов равна S.
 * S = n·a1 + d·n(n − 1)/2, a1 ≥ 1, d ≥ 1.
 * а) Может ли n = n1? б) Может ли n = n2? в) Наибольшее n.
 */

import type { Chast2Zadacha, Shablon2 } from './types';

export interface PAE20 {
  S: number;
  n1: number;
  n2: number;
}

export function primerAE20(S: number, n: number): [number, number] | null {
  for (let d = 1; d * ((n * (n - 1)) / 2) < S; d += 1) {
    const ost = S - (d * n * (n - 1)) / 2;
    if (ost > 0 && ost % n === 0) return [ost / n, d];
  }
  return null;
}

export function chislaAE20(p: PAE20) {
  const pA = primerAE20(p.S, p.n1);
  const pB = primerAE20(p.S, p.n2);
  let nMax = 1;
  let prMax: [number, number] | null = null;
  for (let n = 2; (n * (n + 1)) / 2 <= p.S; n += 1) {
    const pr = primerAE20(p.S, n);
    if (pr !== null) {
      nMax = n;
      prMax = pr;
    }
  }
  if (prMax === null) throw new Error('ae20: нет прогрессии');
  return { daA: pA !== null, pA, daB: pB !== null, pB, nMax, prMax };
}

function sobrat(p: PAE20): Chast2Zadacha {
  const ch = chislaAE20(p);
  const otv = (b: boolean) => (b ? 'да' : 'нет');
  const primer = (n: number, pr: [number, number] | null) =>
    pr === null
      ? ''
      : `например, $a_1=${pr[0]}$, $d=${pr[1]}$: $${n}\\cdot${pr[0]}+${pr[1]}\\cdot\\dfrac{${n}\\cdot${n - 1}}{2}=${p.S}$`;
  return {
    no: 20,
    shablon: 'ae20.progressiya',
    uslovie:
      `Несколько натуральных чисел образуют возрастающую арифметическую прогрессию, их сумма равна $${p.S}$.\n` +
      `а) Может ли в прогрессии быть $${p.n1}$ членов?\n` +
      `б) Может ли в прогрессии быть $${p.n2}$ членов?\n` +
      `в) Какое наибольшее число членов может быть в такой прогрессии?`,
    risunok: null,
    punkty: [
      { bukva: 'а', pole: { vid: 'danet', verno: ch.daA } },
      { bukva: 'б', pole: { vid: 'danet', verno: ch.daB } },
      {
        bukva: 'в',
        podpis: 'Наибольшее число членов',
        pole: { vid: 'chislo', verno: String(ch.nMax) },
      },
    ],
    otvet: `а) ${otv(ch.daA)}; б) ${otv(ch.daB)}; в) $${ch.nMax}$`,
    reshenie: [
      {
        title: 'Формула суммы',
        lines: [
          `Если $a_1\\ge1$ — первый член, $d\\ge1$ — разность, $n$ — число членов, то $S=na_1+d\\cdot\\dfrac{n(n-1)}{2}=${p.S}$.`,
        ],
      },
      {
        title: 'а) и б)',
        lines: [
          ch.daA
            ? `а) Да, ${primer(p.n1, ch.pA)}.`
            : `а) Нет: при $n=${p.n1}$ ни при каком $d\\ge1$ число $${p.S}-d\\cdot${(p.n1 * (p.n1 - 1)) / 2}$ не делится на $${p.n1}$ с положительным частным.`,
          ch.daB
            ? `б) Да, ${primer(p.n2, ch.pB)}.`
            : `б) Нет: при $n=${p.n2}$ ни при каком $d\\ge1$ число $${p.S}-d\\cdot${(p.n2 * (p.n2 - 1)) / 2}$ не делится на $${p.n2}$ с положительным частным.`,
        ],
      },
      {
        title: 'в) Оценка и пример',
        lines: [
          `Наименьшая сумма $n$ членов — при $a_1=d=1$: $\\dfrac{n(n+1)}{2}\\le${p.S}$. Проверяя допустимые $n$ сверху вниз, первое подходящее — $n=${ch.nMax}$: ${primer(ch.nMax, ch.prMax)}.`,
          `Ответ: а) ${otv(ch.daA)}; б) ${otv(ch.daB)}; в) $${ch.nMax}$.`,
        ],
      },
    ],
    razbor: [
      { slovo: 'Сумма прогрессии', formula: `na_1+d\\frac{n(n-1)}{2}=${p.S}` },
      { slovo: 'Оценка', formula: `\\frac{n(n+1)}{2}\\le${p.S}` },
      { slovo: 'Наибольшее $n$', formula: String(ch.nMax) },
    ],
    kontrol: { daA: ch.daA, daB: ch.daB, nMax: ch.nMax },
  };
}

export const AE20_PROGRESSIYA: Shablon2<PAE20> = {
  no: 20,
  prototip:
    'Теория чисел: арифметическая прогрессия натуральных чисел с заданной суммой, наибольшее число членов',
  sobrat,
};
