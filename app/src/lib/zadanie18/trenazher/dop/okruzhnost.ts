/**
 * Чертежи перенесённых задач тренажёра №18, тема «Окружность и вписанные углы».
 * Тексты — content/zadanie18/trenazherDop/okruzhnost.ts; функции точек берёт
 * и проверка scripts/verify_schemes/trenazherDop.
 */

import { mnog, okr, otr, tch, ug, velOtr } from '@/lib/skhemy/dsl';
import { circumcircle, foot, intersect, mid, orthocenter, polar } from '@/lib/skhemy/geometriya';
import type { Element, Tochki } from '@/lib/skhemy/tipy';
import { naOkr, scena } from './obshchee';

/* ── ok-ortocentr: Ортоцентр и центр описанной окружности ───────────────────── */

export function tochkiOrtocentra(t: Tochki) {
  const A = t.A!;
  const B = t.B!;
  const C = t.C!;
  const O = circumcircle(A, B, C);
  return {
    A,
    B,
    C,
    O,
    H: orthocenter(A, B, C),
    A1: foot(A, B, C),
    B1: foot(B, A, C),
    M: mid(B, C),
  };
}

/* R = 5, BC = 8: хорда BC на расстоянии 3 от центра. */
export const OK_ORTOCENTR = scena({
  id: 'ok-ortocentr',
  nachalo: { A: naOkr([0, 0], 5, 112), B: [-4, -3], C: [4, -3] },
  postroit(t) {
    const { A, B, C, O, H, A1, B1, M } = tochkiOrtocentra(t);
    const el: Element[] = [
      mnog('f-aba1', [A, B, A1], { gruppy: ['bah'], cvet: 'a' }),
      mnog('f-aoc', [A, O.c, C], { gruppy: ['oac'], cvet: 'b' }),
      mnog('f-ahb1', [A, H, B1], { gruppy: ['ah'], cvet: 'b' }),
      okr('o', O.c, O.r),
      otr('AB', A, B),
      otr('BC', B, C, { gruppy: ['om'], cvet: 'a' }),
      otr('CA', C, A),
      otr('AA1', A, A1, { gruppy: ['bah'], cvet: 'a' }),
      otr('BB1', B, B1, { gruppy: ['ah'], cvet: 'b' }),
      ug('pA1', A, A1, B, { pryamoy: true, gruppy: ['bah'], cvet: 'a' }),
      ug('pB1', A, B1, B, { pryamoy: true, gruppy: ['ah'], cvet: 'b' }),
      otr('OA', O.c, A, { shtrihi: 1, gruppy: ['oac'], cvet: 'b' }),
      otr('OC', O.c, C, { shtrihi: 1, gruppy: ['oac'], cvet: 'b' }),
      otr('OB', O.c, B, { skrytyy: true, stil: 'punktir', gruppy: ['om'], cvet: 'a' }),
      otr('OM', O.c, M, { skrytyy: true, stil: 'punktir', gruppy: ['om'], cvet: 'a' }),
      ug('pM', O.c, M, C, { skrytyy: true, pryamoy: true, gruppy: ['om'], cvet: 'a' }),
      ug('uBAH', B, A, H, { skrytyy: true, gruppy: ['bah', 'itog'], cvet: 'c' }),
      ug('uOAC', O.c, A, C, { skrytyy: true, gruppy: ['oac', 'itog'], cvet: 'c' }),
      ug('uB', A, B, C, { skrytyy: true, gruppy: ['bah', 'oac'], cvet: 'a', dugi: 2 }),
      ug('uAOC', A, O.c, C, { skrytyy: true, gruppy: ['oac'], cvet: 'b', dugi: 2 }),
      /* Данные условия на чертеже. */
      velOtr('d-BC', '8', B, C),
      velOtr('d-R', 'R = 5', O.c, C),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('O', O.c),
      tch('H', H, { gruppy: ['ah'], cvet: 'b' }),
      tch('A_1', A1),
      tch('B_1', B1),
      tch('M', M, { skrytyy: true, gruppy: ['om'], cvet: 'a' }),
    ];
    return el;
  },
});

/* ── ok-sekushchie: Две секущие из одной точки ───────────────────────────────── */

export function tochkiSekushchih(t: Tochki) {
  const P = t.P!;
  const A = t.A!;
  const B = t.B!;
  const C = t.C!;
  const D = t.D!;
  return { P, A, B, C, D, O: circumcircle(A, B, C) };
}

