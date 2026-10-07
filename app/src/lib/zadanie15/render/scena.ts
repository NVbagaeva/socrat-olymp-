/**
 * Сцена чертежа: что рисовать, без камеры и без three.js.
 *
 * Тело — выпуклый многогранник гранями (обход против часовой стрелки
 * снаружи, внешняя нормаль). Рёбра выводятся из граней. Разрезанное
 * тело — два таких тела, поэтому видимость и рисование одинаковы
 * для целого куба и для его частей.
 *
 * Кроме тела: сечение (многоугольник в своей плоскости),
 * вспомогательные отрезки — следы, продолжения рёбер, прямые
 * построения — и подписанные точки.
 */

import {
  type Plane,
  type Polyhedron,
  type Section,
  section as coreSection,
  toArray,
} from '../core';
import { type V, centroid, dist, dot, key, norm, sub } from './geom';

export interface Gran {
  pts: V[];
  /** Внешняя единичная нормаль. */
  n: V;
  /** Плоскость n·X = c. */
  c: number;
}

export interface Rebro {
  a: V;
  b: V;
  /** Индексы двух граней тела, которым принадлежит ребро. */
  f: [number, number];
}

export interface Telo {
  grani: Gran[];
  rebra: Rebro[];
}

/** Вид отрезка: от него зависит цвет и толщина. */
export type VidOtrezka = 'sechenie' | 'vspom';

export interface Otrezok {
  a: V;
  b: V;
  vid: VidOtrezka;
}

export interface Metka {
  p: V;
  /** Имя в записи TeX: «A_1», «M», «K'». */
  name: string;
  /** Вершина тела или точка построения (точку рисуем кружком). */
  vid: 'vershina' | 'tochka';
}

export interface Sechenie {
  pts: V[];
  /** Единичная нормаль плоскости сечения. */
  n: V;
  /** Имена вершин сечения, если они есть (для натуральной величины). */
  names: (string | null)[];
}

export interface Scena {
  tela: Telo[];
  sechenie: Sechenie | null;
  otrezki: Otrezok[];
  metki: Metka[];
  /** Характерный размер — для допусков и масштаба. */
  razmer: number;
  centr: V;
}

/** Грань по вершинам: нормаль считается по обходу. */
export function gran(pts: V[]): Gran {
  let n: V = [0, 0, 0];
  for (let i = 0; i < pts.length; i += 1) {
    const a = pts[i] as V;
    const b = pts[(i + 1) % pts.length] as V;
    // Формула Ньюэлла: устойчива и для почти вырожденных граней.
    n = [
      n[0] + (a[1] - b[1]) * (a[2] + b[2]),
      n[1] + (a[2] - b[2]) * (a[0] + b[0]),
      n[2] + (a[0] - b[0]) * (a[1] + b[1]),
    ];
  }
  const u = norm(n);
  return { pts, n: u, c: dot(u, pts[0] as V) };
}

/** Тело по граням: рёбра — общие стороны двух граней. */
export function teloIzGraney(grani: Gran[], unit: number): Telo {
  const seen = new Map<string, { a: V; b: V; f: number[] }>();
  grani.forEach((g, fi) => {
    g.pts.forEach((a, i) => {
      const b = g.pts[(i + 1) % g.pts.length] as V;
      if (dist(a, b) < unit * 1e-9) {
        return;
      }
      const ka = key(a, unit);
      const kb = key(b, unit);
      const k = ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
      const e = seen.get(k) ?? { a, b, f: [] };
      e.f.push(fi);
      seen.set(k, e);
    });
  });
  const rebra: Rebro[] = [];
  for (const e of seen.values()) {
    rebra.push({ a: e.a, b: e.b, f: [e.f[0] as number, (e.f[1] ?? e.f[0]) as number] });
  }
  return { grani, rebra };
}

export function teloIzMnogogrannika(poly: Polyhedron): Telo {
  const pts = poly.vertices.map((v) => toArray(v.p) as V);
  const grani = poly.faces.map((f) => gran(f.idx.map((i) => pts[i] as V)));
  return teloIzGraney(grani, razmerTochek(pts));
}

export function razmerTochek(pts: readonly V[]): number {
  const c = centroid(pts);
  return Math.max(...pts.map((p) => dist(p, c)), 1e-9) * 2;
}

/** Сечение ядра → многоугольник для рисования (с именами вершин тела). */
export function sechenieIzYadra(poly: Polyhedron, s: Section, pl: Plane): Sechenie | null {
  if (s.kind !== 'polygon') {
    return null;
  }
  const pts = s.vertices.map((v) => toArray(v.p) as V);
  const n0 = toArray(pl.n) as V;
  const names = s.vertices.map((v) =>
    v.vertex === undefined ? null : (poly.vertices[v.vertex]?.name ?? null),
  );
  return { pts, n: norm(n0), names };
}

/** Сцена: тело, сечение плоскостью (если есть) и подписи вершин. */
export function scena(
  poly: Polyhedron,
  opts: { plane?: Plane; otrezki?: Otrezok[]; tochki?: Metka[] } = {},
): Scena {
  const telo = teloIzMnogogrannika(poly);
  const verts = poly.vertices.map((v) => toArray(v.p) as V);
  const s = opts.plane ? coreSection(poly, opts.plane) : null;
  const sechenie = s && opts.plane ? sechenieIzYadra(poly, s, opts.plane) : null;
  const metki: Metka[] = [
    ...poly.vertices.map((v): Metka => ({ p: toArray(v.p) as V, name: v.name, vid: 'vershina' })),
    ...(opts.tochki ?? []),
  ];
  return {
    tela: [telo],
    sechenie,
    otrezki: opts.otrezki ?? [],
    metki,
    razmer: razmerTochek(verts),
    centr: centroid(verts),
  };
}

/** Стороны сечения отрезками (рисуются цветом сечения). */
export function storonySecheniya(s: Sechenie): Otrezok[] {
  return s.pts.map((a, i) => ({ a, b: s.pts[(i + 1) % s.pts.length] as V, vid: 'sechenie' }));
}

/** Нормаль грани наружу относительно внутренней точки (для проверки). */
export function naruzhu(g: Gran, vnutri: V): boolean {
  return dot(g.n, sub(g.pts[0] as V, vnutri)) > 0;
}

/** Школьный ракурс по умолчанию: спереди, чуть справа и сверху. */
export const SHKOLNYY_RAKURS: V = norm([0.42, -1, 0.5]);

/**
 * Школьный ракурс для сцены: из ракурсов «спереди-справа-сверху»
 * (A — слева спереди, D — сзади и невидима) выбирается тот, где
 * сечение видно шире всего, — чтобы плоскость не смотрела ребром.
 * Небольшой штраф за отход от обычного ракурса.
 */
export function shkolnyyRakurs(sc: Scena): V {
  if (!sc.sechenie) {
    return SHKOLNYY_RAKURS;
  }
  const n = sc.sechenie.n;
  let best = SHKOLNYY_RAKURS;
  let bestScore = -Infinity;
  for (let a = 0.2; a <= 0.8001; a += 0.05) {
    for (let c = 0.3; c <= 1.0001; c += 0.05) {
      const k = norm([a, -1, c]);
      const shift = Math.hypot(...sub(k, SHKOLNYY_RAKURS));
      const score = Math.abs(dot(k, n)) - 0.35 * shift;
      if (score > bestScore) {
        bestScore = score;
        best = k;
      }
    }
  }
  return best;
}

/** Лежит ли точка в теле или на его границе. */
export function vTele(t: Telo, p: V, eps: number): boolean {
  return t.grani.every((g) => dot(g.n, p) <= g.c + eps);
}
