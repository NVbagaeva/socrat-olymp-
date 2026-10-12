/**
 * Генераторы аналогов задания №7: по одному на прототип.
 *
 * Правило: сначала выбирается «красивый» корень (целое или конечная
 * десятичная дробь), потом под него подбираются коэффициенты — а не
 * наоборот. Генератор может вернуть null (кандидат не подошёл), тогда
 * подбор берёт следующего.
 *
 * `i` — номер аналога в подборе (0…19): по нему генератор решает, нужен
 * ли посторонний корень (П-09, П-13) или какой вопрос задать
 * (тригонометрия: наименьший положительный / наибольший отрицательный).
 */

import type { Rng } from '../../vychisleniya/rng';
import { ZNACHENIYA } from '../prototypes/gruppa5';
import type { Params } from '../types';

export type Generator = (r: Rng, i: number) => Params | null;

const isInt = (x: number) => Math.abs(x - Math.round(x)) < 1e-9;
const okr = (x: number) => Math.round(x * 1e6) / 1e6;

/** Корень: целое от −a до a или десятичная дробь с шагом 0,1 / 0,25 / 0,5. */
function koren(r: Rng, a: number, drob = true): number {
  if (!drob || r.next() < 0.5) {
    return r.int(-a, a);
  }
  const shag = r.pick([0.1, 0.2, 0.25, 0.5]);
  return okr(r.int(Math.round(-a / shag), Math.round(a / shag)) * shag);
}

const znak = (r: Rng) => (r.next() < 0.5 ? -1 : 1);
const nenol = (r: Rng, a: number, b: number) => {
  let x = 0;
  while (x === 0) {
    x = r.int(a, b);
  }
  return x;
};

/** Порядок слагаемых: «32−x» чаще, когда коэффициент при x отрицательный. */
const poryadok = (r: Rng, k: number) =>
  k < 0 ? (r.next() < 0.7 ? 'bx' : 'xb') : r.next() < 0.2 ? 'bx' : 'xb';

function nod(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    [x, y] = [y, x % y];
  }
  return x;
}

