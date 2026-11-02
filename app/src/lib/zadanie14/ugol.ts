/**
 * Углы и серии задания №14 — точный счёт.
 *
 * Угол — доля π (обыкновенная дробь Q) и, если нужно, «хвост» вроде
 * $\operatorname{arctg}3$: так записываются все корни уравнений
 * раздела. Серия — $x=x_0+h\cdot\pi k$, $k\in\mathbb{Z}$: начало $x_0$
 * и шаг $h$ в долях π. Корни на промежутке пункта б считаются из
 * серий точно, поэтому ответ к задаче нигде не пишется руками.
 */

import { add, d, mul, q, sub, val, type Q } from '../zadanie11/num';

export type { Q };
export { q };

/** Слагаемое-арк: $\operatorname{arctg}3$, $\arccos\frac{1}{3}$. */
export interface Arc {
  /** TeX без долларов: «\operatorname{arctg}3». */
  tex: string;
  /** Значение в радианах. */
  v: number;
}

export interface Ugol {
  /** Доля π. */
  pi: Q;
  /** Слагаемое-арк со знаком; нет — угол табличный. */
  arc?: Arc & { znak: 1 | -1 };
}

/** Угол $n\pi/m$. */
export function u(n: number, m = 1): Ugol {
  return { pi: q(n, m) };
}

/** Угол $\pm\operatorname{arc} + n\pi/m$. */
export function ua(arc: Arc, znak: 1 | -1 = 1, n = 0, m = 1): Ugol {
  return { pi: q(n, m), arc: { ...arc, znak } };
}

export const ARC = {
  arctg: (x: number, tex = String(x)): Arc => ({
    tex: `\\operatorname{arctg}${tex}`,
    v: Math.atan(x),
  }),
} as const;

export function znach(a: Ugol): number {
  return val(a.pi) * Math.PI + (a.arc === undefined ? 0 : a.arc.znak * a.arc.v);
}

/** Сдвиг угла на $t\pi$. */
export function sdvig(a: Ugol, t: Q): Ugol {
  return { ...a, pi: add(a.pi, t) };
}

export function protiv(a: Ugol): Ugol {
  return {
    pi: q(-a.pi.n, a.pi.m),
    ...(a.arc === undefined ? {} : { arc: { ...a.arc, znak: (-a.arc.znak) as 1 | -1 } }),
  };
}

/** Доля π в TeX: 1/6 → «\dfrac{\pi}{6}», −5/6 → «-\dfrac{5\pi}{6}», 2 → «2\pi». */
export function piTex(t: Q, drob = '\\dfrac'): string {
  if (t.n === 0) return '0';
  const s = t.n < 0 ? '-' : '';
  const n = Math.abs(t.n);
  const ch = `${n === 1 ? '' : d(n)}\\pi`;
  return t.m === 1 ? `${s}${ch}` : `${s}${drob}{${ch}}{${d(t.m)}}`;
}

/** Угол в TeX: «-\dfrac{5\pi}{6}», «\operatorname{arctg}3+\pi», «-\operatorname{arctg}3-\pi». */
export function ugolTex(a: Ugol, drob = '\\dfrac'): string {
  if (a.arc === undefined) return piTex(a.pi, drob);
  const arc = `${a.arc.znak < 0 ? '-' : ''}${a.arc.tex}`;
  if (a.pi.n === 0) return arc;
  const p = piTex(a.pi, drob);
  return `${arc}${p.startsWith('-') ? p : `+${p}`}`;
}

/** Серия $x=x_0+h\pi k$. */
export interface Seriya {
  nach: Ugol;
  /** Шаг в долях π: 2 — период $2\pi$, 1/2 — шаг $\frac{\pi}{2}$. */
  shag: Q;
}

export function s(nach: Ugol, shagN = 2, shagM = 1): Seriya {
  return { nach, shag: q(shagN, shagM) };
}

/** Слагаемое $h\pi k$: «2\pi k», «\pi k», «\dfrac{\pi k}{2}», «\dfrac{2\pi k}{3}». */
export function shagTex(h: Q, k = 'k', drob = '\\dfrac'): string {
  const n = Math.abs(h.n);
  const ch = `${n === 1 ? '' : d(n)}\\pi ${k}`;
  return h.m === 1 ? ch : `${drob}{${ch}}{${d(h.m)}}`;
}

/** Правая часть записи серии: «\dfrac{\pi}{6}+2\pi k», «\pm\dfrac{\pi}{3}+2\pi k». */
export function seriyaTex(sr: Seriya, k = 'k', pm = false): string {
  const sh = shagTex(sr.shag, k);
  if (pm) return `\\pm${ugolTex(sr.nach)}+${sh}`;
  if (sr.nach.arc === undefined && sr.nach.pi.n === 0) return sh;
  return `${ugolTex(sr.nach)}+${sh}`;
}

/** Каноническое начало серии: $0\le x_0<h\pi$ (для сравнения и склейки). */
export function kanon(sr: Seriya): Seriya {
  const h = val(sr.shag) * Math.PI;
  const x = znach(sr.nach);
  const k = Math.floor(x / h + 1e-9);
  return { nach: sdvig(sr.nach, mul(sr.shag, q(-k))), shag: sr.shag };
}

