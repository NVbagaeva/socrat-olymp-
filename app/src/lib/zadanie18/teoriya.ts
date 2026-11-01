/**
 * Чертежи теории №18 — неподвижные сцены движка lib/skhemy. На странице
 * они рисуются строкой SVG на сборке (lib/skhemy/svg.ts): теория —
 * серверная страница, JS чертежам не нужен.
 *
 * Группа «g» — главное на чертеже: на странице она всегда подсвечена.
 *
 * Тексты фактов — content/zadanie18/teoriya.ts; каждая формула
 * проверена на случайных фигурах (scripts/verify_schemes/teoriya.mjs).
 */

import { duga, mnog, nepodvizhnaya, okr, otr, tch, ug } from '@/lib/skhemy/dsl';
import { foot, intersect, lerp, mid, polar, sub, unit } from '@/lib/skhemy/geometriya';
import type { T2, ZhivayaSkhema } from '@/lib/skhemy/tipy';

const naOkr = (c: T2, r: number, u: number): T2 => {
  const q = polar(u, r);
  return [c[0] + q[0], c[1] + q[1]];
};
/** Отрезок касательной к окружности в точке p: по d в обе стороны. */
const kasatelnaya = (c: T2, p: T2, d: number): [T2, T2] => {
  const n = unit(sub(p, c));
  const t: T2 = [-n[1], n[0]];
  return [
    [p[0] - t[0] * d, p[1] - t[1] * d],
    [p[0] + t[0] * d, p[1] + t[1] * d],
  ];
};

const O: T2 = [0, 0];
/** Угол точки относительно начала координат, градусы. */
const ugolTochki = (p: T2): number => (Math.atan2(p[1], p[0]) * 180) / Math.PI;

