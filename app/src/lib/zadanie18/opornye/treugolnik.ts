/**
 * Чертежи опорных задач №18, тема «Треугольник»: высоты, биссектриса,
 * медиана. Группы подсветки — те же, что у шагов решения в
 * content/zadanie18/opornye/treugolnik.ts. Функции точек берёт и
 * проверка scripts/verify_opornye18.
 */

import { mnog, okr, otr, tch, ug } from '@/lib/skhemy/dsl';
import {
  add,
  chisloTeX,
  circumcircle,
  dist,
  foot,
  intersect,
  mid,
  naDiametre,
  orthocenter,
  sub,
  treugolnikPoUglam,
  uglyTreugolnika,
  unit,
} from '@/lib/skhemy/geometriya';
import type { Element, T2, Tochki } from '@/lib/skhemy/tipy';
import { goditsyaTreugolnik, naOsnovanie, scena, vPromezhutke } from './obshchee';

/* ── 1. Две высоты и окружность через их основания ───────────────── */

export function tochkiVysotRadius(t: Tochki) {
  const A = t.A!;
  const B = t.B!;
  const C = t.C!;
  const H = orthocenter(A, B, C);
  return {
    A,
    B,
    C,
    A1: foot(A, B, C),
    C1: foot(C, A, B),
    H,
    O: circumcircle(A, B, C),
    BH: naDiametre(B, H),
  };
}

export const OP_VYSOTY = scena({
  id: 'vysoty-radius',
  /* AC = 12, ∠A = 70°, ∠C = 50°, значит ∠B = 60° — данные пункта б). */
  nachalo: treugolnikPoUglam(70, 50, 12),
  podvizhnye: ['A', 'B', 'C'],
  pole: [-12, -10, 26, 24],
  goditsya: (t) =>
    goditsyaTreugolnik(t.A!, t.B!, t.C!, 20, 2) &&
    Math.max(...uglyTreugolnika(t.A!, t.B!, t.C!)) < 86,
  sluchaynaya: (rnd) => treugolnikPoUglam(vPromezhutke(rnd, 32, 80), vPromezhutke(rnd, 32, 80), 12),
  postroit(t) {
    const { A, B, C, A1, C1, H, O, BH } = tochkiVysotRadius(t);
    const el: Element[] = [
      mnog('f-aba1', [A, B, A1], { gruppy: ['pr'], cvet: 'a' }),
      mnog('f-cbc1', [C, B, C1], { gruppy: ['pr'], cvet: 'b' }),
      mnog('f-abc', [A, B, C], { gruppy: ['podobie'], cvet: 'a' }),
      mnog('f-a1bc1', [A1, B, C1], { gruppy: ['podobie', 'radius'], cvet: 'b' }),
      okr('o-abc', O.c, O.r, { stil: 'punktir', skrytyy: true, gruppy: ['sinusy'], cvet: 'a' }),
      okr('o-bh', BH.c, BH.r, {
        stil: 'punktir',
        skrytyy: true,
        gruppy: ['okr-bh', 'radius'],
        cvet: 'b',
      }),
      otr('AB', A, B),
      otr('BC', B, C),
      otr('CA', C, A, { gruppy: ['sinusy'], cvet: 'a' }),
      otr('AA1', A, A1, { shag: 1 }),
      otr('CC1', C, C1, { shag: 1 }),
      ug('pA1', A, A1, C, { pryamoy: true, shag: 1, gruppy: ['pr', 'okr-bh'], cvet: 'b' }),
      ug('pC1', C, C1, A, { pryamoy: true, shag: 1, gruppy: ['pr', 'okr-bh'], cvet: 'b' }),
      otr('A1C1', A1, C1, { shag: 2, gruppy: ['podobie'], cvet: 'b' }),
      otr('BH', B, H, { skrytyy: true, stil: 'punktir', gruppy: ['okr-bh'], cvet: 'b' }),
      ug('uB', A, B, C, { skrytyy: true, gruppy: ['pr', 'podobie', 'sinusy'], cvet: 'c' }),
      ug('uA', B, A, C, { skrytyy: true, gruppy: ['podobie'], cvet: 'a', dugi: 2 }),
      ug('uA1', B, A1, C1, { skrytyy: true, gruppy: ['podobie'], cvet: 'a', dugi: 2 }),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('A_1', A1, { shag: 1 }),
      tch('C_1', C1, { shag: 1 }),
      tch('H', H, { shag: 1, gruppy: ['okr-bh'], cvet: 'b' }),
      tch('O', O.c, { skrytyy: true, gruppy: ['sinusy'], cvet: 'a' }),
    ];
    const uB = uglyTreugolnika(A, B, C)[1];
    return {
      elementy: el,
      zametka: null,
      znacheniya: [
        `$\\angle B = ${Math.round(uB)}^\\circ$`,
        `$\\cos B = ${chisloTeX(Math.cos((uB * Math.PI) / 180))}$`,
        `$BA_1 : BA = ${chisloTeX(dist(B, A1) / dist(B, A))}$`,
        `$BC_1 : BC = ${chisloTeX(dist(B, C1) / dist(B, C))}$`,
      ],
    };
  },
  shagi: ['Треугольник $ABC$', 'Высоты $AA_1$ и $CC_1$, ортоцентр $H$', 'Отрезок $A_1C_1$'],
});

