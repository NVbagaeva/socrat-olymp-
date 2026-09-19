/**
 * Группа V, буквенные выражения: 8.W, 8.X, 8.Y, 8.Z.
 *
 * Условие «Найдите значение выражения … при a = …, b = …». Значения
 * подбираются так, чтобы после упрощения ответ получался в одно
 * действие; генератор проверяет знаменатели, подкоренные и
 * основания логарифмов.
 */

import { nice, round9 } from '../numbers';
import type { Rng } from '../rng';
import { d, log } from '../tex';
import type { Draft, Prototype } from '../types';
import { naydiPri, podtip } from './common';

/** Десятичное с одним знаком из [-4; 4] без нуля или целое из [-9; 9]. */
function value(r: Rng, decimal: boolean): number {
  for (let i = 0; i < 50; i += 1) {
    const x = decimal ? r.dec(-4, 4, 1) : r.int(-9, 9);
    if (x !== 0 && (!decimal || !Number.isInteger(x))) {
      return x;
    }
  }
  return decimal ? 1.5 : 2;
}

/** Коэффициент перед буквой: 1 → пусто. */
function k(c: number): string {
  return c === 1 ? '' : String(c);
}

function pri(a: number, b?: number): string {
  return b === undefined ? `a = ${d(a)}` : `a = ${d(a)},\\ b = ${d(b)}`;
}

/* ── 8.W  рациональные выражения ─────────────────────────────── */

function drawW1(r: Rng, decimal: boolean): Draft | null {
  const p = r.int(1, 5);
  const q = r.int(1, 5);
  const a = value(r, decimal);
  const b = value(r, decimal);
  const minus = r.int(0, 1) === 0;
  /* (p²a² − q²b²)/(pa + qb) = pa − qb; со знаком минус — pa + qb. */
  const den = minus ? p * a - q * b : p * a + q * b;
  const ans = round9(minus ? p * a + q * b : p * a - q * b);
  if (Math.abs(den) < 1e-9 || ans === 0 || !nice(ans, 2)) {
    return null;
  }
  const top = `${k(p * p)}a^2 - ${k(q * q)}b^2`;
  const bottom = `${k(p)}a ${minus ? '-' : '+'} ${k(q)}b`;
  const tex = `\\dfrac{${top}}{${bottom}}`;
  const simplified = `${k(p)}a ${minus ? '+' : '-'} ${k(q)}b`;
  return {
    uslovie: naydiPri(tex, pri(a, b)),
    otvet: ans,
    razbor: [
      `$${top} = (${k(p)}a - ${k(q)}b)(${k(p)}a + ${k(q)}b)$, после сокращения остаётся $${simplified}$`,
      `$${k(p)} \\cdot ${d(a) === String(a) && a < 0 ? `(${d(a)})` : d(a)} ${minus ? '+' : '-'} ${k(q)} \\cdot ${b < 0 ? `(${d(b)})` : d(b)} = ${d(ans)}$`,
    ],
    proverka: (p * p * a * a - q * q * b * b) / den,
    signature: `${p}:${q}`,
        params: { p, q, a, b, minus: minus ? 1 : 0 },
  };
}

export const P8W: Prototype = {
  id: '8.W',
  group: 'V',
  nazvanie: 'Дроби с буквами',
  podtipy: [
    podtip('squares-int', 'base', (r) => drawW1(r, false)),
    podtip('squares-dec', 'advanced', (r) => drawW1(r, true)),
    podtip('sum-diff', 'advanced', (r) => {
      const kk = r.pick([1, 2, 4, 5, 8]);
      const a = value(r, true);
      const b = value(r, r.int(0, 1) === 0);
      const ans = round9(4 / kk);
      const tex = `\\dfrac{(a + b)^2 - (a - b)^2}{${k(kk)}ab}`;
      return {
        uslovie: naydiPri(tex, pri(a, b)),
        otvet: ans,
        razbor: [`$(a + b)^2 - (a - b)^2 = 4ab$`, `$\\dfrac{4ab}{${k(kk)}ab} = \\dfrac{4}{${kk}} = ${d(ans)}$ при любых $a$, $b$`],
        proverka: ((a + b) ** 2 - (a - b) ** 2) / (kk * a * b),
        signature: `${kk}`,
        params: { k: kk, a, b },
      };
    }),
    podtip('common', 'base', (r) => {
      const decimal = r.int(0, 1) === 0;
      const a = value(r, decimal);
      const b = value(r, decimal);
      const ans = round9(a + b);
      if (Math.abs(a - b) < 1e-9 || ans === 0) {
        return null;
      }
      const tex = `\\dfrac{a^2}{a - b} - \\dfrac{b^2}{a - b}`;
      return {
        uslovie: naydiPri(tex, pri(a, b)),
        otvet: ans,
        razbor: [`$\\dfrac{a^2 - b^2}{a - b} = a + b$`, `$${d(a)} + ${b < 0 ? `(${d(b)})` : d(b)} = ${d(ans)}$`],
        proverka: (a * a) / (a - b) - (b * b) / (a - b),
        signature: `${a}`,
        params: { a, b, form: 'common' },
      };
    }),
  ],
};

