/**
 * Группа I, степени: 8.A, 8.C, 8.D.
 */

import { gcd, nice, round9 } from '../numbers';
import type { Rng } from '../rng';
import { CDOT, d, fracExp, pw } from '../tex';
import type { Prototype } from '../types';
import { keys, naydi, podtip, PRIME_PAIRS, tenth } from './common';

/* ── 8.A  (a^m)^n : a^k ──────────────────────────────────────── */

function formA(a: number, m: number, n: number, k: number, form: string): string {
  const top = pw(`(${pw(String(a), String(m))})`, String(n));
  const bottom = pw(String(a), String(k));
  return form === 'frac' ? `\\dfrac{${top}}{${bottom}}` : `${top} : ${bottom}`;
}

function razborA(a: number, m: number, n: number, k: number, ans: number): string[] {
  return [
    `$(${a}^{${m}})^{${n}} = ${a}^{${m} \\cdot ${n}} = ${a}^{${m * n}}$`,
    `$${a}^{${m * n}} : ${a}^{${k}} = ${a}^{${m * n} - ${k}} = ${a}^{${m * n - k}} = ${d(ans)}$`,
  ];
}

export const P8A: Prototype = {
  id: '8.A',
  group: 'I',
  nazvanie: 'Степени с одним основанием',
  podtipy: [
    podtip('1', 'base', (r) => {
      const a = r.pick([2, 3, 4, 5, 6, 7, 10]);
      const e = r.int(1, 4);
      const ans = a ** e;
      if (ans > 1000) {
        return null;
      }
      const m = r.int(2, 9);
      const n = r.int(2, 9);
      const k = m * n - e;
      if (k < 2) {
        return null;
      }
      const form = r.pick(['colon', 'frac']);
      return {
        uslovie: naydi(formA(a, m, n, k, form)),
        otvet: ans,
        razbor: razborA(a, m, n, k, ans),
        proverka: Math.exp((m * n - k) * Math.log(a)),
        signature: `${a}:${e}`,
        params: { a, m, n, k },
      };
    }),
    podtip('2', 'advanced', (r) => {
      const a = r.pick([2, 4, 5, 10]);
      const e = r.pick([-1, -2]);
      const ans = round9(a ** e);
      if (!nice(ans, 2)) {
        return null;
      }
      const m = r.int(2, 9);
      const n = r.int(2, 9);
      const k = m * n - e;
      const form = r.pick(['colon', 'frac']);
      return {
        uslovie: naydi(formA(a, m, n, k, form)),
        otvet: ans,
        razbor: [
          ...razborA(a, m, n, k, ans).slice(0, 1),
          `$${a}^{${m * n}} : ${a}^{${k}} = ${a}^{${m * n - k}} = \\dfrac{1}{${a ** -e}} = ${d(ans)}$`,
        ],
        proverka: Math.exp((m * n - k) * Math.log(a)),
        signature: `${a}:${e}`,
        params: { a, m, n, k },
      };
    }),
  ],
  isklyucheniya: keys([
    { a: 5, m: 4, n: 6, k: 22 },
    { a: 4, m: 15, n: 5, k: 73 },
    { a: 2, m: 16, n: 5, k: 74 },
    { a: 3, m: 2, n: 17, k: 31 },
  ]),
};

/* ── 8.C  основания — степени одного числа ───────────────────── */

/** Основание b^s как число в записи: 3, 9, 27, 81. */
function base(b: number, s: number): string {
  return String(b ** s);
}

/**
 * Частное или произведение с десятичными показателями:
 * (b^{s1})^{x} и (b^{s2})^{y}, показатель у первого считается от
 * второго так, чтобы итог был b^e.
 */
function decimalC(r: Rng, e: number, op: 'quot' | 'prod') {
  const b = r.pick([2, 3, 5, 7]);
  const s1 = r.pick([1, 2, 3, 4]);
  const s2 = r.pick([1, 2, 3, 4]);
  if (s1 === s2 || b ** s1 > 1000 || b ** s2 > 1000) {
    return null;
  }
  const y = tenth(r, 0.1, 5.9);
  const xs = op === 'quot' ? e + s2 * y : e - s2 * y;
  const x = round9(xs / s1);
  if (!(x > 0) || x >= 10 || Number.isInteger(x) || !nice(x, 1)) {
    return null;
  }
  return { b, s1, s2, x, y };
}

