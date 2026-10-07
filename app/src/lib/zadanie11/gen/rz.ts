/**
 * Генераторы раздела РЗ — разминка. У задач на округление генератор
 * намеренно выдаёт оба случая: с остатком (округлять) и нацело
 * (округлять не нужно) — это отдельная ловушка. Признак случая —
 * в поле sluchay, автотест проверяет, что встречаются оба.
 */

import { GORODA, GORODA_GENERATORA } from '../prototypes/rz';
import { cel, des, shag, type Gen, type Rng, type Zagotovka } from './types';

/** Округление вверх с выбором случая: ровно или с остатком. */
function vverh(
  r: Rng,
  make: () => [number, number] | null,
): { top: number; bottom: number; n: number; sluchay: string } | null {
  const want = r.next() < 0.3 ? 'nacelo' : 'ostatok';
  const pair = make();
  if (!pair) {
    return null;
  }
  const [top, bottom] = pair;
  const exact = top % bottom === 0;
  if ((want === 'nacelo') !== exact) {
    return null;
  }
  return { top, bottom, n: Math.ceil(top / bottom), sluchay: want };
}

export const GEN_RZ: Record<string, Gen> = {
  'RZ-01': (r): Zagotovka | null => {
    const c = shag(r, 100, 600, 10);
    const g = shag(r, 1050, 4950, 50);
    const cost = (c * g) / 1000;
    const M = r.pick([500, 1000, 2000, 5000]);
    if (!cel(cost) || cost >= M || g % 1000 === 0) {
      return null;
    }
    return { params: { c, g, M }, answer: M - cost };
  },

  'RZ-02': (r): Zagotovka | null => {
    const kmh = r.int(9, 45);
    const t = r.int(3, 30);
    const S = (kmh * t * 5) / 18;
    return cel(S) && S >= 10 ? { params: { S: Math.round(S), t }, answer: kmh } : null;
  },

  /* Длина трассы — правдоподобная для города, скорость лайнера 600–900 км/ч. */
  'RZ-03': (r): Zagotovka | null => {
    const gorod = r.pick(GORODA_GENERATORA);
    const g = GORODA[gorod];
    if (!g) {
      return null;
    }
    const speed = shag(r, 600, 900, 10);
    const flight = shag(r, 90, 600, 15);
    const S = (speed * flight) / 60;
    const t0 = shag(r, 6 * 60 + g.dh * 60, 20 * 60, 5);
    const t1 = t0 - g.dh * 60 + flight;
    if (!cel(S) || S < g.km[0] || S > g.km[1] || t1 >= 24 * 60) {
      return null;
    }
    return { params: { t0, t1, gorod, S }, answer: speed };
  },

  'RZ-04': (r): Zagotovka | null => {
    const cap = r.pick([20, 25, 30, 35, 40, 45, 50]);
    const v = vverh(r, () => {
      const a = r.int(80, 500);
      const b = r.int(3, 25);
      return [a + b, cap];
    });
    if (!v) {
      return null;
    }
    const b = r.int(3, 25);
    const a = v.top - b;
    return { params: { cap, a, b }, answer: v.n, sluchay: v.sluchay };
  },

  'RZ-05': (r): Zagotovka | null => {
    const g = shag(r, 80, 300, 10);
    const can = r.pick([500, 750, 800, 900, 1000, 1500, 2000, 2500]);
    const area = r.int(5, 60);
    const v = vverh(r, () => [g * area, can]);
    return v ? { params: { g, can, area }, answer: v.n, sluchay: v.sluchay } : null;
  },

  'RZ-06': (r): Zagotovka | null => {
    const tab = r.pick([0.05, 0.1, 0.25, 0.5]);
    const per = r.pick([1, 2]);
    const dose = Math.round(tab * per * 100) / 100;
    const times = r.int(2, 4);
    const days = r.int(5, 30);
    const pack = r.pick([10, 14, 20, 24, 28, 30]);
    const v = vverh(r, () => [per * times * days, pack]);
    return v ? { params: { dose, times, days, pack, tab }, answer: v.n, sluchay: v.sluchay } : null;
  },

  /* Округление по правилу: и вверх, и вниз. */
  'RZ-07': (r): Zagotovka | null => {
    if (r.next() < 0.5) {
      const k = r.int(5, 30);
      const x = (k * 1852) / 1000;
      const ans = Math.round(x);
      if (cel(x) || Math.abs(x - Math.floor(x) - 0.5) < 1e-9) {
        return null;
      }
      return {
        params: { form: 'yahta', k, unit: 1852 },
        answer: ans,
        sluchay: ans > x ? 'vverh' : 'vniz',
      };
    }
    const k = r.int(2, 30);
    const x = Math.round(k * 28.35 * 100) / 100;
    const ans = Math.round(x);
    if (cel(x) || Math.abs(x - Math.floor(x) - 0.5) < 1e-9) {
      return null;
    }
    return {
      params: { form: 'unciya', k, unit: 28.35 },
      answer: ans,
      sluchay: ans > x ? 'vverh' : 'vniz',
    };
  },

  'RZ-08': (r): Zagotovka | null => {
    const price = r.int(15, 90);
    const money = shag(r, 300, 2000, 50);
    const most = Math.floor(money / price);
    if (most < 4) {
      return null;
    }
    const ans = most % 2 === 0 ? most : most - 1;
    return {
      params: { price, money },
      answer: ans,
      sluchay: most % 2 === 0 ? 'chetnoe' : 'nechetnoe',
    };
  },

  'RZ-09': (r): Zagotovka | null => {
    const price = shag(r, 10, 200, 5);
    const p = r.pick([10, 15, 20, 25, 30, 40, 50]);
    const nw = (price * (100 + p)) / 100;
    if (!des(nw, 2)) {
      return null;
    }
    const want = r.next() < 0.3 ? 'nacelo' : 'ostatok';
    const money = want === 'nacelo' ? Math.round(nw * r.int(5, 60)) : shag(r, 500, 5000, 100);
    if (!cel(money) || money < 300) {
      return null;
    }
    const exact = cel(money / nw);
    if ((want === 'nacelo') !== exact) {
      return null;
    }
    return { params: { price, money, p }, answer: Math.floor(money / nw + 1e-9), sluchay: want };
  },

  'RZ-10': (r): Zagotovka | null => {
    const p = r.pick([5, 10, 15, 20, 25, 30, 40]);
    const old = shag(r, 1000, 50_000, 100);
    const N = (old * (100 - p)) / 100;
    return cel(N) ? { params: { p, N }, answer: old } : null;
  },

  'RZ-11': (r): Zagotovka | null => {
    const x = shag(r, 15_000, 150_000, 100);
    const N = (x * 87) / 100;
    return cel(N) ? { params: { p: 13, N }, answer: x } : null;
  },

  'RZ-12': (r): Zagotovka | null => {
    const N = shag(r, 1000, 50_000, 1000);
    const p1 = shag(r, 10, 40, 5);
    const p2 = shag(r, 10, 50, 5);
    const ans = (N * (100 - p1) * (100 - p2)) / 10_000;
    return cel(ans) ? { params: { N, p1, p2 }, answer: ans } : null;
  },

  'RZ-13': (r): Zagotovka | null => {
    const b = r.int(2, 100);
    const a = r.int(b + 1, 4 * b);
    const ask = r.pick(['bolshe', 'menshe'] as const);
    const ans = ((a - b) * 100) / (ask === 'bolshe' ? b : a);
    return des(ans, 2) ? { params: { a, b, ask }, answer: Math.round(ans * 100) / 100 } : null;
  },

  'RZ-14': (r): Zagotovka | null => {
    const p = r.pick([10, 20, 25, 50, 60, 100, 150, 300, 400]);
    const ans = (p * 100) / (100 + p);
    return des(ans, 2) ? { params: { p }, answer: Math.round(ans * 100) / 100 } : null;
  },

  'RZ-15': (r): Zagotovka | null => {
    const p1 = shag(r, 5, 60, 5);
    const p2 = shag(r, 5, 60, 5);
    const ans = ((100 + p1) / (100 - p2) - 1) * 100;
    return des(ans, 2) ? { params: { p1, p2 }, answer: Math.round(ans * 100) / 100 } : null;
  },

  'RZ-16': (r): Zagotovka | null => {
    const p1 = shag(r, 5, 60, 5);
    const p2 = shag(r, 5, 60, 5);
    const ans = ((100 + p1) * (100 + p2)) / 100 - 100;
    return des(ans, 2) ? { params: { p1, p2 }, answer: Math.round(ans * 100) / 100 } : null;
  },

  'RZ-17': (r): Zagotovka | null => {
    const a = r.int(2, 99);
    const b = r.int(2, 99);
    const v = (a * b) / 100;
    return a !== b && des(v, 2) ? { params: { a, b }, answer: Math.round(v * 100) / 100 } : null;
  },

  /* Пара кратна 15 минутам — ответ в часах конечный. */
  'RZ-18': (r): Zagotovka | null => {
    const t0 = shag(r, 8 * 60, 10 * 60, 5);
    const len = shag(r, 45, 120, 15);
    const br = shag(r, 5, 30, 5);
    return { params: { t0, br, t1: t0 + len + br }, answer: len / 60 };
  },
};
