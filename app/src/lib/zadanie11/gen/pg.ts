/** Генераторы раздела ПГ — прогрессии. */

import { cel, type Gen, type Zagotovka } from './types';

export const GEN_PG: Record<string, Gen> = {
  'PG-01': (r): Zagotovka | null => {
    if (r.next() < 0.5) {
      const n = r.int(5, 40);
      const s = r.int(4, 30);
      const S = (s * n) / 2;
      return cel(S) ? { params: { form: 'ulitka', S, s }, answer: n } : null;
    }
    const n = r.int(5, 20);
    const a1 = r.int(1, 10);
    const d = r.int(1, 5);
    const an = a1 + (n - 1) * d;
    return { params: { form: 'vasya', S: ((a1 + an) * n) / 2, a1, n }, answer: an };
  },
};
