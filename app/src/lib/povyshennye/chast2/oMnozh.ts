/**
 * Множество решений по «атомам» для семей O, I, AE: точки (концы и
 * нули) делят область на промежутки; истинность промежутка — по его
 * середине, точки — подстановкой. Соседние истинные атомы склеиваются.
 */

import type { Kus } from './kMnozh';

export interface Tochka {
  v: number;
  tex: string;
}

type Atom = { tochka: boolean; lo: Tochka | null; hi: Tochka | null; vhodit: boolean };

/**
 * nachalo — левый край области (null — −∞); nachaloVhodit — входит ли
 * он в область (для √(x + a) — да, для x > 0 — нет).
 */
export function kuskiPoTochkam(
  tochkiVse: readonly Tochka[],
  istina: (x: number) => boolean,
  nachalo: Tochka | null = null,
  nachaloVhodit = false,
): Kus[] {
  const vse = [...tochkiVse]
    .filter((t) => nachalo === null || t.v > nachalo.v + 1e-12)
    .sort((a, b) => a.v - b.v)
    .filter((t, i, m) => i === 0 || Math.abs(t.v - m[i - 1]!.v) > 1e-12);
  const atomy: Atom[] = [];
  if (nachalo !== null && nachaloVhodit) {
    atomy.push({ tochka: true, lo: nachalo, hi: nachalo, vhodit: istina(nachalo.v) });
  }
  let lev: Tochka | null = nachalo;
  for (const t of vse) {
    const mid = lev === null ? t.v - 1 : (lev.v + t.v) / 2;
    atomy.push({ tochka: false, lo: lev, hi: t, vhodit: istina(mid) });
    atomy.push({ tochka: true, lo: t, hi: t, vhodit: istina(t.v) });
    lev = t;
  }
  const midK = lev === null ? 0 : lev.v + Math.max(1, Math.abs(lev.v));
  atomy.push({ tochka: false, lo: lev, hi: null, vhodit: istina(midK) });
  const kuski: Kus[] = [];
  let i = 0;
  while (i < atomy.length) {
    if (!atomy[i]!.vhodit) {
      i += 1;
      continue;
    }
    let j = i;
    while (j + 1 < atomy.length && atomy[j + 1]!.vhodit) j += 1;
    const a = atomy[i]!;
    const b = atomy[j]!;
    kuski.push({ lo: a.lo, hi: b.hi, loZ: a.tochka, hiZ: b.tochka });
    i = j + 1;
  }
  return kuski;
}

/** Рациональное p/q в TeX: «3», «-\dfrac{1}{2}». */
export function drobTex(p: number, q = 1): string {
  const g = (a: number, b: number): number => (b === 0 ? Math.abs(a) : g(b, a % b));
  const d = g(p, q) * Math.sign(q);
  const n = p / d;
  const m = q / d;
  if (m === 1) return String(n);
  return `${n < 0 ? '-' : ''}\\dfrac{${Math.abs(n)}}{${m}}`;
}