/* ── 2. Биссектриса и параллельная прямая ─────────────────────────── */

export function tochkiBissParallel(t: Tochki) {
  const A = t.A!;
  const B = t.B!;
  const C = t.C!;
  const napr = add(unit(sub(B, A)), unit(sub(C, A)));
  const L = intersect(A, add(A, napr), B, C) ?? mid(B, C);
  const K = intersect(L, add(L, sub(B, A)), A, C) ?? mid(A, C);
  return { A, B, C, L, K };
}

export const OP_BISSEKTRISA = scena({
  id: 'bissektrisa-parallel',
  /* AB = 15, AC = 10, ∠A = 60°. */
  nachalo: { A: [0, 0], B: [7.5, 7.5 * Math.sqrt(3)], C: [10, 0] },
  podvizhnye: ['A', 'B', 'C'],
  pole: [-10, -10, 26, 22],
  goditsya: (t) => goditsyaTreugolnik(t.A!, t.B!, t.C!, 18, 2),
  sluchaynaya: (rnd) =>
    treugolnikPoUglam(vPromezhutke(rnd, 40, 100), vPromezhutke(rnd, 25, 70), 11),
  postroit(t) {
    const { A, B, C, L, K } = tochkiBissParallel(t);
    const el: Element[] = [
      mnog('f-akl', [A, K, L], { gruppy: ['rb'], cvet: 'b' }),
      mnog('f-cab', [C, A, B], { gruppy: ['pod'], cvet: 'a' }),
      mnog('f-ckl', [C, K, L], { gruppy: ['pod'], cvet: 'b' }),
      otr('AB', A, B, { gruppy: ['par', 'pod'], cvet: 'a' }),
      otr('BC', B, C),
      otr('CA', C, A),
      otr('AL', A, L, { shag: 1, gruppy: ['bis', 'par'], cvet: 'c' }),
      otr('KL', K, L, { shag: 2, gruppy: ['par', 'pod'], cvet: 'b' }),
      otr('AK-r', A, K, { skrytyy: true, shtrihi: 1, gruppy: ['rb'], cvet: 'b' }),
      otr('KL-r', K, L, { skrytyy: true, shtrihi: 1, gruppy: ['rb'], cvet: 'b' }),
      ug('u1', B, A, L, { shag: 1, gruppy: ['bis', 'par', 'rb'], cvet: 'c' }),
      ug('u2', L, A, C, { shag: 1, gruppy: ['bis', 'rb'], cvet: 'c' }),
      ug('uL', K, L, A, { skrytyy: true, gruppy: ['par', 'rb'], cvet: 'c' }),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('L', L, { shag: 1 }),
      tch('K', K, { shag: 2 }),
    ];
    return {
      elementy: el,
      zametka: null,
      znacheniya: [
        `$\\angle BAL = ${chisloTeX(uglyTreugolnika(A, B, L)[0], 1)}^\\circ$`,
        `$\\angle KLA = ${chisloTeX(uglyTreugolnika(L, K, A)[0], 1)}^\\circ$`,
        `$AK : KL = ${chisloTeX(dist(A, K) / dist(K, L))}$`,
      ],
    };
  },
  shagi: ['Треугольник $ABC$', 'Биссектриса $AL$', 'Прямая $LK \\parallel AB$'],
});

