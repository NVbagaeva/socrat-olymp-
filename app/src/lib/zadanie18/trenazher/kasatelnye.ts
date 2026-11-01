/**
 * Чертежи задач тренажёра №18, тема «Касательные».
 * Тексты — content/zadanie18/trenazher/kasatelnye.ts.
 */

import { mnog, okr, otr, tch, ug } from '@/lib/skhemy/dsl';
import {
  add,
  angleAt,
  chisloTeX,
  circumcircle,
  dist,
  foot,
  incircle,
  lineCircle,
  mid,
  mul,
  sub,
  tangentPoints,
  treugolnikPoUglam,
  unit,
} from '@/lib/skhemy/geometriya';
import type { Element, T2, Tochki } from '@/lib/skhemy/tipy';
import {
  goditsyaTreugolnik,
  naOsnovanie,
  parametry,
  poStoronam,
  scena,
  vPromezhutke,
} from './obshchee';

/* ── 9. Отрезки касательных и полупериметр ───────────────────────── */

export function tochkiOtrezkov(t: Tochki) {
  const A = t.A!;
  const B = t.B!;
  const C = t.C!;
  const I = incircle(A, B, C);
  return { A, B, C, I, K: foot(I.c, A, B), L: foot(I.c, B, C), M: foot(I.c, C, A) };
}

export const KS_OTREZKI = scena({
  id: 'ks-otrezki',
  /* AB = 7, BC = 8, CA = 9. */
  nachalo: poStoronam(8, 9, 7),
  goditsya: (t) => goditsyaTreugolnik(t.A!, t.B!, t.C!, 25, 2),
  sluchaynaya: (rnd) => {
    const { A, B, C } = treugolnikPoUglam(vPromezhutke(rnd, 40, 90), vPromezhutke(rnd, 40, 80), 8);
    return naOsnovanie<'A' | 'B' | 'C'>({ A: B, B: A, C }, 'B', 'C');
  },
  postroit(t) {
    const { A, B, C, I, K, L, M } = tochkiOtrezkov(t);
    const el: Element[] = [
      okr('o', I.c, I.r),
      otr('AB', A, B),
      otr('BC', B, C, { gruppy: ['p'], cvet: 'b' }),
      otr('CA', C, A),
      otr('AK', A, K, { skrytyy: true, shtrihi: 1, gruppy: ['ravny', 'p'], cvet: 'a' }),
      otr('AM', A, M, { skrytyy: true, shtrihi: 1, gruppy: ['ravny', 'p'], cvet: 'a' }),
      otr('BK', B, K, { skrytyy: true, shtrihi: 2, gruppy: ['ravny'], cvet: 'b' }),
      otr('BL', B, L, { skrytyy: true, shtrihi: 2, gruppy: ['ravny'], cvet: 'b' }),
      otr('CL', C, L, { skrytyy: true, shtrihi: 3, gruppy: ['ravny'], cvet: 'c' }),
      otr('CM', C, M, { skrytyy: true, shtrihi: 3, gruppy: ['ravny'], cvet: 'c' }),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('K', K, { shag: 1 }),
      tch('L', L, { shag: 1 }),
      tch('M', M, { shag: 1 }),
    ];
    const p = (dist(A, B) + dist(B, C) + dist(C, A)) / 2;
    return {
      elementy: el,
      zametka: null,
      znacheniya: [`$AK = ${chisloTeX(dist(A, K))}$`, `$p - BC = ${chisloTeX(p - dist(B, C))}$`],
    };
  },
  shagi: ['Треугольник $ABC$', 'Вписанная окружность и точки касания $K$, $L$, $M$'],
});

/* ── 10. Две касательные из одной точки ──────────────────────────── */

export function tochkiKasatelnyh(t: Tochki) {
  const O = t.O!;
  const A = t.A!;
  const r = parametry(t)[0];
  const kas = tangentPoints(A, { c: O, r }) ?? [O, O];
  const B = kas[0];
  const C = kas[1];
  return { O, A, r, B, C, H: mid(B, C) };
}

