/**
 * Чертежи опорных задач 8–9 №18 (тема «Окружность и вписанные углы»):
 * квадрат на гипотенузе, окружность через две вершины треугольника.
 * Тексты — content/zadanie18/opornyeDop/okruzhnost.ts.
 */

import { mnog, okr, otr, tch, ug } from '@/lib/skhemy/dsl';
import { add, circumcircle, dist, lineCircle, mid, sub } from '@/lib/skhemy/geometriya';
import type { Element, T2, Tochki } from '@/lib/skhemy/tipy';
import { parametry, scena } from './obshchee';

/* ── 8. Квадрат на гипотенузе ─────────────────────────────────────── */

export function tochkiKvadrata(t: Tochki) {
  const A = t.A!;
  const B = t.B!;
  const C = t.C!;
  /* Квадрат ABDE строится по другую сторону от AB, чем C. */
  const ab = sub(B, A);
  const n1: T2 = [-ab[1], ab[0]];
  const storonaC = (C[0] - A[0]) * n1[0] + (C[1] - A[1]) * n1[1];
  const n: T2 = storonaC > 0 ? [ab[1], -ab[0]] : n1;
  const D = add(B, n);
  const E = add(A, n);
  return { A, B, C, D, E, O: mid(A, D) };
}

const A5: T2 = [0, 0];
const B5: T2 = [10, 0];

export const OP_KVADRAT = scena({
  id: 'kvadrat-na-gipotenuze',
  /* AB = 10, AC = 6, BC = 8: C(3,6; 4,8). */
  nachalo: { A: A5, B: B5, C: [3.6, 4.8] },
  postroit(t) {
    const { A, B, C, D, E, O } = tochkiKvadrata(t);
    const el: Element[] = [
      mnog('f-aco', [A, C, O], { gruppy: ['aco'], cvet: 'a' }),
      okr('o-ab', mid(A, B), dist(A, B) / 2, {
        stil: 'punktir',
        skrytyy: true,
        gruppy: ['okr', 'hord'],
        cvet: 'a',
      }),
      otr('AC', A, C, { gruppy: ['aco'], cvet: 'a' }),
      otr('CB', C, B),
      otr('AB', A, B),
      ug('uC', A, C, B, { pryamoy: true, gruppy: ['okr'], cvet: 'b' }),
      otr('BD', B, D),
      otr('DE', D, E),
      otr('EA', E, A),
      otr('AD', A, D, { stil: 'punktir' }),
      otr('BE', B, E, { stil: 'punktir' }),
      ug('uO', A, O, B, { pryamoy: true, skrytyy: true, gruppy: ['okr'], cvet: 'b' }),
      otr('OA', O, A, { skrytyy: true, shtrihi: 1, gruppy: ['hord', 'aco'], cvet: 'b' }),
      otr('OB', O, B, { skrytyy: true, shtrihi: 1, gruppy: ['hord'], cvet: 'b' }),
      otr('CO', C, O, { gruppy: ['bis', 'aco'], cvet: 'c' }),
      ug('uACO', A, C, O, { skrytyy: true, gruppy: ['bis', 'hord', 'aco'], cvet: 'c' }),
      ug('uOCB', O, C, B, { skrytyy: true, gruppy: ['bis', 'hord'], cvet: 'c' }),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('D', D),
      tch('E', E),
      tch('O', O),
    ];
    return el;
  },
});

/* ── 9. Окружность через две вершины треугольника ─────────────────── */

export function tochkiOkrDveVershiny(t: Tochki) {
  const A = t.A!;
  const B = t.B!;
  const C = t.C!;
  const [lam] = parametry(t);
  const K: T2 = [B[0] + (A[0] - B[0]) * lam, B[1] + (A[1] - B[1]) * lam];
  const krug = circumcircle(A, C, K);
  /* Вторая точка прямой BC на окружности: у C параметр 1. */
  const per = lineCircle(B, C, krug);
  const M =
    per.length === 2
      ? Math.abs(per[0]!.t - 1) > Math.abs(per[1]!.t - 1)
        ? per[0]!.p
        : per[1]!.p
      : C;
  return { A, B, C, K, M, krug };
}

export const OP_DVE_VERSHINY = scena({
  id: 'okruzhnost-cherez-dve-vershiny',
  /* BC = 10, AB = 15, AC = 12, BK = 4. */
  nachalo: { A: [9.05, Math.sqrt(225 - 9.05 ** 2)], B: [0, 0], C: [10, 0], p: [4 / 15, 0] },
  postroit(t) {
    const { A, B, C, K, M, krug } = tochkiOkrDveVershiny(t);
    const el: Element[] = [
      mnog('f-akmc', [A, K, M, C], { gruppy: ['vpis'], cvet: 'c' }),
      mnog('f-bac', [B, A, C], { gruppy: ['pod'], cvet: 'a' }),
      mnog('f-bmk', [B, M, K], { gruppy: ['pod', 'koef'], cvet: 'b' }),
      otr('AB', A, B),
      otr('BC', B, C),
      otr('CA', C, A, { gruppy: ['koef'], cvet: 'a' }),
      okr('o', krug.c, krug.r, { gruppy: ['vpis'], cvet: 'c' }),
      otr('KM', K, M, { gruppy: ['pod', 'koef'], cvet: 'b' }),
      ug('uAKM', A, K, M, { skrytyy: true, gruppy: ['ugol'], cvet: 'a', dugi: 2 }),
      ug('uBKM', B, K, M, { skrytyy: true, gruppy: ['ugol', 'pod'], cvet: 'c' }),
      ug('uACB', A, C, B, { skrytyy: true, gruppy: ['ugol', 'pod'], cvet: 'c' }),
      ug('uB', A, B, C, { skrytyy: true, gruppy: ['pod'], cvet: 'b', dugi: 2 }),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('K', K),
      tch('M', M),
    ];
    return el;
  },
});
