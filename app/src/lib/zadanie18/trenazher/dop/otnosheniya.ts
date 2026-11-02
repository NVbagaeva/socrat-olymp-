/**
 * Чертежи перенесённых задач тренажёра №18, тема «Отношения отрезков».
 * Тексты — content/zadanie18/trenazherDop/otnosheniya.ts; функции точек берёт
 * и проверка scripts/verify_schemes/trenazherDop.
 */

import { mnog, otr, tch, vel, velOtr } from '@/lib/skhemy/dsl';
import { add, intersect, mid } from '@/lib/skhemy/geometriya';
import type { Element, T2, Tochki } from '@/lib/skhemy/tipy';
import { delit, scena } from './obshchee';

/* ── ot-mediany: Точка пересечения медиан ────────────────────────────────── */

export function tochkiMedian(t: Tochki) {
  const A = t.A!;
  const B = t.B!;
  const C = t.C!;
  const M = mid(B, C);
  const N = mid(A, C);
  return { A, B, C, M, N, G: intersect(A, M, B, N) ?? M };
}

export const OT_MEDIANY = scena({
  id: 'ot-mediany',
  /* S(ABC) = 24: основание AB = 8, высота 6. */
  nachalo: { A: [0, 0], B: [8, 0], C: [3, 6] },
  postroit(t) {
    const { A, B, C, M, N, G } = tochkiMedian(t);
    const el: Element[] = [
      mnog('f-gmn', [G, M, N], { gruppy: ['pod'], cvet: 'b' }),
      mnog('f-gab', [G, A, B], { gruppy: ['pod', 'pl'], cvet: 'a' }),
      mnog('f-abm', [A, B, M], { gruppy: ['pl'], cvet: 'c' }),
      otr('AB', A, B, { gruppy: ['sredlin', 'pod'], cvet: 'a' }),
      otr('BC', B, C),
      otr('CA', C, A),
      otr('AM', A, M),
      otr('BN', B, N),
      otr('MN', M, N, { skrytyy: true, stil: 'punktir', gruppy: ['sredlin', 'pod'], cvet: 'b' }),
      /* Данные условия на чертеже. */
      /* Площадь — в свободном четырёхугольнике GMCN (центр масс ABC — точка G). */
      vel('d-S', 'S_ABC = 24', {
        vnutri: [(G[0] + M[0] + C[0] + N[0]) / 4, (G[1] + M[1] + C[1] + N[1]) / 4],
      }),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('M', M),
      tch('N', N),
      tch('G', G),
    ];
    return el;
  },
});

/* ── ot-menelay: Менелай: прямая через середину стороны ──────────────────── */

export function tochkiMenelaya(t: Tochki) {
  const A = t.A!;
  const B = t.B!;
  const C = t.C!;
  const M = mid(A, B);
  const K = delit(B, C, 3, 1);
  return { A, B, C, M, K, P: intersect(M, K, A, C) ?? C };
}

export const OT_MENELAY = scena({
  id: 'ot-menelay',
  /* AC = 8. */
  nachalo: { A: [0, 0], C: [8, 0], B: [3, 6] },
  postroit(t) {
    const { A, B, C, M, K, P } = tochkiMenelaya(t);
    const el: Element[] = [
      otr('AB', A, B, { gruppy: ['menelay'], cvet: 'a' }),
      otr('BC', B, C, { gruppy: ['menelay'], cvet: 'a' }),
      otr('CA', C, A, { gruppy: ['menelay', 'otv'], cvet: 'a' }),
      otr('CP', C, P, { stil: 'prodolzhenie', gruppy: ['otv'], cvet: 'b' }),
      otr('MP', M, P, { gruppy: ['menelay'], cvet: 'b' }),
      otr('AM-r', A, M, { skrytyy: true, shtrihi: 1, gruppy: ['menelay'], cvet: 'c' }),
      otr('MB-r', M, B, { skrytyy: true, shtrihi: 1, gruppy: ['menelay'], cvet: 'c' }),
      /* Данные условия на чертеже. */
      velOtr('d-AC', '8', A, C),
      velOtr('d-BK', '3x', B, K),
      velOtr('d-KC', 'x', K, C),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('M', M),
      tch('K', K),
      tch('P', P),
    ];
    return el;
  },
});

/* ── ot-cheva: Чева: три чевианы через одну точку ──────────────────────── */

