/**
 * Группа II, логарифмы: 8.H, 8.I, 8.J, 8.K, 8.L.
 */

import { nice, round9 } from '../numbers';
import type { Rng } from '../rng';
import { d, log, root } from '../tex';
import type { Prototype } from '../types';
import { keys, naydi, podtip } from './common';

/** Является ли x целой степенью b (1 = b^0 тоже). */
function isPowerOf(x: number, b: number): boolean {
  for (let e = 0; e <= 12; e += 1) {
    if (Math.abs(b ** e - x) < 1e-9) {
      return true;
    }
  }
  return false;
}

/* ── 8.H  сумма и разность логарифмов ────────────────────────── */

function drawH(r: Rng, decimalArgs: boolean, base: number, e: number) {
  const T = round9(base ** e);
  /* Степень основания сама должна быть конечной десятичной дробью:
     0,7 в минус первой — нет, 0,8 в минус первой — 1,25. */
  if (!nice(T, 4)) {
    return null;
  }
  const op = r.pick(['+', '-'] as const);
  let x: number;
  if (decimalArgs) {
    x = r.pick([r.dec(1.1, 60, 1), r.dec(1.01, 20, 2)]);
  } else {
    x = r.int(2, 60);
  }
  if (x <= 1 || isPowerOf(x, base)) {
    return null;
  }
  const y = Math.round((op === '+' ? T / x : x / T) * 100) / 100;
  const back = round9(op === '+' ? x * y : x / y);
  if (Math.abs(back - T) > 1e-9 || y === x || y === 1 || y < 0.01 || y > 999 || isPowerOf(y, base)) {
    return null;
  }
  if (!decimalArgs && (!Number.isInteger(y) || !Number.isInteger(x))) {
    return null;
  }
  const b = d(base);
  const tex = `${log(b, d(x))} ${op} ${log(b, d(y))}`;
  const inner = op === '+' ? `${d(x)} \\cdot ${d(y)}` : `\\dfrac{${d(x)}}{${d(y)}}`;
  return {
    uslovie: naydi(tex),
    otvet: e,
    razbor: [`$${tex} = ${log(b, `(${inner})`)} = ${log(b, d(T))}$`, `$${log(b, d(T))} = ${e}$, так как $${b}^{${e}} = ${d(T)}$`],
    proverka: op === '+' ? Math.log(x) / Math.log(base) + Math.log(y) / Math.log(base) : Math.log(x) / Math.log(base) - Math.log(y) / Math.log(base),
    signature: `${base}:${op}:${e}`,
        params: { b: base, x, y, op },
  };
}

export const P8H: Prototype = {
  id: '8.H',
  group: 'II',
  nazvanie: 'Сумма и разность логарифмов',
  podtipy: [
    podtip('int', 'base', (r) => drawH(r, false, r.pick([2, 3, 4, 5, 6, 7, 8, 9]), r.int(1, 4))),
    podtip('dec-args', 'advanced', (r) => drawH(r, true, r.pick([2, 3, 4, 5, 6, 7, 8, 9]), r.pick([-2, -1, 1, 2, 3]))),
    podtip('dec-base', 'advanced', (r) =>
      drawH(r, r.pick([true, false]), r.pick([0.2, 0.5, 0.7, 0.8]), r.pick([-2, -1, 1, 2])),
    ),
  ],
  isklyucheniya: keys([
    { b: 6, x: 3, y: 2, op: '+' },
    { b: 8, x: 2, y: 32, op: '+' },
    { b: 2, x: 56, y: 7, op: '-' },
    { b: 3, x: 72, y: 8, op: '-' },
    { b: 7, x: 12.25, y: 4, op: '+' },
    { b: 3, x: 6.75, y: 4, op: '+' },
    { b: 2, x: 6.4, y: 10, op: '+' },
    { b: 4, x: 51.2, y: 5, op: '+' },
    { b: 2, x: 24, y: 0.75, op: '-' },
    { b: 3, x: 121.5, y: 1.5, op: '-' },
    { b: 6, x: 135, y: 3.75, op: '-' },
    { b: 5, x: 312.5, y: 2.5, op: '-' },
    { b: 0.7, x: 10, y: 7, op: '-' },
    { b: 0.8, x: 5, y: 4, op: '-' },
    { b: 0.5, x: 4, y: 1, op: '-' },
    { b: 0.2, x: 50, y: 2, op: '-' },
  ]),
};

