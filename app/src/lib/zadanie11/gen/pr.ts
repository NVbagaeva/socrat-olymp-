/** Генераторы раздела ПР — проценты. */

import { cel, des, shag, type Gen, type Zagotovka } from './types';

export const GEN_PR: Record<string, Gen> = {
  /* Зарплата кратна 100 — налог и остаток целые. */
  'PR-01': (r): Zagotovka | null => {
    const p = r.pick([13, 13, 13, 15]);
    const x = shag(r, 20_000, 300_000, 100);
    const N = (x * (100 - p)) / 100;
    if (!cel(N)) {
      return null;
    }
    return { params: { p, N, kto: r.pick(['popov', 'ivanova', 'sidorov']) }, answer: x };
  },

  'PR-02': (r): Zagotovka | null => {
    const a = shag(r, 5, 50, 5);
    const b = shag(r, 5, 50, 5);
    const k = ((100 + a) * (100 - b)) / 10_000;
    const ch = Math.abs(1 - k) * 100;
    if (ch < 0.5 || !des(ch, 2)) {
      return null;
    }
    return { params: { a, b }, answer: Math.round(ch * 100) / 100 };
  },

  /* p² / 100 — конечная дробь при p, кратном 5. */
  'PR-03': (r): Zagotovka | null => {
    const p = shag(r, 5, 60, 5);
    return { params: { d: (p * p) / 100 }, answer: p };
  },

  'PR-04': (r): Zagotovka | null => {
    const n = r.int(2, 12);
    const p = r.int(1, 30);
    const m = r.int(n + 1, 20);
    const ans = (m * (100 - p)) / n - 100;
    if (!cel(ans) || ans <= 0 || ans > 150) {
      return null;
    }
    return { params: { n, p, m }, answer: Math.round(ans) };
  },

  /* Дочь z: при уменьшении в k раз доход падает на z(k − 1)/k. */
  'PR-05': (r): Zagotovka | null => {
    const k = r.pick([2, 3, 4]);
    const z = k * r.int(1, 8);
    const b = (z * (k - 1)) / k;
    const a = r.int(30, 70);
    const y = 100 - a - z;
    if (y < 10) {
      return null;
    }
    return { params: { a, k, b }, answer: y };
  },

  'PR-06': (r): Zagotovka | null => {
    const x = r.int(4, 20);
    if (r.next() < 0.5) {
      const P0 = shag(r, 10_000, 60_000, 10_000);
      const P2 = (P0 * (100 - x) ** 2) / 10_000;
      return cel(P2) ? { params: { form: 'holodilnik', P0, P2 }, answer: x } : null;
    }
    const S = shag(r, 2_000, 20_000, 100);
    const diff = (S * (100 + x) * x) / 10_000;
    return cel(diff) ? { params: { form: 'vklad', S, diff }, answer: x } : null;
  },

  /* Время уменьшается в (100 + p)/100 раз: ответ конечный. */
  'PR-07': (r): Zagotovka | null => {
    const p = r.pick([25, 60, 100, 150, 300, 400, 900, 20, 50, 400]);
    const ans = 100 - 10_000 / (100 + p);
    return des(ans, 2) ? { params: { p }, answer: Math.round(ans * 100) / 100 } : null;
  },
};
