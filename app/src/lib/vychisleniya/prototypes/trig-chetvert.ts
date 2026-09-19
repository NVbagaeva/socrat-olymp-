/**
 * Группа III, значения по данному значению и четверти: 8.M, 8.N, 8.O, 8.P.
 *
 * Правило группы: искомое значение задаётся первым как m/n с
 * «хорошим» n, данное выводится из основного тождества. Знаки — по
 * четверти; четверть записывается интервалом в радианах.
 */

import { gcd, nice, round9, simpRoot } from '../numbers';
import type { Rng } from '../rng';
import { d, fn, quarterInterval } from '../tex';
import type { Draft, Prototype } from '../types';
import { keys, podtip } from './common';

type Quarter = 1 | 2 | 3 | 4;

const SIGN: Record<'sin' | 'cos' | 'tg', Record<Quarter, 1 | -1>> = {
  sin: { 1: 1, 2: 1, 3: -1, 4: -1 },
  cos: { 1: 1, 2: -1, 3: -1, 4: 1 },
  tg: { 1: 1, 2: -1, 3: 1, 4: -1 },
};

const ROMAN: Record<Quarter, string> = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV' };

/** Дробь k√m / n в упрощённой записи, со знаком. */
function radicalFrac(sign: 1 | -1, num: number, m: number, den: number): string {
  const g = gcd(num, den);
  const k = num / g;
  const n = den / g;
  const top = m === 1 ? String(k) : `${k === 1 ? '' : k}\\sqrt{${m}}`;
  const body = n === 1 ? top : `\\dfrac{${top}}{${n}}`;
  return sign < 0 ? `-${body}` : body;
}

/** sin по cos (find = 'sin') или cos по sin (find = 'cos'). */
function drawMN(r: Rng, find: 'sin' | 'cos', wantBase: boolean): Draft | null {
  const given = find === 'sin' ? 'cos' : 'sin';
  const n = r.pick([4, 5, 10, 20, 25]);
  const m = r.int(1, n - 1);
  if (!nice(m / n, 2)) {
    return null;
  }
  const rest = n * n - m * m;
  const { k, m: rad } = simpRoot(rest);
  if (rad > 100) {
    return null;
  }
  const q = r.pick([1, 2, 3, 4] as const);
  const rational = rad === 1;
  const isBase = q === 1 || rational;
  if (isBase !== wantBase) {
    return null;
  }
  /* Рациональное данное записывается десятичной дробью, как в ЕГЭ:
     знаменатели 4, 5, 10, 20, 25 всегда дают конечную запись. */
  const givenTex = rational ? d((SIGN[given][q] * k) / n) : radicalFrac(SIGN[given][q], k, rad, n);
  const ans = round9((SIGN[find][q] * m) / n);
  const uslovie = `Найдите $${fn(find)}\\alpha$, если $${fn(given)}\\alpha = ${givenTex}$ и $\\alpha \\in ${quarterInterval(q)}$.`;
  return {
    uslovie,
    otvet: ans,
    razbor: [
      `$${fn(find)}^2\\alpha = 1 - ${fn(given)}^2\\alpha = 1 - \\dfrac{${rest}}{${n * n}} = \\dfrac{${m * m}}{${n * n}}$`,
      `$\\alpha$ в ${ROMAN[q]} четверти, там $${fn(find)}\\alpha ${SIGN[find][q] > 0 ? '>' : '<'} 0$, поэтому $${fn(find)}\\alpha = ${d(ans)}$`,
    ],
    proverka: SIGN[find][q] * Math.sqrt(1 - ((SIGN[given][q] * k * Math.sqrt(rad)) / n) ** 2),
    signature: `${n}:${m}`,
    params: { n, m, q },
  };
}

export const P8M: Prototype = {
  id: '8.M',
  group: 'III',
  nazvanie: 'Найти sin α по cos α',
  podtipy: [
    podtip('base', 'base', (r) => drawMN(r, 'sin', true)),
    podtip('adv', 'advanced', (r) => drawMN(r, 'sin', false)),
  ],
  isklyucheniya: keys([
    { n: 5, m: 1, q: 1 },
    { n: 10, m: 9, q: 1 },
    { n: 4, m: 3, q: 2 },
    { n: 5, m: 2, q: 2 },
    { n: 10, m: 9, q: 3 },
    { n: 10, m: 7, q: 3 },
    { n: 10, m: 3, q: 4 },
    { n: 4, m: 3, q: 4 },
  ]),
};

