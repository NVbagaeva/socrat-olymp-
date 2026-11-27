/**
 * Живая сцена справочника №2 (векторы): components/zhivye/vektory2.
 * Координаты математические (ось y вверх). Проверка —
 * scripts/check-zhivye.mjs.
 *
 * Три действия подряд, t ∈ [0; 3]:
 *   этап 0 (t ∈ [0; 1]) — сумма: копия b переезжает к концу a, из начала
 *     в её конец идёт вектор a + b;
 *   этап 1 (t ∈ [1; 2]) — разность: из конца b в конец a вырастает a − b;
 *   этап 2 (t ∈ [2; 3]) — умножение на число: a растягивается в K раз.
 */

import type { HodOpcii } from './hod';

export type T2 = readonly [number, number];

export interface Nabor {
  id: string;
  a: T2;
  b: T2;
}

export const NABORY: readonly Nabor[] = [
  { id: 'pervyy', a: [3, 1], b: [1, 2] },
  { id: 'vtoroy', a: [2, 3], b: [3, -1] },
  { id: 'tretiy', a: [4, 1], b: [-1, 2] },
];

/** Во сколько раз растягивается a на третьем этапе. */
export const K2 = 2;

export function hodVektory(): HodOpcii {
  return { tMax: 3, ostanovki: [1, 2], sekNaEd: 2.1, sekSnimok: 1.8, razgon: 0.15 };
}

export function plavno(u: number): number {
  const v = Math.min(1, Math.max(0, u));
  return v < 0.5 ? 2 * v * v : 1 - (-2 * v + 2) ** 2 / 2;
}

export const summa = (n: Nabor): T2 => [n.a[0] + n.b[0], n.a[1] + n.b[1]];
export const raznost = (n: Nabor): T2 => [n.a[0] - n.b[0], n.a[1] - n.b[1]];
export const kratnoe = (n: Nabor): T2 => [K2 * n.a[0], K2 * n.a[1]];

/** Результат действия на этапе `etap`: вектор из `ot` в `do`. */
export function rezultat(n: Nabor, etap: 0 | 1 | 2): { ot: T2; do: T2 } {
  if (etap === 0) return { ot: [0, 0], do: summa(n) };
  if (etap === 1) return { ot: n.b, do: n.a };
  return { ot: [0, 0], do: kratnoe(n) };
}

export interface Kadr2 {
  etap: 0 | 1 | 2;
  /** Доля этапа, 0…1 (на целых t — конец завершённого этапа). */
  u: number;
  /** Копия b (этап 0): начало и конец, null — её нет. */
  kopiyaB: { ot: T2; do: T2 } | null;
  /** Вектор-результат: начало, текущий конец, прозрачность 0…1. */
  rez: { ot: T2; do: T2; vid: number };
  /** На этапе 2 вектор a заменён растягивающимся. */
  bezA: boolean;
  /** На этапе 2 вектор b уже не нужен. */
  bezB: boolean;
}

export function kadr(n: Nabor, t: number): Kadr2 {
  const etap = Math.min(2, Math.max(0, Math.ceil(t - 1e-9) - 1)) as 0 | 1 | 2;
  const u = plavno(t - etap);
  const r = rezultat(n, etap);
  if (etap === 0) {
    return {
      etap,
      u,
      kopiyaB: { ot: [n.a[0] * u, n.a[1] * u], do: [n.a[0] * u + n.b[0], n.a[1] * u + n.b[1]] },
      rez: { ot: r.ot, do: r.do, vid: Math.min(1, Math.max(0, (u - 0.6) / 0.4)) },
      bezA: false,
      bezB: false,
    };
  }
  if (etap === 1) {
    return {
      etap,
      u,
      kopiyaB: null,
      rez: {
        ot: r.ot,
        do: [r.ot[0] + (r.do[0] - r.ot[0]) * u, r.ot[1] + (r.do[1] - r.ot[1]) * u],
        vid: u > 0 ? 1 : 0,
      },
      bezA: false,
      bezB: false,
    };
  }
  const k = 1 + (K2 - 1) * u;
  return {
    etap,
    u,
    kopiyaB: null,
    rez: { ot: r.ot, do: [n.a[0] * k, n.a[1] * k], vid: 1 },
    bezA: true,
    bezB: true,
  };
}

/** Рамка рисунка: все концы векторов набора, с полем в одну клетку. */
export function ramka(n: Nabor): { x0: number; x1: number; y0: number; y1: number } {
  const pts: T2[] = [[0, 0], n.a, n.b, summa(n), raznost(n), kratnoe(n)];
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  return {
    x0: Math.floor(Math.min(...xs)) - 1,
    x1: Math.ceil(Math.max(...xs)) + 1,
    y0: Math.floor(Math.min(...ys)) - 1,
    y1: Math.ceil(Math.max(...ys)) + 1,
  };
}
