/**
 * Гладкая кривая по узлам: кубический эрмитов сплайн класса C¹.
 *
 * Узлы стоят на целой сетке, наклоны в них берутся монотонной
 * интерполяцией (Фритш — Карлсон, как PCHIP): между соседними узлами
 * кривая не выходит за их значения, поэтому экстремумы, нули и
 * промежутки монотонности получаются ровно в узлах и нигде больше.
 * В узле, где соседние перепады меняют знак, наклон равен нулю — это
 * и есть экстремум. Наклон можно задать явно (поле m): так строится
 * касательная с нужным угловым коэффициентом.
 */

import type { Uzel } from './types';

export interface Splayn {
  uzly: Uzel[];
  /** Наклоны в узлах: заданные или вычисленные. */
  m: number[];
  y(x: number): number;
  /** Производная кривой. */
  dy(x: number): number;
  xmin: number;
  xmax: number;
}

/** Наклоны монотонной интерполяции в узлах (шаг неравномерный). */
export function naklony(uzly: readonly Uzel[]): number[] {
  const n = uzly.length;
  const m = new Array<number>(n).fill(0);
  if (n < 2) {
    return m;
  }
  const h: number[] = [];
  const d: number[] = [];
  for (let i = 0; i < n - 1; i += 1) {
    const a = uzly[i] as Uzel;
    const b = uzly[i + 1] as Uzel;
    h.push(b.x - a.x);
    d.push((b.y - a.y) / (b.x - a.x));
  }
  if (n === 2) {
    m[0] = d[0] as number;
    m[1] = d[0] as number;
  } else {
    for (let i = 1; i < n - 1; i += 1) {
      const d0 = d[i - 1] as number;
      const d1 = d[i] as number;
      if (d0 * d1 <= 0) {
        m[i] = 0;
      } else {
        const w1 = 2 * (h[i] as number) + (h[i - 1] as number);
        const w2 = (h[i] as number) + 2 * (h[i - 1] as number);
        m[i] = (w1 + w2) / (w1 / d0 + w2 / d1);
      }
    }
    m[0] = konec(h[0] as number, h[1] as number, d[0] as number, d[1] as number);
    m[n - 1] = konec(
      h[n - 2] as number,
      h[n - 3] as number,
      d[n - 2] as number,
      d[n - 3] as number,
    );
  }
  for (let i = 0; i < n; i += 1) {
    const given = (uzly[i] as Uzel).m;
    if (given !== undefined) {
      m[i] = given;
    }
  }
  return m;
}

/** Наклон на конце: трёхточечная формула с поправкой на форму. */
function konec(h0: number, h1: number, d0: number, d1: number): number {
  let s = ((2 * h0 + h1) * d0 - h0 * d1) / (h0 + h1);
  if (Math.sign(s) !== Math.sign(d0)) {
    s = 0;
  } else if (Math.sign(d0) !== Math.sign(d1) && Math.abs(s) > 3 * Math.abs(d0)) {
    s = 3 * d0;
  }
  /* Горизонтальный конец читался бы как экстремум на краю: смягчаем. */
  return s === 0 ? d0 / 2 : s;
}

export function postroit(uzly: readonly Uzel[]): Splayn {
  const list = uzly.map((u) => ({ ...u }));
  const m = naklony(list);
  const segment = (x: number): number => {
    if (x <= (list[0] as Uzel).x) {
      return 0;
    }
    for (let i = 0; i < list.length - 1; i += 1) {
      if (x <= (list[i + 1] as Uzel).x) {
        return i;
      }
    }
    return list.length - 2;
  };
  return {
    uzly: list,
    m,
    xmin: (list[0] as Uzel).x,
    xmax: (list[list.length - 1] as Uzel).x,
    y(x) {
      const i = segment(x);
      const a = list[i] as Uzel;
      const b = list[i + 1] as Uzel;
      const h = b.x - a.x;
      const t = (x - a.x) / h;
      const t2 = t * t;
      const t3 = t2 * t;
      return (
        (2 * t3 - 3 * t2 + 1) * a.y +
        (t3 - 2 * t2 + t) * h * (m[i] as number) +
        (-2 * t3 + 3 * t2) * b.y +
        (t3 - t2) * h * (m[i + 1] as number)
      );
    },
    dy(x) {
      const i = segment(x);
      const a = list[i] as Uzel;
      const b = list[i + 1] as Uzel;
      const h = b.x - a.x;
      const t = (x - a.x) / h;
      const t2 = t * t;
      return (
        ((6 * t2 - 6 * t) * a.y) / h +
        (3 * t2 - 4 * t + 1) * (m[i] as number) +
        ((-6 * t2 + 6 * t) * b.y) / h +
        (3 * t2 - 2 * t) * (m[i + 1] as number)
      );
    },
  };
}

/** Ломаная по вершинам: значение в точке x. */
export function lomanayaY(uzly: readonly Uzel[], x: number): number {
  for (let i = 0; i < uzly.length - 1; i += 1) {
    const a = uzly[i] as Uzel;
    const b = uzly[i + 1] as Uzel;
    if (x >= a.x && x <= b.x) {
      return a.y + ((b.y - a.y) * (x - a.x)) / (b.x - a.x);
    }
  }
  return Number.NaN;
}

/** Шаг сетки выборки: 1/50 клетки, чтобы целые абсциссы попадали точно. */
export const SHAG = 50;

/** Точки кривой с шагом 1/SHAG от a до b. */
export function vyborka(s: Splayn, a = s.xmin, b = s.xmax): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  const total = Math.round((b - a) * SHAG);
  for (let i = 0; i <= total; i += 1) {
    const x = a + i / SHAG;
    out.push({ x, y: s.y(x) });
  }
  return out;
}