/* ── 8.X  иррациональные выражения ───────────────────────────── */

export const P8X: Prototype = {
  id: '8.X',
  group: 'V',
  nazvanie: 'Корни с буквами',
  podtipy: [
    podtip('conjugate', 'advanced', (r) => {
      const sa = r.dec(0.2, 3.9, 1);
      const sb = r.dec(0.1, 3.8, 1);
      if (sa <= sb) {
        return null;
      }
      const a = round9(sa * sa);
      const b = round9(sb * sb);
      const ans = round9(sa + sb);
      const tex = `\\dfrac{a - b}{\\sqrt{a} - \\sqrt{b}}`;
      return {
        uslovie: naydiPri(tex, pri(a, b)),
        otvet: ans,
        razbor: [`$a - b = (\\sqrt{a} - \\sqrt{b})(\\sqrt{a} + \\sqrt{b})$, дробь равна $\\sqrt{a} + \\sqrt{b}$`, `$\\sqrt{${d(a)}} + \\sqrt{${d(b)}} = ${d(sa)} + ${d(sb)} = ${d(ans)}$`],
        proverka: (a - b) / (Math.sqrt(a) - Math.sqrt(b)),
        signature: `${a}`,
        params: { a, b, form: 'conjugate' },
      };
    }),
    podtip('modulus', 'advanced', (r) => {
      const a = -Math.abs(value(r, r.int(0, 1) === 0));
      const rootB = r.int(2, 10);
      const b = rootB * rootB;
      const ans = round9(-a * rootB);
      const tex = `\\sqrt{a^2 b}`;
      return {
        uslovie: naydiPri(tex, pri(a, b)),
        otvet: ans,
        razbor: [`$\\sqrt{a^2 b} = \\lvert a \\rvert \\cdot \\sqrt{b}$`, `$\\lvert ${d(a)} \\rvert \\cdot \\sqrt{${b}} = ${d(-a)} \\cdot ${rootB} = ${d(ans)}$`],
        proverka: Math.sqrt(a * a * b),
        signature: `${b}`,
        params: { a, b, form: 'modulus' },
      };
    }),
    podtip('square', 'base', (r) => {
      const a = Math.abs(value(r, true));
      const b = Math.abs(value(r, true));
      if (a === b) {
        return null;
      }
      const ans = round9(a + b);
      const tex = `(\\sqrt{a} - \\sqrt{b})^2 + 2\\sqrt{ab}`;
      return {
        uslovie: naydiPri(tex, pri(a, b)),
        otvet: ans,
        razbor: [`$(\\sqrt{a} - \\sqrt{b})^2 = a - 2\\sqrt{ab} + b$, вместе с $2\\sqrt{ab}$ остаётся $a + b$`, `$${d(a)} + ${d(b)} = ${d(ans)}$`],
        proverka: (Math.sqrt(a) - Math.sqrt(b)) ** 2 + 2 * Math.sqrt(a * b),
        signature: `${a}`,
        params: { a, b, form: 'square' },
      };
    }),
    podtip('product', 'base', (r) => {
      const a = Math.abs(value(r, true)) + r.int(0, 8);
      const b = Math.abs(value(r, true));
      if (a <= b) {
        return null;
      }
      const ans = round9(a - b);
      const tex = `(\\sqrt{a} + \\sqrt{b})(\\sqrt{a} - \\sqrt{b})`;
      return {
        uslovie: naydiPri(tex, pri(a, b)),
        otvet: ans,
        razbor: [`$(\\sqrt{a} + \\sqrt{b})(\\sqrt{a} - \\sqrt{b}) = a - b$`, `$${d(a)} - ${d(b)} = ${d(ans)}$`],
        proverka: (Math.sqrt(a) + Math.sqrt(b)) * (Math.sqrt(a) - Math.sqrt(b)),
        signature: `${a}`,
        params: { a, b, form: 'product' },
      };
    }),
  ],
};

/* ── 8.Y  степенные выражения с буквами ──────────────────────── */

const VALUES_Y = [0.5, 2, 3, 5, 0.2, 10, 0.25, 4];

function expTex(e: number): string {
  return e === 1 ? '' : `^{${e}}`;
}