export const P8N: Prototype = {
  id: '8.N',
  group: 'III',
  nazvanie: 'Найти cos α по sin α',
  podtipy: [
    podtip('base', 'base', (r) => drawMN(r, 'cos', true)),
    podtip('adv', 'advanced', (r) => drawMN(r, 'cos', false)),
  ],
  isklyucheniya: keys([
    { n: 4, m: 3, q: 1 },
    { n: 10, m: 1, q: 1 },
    { n: 4, m: 2, q: 1 },
    { n: 25, m: 24, q: 1 },
    { n: 5, m: 1, q: 2 },
    { n: 10, m: 1, q: 2 },
    { n: 5, m: 2, q: 2 },
    { n: 4, m: 3, q: 2 },
    { n: 5, m: 2, q: 3 },
    { n: 10, m: 9, q: 3 },
    { n: 4, m: 2, q: 3 },
    { n: 10, m: 7, q: 3 },
    { n: 25, m: 24, q: 4 },
    { n: 10, m: 3, q: 4 },
    { n: 5, m: 1, q: 4 },
    { n: 5, m: 2, q: 4 },
  ]),
};

/* ── 8.O  тангенс по синусу или косинусу ─────────────────────── */

export const P8O: Prototype = {
  id: '8.O',
  group: 'III',
  nazvanie: 'Найти tg α',
  podtipy: [
    podtip('triple', 'base', (r) => {
      /* Десятичные sin и cos с «хорошим» отношением дают только
         тройки семейства 3-4-5: tg = ±0,75. Даётся меньший катет как
         синус или больший как косинус. */
      const scale = r.pick([1, 2, 5]);
      const [a, b, c] = [3 * scale, 4 * scale, 5 * scale];
      const given = r.pick(['sin', 'cos'] as const);
      const q = r.pick([1, 2, 3, 4] as const);
      const value = given === 'sin' ? a / c : b / c;
      const givenTex = d(SIGN[given][q] * value);
      const ans = round9((SIGN.tg[q] * a) / b);
      const other = given === 'sin' ? 'cos' : 'sin';
      const otherValue = given === 'sin' ? b / c : a / c;
      return {
        uslovie: `Найдите $\\operatorname{tg}\\alpha$, если $${fn(given)}\\alpha = ${givenTex}$ и $\\alpha \\in ${quarterInterval(q)}$.`,
        otvet: ans,
        razbor: [
          `$${fn(other)}^2\\alpha = 1 - ${d(value * value)} = ${d(round9(otherValue * otherValue))}$, в ${ROMAN[q]} четверти $${fn(other)}\\alpha = ${d(SIGN[other][q] * otherValue)}$`,
          `$\\operatorname{tg}\\alpha = \\dfrac{\\sin\\alpha}{\\cos\\alpha} = ${d(ans)}$`,
        ],
        proverka:
          given === 'sin'
            ? (SIGN.sin[q] * value) / (SIGN.cos[q] * Math.sqrt(1 - value * value))
            : (SIGN.sin[q] * Math.sqrt(1 - value * value)) / (SIGN.cos[q] * value),
        signature: `${given}:${scale}:${q}`,
        params: { given, value: round9(value), q },
      };
    }),
    podtip('root-int', 'base', (r) => drawO(r, [1])),
    podtip('root', 'advanced', (r) => drawO(r, [2, 4, 5, 8, 10])),
  ],
  isklyucheniya: keys([
    { given: 'sin', p: 2, q: 5, quarter: 1 },
    { given: 'sin', p: 1, q: 5, quarter: 1 },
    { given: 'cos', p: 4, q: 1, quarter: 1 },
    { given: 'cos', p: 2, q: 1, quarter: 1 },
    { given: 'sin', p: 3, q: 5, quarter: 2 },
    { given: 'sin', p: 2, q: 1, quarter: 2 },
    { given: 'cos', p: 3, q: 1, quarter: 2 },
    { given: 'cos', p: 5, q: 1, quarter: 2 },
    { given: 'sin', p: 4, q: 5, quarter: 3 },
    { given: 'sin', p: 5, q: 4, quarter: 3 },
    { given: 'cos', p: 1, q: 5, quarter: 3 },
    { given: 'cos', p: 2, q: 3, quarter: 3 },
    { given: 'sin', p: 1, q: 2, quarter: 4 },
    { given: 'sin', p: 3, q: 5, quarter: 4 },
    { given: 'cos', p: 2, q: 5, quarter: 4 },
    { given: 'cos', p: 4, q: 1, quarter: 4 },
  ]),
};

