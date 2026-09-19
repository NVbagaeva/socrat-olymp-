/**
 * Группа I, корни: 8.B, 8.E, 8.F, 8.G.
 */

import { gcd, nice, round9, simpRoot } from '../numbers';
import { CDOT, d, root } from '../tex';
import type { Prototype } from '../types';
import type { Rng } from '../rng';
import { keys, naydi, nonSquare, podtip, tenth } from './common';

/* ── 8.B  квадрат произведения с корнем, раскрытие скобок ─────── */

const E_LIST = [2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25];

function squareB(r: Rng, integer: boolean) {
  const c = r.int(2, 9);
  const dd = nonSquare(r, 2, 49);
  const e = r.pick(E_LIST);
  const ans = round9((c * c * dd) / e);
  if (!nice(ans, 2) || ans > 300 || Number.isInteger(ans) !== integer) {
    return null;
  }
  const tex = `\\dfrac{(${c}\\sqrt{${dd}})^2}{${e}}`;
  return {
    uslovie: naydi(tex),
    otvet: ans,
    razbor: [
      `$(${c}\\sqrt{${dd}})^2 = ${c}^2 \\cdot ${dd} = ${c * c * dd}$`,
      `$${c * c * dd} : ${e} = ${d(ans)}$`,
    ],
    proverka: (c * Math.sqrt(dd)) ** 2 / e,
    signature: `${dd}:${e}`,
        params: { c, d: dd, e },
  };
}

export const P8B: Prototype = {
  id: '8.B',
  group: 'I',
  nazvanie: 'Корни: квадрат и раскрытие скобок',
  podtipy: [
    podtip('sq-int', 'base', (r) => squareB(r, true)),
    podtip('sq-dec', 'advanced', (r) => squareB(r, false)),
    podtip('brackets', 'advanced', (r) => {
      const rr = r.pick([2, 3, 5, 6, 7, 10]);
      const k = r.int(1, 6);
      const l = r.int(1, 6);
      if (k === l) {
        return null;
      }
      const p = k * k * rr;
      const q = l * l * rr;
      if (p > 99 || q > 99) {
        return null;
      }
      const sign = r.pick(['-', '+']);
      const ans = sign === '-' ? p - k * l * rr : p + k * l * rr;
      const tex = `(\\sqrt{${p}} ${sign} \\sqrt{${q}}) \\cdot \\sqrt{${p}}`;
      return {
        uslovie: naydi(tex),
        otvet: ans,
        razbor: [
          `$\\sqrt{${p}} \\cdot \\sqrt{${p}} = ${p}$, $\\sqrt{${q}} \\cdot \\sqrt{${p}} = \\sqrt{${q * p}} = ${k * l * rr}$`,
          `$${p} ${sign} ${k * l * rr} = ${ans}$`,
        ],
        proverka: (Math.sqrt(p) + (sign === '-' ? -1 : 1) * Math.sqrt(q)) * Math.sqrt(p),
        signature: `${rr}:${k}:${l}`,
        params: { p, q, sign },
      };
    }),
  ],
  isklyucheniya: keys([
    { c: 3, d: 8, e: 6 },
    { c: 5, d: 6, e: 10 },
    { c: 6, d: 2, e: 8 },
    { c: 2, d: 7, e: 4 },
    { p: 12, q: 75, sign: '-' },
    { p: 63, q: 28, sign: '-' },
    { p: 32, q: 50, sign: '-' },
    { p: 75, q: 27, sign: '-' },
  ]),
};

/* ── 8.E  корни разных степеней от одного числа ──────────────── */

function isPower(x: number, n: number): boolean {
  const rt = Math.round(x ** (1 / n));
  return rt ** n === x;
}

/** Суммы 1/a + 1/b − 1/c, дающие «хороший» показатель. */
const SUMS: { value: number; xs: number[]; pow: number }[] = [
  { value: 0, xs: [2, 3, 5, 6, 7, 10, 11, 13, 16, 81], pow: 0 },
  { value: 1 / 2, xs: [4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144], pow: 1 / 2 },
  { value: 1 / 3, xs: [8, 27, 64, 125, 216, 343], pow: 1 / 3 },
  { value: 1 / 4, xs: [16, 81, 625], pow: 1 / 4 },
  { value: 1, xs: [2, 3, 5, 6, 7, 10, 11, 13], pow: 1 },
  { value: 2 / 3, xs: [8, 27, 64, 125], pow: 2 / 3 },
];

/** Тройки степеней (a, b, c) с 1/a + 1/b − 1/c из списка SUMS. */
const MIXED: { a: number; b: number; c: number; sum: (typeof SUMS)[number] }[] = [];
for (let a = 2; a <= 15; a += 1) {
  for (let b = 2; b <= 15; b += 1) {
    for (let c = 2; c <= 30; c += 1) {
      if (new Set([a, b, c]).size < 3) {
        continue;
      }
      const s = 1 / a + 1 / b - 1 / c;
      const sum = SUMS.find((item) => Math.abs(item.value - s) < 1e-9);
      if (sum !== undefined) {
        MIXED.push({ a, b, c, sum });
      }
    }
  }
}

