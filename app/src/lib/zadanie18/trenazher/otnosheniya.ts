/**
 * Чертежи задач тренажёра №18, тема «Отношения отрезков».
 * Тексты — content/zadanie18/trenazher/otnosheniya.ts.
 */

import { mnog, otr, tch } from '@/lib/skhemy/dsl';
import { add, chisloTeX, dist, intersect, mid, treugolnikPoUglam } from '@/lib/skhemy/geometriya';
import type { Element, T2, Tochki } from '@/lib/skhemy/tipy';
import { delit, goditsyaTreugolnik, scena, signedS, vPromezhutke } from './obshchee';

const sluchaynyyTreugolnik = (rnd: () => number) =>
  treugolnikPoUglam(vPromezhutke(rnd, 35, 95), vPromezhutke(rnd, 35, 80), 9);

/* ── 17. Точка пересечения медиан ────────────────────────────────── */

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
  goditsya: (t) => goditsyaTreugolnik(t.A!, t.B!, t.C!, 22, 2),
  sluchaynaya: (rnd) => {
    const { A, B, C } = sluchaynyyTreugolnik(rnd);
    return { A, B: C, C: B };
  },
  postroit(t) {
    const { A, B, C, M, N, G } = tochkiMedian(t);
    const el: Element[] = [
      mnog('f-gmn', [G, M, N], { gruppy: ['pod'], cvet: 'b' }),
      mnog('f-gab', [G, A, B], { gruppy: ['pod', 'pl'], cvet: 'a' }),
      mnog('f-abm', [A, B, M], { gruppy: ['pl'], cvet: 'c' }),
      otr('AB', A, B, { gruppy: ['sredlin', 'pod'], cvet: 'a' }),
      otr('BC', B, C),
      otr('CA', C, A),
      otr('AM', A, M, { shag: 1 }),
      otr('BN', B, N, { shag: 1 }),
      otr('MN', M, N, { shag: 2, stil: 'punktir', gruppy: ['sredlin', 'pod'], cvet: 'b' }),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('M', M, { shag: 1 }),
      tch('N', N, { shag: 1 }),
      tch('G', G, { shag: 1 }),
    ];
    return {
      elementy: el,
      zametka: null,
      znacheniya: [`$AG : GM = ${chisloTeX(dist(A, G) / dist(G, M))}$`],
    };
  },
  shagi: ['Треугольник $ABC$', 'Медианы $AM$ и $BN$, точка $G$', 'Средняя линия $MN$'],
});

/* ── 18. Менелай: прямая через середину стороны ──────────────────── */

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
  goditsya: (t) => goditsyaTreugolnik(t.A!, t.B!, t.C!, 25, 2),
  sluchaynaya: (rnd) => {
    const { A, B, C } = treugolnikPoUglam(vPromezhutke(rnd, 40, 85), vPromezhutke(rnd, 45, 100), 8);
    return { A, B, C };
  },
  postroit(t) {
    const { A, B, C, M, K, P } = tochkiMenelaya(t);
    const el: Element[] = [
      otr('AB', A, B, { gruppy: ['menelay'], cvet: 'a' }),
      otr('BC', B, C, { gruppy: ['menelay'], cvet: 'a' }),
      otr('CA', C, A, { gruppy: ['menelay', 'otv'], cvet: 'a' }),
      otr('CP', C, P, { shag: 1, stil: 'prodolzhenie', gruppy: ['otv'], cvet: 'b' }),
      otr('MP', M, P, { shag: 1, gruppy: ['menelay'], cvet: 'b' }),
      otr('AM-r', A, M, { skrytyy: true, shtrihi: 1, gruppy: ['menelay'], cvet: 'c' }),
      otr('MB-r', M, B, { skrytyy: true, shtrihi: 1, gruppy: ['menelay'], cvet: 'c' }),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('M', M),
      tch('K', K),
      tch('P', P, { shag: 1 }),
    ];
    return {
      elementy: el,
      zametka: null,
      znacheniya: [`$CP : PA = ${chisloTeX(dist(C, P) / dist(P, A))}$`],
    };
  },
  shagi: ['Треугольник $ABC$, точки $M$ и $K$', 'Прямая $MK$ до продолжения $AC$: точка $P$'],
});

/* ── 19. Чева: три чевианы через одну точку ──────────────────────── */

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
  goditsya: (t) => goditsyaTreugolnik(t.A!, t.B!, t.C!, 25, 2),
  sluchaynaya: (rnd) => {
    const { A, B, C } = sluchaynyyTreugolnik(rnd);
    return { A, B: C, C: B };
  },
  postroit(t) {
    const { A, B, C, A1, B1, P, C1 } = tochkiChevy(t);
    const el: Element[] = [
      mnog('f-aba1', [A, B, A1], { gruppy: ['menelay'], cvet: 'b' }),
      otr('AB', A, B, { gruppy: ['cheva'], cvet: 'a' }),
      otr('BC', B, C, { gruppy: ['cheva'], cvet: 'a' }),
      otr('CA', C, A, { gruppy: ['cheva'], cvet: 'a' }),
      otr('AA1', A, A1, { shag: 1, gruppy: ['menelay'], cvet: 'b' }),
      otr('BB1', B, B1, { shag: 1 }),
      otr('CC1', C, C1, { shag: 2, stil: 'punktir', gruppy: ['cheva', 'menelay'], cvet: 'c' }),
      otr('AC1-r', A, C1, { skrytyy: true, shtrihi: 1, gruppy: ['cheva'], cvet: 'c' }),
      otr('C1B-r', C1, B, { skrytyy: true, shtrihi: 1, gruppy: ['cheva'], cvet: 'c' }),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('A_1', A1, { shag: 1 }),
      tch('B_1', B1, { shag: 1 }),
      tch('P', P, { shag: 1 }),
      tch('C_1', C1, { shag: 2 }),
    ];
    return {
      elementy: el,
      zametka: null,
      znacheniya: [
        `$AC_1 : C_1B = ${chisloTeX(dist(A, C1) / dist(C1, B))}$`,
        `$AP : PA_1 = ${chisloTeX(dist(A, P) / dist(P, A1))}$`,
      ],
    };
  },
  shagi: ['Треугольник $ABC$', 'Чевианы $AA_1$ и $BB_1$, точка $P$', 'Прямая $CP$ до стороны $AB$'],
});

/* ── 20. Параллелограмм: диагональ делится на три части ──────────── */

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
  goditsya: (t) => {
    const { A, B, D } = t;
    return goditsyaTreugolnik(A!, B!, D!, 25, 3) && signedS([A!, D!, B!]) > 0;
  },
  sluchaynaya: (rnd) => {
    const d = vPromezhutke(rnd, 8, 11);
    return { A: [0, 0], B: [vPromezhutke(rnd, -1, 5), vPromezhutke(rnd, 4, 7)], D: [d, 0] };
  },
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
      otr('BD', B, D, { shag: 1, gruppy: ['pl'], cvet: 'c' }),
      otr('AK', A, K, { shag: 2 }),
      otr('AM', A, M, { shag: 2 }),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('D', D),
      tch('K', K, { shag: 2 }),
      tch('M', M, { shag: 2 }),
      tch('P', P, { shag: 2 }),
      tch('Q', Q, { shag: 2 }),
    ];
    return {
      elementy: el,
      zametka: null,
      znacheniya: [`$BP : BD = ${chisloTeX(dist(B, P) / dist(B, D))}$`],
    };
  },
  shagi: ['Параллелограмм $ABCD$', 'Диагональ $BD$', 'Отрезки $AK$ и $AM$, точки $P$ и $Q$'],
});
