/**
 * Чертежи задач тренажёра №18, тема «Окружность и вписанные углы».
 * Тексты — content/zadanie18/trenazher/okruzhnost.ts.
 */

import { mnog, okr, otr, tch, ug } from '@/lib/skhemy/dsl';
import {
  angleAt,
  chisloTeX,
  circumcircle,
  dist,
  foot,
  intersect,
  mid,
  orthocenter,
  polar,
  uglyTreugolnika,
} from '@/lib/skhemy/geometriya';
import type { Element, T2, Tochki } from '@/lib/skhemy/tipy';
import { goditsyaTreugolnik, naOkr, scena, vPromezhutke } from './obshchee';

/* ── 5. Пересекающиеся хорды ──────────────────────────────────────── */

export function tochkiHord(t: Tochki) {
  const A = t.A!;
  const B = t.B!;
  const C = t.C!;
  const D = t.D!;
  const P = intersect(A, B, C, D) ?? mid(A, B);
  return { A, B, C, D, P, O: circumcircle(A, B, C) };
}

/* AP = 6, PB = 4, CP = 3, PD = 8: PA·PB = PC·PD = 24. */
const U5 = polar(65);
export const OK_HORDY = scena({
  id: 'ok-hordy',
  nachalo: { A: [-6, 0], B: [4, 0], C: [-3 * U5[0], -3 * U5[1]], D: [8 * U5[0], 8 * U5[1]] },
  goditsya: (t) => {
    const { A, B, C, D, P } = tochkiHord(t);
    return (
      Math.min(dist(P, A), dist(P, B), dist(P, C), dist(P, D)) > 0.12 * dist(A, B) &&
      angleAt(A, P, C) > 30 &&
      angleAt(A, P, C) < 150
    );
  },
  /* Четыре точки на окружности в порядке A, C, B, D: хорды AB и CD пересекаются. */
  sluchaynaya: (rnd) => {
    const O: T2 = [0, 0];
    const a = vPromezhutke(rnd, 160, 220);
    const c = a + vPromezhutke(rnd, 40, 110);
    const b = c + vPromezhutke(rnd, 40, 110);
    const d = b + vPromezhutke(rnd, 40, 110);
    return { A: naOkr(O, 8, a), C: naOkr(O, 8, c), B: naOkr(O, 8, b), D: naOkr(O, 8, d) };
  },
  postroit(t) {
    const { A, B, C, D, P, O } = tochkiHord(t);
    const el: Element[] = [
      mnog('f-apc', [A, P, C], { gruppy: ['pod', 'otv'], cvet: 'a' }),
      mnog('f-dpb', [D, P, B], { gruppy: ['pod', 'otv'], cvet: 'b' }),
      okr('o', O.c, O.r),
      otr('AB', A, B, { shag: 1 }),
      otr('CD', C, D, { shag: 1 }),
      otr('AC', A, C, { shag: 2, gruppy: ['ugly', 'pod'], cvet: 'a' }),
      otr('BD', B, D, { shag: 2, gruppy: ['ugly', 'pod'], cvet: 'b' }),
      otr('BC', B, C, { skrytyy: true, stil: 'punktir', gruppy: ['ugly'], cvet: 'c' }),
      ug('uCAB', C, A, B, { skrytyy: true, gruppy: ['ugly', 'pod'], cvet: 'c' }),
      ug('uCDB', C, D, B, { skrytyy: true, gruppy: ['ugly', 'pod'], cvet: 'c' }),
      ug('uAPC', A, P, C, { skrytyy: true, gruppy: ['vert', 'pod'], cvet: 'a', dugi: 2 }),
      ug('uDPB', D, P, B, { skrytyy: true, gruppy: ['vert', 'pod'], cvet: 'a', dugi: 2 }),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('D', D),
      tch('P', P, { shag: 1 }),
    ];
    return {
      elementy: el,
      zametka: null,
      znacheniya: [
        `$AP\\cdot PB = ${chisloTeX(dist(A, P) * dist(P, B), 1)}$`,
        `$CP\\cdot PD = ${chisloTeX(dist(C, P) * dist(P, D), 1)}$`,
      ],
    };
  },
  shagi: [
    'Окружность и точки $A$, $B$, $C$, $D$',
    'Хорды $AB$ и $CD$, точка $P$',
    'Хорды $AC$ и $BD$',
  ],
});