export const KS_DVE_KASATELNYE = scena({
  id: 'ks-dve-kasatelnye',
  /* r = 6, AO = 10. */
  nachalo: { O: [0, 0], A: [10, 0], p: [6, 0] },
  goditsya: (t) => dist(t.O!, t.A!) > 1.3 * parametry(t)[0],
  sluchaynaya: (rnd) => {
    const r = vPromezhutke(rnd, 3, 7);
    return { O: [0, 0], A: [r * vPromezhutke(rnd, 1.4, 3), 0], p: [r, 0] };
  },
  postroit(t) {
    const { O, A, r, B, C, H } = tochkiKasatelnyh(t);
    const el: Element[] = [
      mnog('f-abc', [A, B, C], { gruppy: ['rb'], cvet: 'a' }),
      mnog('f-oba', [O, B, A], { gruppy: ['pr'], cvet: 'b' }),
      okr('o', O, r),
      otr('AB', A, B, { shag: 1, shtrihi: 1, gruppy: ['rb'], cvet: 'a' }),
      otr('AC', A, C, { shag: 1, shtrihi: 1, gruppy: ['rb'], cvet: 'a' }),
      otr('OB', O, B, { shag: 1, gruppy: ['pr'], cvet: 'b' }),
      otr('OC', O, C, { shag: 1 }),
      ug('pB', O, B, A, { pryamoy: true, shag: 1, gruppy: ['pr'], cvet: 'b' }),
      ug('pC', O, C, A, { pryamoy: true, shag: 1 }),
      otr('AO', A, O, { shag: 2, gruppy: ['rb', 'perp', 'pr'], cvet: 'b' }),
      otr('BC', B, C, { shag: 2, gruppy: ['perp', 'pr'], cvet: 'a' }),
      ug('uBAO', B, A, O, { skrytyy: true, gruppy: ['rb'], cvet: 'c' }),
      ug('uOAC', O, A, C, { skrytyy: true, gruppy: ['rb'], cvet: 'c' }),
      ug('pH', B, H, A, { skrytyy: true, pryamoy: true, gruppy: ['perp', 'pr'], cvet: 'b' }),
      tch('O', O),
      tch('A', A),
      tch('B', B, { shag: 1 }),
      tch('C', C, { shag: 1 }),
      tch('H', H, { shag: 2 }),
    ];
    return {
      elementy: el,
      zametka: null,
      znacheniya: [`$\\angle AHB = ${chisloTeX(angleAt(A, H, B), 1)}^\\circ$`],
    };
  },
  shagi: [
    'Окружность с центром $O$ и точка $A$',
    'Касательные $AB$ и $AC$, радиусы в точки касания',
    'Отрезки $AO$ и $BC$',
  ],
});

/* ── 11. Внутреннее касание и хорда-касательная ──────────────────── */

export function tochkiVnutrKasaniya(t: Tochki) {
  const K = t.K!;
  const A = t.A!;
  const B = t.B!;
  const AC = parametry(t)[0];
  const O = circumcircle(K, A, B);
  const C = add(A, mul(unit(sub(B, A)), AC));
  /* Малая окружность касается AB в C и проходит через K: центр — на перпендикуляре к AB в C. */
  const ab = unit(sub(B, A));
  let n: T2 = [-ab[1], ab[0]];
  const kc = sub(K, C);
  if (kc[0] * n[0] + kc[1] * n[1] < 0) n = [-n[0], -n[1]];
  const s = (kc[0] ** 2 + kc[1] ** 2) / (2 * (kc[0] * n[0] + kc[1] * n[1]));
  const Q = add(C, mul(n, s));
  const per = lineCircle(K, C, O);
  const W = per.length === 2 ? per[1]!.p : C;
  return { K, A, B, C, O, Q, q: s, W };
}

/* KA = 6, KB = 9, AB = 10, AC = 4: C — основание биссектрисы угла K. */
function vnutrKasanie(ka: number, kb: number, ab: number): Tochki {
  const { A: K, B: A, C: B } = poStoronam(ab, kb, ka);
  return { K, A, B, p: [(ab * ka) / (ka + kb), 0] };
}

export const KS_VNUTR_KASANIE = scena({
  id: 'ks-vnutr-kasanie',
  nachalo: vnutrKasanie(6, 9, 10),
  goditsya: (t) => {
    const { K, A, B } = tochkiVnutrKasaniya(t);
    return goditsyaTreugolnik(K, A, B, 22, 2) && Math.abs(dist(K, A) - dist(K, B)) > 1;
  },
  sluchaynaya: (rnd) => {
    const ka = vPromezhutke(rnd, 4, 8);
    const kb = vPromezhutke(rnd, 7, 11);
    const ab = vPromezhutke(rnd, Math.abs(kb - ka) + 3, ka + kb - 2);
    return vnutrKasanie(ka, kb, ab);
  },
  postroit(t) {
    const { K, A, B, C, O, Q, q, W } = tochkiVnutrKasaniya(t);
    const el: Element[] = [
      okr('o-big', O.c, O.r),
      okr('o-mal', Q, q, { gruppy: ['centry'], cvet: 'b' }),
      otr('AB', A, B, { gruppy: ['parall'], cvet: 'a' }),
      otr('KA', K, A, { shag: 1 }),
      otr('KB', K, B, { shag: 1 }),
      otr('KC', K, C, { shag: 1, gruppy: ['duga', 'otv'], cvet: 'c' }),
      otr('CW', C, W, { shag: 2, stil: 'punktir', gruppy: ['duga'], cvet: 'c' }),
      otr('KO', K, O.c, { skrytyy: true, stil: 'punktir', gruppy: ['centry'], cvet: 'b' }),
      otr('QC', Q, C, { skrytyy: true, gruppy: ['centry', 'parall'], cvet: 'b' }),
      otr('OW', O.c, W, { skrytyy: true, gruppy: ['centry', 'parall'], cvet: 'a' }),
      otr('WA', W, A, { skrytyy: true, shtrihi: 1, gruppy: ['duga'], cvet: 'a' }),
      otr('WB', W, B, { skrytyy: true, shtrihi: 1, gruppy: ['duga'], cvet: 'a' }),
      ug('pC', Q, C, B, { skrytyy: true, pryamoy: true, gruppy: ['parall'], cvet: 'b' }),
      ug('uAKC', A, K, C, { skrytyy: true, gruppy: ['duga', 'otv'], cvet: 'c' }),
      ug('uCKB', C, K, B, { skrytyy: true, gruppy: ['duga', 'otv'], cvet: 'c' }),
      tch('K', K),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('O', O.c, { skrytyy: true, gruppy: ['centry', 'parall'], cvet: 'a' }),
      tch('Q', Q, { skrytyy: true, gruppy: ['centry', 'parall'], cvet: 'b' }),
      tch('W', W, { shag: 2 }),
    ];
    return {
      elementy: el,
      zametka: null,
      znacheniya: [
        `$\\angle AKC = ${chisloTeX(angleAt(A, K, C), 1)}^\\circ$`,
        `$\\angle CKB = ${chisloTeX(angleAt(C, K, B), 1)}^\\circ$`,
      ],
    };
  },
  shagi: [
    'Окружности касаются в точке $K$, хорда $AB$ касается малой в точке $C$',
    'Отрезки $KA$, $KB$, $KC$',
    'Прямая $KC$ до большой окружности: точка $W$',
  ],
});

