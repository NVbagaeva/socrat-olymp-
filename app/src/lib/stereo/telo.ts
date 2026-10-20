/**
 * Тело для рисования: выпуклый многогранник гранями.
 *
 * Общее ядро чертежей №3 и №15. Грань — обход против часовой стрелки
 * снаружи, внешняя единичная нормаль и плоскость n·X = c. Рёбра
 * выводятся из граней: у каждого две соседние грани.
 *
 * Невыпуклое тело (фигура из кубиков, многогранник с вырезом) ядро
 * держит набором выпуклых частей — так видимость остаётся точной:
 * луч к зрителю проверяется против каждой части (см. vidimost.ts).
 */

import { type V, add, centroid, dist, dot, key, norm, sub } from './vec';

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

/**
 * Выпуклое тело по вершинам и граням-индексам. Обход граней
 * разворачивается наружу по центру масс, если задан наоборот.
 */
export function teloIzIndeksov(pts: readonly V[], faces: readonly (readonly number[])[]): Telo {
  const c = centroid(pts);
  const grani = faces.map((f) => {
    const g = gran(f.map((i) => pts[i] as V));
    return dot(g.n, sub(g.pts[0] as V, c)) < 0 ? gran([...g.pts].reverse()) : g;
  });
  return teloIzGraney(grani, razmerTochek(pts));
}

/** Прямоугольный блок [p, p + d] — выпуклая часть составного тела. */
export function blok(p: V, d: V): Telo {
  const [x0, y0, z0] = p;
  const [x1, y1, z1] = add(p, d);
  const v: V[] = [
    [x0, y0, z0],
    [x1, y0, z0],
    [x1, y1, z0],
    [x0, y1, z0],
    [x0, y0, z1],
    [x1, y0, z1],
    [x1, y1, z1],
    [x0, y1, z1],
  ];
  return teloIzIndeksov(v, [
    [0, 3, 2, 1],
    [4, 5, 6, 7],
    [0, 1, 5, 4],
    [1, 2, 6, 5],
    [2, 3, 7, 6],
    [3, 0, 4, 7],
  ]);
}

export function razmerTochek(pts: readonly V[]): number {
  const c = centroid(pts);
  return Math.max(...pts.map((p) => dist(p, c)), 1e-9) * 2;
}

/** Лежит ли точка в теле или на его границе. */
export function vTele(t: Telo, p: V, eps: number): boolean {
  return t.grani.every((g) => dot(g.n, p) <= g.c + eps);
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
