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
import { type V, centroid, dot, norm, sub } from './geom';
import { type Gran, type Telo, gran, razmerTochek, teloIzGraney } from '@/lib/stereo/telo';

/* Тело, грань и ребро — общее ядро чертежей №3 и №15 (lib/stereo). */
export {
  type Gran,
  type Rebro,
  type Telo,
  gran,
  teloIzGraney,
  razmerTochek,
  vTele,
} from '@/lib/stereo/telo';

/** Вид отрезка: от него зависит цвет и толщина. */
export type VidOtrezka = 'sechenie' | 'vspom' | 'ploskost';

export interface Otrezok {
  a: V;
  b: V;
  vid: VidOtrezka;
  /**
   * Грани первого тела, в которых лежит отрезок (сторона сечения).
   * Тогда видимость — по граням: на лицевой грани — сплошная, на
   * невидимой — штрихом, без расчёта по лучам.
   */
  grani?: number[];
}

export interface Metka {
  p: V;
  /** Имя в записи TeX: «A_1», «M», «K'». */
  name: string;
  /** Вершина тела или точка построения (точку рисуем кружком). */
  vid: 'vershina' | 'tochka';
  /** Точка выбрана инструментом (подсвечивается). */
  vybrana?: boolean;
}

export interface Sechenie {
  pts: V[];
  /** Единичная нормаль плоскости сечения. */
  n: V;
  /** Имена вершин сечения, если они есть (для натуральной величины). */
  names: (string | null)[];
  /** Для стороны i (от вершины i к i+1) — грани тела, в которых она лежит. */
  grani?: number[][];
}

export interface Scena {
  tela: Telo[];
  sechenie: Sechenie | null;
  otrezki: Otrezok[];
  metki: Metka[];
  /** Секущая плоскость — параллелограмм вокруг сечения (если показана). */
  ploskost?: V[] | null;
  /** Характерный размер — для допусков и масштаба. */
  razmer: number;
  centr: V;
}

export function teloIzMnogogrannika(poly: Polyhedron): Telo {
  const pts = poly.vertices.map((v) => toArray(v.p) as V);
  const grani = poly.faces.map((f) => gran(f.idx.map((i) => pts[i] as V)));
  return teloIzGraney(grani, razmerTochek(pts));
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
  // Сторона лежит в гранях, общих для её концов.
  const grani = s.vertices.map((v, i) => {
    const w = s.vertices[(i + 1) % s.vertices.length];
    return v.faces.filter((f) => w?.faces.includes(f));
  });
  return { pts, n: norm(n0), names, grani };
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
  return s.pts.map((a, i) => {
    const grani = s.grani?.[i];
    return {
      a,
      b: s.pts[(i + 1) % s.pts.length] as V,
      vid: 'sechenie',
      ...(grani && grani.length > 0 ? { grani } : {}),
    };
  });
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
