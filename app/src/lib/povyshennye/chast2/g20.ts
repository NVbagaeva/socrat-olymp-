/**
 * №20 (варианты 13–14): набор из N различных целых чисел, сумма любых p
 * чисел больше суммы любых q (p < q).
 *
 * Условие равносильно: сумма p наименьших > суммы q наибольших.
 * а) Может ли быть −X? Да: N подряд идущих чисел от −X (при сдвиге вниз
 *    сумма q наибольших уменьшается быстрее).
 * б) Может ли быть X > 0? При q − 1 > p — да: N − 1 подряд идущих чисел
 *    от u и число X (u достаточно мало). При q − 1 = p — нет:
 *    a_N < Σ(a_i − a_{N−q+i}) ≤ −p(N − q) < 0.
 * в) Пусть m — наименьшее из q наибольших, K = N − q. Тогда сумма q
 *    наибольших ≥ qm + q(q−1)/2, сумма p наименьших ≤ pm − A,
 *    A = pK − p(p−1)/2, откуда (q − p)m < −(A + B), m ≤ m*. Сумма всех
 *    ≤ (Km − K(K+1)/2) + (pm − A − 1) — пример даёт равенство.
 */

import type { Chast2Zadacha, Shablon2 } from './types';

export interface PG20 {
  N: number;
  p: number;
  q: number;
  /** а) «может ли быть −X1» (X1 > 0). */
  X1: number;
  /** б) «может ли быть X2» (X2 > 0). */
  X2: number;
}

const SLOVA: Record<number, string> = {
  2: 'двух',
  3: 'трёх',
  4: 'четырёх',
  5: 'пяти',
  6: 'шести',
  7: 'семи',
  8: 'восьми',
};

export function chislaG20(p: PG20) {
  const { N } = p;
  if (!(p.p < p.q && p.q + p.p <= N)) throw new Error('g20: параметры');
  const K = N - p.q;
  const A = p.p * K - (p.p * (p.p - 1)) / 2;
  const B = (p.q * (p.q - 1)) / 2;
  /* (q − p)m < −(A + B). */
  const gr = -(A + B) / (p.q - p.p);
  const mz = Number.isInteger(gr) ? gr - 1 : Math.floor(gr);
  const maks = (K + p.p) * mz - (K * (K + 1)) / 2 - A - 1;
  const e = p.p * mz - A - 1 - (p.q * mz + B);
  const primerV = [
    ...Array.from({ length: K }, (_, i) => mz - K + i),
    ...Array.from({ length: p.q - 1 }, (_, i) => mz + i),
    mz + p.q - 1 + e,
  ];
  /* а) подряд от −X1. */
  const okA = (p.q - p.p) * p.X1 > p.q * (N - 1) - B - (p.p * (p.p - 1)) / 2;
  if (!okA) throw new Error('g20: а) X1 мало');
  const primerA = Array.from({ length: N }, (_, i) => -p.X1 + i);
  /* б) */
  const mozhnoB = p.q - 1 > p.p;
  let primerB: number[] | null = null;
  let u = 0;
  if (mozhnoB) {
    /* (q − 1 − p)u < p(p−1)/2 + (q−1)(q−2)/2 − (q−1)(N−2) − X2. */
    const pr = (p.p * (p.p - 1)) / 2 + ((p.q - 1) * (p.q - 2)) / 2 - (p.q - 1) * (N - 2) - p.X2;
    const g = pr / (p.q - 1 - p.p);
    u = Number.isInteger(g) ? g - 1 : Math.floor(g);
    /* Круглое число для примера. */
    u = Math.floor(u / 10) * 10;
    primerB = [...Array.from({ length: N - 1 }, (_, i) => u + i), p.X2];
  }
  return { K, A, B, gr, mz, maks, e, primerV, primerA, mozhnoB, primerB, u };
}

/** Проверка набора: различные целые, сумма p наименьших > суммы q наибольших. */
export function goditsyaG20(nabor: readonly number[], p: number, q: number): boolean {
  const s = [...nabor].sort((x, y) => x - y);
  if (new Set(s).size !== s.length) return false;
  const niz = s.slice(0, p).reduce((x, y) => x + y, 0);
  const verh = s.slice(-q).reduce((x, y) => x + y, 0);
  return niz > verh;
}

