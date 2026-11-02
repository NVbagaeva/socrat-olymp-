/**
 * Чертежи перенесённых задач тренажёра №18, тема «Окружность и вписанные углы».
 * Тексты — content/zadanie18/trenazherDop/okruzhnost.ts; функции точек берёт
 * и проверка scripts/verify_schemes/trenazherDop.
 */

import { mnog, okr, otr, tch, ug, velOtr } from '@/lib/skhemy/dsl';
import { circumcircle, foot, intersect, mid, orthocenter, polar } from '@/lib/skhemy/geometriya';
import type { Element, Tochki } from '@/lib/skhemy/tipy';
import { chChertezh } from '@/content/zadanie18/trenazherDop/tipy';
import type { Parametry } from '../sceny';
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
export const OK_ORTOCENTR = (p: Parametry) =>
  scena({
    id: 'ok-ortocentr',
    /* Хорда BC на расстоянии √(R² − (BC/2)²) от центра. */
    nachalo: {
      A: naOkr([0, 0], p.R!, 112),
      B: [-p.BC! / 2, -Math.sqrt(p.R! ** 2 - (p.BC! / 2) ** 2)],
      C: [p.BC! / 2, -Math.sqrt(p.R! ** 2 - (p.BC! / 2) ** 2)],
    },
    postroit(t) {
      const { A, B, C, O, H, A1, B1, M } = tochkiOrtocentra(t);
      const el: Element[] = [
        mnog('t-fig', [A, B, C], { skrytyy: false, rol: 'figure' }),
        mnog('f-aba1', [A, B, A1], { gruppy: ['bah'], cvet: 'a' }),
        mnog('f-aoc', [A, O.c, C], { gruppy: ['oac'], cvet: 'b' }),
        mnog('f-ahb1', [A, H, B1], { gruppy: ['ah'], cvet: 'b' }),
        okr('o', O.c, O.r, { rol: 'figure' }),
        otr('AB', A, B, { rol: 'figure' }),
        otr('BC', B, C, { rol: 'figure', gruppy: ['om'], cvet: 'a' }),
        otr('CA', C, A, { rol: 'figure' }),
        otr('AA1', A, A1, { rol: 'aux', gruppy: ['bah'], cvet: 'a' }),
        otr('BB1', B, B1, { rol: 'aux', gruppy: ['ah'], cvet: 'b' }),
        ug('pA1', A, A1, B, { pryamoy: true, gruppy: ['bah'], cvet: 'a' }),
        ug('pB1', A, B1, B, { pryamoy: true, gruppy: ['ah'], cvet: 'b' }),
        otr('OA', O.c, A, { rol: 'aux', shtrihi: 1, gruppy: ['oac'], cvet: 'b' }),
        otr('OC', O.c, C, { rol: 'aux', shtrihi: 1, gruppy: ['oac'], cvet: 'b' }),
        otr('OB', O.c, B, {
          rol: 'construction',
          skrytyy: true,
          stil: 'punktir',
          gruppy: ['om'],
          cvet: 'a',
        }),
        otr('OM', O.c, M, {
          rol: 'construction',
          skrytyy: true,
          stil: 'punktir',
          gruppy: ['om'],
          cvet: 'a',
        }),
        ug('pM', O.c, M, C, { skrytyy: true, pryamoy: true, gruppy: ['om'], cvet: 'a' }),
        ug('uBAH', B, A, H, { skrytyy: true, gruppy: ['bah', 'itog'], cvet: 'c' }),
        ug('uOAC', O.c, A, C, { skrytyy: true, gruppy: ['oac', 'itog'], cvet: 'c' }),
        ug('uB', A, B, C, { skrytyy: true, gruppy: ['bah', 'oac'], cvet: 'a', dugi: 2 }),
        ug('uAOC', A, O.c, C, { skrytyy: true, gruppy: ['oac'], cvet: 'b', dugi: 2 }),
        /* Данные условия на чертеже. */
        velOtr('d-BC', chChertezh(p.BC!), B, C),
        velOtr('d-R', `R = ${chChertezh(p.R!)}`, O.c, C),
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
/** Угол при P — из треугольника PBD: PB, PD = PA·PB / PC, BD. */
function ugolP(p: Parametry): number {
  const PD = (p.PA! * p.PB!) / p.PC!;
  return (Math.acos((p.PB! ** 2 + PD ** 2 - p.BD! ** 2) / (2 * p.PB! * PD)) * 180) / Math.PI;
}
export const OK_SEKUSHCHIE = (p: Parametry) =>
  scena({
    id: 'ok-sekushchie',
    nachalo: {
      P: [0, 0],
      A: [p.PA!, 0],
      B: [p.PB!, 0],
      C: polar(ugolP(p), p.PC!),
      D: polar(ugolP(p), (p.PA! * p.PB!) / p.PC!),
    },
    postroit(t) {
      const { P, A, B, C, D, O } = tochkiSekushchih(t);
      const el: Element[] = [
        mnog('f-pac', [P, A, C], { gruppy: ['pod', 'otv'], cvet: 'a' }),
        mnog('f-pdb', [P, D, B], { gruppy: ['pod', 'otv'], cvet: 'b' }),
        okr('o', O.c, O.r, { rol: 'figure' }),
        otr('PB', P, B, { rol: 'aux', gruppy: ['stepen'], cvet: 'a' }),
        otr('PD', P, D, { rol: 'aux', gruppy: ['stepen'], cvet: 'b' }),
        otr('AC', A, C, { rol: 'aux', gruppy: ['pod', 'otv'], cvet: 'a' }),
        otr('BD', B, D, { rol: 'aux', gruppy: ['pod', 'otv'], cvet: 'b' }),
        otr('AD', A, D, {
          rol: 'construction',
          skrytyy: true,
          stil: 'punktir',
          gruppy: ['ugly'],
          cvet: 'c',
        }),
        ug('uP', A, P, C, { skrytyy: true, gruppy: ['pod'], cvet: 'a', dugi: 2 }),
        ug('uPCA', P, C, A, { skrytyy: true, gruppy: ['ugly', 'pod'], cvet: 'c' }),
        ug('uPBD', P, B, D, { skrytyy: true, gruppy: ['ugly', 'pod'], cvet: 'c' }),
        /* Данные условия на чертеже. */
        velOtr('d-PA', chChertezh(p.PA!), P, A),
        velOtr('d-PB', `PB = ${chChertezh(p.PB!)}`, P, B),
        velOtr('d-PC', chChertezh(p.PC!), P, C),
        velOtr('d-BD', chChertezh(p.BD!), B, D),
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

export const OK_BRAHMAGUPTA = (p: Parametry) =>
  scena({
    id: 'ok-brahmagupta',
    nachalo: brahmagupta(40, p.BC!, p.AD!),
    postroit(t) {
      const { A, B, C, D, P, M, K, O } = tochkiBrahmagupty(t);
      const el: Element[] = [
        mnog('t-fig', [A, B, C, D], { skrytyy: false, rol: 'figure' }),
        mnog('f-bpc', [B, P, C], { gruppy: ['med'], cvet: 'a' }),
        mnog('f-pkd', [P, K, D], { gruppy: ['perp'], cvet: 'b' }),
        mnog('f-apd', [A, P, D], { gruppy: ['perp'], cvet: 'a' }),
        okr('o', O.c, O.r, { rol: 'figure', gruppy: ['R'], cvet: 'a' }),
        otr('AB', A, B, { rol: 'figure' }),
        otr('BC', B, C, { rol: 'figure', gruppy: ['R'], cvet: 'b' }),
        otr('CD', C, D, { rol: 'figure' }),
        otr('DA', D, A, { rol: 'figure', gruppy: ['R'], cvet: 'b' }),
        otr('AC', A, C, { rol: 'aux' }),
        otr('BD', B, D, { rol: 'aux' }),
        ug('pP', B, P, C, { pryamoy: true, gruppy: ['med'], cvet: 'a' }),
        otr('MK', M, K, { rol: 'aux', gruppy: ['perp'], cvet: 'b' }),
        otr('BM-r', B, M, { rol: 'aux', skrytyy: true, shtrihi: 1, gruppy: ['med'], cvet: 'a' }),
        otr('MC-r', M, C, { rol: 'aux', skrytyy: true, shtrihi: 1, gruppy: ['med'], cvet: 'a' }),
        otr('PM-r', P, M, { rol: 'aux', skrytyy: true, shtrihi: 1, gruppy: ['med'], cvet: 'a' }),
        ug('uMPB', M, P, B, { skrytyy: true, gruppy: ['med', 'ugly'], cvet: 'c' }),
        ug('uMBP', M, B, P, { skrytyy: true, gruppy: ['med', 'ugly'], cvet: 'c' }),
        ug('uCAD', C, A, D, { skrytyy: true, gruppy: ['ugly', 'perp'], cvet: 'c' }),
        ug('uKPD', K, P, D, { skrytyy: true, gruppy: ['ugly', 'perp'], cvet: 'c' }),
        ug('uPDA', P, D, A, { skrytyy: true, gruppy: ['perp'], cvet: 'a', dugi: 2 }),
        ug('pK', P, K, D, { skrytyy: true, pryamoy: true, gruppy: ['perp'], cvet: 'b' }),
        /* Данные условия на чертеже. */
        velOtr('d-BC', chChertezh(p.BC!), B, C),
        velOtr('d-AD', chChertezh(p.AD!), A, D),
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
