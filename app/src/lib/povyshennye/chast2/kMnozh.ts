/**
 * Множество ответа для шаблонов семей K, L, M: куски с концами
 * (TeX и число), запись ответа, поле автопроверки и числа для автотеста.
 */

import type { Kusok, Mnozhestvo } from '@/lib/chast2/sravnenie';

export interface Konec {
  tex: string;
  v: number;
}

/** Промежуток или точка (lo = hi, оба конца закрыты). null — бесконечность. */
export interface Kus {
  lo: Konec | null;
  hi: Konec | null;
  loZ: boolean;
  hiZ: boolean;
}

export function kusTex(k: Kus): string {
  if (k.lo !== null && k.hi !== null && k.lo.v === k.hi.v) return `\\{${k.lo.tex}\\}`;
  const l = k.lo === null ? '-\\infty' : k.lo.tex;
  const h = k.hi === null ? '+\\infty' : k.hi.tex;
  return `${k.loZ ? '\\left[' : '\\left('}${l};\\ ${h}${k.hiZ ? '\\right]' : '\\right)'}`;
}

export function mnozhTex(kuski: readonly Kus[]): string {
  return kuski.map(kusTex).join('\\cup');
}

const pl = (k: Konec | null, b: string) => (k === null ? b : k.tex.replace(/\\dfrac/g, '\\frac'));

export function mnozhPole(kuski: readonly Kus[]): Mnozhestvo {
  return {
    kuski: kuski.map((k): Kusok =>
      k.lo !== null && k.hi !== null && k.lo.v === k.hi.v
        ? { t: 'tochka', x: pl(k.lo, '') }
        : {
            t: 'interval',
            lo: pl(k.lo, '-inf'),
            loZakr: k.loZ,
            hi: pl(k.hi, 'inf'),
            hiZakr: k.hiZ,
          },
    ),
  };
}

/** Для автотеста: [lo, hi, loZ, hiZ] по кускам, бесконечность — ±1e9. */
export function mnozhKontrol(kuski: readonly Kus[]): number[] {
  return kuski.flatMap((k) => [k.lo?.v ?? -1e9, k.hi?.v ?? 1e9, k.loZ ? 1 : 0, k.hiZ ? 1 : 0]);
}

/** Целое или десятичное число в TeX: «-1{,}5». */
export function chisloTex(v: number): string {
  return String(Math.round(v * 1e9) / 1e9).replace('.', '{,}');
}
