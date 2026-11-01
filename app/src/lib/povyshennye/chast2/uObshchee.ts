/**
 * Общие помощники семей U, V, W (варианты 1–6): числа вида p + q√3,
 * сборка множества ответа по числу решений на промежутках параметра.
 */

import { add, mul, rat, ratTex, sub, toNumber, type Rat } from '@/lib/zadanie15/core/rational';
import type { Kus } from './kMnozh';

/** Число p + q√3 с рациональными p, q. */
export interface Q3 {
  p: Rat;
  q: Rat;
}

export const q3 = (p: Rat, q: Rat = rat(0)): Q3 => ({ p, q });
export const q3Add = (a: Q3, b: Q3): Q3 => q3(add(a.p, b.p), add(a.q, b.q));
export const q3Mul = (a: Q3, b: Q3): Q3 =>
  q3(add(mul(a.p, b.p), mul(rat(3), mul(a.q, b.q))), add(mul(a.p, b.q), mul(a.q, b.p)));
export const q3Neg = (a: Q3): Q3 => q3(sub(rat(0), a.p), sub(rat(0), a.q));
export const q3Num = (a: Q3): number => toNumber(a.p) + toNumber(a.q) * Math.sqrt(3);

/** TeX числа p + q√3: «2-\sqrt{3}», «\dfrac{\sqrt{3}}{3}», «-1». */
export function q3Tex(a: Q3): string {
  const pz = a.p.n === 0n;
  const qz = a.q.n === 0n;
  if (qz) return ratTex(a.p);
  const qa = a.q.n < 0n ? sub(rat(0), a.q) : a.q;
  let qs: string;
  if (qa.n === 1n && qa.d === 1n) qs = '\\sqrt{3}';
  else if (qa.d === 1n) qs = `${qa.n}\\sqrt{3}`;
  else if (qa.n === 1n) qs = `\\dfrac{\\sqrt{3}}{${qa.d}}`;
  else qs = `\\dfrac{${qa.n}\\sqrt{3}}{${qa.d}}`;
  if (pz) return (a.q.n < 0n ? '-' : '') + qs;
  return `${ratTex(a.p)}${a.q.n < 0n ? '-' : '+'}${qs}`;
}

/**
 * Множество значений параметра, где число решений n(a) равно nado:
 * критические значения krit, проверка в них и между ними. Соседние
 * подходящие куски (промежуток — точка — промежуток) склеиваются.
 */
export function mnozhPoChislu(
  krit: readonly { v: number; tex: string }[],
  n: (a: number) => number,
  nado: number,
): Kus[] {
  const ks = [...krit].sort((x, y) => x.v - y.v);
  type Atom = { gap: boolean; i: number; ok: boolean };
  const atoms: Atom[] = [];
  const mid = (i: number): number => {
    if (i === 0) return (ks[0]?.v ?? 0) - 1;
    if (i === ks.length) return ks[ks.length - 1]!.v + 1;
    return (ks[i - 1]!.v + ks[i]!.v) / 2;
  };
  for (let i = 0; i <= ks.length; i++) {
    atoms.push({ gap: true, i, ok: n(mid(i)) === nado });
    if (i < ks.length) atoms.push({ gap: false, i, ok: n(ks[i]!.v) === nado });
  }
  const kuski: Kus[] = [];
  let j = 0;
  while (j < atoms.length) {
    if (!atoms[j]!.ok) {
      j++;
      continue;
    }
    let e = j;
    while (e + 1 < atoms.length && atoms[e + 1]!.ok) e++;
    const a = atoms[j]!;
    const b = atoms[e]!;
    if (!a.gap && !b.gap && a.i === b.i) {
      kuski.push({ lo: ks[a.i]!, hi: ks[a.i]!, loZ: true, hiZ: true });
    } else {
      const lo = a.gap ? (a.i === 0 ? null : ks[a.i - 1]!) : ks[a.i]!;
      const hi = b.gap ? (b.i === ks.length ? null : ks[b.i]!) : ks[b.i]!;
      kuski.push({ lo, hi, loZ: !a.gap, hiZ: !b.gap });
    }
    j = e + 1;
  }
  return kuski;
}