/** Тангенс по данному с корнем: sin α = p/√(p²+q²) или cos α = q/√(p²+q²). */
function drawO(r: Rng, qs: number[]): Draft | null {
  {
    const p = r.int(qs.length === 1 ? 2 : 1, 9);
    const qq = r.pick(qs);
    if (gcd(p, qq) !== 1 || p === qq) {
      return null;
    }
    const s = p * p + qq * qq;
    const { k, m } = simpRoot(s);
    if (m === 1) {
      return null;
    }
    const given = r.pick(['sin', 'cos'] as const);
    const q = r.pick([1, 2, 3, 4] as const);
    /* sin α = p/√s = p√m / (k·m), cos α = q/√s. */
    const num = given === 'sin' ? p : qq;
    const givenTex = radicalFrac(SIGN[given][q], num, m, k * m);
    const ans = round9((SIGN.tg[q] * p) / qq);
    if (!nice(ans, 3)) {
      return null;
    }
    const other = given === 'sin' ? 'cos' : 'sin';
    const otherNum = given === 'sin' ? qq : p;
    return {
      uslovie: `Найдите $\\operatorname{tg}\\alpha$, если $${fn(given)}\\alpha = ${givenTex}$ и $\\alpha \\in ${quarterInterval(q)}$.`,
      otvet: ans,
      razbor: [
        `$${fn(given)}^2\\alpha = \\dfrac{${num * num}}{${s}}$, значит $${fn(other)}^2\\alpha = \\dfrac{${otherNum * otherNum}}{${s}}$ и $${fn(other)}\\alpha = ${radicalFrac(SIGN[other][q], otherNum, m, k * m)}$`,
        `$\\operatorname{tg}\\alpha = \\dfrac{\\sin\\alpha}{\\cos\\alpha} = ${SIGN.tg[q] < 0 ? '-' : ''}\\dfrac{${p}}{${qq}} = ${d(ans)}$`,
      ],
      proverka:
        given === 'sin'
          ? (SIGN.sin[q] * (p / Math.sqrt(s))) / (SIGN.cos[q] * Math.sqrt(1 - (p * p) / s))
          : (SIGN.sin[q] * Math.sqrt(1 - (qq * qq) / s)) / (SIGN.cos[q] * (qq / Math.sqrt(s))),
      signature: `${p}:${qq}`,
      params: { given, p, q: qq, quarter: q },
    };
  }
}

/* ── 8.P  k·cos 2α по sin α или cos α ────────────────────────── */

function drawP(r: Rng, integer: boolean): Draft | null {
  const s = r.pick([-9, -8, -7, -6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7, 8, 9]) / 10;
  const given = r.pick(['sin', 'cos'] as const);
  const c2 = round9(given === 'sin' ? 1 - 2 * s * s : 2 * s * s - 1);
  const k = r.int(2, 25);
  const ans = round9(k * c2);
  if (ans === 0 || Number.isInteger(ans) !== integer || !nice(ans, 2)) {
    return null;
  }
  if (!integer && s > 0 && r.int(0, 1) === 0) {
    return null;
  }
  const formula = given === 'sin' ? `1 - 2\\sin^2\\alpha` : `2\\cos^2\\alpha - 1`;
  return {
    uslovie: `Найдите $${k}\\cos 2\\alpha$, если $${fn(given)}\\alpha = ${d(s)}$.`,
    otvet: ans,
    razbor: [
      `$\\cos 2\\alpha = ${formula} = ${given === 'sin' ? `1 - 2 \\cdot ${d(round9(s * s))}` : `2 \\cdot ${d(round9(s * s))} - 1`} = ${d(c2)}$`,
      `$${k} \\cdot ${d(c2) === '-' ? '' : ''}${c2 < 0 ? `(${d(c2)})` : d(c2)} = ${d(ans)}$`,
    ],
    proverka: k * Math.cos(2 * (given === 'sin' ? Math.asin(s) : Math.acos(s))),
    signature: `${given}:${s}`,
    params: { given, s, k },
  };
}

export const P8P: Prototype = {
  id: '8.P',
  group: 'III',
  nazvanie: 'Косинус двойного угла по sin или cos',
  podtipy: [
    podtip('int', 'base', (r) => drawP(r, true)),
    podtip('dec', 'advanced', (r) => drawP(r, false)),
  ],
  isklyucheniya: keys([
    { given: 'sin', s: 0.6, k: 3 },
    { given: 'cos', s: 0.5, k: 16 },
    { given: 'sin', s: -0.5, k: 4 },
    { given: 'cos', s: -0.8, k: 3 },
  ]),
};