function sobrat(p: PG20): Chast2Zadacha {
  const ch = chislaG20(p);
  const { N } = p;
  const P = SLOVA[p.p] ?? `${p.p}`;
  const Q = SLOVA[p.q] ?? `${p.q}`;
  const uslovie =
    `Для набора ${N} различных целых чисел выполнено, что сумма любых ${P} чисел из этого набора больше суммы любых ${Q} чисел из этого набора.\n` +
    `а) Может ли одним из этих чисел быть число $-${p.X1}$?\n` +
    `б) Может ли одним из этих чисел быть число $${p.X2}$?\n` +
    `в) Какое наибольшее значение может принимать сумма чисел этого набора?`;
  const minusT = (x: number) => (x < 0 ? `-${-x}` : `${x}`);
  const sumP = ch.primerA.slice(0, p.p).reduce((x, y) => x + y, 0);
  const sumQ = ch.primerA.slice(-p.q).reduce((x, y) => x + y, 0);
  const aLines = [
    `Да. Возьмём ${N} подряд идущих целых чисел от $-${p.X1}$ до $${minusT(-p.X1 + N - 1)}$. Сумма ${P} наименьших равна $${minusT(sumP)}$, сумма ${Q} наибольших равна $${minusT(sumQ)}$, и $${minusT(sumP)}>${minusT(sumQ)}$.`,
    `Сумма любых ${P} чисел не меньше суммы ${P} наименьших, сумма любых ${Q} — не больше суммы ${Q} наибольших, поэтому условие выполнено.`,
  ];
  let bLines: string[];
  if (ch.mozhnoB && ch.primerB !== null) {
    const pb = ch.primerB;
    const sp = pb.slice(0, p.p).reduce((x, y) => x + y, 0);
    const sq = [...pb]
      .sort((x, y) => x - y)
      .slice(-p.q)
      .reduce((x, y) => x + y, 0);
    bLines = [
      `Да. Возьмём ${N - 1} подряд идущих чисел от $${minusT(ch.u)}$ до $${minusT(ch.u + N - 2)}$ и число $${p.X2}$. Сумма ${P} наименьших: $${minusT(sp)}$; сумма ${Q} наибольших: $${minusT(sq)}$; $${minusT(sp)}>${minusT(sq)}$.`,
      `Чем меньше остальные числа, тем больше запас: при сдвиге всех чисел, кроме $${p.X2}$, на $1$ вниз левая сумма уменьшается на $${p.p}$, а правая — на $${p.q - 1}$.`,
    ];
  } else {
    bLines = [
      `Нет. Упорядочим числа: $a_1<a_2<\\ldots<a_{${N}}$. Условие для ${P} наименьших и ${Q} наибольших: $a_1+\\ldots+a_{${p.p}}>a_{${N - p.q + 1}}+\\ldots+a_{${N}}$.`,
      `Наибольших чисел без $a_{${N}}$ ровно ${p.q - 1}, столько же, сколько наименьших. Числа различные целые, поэтому $a_{${N - p.q}+i}\\ge a_i+${N - p.q}$ при $i=1,\\ldots,${p.p}$.`,
      `Значит, $a_{${N}}<\\sum_{i=1}^{${p.p}}\\left(a_i-a_{${N - p.q}+i}\\right)\\le-${p.p * (N - p.q)}<0$: все числа набора отрицательны, числа $${p.X2}$ в нём нет.`,
    ];
  }
  const { K, A, B, mz, maks } = ch;
  const vLines = [
    `Упорядочим числа: $a_1<\\ldots<a_{${N}}$, и пусть $m=a_{${K + 1}}$ — наименьшее из ${Q} наибольших. Тогда $a_{${K + 1}+j}\\ge m+j$, и сумма ${Q} наибольших $S_{\\text{в}}\\ge ${p.q}m+${B}$; а $a_{${K + 1}-i}\\le m-i$, поэтому сумма ${P} наименьших $S_{\\text{н}}\\le ${p.p}m-${A}$.`,
    `Из $S_{\\text{н}}>S_{\\text{в}}$: $${p.p}m-${A}>${p.q}m+${B}$, $${p.q - p.p}m<-${A + B}$, то есть $m\\le ${mz}$.`,
    `Сумма всех чисел равна $\\left(a_1+\\ldots+a_{${K}}\\right)+S_{\\text{в}}$. Первая скобка не больше $${K}m-${(K * (K + 1)) / 2}$, а $S_{\\text{в}}\\le S_{\\text{н}}-1\\le ${p.p}m-${A + 1}$. Итого сумма не больше $${K + p.p}m-${(K * (K + 1)) / 2 + A + 1}\\le ${K + p.p}\\cdot(${mz})-${(K * (K + 1)) / 2 + A + 1}=${minusT(maks)}$.`,
    `Пример: числа от $${minusT(mz - K)}$ до $${minusT(mz + p.q - 2)}$ подряд и число $${minusT(ch.primerV[N - 1]!)}$. Сумма ${P} наименьших $${minusT(ch.primerV.slice(0, p.p).reduce((x, y) => x + y, 0))}$ больше суммы ${Q} наибольших $${minusT(ch.primerV.slice(-p.q).reduce((x, y) => x + y, 0))}$, сумма всех равна $${minusT(maks)}$.`,
  ];
  return {
    no: 20,
    shablon: 'g20.summyNabora',
    uslovie,
    risunok: null,
    punkty: [
      { bukva: 'а', pole: { vid: 'danet', verno: true } },
      { bukva: 'б', pole: { vid: 'danet', verno: ch.mozhnoB } },
      { bukva: 'в', podpis: 'Наибольшая сумма', pole: { vid: 'chislo', verno: `${maks}` } },
    ],
    otvet: `а) да; б) ${ch.mozhnoB ? 'да' : 'нет'}; в) $${minusT(maks)}$`,
    reshenie: [
      { title: 'а) Пример', lines: aLines },
      { title: `б) Число $${p.X2}$`, lines: bLines },
      {
        title: 'в) Оценка и пример',
        lines: [...vLines, `Ответ: а) да; б) ${ch.mozhnoB ? 'да' : 'нет'}; в) $${minusT(maks)}$.`],
      },
    ],
    razbor: [
      {
        slovo: 'Достаточно сравнить наименьшие и наибольшие',
        formula: `a_1+\\ldots+a_{${p.p}}>a_{${K + 1}}+\\ldots+a_{${N}}`,
      },
      {
        slovo: 'а) Подряд идущие числа, сдвинутые вниз',
        formula: `-${p.X1},\\ldots,${minusT(-p.X1 + N - 1)}`,
      },
      { slovo: 'в) Оценка через $m=a_{' + (K + 1) + '}$', formula: `m\\le ${mz}` },
      { slovo: 'в) Ответ', formula: minusT(maks) },
    ],
    kontrol: {
      maks,
      mozhnoB: ch.mozhnoB,
      primerV: ch.primerV,
      primerA: ch.primerA,
      primerB: ch.primerB ?? [],
    },
  };
}

export const G20_SUMMY_NABORA: Shablon2<PG20> = {
  no: 20,
  prototip:
    'Набор различных целых чисел: сумма любых p больше суммы любых q; отрицательное и положительное число, наибольшая сумма',
  sobrat,
};
