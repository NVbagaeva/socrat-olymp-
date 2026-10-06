/**
 * Группа A — длина вектора: A1…A8.
 *
 * Длина всегда целая или конечная десятичная дробь по построению:
 * результирующий вектор либо берётся из списка пифагоровых (A1, A2,
 * A5), либо подбирается перебором вектора a при заданных остальных
 * (A3, A4, A6–A8). Для десятичных коэффициентов (A4, A8) счёт идёт в
 * целых числах, умноженных на 10, и ответ — целая длина, делённая
 * на 10. Числа исходника — в isklyucheniya.
 */

import type { Rng } from '../../veroyatnost/generator';
import { nice } from '../../vychisleniya/numbers';
import { OKNO_DVA, OKNO_TRI, razmestit } from '../razmeshchenie';
import { kombinatsiya, modul, vec } from '../tex';
import { dlina, komb, kosoy, pifagorovy, tselayaDlina } from '../troyki';
import type { Prototype, Risunok, Tochka, Vektor } from '../types';
import {
  dany,
  izobrazheny,
  keys,
  naydiDlinu,
  shagDlina,
  shagKombinatsiya,
  shagOtvet,
  shagPoRisunku,
  signatureOf,
  sluchaynyy,
} from './common';

/* ── Общее ──────────────────────────────────────────────────────── */

/**
 * Перебор вектора a: при данных остальных слагаемых ищутся все a с
 * |x|, |y| ≤ bound, при которых длина R = ka·a + rest целая и R ≠ 0;
 * один из них выбирается случайно. scale = 10 у десятичных
 * коэффициентов: тогда ka и rest уже умножены на 10.
 */
function podobratA(
  r: Rng,
  ka: number,
  rest: Tochka,
  bound: number,
  maxR: number,
): { a: Tochka; R: Tochka; len: number } | null {
  const found: { a: Tochka; R: Tochka; len: number }[] = [];
  for (let x = -bound; x <= bound; x += 1) {
    for (let y = -bound; y <= bound; y += 1) {
      const a: Tochka = [x, y];
      if (dlina(a) < 2 || !kosoy(a)) continue;
      const R: Tochka = [ka * x + rest[0], ka * y + rest[1]];
      /* Результат — косой: ноль в координате делает задачу тривиальной. */
      if (!kosoy(R)) continue;
      if (Math.abs(R[0]) > maxR || Math.abs(R[1]) > maxR) continue;
      const len = tselayaDlina(R);
      if (len === null) continue;
      found.push({ a, R, len });
    }
  }
  if (found.length === 0) {
    return null;
  }
  return found[r.int(0, found.length - 1)] as { a: Tochka; R: Tochka; len: number };
}

function risunok(vectors: Vektor[], okno: Risunok['window']): Risunok {
  const names = vectors.map((v) => v.name).join(', ');
  return { vectors, window: okno, alt: `Векторы ${names} на координатной плоскости` };
}

/* ── A1 ─────────────────────────────────────────────────────────── */

export const A1: Prototype = {
  id: 'A1',
  gruppa: 'A',
  nazvanie: 'Длина вектора по координатам',
  format: 'coords',
  formula: modul(vec('a')),
  isklyucheniya: keys([
    { x: 6, y: -8 },
    { x: -12, y: 5 },
  ]),
  generate(r) {
    const a = r.pick(pifagorovy(30));
    const len = tselayaDlina(a) as number;
    return {
      uslovie: naydiDlinu(`${vec('a')}(${a[0]};\\ ${a[1]})`),
      risunok: null,
      otvet: len,
      proverka: Math.hypot(a[0], a[1]),
      shagi: [shagDlina('a', a, len), shagOtvet(len)],
      params: { x: a[0], y: a[1] },
      signature: signatureOf([a]),
    };
  },
};

/* ── A2 ─────────────────────────────────────────────────────────── */

