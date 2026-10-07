/** Генераторы раздела ОК — движение по окружности. */

import { cel, type Gen, type Zagotovka } from './types';

export const GEN_OK: Record<string, Gen> = {
  /* За t мин первый проехал на круг больше: разность скоростей L·60/t. */
  'OK-01': (r): Zagotovka | null => {
    const L = r.int(4, 40);
    const t = r.pick([10, 12, 15, 20, 24, 30, 36, 40, 45, 60]);
    const dv = (L * 60) / t;
    const x = r.int(40, 120);
    if (!cel(dv) || dv > 80) {
      return null;
    }
    return { params: { L, v1: x + dv, t }, answer: x };
  },

  /* Разность скоростей k = L·60/t₁; финиш: NL/x − NL/(x + k) = dt/60. */
  'OK-02': (r): Zagotovka | null => {
    const L = r.int(2, 8);
    const t1 = r.pick([10, 12, 15, 20, 24, 30, 40, 60]);
    const k = (L * 60) / t1;
    const x = r.int(60, 160);
    const N = r.int(10, 100);
    const dt = (N * L * k * 60) / (x * (x + k));
    if (!cel(k) || !cel(dt) || dt < 2 || dt > 120) {
      return null;
    }
    return { params: { N, L, dt: Math.round(dt), t1 }, answer: x };
  },

  /* x·t₁ = y(t₀ + t₁) и (x − y)·t₂ = 60L. */
  'OK-03': (r): Zagotovka | null => {
    const y = r.int(10, 40);
    const t0 = r.int(2, 20);
    const t1 = r.int(1, 10);
    const x = (y * (t0 + t1)) / t1;
    const L = r.int(1, 10);
    const t2 = (60 * L) / (x - y);
    if (!cel(x) || x > 150 || !cel(t2) || t2 < 1 || t2 > 30) {
      return null;
    }
    return { params: { t0, t1, t2: Math.round(t2), L }, answer: Math.round(x) };
  },
};