/* ── 12. Прямоугольная трапеция с вписанной окружностью ──────────── */

export function tochkiPryamTrap(t: Tochki) {
  const [r, tg] = parametry(t);
  const A: T2 = [0, 0];
  const B: T2 = [0, 2 * r];
  const C: T2 = [r + r * tg, 2 * r];
  const D: T2 = [r + r / tg, 0];
  const O: T2 = [r, r];
  return { A, B, C, D, O, r, E: foot(O, C, D) };
}

export const KS_PRYAM_TRAP = scena({
  id: 'ks-pryam-trap',
  /* r = 12, tg(D/2) = 3/4: AD = 28, BC = 21, CD = 25, OC = 15, OD = 20. */
  nachalo: { p: [12, 0.75] },
  goditsya: (t) => {
    const tg = parametry(t)[1];
    return tg > 0.3 && tg < 0.85;
  },
  sluchaynaya: (rnd) => ({ p: [vPromezhutke(rnd, 4, 12), vPromezhutke(rnd, 0.35, 0.8)] }),
  postroit(t) {
    const { A, B, C, D, O, r, E } = tochkiPryamTrap(t);
    const el: Element[] = [
      mnog('f-cod', [C, O, D], { gruppy: ['prya', 'r'], cvet: 'b' }),
      okr('o', O, r),
      otr('AB', A, B, { gruppy: ['pito'], cvet: 'a' }),
      otr('BC', B, C, { gruppy: ['pito'], cvet: 'a' }),
      otr('CD', C, D, { gruppy: ['pito', 'r'], cvet: 'a' }),
      otr('DA', D, A, { gruppy: ['pito'], cvet: 'a' }),
      ug('pA', B, A, D, { pryamoy: true }),
      ug('pB', A, B, C, { pryamoy: true }),
      otr('OC', O, C, { shag: 1, gruppy: ['bis', 'prya'], cvet: 'b' }),
      otr('OD', O, D, { shag: 1, gruppy: ['bis', 'prya'], cvet: 'b' }),
      otr('OE', O, E, { skrytyy: true, stil: 'punktir', gruppy: ['r'], cvet: 'c' }),
      ug('uBCO', B, C, O, { skrytyy: true, gruppy: ['bis'], cvet: 'c' }),
      ug('uOCD', O, C, D, { skrytyy: true, gruppy: ['bis'], cvet: 'c' }),
      ug('uCDO', C, D, O, { skrytyy: true, gruppy: ['bis'], cvet: 'a', dugi: 2 }),
      ug('uODA', O, D, A, { skrytyy: true, gruppy: ['bis'], cvet: 'a', dugi: 2 }),
      ug('pO', C, O, D, { skrytyy: true, pryamoy: true, gruppy: ['prya'], cvet: 'b' }),
      ug('pE', O, E, D, { skrytyy: true, pryamoy: true, gruppy: ['r'], cvet: 'c' }),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('D', D),
      tch('O', O, { shag: 1 }),
      tch('E', E, { skrytyy: true, gruppy: ['r'], cvet: 'c' }),
    ];
    return {
      elementy: el,
      zametka: null,
      znacheniya: [`$\\angle COD = ${chisloTeX(angleAt(C, O, D), 1)}^\\circ$`],
    };
  },
  shagi: ['Прямоугольная трапеция $ABCD$ и вписанная окружность', 'Отрезки $OC$ и $OD$'],
});
