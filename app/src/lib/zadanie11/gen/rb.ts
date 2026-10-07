/** Генераторы раздела РБ — работа. */

import { cel, type Gen, type Zagotovka } from './types';

function nok(a: number, b: number): number {
  let x = a;
  let y = b;
  while (y) {
    [x, y] = [y, x % y];
  }
  return (a / x) * b;
}

export const GEN_RB: Record<string, Gen> = {
  'RB-01': (r): Zagotovka | null => {
    const x = r.int(5, 25);
    const d = r.int(1, 12);
    const N = x * (x + d);
    const ask = r.pick(['second', 'first'] as const);
    return N <= 400 ? { params: { N, d, ask }, answer: ask === 'second' ? x : x + d } : null;
  },

  /* Второй x деталей/ч, t₂ ч; первый x + d деталей/ч, t₁ ч. */
  'RB-02': (r): Zagotovka | null => {
    const x = r.int(5, 35);
    const d = r.int(1, 10);
    const t2 = r.int(5, 30);
    const t1 = r.int(3, t2 - 1);
    const N1 = (x + d) * t1;
    const N2 = x * t2;
    if (N1 === N2) {
      return null;
    }
    const ask = r.pick(['second', 'first'] as const);
    return { params: { N1, N2, delta: t2 - t1, d, ask }, answer: ask === 'second' ? x : x + d };
  },

  'RB-03': (r): Zagotovka | null => {
    const x = r.int(5, 20);
    const d = r.int(1, 10);
    const V = x * (x + d);
    const ask = r.pick(['first', 'second'] as const);
    return V <= 400 ? { params: { V, d, ask }, answer: ask === 'first' ? x : x + d } : null;
  },

  /* 1/T = 1/a + 1/b: a = T + m, b = T + T²/m. */
  'RB-04': (r): Zagotovka | null => {
    if (r.next() < 0.7) {
      const T = r.int(4, 20);
      const m = r.int(1, T * T);
      const b = T + (T * T) / m;
      const a = T + m;
      if (!cel(b) || a === b || a > 120 || b > 120) {
        return null;
      }
      return { params: { form: 'mastera', a, b }, answer: T };
    }
    const T = r.int(4, 15);
    const a = r.int(T + 1, 4 * T);
    const b = r.int(T + 1, 4 * T);
    const c = 1 / (1 / T - 1 / a - 1 / b);
    if (!(c > 0) || !cel(c) || c < 61 || c > 300 || Math.round(c) % 60 === 0) {
      return null;
    }
    return { params: { form: 'nasosy', a, b, c: Math.round(c) }, answer: T };
  },

  'RB-05': (r): Zagotovka | null => {
    const T = r.int(10, 40);
    const x = r.int(T + 1, 5 * T);
    const a = (T * x) / (x - T);
    if (!cel(a) || a === x) {
      return null;
    }
    return { params: { imena: r.pick(['katya', 'anya']), T, a: Math.round(a) }, answer: x };
  },

  'RB-06': (r): Zagotovka | null => {
    const x = r.int(6, 90);
    const delta = r.int(2, 90);
    const T = (x * (x + delta)) / (2 * x + delta);
    return cel(T) ? { params: { delta, T: Math.round(T) }, answer: x } : null;
  },

  /* Производительности p, q, s (единиц в час), работа W — общее кратное. */
  'RB-07': (r): Zagotovka | null => {
    const p = r.int(1, 12);
    const q = r.int(1, 12);
    const s = r.int(1, 12);
    const W = [p + q, q + s, s + p, p + q + s].reduce(nok);
    const [a, b, c, all] = [W / (p + q), W / (q + s), W / (s + p), W / (p + q + s)];
    if (W > 600 || new Set([a, b, c]).size < 3) {
      return null;
    }
    return { params: { a, b, c }, answer: all };
  },
};