/* ── 8.I  частное логарифмов плюс логарифм ───────────────────── */

export const P8I: Prototype = {
  id: '8.I',
  group: 'II',
  nazvanie: 'Переход к новому основанию с добавкой',
  podtipy: [
    podtip('1', 'advanced', (r) => {
      const b = r.pick([2, 3, 4, 5, 6, 7, 8, 9, 11, 13, 14]);
      const c = r.pick([2, 3, 5, 7, 9]);
      if (c === b) {
        return null;
      }
      const e = r.pick([-1, 0, 1, 1, 2, 2, 3]);
      const a = r.int(2, 59);
      const dd = round9(b ** e / a);
      if (!nice(dd, 2) || dd === 1 || dd === a || dd < 0.04 || isPowerOf(a, b)) {
        return null;
      }
      const tex = `\\dfrac{${log(String(c), String(a))}}{${log(String(c), String(b))}} + ${log(String(b), d(dd))}`;
      return {
        uslovie: naydi(tex),
        otvet: e,
        razbor: [
          `$\\dfrac{${log(String(c), String(a))}}{${log(String(c), String(b))}} = ${log(String(b), String(a))}$`,
          `$${log(String(b), String(a))} + ${log(String(b), d(dd))} = ${log(String(b), `(${a} \\cdot ${d(dd)})`)} = ${log(String(b), d(round9(a * dd)))} = ${e}$`,
        ],
        proverka: Math.log(a) / Math.log(c) / (Math.log(b) / Math.log(c)) + Math.log(dd) / Math.log(b),
        signature: `${b}:${e}`,
        params: { b, c, a, d: dd },
      };
    }),
  ],
  isklyucheniya: keys([
    { b: 13, c: 5, a: 2, d: 0.5 },
    { b: 8, c: 7, a: 40, d: 0.2 },
    { b: 5, c: 3, a: 50, d: 0.5 },
    { b: 14, c: 2, a: 4, d: 3.5 },
    { b: 7, c: 9, a: 28, d: 1.75 },
    { b: 4, c: 7, a: 20, d: 0.2 },
  ]),
};

/* ── 8.J  частное логарифмов, чистый переход ─────────────────── */

export const P8J: Prototype = {
  id: '8.J',
  group: 'II',
  nazvanie: 'Частное логарифмов',
  podtipy: [
    podtip('same-base', 'base', (r) => {
      const c = r.pick([2, 3, 5, 7, 11]);
      const b = r.int(2, 10);
      const e = r.int(2, 5);
      if (b === c || b ** e > 2000 || isPowerOf(b, c)) {
        return null;
      }
      const tex = `\\dfrac{${log(String(c), String(b ** e))}}{${log(String(c), String(b))}}`;
      return {
        uslovie: naydi(tex),
        otvet: e,
        razbor: [
          `$\\dfrac{${log(String(c), String(b ** e))}}{${log(String(c), String(b))}} = ${log(String(b), String(b ** e))}$`,
          `$${log(String(b), String(b ** e))} = ${log(String(b), `${b}^{${e}}`)} = ${e}$`,
        ],
        proverka: Math.log(b ** e) / Math.log(c) / (Math.log(b) / Math.log(c)),
        signature: `${b}:${e}`,
        params: { c, b, e },
      };
    }),
    podtip('same-arg', 'advanced', (r) => {
      const b = r.pick([2, 3, 5]);
      const m = r.int(1, 6);
      const n = r.int(1, 6);
      if (m === n || b ** m > 100 || b ** n > 100) {
        return null;
      }
      const ans = round9(n / m);
      if (!nice(ans, 2)) {
        return null;
      }
      const a = r.pick([5, 7, 8, 11, 13, 14, 17]);
      if (isPowerOf(a, b)) {
        return null;
      }
      const tex = `\\dfrac{${log(String(b ** m), String(a))}}{${log(String(b ** n), String(a))}}`;
      return {
        uslovie: naydi(tex),
        otvet: ans,
        razbor: [
          `$${log(String(b ** m), String(a))} = \\dfrac{1}{${m}}${log(String(b), String(a))}$, $${log(String(b ** n), String(a))} = \\dfrac{1}{${n}}${log(String(b), String(a))}$`,
          `$\\dfrac{1}{${m}} : \\dfrac{1}{${n}} = \\dfrac{${n}}{${m}} = ${d(ans)}$`,
        ],
        proverka: Math.log(a) / Math.log(b ** m) / (Math.log(a) / Math.log(b ** n)),
        signature: `${b}:${m}:${n}`,
        params: { b, m, n, a },
      };
    }),
  ],
  isklyucheniya: keys([
    { c: 7, b: 3, e: 5 },
    { c: 3, b: 2, e: 8 },
    { c: 2, b: 9, e: 3 },
    { c: 11, b: 10, e: 2 },
    { b: 3, m: 2, n: 4, a: 5 },
    { b: 2, m: 1, n: 4, a: 8 },
    { b: 2, m: 3, n: 6, a: 14 },
    { b: 3, m: 1, n: 3, a: 17 },
  ]),
};