/* ── 6. Ортоцентр и центр описанной окружности ───────────────────── */

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
  goditsya: (t) =>
    goditsyaTreugolnik(t.A!, t.B!, t.C!, 25, 1.5) &&
    Math.max(...uglyTreugolnika(t.A!, t.B!, t.C!)) < 82,
  sluchaynaya: (rnd) => {
    const O: T2 = [0, 0];
    const b = vPromezhutke(rnd, 200, 235);
    const c = vPromezhutke(rnd, 305, 340);
    const a = vPromezhutke(rnd, 60, 120);
    return { A: naOkr(O, 6, a), B: naOkr(O, 6, b), C: naOkr(O, 6, c) };
  },
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
      otr('AA1', A, A1, { shag: 1, gruppy: ['bah'], cvet: 'a' }),
      otr('BB1', B, B1, { shag: 1, gruppy: ['ah'], cvet: 'b' }),
      ug('pA1', A, A1, B, { pryamoy: true, shag: 1, gruppy: ['bah'], cvet: 'a' }),
      ug('pB1', A, B1, B, { pryamoy: true, shag: 1, gruppy: ['ah'], cvet: 'b' }),
      otr('OA', O.c, A, { shag: 2, shtrihi: 1, gruppy: ['oac'], cvet: 'b' }),
      otr('OC', O.c, C, { shag: 2, shtrihi: 1, gruppy: ['oac'], cvet: 'b' }),
      otr('OB', O.c, B, { skrytyy: true, stil: 'punktir', gruppy: ['om'], cvet: 'a' }),
      otr('OM', O.c, M, { skrytyy: true, stil: 'punktir', gruppy: ['om'], cvet: 'a' }),
      ug('pM', O.c, M, C, { skrytyy: true, pryamoy: true, gruppy: ['om'], cvet: 'a' }),
      ug('uBAH', B, A, H, { skrytyy: true, gruppy: ['bah', 'itog'], cvet: 'c' }),
      ug('uOAC', O.c, A, C, { skrytyy: true, gruppy: ['oac', 'itog'], cvet: 'c' }),
      ug('uB', A, B, C, { skrytyy: true, gruppy: ['bah', 'oac'], cvet: 'a', dugi: 2 }),
      ug('uAOC', A, O.c, C, { skrytyy: true, gruppy: ['oac'], cvet: 'b', dugi: 2 }),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('O', O.c, { shag: 2 }),
      tch('H', H, { shag: 1, gruppy: ['ah'], cvet: 'b' }),
      tch('A_1', A1, { shag: 1 }),
      tch('B_1', B1, { shag: 1 }),
      tch('M', M, { skrytyy: true, gruppy: ['om'], cvet: 'a' }),
    ];
    return {
      elementy: el,
      zametka: null,
      znacheniya: [
        `$\\angle BAH = ${chisloTeX(angleAt(B, A, H), 1)}^\\circ$`,
        `$\\angle OAC = ${chisloTeX(angleAt(O.c, A, C), 1)}^\\circ$`,
      ],
    };
  },
  shagi: [
    'Треугольник $ABC$ и описанная окружность',
    'Высоты $AA_1$ и $BB_1$, ортоцентр $H$',
    'Центр $O$, радиусы $OA$ и $OC$',
  ],
});

