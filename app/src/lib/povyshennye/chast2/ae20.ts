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

/**
 * Признак: прогрессия из n натуральных членов с суммой S существует
 * тогда и только тогда, когда
 * — n нечётно: n | S и S/n ≥ (n + 1)/2 (средний член и d = 1);
 * — n = 2k: k | S, q = S/k; при нечётном q нужно q ≥ 2k + 1 (d = 1),
 *   при чётном q нужно q ≥ 4k (d = 2): 2a₁ = q − d(2k − 1), d ≡ q (mod 2).
 * Возвращает пример (a₁, d) или причину отказа — строкой для решения.
 */
export function priznakAE20(
  S: number,
  n: number,
): { ok: true; a1: number; d: number } | { ok: false; prichina: string } {
  if (n % 2 === 1) {
    if (S % n !== 0)
      return { ok: false, prichina: `$${n}$ нечётно, а $${S}$ не делится на $${n}$` };
    const m = S / n;
    if (m < (n + 1) / 2)
      return {
        ok: false,
        prichina: `средний член $${S}:${n}=${m}$ меньше $${(n + 1) / 2}$`,
      };
    return { ok: true, a1: m - (n - 1) / 2, d: 1 };
  }
  const k = n / 2;
  if (S % k !== 0) return { ok: false, prichina: `$${S}$ не делится на $${k}$` };
  const q = S / k;
  if (q % 2 === 1) {
    if (q < 2 * k + 1) return { ok: false, prichina: `$${S}:${k}=${q}<${2 * k + 1}$` };
    return { ok: true, a1: (q - (2 * k - 1)) / 2, d: 1 };
  }
  if (q < 4 * k)
    return {
      ok: false,
      prichina: `$${S}:${k}=${q}$ чётно, поэтому $d$ чётно, $d\\ge2$, а $${q}<2+2\\cdot${2 * k - 1}=${4 * k}$`,
    };
  return { ok: true, a1: (q - 2 * (2 * k - 1)) / 2, d: 2 };
}

export function primerAE20(S: number, n: number): [number, number] | null {
  const r = priznakAE20(S, n);
  return r.ok ? [r.a1, r.d] : null;
}

export function chislaAE20(p: PAE20) {
  const pA = primerAE20(p.S, p.n1);
  const pB = primerAE20(p.S, p.n2);
  let N0 = 1;
  while (((N0 + 1) * (N0 + 2)) / 2 <= p.S) N0 += 1;
  let nMax = N0;
  while (nMax >= 2 && primerAE20(p.S, nMax) === null) nMax -= 1;
  const prMax = primerAE20(p.S, nMax);
  if (prMax === null || nMax < 2) throw new Error('ae20: нет прогрессии');
  if (N0 - nMax > 2) throw new Error('ae20: длинная оценка');
  return { daA: pA !== null, pA, daB: pB !== null, pB, nMax, prMax, N0 };
}

function sobrat(p: PAE20): Chast2Zadacha {
  const ch = chislaAE20(p);
  const otv = (b: boolean) => (b ? 'да' : 'нет');
  const chleny = (pr: [number, number], n: number) => {
    const t = Array.from({ length: n }, (_, i) => pr[0] + i * pr[1]);
    return n <= 6 ? t.join(',\\ ') : `${t[0]},\\ ${t[1]},\\ ${t[2]},\\ \\ldots,\\ ${t[n - 1]}`;
  };
  const punkt = (n: number) => {
    const r = priznakAE20(p.S, n);
    return r.ok
      ? `да: $a_1=${r.a1}$, $d=${r.d}$ — члены $${chleny([r.a1, r.d], n)}$, их сумма $${n}\\cdot${r.a1}+${r.d}\\cdot\\dfrac{${n}\\cdot${n - 1}}{2}=${p.S}$`
      : `нет: ${r.prichina}`;
  };
  const otkazy: string[] = [];
  for (let n = ch.N0; n > ch.nMax; n -= 1) {
    const r = priznakAE20(p.S, n);
    if (!r.ok) otkazy.push(`$n=${n}$: ${r.prichina}`);
  }
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
        title: 'Когда прогрессия существует',
        lines: [
          `Пусть $a_1\\ge1$ — первый член, $d\\ge1$ — разность, $n$ — число членов: $S=na_1+d\\cdot\\dfrac{n(n-1)}{2}=${p.S}$.`,
          `Если $n$ нечётно, то $\\dfrac{S}{n}=a_1+d\\cdot\\dfrac{n-1}{2}$ — средний член, он натуральный и не меньше $1+\\dfrac{n-1}{2}=\\dfrac{n+1}{2}$. Обратно, если $n\\mid S$ и $\\dfrac{S}{n}\\ge\\dfrac{n+1}{2}$, подходит $d=1$.`,
          `Если $n=2k$, то $S=k\\bigl(2a_1+d(2k-1)\\bigr)$: число $q=\\dfrac{S}{k}$ натуральное, а $2a_1=q-d(2k-1)$ чётно, поэтому $d$ той же чётности, что $q$. При нечётном $q$ наименьшее $d=1$ и нужно $q\\ge2k+1$; при чётном $q$ наименьшее $d=2$ и нужно $q\\ge4k$. Эти условия и достаточны.`,
        ],
      },
      {
        title: 'а) и б)',
        lines: [`а) При $n=${p.n1}$ — ${punkt(p.n1)}.`, `б) При $n=${p.n2}$ — ${punkt(p.n2)}.`],
      },
      {
        title: 'в) Оценка и пример',
        lines: [
          `Члены — различные натуральные числа, поэтому $S\\ge1+2+\\ldots+n=\\dfrac{n(n+1)}{2}$. Так как $\\dfrac{${ch.N0 + 1}\\cdot${ch.N0 + 2}}{2}=${((ch.N0 + 1) * (ch.N0 + 2)) / 2}>${p.S}$, имеем $n\\le${ch.N0}$.`,
          ...(otkazy.length > 0 ? [`По признаку не подходят: ${otkazy.join('; ')}.`] : []),
          `При $n=${ch.nMax}$ прогрессия есть: ${punkt(ch.nMax).slice(4)}.`,
          `Ответ: а) ${otv(ch.daA)}; б) ${otv(ch.daB)}; в) $${ch.nMax}$.`,
        ],
      },
    ],
    razbor: [
      { slovo: 'Сумма прогрессии', formula: `na_1+d\\frac{n(n-1)}{2}=${p.S}` },
      { slovo: 'Оценка', formula: `\\frac{n(n+1)}{2}\\le${p.S}\\ \\Rightarrow\\ n\\le${ch.N0}` },
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
