/**
 * Видимость: какие куски линий сплошные, какие — штрихом.
 *
 * Камера — параллельная проекция (направление взгляда) или
 * центральная (точка глаза). Пересчитывается на каждом повороте.
 * Всё считается аналитически (удаление невидимых линий), а не
 * буфером глубины WebGL.
 *
 * Рёбра тела: ребро невидимо, если обе его грани повёрнуты от
 * зрителя, — точное правило для выпуклого тела. Так же — отрезки,
 * лежащие на поверхности (стороны сечения): на лицевой грани —
 * сплошные, на невидимой — штрихом. Ребро «ровно по краю» (одна
 * грань лицевая, другая смотрит ребром) — видно.
 *
 * Любой другой отрезок (след, продолжение ребра, прямая построения,
 * контур секущей плоскости) разбивается на куски точками, где в
 * проекции он пересекает контуры лицевых граней (рёбра, у которых
 * хотя бы одна грань лицевая) и дополнительные контуры (контур
 * плоскости), а также точками, где он протыкает грань. Между такими
 * точками видимость не меняется, поэтому каждый кусок проверяется
 * по одной точке — середине: закрыта ли она лицевой гранью (луч от
 * неё к зрителю входит внутрь тела).
 */

import { type V, add, cross, dist, dot, lerp, sub } from './geom';
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

/** Направление «к зрителю» в точке: для центральной проекции — к глазу. */
const kZritelyu = (kam: Kamera, p: V): V => (kam.vid === 'orto' ? kam.k : sub(kam.glaz, p));

/**
 * Параметр t, где отрезок ab в проекции пересекает отрезок ef
 * (контур). Точка ищется в пространстве: пересечение ab с
 * «лучевой» плоскостью через ef и направление взгляда; затем
 * проверяется, что она проецируется внутрь ef.
 */
function peresechenieVProektsii(a: V, b: V, e: V, f: V, kam: Kamera): number | null {
  const ef = sub(f, e);
  const m = cross(ef, kZritelyu(kam, e));
  const sa = dot(m, sub(a, e));
  const sb = dot(m, sub(b, e));
  if ((sa > 0 && sb > 0) || (sa < 0 && sb < 0) || sa === sb) return null;
  const t = sa / (sa - sb);
  if (t <= 0 || t >= 1) return null;
  const x = lerp(a, b, t);
  // Положение проекции x на ef: x и прямая ef лежат в одной лучевой
  // плоскости, параметр — по проекции на ef вдоль луча.
  const d = kZritelyu(kam, x);
  const w = cross(d, m); // направление в лучевой плоскости, поперёк луча
  const den = dot(w, ef);
  if (Math.abs(den) < 1e-14) return null;
  const s = dot(w, sub(x, e)) / den;
  return s >= -1e-9 && s <= 1 + 1e-9 ? t : null;
}

/** Параметр t, где отрезок ab протыкает грань (внутри неё). */
function prokolGrani(a: V, b: V, g: Gran, eps: number): number | null {
  const da = dot(g.n, a) - g.c;
  const db = dot(g.n, b) - g.c;
  if ((da > eps && db > eps) || (da < -eps && db < -eps) || Math.abs(da - db) < 1e-14) {
    return null;
  }
  const t = da / (da - db);
  if (t <= 0 || t >= 1) return null;
  const x = lerp(a, b, t);
  const n = g.pts.length;
  for (let i = 0; i < n; i += 1) {
    const p = g.pts[i] as V;
    const q = g.pts[(i + 1) % n] as V;
    if (dot(cross(sub(q, p), sub(x, p)), g.n) < -eps * dist(p, q)) return null;
  }
  return t;
}

/**
 * Разбить отрезок на видимые и закрытые куски — аналитически.
 * kontury — дополнительные отрезки, на которых отрезок тоже
 * разбивается (контур секущей плоскости).
 */
export function kuskiOtrezka(
  a: V,
  b: V,
  tela: readonly Telo[],
  kam: Kamera,
  eps: number,
  kontury: readonly (readonly [V, V])[] = [],
): Kusok[] {
  const ts: number[] = [0, 1];
  for (const t of tela) {
    const lic = t.grani.map((g) => licom(g, kam));
    for (const r of t.rebra) {
      if (!lic[r.f[0]] && !lic[r.f[1]]) continue;
      const x = peresechenieVProektsii(a, b, r.a, r.b, kam);
      if (x !== null) ts.push(x);
    }
    for (const g of t.grani) {
      const x = prokolGrani(a, b, g, eps);
      if (x !== null) ts.push(x);
    }
  }
  for (const [e, f] of kontury) {
    const x = peresechenieVProektsii(a, b, e, f, kam);
    if (x !== null) ts.push(x);
  }
  ts.sort((x, y) => x - y);
  const kuski: Kusok[] = [];
  for (let i = 0; i + 1 < ts.length; i += 1) {
    const t0 = ts[i] as number;
    const t1 = ts[i + 1] as number;
    if (t1 - t0 < 1e-12) continue;
    const vidno = !zakrytaKemTo(lerp(a, b, (t0 + t1) / 2), tela, kam, eps);
    const last = kuski.at(-1);
    if (last && last.vidno === vidno) last.t1 = t1;
    else kuski.push({ t0: last ? last.t1 : 0, t1, vidno });
  }
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

/** Грань к зрителю или смотрит ребром (для отрезков на поверхности). */
function neOtvernuta(g: Gran, kam: Kamera): boolean {
  const l = kam.vid === 'orto' ? dot(g.n, kam.k) : dot(g.n, kam.glaz) - g.c;
  return l > -1e-9;
}

/** Контур секущей плоскости отрезками. */
export function konturPloskosti(pts: readonly V[]): [V, V][] {
  return pts.map((p, i) => [p, pts[(i + 1) % pts.length] as V]);
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
  const kontur = sc.ploskost ? konturPloskosti(sc.ploskost) : [];
  const otrezki: Otrezok[] = [
    ...sc.otrezki,
    ...kontur.map(([a, b]): Otrezok => ({ a, b, vid: 'ploskost' })),
  ];
  const telo = tela[0];
  for (const o of otrezki) {
    if (o.grani && telo && !sdvigi) {
      const vidno = o.grani.some((f) => {
        const g = telo.grani[f];
        return g !== undefined && neOtvernuta(g, kam);
      });
      out.push({ a: o.a, b: o.b, vidno, vid: o.vid });
      continue;
    }
    for (const k of kuskiOtrezka(o.a, o.b, tela, kam, eps, kontur)) {
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