/* ── 8.K  произведение логарифмов ────────────────────────────── */

export const P8K: Prototype = {
  id: '8.K',
  group: 'II',
  nazvanie: 'Произведение логарифмов',
  podtipy: [
    podtip('int', 'base', (r) => {
      const b = r.pick([2, 3, 4, 5, 7]);
      const e = r.int(2, 5);
      const c = b ** e;
      if (c > 1000) {
        return null;
      }
      const a = r.pick([2, 3, 5, 7, 11, 13]);
      if (a === b || a === c || isPowerOf(a, b)) {
        return null;
      }
      const tex = `${log(String(b), String(a))} \\cdot ${log(String(a), String(c))}`;
      return {
        uslovie: naydi(tex),
        otvet: e,
        razbor: [`$${tex} = ${log(String(b), String(c))}$`, `$${log(String(b), String(c))} = ${log(String(b), `${b}^{${e}}`)} = ${e}$`],
        proverka: (Math.log(a) / Math.log(b)) * (Math.log(c) / Math.log(a)),
        signature: `${b}:${e}`,
        params: { b, a, c, k: 1 },
      };
    }),
    podtip('dec', 'advanced', (r) => {
      const b = r.pick([1.25, 2.5, 0.2, 0.25, 1.5, 2, 3, 5]);
      const e = r.pick([-1, -1, 2, 3]);
      const c = round9(b ** e);
      if (!nice(c, 2) || c > 1000 || c < 0.01 || c === 1) {
        return null;
      }
      const a = r.pick([2, 3, 5, 7, 11, 13]);
      if (a === b || a === c || isPowerOf(a, b)) {
        return null;
      }
      const k = r.int(2, 9);
      const ans = k * e;
      const tex = `${k}${log(d(b), String(a))} \\cdot ${log(String(a), d(c))}`;
      return {
        uslovie: naydi(tex),
        otvet: ans,
        razbor: [
          `$${log(d(b), String(a))} \\cdot ${log(String(a), d(c))} = ${log(d(b), d(c))} = ${e}$, так как $${d(b)}^{${e}} = ${d(c)}$`,
          `$${k} \\cdot (${e}) = ${ans}$`,
        ],
        proverka: k * (Math.log(a) / Math.log(b)) * (Math.log(c) / Math.log(a)),
        signature: `${b}:${e}`,
        params: { b, a, c, k },
      };
    }),
  ],
  isklyucheniya: keys([
    { b: 3, a: 5, c: 81, k: 1 },
    { b: 2, a: 7, c: 32, k: 1 },
    { b: 4, a: 3, c: 16, k: 1 },
    { b: 5, a: 2, c: 125, k: 1 },
    { b: 1.25, a: 5, c: 0.8, k: 4 },
    { b: 2.5, a: 11, c: 0.4, k: 7 },
  ]),
};

/* ── 8.L  логарифм с корнем ──────────────────────────────────── */