export const A2: Prototype = {
  id: 'A2',
  gruppa: 'A',
  nazvanie: 'Длина суммы или разности',
  format: 'coords',
  formula: modul(`${vec('a')}+${vec('b')}`),
  isklyucheniya: keys([
    { ax: -4, ay: 5, bx: -5, by: 7, znak: 1 },
    { ax: 9, ay: -6, bx: 1, by: 9, znak: -1 },
  ]),
  generate(r) {
    const znak = r.pick([1, -1]);
    const R = r.pick(pifagorovy(26));
    const a = sluchaynyy(r, 20, { pryamoy: 1 / 6 });
    const b: Tochka = znak === 1 ? [R[0] - a[0], R[1] - a[1]] : [a[0] - R[0], a[1] - R[1]];
    if (Math.abs(b[0]) > 20 || Math.abs(b[1]) > 20 || dlina(b) < 2) return null;
    const len = tselayaDlina(R) as number;
    const terms = [
      [1, 'a', a],
      [znak, 'b', b],
    ] as const;
    return {
      uslovie: `${dany([
        ['a', a],
        ['b', b],
      ])} ${naydiDlinu(
        kombinatsiya([
          [1, 'a'],
          [znak, 'b'],
        ]),
      )}`,
      risunok: null,
      otvet: len,
      proverka: Math.hypot(a[0] + znak * b[0], a[1] + znak * b[1]),
      shagi: [shagKombinatsiya(terms, R, 'c'), shagDlina('c', R, len), shagOtvet(len)],
      params: { ax: a[0], ay: a[1], bx: b[0], by: b[1], znak },
      signature: signatureOf([a, b]),
    };
  },
};

/* ── A3 ─────────────────────────────────────────────────────────── */

const KOEF_A3: readonly (readonly [number, number])[] = [
  [8, 1],
  [1, 3],
  [1, -4],
  [1, -24],
  [1, 2],
  [2, 1],
  [3, -1],
  [1, -2],
  [5, 1],
  [1, 5],
  [2, -3],
  [3, 2],
  [1, -6],
  [4, 1],
  [1, 12],
  [1, -8],
  [6, -1],
  [2, 5],
  [7, 1],
  [1, -3],
];

export const A3: Prototype = {
  id: 'A3',
  gruppa: 'A',
  nazvanie: 'Длина с целыми коэффициентами',
  format: 'coords',
  formula: modul(`8${vec('a')}+${vec('b')}`),
  isklyucheniya: keys([
    { ax: 1, ay: 1, bx: 0, by: 7, k: 8, m: 1 },
    { ax: 2, ay: 0, bx: 1, by: 4, k: 1, m: 3 },
    { ax: 25, ay: 0, bx: 1, by: -5, k: 1, m: -4 },
    { ax: 31, ay: 0, bx: 1, by: -1, k: 1, m: -24 },
  ]),
  generate(r) {
    const [k, m] = r.pick(KOEF_A3);
    const b = sluchaynyy(r, Math.abs(m) >= 8 ? 3 : 9, { pryamoy: 1 / 6 });
    const bound = k === 1 ? 30 : Math.floor(40 / k);
    const got = podobratA(r, k, [m * b[0], m * b[1]], bound, 40);
    if (got === null) return null;
    const { a, R, len } = got;
    const terms = [
      [k, 'a', a],
      [m, 'b', b],
    ] as const;
    return {
      uslovie: `${dany([
        ['a', a],
        ['b', b],
      ])} ${naydiDlinu(
        kombinatsiya([
          [k, 'a'],
          [m, 'b'],
        ]),
      )}`,
      risunok: null,
      otvet: len,
      proverka: Math.hypot(k * a[0] + m * b[0], k * a[1] + m * b[1]),
      shagi: [shagKombinatsiya(terms, R, 'c'), shagDlina('c', R, len), shagOtvet(len)],
      params: { ax: a[0], ay: a[1], bx: b[0], by: b[1], k, m },
      signature: signatureOf([a, b]),
      vid: `${k}:${m}`,
    };
  },
};