export const P8Y: Prototype = {
  id: '8.Y',
  group: 'V',
  nazvanie: 'Степени с буквами',
  podtipy: [
    podtip('int-pos', 'base', (r) => drawY(r, false)),
    podtip('int-neg', 'advanced', (r) => drawY(r, true)),
    podtip('decimal', 'advanced', (r) => {
      const target = r.pick([1, 2, -1, 0.5]);
      const x = r.dec(0.2, 3.9, 1);
      const y = r.dec(-2.9, 2.9, 1);
      const z = round9(x + y - target);
      if (Number.isInteger(x) || Number.isInteger(z) || z === 0 || y === 0) {
        return null;
      }
      let a: number;
      if (target === 0.5) {
        const root = r.pick([2, 3, 4, 5, 7, 9, 11]);
        a = root * root;
      } else if (target === -1) {
        a = r.pick([2, 4, 5, 8, 10, 0.5, 0.2, 0.25]);
      } else {
        a = r.pick([2, 3, 5, 7, 0.5, 0.2, 1.5, 2.5, 11]);
      }
      const ans = round9(a ** target);
      if (!nice(ans, 3)) {
        return null;
      }
      const tex = `\\dfrac{a^{${d(x)}} \\cdot a^{${d(y)}}}{a^{${d(z)}}}`;
      return {
        uslovie: naydiPri(tex, pri(a)),
        otvet: ans,
        razbor: [`$a^{${d(x)}} \\cdot a^{${d(y)}} : a^{${d(z)}} = a^{${d(x)} ${y < 0 ? '-' : '+'} ${d(Math.abs(y))} - ${d(z)}} = a^{${d(target)}}$`, `$${d(a)}^{${d(target)}} = ${d(ans)}$`],
        proverka: (Math.pow(a, x) * Math.pow(a, y)) / Math.pow(a, z),
        signature: `${target}:${a}`,
        params: { x, y, z, a },
      };
    }),
    podtip('numeric', 'base', (r) => {
      const c = r.pick([2, 3, 5]);
      const p = r.pick([2, 3]);
      const s = r.int(1, p);
      const a = r.pick([0.5, 2, 0.2, 5, 0.1, 10, 1.5, 4]);
      const e = p - s;
      const ans = round9(c ** p * a ** e);
      if (!nice(ans, 3) || ans > 1000) {
        return null;
      }
      const tex = `\\dfrac{(${c}a)^{${p}}}{a${expTex(s)}}`;
      return {
        uslovie: naydiPri(tex, pri(a)),
        otvet: ans,
        razbor: [`$(${c}a)^{${p}} = ${c ** p}a^{${p}}$, после деления на $a${expTex(s)}$ остаётся $${c ** p}${e === 0 ? '' : `a${expTex(e)}`}$`, `$${c ** p}${e === 0 ? '' : ` \\cdot ${d(a)}${expTex(e)}`} = ${d(ans)}$`],
        proverka: Math.pow(c * a, p) / Math.pow(a, s),
        signature: `${c}:${p}:${s}`,
        params: { c, p, s, a },
      };
    }),
  ],
};

function drawY(r: Rng, negatives: boolean): Draft | null {
  const range = negatives ? [-2, -1, 1, 2, 3] : [1, 2, 3];
  const p = r.pick(range);
  const q = r.pick(range);
  const rr = r.pick(negatives ? [-2, -1, 2, 3] : [2, 3]);
  const s = r.int(negatives ? -4 : 0, 4);
  const t = r.int(negatives ? -4 : 0, 4);
  const ea = p * rr - s;
  const eb = q * rr - t;
  if (Math.abs(ea) > 2 || Math.abs(eb) > 2 || (ea === 0 && eb === 0)) {
    return null;
  }
  if (!negatives && (s === 0 && t === 0)) {
    return null;
  }
  const a = r.pick(VALUES_Y);
  const b = r.pick(VALUES_Y);
  const ans = round9(a ** ea * b ** eb);
  if (!nice(ans, 3) || Math.abs(ans) > 1000 || Math.abs(ans) < 0.001) {
    return null;
  }
  const inner = `a${expTex(p)} b${expTex(q)}`;
  const top = `(${inner})^{${rr}}`;
  const bottomParts = [s === 0 ? '' : `a${expTex(s)}`, t === 0 ? '' : `b${expTex(t)}`].filter(Boolean);
  const bottom = bottomParts.join(' ');
  const tex = bottom === '' ? top : `\\dfrac{${top}}{${bottom}}`;
  const monom = (x: string, e: number) => (e === 0 ? '' : `${x}${expTex(e)}`);
  return {
    uslovie: naydiPri(tex, pri(a, b)),
    otvet: ans,
    razbor: [`$${top} = a^{${p * rr}} b^{${q * rr}}$, после деления: $${monom('a', ea)}${monom('b', eb)}$`, `$${ea === 0 ? '' : `${d(a)}${expTex(ea)}`}${ea !== 0 && eb !== 0 ? ' \\cdot ' : ''}${eb === 0 ? '' : `${d(b)}${expTex(eb)}`} = ${d(ans)}$`],
    proverka: Math.pow(Math.pow(a, p) * Math.pow(b, q), rr) / (Math.pow(a, s) * Math.pow(b, t)),
    signature: `${ea}:${eb}:${a}:${b}`,
        params: { p, q, r: rr, s, t, a, b },
  };
}

