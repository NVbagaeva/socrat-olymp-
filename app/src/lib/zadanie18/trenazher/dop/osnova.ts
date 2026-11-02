/**
 * Основа чертежей перенесённых задач тренажёра №18: неподвижная сцена
 * движка lib/skhemy и построения, которых нет в геометрии движка.
 *
 * Сцена строится по числам пункта б): nachalo — опорные точки фигуры,
 * postroit(t) достраивает по ним остальное. Параметры, у которых нет
 * своей точки на чертеже (радиусы, длины оснований), лежат в тех же
 * Tochki под ключом «p». Функции точек tochki*(t) берёт и проверка
 * scripts/verify_schemes/trenazherDop.
 */

import { nepodvizhnaya } from '@/lib/skhemy/dsl';
import { add, intersect, polar } from '@/lib/skhemy/geometriya';
import type { Element, T2, Tochki, ZhivayaSkhema } from '@/lib/skhemy/tipy';

export interface OpisanieSceny {
  id: string;
  /** Опорные точки фигуры по данным пункта б). */
  nachalo: Tochki;
  postroit: (t: Tochki) => Element[];
}

export function scena(o: OpisanieSceny): ZhivayaSkhema {
  return nepodvizhnaya(o.id, o.nachalo, o.postroit);
}

/** Треугольник по стороне BC и углам при ней (градусы): B в начале координат, C на оси x, A сверху. */
export function treugolnikNaBC(
  ugolB: number,
  ugolC: number,
  a: number,
): Record<'A' | 'B' | 'C', T2> {
  const B: T2 = [0, 0];
  const C: T2 = [a, 0];
  const A = intersect(B, polar(ugolB), C, add(C, polar(180 - ugolC))) ?? [a / 2, 1];
  return { A, B, C };
}

/** Параметры сцены: пара чисел под ключом «p». */
export const parametry = (t: Tochki): T2 => t.p ?? [1, 1];

/**
 * Положить фигуру «на основание»: P — в начало координат, Q — на
 * положительную полуось x; если фигура оказалась ниже оси, отразить.
 * Исходное положение задачи считается в удобных координатах, а
 * рисуется так, как его рисуют на доске.
 */
export function naOsnovanie<K extends string>(t: Record<K, T2>, p: K, q: K): Record<K, T2> {
  const o = t[p];
  const u = Math.atan2(t[q][1] - o[1], t[q][0] - o[0]);
  const c = Math.cos(-u);
  const s = Math.sin(-u);
  const out = {} as Record<K, T2>;
  let sumY = 0;
  for (const k of Object.keys(t) as K[]) {
    const x = t[k][0] - o[0];
    const y = t[k][1] - o[1];
    out[k] = [x * c - y * s, x * s + y * c];
    sumY += out[k][1];
  }
  if (sumY < 0) for (const k of Object.keys(out) as K[]) out[k] = [out[k][0], -out[k][1]];
  return out;
}

/** Площадь многоугольника со знаком: против часовой — положительная. */
export function signedS(pts: readonly T2[]): number {
  let s = 0;
  for (let i = 0; i < pts.length; i += 1) {
    const p = pts[i]!;
    const q = pts[(i + 1) % pts.length]!;
    s += p[0] * q[1] - p[1] * q[0];
  }
  return s / 2;
}

/** Точка, делящая отрезок PQ в отношении m : n, считая от P. */
export function delit(p: T2, q: T2, m: number, n: number): T2 {
  const k = m / (m + n);
  return [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k];
}