/* ── A4 ─────────────────────────────────────────────────────────── */

/** Десятичные коэффициенты, умноженные на 10. */
const KOEF_A4: readonly (readonly [number, number])[] = [
  [11, -6],
  [14, -5],
  [5, 12],
  [15, -8],
  [21, 4],
  [3, 11],
  [12, -7],
  [6, 9],
  [13, -4],
  [8, 15],
  [9, -12],
  [7, 6],
  [16, -3],
  [4, 13],
  [18, -5],
];

export const A4: Prototype = {
  id: 'A4',
  gruppa: 'A',
  nazvanie: 'Длина с десятичными коэффициентами',
  format: 'coords',
  formula: modul(`1{,}1${vec('a')}-0{,}6${vec('b')}`),
  isklyucheniya: keys([
    { ax: -3, ay: 4, bx: -9, by: 4, p: 11, q: -6 },
    { ax: 5, ay: 6, bx: 16, by: 12, p: 14, q: -5 },
  ]),
  generate(r) {
    const [P, Q] = r.pick(KOEF_A4);
    const b = sluchaynyy(r, 16, { pryamoy: 1 / 6 });
    const got = podobratA(r, P, [Q * b[0], Q * b[1]], 16, 70);
    if (got === null) return null;
    const { a, R, len } = got;
    const otvet = len / 10;
    if (!nice(otvet, 1)) return null;
    const p = P / 10;
    const q = Q / 10;
    const result: Tochka = [R[0] / 10, R[1] / 10];
    const terms = [
      [p, 'a', a],
      [q, 'b', b],
    ] as const;
    return {
      uslovie: `${dany([
        ['a', a],
        ['b', b],
      ])} ${naydiDlinu(
        kombinatsiya([
          [p, 'a'],
          [q, 'b'],
        ]),
      )}`,
      risunok: null,
      otvet,
      proverka: Math.hypot(p * a[0] + q * b[0], p * a[1] + q * b[1]),
      shagi: [
        shagKombinatsiya(terms, result, 'c'),
        shagDlina('c', result, otvet),
        shagOtvet(otvet),
      ],
      params: { ax: a[0], ay: a[1], bx: b[0], by: b[1], p: P, q: Q },
      signature: signatureOf([a, b]),
      vid: `${P}:${Q}`,
    };
  },
};

/* ── A5 ─────────────────────────────────────────────────────────── */

const KOEF_A5: readonly (readonly [number, number, number])[] = [
  [1, 1, 1],
  [1, -1, -1],
  [1, 2, -3],
  [1, -1, 4],
  [1, 1, -2],
  [1, -2, 1],
  [1, 3, -1],
  [1, -3, 2],
  [1, 2, 2],
  [1, -1, -3],
  [1, 1, 3],
  [1, -2, -2],
];