export function tochkiChevy(t: Tochki) {
  const A = t.A!;
  const B = t.B!;
  const C = t.C!;
  const A1 = delit(B, C, 1, 2);
  const B1 = delit(C, A, 2, 1);
  const P = intersect(A, A1, B, B1) ?? A1;
  return { A, B, C, A1, B1, P, C1: intersect(C, P, A, B) ?? mid(A, B) };
}

export const OT_CHEVA = scena({
  id: 'ot-cheva',
  nachalo: { A: [0, 0], B: [10, 0], C: [4, 7] },
  postroit(t) {
    const { A, B, C, A1, B1, P, C1 } = tochkiChevy(t);
    const el: Element[] = [
      mnog('f-aba1', [A, B, A1], { gruppy: ['menelay'], cvet: 'b' }),
      otr('AB', A, B, { gruppy: ['cheva'], cvet: 'a' }),
      otr('BC', B, C, { gruppy: ['cheva'], cvet: 'a' }),
      otr('CA', C, A, { gruppy: ['cheva'], cvet: 'a' }),
      otr('AA1', A, A1, { gruppy: ['menelay'], cvet: 'b' }),
      otr('BB1', B, B1),
      otr('CC1', C, C1, { stil: 'punktir', gruppy: ['cheva', 'menelay'], cvet: 'c' }),
      otr('AC1-r', A, C1, { skrytyy: true, shtrihi: 1, gruppy: ['cheva'], cvet: 'c' }),
      otr('C1B-r', C1, B, { skrytyy: true, shtrihi: 1, gruppy: ['cheva'], cvet: 'c' }),
      /* Данные условия на чертеже. */
      velOtr('d-BA1', 'x', B, A1),
      velOtr('d-A1C', '2x', A1, C),
      velOtr('d-CB1', '2y', C, B1),
      velOtr('d-B1A', 'y', B1, A),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('A_1', A1),
      tch('B_1', B1),
      tch('P', P),
      tch('C_1', C1),
    ];
    return el;
  },
});

/* ── ot-parallelogramm: Параллелограмм: диагональ делится на три части ──────────── */

export function tochkiParallelogramma(t: Tochki) {
  const A = t.A!;
  const B = t.B!;
  const D = t.D!;
  const C: T2 = add(B, [D[0] - A[0], D[1] - A[1]]);
  const K = mid(B, C);
  const M = delit(C, D, 1, 2);
  return {
    A,
    B,
    C,
    D,
    K,
    M,
    P: intersect(A, K, B, D) ?? B,
    Q: intersect(A, M, B, D) ?? D,
  };
}

export const OT_PARALLELOGRAMM = scena({
  id: 'ot-parallelogramm',
  /* S(ABCD) = 60: AD = 10, высота 6. */
  nachalo: { A: [0, 0], B: [3, 6], D: [10, 0] },
  postroit(t) {
    const { A, B, C, D, K, M, P, Q } = tochkiParallelogramma(t);
    const el: Element[] = [
      mnog('f-bpk', [B, P, K], { gruppy: ['bab1'], cvet: 'a' }),
      mnog('f-dpa', [D, P, A], { gruppy: ['bab1'], cvet: 'b' }),
      mnog('f-dqm', [D, Q, M], { gruppy: ['bab2'], cvet: 'a' }),
      mnog('f-bqa', [B, Q, A], { gruppy: ['bab2'], cvet: 'b' }),
      mnog('f-apq', [A, P, Q], { gruppy: ['pl'], cvet: 'c' }),
      otr('AB', A, B),
      otr('BC', B, C),
      otr('CD', C, D),
      otr('DA', D, A),
      otr('BD', B, D, { gruppy: ['pl'], cvet: 'c' }),
      otr('AK', A, K),
      otr('AM', A, M),
      /* Данные условия на чертеже. */
      /* Площадь — в свободном треугольнике ADQ (центр — на диагонали BD). */
      vel('d-S', 'S_ABCD = 60', {
        vnutri: [(A[0] + D[0] + Q[0]) / 3, (A[1] + D[1] + Q[1]) / 3],
      }),
      velOtr('d-CM', 'x', C, M),
      velOtr('d-MD', '2x', M, D),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('D', D),
      tch('K', K),
      tch('M', M),
      tch('P', P),
      tch('Q', Q),
    ];
    return el;
  },
});