/* ── 8.Z  логарифмические выражения с буквами ────────────────── */

export const P8Z: Prototype = {
  id: '8.Z',
  group: 'V',
  nazvanie: 'Логарифмы с буквами',
  podtipy: [
    podtip('product', 'base', (r) => {
      const p = r.int(2, 5);
      const a = r.pick([2, 3, 5, 7]);
      const b = r.pick([3, 5, 6, 7, 10, 11]);
      if (a === b) {
        return null;
      }
      const tex = `${log('a', `(a^{${p}} b)`)} - ${log('a', 'b')}`;
      return {
        uslovie: naydiPri(tex, pri(a, b)),
        otvet: p,
        razbor: [`$${log('a', `(a^{${p}} b)`)} = ${p} + ${log('a', 'b')}$`, `$${p} + ${log('a', 'b')} - ${log('a', 'b')} = ${p}$ при любых допустимых $a$, $b$`],
        proverka: Math.log(a ** p * b) / Math.log(a) - Math.log(b) / Math.log(a),
        signature: `${p}:${a}`,
        params: { p, a, b },
      };
    }),
    podtip('chain', 'base', (r) => {
      const p = r.int(2, 6);
      const a = r.pick([2, 3, 5, 7, 10]);
      const b = r.pick([2, 3, 5, 7, 11]);
      if (a === b) {
        return null;
      }
      const tex = `${log('a', 'b')} \\cdot ${log('b', `a^{${p}}`)}`;
      return {
        uslovie: naydiPri(tex, pri(a, b)),
        otvet: p,
        razbor: [`$${log('a', 'b')} \\cdot ${log('b', `a^{${p}}`)} = ${log('a', `a^{${p}}`)}$`, `$${log('a', `a^{${p}}`)} = ${p}$`],
        proverka: (Math.log(b) / Math.log(a)) * (Math.log(a ** p) / Math.log(b)),
        signature: `${p}:${a}`,
        params: { p, a, b, form: 'chain' },
      };
    }),
    podtip('identity', 'advanced', (r) => {
      const a = r.pick([2, 3, 5, 7]);
      const root = r.int(2, 12);
      const b = root * root;
      const tex = `${a}^{${log(String(a * a), 'b')}}`;
      return {
        uslovie: naydiPri(tex, `b = ${b}`),
        otvet: root,
        razbor: [`$${log(String(a * a), 'b')} = \\dfrac{1}{2}${log(String(a), 'b')} = ${log(String(a), '\\sqrt{b}')}$`, `$${a}^{${log(String(a), '\\sqrt{b}')}} = \\sqrt{b} = \\sqrt{${b}} = ${root}$`],
        proverka: Math.pow(a, Math.log(b) / Math.log(a * a)),
        signature: `${a}:${root}`,
        params: { a, b },
      };
    }),
    podtip('given', 'advanced', (r) => {
      const t = r.dec(0.5, 4.5, 1);
      if (Number.isInteger(t)) {
        return null;
      }
      const m = r.int(2, 5);
      const n = r.int(1, m - 1);
      const ans = round9((m - n) * t);
      const tex = `${log('a', `b^{${m}}`)} + ${log('a', `\\dfrac{1}{b^{${n === 1 ? '' : n}}}`)}`.replace('^{}', '');
      return {
        uslovie: `Найдите значение выражения $${tex}$, если $${log('a', 'b')} = ${d(t)}$.`,
        otvet: ans,
        razbor: [`$${log('a', `b^{${m}}`)} = ${m}${log('a', 'b')}$, $${log('a', `\\dfrac{1}{b^{${n}}}`)} = -${n}${log('a', 'b')}$`, `$(${m} - ${n}) \\cdot ${d(t)} = ${d(ans)}$`],
        proverka: m * t + -n * t,
        signature: `${m}:${n}`,
        params: { t, m, n },
      };
    }),
  ],
};