export const A5: Prototype = {
  id: 'A5',
  gruppa: 'A',
  nazvanie: 'Три вектора по координатам',
  format: 'coords',
  formula: modul(`${vec('a')}+${vec('b')}+${vec('c')}`),
  isklyucheniya: keys([
    { ax: -1, ay: 9, bx: 7, by: -2, cx: 14, cy: 8, m: 1, n: 1 },
    { ax: 12, ay: 10, bx: 7, by: -11, cx: -2, cy: -3, m: -1, n: -1 },
    { ax: 2, ay: -4, bx: 4, by: 5, cx: -1, cy: 2, m: 2, n: -3 },
    { ax: 3, ay: 1, bx: -5, by: 6, cx: -2, cy: 4, m: -1, n: 4 },
  ]),
  generate(r) {
    const [, m, n] = r.pick(KOEF_A5);
    const R = r.pick(pifagorovy(26));
    const small = Math.max(Math.abs(m), Math.abs(n)) >= 3 ? 7 : 12;
    const b = sluchaynyy(r, small, { pryamoy: 1 / 6 });
    const c = sluchaynyy(r, small, { pryamoy: 1 / 6 });
    const a: Tochka = [R[0] - m * b[0] - n * c[0], R[1] - m * b[1] - n * c[1]];
    if (Math.abs(a[0]) > 30 || Math.abs(a[1]) > 30 || dlina(a) < 2) return null;
    const len = tselayaDlina(R) as number;
    const terms = [
      [1, 'a', a],
      [m, 'b', b],
      [n, 'c', c],
    ] as const;
    return {
      uslovie: `${dany([
        ['a', a],
        ['b', b],
        ['c', c],
      ])} ${naydiDlinu(
        kombinatsiya([
          [1, 'a'],
          [m, 'b'],
          [n, 'c'],
        ]),
      )}`,
      risunok: null,
      otvet: len,
      proverka: Math.hypot(a[0] + m * b[0] + n * c[0], a[1] + m * b[1] + n * c[1]),
      shagi: [shagKombinatsiya(terms, R, 'd'), shagDlina('d', R, len), shagOtvet(len)],
      params: { ax: a[0], ay: a[1], bx: b[0], by: b[1], cx: c[0], cy: c[1], m, n },
      signature: signatureOf([a, b, c]),
      vid: `${m}:${n}`,
    };
  },
};

/* ── A6 ─────────────────────────────────────────────────────────── */

export const A6: Prototype = {
  id: 'A6',
  gruppa: 'A',
  nazvanie: 'Длина по рисунку: два вектора',
  format: 'grid',
  formula: modul(`${vec('a')}+3${vec('b')}`),
  generate(r) {
    const k = r.int(2, 4);
    const b = sluchaynyy(r, 5, { pryamoy: 1 / 7 });
    const got = podobratA(r, 1, [k * b[0], k * b[1]], 6, 30);
    if (got === null) return null;
    const { a, R, len } = got;
    const vectors = razmestit(r, [a, b], OKNO_DVA);
    if (vectors === null) return null;
    const terms = [
      [1, 'a', a],
      [k, 'b', b],
    ] as const;
    return {
      uslovie: `${izobrazheny(['a', 'b'])} ${naydiDlinu(
        kombinatsiya([
          [1, 'a'],
          [k, 'b'],
        ]),
      )}`,
      risunok: risunok(vectors, OKNO_DVA),
      otvet: len,
      proverka: Math.hypot(a[0] + k * b[0], a[1] + k * b[1]),
      shagi: [
        shagPoRisunku(vectors),
        shagKombinatsiya(terms, R, 'c'),
        shagDlina('c', R, len),
        shagOtvet(len),
      ],
      params: { ax: a[0], ay: a[1], bx: b[0], by: b[1], k },
      signature: signatureOf([a, b]),
    };
  },
};

/* ── A7 ─────────────────────────────────────────────────────────── */

const KOEF_A7: readonly (readonly [number, number, number])[] = [
  [1, 1, -1],
  [1, -1, 1],
  [7, -3, 4],
  [3, 4, -5],
  [2, -1, 1],
  [1, 2, -1],
  [1, -2, 3],
  [2, 1, -3],
  [3, -2, 1],
  [1, 3, -2],
  [5, -2, 3],
  [2, 3, -1],
  [4, -1, -2],
  [1, -3, 4],
];

