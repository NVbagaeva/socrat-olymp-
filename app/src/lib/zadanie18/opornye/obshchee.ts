/**
 * Общее для чертежей опорных задач №18: сцена движка lib/skhemy из
 * короткого описания и построения, которых нет в геометрии движка.
 *
 * Чертёж опорной задачи — та же живая схема (ZhivayaSkhema): исходное
 * положение — числа пункта б), «Случайное положение» — любая
 * конфигурация условия, на которой верно утверждение пункта а).
 * Параметры, у которых нет своей точки на чертеже (радиусы, длины
 * оснований), лежат в тех же Tochki под ключом «p» — ручки у них нет,
 * а плавный переход к новому положению пересчитывает и их.
 */

import { add, intersect, polar } from '@/lib/skhemy/geometriya';
import type { Kadr, Ramka, T2, Tochki, ZhivayaSkhema } from '@/lib/skhemy/tipy';

export interface OpisanieSceny {
  id: string;
  nachalo: Tochki;
  /** Вершины, которые можно тянуть. Нет — чертёж поворачивается и меняет положение кнопкой. */
  podvizhnye?: readonly string[];
  pole?: Ramka;
  /** Положение невырождено и подходит под условие. */
  goditsya: (t: Tochki) => boolean;
  /** Кандидат в случайное положение; неподходящие отбрасываются. */
  sluchaynaya: (rnd: () => number) => Tochki;
  /** Куда встаёт тянутая точка (например, на окружность); по умолчанию — куда тянут. */
  privyazat?: (imya: string, p: T2, t: Tochki) => T2;
  postroit: (t: Tochki) => Kadr;
  shagi: readonly string[];
}

const POLE_PO_UMOLCHANIYU: Ramka = [-60, -60, 60, 60];

export function scena(o: OpisanieSceny): ZhivayaSkhema {
  const pole = o.pole ?? POLE_PO_UMOLCHANIYU;
  return {
    id: o.id,
    nachalo: o.nachalo,
    podvizhnye: o.podvizhnye ?? [],
    pole,
    postroit: o.postroit,
    ogranichit(imya, p, t) {
      const v = o.privyazat === undefined ? p : o.privyazat(imya, p, t);
      const q: T2 = [
        Math.max(pole[0], Math.min(pole[2], v[0])),
        Math.max(pole[1], Math.min(pole[3], v[1])),
      ];
      return o.goditsya({ ...t, [imya]: q }) ? q : null;
    },
    sluchaynaya(rnd) {
      for (let i = 0; i < 400; i += 1) {
        const t = o.sluchaynaya(rnd);
        if (o.goditsya(t)) return t;
      }
      return o.nachalo;
    },
    shagi: o.shagi,
  };
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

/** Случайное число в промежутке [ot, doX). */
export const vPromezhutke = (rnd: () => number, ot: number, doX: number) => ot + rnd() * (doX - ot);

/** Повернуть точки вокруг начала координат (градусы): исходное положение — в удобном виде. */
export function povernut<K extends string>(t: Record<K, T2>, gradusy: number): Record<K, T2> {
  const c = Math.cos((gradusy * Math.PI) / 180);
  const s = Math.sin((gradusy * Math.PI) / 180);
  const out = {} as Record<K, T2>;
  for (const k of Object.keys(t) as K[]) {
    const [x, y] = t[k];
    out[k] = [x * c - y * s, x * s + y * c];
  }
  return out;
}

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

/** Невырожденный треугольник: углы не меньше minUgol градусов, стороны не короче minStorona. */
export function goditsyaTreugolnik(
  A: T2,
  B: T2,
  C: T2,
  minUgol: number,
  minStorona: number,
): boolean {
  const a = Math.hypot(B[0] - C[0], B[1] - C[1]);
  const b = Math.hypot(A[0] - C[0], A[1] - C[1]);
  const c = Math.hypot(A[0] - B[0], A[1] - B[1]);
  if (Math.min(a, b, c) < minStorona) return false;
  const ug = (x: number, y: number, z: number) =>
    (Math.acos(Math.max(-1, Math.min(1, (y * y + z * z - x * x) / (2 * y * z)))) * 180) / Math.PI;
  return Math.min(ug(a, b, c), ug(b, a, c), ug(c, a, b)) >= minUgol;
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
