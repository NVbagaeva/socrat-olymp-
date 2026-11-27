/**
 * Живая сцена главы «Изменение размеров и подобие» №3 (стереометрия):
 * components/zhivye/podobie3. Проверка — scripts/check-zhivye.mjs.
 *
 * Тело с ребром 1 увеличивают в k раз; три этапа, t ∈ [0; 3]:
 *   этап 0 — длина (отрезок растёт от 1 до k);
 *   этап 1 — площадь грани (квадрат растёт от 1×1 до k×k);
 *   этап 2 — объём (куб растёт от 1 до k, внутри k³ единичных кубиков).
 */

import type { HodOpcii } from './hod';

/** Коэффициенты подобия, которые можно выбрать. */
export const KOEFFICIENTY = [2, 3] as const;

export function hodPodobie(): HodOpcii {
  return { tMax: 3, ostanovki: [1, 2], sekNaEd: 2.2, sekSnimok: 1.8, razgon: 0.15 };
}

export function plavno(u: number): number {
  const v = Math.min(1, Math.max(0, u));
  return v < 0.5 ? 2 * v * v : 1 - (-2 * v + 2) ** 2 / 2;
}

export interface Kadr3 {
  /** 0 — длина, 1 — площадь, 2 — объём. */
  etap: 0 | 1 | 2;
  /** Ребро сейчас, от 1 до k. */
  s: number;
  /** Что измеряется на этапе: s, s², s³. */
  velichina: number;
}

/** Целые t принадлежат завершённому этапу (t = 1 — конец длины). */
export function kadr(k: number, t: number): Kadr3 {
  const etap = Math.min(2, Math.max(0, Math.ceil(t - 1e-9) - 1)) as 0 | 1 | 2;
  const s = 1 + (k - 1) * plavno(t - etap);
  return { etap, s, velichina: s ** (etap + 1) };
}

/** Во сколько раз выросли длина, площадь и объём при коэффициенте k. */
export function voSkolko(k: number): readonly [number, number, number] {
  return [k, k * k, k * k * k];
}

/** Целые линии сетки внутри ребра s: 1, 2, … строго меньше s. */
export function linitsy(s: number): number[] {
  const out: number[] = [];
  for (let i = 1; i < s - 1e-9; i += 1) out.push(i);
  return out;
}

export interface Proekciya {
  /** Сдвиг по экрану на единицу глубины y: вправо и вверх. */
  dx: number;
  dy: number;
}

/** Косая проекция («кабинетная»): y уходит вправо и вверх. */
export const PROEKCIYA: Proekciya = { dx: 0.5, dy: 0.35 };

export function tochka(
  x: number,
  y: number,
  z: number,
  u: number,
  ox: number,
  oy: number,
): [number, number] {
  return [ox + (x + PROEKCIYA.dx * y) * u, oy - (z + PROEKCIYA.dy * y) * u];
}
