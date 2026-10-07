/** Генераторы раздела ВД — движение по воде. */

import { cel, type Gen, type Rng, type Zagotovka } from './types';

/**
 * Собственная скорость v, течение c и время в движении туда-обратно
 * move (целые часы): путь в одну сторону S = move(v² − c²)/(2v).
 */
function reka(r: Rng): { v: number; c: number; move: number; S: number } | null {
  const v = r.int(8, 35);
  const c = r.int(1, 5);
  const move = r.int(3, 40);
  const S = (move * (v * v - c * c)) / (2 * v);
  if (v - c < 4 || !cel(S) || S < 10 || S > 800) {
    return null;
  }
  return { v, c, move, S: Math.round(S) };
}

/** Разница времени против и по течению: 2Sc/(v² − c²) — целые часы. */
function raznitsa(r: Rng): { v: number; c: number; S: number; delta: number } | null {
  const v = r.int(6, 30);
  const c = r.int(1, 5);
  const delta = r.int(1, 10);
  const S = (delta * (v * v - c * c)) / (2 * c);
  if (v - c < 3 || !cel(S) || S < 10 || S > 300) {
    return null;
  }
  return { v, c, S: Math.round(S), delta };
}

export const GEN_VD: Record<string, Gen> = {
  'VD-01': (r): Zagotovka | null => {
    const k = reka(r);
    if (!k) {
      return null;
    }
    const st = r.int(1, 8);
    return { params: { v: k.v, c: k.c, st, T: k.move + st }, answer: 2 * k.S };
  },

  'VD-02': (r): Zagotovka | null => {
    const k = reka(r);
    if (!k) {
      return null;
    }
    const st = r.int(1, 8);
    return { params: { S: k.S, c: k.c, st, T: k.move + st }, answer: k.v };
  },

  'VD-03': (r): Zagotovka | null => {
    const k = reka(r);
    if (!k) {
      return null;
    }
    const st = r.int(1, 8);
    return { params: { S: k.S, v: k.v, st, T: k.move + st }, answer: k.c };
  },

  'VD-04': (r): Zagotovka | null => {
    const k = raznitsa(r);
    if (!k) {
      return null;
    }
    return r.next() < 0.5
      ? { params: { ask: 'c', S: k.S, delta: k.delta, v: k.v }, answer: k.c }
      : { params: { ask: 'v', S: k.S, delta: k.delta, c: k.c }, answer: k.v };
  },

  /* Время в движении T (часы, с минутами кратно 10), стоянка, часы по циферблату. */
  'VD-05': (r): Zagotovka | null => {
    const form = r.pick(['kater', 'barzha', 'lodka', 'baidarka'] as const);
    /* Правдоподобные собственные скорости: байдарка — не быстрее 12 км/ч. */
    const SKOROSTI: Record<typeof form, [number, number]> = {
      kater: [12, 40],
      barzha: [6, 16],
      lodka: [6, 30],
      baidarka: [4, 12],
    };
    const [lo, hi] = SKOROSTI[form];
    const v = r.int(lo, hi);
    const c = r.int(1, Math.min(4, v - 2));
    const S = r.int(5, 80);
    const Tmin = (120 * S * v) / (v * v - c * c);
    if (v - c < 2 || !cel(Tmin) || Tmin % 10 !== 0 || Tmin < 120) {
      return null;
    }
    const minutes = form === 'kater' || form === 'barzha';
    let st: number;
    if (minutes) {
      if (Tmin % 60 !== 0) {
        return null;
      }
      st = 60 * r.int(1, 4);
    } else {
      const n = Math.ceil(Tmin / 60) + r.int(1, 3);
      st = n * 60 - Tmin;
      if (st % 60 === 0 || st < 40) {
        return null;
      }
    }
    const t0 = r.int(5, 11);
    const t1 = t0 + (Tmin + st) / 60;
    if (!cel(t1) || t1 > 23) {
      return null;
    }
    const own = form === 'kater' || form === 'baidarka';
    return own
      ? { params: { form, t0, S, st, t1: Math.round(t1), c }, answer: v }
      : { params: { form, t0, S, st, t1: Math.round(t1), v }, answer: c };
  },

  /* Яхта в пути T ч; плот плыл T + h ч со скоростью течения. */
  'VD-06': (r): Zagotovka | null => {
    const k = reka(r);
    if (!k || k.v < 10) {
      return null;
    }
    const h = r.int(1, 4);
    const raft = k.c * (k.move + h);
    if (raft >= k.S) {
      return null;
    }
    return { params: { S: k.S, h, r: raft, c: k.c }, answer: k.v };
  },

  'VD-07': (r): Zagotovka | null => {
    const k = raznitsa(r);
    return k ? { params: { S: k.S, delta: k.delta, v: k.v }, answer: k.c } : null;
  },
};