export const P8C: Prototype = {
  id: '8.C',
  group: 'I',
  nazvanie: 'Степени с дробными показателями',
  podtipy: [
    podtip('quot', 'base', (r) => {
      const e = r.int(1, 4);
      const p = decimalC(r, e, 'quot');
      if (p === null || p.b ** e > 1000) {
        return null;
      }
      const { b, s1, s2, x, y } = p;
      const ans = b ** e;
      const top = pw(base(b, s1), d(x));
      const bottom = pw(base(b, s2), d(y));
      return {
        uslovie: naydi(`\\dfrac{${top}}{${bottom}}`),
        otvet: ans,
        razbor: [
          `$${top} = ${pw(String(b), d(round9(s1 * x)))}$, $${bottom} = ${pw(String(b), d(round9(s2 * y)))}$`,
          `$${pw(String(b), d(round9(s1 * x)))} : ${pw(String(b), d(round9(s2 * y)))} = ${pw(String(b), String(e))} = ${ans}$`,
        ],
        proverka: Math.pow(b ** s1, x) / Math.pow(b ** s2, y),
        signature: `${b}:${s1}:${s2}`,
        params: { b, s1, s2, x, y, op: 'quot' },
      };
    }),
    podtip('prod', 'base', (r) => {
      const e = r.int(1, 4);
      const p = decimalC(r, e, 'prod');
      if (p === null || p.b ** e > 1000) {
        return null;
      }
      const { b, s1, s2, x, y } = p;
      const ans = b ** e;
      const left = pw(base(b, s1), d(x));
      const right = pw(base(b, s2), d(y));
      return {
        uslovie: naydi(`${left}${CDOT}${right}`),
        otvet: ans,
        razbor: [
          `$${left} = ${pw(String(b), d(round9(s1 * x)))}$, $${right} = ${pw(String(b), d(round9(s2 * y)))}$`,
          `$${pw(String(b), d(round9(s1 * x)))} \\cdot ${pw(String(b), d(round9(s2 * y)))} = ${pw(String(b), String(e))} = ${ans}$`,
        ],
        proverka: Math.pow(b ** s1, x) * Math.pow(b ** s2, y),
        signature: `${b}:${s1}:${s2}`,
        params: { b, s1, s2, x, y, op: 'prod' },
      };
    }),
    podtip('neg', 'advanced', (r) => {
      const e = r.pick([-1, -2]);
      const op = r.pick(['quot', 'prod'] as const);
      const p = decimalC(r, e, op);
      if (p === null || (p.b !== 2 && p.b !== 5)) {
        return null;
      }
      const { b, s1, s2, x, y } = p;
      const ans = round9(b ** e);
      const left = pw(base(b, s1), d(x));
      const right = pw(base(b, s2), d(y));
      const tex = op === 'quot' ? `\\dfrac{${left}}{${right}}` : `${left}${CDOT}${right}`;
      return {
        uslovie: naydi(tex),
        otvet: ans,
        razbor: [
          `$${left} = ${pw(String(b), d(round9(s1 * x)))}$, $${right} = ${pw(String(b), d(round9(s2 * y)))}$`,
          `$${pw(String(b), String(e))} = \\dfrac{1}{${b ** -e}} = ${d(ans)}$`,
        ],
        proverka: op === 'quot' ? Math.pow(b ** s1, x) / Math.pow(b ** s2, y) : Math.pow(b ** s1, x) * Math.pow(b ** s2, y),
        signature: `${b}:${s1}:${s2}:neg`,
        params: { b, s1, s2, x, y, op },
      };
    }),
    podtip('frac', 'advanced', (r) => {
      const b = r.pick([2, 3, 5]);
      const [s1, s2] = r.pick([
        [1, 2],
        [2, 3],
        [1, 3],
        [2, 4],
        [1, 4],
        [3, 4],
      ] as const);
      const e = r.int(1, 4);
      if (b ** e > 1000) {
        return null;
      }
      const den1 = r.int(2, 10);
      const num1 = r.int(1, den1 - 1);
      /* s1·p1 + s2·p2 = e */
      const p2num = e * den1 - s1 * num1;
      const p2den = s2 * den1;
      if (p2num <= 0) {
        return null;
      }
      const g = gcd(p2num, p2den);
      const n2 = p2num / g;
      const d2 = p2den / g;
      if (d2 === 1 || d2 > 12) {
        return null;
      }
      const ans = b ** e;
      const left = pw(base(b, s1), fracExp(num1, den1));
      const right = pw(base(b, s2), fracExp(n2, d2));
      return {
        uslovie: naydi(`${left}${CDOT}${right}`),
        otvet: ans,
        razbor: [
          `$${left} = ${pw(String(b), fracExp(s1 * num1, den1))}$, $${right} = ${pw(String(b), fracExp(s2 * n2, d2))}$`,
          `$${pw(String(b), fracExp(s1 * num1, den1))} \\cdot ${pw(String(b), fracExp(s2 * n2, d2))} = ${pw(String(b), String(e))} = ${ans}$`,
        ],
        proverka: Math.pow(b ** s1, num1 / den1) * Math.pow(b ** s2, n2 / d2),
        signature: `${b}:${s1}:${s2}:frac`,
        params: { b, s1, s2, num1, den1, n2, d2 },
      };
    }),
    podtip('chain', 'advanced', (r) => {
      const b = r.pick([2, 3, 5]);
      const s1 = r.int(2, 6);
      const s2 = r.int(2, 6);
      if (s1 === s2 || b ** s1 > 1000 || b ** s2 > 1000) {
        return null;
      }
      const m = r.int(2, 9);
      const n = r.int(2, 5);
      const k = r.int(2, 9);
      const l = r.int(2, 9);
      const e = s1 * m * n - s2 * k * l;
      if (e < 1 || e > 5 || b ** e > 1000) {
        return null;
      }
      const ans = b ** e;
      const left = pw(`(${pw(base(b, s1), String(m))})`, String(n));
      const right = pw(`(${pw(base(b, s2), String(k))})`, String(l));
      return {
        uslovie: naydi(`${left} : ${right}`),
        otvet: ans,
        razbor: [
          `$${left} = ${pw(String(b), String(s1 * m * n))}$, $${right} = ${pw(String(b), String(s2 * k * l))}$`,
          `$${pw(String(b), String(s1 * m * n))} : ${pw(String(b), String(s2 * k * l))} = ${pw(String(b), String(e))} = ${ans}$`,
        ],
        proverka: Math.exp((s1 * m * n - s2 * k * l) * Math.log(b)),
        signature: `${b}:${s1}:${s2}:chain`,
        params: { b, s1, s2, m, n, k, l },
      };
    }),
  ],
  isklyucheniya: keys([
    { b: 3, s1: 1, s2: 2, x: 9.2, y: 2.6, op: 'quot' },
    { b: 5, s1: 1, s2: 2, x: 6.2, y: 2.1, op: 'quot' },
    { b: 3, s1: 4, s2: 2, x: 2.6, y: 3.7, op: 'quot' },
    { b: 2, s1: 4, s2: 2, x: 3.2, y: 3.9, op: 'quot' },
    { b: 5, s1: 1, s2: 2, x: 0.06, y: 0.97, op: 'prod' },
    { b: 3, s1: 1, s2: 2, x: 1.34, y: 0.83, op: 'prod' },
    { b: 2, s1: 3, s2: 6, x: 0.76, y: 0.12, op: 'prod' },
    { b: 7, s1: 1, s2: 2, x: 0.04, y: 0.48, op: 'prod' },
    { b: 2, s1: 2, s2: 4, num1: 1, den1: 5, n2: 9, d2: 10 },
    { b: 3, s1: 2, s2: 4, num1: 3, den1: 5, n2: 7, d2: 10 },
    { b: 5, s1: 1, s2: 2, num1: 5, den1: 9, n2: 2, d2: 9 },
    { b: 2, s1: 6, s2: 4, m: 9, n: 3, k: 5, l: 8 },
    { b: 3, s1: 2, s2: 3, m: 7, n: 4, k: 3, l: 6 },
    { b: 5, s1: 3, s2: 2, m: 8, n: 3, k: 7, l: 5 },
    { b: 2, s1: 2, s2: 3, m: 6, n: 4, k: 5, l: 3 },
  ]),
};

