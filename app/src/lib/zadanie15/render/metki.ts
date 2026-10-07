/**
 * Раскладка подписей точек на экране.
 *
 * Подпись ставится в одном из 16 направлений вокруг точки. Штраф:
 * подпись налезает на другую подпись (сильно), на линию чертежа,
 * на чужую точку; лучше — направление «наружу» от центра фигуры.
 * Чтобы подписи не прыгали при вращении, прежнее направление
 * получает скидку: его меняют, только если новое заметно лучше.
 */

import type { P2 } from './geom';

export interface ZadachaMetki {
  /** Точка на экране, px. */
  p: P2;
  /** Размер подписи, px. */
  w: number;
  h: number;
}

export interface Polozhenie {
  /** Левый верхний угол подписи, px. */
  x: number;
  y: number;
  /** Номер направления (0…15) — для устойчивости между кадрами. */
  dir: number;
}

const DIRS: P2[] = Array.from({ length: 16 }, (_, i) => {
  const a = (i / 16) * Math.PI * 2;
  return [Math.cos(a), Math.sin(a)];
});

interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

function overlap(a: Box, b: Box): number {
  const w = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
  const h = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
  return w > 0 && h > 0 ? w * h : 0;
}

/** Длина куска отрезка внутри прямоугольника (отсечение Лианга — Барски). */
function segInBox(a: P2, b: P2, r: Box): number {
  let t0 = 0;
  let t1 = 1;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const clip = (p: number, q: number): boolean => {
    if (p === 0) {
      return q >= 0;
    }
    const t = q / p;
    if (p < 0) {
      if (t > t1) return false;
      if (t > t0) t0 = t;
    } else {
      if (t < t0) return false;
      if (t < t1) t1 = t;
    }
    return true;
  };
  if (
    clip(-dx, a[0] - r.x0) &&
    clip(dx, r.x1 - a[0]) &&
    clip(-dy, a[1] - r.y0) &&
    clip(dy, r.y1 - a[1])
  ) {
    return Math.max(0, t1 - t0) * Math.hypot(dx, dy);
  }
  return 0;
}

export function razlozhit(
  zadachi: readonly ZadachaMetki[],
  linii: readonly (readonly [P2, P2])[],
  centr: P2,
  prezhnie: readonly (number | undefined)[] = [],
  zazor = 6,
): Polozhenie[] {
  const placed: Box[] = [];
  const res: Polozhenie[] = [];
  zadachi.forEach((z, i) => {
    const out: P2 = [z.p[0] - centr[0], z.p[1] - centr[1]];
    const ol = Math.hypot(out[0], out[1]) || 1;
    let best: { cost: number; box: Box; dir: number } | null = null;
    DIRS.forEach((d, di) => {
      // Центр подписи — на расстоянии, чтобы угол рамки не касался точки.
      const reach = zazor + Math.abs(d[0]) * (z.w / 2) + Math.abs(d[1]) * (z.h / 2);
      const cx = z.p[0] + d[0] * reach;
      const cy = z.p[1] + d[1] * reach;
      const box: Box = { x0: cx - z.w / 2, y0: cy - z.h / 2, x1: cx + z.w / 2, y1: cy + z.h / 2 };
      let cost = 0;
      for (const b of placed) {
        cost += overlap(box, b) * 40;
      }
      for (const [a, b] of linii) {
        cost += segInBox(a, b, box) * 6;
      }
      zadachi.forEach((o, j) => {
        if (
          j !== i &&
          o.p[0] > box.x0 - 3 &&
          o.p[0] < box.x1 + 3 &&
          o.p[1] > box.y0 - 3 &&
          o.p[1] < box.y1 + 3
        ) {
          cost += 300;
        }
      });
      // Наружу от центра — лучше.
      cost += (1 - (d[0] * out[0] + d[1] * out[1]) / ol) * 12;
      if (prezhnie[i] === di) {
        cost -= 25;
      }
      if (best === null || cost < best.cost) {
        best = { cost, box, dir: di };
      }
    });
    const b = best as unknown as { box: Box; dir: number };
    placed.push(b.box);
    res.push({ x: b.box.x0, y: b.box.y0, dir: b.dir });
  });
  return res;
}
