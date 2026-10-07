/**
 * Числа задания №11: точный счёт с дробями и запись в TeX.
 *
 * Условия текстовых задач дают целые, десятичные и «часы с
 * минутами». Решение ведётся обыкновенными дробями (Q), чтобы корень
 * уравнения и ответ получались точно, без хвостов вроде 11,999999.
 * Запись в TeX — с десятичной запятой `{,}`.
 */

/** Наибольший общий делитель. */
export function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    [x, y] = [y, x % y];
  }
  return x;
}

export function lcm(a: number, b: number): number {
  return Math.abs(a * b) / gcd(a, b);
}

/** Округление до девяти знаков: столько же у отпечатка ответа. */
export function round9(x: number): number {
  return Math.round(x * 1e9) / 1e9;
}

/** Целое или конечная десятичная дробь не длиннее `places` знаков. */
export function nice(x: number, places = 4): boolean {
  if (!Number.isFinite(x)) {
    return false;
  }
  const scaled = x * 10 ** places;
  return Math.abs(scaled - Math.round(scaled)) < 1e-7;
}

/** Число строкой с запятой: 1,5; 220000; 2,25. */
export function ru(x: number): string {
  const v = round9(x);
  return String(v).replace('.', ',').replace('-', '−');
}

/** Число в TeX: 1{,}5. Большие целые — с тонким пробелом по разрядам. */
export function d(x: number): string {
  const v = round9(x);
  const [int = '0', frac] = String(Math.abs(v)).split('.');
  const grouped = int.length > 4 ? int.replace(/\B(?=(\d{3})+(?!\d))/g, '\\,') : int;
  return (v < 0 ? '-' : '') + grouped + (frac ? `{,}${frac}` : '');
}

/** Число для текста условия: 191 400; 0,9; 15 842. */
export function txt(x: number): string {
  const v = round9(x);
  const [int = '0', frac] = String(Math.abs(v)).split('.');
  const grouped = int.length > 4 ? int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : int;
  return (v < 0 ? '−' : '') + grouped + (frac ? `,${frac}` : '');
}

/* ── Дроби ──────────────────────────────────────────────────────── */

/** Обыкновенная дробь n/m, всегда сокращённая, m > 0. */
export interface Q {
  n: number;
  m: number;
}

export function q(n: number, m = 1): Q {
  if (m === 0) {
    throw new Error('деление на ноль');
  }
  if (!Number.isInteger(n) || !Number.isInteger(m)) {
    return fromDecimal(n / m);
  }
  const g = gcd(n, m) || 1;
  const s = m < 0 ? -1 : 1;
  return { n: (s * n) / g, m: (s * m) / g };
}

/** Десятичное число как дробь: 0,85 → 17/20. */
export function fromDecimal(x: number): Q {
  for (let m = 1; m <= 1_000_000; m *= 10) {
    const n = x * m;
    if (Math.abs(n - Math.round(n)) < 1e-9) {
      return q(Math.round(n), m);
    }
  }
  for (let m = 1; m <= 10_000; m += 1) {
    const n = x * m;
    if (Math.abs(n - Math.round(n)) < 1e-9) {
      return q(Math.round(n), m);
    }
  }
  throw new Error(`не дробь: ${x}`);
}

export const add = (a: Q, b: Q): Q => q(a.n * b.m + b.n * a.m, a.m * b.m);
export const sub = (a: Q, b: Q): Q => q(a.n * b.m - b.n * a.m, a.m * b.m);
export const mul = (a: Q, b: Q): Q => q(a.n * b.n, a.m * b.m);
export const div = (a: Q, b: Q): Q => q(a.n * b.m, a.m * b.n);
export const val = (a: Q): number => a.n / a.m;
export const isInt = (a: Q): boolean => a.m === 1;

/** Дробь в TeX: целое — числом, конечная десятичная по желанию — с запятой. */
export function fq(a: Q, decimal = false): string {
  if (a.m === 1) {
    return d(a.n);
  }
  if (decimal && nice(val(a), 4)) {
    return d(val(a));
  }
  const sign = a.n < 0 ? '-' : '';
  return `${sign}\\dfrac{${d(Math.abs(a.n))}}{${d(a.m)}}`;
}

/** Дробь из чисел в TeX без сокращения: \dfrac{156}{x}. */
export function frac(top: string | number, bottom: string | number): string {
  const t = typeof top === 'number' ? d(top) : top;
  const b = typeof bottom === 'number' ? d(bottom) : bottom;
  return `\\dfrac{${t}}{${b}}`;
}

/** Целый квадратный корень или null. */
export function isqrt(n: number): number | null {
  if (n < 0 || !Number.isInteger(n)) {
    return null;
  }
  const r = Math.round(Math.sqrt(n));
  return r * r === n ? r : null;
}

/** Простые делители числа с кратностями: 8100 → 2²·3⁴·5². */
export function factor(n: number): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  let m = Math.abs(n);
  for (let p = 2; p * p <= m; p += 1) {
    let k = 0;
    while (m % p === 0) {
      m /= p;
      k += 1;
    }
    if (k > 0) {
      out.push([p, k]);
    }
  }
  if (m > 1) {
    out.push([m, 1]);
  }
  return out;
}
