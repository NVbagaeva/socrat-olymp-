/** Генераторы раздела СМ — смеси и сплавы. */

import { cel, shag, type Gen, type Zagotovka } from './types';

export const GEN_SM: Record<string, Gen> = {
  'SM-01': (r): Zagotovka | null => {
    const V = r.int(2, 20);
    const p = r.int(5, 60);
    const W = r.int(1, 15);
    const c = (V * p) / (V + W);
    return cel(c) && c > 0 ? { params: { V, p, W }, answer: Math.round(c) } : null;
  },

  'SM-02': (r): Zagotovka | null => {
    const p1 = r.int(5, 60);
    const p2 = r.int(5, 60);
    if (p1 === p2 || (p1 + p2) % 2 !== 0) {
      return null;
    }
    return { params: { p1, p2 }, answer: (p1 + p2) / 2 };
  },

  'SM-03': (r): Zagotovka | null => {
    const p1 = r.int(5, 30);
    const p2 = r.int(5, 30);
    const m1 = r.int(1, 10);
    const m2 = r.int(1, 10);
    const c = (m1 * p1 + m2 * p2) / (m1 + m2);
    if (p1 === p2 || !cel(c)) {
      return null;
    }
    return { params: { p1, p2, m1, m2 }, answer: Math.round(c) };
  },

  /* Лёгкий сплав x, тяжёлый x + d; процент третьего целый. */
  'SM-04': (r): Zagotovka | null => {
    const x = r.int(1, 40);
    const d = r.int(1, 30);
    const pl = r.int(5, 60);
    const ph = r.int(5, 60);
    const p3 = (pl * x + ph * (x + d)) / (2 * x + d);
    if (pl === ph || !cel(p3)) {
      return null;
    }
    const heavier = r.pick(['1', '2'] as const);
    const [p1, p2] = heavier === '2' ? [pl, ph] : [ph, pl];
    return {
      params: { p1, p2, d, p3: Math.round(p3), heavier, metal: r.pick(['med', 'serebro']) },
      answer: 2 * x + d,
    };
  },

  'SM-05': (r): Zagotovka | null => {
    const x = shag(r, 10, 200, 5);
    const y = shag(r, 10, 200, 5);
    const p1 = r.int(5, 30);
    const p2 = r.int(p1 + 5, 60);
    const M = x + y;
    const p3 = (p1 * x + p2 * y) / M;
    if (y <= x || !cel(p3)) {
      return null;
    }
    return { params: { p1, p2, M, p3: Math.round(p3) }, answer: y - x };
  },

  'SM-06': (r): Zagotovka | null => {
    if (r.next() < 0.7) {
      const w1 = r.int(75, 92);
      const w2 = r.int(5, 25);
      const R = r.int(5, 100);
      const G = (R * (100 - w2)) / (100 - w1);
      return cel(G) ? { params: { form: 'izyum', R, w1, w2 }, answer: Math.round(G) } : null;
    }
    const m = shag(r, 20, 200, 10);
    const w1 = r.int(4, 15);
    const w2 = r.int(60, 90);
    const total = (m * (100 - w1)) / (100 - w2);
    return cel(total) && total > m
      ? { params: { form: 'pyure', m, w1, w2 }, answer: Math.round(total - m) }
      : null;
  },

  /* Концентрации x, y; равные массы дают (x + y)/2. */
  'SM-07': (r): Zagotovka | null => {
    const x = r.int(5, 95);
    const y = r.int(5, 95);
    const m1 = shag(r, 10, 100, 5);
    const m2 = shag(r, 10, 100, 5);
    const c = (m1 * x + m2 * y) / (m1 + m2);
    if (x === y || m1 === m2 || (x + y) % 2 !== 0 || !cel(c)) {
      return null;
    }
    const ask = r.pick(['pct', 'kg'] as const);
    const kg = (m1 * x) / 100;
    if (ask === 'kg' && !cel(kg)) {
      return null;
    }
    return {
      params: { m1, m2, c: Math.round(c), e: (x + y) / 2, ask },
      answer: ask === 'pct' ? x : kg,
    };
  },

  /* Разность уравнений: 500 = (d − c)(x + y + 10) — сумма масс делит 500. */
  'SM-08': (r): Zagotovka | null => {
    const N = r.pick([20, 25, 50, 100, 125]);
    const x = r.int(2, N - 12);
    const y = N - 10 - x;
    const a = r.int(5, 95);
    const b = r.int(5, 95);
    const c = (a * x + b * y) / N;
    const d = c + 500 / N;
    if (a === b || !cel(c) || c <= 0 || d >= 100) {
      return null;
    }
    return { params: { a, b, c: Math.round(c), d: Math.round(d) }, answer: x };
  },
};