/* ── 7. Две секущие из одной точки ───────────────────────────────── */

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
  goditsya: (t) => {
    const { P, A, B, C, D } = tochkiSekushchih(t);
    return angleAt(B, P, D) > 20 && Math.min(dist(P, A), dist(A, B), dist(P, C), dist(C, D)) > 1.2;
  },
  /* Окружность и точка P вне её; секущие под случайными углами. */
  sluchaynaya: (rnd) => {
    const O: T2 = [8, 4];
    const r = 4;
    const P: T2 = [0, 0];
    const tochki = (u: number) => {
      const d = polar(u);
      const f: T2 = [P[0] - O[0], P[1] - O[1]];
      const b = 2 * (f[0] * d[0] + f[1] * d[1]);
      const c = f[0] ** 2 + f[1] ** 2 - r * r;
      const disk = b * b - 4 * c;
      if (disk <= 0) return null;
      const t1 = (-b - Math.sqrt(disk)) / 2;
      const t2 = (-b + Math.sqrt(disk)) / 2;
      return [polar(u, t1), polar(u, t2)] as const;
    };
    const os = (Math.atan2(O[1], O[0]) * 180) / Math.PI;
    const s1 = tochki(os - vPromezhutke(rnd, 4, 22));
    const s2 = tochki(os + vPromezhutke(rnd, 4, 22));
    if (s1 === null || s2 === null) return { P, A: [1, 0], B: [1, 0], C: [1, 0], D: [1, 0] };
    return { P, A: s1[0], B: s1[1], C: s2[0], D: s2[1] };
  },
  postroit(t) {
    const { P, A, B, C, D, O } = tochkiSekushchih(t);
    const el: Element[] = [
      mnog('f-pac', [P, A, C], { gruppy: ['pod', 'otv'], cvet: 'a' }),
      mnog('f-pdb', [P, D, B], { gruppy: ['pod', 'otv'], cvet: 'b' }),
      okr('o', O.c, O.r),
      otr('PB', P, B, { shag: 1, gruppy: ['stepen'], cvet: 'a' }),
      otr('PD', P, D, { shag: 1, gruppy: ['stepen'], cvet: 'b' }),
      otr('AC', A, C, { shag: 2, gruppy: ['pod', 'otv'], cvet: 'a' }),
      otr('BD', B, D, { shag: 2, gruppy: ['pod', 'otv'], cvet: 'b' }),
      otr('AD', A, D, { skrytyy: true, stil: 'punktir', gruppy: ['ugly'], cvet: 'c' }),
      ug('uP', A, P, C, { skrytyy: true, gruppy: ['pod'], cvet: 'a', dugi: 2 }),
      ug('uPCA', P, C, A, { skrytyy: true, gruppy: ['ugly', 'pod'], cvet: 'c' }),
      ug('uPBD', P, B, D, { skrytyy: true, gruppy: ['ugly', 'pod'], cvet: 'c' }),
      tch('P', P),
      tch('A', A, { shag: 1 }),
      tch('B', B, { shag: 1 }),
      tch('C', C, { shag: 1 }),
      tch('D', D, { shag: 1 }),
    ];
    return {
      elementy: el,
      zametka: null,
      znacheniya: [
        `$PA\\cdot PB = ${chisloTeX(dist(P, A) * dist(P, B), 1)}$`,
        `$PC\\cdot PD = ${chisloTeX(dist(P, C) * dist(P, D), 1)}$`,
      ],
    };
  },
  shagi: ['Окружность и точка $P$ вне её', 'Секущие $PAB$ и $PCD$', 'Хорды $AC$ и $BD$'],
});

/* ── 8. Перпендикулярные диагонали вписанного четырёхугольника ────── */

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
  goditsya: (t) => {
    const { A, B, C, D } = tochkiBrahmagupty(t);
    return Math.min(dist(A, B), dist(B, C), dist(C, D), dist(D, A)) > 1.5;
  },
  sluchaynaya: (rnd) =>
    brahmagupta(vPromezhutke(rnd, 25, 65), vPromezhutke(rnd, 4, 8), vPromezhutke(rnd, 6, 10)),
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
      otr('AC', A, C, { shag: 1 }),
      otr('BD', B, D, { shag: 1 }),
      ug('pP', B, P, C, { pryamoy: true, shag: 1, gruppy: ['med'], cvet: 'a' }),
      otr('MK', M, K, { shag: 2, gruppy: ['perp'], cvet: 'b' }),
      otr('BM-r', B, M, { skrytyy: true, shtrihi: 1, gruppy: ['med'], cvet: 'a' }),
      otr('MC-r', M, C, { skrytyy: true, shtrihi: 1, gruppy: ['med'], cvet: 'a' }),
      otr('PM-r', P, M, { skrytyy: true, shtrihi: 1, gruppy: ['med'], cvet: 'a' }),
      ug('uMPB', M, P, B, { skrytyy: true, gruppy: ['med', 'ugly'], cvet: 'c' }),
      ug('uMBP', M, B, P, { skrytyy: true, gruppy: ['med', 'ugly'], cvet: 'c' }),
      ug('uCAD', C, A, D, { skrytyy: true, gruppy: ['ugly', 'perp'], cvet: 'c' }),
      ug('uKPD', K, P, D, { skrytyy: true, gruppy: ['ugly', 'perp'], cvet: 'c' }),
      ug('uPDA', P, D, A, { skrytyy: true, gruppy: ['perp'], cvet: 'a', dugi: 2 }),
      ug('pK', P, K, D, { skrytyy: true, pryamoy: true, gruppy: ['perp'], cvet: 'b' }),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('D', D),
      tch('P', P, { shag: 1 }),
      tch('M', M, { shag: 2 }),
      tch('K', K, { shag: 2 }),
    ];
    return {
      elementy: el,
      zametka: null,
      znacheniya: [`$\\angle AKM = ${chisloTeX(angleAt(A, K, M), 1)}^\\circ$`],
    };
  },
  shagi: [
    'Вписанный четырёхугольник $ABCD$',
    'Перпендикулярные диагонали, точка $P$',
    'Середина $M$ стороны $BC$, прямая $MP$ до $AD$',
  ],
});
