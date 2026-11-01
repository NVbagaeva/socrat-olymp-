/**
 * №20 (варианты 31–36), свои задачи раздела: теория чисел, а) и б) —
 * «может ли», в) — наибольшее или наименьшее значение.
 *   ceny     — цену (целое число рублей) повысили на p % и понизили на
 *              p %, после каждого шага цена целая;
 *   deliteli — у N ровно k делителей: квадрат ли N, может ли N делиться
 *              на 30, наименьшее N;
 *   srednie  — несколько различных чисел из 1…N: среднее арифметическое.
 */

import type { Chast2Zadacha, Shablon2 } from './types';

export type PR20 =
  | { vid: 'ceny'; aTip: 'D' | 'ravno'; D: number; P0: number; p0: number }
  | { vid: 'deliteli'; k: number }
  | { vid: 'srednie'; N: number; A1: [number, number]; D: number; A2: number };

const nod = (a: number, b: number): number => (b === 0 ? Math.abs(a) : nod(b, a % b));
const nok = (a: number, b: number): number => (a / nod(a, b)) * b;

/** Цепочка цен при повышении и понижении на p %; null — не целая. */
export function cepochka(P: number, p: number): [number, number] | null {
  const a = P * (100 + p);
  if (a % 100 !== 0) return null;
  const b = (a / 100) * (100 - p);
  if (b % 100 !== 0) return null;
  return [a / 100, b / 100];
}

/** Разложения k на множители ≥ 2 по невозрастанию. */
function razlozheniya(k: number, max = k): number[][] {
  if (k === 1) return [[]];
  const out: number[][] = [];
  for (let f = Math.min(k, max); f >= 2; f -= 1)
    if (k % f === 0) for (const r of razlozheniya(k / f, f)) out.push([f, ...r]);
  return out;
}

const PROSTYE = [2, 3, 5, 7, 11, 13];

export function chislaR20(p: PR20) {
  if (p.vid === 'ceny') {
    /* б) */
    let primerB: { p: number; c: [number, number] } | null = null;
    for (let q = 1; q < 100 && primerB === null; q += 1) {
      const c = cepochka(p.P0, q);
      if (c !== null) primerB = { p: q, c };
    }
    const vzaimnoProsto = nod(p.P0, 10) === 1;
    if (primerB === null && !vzaimnoProsto) throw new Error('r20: б) без доказательства');
    if (primerB !== null && vzaimnoProsto) throw new Error('r20: б) противоречие');
    /* в) */
    const d1 = 100 / nod(100, 100 + p.p0);
    const d2 = 10000 / nod(10000, (100 + p.p0) * (100 - p.p0));
    const M = nok(d1, d2);
    const cM = cepochka(M, p.p0);
    if (cM === null) throw new Error('r20: НОК не подходит');
    return { otvA: p.aTip === 'D', otvB: primerB !== null, primerB, d1, d2, M, cM };
  }
  if (p.vid === 'deliteli') {
    const k = p.k;
    const raz = razlozheniya(k);
    const kandidaty = raz.map((r) => ({
      r,
      N: r.reduce((acc, f, i) => acc * PROSTYE[i]! ** (f - 1), 1),
    }));
    const min = kandidaty.reduce((a, b) => (b.N < a.N ? b : a));
    const tri = raz.filter((r) => r.length >= 3).sort((a, b) => a.length - b.length)[0] ?? null;
    let primer30: number | null = null;
    if (tri !== null) {
      /* Три множителя: первые два из разложения, остальные — в третий. */
      const f1 = tri[0]!;
      const f2 = tri[1]!;
      const f3 = k / (f1 * f2);
      primer30 = 2 ** (f1 - 1) * 3 ** (f2 - 1) * 5 ** (f3 - 1);
      return { kvadrat: k % 2 === 1, d30: true, primer30, f: [f1, f2, f3], kandidaty, min };
    }
    return { kvadrat: k % 2 === 1, d30: false, primer30, f: null, kandidaty, min };
  }
  /* srednie */
  const { N, A1, D, A2 } = p;
  const a1 = A1[0] / A1[1];
  let primerA: number[] | null = null;
  for (let n = 2; n <= N && primerA === null; n += 1) {
    const S = (n * A1[0]) / A1[1];
    if (!Number.isInteger(S)) continue;
    if (S < (n * (n + 1)) / 2 || S > (n * (2 * N - n + 1)) / 2) continue;
    /* Строим набор: 1…n, затем двигаем числа с конца вверх. */
    const set = Array.from({ length: n }, (_, i) => i + 1);
    let ost = S - (n * (n + 1)) / 2;
    for (let i = n - 1; i >= 0 && ost > 0; i -= 1) {
      const potolok = N - (n - 1 - i);
      const shag = Math.min(ost, potolok - set[i]!);
      set[i] = set[i]! + shag;
      ost -= shag;
    }
    if (ost === 0) primerA = set;
  }
  if (primerA === null && !(a1 > N - 0.5 || a1 < 1.5))
    throw new Error('r20: а) без доказательства');
  /* б) Пример: набор из 2–3 чисел и число B = среднее + D(n + 1). */
  let primerB: { set: number[]; B: number } | null = null;
  for (let n = 2; n <= 3 && primerB === null; n += 1) {
    const perebor = (start: number, acc: number[]): void => {
      if (primerB !== null) return;
      if (acc.length === n) {
        const S = acc.reduce((s, x) => s + x, 0);
        const B = S / n + D * (n + 1);
        if (Number.isInteger(B) && B <= N && !acc.includes(B)) primerB = { set: [...acc], B };
        return;
      }
      for (let x = start; x <= N; x += 1) perebor(x + 1, [...acc, x]);
    };
    perebor(1, []);
  }
  if (primerB === null && !(3 * (D + 0.5) > N)) throw new Error('r20: б) без доказательства');
  const n1 = 2 * A2 - 1;
  const n2 = 2 * N - 2 * A2 + 1;
  if (!(A2 >= 2 && A2 <= N - 1)) throw new Error('r20: A2');
  const nMax = Math.min(n1, n2);
  return { primerA, primerB: primerB as { set: number[]; B: number } | null, n1, n2, nMax };
}