/** Пары (a, b) с 1/a + 1/b = 1/c при целом c. */
const WITH_FACTOR: { a: number; b: number; c: number }[] = [];
for (let a = 3; a <= 40; a += 1) {
  for (let b = a + 1; b <= 60; b += 1) {
    const inv = 1 / a + 1 / b;
    const c = Math.round(1 / inv);
    if (c >= 2 && Math.abs(1 / c - inv) < 1e-9) {
      WITH_FACTOR.push({ a, b, c });
    }
  }
}

export const P8E: Prototype = {
  id: '8.E',
  group: 'I',
  nazvanie: 'Корни разных степеней',
  podtipy: [
    podtip('same-index', 'base', (r) => {
      const n = r.pick([3, 4, 5]);
      const k = r.pick([2, 3, 4, 5]);
      const T = k ** n;
      const a = r.int(2, 99);
      const step = T / gcd(a, T);
      if (step > 99) {
        return null;
      }
      const b = step * r.int(1, Math.floor(99 / step));
      if (b < 2 || b > 99) {
        return null;
      }
      const c = (a * b) / T;
      if (c < 2 || c > 99 || new Set([a, b, c]).size < 3) {
        return null;
      }
      if (isPower(a, n) || isPower(b, n) || isPower(c, n)) {
        return null;
      }
      const tex = `\\dfrac{${root(n, String(a))}${CDOT}${root(n, String(b))}}{${root(n, String(c))}}`;
      return {
        uslovie: naydi(tex),
        otvet: k,
        razbor: [
          `$\\dfrac{${root(n, String(a))} \\cdot ${root(n, String(b))}}{${root(n, String(c))}} = ${root(n, `\\dfrac{${a} \\cdot ${b}}{${c}}`)} = ${root(n, String(T))}$`,
          `$${root(n, String(T))} = ${root(n, `${k}^{${n}}`)} = ${k}$`,
        ],
        proverka: (Math.pow(a, 1 / n) * Math.pow(b, 1 / n)) / Math.pow(c, 1 / n),
        signature: `${n}:${k}:${a}`,
        params: { n, a, b, c },
      };
    }),
    podtip('mixed-index', 'advanced', (r) => {
      const { a, b, c, sum: found } = r.pick(MIXED);
      const x = r.pick(found.xs);
      const ans = round9(x ** found.pow);
      if (!Number.isInteger(ans)) {
        return null;
      }
      const tex = `\\dfrac{${root(a, String(x))}${CDOT}${root(b, String(x))}}{${root(c, String(x))}}`;
      const g = a * b * c;
      const num = g / a + g / b - g / c;
      const gg = gcd(num, g);
      const expo = num === 0 ? '0' : gg === g ? String(num / g) : `\\frac{${num / gg}}{${g / gg}}`;
      return {
        uslovie: naydi(tex),
        otvet: ans,
        razbor: [
          `$${root(a, String(x))} \\cdot ${root(b, String(x))} : ${root(c, String(x))} = ${x}^{\\frac{1}{${a}} + \\frac{1}{${b}} - \\frac{1}{${c}}} = ${x}^{${expo}}$`,
          `$${x}^{${expo}} = ${ans}$`,
        ],
        proverka: Math.pow(x, 1 / a + 1 / b - 1 / c),
        signature: `${x}:${found.value}`,
        params: { a, b, c, x },
      };
    }),
    podtip('with-factor', 'advanced', (r) => {
      const { a, b, c } = r.pick(WITH_FACTOR);
      const x = r.pick([2, 3, 5, 6, 7, 10, 11, 13, 17]);
      const tex = `\\dfrac{${root(a, String(x))} \\cdot ${x} \\cdot ${root(b, String(x))}}{${root(c, String(x))}}`;
      return {
        uslovie: naydi(tex),
        otvet: x,
        razbor: [
          `$\\frac{1}{${a}} + \\frac{1}{${b}} = \\frac{1}{${c}}$, поэтому $${root(a, String(x))} \\cdot ${root(b, String(x))} = ${root(c, String(x))}$`,
          `$\\dfrac{${root(c, String(x))} \\cdot ${x}}{${root(c, String(x))}} = ${x}$`,
        ],
        proverka: (Math.pow(x, 1 / a) * x * Math.pow(x, 1 / b)) / Math.pow(x, 1 / c),
        signature: `${x}:${c}:factor`,
        params: { a, b, c, x },
      };
    }),
  ],
  isklyucheniya: keys([
    { n: 4, a: 8, b: 48, c: 24 },
    { n: 5, a: 20, b: 16, c: 10 },
    { n: 3, a: 15, b: 36, c: 20 },
    { a: 3, b: 4, c: 12, x: 121 },
    { a: 3, b: 5, c: 30, x: 36 },
    { a: 6, b: 3, c: 2, x: 81 },
    { a: 20, b: 5, c: 4, x: 16 },
    { a: 15, b: 10, c: 6, x: 5 },
    { a: 28, b: 21, c: 12, x: 3 },
    { a: 40, b: 24, c: 15, x: 10 },
    { a: 36, b: 45, c: 20, x: 17 },
  ]),
};

