/**
 * Живые сцены справочника №1 (планиметрия), components/zhivye/
 * planimetriya1. Координаты математические (ось y вверх), углы —
 * в градусах. Проверка — scripts/check-zhivye.mjs.
 *
 * «Вписанный угол»: окружность радиуса 1 с центром O, точки A и B
 * неподвижны, центральный угол AOB = 80°. Часть 1 (t ∈ [0; 2]): точка
 * C идёт по большой дуге, угол ACB всё время 40°. Часть 2 (t ∈ [2; 3]):
 * B уезжает до диаметрально противоположной A точки, угол AOB
 * растёт до 180°, вписанный — до 90°.
 *
 * «Сумма углов»: треугольник ABC со стороной AC на оси x. Через B
 * проводится прямая, параллельная AC (t ∈ [0; 1]), угол A переезжает
 * к B накрест лежащим (t ∈ [1; 2]), затем угол C (t ∈ [2; 3]).
 */

import type { HodOpcii } from './hod';

export type T2 = readonly [number, number];
const RAD = Math.PI / 180;

export function naKruge(gr: number): T2 {
  return [Math.cos(gr * RAD), Math.sin(gr * RAD)];
}

/** Направление луча из v в p, градусы 0–360. */
export function napravlenie(v: T2, p: T2): number {
  const a = Math.atan2(p[1] - v[1], p[0] - v[0]) / RAD;
  return a < 0 ? a + 360 : a;
}

/** Угол AVB, градусы 0–180. */
export function ugol(a: T2, v: T2, b: T2): number {
  const d = Math.abs(napravlenie(v, a) - napravlenie(v, b));
  return d > 180 ? 360 - d : d;
}

/* ── Вписанный угол ── */

export const VP = {
  A: 230,
  B0: 310,
  B1: 410,
  /** Часть 1: C от C0 до C1; часть 2: C от C1 до C2. */
  C0: 345,
  C1: 555,
  C2: 470,
} as const;

/** Положение C на части 1 по углу θ. */
function tDlyaC(th: number): number {
  return ((th - VP.C0) / (VP.C1 - VP.C0)) * 2;
}

export const OSTANOVKI_VP = [tDlyaC(VP.A + 180), tDlyaC(450), tDlyaC(VP.B0 + 180), 2] as const;

export function hodVp(): HodOpcii {
  return { tMax: 3, ostanovki: [...OSTANOVKI_VP], sekNaEd: 2.6, sekSnimok: 1.9, razgon: 0.15 };
}

function plavno(u: number): number {
  const v = Math.min(1, Math.max(0, u));
  return v < 0.5 ? 2 * v * v : 1 - (-2 * v + 2) ** 2 / 2;
}

export interface Vp {
  /** Углы точек на окружности. */
  a: number;
  b: number;
  c: number;
  centralnyy: number;
  vpisannyy: number;
  /** Где центр относительно угла ACB. */
  centr: 'vne' | 'na-storone' | 'vnutri';
}

export function vp(t: number): Vp {
  const a = VP.A;
  let b: number;
  let c: number;
  if (t <= 2) {
    b = VP.B0;
    c = VP.C0 + ((VP.C1 - VP.C0) * t) / 2;
  } else {
    const u = plavno(t - 2);
    b = VP.B0 + (VP.B1 - VP.B0) * u;
    c = VP.C1 + (VP.C2 - VP.C1) * u;
  }
  const A = naKruge(a);
  const B = naKruge(b);
  const C = naKruge(c);
  const centralnyy = b - a;
  const vpisannyy = ugol(A, C, B);
  /* Центр внутри угла, когда C между точками, противоположными A и B. */
  const pa = a + 180;
  const pb = b + 180;
  const lo = Math.min(pa, pb);
  const hi = Math.max(pa, pb);
  let centr: Vp['centr'] = 'vne';
  if (Math.abs(c - pa) < 0.5 || Math.abs(c - pb) < 0.5) centr = 'na-storone';
  else if (c > lo && c < hi) centr = 'vnutri';
  return { a, b, c, centralnyy, vpisannyy, centr };
}

/* ── Сумма углов треугольника ── */

export interface Treugolnik {
  id: string;
  alfa: number;
  gamma: number;
}

export const TREUGOLNIKI: readonly Treugolnik[] = [
  { id: 'ostryy', alfa: 50, gamma: 60 },
  { id: 'tupoy', alfa: 30, gamma: 40 },
  { id: 'pryamoy', alfa: 35, gamma: 55 },
];

export function vershiny(tr: Treugolnik): { A: T2; B: T2; C: T2; beta: number } {
  const L = 10;
  const beta = 180 - tr.alfa - tr.gamma;
  const ab = (L * Math.sin(tr.gamma * RAD)) / Math.sin(beta * RAD);
  return {
    A: [0, 0],
    C: [L, 0],
    B: [ab * Math.cos(tr.alfa * RAD), ab * Math.sin(tr.alfa * RAD)],
    beta,
  };
}

export function hodSumma(): HodOpcii {
  return { tMax: 3, ostanovki: [1, 2], sekNaEd: 1.9, sekSnimok: 1.8, razgon: 0.15 };
}

/** Клин угла: вершина, начало и конец дуги (против часовой), градусы. */
export interface Klin {
  v: T2;
  ot: number;
  do: number;
}

export interface Summa {
  /** Доля проведённой параллельной прямой. */
  pryamaya: number;
  klinA: Klin;
  klinC: Klin;
  klinB: Klin;
}

export function summa(tr: Treugolnik, t: number): Summa {
  const { A, B, C, beta } = vershiny(tr);
  const lerp = (p: T2, q: T2, u: number): T2 => [
    p[0] + (q[0] - p[0]) * u,
    p[1] + (q[1] - p[1]) * u,
  ];
  const uA = plavno(t - 1);
  const uC = plavno(t - 2);
  const rotA = 180 * uA;
  const rotC = 180 * uC;
  return {
    pryamaya: plavno(t),
    klinA: { v: lerp(A, B, uA), ot: rotA, do: rotA + tr.alfa },
    klinC: { v: lerp(C, B, uC), ot: 180 - tr.gamma + rotC, do: 180 + rotC },
    klinB: { v: B, ot: 180 + tr.alfa, do: 180 + tr.alfa + beta },
  };
}