/* ── 3. Удвоение медианы ──────────────────────────────────────────── */

export function tochkiMediany(t: Tochki) {
  const A = t.A!;
  const B = t.B!;
  const C = t.C!;
  const M = mid(B, C);
  const D: T2 = [2 * M[0] - A[0], 2 * M[1] - A[1]];
  return { A, B, C, M, D };
}

/* AB = 13, AC = 15, AM = 7: удвоенная медиана AD = 14, и треугольник
   ABD со сторонами 13, 15, 14 строится сразу: A(0; 0), D(14; 0), B(5; 12). */
const NACHALO_MEDIANY = naOsnovanie<'A' | 'B' | 'C'>(
  { A: [0, 0] as T2, B: [5, 12] as T2, C: [9, -12] as T2 },
  'B',
  'C',
);

export const OP_MEDIANA = scena({
  id: 'mediana-ploshchad',
  nachalo: NACHALO_MEDIANY,
  podvizhnye: ['A', 'B', 'C'],
  pole: [-25, -30, 40, 30],
  goditsya: (t) => goditsyaTreugolnik(t.A!, t.B!, t.C!, 18, 2),
  sluchaynaya: (rnd) => {
    const { A, B, C } = treugolnikPoUglam(vPromezhutke(rnd, 30, 85), vPromezhutke(rnd, 30, 85), 12);
    return naOsnovanie<'A' | 'B' | 'C'>({ A, B, C }, 'A', 'C');
  },
  postroit(t) {
    const { A, B, C, M, D } = tochkiMediany(t);
    const el: Element[] = [
      mnog('f-amc', [A, M, C], { gruppy: ['udv', 'pl'], cvet: 'b' }),
      mnog('f-dmb', [D, M, B], { gruppy: ['udv', 'pl'], cvet: 'b' }),
      mnog('f-abm', [A, B, M], { gruppy: ['pl'], cvet: 'a' }),
      mnog('f-abd', [A, B, D], { gruppy: ['ner', 'geron'], cvet: 'a' }),
      otr('AB', A, B, { gruppy: ['ner', 'geron'], cvet: 'a' }),
      otr('BC', B, C),
      otr('CA', C, A, { gruppy: ['udv'], cvet: 'b' }),
      otr('BM-r', B, M, { skrytyy: true, shtrihi: 1, gruppy: ['udv'], cvet: 'c' }),
      otr('MC-r', M, C, { skrytyy: true, shtrihi: 1, gruppy: ['udv'], cvet: 'c' }),
      otr('AM', A, M, { shag: 1, shtrihi: 2 }),
      otr('MD', M, D, { shag: 2, stil: 'punktir', shtrihi: 2 }),
      otr('BD', B, D, { shag: 2, stil: 'punktir', gruppy: ['udv', 'ner', 'geron'], cvet: 'b' }),
      otr('AD', A, D, { skrytyy: true, gruppy: ['ner', 'geron'], cvet: 'a' }),
      ug('uAMC', A, M, C, { skrytyy: true, gruppy: ['udv'], cvet: 'c' }),
      ug('uDMB', D, M, B, { skrytyy: true, gruppy: ['udv'], cvet: 'c' }),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('M', M, { shag: 1 }),
      tch('D', D, { shag: 2 }),
    ];
    return {
      elementy: el,
      zametka: null,
      znacheniya: [
        `$2AM = ${chisloTeX(2 * dist(A, M), 1)}$`,
        `$AB + AC = ${chisloTeX(dist(A, B) + dist(A, C), 1)}$`,
      ],
    };
  },
  shagi: ['Треугольник $ABC$', 'Медиана $AM$', 'Продолжение медианы: $MD = AM$, отрезок $BD$'],
});