const DA = (b: boolean) => (b ? 'да' : 'нет');

function sobrat(p: PR20): Chast2Zadacha {
  let uslovie = '';
  let reshenie: Chast2Zadacha['reshenie'] = [];
  let razbor: Chast2Zadacha['razbor'] = [];
  let a = false;
  let b = false;
  let v = 0;
  if (p.vid === 'ceny') {
    const ch = chislaR20(p) as Extract<ReturnType<typeof chislaR20>, { M: number }>;
    a = ch.otvA;
    b = ch.otvB;
    v = ch.M;
    uslovie = [
      'Цена товара — целое число рублей. Её сначала увеличили на $p\\,\\%$, а затем уменьшили на $p\\,\\%$, где $p$ — натуральное число, меньшее $100$. После каждого изменения цена была целым числом рублей.',
      p.aTip === 'D'
        ? `а) Могла ли итоговая цена оказаться на ${p.D} ${p.D === 1 ? 'рубль' : p.D < 5 ? 'рубля' : 'рублей'} меньше исходной?`
        : 'а) Могла ли итоговая цена оказаться равной исходной?',
      `б) Могла ли исходная цена быть равной ${p.P0} рублям?`,
      `в) Известно, что $p=${p.p0}$. Найдите наименьшую возможную исходную цену.`,
    ].join('\n');
    const prB = ch.primerB;
    reshenie = [
      {
        title: 'а)',
        lines: [
          'Если исходная цена $P$, то итоговая $P\\cdot\\dfrac{100+p}{100}\\cdot\\dfrac{100-p}{100}=P\\left(1-\\dfrac{p^2}{10\\,000}\\right)$, она меньше $P$ на $\\dfrac{Pp^2}{10\\,000}$.',
          p.aTip === 'D'
            ? `Да: $P=${100 * p.D}$, $p=10$: $${100 * p.D}\\to${110 * p.D}\\to${99 * p.D}$ — цена уменьшилась на ${p.D}.`
            : 'Нет: разность $\\dfrac{Pp^2}{10\\,000}$ положительна, итоговая цена всегда меньше исходной.',
        ],
      },
      {
        title: 'б)',
        lines: [
          prB !== null
            ? `Да: при $p=${prB.p}$ получаем $${p.P0}\\to${prB.c[0]}\\to${prB.c[1]}$ — все цены целые.`
            : `Нет. После первого шага цена $\\dfrac{${p.P0}(100+p)}{100}$ — целая, значит, $${p.P0}(100+p)$ делится на $100$. Число $${p.P0}$ взаимно просто с $10$, поэтому $100+p$ делится на $100$, то есть $p$ делится на $100$, — но $0<p<100$.`,
        ],
      },
      {
        title: 'в)',
        lines: [
          `После повышения цена $\\dfrac{${100 + p.p0}P}{100}$ целая $\\Leftrightarrow$ $P$ делится на $\\dfrac{100}{\\text{НОД}(100,\\ ${100 + p.p0})}=${ch.d1}$.`,
          `Итоговая цена $\\dfrac{${(100 + p.p0) * (100 - p.p0)}P}{10\\,000}$ целая $\\Leftrightarrow$ $P$ делится на $\\dfrac{10\\,000}{\\text{НОД}(10\\,000,\\ ${(100 + p.p0) * (100 - p.p0)})}=${ch.d2}$.`,
          `Значит, $P$ делится на $\\text{НОК}(${ch.d1},\\ ${ch.d2})=${ch.M}$, и $P\\ge${ch.M}$. При $P=${ch.M}$: $${ch.M}\\to${ch.cM[0]}\\to${ch.cM[1]}$. Ответ: $${ch.M}$.`,
        ],
      },
    ];
    razbor = [
      { slovo: 'Итоговая цена', formula: 'P\\left(1-\\frac{p^2}{10\\,000}\\right)' },
      { slovo: 'Целая цена — условие делимости', formula: 'P(100+p)\\ \\vdots\\ 100' },
      {
        slovo: 'Наименьшая цена — НОК делителей',
        formula: `\\text{НОК}(${ch.d1},${ch.d2})=${ch.M}`,
      },
    ];
  } else if (p.vid === 'deliteli') {
    const ch = chislaR20(p) as Extract<ReturnType<typeof chislaR20>, { kandidaty: unknown }>;
    a = ch.kvadrat;
    b = ch.d30;
    v = ch.min.N;
    const k = p.k;
    const f = ch.f;
    uslovie = [
      `Натуральное число $N$ имеет ровно ${k} натуральных делителей (включая $1$ и $N$).`,
      'а) Может ли $N$ быть квадратом натурального числа?',
      'б) Может ли $N$ делиться на $30$?',
      'в) Найдите наименьшее возможное значение $N$.',
    ].join('\n');
    const kandT = ch.kandidaty
      .map(
        (c) =>
          `$${c.r.join('\\cdot')}$: $N=${c.r.map((e, i) => (e - 1 === 1 ? `${PROSTYE[i]}` : `${PROSTYE[i]}^{${e - 1}}`)).join('\\cdot')}=${c.N}$`,
      )
      .join('; ');
    reshenie = [
      {
        title: 'а)',
        lines: [
          'Делители $N$ разбиваются на пары $d$ и $\\dfrac{N}{d}$; без пары остаётся только $d=\\sqrt N$, если $N$ — квадрат. Поэтому у квадрата число делителей нечётно, у остальных — чётно.',
          ch.kvadrat
            ? `$${k}$ нечётно — да: $N=2^{${k - 1}}=\\left(2^{${(k - 1) / 2}}\\right)^2$ имеет ровно ${k} делителей.`
            : `$${k}$ чётно — нет.`,
        ],
      },
      {
        title: 'б)',
        lines: [
          'Если $N=p_1^{e_1}\\cdots p_s^{e_s}$, то число делителей равно $(e_1+1)\\cdots(e_s+1)$. Если $N$ делится на $30$, то в разложении есть $2$, $3$ и $5$, и число делителей — произведение не менее трёх множителей, каждый не меньше $2$.',
          f !== null
            ? `$${k}=${f.join('\\cdot')}$ — да: $N=2^{${f[0]! - 1}}\\cdot3^{${f[1]! - 1}}\\cdot5^{${f[2]! - 1}}=${ch.primer30}$ делится на $30$ и имеет $${f.join('\\cdot')}=${k}$ делителей.`
            : `$${k}$ нельзя записать произведением трёх множителей, не меньших $2$, — нет.`,
        ],
      },
      {
        title: 'в)',
        lines: [
          `Наборы показателей $(e_i+1)$ — разложения числа ${k}; при данном наборе $N$ наименьшее, когда большие показатели стоят у меньших простых: ${kandT}.`,
          `Наименьшее из этих чисел — $${ch.min.N}$.`,
        ],
      },
    ];
    razbor = [
      { slovo: 'Делители разбиваются на пары', formula: 'd\\leftrightarrow \\tfrac{N}{d}' },
      { slovo: 'Число делителей', formula: '(e_1+1)(e_2+1)\\cdots' },
      { slovo: 'Наименьшее число', formula: `${ch.min.N}` },
    ];
  } else {
    const ch = chislaR20(p) as Extract<ReturnType<typeof chislaR20>, { nMax: number }>;
    a = ch.primerA !== null;
    b = ch.primerB !== null;
    v = ch.nMax;
    const A1t = p.A1[1] === 1 ? `${p.A1[0]}` : `\\dfrac{${p.A1[0]}}{${p.A1[1]}}`;
    uslovie = [
      `Из натуральных чисел от $1$ до $${p.N}$ выбрали несколько (не менее двух) различных чисел.`,
      `а) Может ли среднее арифметическое выбранных чисел быть равным $${A1t}$?`,
      `б) К выбранным числам добавили ещё одно число от $1$ до $${p.N}$, которого среди них не было. Могло ли среднее арифметическое увеличиться ровно на $${p.D}$?`,
      `в) Среднее арифметическое выбранных чисел равно $${p.A2}$. Какое наибольшее количество чисел могло быть выбрано?`,
    ].join('\n');
    const pA = ch.primerA;
    const pB = ch.primerB;
    reshenie = [
      {
        title: 'а)',
        lines: [
          pA !== null
            ? `Да: числа $${pA.join(',\\ ')}$, их сумма $${pA.reduce((s, x) => s + x, 0)}$, среднее $\\dfrac{${pA.reduce((s, x) => s + x, 0)}}{${pA.length}}=${A1t}$.`
            : p.A1[0] / p.A1[1] > p.N - 0.5
              ? `Нет. У $n\\ge2$ различных чисел, не больших $${p.N}$, сумма не больше $${p.N}+${p.N - 1}+\\ldots$, среднее не больше $\\dfrac{${p.N}+${p.N - 1}}{2}=${p.N}-\\dfrac12<${A1t}$.`
              : `Нет. У $n\\ge2$ различных натуральных чисел среднее не меньше $\\dfrac{1+2}{2}=\\dfrac32>${A1t}$.`,
        ],
      },
      {
        title: 'б)',
        lines: [
          'Пусть выбрано $n$ чисел с суммой $S$, добавили $B$. Среднее увеличилось на $D$, если $\\dfrac{S+B}{n+1}=\\dfrac{S}{n}+D$, то есть $B=\\dfrac{S}{n}+D(n+1)$.',
          pB !== null
            ? `Да: числа $${pB.set.join(',\\ ')}$ (среднее $${pB.set.reduce((s, x) => s + x, 0) / pB.set.length}$), добавим $${pB.B}$: среднее $\\dfrac{${pB.set.reduce((s, x) => s + x, 0) + pB.B}}{${pB.set.length + 1}}=${(pB.set.reduce((s, x) => s + x, 0) + pB.B) / (pB.set.length + 1)}$ — больше на $${p.D}$.`
            : `Нет: $\\dfrac{S}{n}\\ge\\dfrac{n+1}{2}$, поэтому $B\\ge(n+1)\\left(${p.D}+\\dfrac12\\right)\\ge3\\cdot${p.D + 0.5}>${p.N}$.`,
        ],
      },
      {
        title: 'в) Оценка',
        lines: [
          `Пусть выбрано $n$ чисел. Их сумма $${p.A2}n$ не меньше $1+2+\\ldots+n=\\dfrac{n(n+1)}{2}$, откуда $n\\le${ch.n1}$, и не больше $${p.N}+${p.N - 1}+\\ldots+(${p.N}-n+1)=\\dfrac{n(${2 * p.N + 1}-n)}{2}$, откуда $n\\le${ch.n2}$. Значит, $n\\le${ch.nMax}$.`,
        ],
      },
      {
        title: 'в) Пример',
        lines: [
          ch.n1 <= ch.n2
            ? `Числа $1,\\ 2,\\ \\ldots,\\ ${ch.n1}$: их среднее $\\dfrac{1+${ch.n1}}{2}=${p.A2}$. Ответ: $${ch.nMax}$.`
            : `Числа $${2 * p.A2 - p.N},\\ \\ldots,\\ ${p.N}$: их среднее $\\dfrac{${2 * p.A2 - p.N}+${p.N}}{2}=${p.A2}$. Ответ: $${ch.nMax}$.`,
        ],
      },
    ];
    razbor = [
      { slovo: 'Границы суммы различных чисел', formula: '\\tfrac{n(n+1)}{2}\\le S' },
      { slovo: 'Условие на добавленное число', formula: 'B=\\tfrac{S}{n}+D(n+1)' },
      { slovo: 'Оценка плюс пример', formula: `n_{\\max}=${ch.nMax}` },
    ];
  }
  return {
    no: 20,
    shablon: 'r20.teoriyaChisel',
    uslovie,
    risunok: null,
    punkty: [
      { bukva: 'а', pole: { vid: 'danet', verno: a } },
      { bukva: 'б', pole: { vid: 'danet', verno: b } },
      { bukva: 'в', podpis: 'Ответ', pole: { vid: 'chislo', verno: `${v}` } },
    ],
    otvet: `а) ${DA(a)}; б) ${DA(b)}; в) $${v}$`,
    reshenie,
    razbor,
    kontrol: { a, b, v },
  };
}

export const R20_TEORIYA_CHISEL: Shablon2<PR20> = {
  no: 20,
  prototip:
    'Теория чисел: проценты и целые цены; число делителей; среднее арифметическое различных чисел (оценка и пример)',
  sobrat,
};