/* ── 8.D  разные основания, сводимые к одному ────────────────── */

export const P8D: Prototype = {
  id: '8.D',
  group: 'I',
  nazvanie: 'Степени с разными основаниями',
  podtipy: [
    podtip('same', 'base', (r) => {
      const [p, q] = r.pick(PRIME_PAIRS);
      const N = p * q;
      const e = r.pick([1, 2]);
      if (N ** e > 500) {
        return null;
      }
      const x = tenth(r, 1.1, 5.9);
      const y = round9(x - e);
      if (y <= 0) {
        return null;
      }
      const ans = N ** e;
      const top = `${pw(String(p), d(x))}${CDOT}${pw(String(q), d(x))}`;
      const bottom = pw(String(N), d(y));
      return {
        uslovie: naydi(`\\dfrac{${top}}{${bottom}}`),
        otvet: ans,
        razbor: [
          `$${top} = (${p} \\cdot ${q})^{${d(x)}} = ${pw(String(N), d(x))}$`,
          `$${pw(String(N), d(x))} : ${bottom} = ${pw(String(N), String(e))} = ${ans}$`,
        ],
        proverka: (Math.pow(p, x) * Math.pow(q, x)) / Math.pow(N, y),
        signature: `${p}:${q}:same`,
        params: { p, q, x, y, form: 'same' },
      };
    }),
    podtip('split', 'advanced', (r) => {
      const [p, q] = r.pick(PRIME_PAIRS);
      const N = p * q;
      const ep = r.pick([-1, 0, 1, 2]);
      const eq = r.pick([-1, 0, 1, 2]);
      if (ep === 0 && eq === 0) {
        return null;
      }
      const ans = round9(p ** ep * q ** eq);
      if (!nice(ans, 2) || ans > 500) {
        return null;
      }
      const x = tenth(r, 1.1, 7.9);
      const y = round9(ep - x);
      const z = round9(x - eq);
      if (y === 0 || z === 0 || Math.abs(y) >= 10 || Math.abs(z) >= 10) {
        return null;
      }
      const form = r.pick(['frac', 'colon']);
      const left = `${pw(String(N), d(x))}${CDOT}${pw(String(p), d(y))}`;
      const right = pw(String(q), d(z));
      const tex = form === 'frac' ? `\\dfrac{${left}}{${right}}` : `${left} : ${right}`;
      return {
        uslovie: naydi(tex),
        otvet: ans,
        razbor: [
          `$${pw(String(N), d(x))} = ${pw(String(p), d(x))} \\cdot ${pw(String(q), d(x))}$`,
          `$${pw(String(p), `${d(x)} ${y < 0 ? '-' : '+'} ${d(Math.abs(y))}`)} \\cdot ${pw(String(q), `${d(x)} - ${d(z)}`)} = ${pw(String(p), String(ep))} \\cdot ${pw(String(q), String(eq))} = ${d(ans)}$`,
        ],
        proverka: (Math.pow(N, x) * Math.pow(p, y)) / Math.pow(q, z),
        signature: `${p}:${q}:${ep}:${eq}`,
        params: { p, q, x, y, z, form },
      };
    }),
    podtip('fracpow', 'advanced', (r) => {
      const [p, q] = r.pick(PRIME_PAIRS);
      const N = p * q;
      const n = r.pick([6, 8, 10, 12, 15, 20, 21, 24]);
      const b1 = r.int(2, 6);
      const a1 = r.int(1, b1 - 1);
      const d1 = r.int(2, 6);
      const c1 = r.int(1, d1 - 1);
      if ((n * a1) % b1 !== 0 || (n * c1) % d1 !== 0) {
        return null;
      }
      const ep = (n * a1) / b1;
      const eq = (n * c1) / d1;
      const m = Math.min(ep, eq);
      if (ep === eq || m < 2) {
        return null;
      }
      const ans = p ** (ep - m) * q ** (eq - m);
      if (ans > 500) {
        return null;
      }
      const inner = `${pw(String(p), fracExp(a1, b1))}${CDOT}${pw(String(q), fracExp(c1, d1))}`;
      const top = pw(`\\left(${inner}\\right)`, String(n));
      const bottom = pw(String(N), String(m));
      return {
        uslovie: naydi(`\\dfrac{${top}}{${bottom}}`),
        otvet: ans,
        razbor: [
          `$${top} = ${pw(String(p), String(ep))} \\cdot ${pw(String(q), String(eq))}$, $${bottom} = ${pw(String(p), String(m))} \\cdot ${pw(String(q), String(m))}$`,
          `$${pw(String(p), String(ep - m))} \\cdot ${pw(String(q), String(eq - m))} = ${ans}$`,
        ],
        proverka: Math.pow(Math.pow(p, a1 / b1) * Math.pow(q, c1 / d1), n) / Math.pow(N, m),
        signature: `${p}:${q}:fracpow`,
        params: { p, q, n, a1, b1, c1, d1 },
      };
    }),
  ],
  isklyucheniya: keys([
    { p: 2, q: 7, x: 6.4, y: -5.4, z: 4.4, form: 'frac' },
    { p: 3, q: 5, x: 7.2, y: -5.2, z: 6.2, form: 'frac' },
    { p: 3, q: 7, x: 4.5, y: -2.5, z: 3.5, form: 'frac' },
    { p: 2, q: 11, x: 5.1, y: -4.1, z: 2.1, form: 'frac' },
    { p: 2, q: 3, x: 2.5, y: 1.5, form: 'same' },
    { p: 5, q: 7, n: 15, a1: 3, b1: 5, c1: 2, d1: 3 },
  ]),
};