export const A7: Prototype = {
  id: 'A7',
  gruppa: 'A',
  nazvanie: 'Длина по рисунку: три вектора',
  format: 'grid',
  formula: modul(`7${vec('a')}-3${vec('b')}+4${vec('c')}`),
  generate(r) {
    const [k, m, n] = r.pick(KOEF_A7);
    const b = sluchaynyy(r, 6, { pryamoy: 1 / 7 });
    const c = sluchaynyy(r, 6, { pryamoy: 1 / 7 });
    const got = podobratA(r, k, [m * b[0] + n * c[0], m * b[1] + n * c[1]], 6, k >= 3 ? 60 : 30);
    if (got === null) return null;
    const { a, R, len } = got;
    const vectors = razmestit(r, [a, b, c], OKNO_TRI);
    if (vectors === null) return null;
    const terms = [
      [k, 'a', a],
      [m, 'b', b],
      [n, 'c', c],
    ] as const;
    return {
      uslovie: `${izobrazheny(['a', 'b', 'c'])} ${naydiDlinu(
        kombinatsiya([
          [k, 'a'],
          [m, 'b'],
          [n, 'c'],
        ]),
      )}`,
      risunok: risunok(vectors, OKNO_TRI),
      otvet: len,
      proverka: dlina(komb(terms.map(([kk, , p]) => [kk, p] as const))),
      shagi: [
        shagPoRisunku(vectors),
        shagKombinatsiya(terms, R, 'd'),
        shagDlina('d', R, len),
        shagOtvet(len),
      ],
      params: { ax: a[0], ay: a[1], bx: b[0], by: b[1], cx: c[0], cy: c[1], k, m, n },
      signature: signatureOf([a, b, c]),
      vid: `${k}:${m}:${n}`,
    };
  },
};

/* ── A8 ─────────────────────────────────────────────────────────── */

/** Десятичные коэффициенты трёх векторов, умноженные на 10. */
const KOEF_A8: readonly (readonly [number, number, number])[] = [
  [13, 10, -32],
  [10, -27, 4],
  [5, 12, -10],
  [15, -8, 10],
  [21, 4, -10],
  [10, 3, 11],
  [12, -7, 10],
  [6, 9, -10],
  [10, 13, -4],
  [8, 15, -10],
  [9, -12, 10],
  [7, 6, -10],
];

export const A8: Prototype = {
  id: 'A8',
  gruppa: 'A',
  nazvanie: 'По рисунку, десятичные коэффициенты',
  format: 'grid',
  formula: modul(`1{,}3${vec('a')}+${vec('b')}-3{,}2${vec('c')}`),
  generate(r) {
    const [P, Q, S] = r.pick(KOEF_A8);
    const b = sluchaynyy(r, 6, { pryamoy: 1 / 7 });
    const c = sluchaynyy(r, 6, { pryamoy: 1 / 7 });
    const got = podobratA(r, P, [Q * b[0] + S * c[0], Q * b[1] + S * c[1]], 6, 120);
    if (got === null) return null;
    const { a, R, len } = got;
    const otvet = len / 10;
    if (!nice(otvet, 1)) return null;
    const vectors = razmestit(r, [a, b, c], OKNO_TRI);
    if (vectors === null) return null;
    const p = P / 10;
    const q = Q / 10;
    const sKoef = S / 10;
    const result: Tochka = [R[0] / 10, R[1] / 10];
    const terms = [
      [p, 'a', a],
      [q, 'b', b],
      [sKoef, 'c', c],
    ] as const;
    return {
      uslovie: `${izobrazheny(['a', 'b', 'c'])} ${naydiDlinu(
        kombinatsiya([
          [p, 'a'],
          [q, 'b'],
          [sKoef, 'c'],
        ]),
      )}`,
      risunok: risunok(vectors, OKNO_TRI),
      otvet,
      proverka: Math.hypot(p * a[0] + q * b[0] + sKoef * c[0], p * a[1] + q * b[1] + sKoef * c[1]),
      shagi: [
        shagPoRisunku(vectors),
        shagKombinatsiya(terms, result, 'd'),
        shagDlina('d', result, otvet),
        shagOtvet(otvet),
      ],
      params: { ax: a[0], ay: a[1], bx: b[0], by: b[1], cx: c[0], cy: c[1], p: P, q: Q, s: S },
      signature: signatureOf([a, b, c]),
      vid: `${P}:${Q}:${S}`,
    };
  },
};

export const DLINA: Prototype[] = [A1, A2, A3, A4, A5, A6, A7, A8];