const RISUNKI: Readonly<Record<string, ZhivayaSkhema>> = {
  'vysota-gipotenuza': (() => {
    const A: T2 = [0, 0];
    const B: T2 = [10, 0];
    const C: T2 = [3.6, 4.8];
    const H = foot(C, A, B);
    return nepodvizhnaya('t-vysota-gipotenuza', { A, B, C, H }, (t) => [
      otr('AB', t.A!, t.B!),
      otr('BC', t.B!, t.C!),
      otr('CA', t.C!, t.A!),
      otr('CH', t.C!, t.H!, { cvet: 'a', gruppy: ['g'] }),
      ug('uC', t.A!, t.C!, t.B!, { pryamoy: true }),
      ug('uH', t.B!, t.H!, t.C!, { pryamoy: true }),
      tch('A', t.A!),
      tch('B', t.B!),
      tch('C', t.C!),
      tch('H', t.H!),
    ]);
  })(),

  vpisannyy: (() => {
    const r = 5;
    const A = naOkr(O, r, 200);
    const B = naOkr(O, r, 330);
    const C = naOkr(O, r, 100);
    return nepodvizhnaya('t-vpisannyy', { O, A, B, C }, (t) => [
      okr('k', t.O!, r),
      duga('dAB', t.O!, r, 200, 330, { cvet: 'b', gruppy: ['g'] }),
      otr('CA', t.C!, t.A!),
      otr('CB', t.C!, t.B!),
      otr('OA', t.O!, t.A!, { stil: 'punktir' }),
      otr('OB', t.O!, t.B!, { stil: 'punktir' }),
      ug('uC', t.A!, t.C!, t.B!),
      ug('uO', t.A!, t.O!, t.B!, { dugi: 2 }),
      tch('O', t.O!),
      tch('A', t.A!),
      tch('B', t.B!),
      tch('C', t.C!),
    ]);
  })(),

  'ugol-hordy': (() => {
    const r = 5;
    const A = naOkr(O, r, 160);
    const B = naOkr(O, r, 340 - 15);
    const C = naOkr(O, r, 70);
    const D = naOkr(O, r, 245);
    const P = intersect(A, B, C, D) ?? O;
    return nepodvizhnaya('t-ugol-hordy', { O, A, B, C, D, P }, (t) => [
      okr('k', t.O!, r),
      duga('dAC', t.O!, r, 70, 160, { cvet: 'b', gruppy: ['g'] }),
      duga('dBD', t.O!, r, 245, 325, { cvet: 'b', gruppy: ['g'] }),
      otr('AB', t.A!, t.B!),
      otr('CD', t.C!, t.D!),
      ug('uP', t.A!, t.P!, t.C!),
      tch('A', t.A!),
      tch('B', t.B!),
      tch('C', t.C!),
      tch('D', t.D!),
      tch('P', t.P!),
    ]);
  })(),

  'ugol-sekushchie': (() => {
    const r = 4;
    const P: T2 = [-10, 0.5];
    /* Секущие PAB и PCD: A, C — ближние точки. */
    const B = naOkr(O, r, 55);
    const D = naOkr(O, r, 300);
    /* Ближние точки — пересечения отрезков PB, PD с окружностью. */
    const blizh = (X: T2): T2 => {
      const d = sub(X, P);
      const a = d[0] ** 2 + d[1] ** 2;
      const b = 2 * (d[0] * P[0] + d[1] * P[1]);
      const c = P[0] ** 2 + P[1] ** 2 - r * r;
      const s = (-b - Math.sqrt(b * b - 4 * a * c)) / (2 * a);
      return [P[0] + d[0] * s, P[1] + d[1] * s];
    };
    const A1 = blizh(B);
    const C1 = blizh(D);
    return nepodvizhnaya('t-ugol-sekushchie', { O, P, A: A1, B, C: C1, D }, (t) => [
      okr('k', t.O!, r),
      duga('dBD', t.O!, r, 300, 415, { cvet: 'a', gruppy: ['g'] }),
      duga('dAC', t.O!, r, ugolTochki(t.A!), ugolTochki(t.C!), { cvet: 'b', gruppy: ['g'] }),
      otr('PB', t.P!, t.B!),
      otr('PD', t.P!, t.D!),
      ug('uP', t.B!, t.P!, t.D!),
      tch('P', t.P!),
      tch('A', t.A!),
      tch('B', t.B!),
      tch('C', t.C!),
      tch('D', t.D!),
    ]);
  })(),

  'kasatelnaya-horda': (() => {
    const r = 5;
    const A = naOkr(O, r, 270);
    const B = naOkr(O, r, 20);
    const C = naOkr(O, r, 130);
    const [T1, T2] = kasatelnaya(O, A, 6);
    return nepodvizhnaya('t-kasatelnaya-horda', { O, A, B, C, T: T2, T1 }, (t) => [
      okr('k', t.O!, r),
      otr('kas', t.T1!, t.T!),
      otr('AB', t.A!, t.B!),
      otr('CA', t.C!, t.A!),
      otr('CB', t.C!, t.B!),
      ug('uTAB', t.T!, t.A!, t.B!, { cvet: 'a' }),
      ug('uC', t.A!, t.C!, t.B!),
      tch('A', t.A!),
      tch('B', t.B!),
      tch('C', t.C!),
      tch('T', t.T!),
    ]);
  })(),

  'otrezki-kasatelnyh': (() => {
    const r = 3;
    const M: T2 = [-9, 0];
    const u = (Math.acos(r / 9) * 180) / Math.PI;
    const A = naOkr(O, r, 180 - u);
    const B = naOkr(O, r, 180 + u);
    return nepodvizhnaya('t-otrezki-kasatelnyh', { O, M, A, B }, (t) => [
      okr('k', t.O!, r),
      otr('MA', t.M!, t.A!, { shtrihi: 1 }),
      otr('MB', t.M!, t.B!, { shtrihi: 1 }),
      otr('OA', t.O!, t.A!, { stil: 'punktir' }),
      otr('OB', t.O!, t.B!, { stil: 'punktir' }),
      otr('MO', t.M!, t.O!, { stil: 'punktir' }),
      ug('uA', t.O!, t.A!, t.M!, { pryamoy: true }),
      ug('uB', t.M!, t.B!, t.O!, { pryamoy: true }),
      tch('M', t.M!),
      tch('A', t.A!),
      tch('B', t.B!),
      tch('O', t.O!),
    ]);
  })(),

  hordy: (() => {
    const r = 5;
    const A = naOkr(O, r, 150);
    const B = naOkr(O, r, 350);
    const C = naOkr(O, r, 60);
    const D = naOkr(O, r, 250);
    const P = intersect(A, B, C, D) ?? O;
    return nepodvizhnaya('t-hordy', { O, A, B, C, D, P }, (t) => [
      okr('k', t.O!, r),
      otr('AP', t.A!, t.P!, { cvet: 'a', gruppy: ['g'] }),
      otr('PB', t.P!, t.B!, { cvet: 'a', gruppy: ['g'] }),
      otr('CP', t.C!, t.P!, { cvet: 'b', gruppy: ['g'] }),
      otr('PD', t.P!, t.D!, { cvet: 'b', gruppy: ['g'] }),
      tch('A', t.A!),
      tch('B', t.B!),
      tch('C', t.C!),
      tch('D', t.D!),
      tch('P', t.P!),
    ]);
  })(),

  'vpisannyy-4': (() => {
    const r = 5;
    const A = naOkr(O, r, 200);
    const B = naOkr(O, r, 115);
    const C = naOkr(O, r, 35);
    const D = naOkr(O, r, 290);
    return nepodvizhnaya('t-vpisannyy-4', { O, A, B, C, D }, (t) => [
      okr('k', t.O!, r),
      otr('AB', t.A!, t.B!),
      otr('BC', t.B!, t.C!),
      otr('CD', t.C!, t.D!),
      otr('DA', t.D!, t.A!),
      ug('uA', t.D!, t.A!, t.B!),
      ug('uC', t.B!, t.C!, t.D!, { dugi: 2 }),
      tch('A', t.A!),
      tch('B', t.B!),
      tch('C', t.C!),
      tch('D', t.D!),
    ]);
  })(),

  'opisannyy-4': (() => {
    const r = 3;
    /* Касательные в точках под углами 100°, 200°, 280°, 20°: вершины — их пересечения. */
    const ugly = [100, 195, 275, 10];
    const kas = ugly.map((u) => kasatelnaya(O, naOkr(O, r, u), 10));
    const v = (i: number, j: number): T2 =>
      intersect(kas[i]![0], kas[i]![1], kas[j]![0], kas[j]![1]) ?? O;
    const A = v(0, 1);
    const B = v(1, 2);
    const C = v(2, 3);
    const D = v(3, 0);
    return nepodvizhnaya('t-opisannyy-4', { O, A, B, C, D }, (t) => [
      okr('k', t.O!, r),
      otr('AB', t.A!, t.B!, { cvet: 'a', gruppy: ['g'] }),
      otr('BC', t.B!, t.C!, { cvet: 'b', gruppy: ['g'] }),
      otr('CD', t.C!, t.D!, { cvet: 'a', gruppy: ['g'] }),
      otr('DA', t.D!, t.A!, { cvet: 'b', gruppy: ['g'] }),
      tch('A', t.A!),
      tch('B', t.B!),
      tch('C', t.C!),
      tch('D', t.D!),
    ]);
  })(),

  mediana: (() => {
    const A: T2 = [1.5, 5];
    const B: T2 = [0, 0];
    const C: T2 = [8, 0];
    const M = mid(B, C);
    return nepodvizhnaya('t-mediana', { A, B, C, M }, (t) => [
      otr('AB', t.A!, t.B!),
      otr('BM', t.B!, t.M!, { shtrihi: 1 }),
      otr('MC', t.M!, t.C!, { shtrihi: 1 }),
      otr('CA', t.C!, t.A!),
      otr('AM', t.A!, t.M!, { cvet: 'a', gruppy: ['g'] }),
      tch('A', t.A!),
      tch('B', t.B!),
      tch('C', t.C!),
      tch('M', t.M!),
    ]);
  })(),

  bissektrisa: (() => {
    const A: T2 = [1.5, 5];
    const B: T2 = [0, 0];
    const C: T2 = [8, 0];
    const L = lerp(B, C, Math.hypot(1.5, 5) / (Math.hypot(1.5, 5) + Math.hypot(6.5, 5)));
    return nepodvizhnaya('t-bissektrisa', { A, B, C, L }, (t) => [
      otr('AB', t.A!, t.B!),
      otr('BC', t.B!, t.C!),
      otr('CA', t.C!, t.A!),
      otr('AL', t.A!, t.L!, { cvet: 'a', gruppy: ['g'] }),
      ug('u1', t.B!, t.A!, t.L!),
      ug('u2', t.L!, t.A!, t.C!),
      tch('A', t.A!),
      tch('B', t.B!),
      tch('C', t.C!),
      tch('L', t.L!),
    ]);
  })(),

  'obshchiy-ugol': (() => {
    const A: T2 = [0, 0];
    const B: T2 = [3, 5.5];
    const C: T2 = [9, 0];
    const B1 = lerp(A, B, 0.55);
    const C1 = lerp(A, C, 0.4);
    return nepodvizhnaya('t-obshchiy-ugol', { A, B, C, B1, C1 }, (t) => [
      mnog('f1', [t.A!, t.B1!, t.C1!], { skrytyy: false, cvet: 'a', gruppy: ['g'] }),
      otr('AB', t.A!, t.B!),
      otr('BC', t.B!, t.C!),
      otr('CA', t.C!, t.A!),
      otr('B1C1', t.B1!, t.C1!),
      ug('uA', t.B!, t.A!, t.C!),
      tch('A', t.A!),
      tch('B', t.B!),
      tch('C', t.C!),
      tch('B_1', t.B1!),
      tch('C_1', t.C1!),
    ]);
  })(),
};

export function risunokTeorii18(id: string): ZhivayaSkhema | undefined {
  return RISUNKI[id];
}

export const RISUNKI_TEORII_18: readonly string[] = Object.keys(RISUNKI);
