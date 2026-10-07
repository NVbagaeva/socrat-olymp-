/**
 * Видимость: какие куски линий сплошные, какие — штрихом.
 *
 * Камера — параллельная проекция (направление взгляда) или
 * центральная (точка глаза). Пересчитывается на каждом повороте.
 *
 * Рёбра тела: ребро невидимо, если обе его грани повёрнуты от
 * зрителя, — точное правило для выпуклого тела.
 *
 * Любой другой отрезок (сторона сечения, след, продолжение ребра,
 * прямая построения): точка закрыта, если луч от неё к зрителю
 * входит внутрь тела. Для выпуклого тела закрытые точки отрезка
 * образуют один промежуток, поэтому достаточно найти его границы:
 * грубый шаг по отрезку и уточнение делением пополам.
 */

import { type V, add, dot, lerp, sub } from './geom';
import type { Gran, Otrezok, Rebro, Scena, Telo } from './scena';

export type Kamera =
  | { vid: 'orto'; /** Единичный вектор от сцены к зрителю. */ k: V }
  | { vid: 'persp'; /** Точка глаза. */ glaz: V };

/** Повёрнута ли грань к зрителю. */
export function licom(g: Gran, kam: Kamera): boolean {
  if (kam.vid === 'orto') {
    return dot(g.n, kam.k) > 1e-12;
  }
  return dot(g.n, kam.glaz) - g.c > 1e-12;
}

/** Видно ли ребро тела (хотя бы одна грань к зрителю). */
export function rebroVidno(t: Telo, r: Rebro, kam: Kamera): boolean {
  const [f1, f2] = r.f;
  return licom(t.grani[f1] as Gran, kam) || licom(t.grani[f2] as Gran, kam);
}

/**
 * Закрыта ли точка телом: луч P + s·d (к зрителю) пересекает
 * внутренность тела при s > 0. Отсечение луча полупространствами
 * граней (Кируса — Бека). eps — допуск в единицах длины.
 */
export function zakryta(p: V, t: Telo, kam: Kamera, eps: number): boolean {
  const d = kam.vid === 'orto' ? kam.k : sub(kam.glaz, p);
  let lo = 0;
  let hi = kam.vid === 'orto' ? Number.POSITIVE_INFINITY : 1;
  for (const g of t.grani) {
    const num = g.c - dot(g.n, p); // > 0 — точка внутри полупространства
    const den = dot(g.n, d);
    if (Math.abs(den) < 1e-14) {
      if (num < eps) {
        return false; // луч идёт вдоль грани снаружи или по ней
      }
      continue;
    }
    const s = num / den;
    if (den < 0) {
      lo = Math.max(lo, s); // входит в полупространство
    } else {
      hi = Math.min(hi, s); // выходит
    }
    if (hi - lo <= eps / Math.max(Math.hypot(d[0], d[1], d[2]), 1e-12)) {
      return false;
    }
  }
  return hi - lo > eps / Math.max(Math.hypot(d[0], d[1], d[2]), 1e-12);
}

export function zakrytaKemTo(p: V, tela: readonly Telo[], kam: Kamera, eps: number): boolean {
  return tela.some((t) => zakryta(p, t, kam, eps));
}

/** Кусок отрезка: параметры по отрезку и видимость. */
export interface Kusok {
  t0: number;
  t1: number;
  vidno: boolean;
}

const SHAGOV = 48;
const UTOCHNENIY = 22;

/** Разбить отрезок на видимые и закрытые куски. */
export function kuskiOtrezka(a: V, b: V, tela: readonly Telo[], kam: Kamera, eps: number): Kusok[] {
  const skryto = (t: number) => zakrytaKemTo(lerp(a, b, t), tela, kam, eps);
  const flags: boolean[] = [];
  for (let i = 0; i <= SHAGOV; i += 1) {
    flags.push(skryto(i / SHAGOV));
  }
  const kuski: Kusok[] = [];
  let start = 0;
  let cur = flags[0] as boolean;
  for (let i = 1; i <= SHAGOV; i += 1) {
    const f = flags[i] as boolean;
    if (f === cur) {
      continue;
    }
    // Граница между (i−1)/N и i/N — делением пополам.
    let lo = (i - 1) / SHAGOV;
    let hi = i / SHAGOV;
    for (let k = 0; k < UTOCHNENIY; k += 1) {
      const m = (lo + hi) / 2;
      if (skryto(m) === cur) {
        lo = m;
      } else {
        hi = m;
      }
    }
    const t = (lo + hi) / 2;
    kuski.push({ t0: start, t1: t, vidno: !cur });
    start = t;
    cur = f;
  }
  kuski.push({ t0: start, t1: 1, vidno: !cur });
  return skleit(kuski);
}

/**
 * Крошечные куски (вершина на видимой грани, касание) — не рисуются
 * отдельно: доля отрезка меньше 1/1000 сливается с соседом.
 */
function skleit(kuski: Kusok[]): Kusok[] {
  const MIN = 1e-3;
  const out: Kusok[] = [];
  for (const k of kuski) {
    const last = out.at(-1);
    if (last && (k.t1 - k.t0 < MIN || last.vidno === k.vidno)) {
      last.t1 = k.t1;
      continue;
    }
    if (!last && k.t1 - k.t0 < MIN && kuski.length > 1) {
      // Первый кусок крошечный — отдаём его следующему.
      continue;
    }
    out.push({ ...k, t0: last ? last.t1 : 0 });
  }
  return out;
}

/** Готовая к рисованию линия: концы и видимость. */
export interface Liniya {
  a: V;
  b: V;
  vidno: boolean;
  /** rebro — ребро тела; иначе вид отрезка сцены. */
  vid: 'rebro' | Otrezok['vid'];
}

/** Все линии сцены с видимостью для данной камеры. */
export function linii(sc: Scena, kam: Kamera, sdvigi?: readonly V[]): Liniya[] {
  const eps = sc.razmer * 1e-7;
  const tela = sdvigi ? sc.tela.map((t, i) => sdvinut(t, sdvigi[i] ?? [0, 0, 0])) : sc.tela;
  const out: Liniya[] = [];
  tela.forEach((t) => {
    for (const r of t.rebra) {
      out.push({ a: r.a, b: r.b, vidno: rebroVidno(t, r, kam), vid: 'rebro' });
    }
  });
  for (const o of sc.otrezki) {
    for (const k of kuskiOtrezka(o.a, o.b, tela, kam, eps)) {
      out.push({ a: lerp(o.a, o.b, k.t0), b: lerp(o.a, o.b, k.t1), vidno: k.vidno, vid: o.vid });
    }
  }
  return out;
}

/** Тело, сдвинутое на вектор (части при разрезании). */
export function sdvinut(t: Telo, v: V): Telo {
  if (v[0] === 0 && v[1] === 0 && v[2] === 0) {
    return t;
  }
  const m = (p: V) => add(p, v);
  return {
    grani: t.grani.map((g) => ({ pts: g.pts.map(m), n: g.n, c: g.c + dot(g.n, v) })),
    rebra: t.rebra.map((r) => ({ a: m(r.a), b: m(r.b), f: r.f })),
  };
}
