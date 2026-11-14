/**
 * Чертежи перенесённых задач тренажёра №18, тема «Отношения отрезков».
 * Тексты — content/zadanie18/trenazherDop/otnosheniya.ts; функции точек берёт
 * и проверка scripts/verify_schemes/trenazherDop.
 */

import { mnog, otr, tch, vel, velOtr } from '@/lib/skhemy/dsl';
import { add, intersect, mid } from '@/lib/skhemy/geometriya';
import type { Element, T2, Tochki } from '@/lib/skhemy/tipy';
import { chChertezh } from '@/content/zadanie18/trenazherDop/tipy';
import type { Parametry } from '../sceny';
import { delit, scena } from './obshchee';

/* ── ot-mediany: Точка пересечения медиан ────────────────────────────────── */

/** Часть отношения: 1 → «x», 3 → «3x». */
const chast = (n: number, bukva: string) => (n === 1 ? bukva : `${n}${bukva}`);

export function tochkiMedian(t: Tochki) {
  const A = t.A!;
  const B = t.B!;
  const C = t.C!;
  const M = mid(B, C);
  const N = mid(A, C);
  return { A, B, C, M, N, G: intersect(A, M, B, N) ?? M };
}

export const OT_MEDIANY = (p: Parametry) =>
  scena({
    id: 'ot-mediany',
    /* S(ABC) = 24: основание AB = 8, высота 6. */
    /* Треугольник площади 24, растянутый до площади S. */
    nachalo: (() => {
      const k = Math.sqrt(p.S! / 24);
      return { A: [0, 0], B: [8 * k, 0], C: [3 * k, 6 * k] } as Tochki;
    })(),
    postroit(t) {
      const { A, B, C, M, N, G } = tochkiMedian(t);
      const el: Element[] = [
        /* б) ищет площадь AGB. */
        mnog('t-isk', [A, G, B], { skrytyy: false, rol: 'region-sought' }),
        mnog('t-fig', [A, B, C], { skrytyy: false, rol: 'region' }),
        mnog('f-gmn', [G, M, N], { gruppy: ['pod'], cvet: 'b' }),
        mnog('f-gab', [G, A, B], { gruppy: ['pod', 'pl'], cvet: 'a' }),
        mnog('f-abm', [A, B, M], { gruppy: ['pl'], cvet: 'c' }),
        otr('AB', A, B, { rol: 'figure', gruppy: ['sredlin', 'pod'], cvet: 'a' }),
        otr('BC', B, C, { rol: 'figure' }),
        otr('CA', C, A, { rol: 'figure' }),
        otr('AM', A, M, { rol: 'aux' }),
        otr('BN', B, N, { rol: 'aux' }),
        otr('MN', M, N, {
          rol: 'construction',
          skrytyy: true,
          stil: 'punktir',
          gruppy: ['sredlin', 'pod'],
          cvet: 'b',
        }),
        /* Данные условия на чертеже. */
        /* Площадь — в свободном четырёхугольнике GMCN (центр масс ABC — точка G). */
        vel(
          'd-S',
          `S_ABC = ${chChertezh(p.S!)}`,
          {
            vnutri: [(G[0] + M[0] + C[0] + N[0]) / 4, (G[1] + M[1] + C[1] + N[1]) / 4],
          },
          { rol: 'region' },
        ),
        velOtr('d-Sx', 'S_AGB = ?', A, B, { rol: 'region-sought' }),
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

export const OT_MENELAY = (p: Parametry) =>
  scena({
    id: 'ot-menelay',
    /* AC = 8. */
    nachalo: (() => {
      const k = p.AC! / 8;
      return { A: [0, 0], C: [8 * k, 0], B: [3 * k, 6 * k] } as Tochki;
    })(),
    postroit(t) {
      const { A, B, C, M, K, P } = tochkiMenelaya(t);
      const el: Element[] = [
        mnog('t-fig', [A, B, C], { skrytyy: false, rol: 'figure' }),
        otr('BK', B, K, { rol: 'part-x' }),
        otr('KC', K, C, { rol: 'part-x' }),
        otr('AB', A, B, { rol: 'figure', gruppy: ['menelay'], cvet: 'a' }),
        otr('BC', B, C, { rol: 'figure', gruppy: ['menelay'], cvet: 'a' }),
        otr('CA', C, A, { rol: 'figure', gruppy: ['menelay', 'otv'], cvet: 'a' }),
        otr('CP', C, P, { rol: 'construction', stil: 'prodolzhenie', gruppy: ['otv'], cvet: 'b' }),
        otr('MP', M, P, { rol: 'aux', gruppy: ['menelay'], cvet: 'b' }),
        otr('AM-r', A, M, {
          rol: 'aux',
          skrytyy: true,
          shtrihi: 1,
          gruppy: ['menelay'],
          cvet: 'c',
        }),
        otr('MB-r', M, B, {
          rol: 'aux',
          skrytyy: true,
          shtrihi: 1,
          gruppy: ['menelay'],
          cvet: 'c',
        }),
        /* Данные условия на чертеже. */
        velOtr('d-AC', chChertezh(p.AC!), A, C),
        velOtr('d-BK', '3x', B, K, { rol: 'part-x' }),
        velOtr('d-KC', 'x', K, C, { rol: 'part-x' }),
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
  /* Отношения набора: BA₁ : A₁C = m : n, CB₁ : B₁A = n : m. */
  const [m, n] = t.p ?? [1, 2];
  const A1 = delit(B, C, m, n);
  const B1 = delit(C, A, n, m);
  const P = intersect(A, A1, B, B1) ?? A1;
  return { A, B, C, A1, B1, P, C1: intersect(C, P, A, B) ?? mid(A, B) };
}

export const OT_CHEVA = (p: Parametry) =>
  scena({
    id: 'ot-cheva',
    nachalo: { A: [0, 0], B: [10, 0], C: [4, 7], p: [p.m!, p.n!] },
    postroit(t) {
      const { A, B, C, A1, B1, P, C1 } = tochkiChevy(t);
      const el: Element[] = [
        mnog('t-fig', [A, B, C], { skrytyy: false, rol: 'figure' }),
        otr('BA1p', B, A1, { rol: 'part-x' }),
        otr('A1Cp', A1, C, { rol: 'part-x' }),
        otr('CB1p', C, B1, { rol: 'part-y' }),
        otr('B1Ap', B1, A, { rol: 'part-y' }),
        mnog('f-aba1', [A, B, A1], { gruppy: ['menelay'], cvet: 'b' }),
        otr('AB', A, B, { rol: 'figure', gruppy: ['cheva'], cvet: 'a' }),
        otr('BC', B, C, { rol: 'figure', gruppy: ['cheva'], cvet: 'a' }),
        otr('CA', C, A, { rol: 'figure', gruppy: ['cheva'], cvet: 'a' }),
        otr('AA1', A, A1, { rol: 'aux', gruppy: ['menelay'], cvet: 'b' }),
        otr('BB1', B, B1, { rol: 'aux' }),
        otr('CC1', C, C1, {
          rol: 'construction',
          stil: 'punktir',
          gruppy: ['cheva', 'menelay'],
          cvet: 'c',
        }),
        otr('AC1-r', A, C1, {
          rol: 'aux',
          skrytyy: true,
          shtrihi: 1,
          gruppy: ['cheva'],
          cvet: 'c',
        }),
        otr('C1B-r', C1, B, {
          rol: 'aux',
          skrytyy: true,
          shtrihi: 1,
          gruppy: ['cheva'],
          cvet: 'c',
        }),
        /* Данные условия на чертеже. */
        velOtr('d-BA1', chast(p.m!, 'x'), B, A1, { rol: 'part-x' }),
        velOtr('d-A1C', chast(p.n!, 'x'), A1, C, { rol: 'part-x' }),
        velOtr('d-CB1', chast(p.n!, 'y'), C, B1, { rol: 'part-y' }),
        velOtr('d-B1A', chast(p.m!, 'y'), B1, A, { rol: 'part-y' }),
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

export const OT_PARALLELOGRAMM = (p: Parametry) =>
  scena({
    id: 'ot-parallelogramm',
    /* S(ABCD) = 60: AD = 10, высота 6. */
    /* Параллелограмм площади 60, растянутый до площади S. */
    nachalo: (() => {
      const k = Math.sqrt(p.S! / 60);
      return { A: [0, 0], B: [3 * k, 6 * k], D: [10 * k, 0] } as Tochki;
    })(),
    postroit(t) {
      const { A, B, C, D, K, M, P, Q } = tochkiParallelogramma(t);
      const el: Element[] = [
        /* б) ищет площадь APQ. */
        mnog('t-isk', [A, P, Q], { skrytyy: false, rol: 'region-sought' }),
        mnog('t-fig', [A, B, C, D], { skrytyy: false, rol: 'region' }),
        otr('CMp', C, M, { rol: 'part-x' }),
        otr('MDp', M, D, { rol: 'part-x' }),
        mnog('f-bpk', [B, P, K], { gruppy: ['bab1'], cvet: 'a' }),
        mnog('f-dpa', [D, P, A], { gruppy: ['bab1'], cvet: 'b' }),
        mnog('f-dqm', [D, Q, M], { gruppy: ['bab2'], cvet: 'a' }),
        mnog('f-bqa', [B, Q, A], { gruppy: ['bab2'], cvet: 'b' }),
        mnog('f-apq', [A, P, Q], { gruppy: ['pl'], cvet: 'c' }),
        otr('AB', A, B, { rol: 'figure' }),
        otr('BC', B, C, { rol: 'figure' }),
        otr('CD', C, D, { rol: 'figure' }),
        otr('DA', D, A, { rol: 'figure' }),
        otr('BD', B, D, { rol: 'aux', gruppy: ['pl'], cvet: 'c' }),
        otr('AK', A, K, { rol: 'aux' }),
        otr('AM', A, M, { rol: 'aux' }),
        /* Данные условия на чертеже. */
        /* Площадь — в свободном треугольнике ADQ (центр — на диагонали BD). */
        vel(
          'd-S',
          `S_ABCD = ${chChertezh(p.S!)}`,
          {
            vnutri: [(A[0] + D[0] + Q[0]) / 3, (A[1] + D[1] + Q[1]) / 3],
          },
          { rol: 'region' },
        ),
        velOtr('d-CM', 'x', C, M, { rol: 'part-x' }),
        velOtr('d-MD', '2x', M, D, { rol: 'part-x' }),
        vel(
          'd-Sx',
          'S_APQ = ?',
          { vnutri: [(A[0] + P[0] + Q[0]) / 3, (A[1] + P[1] + Q[1]) / 3] },
          { rol: 'region-sought' },
        ),
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