/* PA = 4, PB = 9, PC = 3, PD = 12, BD = 12: угол при P — из треугольника PBD. */
const U7 = (Math.acos(81 / 216) * 180) / Math.PI;
export const OK_SEKUSHCHIE = scena({
  id: 'ok-sekushchie',
  nachalo: { P: [0, 0], A: [4, 0], B: [9, 0], C: polar(U7, 3), D: polar(U7, 12) },
  postroit(t) {
    const { P, A, B, C, D, O } = tochkiSekushchih(t);
    const el: Element[] = [
      mnog('f-pac', [P, A, C], { gruppy: ['pod', 'otv'], cvet: 'a' }),
      mnog('f-pdb', [P, D, B], { gruppy: ['pod', 'otv'], cvet: 'b' }),
      okr('o', O.c, O.r),
      otr('PB', P, B, { gruppy: ['stepen'], cvet: 'a' }),
      otr('PD', P, D, { gruppy: ['stepen'], cvet: 'b' }),
      otr('AC', A, C, { gruppy: ['pod', 'otv'], cvet: 'a' }),
      otr('BD', B, D, { gruppy: ['pod', 'otv'], cvet: 'b' }),
      otr('AD', A, D, { skrytyy: true, stil: 'punktir', gruppy: ['ugly'], cvet: 'c' }),
      ug('uP', A, P, C, { skrytyy: true, gruppy: ['pod'], cvet: 'a', dugi: 2 }),
      ug('uPCA', P, C, A, { skrytyy: true, gruppy: ['ugly', 'pod'], cvet: 'c' }),
      ug('uPBD', P, B, D, { skrytyy: true, gruppy: ['ugly', 'pod'], cvet: 'c' }),
      /* Данные условия на чертеже. */
      velOtr('d-PA', '4', P, A),
      velOtr('d-PB', 'PB = 9', P, B),
      velOtr('d-PC', '3', P, C),
      velOtr('d-BD', '12', B, D),
      tch('P', P),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('D', D),
    ];
    return el;
  },
});

/* ── ok-brahmagupta: Перпендикулярные диагонали вписанного четырёхугольника ────── */

export function tochkiBrahmagupty(t: Tochki) {
  const A = t.A!;
  const B = t.B!;
  const C = t.C!;
  const D = t.D!;
  const P = intersect(A, C, B, D) ?? mid(A, C);
  const M = mid(B, C);
  const K = intersect(M, P, A, D) ?? mid(A, D);
  return { A, B, C, D, P, M, K, O: circumcircle(A, B, C) };
}

/* BC = 6, AD = 8; диагонали по осям: A(−8 sin α; 0), C(6 cos α; 0), B(0; 6 sin α), D(0; −8 cos α). */
function brahmagupta(alfa: number, bc: number, ad: number): Tochki {
  const s = Math.sin((alfa * Math.PI) / 180);
  const c = Math.cos((alfa * Math.PI) / 180);
  return { A: [-ad * s, 0], B: [0, bc * s], C: [bc * c, 0], D: [0, -ad * c] };
}

export const OK_BRAHMAGUPTA = scena({
  id: 'ok-brahmagupta',
  nachalo: brahmagupta(40, 6, 8),
  postroit(t) {
    const { A, B, C, D, P, M, K, O } = tochkiBrahmagupty(t);
    const el: Element[] = [
      mnog('f-bpc', [B, P, C], { gruppy: ['med'], cvet: 'a' }),
      mnog('f-pkd', [P, K, D], { gruppy: ['perp'], cvet: 'b' }),
      mnog('f-apd', [A, P, D], { gruppy: ['perp'], cvet: 'a' }),
      okr('o', O.c, O.r, { gruppy: ['R'], cvet: 'a' }),
      otr('AB', A, B),
      otr('BC', B, C, { gruppy: ['R'], cvet: 'b' }),
      otr('CD', C, D),
      otr('DA', D, A, { gruppy: ['R'], cvet: 'b' }),
      otr('AC', A, C),
      otr('BD', B, D),
      ug('pP', B, P, C, { pryamoy: true, gruppy: ['med'], cvet: 'a' }),
      otr('MK', M, K, { gruppy: ['perp'], cvet: 'b' }),
      otr('BM-r', B, M, { skrytyy: true, shtrihi: 1, gruppy: ['med'], cvet: 'a' }),
      otr('MC-r', M, C, { skrytyy: true, shtrihi: 1, gruppy: ['med'], cvet: 'a' }),
      otr('PM-r', P, M, { skrytyy: true, shtrihi: 1, gruppy: ['med'], cvet: 'a' }),
      ug('uMPB', M, P, B, { skrytyy: true, gruppy: ['med', 'ugly'], cvet: 'c' }),
      ug('uMBP', M, B, P, { skrytyy: true, gruppy: ['med', 'ugly'], cvet: 'c' }),
      ug('uCAD', C, A, D, { skrytyy: true, gruppy: ['ugly', 'perp'], cvet: 'c' }),
      ug('uKPD', K, P, D, { skrytyy: true, gruppy: ['ugly', 'perp'], cvet: 'c' }),
      ug('uPDA', P, D, A, { skrytyy: true, gruppy: ['perp'], cvet: 'a', dugi: 2 }),
      ug('pK', P, K, D, { skrytyy: true, pryamoy: true, gruppy: ['perp'], cvet: 'b' }),
      /* Данные условия на чертеже. */
      velOtr('d-BC', '6', B, C),
      velOtr('d-AD', '8', A, D),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('D', D),
      tch('P', P),
      tch('M', M),
      tch('K', K),
    ];
    return el;
  },
});