export const P8L: Prototype = {
  id: '8.L',
  group: 'II',
  nazvanie: 'Логарифм с корнем',
  podtipy: [
    podtip('root-base', 'base', (r) => {
      const n = r.int(2, 8);
      const b = r.pick([2, 3, 5, 7, 11, 13]);
      const k = r.int(2, 12);
      const ans = k * n;
      const tex = `${k}${log(root(n, String(b)), String(b))}`;
      return {
        uslovie: naydi(tex),
        otvet: ans,
        razbor: [`$${log(root(n, String(b)), String(b))} = ${log(`${b}^{\\frac{1}{${n}}}`, String(b))} = ${n}$`, `$${k} \\cdot ${n} = ${ans}$`],
        proverka: (k * Math.log(b)) / Math.log(Math.pow(b, 1 / n)),
        signature: `${n}:base`,
        params: { n, b, m: 1, k, where: 'base' },
      };
    }),
    podtip('root-base-pow', 'advanced', (r) => {
      const n = r.int(2, 8);
      const b = r.pick([2, 3, 5, 7, 11, 13]);
      const m = r.pick([2, 3]);
      const k = r.int(1, 9);
      const ans = k * n * m;
      const arg = String(b ** m);
      const tex = `${k === 1 ? '' : k}${log(root(n, String(b)), arg)}`;
      return {
        uslovie: naydi(tex),
        otvet: ans,
        razbor: [
          `$${log(root(n, String(b)), arg)} = ${log(`${b}^{\\frac{1}{${n}}}`, `${b}^{${m}}`)} = ${m} \\cdot ${n} = ${n * m}$`,
          `$${k} \\cdot ${n * m} = ${ans}$`,
        ],
        proverka: (k * Math.log(b ** m)) / Math.log(Math.pow(b, 1 / n)),
        signature: `${n}:${m}:base`,
        params: { n, b, m, k, where: 'base' },
      };
    }),
    podtip('root-arg', 'base', (r) => {
      const n = r.pick([2, 4, 5, 8, 10]);
      const b = r.pick([2, 3, 5, 7, 11, 13]);
      const k = r.int(2, 12);
      const ans = round9(k / n);
      if (!nice(ans, 3)) {
        return null;
      }
      const tex = `${k}${log(String(b), root(n, String(b)))}`;
      return {
        uslovie: naydi(tex),
        otvet: ans,
        razbor: [`$${log(String(b), root(n, String(b)))} = ${log(String(b), `${b}^{\\frac{1}{${n}}}`)} = \\dfrac{1}{${n}}$`, `$${k} \\cdot \\dfrac{1}{${n}} = ${d(ans)}$`],
        proverka: (k * Math.log(Math.pow(b, 1 / n))) / Math.log(b),
        signature: `${n}:${k}:arg`,
        params: { n, b, m: 1, k, where: 'arg' },
      };
    }),
    podtip('root-arg-pow', 'advanced', (r) => {
      const n = r.int(2, 8);
      const b = r.pick([2, 3, 5, 7, 11]);
      const m = r.pick([2, 3, 4]);
      const k = r.int(1, 12);
      const ans = round9((k * m) / n);
      if (!nice(ans, 2) || b ** m > 1000) {
        return null;
      }
      const arg = root(n, String(b ** m));
      const tex = `${k === 1 ? '' : k}${log(String(b), arg)}`;
      return {
        uslovie: naydi(tex),
        otvet: ans,
        razbor: [
          `$${log(String(b), arg)} = ${log(String(b), `${b}^{\\frac{${m}}{${n}}}`)} = \\dfrac{${m}}{${n}}$`,
          `$${k} \\cdot \\dfrac{${m}}{${n}} = ${d(ans)}$`,
        ],
        proverka: (k * Math.log(Math.pow(b ** m, 1 / n))) / Math.log(b),
        signature: `${n}:${m}:arg`,
        params: { n, b, m, k, where: 'arg' },
      };
    }),
  ],
  isklyucheniya: keys([
    { n: 6, b: 13, m: 1, k: 6, where: 'base' },
    { n: 5, b: 21, m: 1, k: 5, where: 'base' },
    { n: 4, b: 5, m: 2, k: 3, where: 'base' },
    { n: 5, b: 7, m: 2, k: 2, where: 'base' },
    { n: 4, b: 5, m: 1, k: 8, where: 'arg' },
    { n: 3, b: 7, m: 1, k: 9, where: 'arg' },
    { n: 5, b: 2, m: 4, k: 15, where: 'arg' },
    { n: 4, b: 3, m: 3, k: 20, where: 'arg' },
  ]),
};