export const GENERATORY: Record<string, Generator> = {
  /* 1/(kx + b) = c */
  P01(r) {
    const k = r.int(2, 12);
    const c = r.pick([
      [2, 1],
      [4, 1],
      [5, 1],
      [10, 1],
      [-2, 1],
      [-4, 1],
      [-5, 1],
      [1, 2],
      [1, 3],
      [1, 4],
      [1, 5],
      [1, 6],
      [-1, 2],
      [-1, 3],
      [2, 5],
    ] as const);
    const x = koren(r, 8);
    const b = c[1] / c[0] - k * x;
    if (!isInt(b) || b === 0 || Math.abs(b) > 25) {
      return null;
    }
    return { k, b: Math.round(b), cn: c[0], cm: c[1] };
  },
  /* (x + a)ⁿ = b, n нечётное */
  P02(r) {
    const n = r.pick([3, 3, 3, 5, 7, 9]);
    const maxR = n === 3 ? 10 : n === 5 ? 3 : 2;
    const rr = nenol(r, -maxR, maxR);
    const x = r.int(-15, 15);
    const a = rr - x;
    if (a === 0 || Math.abs(a) > 15) {
      return null;
    }
    return { a, n, b: rr ** n };
  },
  /* (p/q)·x = смешанное число */
  P03(r) {
    const km = r.int(2, 12);
    const kn = znak(r) * r.int(1, 11);
    if (nod(kn, km) !== 1) {
      return null;
    }
    /* Корень: целое или с половинкой — xn/xd. */
    const xd = r.next() < 0.8 ? 1 : 2;
    const xn = nenol(r, -40 * xd, 40 * xd);
    /* Правая часть c = kn·xn/(km·xd) — сокращённая дробь. */
    const top = kn * xn;
    const bottom = km * xd;
    const g = nod(top, bottom);
    const cn = Math.abs(top / g);
    const cm = bottom / g;
    if (cm === 1 || cn < cm) {
      return null;
    }
    const w = Math.floor(cn / cm);
    if (w > 30) {
      return null;
    }
    return { kn, km, z: top < 0 ? -1 : 1, w, rn: cn - w * cm, rm: cm };
  },
  /* 1/(ax + b) = 1/(cx + d) */
  P04(r) {
    const a = r.int(1, 9);
    const c = r.int(1, 9);
    if (a === c) {
      return null;
    }
    const x = koren(r, 25);
    const b = nenol(r, -20, 20);
    const dd = (a - c) * x + b;
    if (!isInt(dd) || dd === 0 || Math.abs(dd) > 30 || a * x + b === 0) {
      return null;
    }
    if (a === 1 && c === 1) {
      return null;
    }
    return { a, b, c, dd: Math.round(dd) };
  },
  /* (ax + b)² = (ax + c)² */
  P05(r) {
    const a = r.int(1, 9);
    const x = koren(r, 10);
    const b = nenol(r, -15, 15);
    const c = -2 * a * x - b;
    if (!isInt(c) || c === b || c === 0 || Math.abs(c) > 25) {
      return null;
    }
    return { a, b, c: Math.round(c) };
  },
  /* (x + a)² = 4a·x */
  P06(r) {
    return { a: nenol(r, -20, 20) };
  },
  /* k·x² = c */
  P07(r, i) {
    const s = r.pick([0.5, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 6, 7, 1.2, 0.8, 1.4]);
    const km = r.int(2, 15);
    const kn = r.int(1, 12);
    if (nod(kn, km) !== 1) {
      return null;
    }
    /* c = k·s² как дробь. */
    const s2n = Math.round(s * s * 100);
    const cn0 = kn * s2n;
    const cm0 = km * 100;
    const g = nod(cn0, cm0);
    const cn = cn0 / g;
    const cm = cm0 / g;
    if (cm > 16 || cn / cm < 1 || cm === 1) {
      return null;
    }
    const cw = Math.floor(cn / cm);
    return { kn, km, cw, cn: cn - cw * cm, cm, v: i % 3 === 2 ? 'bolshiy' : 'menshiy' };
  },
  /* (px + q)/(rx + s) = c */
  P08(r) {
    const x = koren(r, 10);
    const p = nenol(r, -9, 9);
    const rr = nenol(r, -9, 9);
    const s = nenol(r, -12, 12);
    const c = r.pick([1, 2, 3, -1, -2, 0.5, 4]);
    const qq = c * (rr * x + s) - p * x;
    if (!isInt(qq) || qq === 0 || rr * x + s === 0 || p === c * rr || Math.abs(qq) > 30) {
      return null;
    }
    /* Не дробь-константа: p/r ≠ q/s. */
    if (p * s === Math.round(qq) * rr) {
      return null;
    }
    const cq = c === 0.5 ? [1, 2] : [c, 1];
    return { p, qq: Math.round(qq), r: rr, s, cn: cq[0] as number, cm: cq[1] as number };
  },
  /* x = (ax + b)/(x + c): в каждом третьем аналоге один корень обнуляет знаменатель */
  P09(r, i) {
    const r1 = nenol(r, -9, 9);
    const r2 = nenol(r, -9, 9);
    if (r1 === r2) {
      return null;
    }
    const postoronniy = i % 3 === 0;
    const c = postoronniy ? -r2 : nenol(r, -9, 9);
    if (!postoronniy && (c === -r1 || c === -r2)) {
      return null;
    }
    const a = c + r1 + r2;
    const b = -r1 * r2;
    if (a === 0) {
      return null;
    }
    return { a, b, c, v: r.next() < 0.5 ? 'bolshiy' : 'menshiy' };
  },
  /* x² + px + q = 0 */
  P10(r) {
    const r1 = r.int(-12, 12);
    const r2 = r.int(-12, 12);
    if (r1 === r2 || r1 * r2 === 0 || r1 + r2 === 0) {
      return null;
    }
    return { p: -(r1 + r2), qq: r1 * r2, v: r.next() < 0.5 ? 'menshiy' : 'bolshiy' };
  },
  /* √(kx + b) = c */
  P11(r) {
    const k = nenol(r, -9, 9);
    const c = r.int(1, 12);
    const x = r.int(-30, 40);
    const b = c * c - k * x;
    if (b === 0 || Math.abs(b) > 150) {
      return null;
    }
    return { k, b, por: poryadok(r, k), c };
  },
  /* ∛(x + a) = c */
  P12(r) {
    const c = nenol(r, -6, 6);
    const x = r.int(-40, 130);
    const a = c ** 3 - x;
    if (a === 0 || Math.abs(a) > 40) {
      return null;
    }
    return { a, c };
  },
  /* √(kx + b) = x: в половине аналогов отрицательный корень — посторонний */
  P13(r, i) {
    const s = r.int(1, 12);
    const postoronniy = i % 2 === 0;
    const drugoy = postoronniy ? -r.int(1, 12) : r.int(1, 12);
    if (drugoy === s) {
      return null;
    }
    const k = s + drugoy;
    const b = -s * drugoy;
    if (k === 0 || b === 0) {
      return null;
    }
    const v = postoronniy || r.next() < 0.7 ? 'menshiy' : 'bolshiy';
    return { k, b, por: r.next() < 0.75 ? 'bx' : 'xb', v };
  },
  /* √(c/(kx + b)) = d */
  P14(r) {
    const d = r.pick([
      [2, 5, 'dec'],
      [1, 5, 'dec'],
      [1, 2, 'dec'],
      [3, 10, 'dec'],
      [1, 2, 'frac'],
      [1, 3, 'frac'],
      [1, 4, 'frac'],
      [2, 3, 'frac'],
      [1, 8, 'frac'],
      [3, 4, 'frac'],
    ] as const);
    const c = r.int(1, 30);
    const A = (c * d[1] * d[1]) / (d[0] * d[0]);
    if (!isInt(A) || A > 400) {
      return null;
    }
    const k = nenol(r, -9, 9);
    const x = koren(r, 30, false);
    const b = A - k * x;
    if (b === 0 || Math.abs(b) > 200) {
      return null;
    }
    return { c, k, b, por: poryadok(r, k), dn: d[0], dm: d[1], dvid: d[2] };
  },
  /* a^(x + b) = aᵏ */
  P15(r) {
    const a = r.int(2, 9);
    const k = r.int(1, 4);
    if (a ** k > 1000) {
      return null;
    }
    const x = r.int(-12, 12);
    const b = k - x;
    if (b === 0) {
      return null;
    }
    return { a, b, k };
  },
  /* a^(kx + b) = aᵐ, «b − x» и коэффициент */
  P16(r) {
    const a = r.int(2, 9);
    const m = r.int(2, 4);
    if (a ** m > 1000) {
      return null;
    }
    const k = r.pick([-1, -1, -2, -3, -4, -5, -10, 1, 2, 3]);
    const x = koren(r, 10);
    const b = m - k * x;
    if (!isInt(b) || b === 0 || Math.abs(b) > 15) {
      return null;
    }
    return { a, k, b: Math.round(b), por: k === 1 || r.next() < 0.7 ? 'bx' : 'xb', m };
  },
  /* a^(kx + b) = (aʲ)^(mx) */
  P17(r) {
    const a = r.int(2, 7);
    const j = r.pick([2, 2, 3]);
    if (a ** j > 343) {
      return null;
    }
    const m = r.pick([1, 1, 2, 3]);
    const k = r.int(1, 5);
    if (j * m === k) {
      return null;
    }
    const x = koren(r, 6);
    const b = (j * m - k) * x;
    if (!isInt(b) || b === 0 || Math.abs(b) > 15) {
      return null;
    }
    return { a, k, b: Math.round(b), por: r.next() < 0.5 ? 'bx' : 'xb', j, m };
  },
  /* (1/a)^(kx + b) = aᵗ или a^(kx + b) = 1/aᵗ */
  P18(r) {
    const a = r.pick([2, 2, 3, 3, 4, 5, 6, 7, 8, 9]);
    const s = r.next() < 0.75 ? 1 : 2;
    const inv = r.next() < 0.6 ? 1 : 0;
    const tt = nenol(r, -6, 6);
    if (inv === 0 && tt > 0) {
      return null;
    }
    if (a ** Math.abs(tt) > 1000 || a ** s > 100) {
      return null;
    }
    const k = r.pick([1, 1, 1, 2, 3, 5, -1]);
    const x = koren(r, 12);
    const sigma = inv === 1 ? -s : s;
    const b = tt / sigma - k * x;
    if (!isInt(b) || b === 0 || Math.abs(b) > 15) {
      return null;
    }
    return { a, s, inv, k, b: Math.round(b), por: k < 0 ? 'bx' : r.next() < 0.2 ? 'bx' : 'xb', tt };
  },
  /* (1/a)^(x + b) = (aᵏ)ˣ */
  P19(r) {
    const a = r.int(2, 9);
    const k = r.int(1, 4);
    if (a ** k > 400) {
      return null;
    }
    const x = koren(r, 8);
    const b = -(k + 1) * x;
    if (!isInt(b) || b === 0 || Math.abs(b) > 15) {
      return null;
    }
    return { a, b: Math.round(b), k };
  },
  /* (1/aᵐ)^(x + b) = a^(x + c) */
  P29(r) {
    const a = r.int(2, 7);
    const m = r.pick([2, 2, 3]);
    if (a ** m > 400) {
      return null;
    }
    const x = koren(r, 8);
    const b = nenol(r, -8, 8);
    const c = -m * (x + b) - x;
    if (!isInt(c) || c === 0 || Math.abs(c) > 20 || c === b) {
      return null;
    }
    return { a, m, b, c: Math.round(c) };
  },
  /* logₐ(kx + b) = logₐc */
  P20(r) {
    const a = r.pick([2, 3, 4, 5, 6, 7, 8, 9, 11, 12]);
    const c = r.int(2, 40);
    if (c === a) {
      return null;
    }
    const k = r.pick([1, 1, -1, 2, 3, -2]);
    const x = koren(r, 25, false);
    const b = c - k * x;
    if (b === 0 || Math.abs(b) > 40) {
      return null;
    }
    return { a, k, b, por: poryadok(r, k), c };
  },
  /* logₐ(kx + b) = c */
  P21(r) {
    const a = r.pick([2, 2, 3, 3, 4, 5, 6, 7, 8, 10, 10]);
    const c = r.int(0, 6);
    if (a ** c > 700) {
      return null;
    }
    const k = nenol(r, -10, 10);
    const x = koren(r, 40);
    const b = a ** c - k * x;
    if (!isInt(b) || b === 0 || Math.abs(b) > 60) {
      return null;
    }
    return { a, k, b: Math.round(b), por: poryadok(r, k), c };
  },
  /* log_{1/a}(kx + b) = c */
  P22(r) {
    const a = r.int(2, 8);
    const c = -r.int(1, 4);
    if (a ** -c > 600) {
      return null;
    }
    const k = nenol(r, -8, 8);
    const x = koren(r, 30);
    const b = a ** -c - k * x;
    if (!isInt(b) || b === 0 || Math.abs(b) > 60) {
      return null;
    }
    return { a, k, b: Math.round(b), por: poryadok(r, k), c };
  },
  /* logₐ(kx + b) = m·logₐc */
  P23(r) {
    const a = r.pick([2, 3, 5, 6, 7, 10]);
    const m = r.pick([2, 2, 2, 3]);
    const c = r.int(2, 9);
    if (c ** m > 400 || c === a) {
      return null;
    }
    const k = r.pick([-1, -1, 1, 2, -3]);
    const x = koren(r, 30, false);
    const b = c ** m - k * x;
    if (b === 0 || Math.abs(b) > 60) {
      return null;
    }
    return { a, k, b, por: poryadok(r, k), m, c };
  },
  /* a^(log_{aʲ}(kx + b)) = m */
  P24(r) {
    const a = r.int(2, 5);
    const j = r.pick([2, 2, 3]);
    if (a ** j > 125) {
      return null;
    }
    const m = r.int(2, j === 2 ? 15 : 7);
    const k = r.int(1, 9);
    const x = koren(r, 30);
    const b = m ** j - k * x;
    if (!isInt(b) || b === 0 || Math.abs(b) > 60) {
      return null;
    }
    return { a, j, k, b: Math.round(b), por: r.next() < 0.2 ? 'bx' : 'xb', m };
  },
  /* log_{aʲ}(a^(kx + b)) = m */
  P25(r) {
    const a = r.int(2, 5);
    const j = r.int(2, 4);
    if (a ** j > 256) {
      return null;
    }
    const m = nenol(r, -4, 6);
    const k = nenol(r, -8, 9);
    const x = koren(r, 10);
    const b = j * m - k * x;
    if (!isInt(b) || b === 0 || Math.abs(b) > 30) {
      return null;
    }
    return { a, j, k, b: Math.round(b), por: poryadok(r, k), m };
  },
  /* log_{x + a} N = 2 */
  P30(r) {
    const s = r.int(2, 13);
    const a = nenol(r, -15, 15);
    if (s - a === 0) {
      return null;
    }
    return { a, N: s * s, v: r.next() < 0.6 ? 'menshiy' : 'bolshiy' };
  },
  P26: trig('sin'),
  P27: trig('cos'),
  P28: trig('tg'),
};

function trig(f: 'sin' | 'cos' | 'tg'): Generator {
  return (r, i) => {
    const a = r.pick([2, 3, 4, 4, 6, 6, 8, 12]);
    const k = r.pick([1, 1, 1, 2, 3, 4]);
    const b = r.next() < 0.3 ? 0 : nenol(r, -9, 9);
    const z = r.pick(ZNACHENIYA[f]);
    return {
      k,
      b,
      a,
      z,
      dec: z === '1/2' || z === '-1/2' ? (r.next() < 0.5 ? 1 : 0) : 0,
      v: i % 2 === 0 ? 'minPol' : 'maxOtr',
    };
  };
}
