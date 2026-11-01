/**
 * Метод интервалов для шаблонов n16, p16, q16: ответ неравенства по
 * критическим точкам (целые или дроби) и самой функции. Функция вне ОДЗ
 * возвращает NaN — такие точки и промежутки в ответ не попадают.
 */

import type { Kusok, Mnozhestvo } from '@/lib/chast2/sravnenie';

export type Znak = 'le' | 'ge' | 'lt' | 'gt';

export interface KusokZ {
  lo: number | null;
  hi: number | null;
  loZ: boolean;
  hiZ: boolean;
}

const EPS = 1e-10;

function verno(y: number, z: Znak): boolean {
  if (!Number.isFinite(y)) return false;
  if (z === 'le') return y <= EPS;
  if (z === 'ge') return y >= -EPS;
  if (z === 'lt') return y < -EPS;
  return y > EPS;
}

export function reshitZnaki(
  f: (x: number) => number,
  kritich: readonly number[],
  z: Znak,
): KusokZ[] {
  const c = [...new Set(kritich)].sort((a, b) => a - b);
  /* Отрезки между точками: (−∞; c₀), (c₀; c₁), …, (c_k; +∞). */
  const prom = c.length + 1;
  const vInt: boolean[] = [];
  for (let i = 0; i < prom; i += 1) {
    const lo = i === 0 ? c[0]! - 1 : c[i - 1]!;
    const hi = i === c.length ? c[c.length - 1]! + 1 : c[i]!;
    const t = i === 0 ? c[0]! - 0.5 : i === c.length ? c[c.length - 1]! + 0.5 : (lo + hi) / 2;
    vInt.push(verno(f(t), z));
  }
  const vT = c.map((x) => verno(f(x), z));
  const out: KusokZ[] = [];
  let tek: KusokZ | null = null;
  for (let i = 0; i < prom; i += 1) {
    if (vInt[i]) {
      if (tek === null)
        tek = { lo: i === 0 ? null : c[i - 1]!, hi: null, loZ: i > 0 && vT[i - 1]!, hiZ: false };
    }
    if (i === c.length) break;
    /* Точка c[i] между промежутками i и i + 1. */
    if (tek !== null) {
      if (vT[i] && vInt[i + 1]) continue;
      tek.hi = c[i]!;
      tek.hiZ = vT[i]!;
      out.push(tek);
      tek = null;
    } else if (vT[i] && !vInt[i + 1]) {
      out.push({ lo: c[i]!, hi: c[i]!, loZ: true, hiZ: true });
    } else if (vT[i] && vInt[i + 1]) {
      tek = { lo: c[i]!, hi: null, loZ: true, hiZ: false };
    }
  }
  if (tek !== null) out.push(tek);
  return out;
}

/** Число в TeX: целое или дробь с минусом впереди. */
export function chisloTex(x: number, tex?: (x: number) => string): string {
  if (tex) return tex(x);
  if (Number.isInteger(x)) return String(x);
  for (let d = 2; d <= 64; d += 1) {
    const n = Math.round(x * d);
    if (Math.abs(n / d - x) < 1e-12) return `${n < 0 ? '-' : ''}\\dfrac{${Math.abs(n)}}{${d}}`;
  }
  return String(x).replace('.', '{,}');
}

export function kuskiTex(ks: readonly KusokZ[], tex?: (x: number) => string): string {
  if (ks.length === 0) return '\\varnothing';
  return ks
    .map((k) =>
      k.lo !== null && k.lo === k.hi
        ? `\\{${chisloTex(k.lo, tex)}\\}`
        : `\\left${k.loZ ? '[' : '('}${k.lo === null ? '-\\infty' : chisloTex(k.lo, tex)};\\ ${k.hi === null ? '+\\infty' : chisloTex(k.hi, tex)}\\right${k.hiZ ? ']' : ')'}`,
    )
    .join('\\cup');
}

export function kuskiPole(ks: readonly KusokZ[], tex?: (x: number) => string): Mnozhestvo {
  const t = (x: number) => chisloTex(x, tex).replace(/\\dfrac/g, '\\frac');
  return {
    kuski: ks.map((k): Kusok =>
      k.lo !== null && k.lo === k.hi
        ? { t: 'tochka', x: t(k.lo) }
        : {
            t: 'interval',
            lo: k.lo === null ? '-inf' : t(k.lo),
            loZakr: k.loZ,
            hi: k.hi === null ? 'inf' : t(k.hi),
            hiZakr: k.hiZ,
          },
    ),
  };
}

export function kuskiKontrol(ks: readonly KusokZ[]): number[] {
  return ks.flatMap((k) => [k.lo ?? -1e9, k.hi ?? 1e9, k.loZ ? 1 : 0, k.hiZ ? 1 : 0]);
}

export const ZNAK_TEX: Record<Znak, string> = { le: '\\le', ge: '\\ge', lt: '<', gt: '>' };