/* ── 8.F  квадрат суммы или разности корней над знаменателем ─── */

export const P8F: Prototype = {
  id: '8.F',
  group: 'I',
  nazvanie: 'Квадрат суммы корней',
  podtipy: [
    podtip('1', 'advanced', (r) => {
      const a = nonSquare(r, 2, 30);
      const b = nonSquare(r, 2, 40);
      /* Числа под корнями — без квадратных множителей, как и их
         произведение: √20 в условии выглядело бы неупрощённым. */
      if (a >= b || a * b > 99 || simpRoot(a).k !== 1 || simpRoot(b).k !== 1 || simpRoot(a * b).k !== 1) {
        return null;
      }
      const m = r.pick([2, 4, 5, 8, 10, 20, 25]);
      const c = r.pick([1, 1, 1, 2, 3, 4]);
      const sign = r.pick(['+', '-']);
      const ans = round9(c / m);
      if (!nice(ans, 3) || c === m) {
        return null;
      }
      const numer = `${c === 1 ? '' : c}(\\sqrt{${a}} ${sign} \\sqrt{${b}})^2`;
      const denom = `${m * (a + b)} ${sign} ${2 * m}\\sqrt{${a * b}}`;
      return {
        uslovie: naydi(`\\dfrac{${numer}}{${denom}}`),
        otvet: ans,
        razbor: [
          `$(\\sqrt{${a}} ${sign} \\sqrt{${b}})^2 = ${a + b} ${sign} 2\\sqrt{${a * b}}$`,
          `$${denom} = ${m}(${a + b} ${sign} 2\\sqrt{${a * b}})$, поэтому дробь равна $\\dfrac{${c}}{${m}} = ${d(ans)}$`,
        ],
        proverka: (c * (Math.sqrt(a) + (sign === '-' ? -1 : 1) * Math.sqrt(b)) ** 2) / (m * (a + b) + (sign === '-' ? -1 : 1) * 2 * m * Math.sqrt(a * b)),
        signature: `${a}:${b}`,
        params: { a, b, m, c, sign },
      };
    }),
  ],
  isklyucheniya: keys([
    { a: 5, b: 7, m: 10, c: 1, sign: '+' },
    { a: 3, b: 7, m: 8, c: 1, sign: '+' },
    { a: 3, b: 10, m: 2, c: 1, sign: '-' },
    { a: 2, b: 5, m: 10, c: 1, sign: '-' },
  ]),
};

/* ── 8.G  произведение корней десятичных дробей ──────────────── */

export const P8G: Prototype = {
  id: '8.G',
  group: 'I',
  nazvanie: 'Корни из десятичных дробей',
  podtipy: [
    podtip('1', 'base', (r) => {
      const ans = r.int(2, 10);
      const x = tenth(r, 1.1, 9.9);
      const y = tenth(r, 1.1, 9.9);
      const z = round9((x * y) / (ans * ans));
      if (!nice(z, 2) || z >= 1 || z <= 0.01) {
        return null;
      }
      const tex = `\\dfrac{\\sqrt{${d(x)}}${CDOT}\\sqrt{${d(y)}}}{\\sqrt{${d(z)}}}`;
      const xy = round9(x * y);
      return {
        uslovie: naydi(tex),
        otvet: ans,
        razbor: [
          `$\\dfrac{\\sqrt{${d(x)}} \\cdot \\sqrt{${d(y)}}}{\\sqrt{${d(z)}}} = \\sqrt{\\dfrac{${d(x)} \\cdot ${d(y)}}{${d(z)}}} = \\sqrt{\\dfrac{${d(xy)}}{${d(z)}}} = \\sqrt{${ans * ans}}$`,
          `$\\sqrt{${ans * ans}} = ${ans}$`,
        ],
        proverka: (Math.sqrt(x) * Math.sqrt(y)) / Math.sqrt(z),
        signature: `${ans}:${x}`,
        params: { x, y, z },
      };
    }),
  ],
  isklyucheniya: keys([
    { x: 1.2, y: 1.4, z: 0.42 },
    { x: 2.8, y: 4.2, z: 0.24 },
    { x: 1.5, y: 3.3, z: 0.55 },
    { x: 3.5, y: 1.5, z: 0.21 },
  ]),
};

/** Упрощённая запись корня: √24 = 2√6. Пригодится тригонометрии. */
export function rootTex(n: number): string {
  const { k, m } = simpRoot(n);
  if (m === 1) {
    return String(k);
  }
  return `${k === 1 ? '' : k}\\sqrt{${m}}`;
}
