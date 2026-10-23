/**
 * Табличные значения тригонометрии задания №7 и серии решений —
 * лёгкий модуль без решателя: его берут и прототипы (gruppa5), и живой
 * тригонометрический круг теории в браузере.
 */

import { d, q, type Q } from '../zadanie11/num';

/** Угол t·π в TeX: 1/6 → «\\dfrac{\\pi}{6}», −5/6 → «-\\dfrac{5\\pi}{6}», 2 → «2\\pi». */
export function piTex(tq: Q): string {
  if (tq.n === 0) {
    return '0';
  }
  const sign = tq.n < 0 ? '-' : '';
  const n = Math.abs(tq.n);
  if (tq.m === 1) {
    return `${sign}${n === 1 ? '' : d(n)}\\pi`;
  }
  return `${sign}\\dfrac{${n === 1 ? '' : d(n)}\\pi}{${d(tq.m)}}`;
}

export type Funkciya = 'sin' | 'cos' | 'tg';

/** Табличные значения и их запись. */
export const ZNACHENIYA = {
  sin: ['0', '1', '-1', '1/2', '-1/2', 'r2/2', '-r2/2', 'r3/2', '-r3/2'],
  cos: ['0', '1', '-1', '1/2', '-1/2', 'r2/2', '-r2/2', 'r3/2', '-r3/2'],
  tg: ['0', '1', '-1', 'r3', '-r3', '1/r3', '-1/r3'],
} as const;

/** Значение числом. */
export function znachenie(kod: string): number {
  const s = kod.startsWith('-') ? -1 : 1;
  const k = kod.replace(/^-/, '');
  const m: Record<string, number> = {
    '0': 0,
    '1': 1,
    '1/2': 0.5,
    'r2/2': Math.SQRT2 / 2,
    'r3/2': Math.sqrt(3) / 2,
    r3: Math.sqrt(3),
    '1/r3': 1 / Math.sqrt(3),
  };
  const v = m[k];
  if (v === undefined) {
    throw new Error(`нет значения ${kod}`);
  }
  return s * v;
}

/** Значение в TeX: «\dfrac{\sqrt{3}}{2}», «0{,}5», «-1». */
export function znachTex(kod: string, dec = false): string {
  const s = kod.startsWith('-') ? '-' : '';
  const k = kod.replace(/^-/, '');
  const m: Record<string, string> = {
    '0': '0',
    '1': '1',
    '1/2': dec ? '0{,}5' : '\\dfrac{1}{2}',
    'r2/2': '\\dfrac{\\sqrt{2}}{2}',
    'r3/2': '\\dfrac{\\sqrt{3}}{2}',
    r3: '\\sqrt{3}',
    '1/r3': '\\dfrac{1}{\\sqrt{3}}',
  };
  return k === '0' ? '0' : `${s}${m[k]}`;
}

/** Серия решений для аргумента t (в долях π): t = t0 + per·n. */
export interface Seriya {
  t0: Q;
  per: number;
}

/** Серии решений f(t·π) = значение; t в долях π. */
export function serii(f: Funkciya, kod: string): Seriya[] {
  const S = (n: number, m: number, per = 2): Seriya => ({ t0: q(n, m), per });
  const tab: Record<Funkciya, Record<string, Seriya[]>> = {
    sin: {
      '0': [S(0, 1, 1)],
      '1': [S(1, 2)],
      '-1': [S(-1, 2)],
      '1/2': [S(1, 6), S(5, 6)],
      '-1/2': [S(-1, 6), S(-5, 6)],
      'r2/2': [S(1, 4), S(3, 4)],
      '-r2/2': [S(-1, 4), S(-3, 4)],
      'r3/2': [S(1, 3), S(2, 3)],
      '-r3/2': [S(-1, 3), S(-2, 3)],
    },
    cos: {
      '0': [S(1, 2, 1)],
      '1': [S(0, 1)],
      '-1': [S(1, 1)],
      '1/2': [S(1, 3), S(-1, 3)],
      '-1/2': [S(2, 3), S(-2, 3)],
      'r2/2': [S(1, 4), S(-1, 4)],
      '-r2/2': [S(3, 4), S(-3, 4)],
      'r3/2': [S(1, 6), S(-1, 6)],
      '-r3/2': [S(5, 6), S(-5, 6)],
    },
    tg: {
      '0': [S(0, 1, 1)],
      '1': [S(1, 4, 1)],
      '-1': [S(-1, 4, 1)],
      r3: [S(1, 3, 1)],
      '-r3': [S(-1, 3, 1)],
      '1/r3': [S(1, 6, 1)],
      '-1/r3': [S(-1, 6, 1)],
    },
  };
  const s = tab[f][kod];
  if (s === undefined) {
    throw new Error(`нет серий для ${f} = ${kod}`);
  }
  return s;
}