/**
 * Запись ответа пункта а: серии с одинаковым шагом и началами $\pm a$
 * склеиваются в «$\pm a$». Порядок — как в данных.
 */
export function zapisSeriy(serii: readonly Seriya[], k = 'k'): string[] {
  const out: string[] = [];
  const used = new Set<number>();
  serii.forEach((a, i) => {
    if (used.has(i)) return;
    const j = serii.findIndex(
      (b, jj) =>
        jj > i &&
        !used.has(jj) &&
        b.shag.n * a.shag.m === a.shag.n * b.shag.m &&
        a.nach.arc === undefined &&
        b.nach.arc === undefined &&
        a.nach.pi.n !== 0 &&
        a.nach.pi.n * b.nach.pi.m === -b.nach.pi.n * a.nach.pi.m,
    );
    if (j >= 0) {
      used.add(j);
      const plus = a.nach.pi.n > 0 ? a : (serii[j] as Seriya);
      out.push(`x=${seriyaTex(plus, k, true)}`);
    } else {
      out.push(`x=${seriyaTex(a, k)}`);
    }
  });
  return out;
}

/** Ответ пункта а одной строкой TeX: «x=…,\ x=…,\ k\in\mathbb{Z}». */
export function otvetATex(serii: readonly Seriya[], k = 'k'): string {
  return `${zapisSeriy(serii, k).join(';\\ ')},\\ ${k}\\in\\mathbb{Z}`;
}

/* ── Промежуток пункта б ─────────────────────────────────────── */

export interface Promezhutok {
  ot: Ugol;
  do: Ugol;
  /** Входят ли концы: отрезок — [true, true], [a; b) — [true, false]. */
  vkl: [boolean, boolean];
}

export function otrezok(ot: Ugol, doU: Ugol): Promezhutok {
  return { ot, do: doU, vkl: [true, true] };
}

export function promezhutokTex(p: Promezhutok): string {
  return `\\left${p.vkl[0] ? '[' : '('}${ugolTex(p.ot)};\\,${ugolTex(p.do)}\\right${p.vkl[1] ? ']' : ')'}`;
}

/** Вид промежутка словом: «отрезку», «промежутку». */
export function promezhutokSlovo(p: Promezhutok): string {
  return p.vkl[0] && p.vkl[1] ? 'отрезку' : 'промежутку';
}

const EPS = 1e-9;

/** Корни серий на промежутке — точные углы по возрастанию, без повторов. */
export function korniNaPromezhutke(serii: readonly Seriya[], p: Promezhutok): Ugol[] {
  const lo = znach(p.ot);
  const hi = znach(p.do);
  const out: { a: Ugol; x: number }[] = [];
  for (const sr of serii) {
    const h = val(sr.shag) * Math.PI;
    const x0 = znach(sr.nach);
    const k1 = Math.ceil((lo - x0) / h - 1e-6);
    const k2 = Math.floor((hi - x0) / h + 1e-6);
    for (let k = k1; k <= k2; k += 1) {
      const a = sdvig(sr.nach, mul(sr.shag, q(k)));
      const x = znach(a);
      const vnutri =
        (p.vkl[0] ? x >= lo - EPS : x > lo + EPS) && (p.vkl[1] ? x <= hi + EPS : x < hi - EPS);
      if (vnutri && !out.some((o) => Math.abs(o.x - x) < 1e-7)) out.push({ a, x });
    }
  }
  return out.sort((a, b) => a.x - b.x).map((o) => o.a);
}

export function otvetBTex(korni: readonly Ugol[]): string {
  return korni.length === 0 ? '\\varnothing' : korni.map((a) => ugolTex(a)).join(';\\ ');
}

/** Все корни серий на окне (числа) — для сравнения множеств. */
export function chislaSeriy(serii: readonly Seriya[], lo: number, hi: number): number[] {
  const out: number[] = [];
  for (const sr of serii) {
    const h = val(sr.shag) * Math.PI;
    const x0 = znach(sr.nach);
    for (let k = Math.ceil((lo - x0) / h); k <= Math.floor((hi - x0) / h); k += 1) {
      out.push(x0 + k * h);
    }
  }
  return unikalnye(out);
}

export function unikalnye(xs: readonly number[], eps = 1e-7): number[] {
  const sorted = [...xs].sort((a, b) => a - b);
  const out: number[] = [];
  for (const x of sorted) {
    if (out.length === 0 || x - (out[out.length - 1] as number) > eps) out.push(x);
  }
  return out;
}

/** Совпадают ли два множества чисел (отсортированных, без повторов). */
export function ravnyMnozhestva(a: readonly number[], b: readonly number[], eps = 1e-6): boolean {
  return a.length === b.length && a.every((x, i) => Math.abs(x - (b[i] as number)) < eps);
}

/** Разность углов в долях π (для рисунков и подсказок). */
export function raznost(a: Ugol, b: Ugol): number {
  return (znach(a) - znach(b)) / Math.PI;
}

export { add, mul, sub, val };
