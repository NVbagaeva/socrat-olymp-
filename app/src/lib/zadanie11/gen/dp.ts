/** Генераторы раздела ДП — движение по прямой. */

import { cel, shag, type Gen, type Zagotovka } from './types';

/** Время t часов дробью с удобными минутами: 0,5; 1,5; 4/3 и т. п. */
const UDOBNO = [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 4 / 3, 2 / 3, 5 / 3];

export const GEN_DP: Record<string, Gen> = {
  'DP-01': (r): Zagotovka | null => {
    const kmh = r.int(6, 40);
    const t = r.int(4, 60);
    const S = (kmh * t * 5) / 18;
    return cel(S) && S >= 20 && S <= 1000 ? { params: { S: Math.round(S), t }, answer: kmh } : null;
  },

  'DP-02': (r): Zagotovka | null => {
    const v1 = shag(r, 40, 120, 5);
    const v2 = shag(r, 40, 120, 5);
    const v3 = shag(r, 40, 120, 5);
    const t2 = r.int(1, 4);
    const t3 = r.int(1, 4);
    const avg = (v1 + v2 * t2 + v3 * t3) / (1 + t2 + t3);
    return cel(avg) ? { params: { v1, t2, v2, t3, v3 }, answer: Math.round(avg) } : null;
  },

  'DP-03': (r): Zagotovka | null => {
    if (r.next() < 0.25) {
      const v = [shag(r, 30, 120, 5), shag(r, 30, 120, 5), shag(r, 30, 120, 5)] as const;
      const avg = 3 / (1 / v[0] + 1 / v[1] + 1 / v[2]);
      if (!cel(avg) || new Set(v).size < 3) {
        return null;
      }
      return { params: { form: 'treti', v1: v[0], v2: v[1], v3: v[2] }, answer: Math.round(avg) };
    }
    const v = [shag(r, 40, 120, 10), shag(r, 40, 120, 10), shag(r, 40, 120, 10)];
    const t = [r.pick(UDOBNO), r.pick(UDOBNO), r.pick(UDOBNO)];
    const s = v.map((vi, i) => vi * (t[i] ?? 1));
    if (!s.every((si) => cel(si) && si >= 20)) {
      return null;
    }
    const S = s.reduce((a, b) => a + b, 0);
    const T = t.reduce((a, b) => a + b, 0);
    const avg = S / T;
    if (!cel(avg)) {
      return null;
    }
    const [s1, s2, s3] = s.map(Math.round) as [number, number, number];
    const [v1, v2, v3] = v as [number, number, number];
    return { params: { form: 'km', s1, v1, s2, v2, s3, v3 }, answer: Math.round(avg) };
  },

  'DP-04': (r): Zagotovka | null => {
    const v1 = r.int(40, 120);
    const v2 = r.int(40, 120);
    if (v1 === v2) {
      return null;
    }
    if (r.next() < 0.5) {
      return (v1 + v2) % 2 === 0
        ? { params: { form: 'vremya', v1, v2 }, answer: (v1 + v2) / 2 }
        : null;
    }
    const avg = (2 * v1 * v2) / (v1 + v2);
    return cel(avg) ? { params: { form: 'put', v1, v2 }, answer: Math.round(avg) } : null;
  },

  'DP-05': (r): Zagotovka | null => {
    const v = r.int(3, 8);
    const d = r.int(1, 3);
    const t = r.int(1, 5);
    const tu = r.int(1, 6);
    if (v - d < 2) {
      return null;
    }
    return { params: { L: v * t + (v - d) * tu, T: t + tu, t, d }, answer: v };
  },

  'DP-06': (r): Zagotovka | null => {
    const v1 = shag(r, 40, 90, 5);
    const v2 = shag(r, 40, 90, 5);
    const h = r.int(1, 3);
    const tau = r.int(1, 5);
    const s = v1 * (tau + h);
    return { params: { D: s + v2 * tau, h, v2, s }, answer: v1 };
  },

  /* x(x + d) = S; у баржи S = st·x(x + d)/d. */
  'DP-07': (r): Zagotovka | null => {
    const x = r.int(6, 25);
    const d = r.int(1, 9);
    if (r.next() < 0.7) {
      const ask = r.pick(['AB', 'BA'] as const);
      const S = x * (x + d);
      return S <= 400
        ? { params: { form: 'velo', S, d, ask }, answer: ask === 'AB' ? x : x + d }
        : null;
    }
    const st = r.int(1, 10);
    const S = (st * x * (x + d)) / d;
    if (st === d || !cel(S) || S > 600) {
      return null;
    }
    return { params: { form: 'barzha', S, d, st }, answer: x };
  },

  'DP-08': (r): Zagotovka | null => {
    const x = r.int(8, 25);
    const d = r.int(2, 10);
    const S = x * (x + d);
    const ask = r.pick(['first', 'second'] as const);
    return S <= 400 ? { params: { S, d, ask }, answer: ask === 'first' ? x + d : x } : null;
  },

  /* S/x − S/(x + dv) = Δt ⇒ S = Δt·x(x + dv)/dv. */
  'DP-09': (r): Zagotovka | null => {
    const x = r.int(10, 25);
    const dv = shag(r, 10, 70, 5);
    const dt = shag(r, 20, 300, 10);
    const S = ((dt / 60) * x * (x + dv)) / dv;
    if (!cel(S) || S < 20 || S > 150) {
      return null;
    }
    return { params: { kto: r.pick(['avto', 'moto']), S: Math.round(S), dv, dt }, answer: x };
  },

  /* Машина v, догнал через T ч после её старта: vT = u(T − 1). */
  'DP-10': (r): Zagotovka | null => {
    const v = shag(r, 40, 90, 5);
    const T = r.pick([2, 2.5, 3, 4, 5, 6]);
    const u = (v * T) / (T - 1);
    if (!cel(u) || u > 140) {
      return null;
    }
    return { params: { D: v * (2 * T - 1), u: Math.round(u) }, answer: v * T };
  },

  /* Времена в пути a < b; встреча через ab/(a + b) ч — целые минуты. */
  'DP-11': (r): Zagotovka | null => {
    const a = r.int(2, 15);
    const b = r.int(a + 1, 24);
    const t = (60 * a * b) / (a + b);
    return cel(t) && t % 60 !== 0
      ? { params: { delta: b - a, t: Math.round(t) }, answer: b }
      : null;
  },

  /* x² − (u + d)x + 2ud = 0 с целыми корнями; граница между ними. */
  'DP-12': (r): Zagotovka | null => {
    const d = r.int(5, 25);
    const u = shag(r, 40, 110, 2);
    const D = (u + d) ** 2 - 8 * u * d;
    const s = Math.round(Math.sqrt(Math.max(D, 0)));
    if (D <= 0 || s * s !== D || (u + d + s) % 2 !== 0) {
      return null;
    }
    const x = (u + d + s) / 2;
    const low = (u + d - s) / 2;
    if (x - low < 6 || low <= d) {
      return null;
    }
    const bound = low + r.int(1, x - low - 1);
    return { params: { d, u, bound }, answer: x };
  },

  'DP-13': (r): Zagotovka | null => {
    const x = r.int(8, 30);
    const h = r.int(1, 9);
    const S = x * (x + h);
    return S <= 500 ? { params: { S, h }, answer: x } : null;
  },
};
