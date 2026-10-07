/** Генераторы раздела ПТ — протяжённые тела. */

import { cel, des, shag, type Gen, type Zagotovka } from './types';

export const GEN_PT: Record<string, Gen> = {
  'PT-01': (r): Zagotovka | null => {
    const L1 = shag(r, 200, 1000, 50);
    const L2 = shag(r, 100, 2000, 50);
    const v = shag(r, 30, 120, 5);
    const t = ((L1 + L2) * 60) / (1000 * v);
    if (!des(t, 1) || t < 0.5) {
      return null;
    }
    return {
      params: { form: r.pick(['tonnel', 'lesopolosa']), L1, L2, v },
      answer: Math.round(t * 10) / 10,
    };
  },

  'PT-02': (r): Zagotovka | null => {
    const v1 = shag(r, 60, 120, 5);
    const v2 = shag(r, 30, 90, 5);
    const t = r.int(10, 60);
    const path = ((v1 + v2) * 5 * t) / 18;
    const L = shag(r, 200, 900, 50);
    const L1 = path - L;
    if (!cel(path) || L1 < 100 || L1 > 1200 || L1 % 50 !== 0) {
      return null;
    }
    return { params: { v1, v2, L, t }, answer: L1 };
  },

  'PT-03': (r): Zagotovka | null => {
    const v2 = shag(r, 30, 80, 5);
    const v1 = v2 + shag(r, 5, 30, 5);
    const t = r.int(2, 20);
    const path = ((v1 - v2) * t * 1000) / 60;
    const L = shag(r, 400, 1200, 50);
    const L1 = path - L;
    if (!cel(path) || L1 < 100 || L1 > 1200 || L1 % 50 !== 0) {
      return null;
    }
    return { params: { v1, v2, L, t }, answer: L1 };
  },

  'PT-04': (r): Zagotovka | null => {
    const L1 = shag(r, 60, 250, 10);
    const L2 = shag(r, 60, 250, 10);
    const a = shag(r, 50, 500, 50);
    const b = shag(r, 50, 500, 50);
    const t = r.pick([6, 10, 12, 15, 20, 30]);
    const v = ((a + L1 + L2 + b) * 60) / (1000 * t);
    return des(v, 1) && L1 !== L2
      ? { params: { L1, L2, a, b, t }, answer: Math.round(v * 10) / 10 }
      : null;
  },
};
