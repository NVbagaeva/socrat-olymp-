/**
 * Чертежи перенесённых задач тренажёра №18, тема «Касательные».
 * Тексты — content/zadanie18/trenazherDop/kasatelnye.ts; функции точек берёт
 * и проверка scripts/verify_schemes/trenazherDop.
 */

import { mnog, okr, otr, tch, ug, velOtr } from '@/lib/skhemy/dsl';
import {
  add,
  circumcircle,
  foot,
  incircle,
  lineCircle,
  mid,
  mul,
  sub,
  tangentPoints,
  unit,
} from '@/lib/skhemy/geometriya';
import type { Element, T2, Tochki } from '@/lib/skhemy/tipy';
import { parametry, poStoronam, scena } from './obshchee';

/* ── ks-otrezki: Отрезки касательных и полупериметр ───────────────────────── */

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
  postroit(t) {
    const { A, B, C, I, K, L, M } = tochkiOtrezkov(t);
    const el: Element[] = [
      mnog('t-fig', [A, B, C], { skrytyy: false, rol: 'figure' }),
      okr('o', I.c, I.r, { rol: 'figure' }),
      otr('AB', A, B, { rol: 'figure' }),
      otr('BC', B, C, { rol: 'figure', gruppy: ['p'], cvet: 'b' }),
      otr('CA', C, A, { rol: 'figure' }),
      otr('AK', A, K, { rol: 'aux', skrytyy: true, shtrihi: 1, gruppy: ['ravny', 'p'], cvet: 'a' }),
      otr('AM', A, M, { rol: 'aux', skrytyy: true, shtrihi: 1, gruppy: ['ravny', 'p'], cvet: 'a' }),
      otr('BK', B, K, { rol: 'aux', skrytyy: true, shtrihi: 2, gruppy: ['ravny'], cvet: 'b' }),
      otr('BL', B, L, { rol: 'aux', skrytyy: true, shtrihi: 2, gruppy: ['ravny'], cvet: 'b' }),
      otr('CL', C, L, { rol: 'aux', skrytyy: true, shtrihi: 3, gruppy: ['ravny'], cvet: 'c' }),
      otr('CM', C, M, { rol: 'aux', skrytyy: true, shtrihi: 3, gruppy: ['ravny'], cvet: 'c' }),
      /* Данные условия на чертеже. */
      velOtr('d-AB', '7', A, B),
      velOtr('d-BC', '8', B, C),
      velOtr('d-CA', '9', C, A),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('K', K),
      tch('L', L),
      tch('M', M),
    ];
    return el;
  },
});

/* ── ks-dve-kasatelnye: Две касательные из одной точки ──────────────────────────── */

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
  postroit(t) {
    const { O, A, r, B, C, H } = tochkiKasatelnyh(t);
    const el: Element[] = [
      mnog('t-fig', [A, B, O, C], { skrytyy: false, rol: 'figure' }),
      mnog('f-abc', [A, B, C], { gruppy: ['rb'], cvet: 'a' }),
      mnog('f-oba', [O, B, A], { gruppy: ['pr'], cvet: 'b' }),
      okr('o', O, r, { rol: 'figure' }),
      otr('AB', A, B, { rol: 'figure', shtrihi: 1, gruppy: ['rb'], cvet: 'a' }),
      otr('AC', A, C, { rol: 'figure', shtrihi: 1, gruppy: ['rb'], cvet: 'a' }),
      otr('OB', O, B, { rol: 'figure', gruppy: ['pr'], cvet: 'b' }),
      otr('OC', O, C, { rol: 'figure' }),
      ug('pB', O, B, A, { pryamoy: true, gruppy: ['pr'], cvet: 'b' }),
      ug('pC', O, C, A, { pryamoy: true }),
      otr('AO', A, O, { rol: 'aux', gruppy: ['rb', 'perp', 'pr'], cvet: 'b' }),
      otr('BC', B, C, { rol: 'aux', gruppy: ['perp', 'pr'], cvet: 'a' }),
      ug('uBAO', B, A, O, { skrytyy: true, gruppy: ['rb'], cvet: 'c' }),
      ug('uOAC', O, A, C, { skrytyy: true, gruppy: ['rb'], cvet: 'c' }),
      ug('pH', B, H, A, { skrytyy: true, pryamoy: true, gruppy: ['perp', 'pr'], cvet: 'b' }),
      /* Данные условия на чертеже. */
      velOtr('d-r', 'r = 6', O, B),
      velOtr('d-AO', '10', A, O),
      tch('O', O),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('H', H),
    ];
    return el;
  },
});

/* ── ks-vnutr-kasanie: Внутреннее касание и хорда-касательная ──────────────────── */

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
  postroit(t) {
    const { K, A, B, C, O, Q, q, W } = tochkiVnutrKasaniya(t);
    const el: Element[] = [
      okr('o-big', O.c, O.r, { rol: 'figure' }),
      okr('o-mal', Q, q, { rol: 'figure', gruppy: ['centry'], cvet: 'b' }),
      otr('AB', A, B, { rol: 'aux', gruppy: ['parall'], cvet: 'a' }),
      otr('KA', K, A, { rol: 'aux' }),
      otr('KB', K, B, { rol: 'aux' }),
      otr('KC', K, C, { rol: 'aux', gruppy: ['duga', 'otv'], cvet: 'c' }),
      otr('CW', C, W, {
        rol: 'construction',
        skrytyy: true,
        stil: 'punktir',
        gruppy: ['duga', 'centry', 'parall'],
        cvet: 'c',
      }),
      otr('KO', K, O.c, {
        rol: 'construction',
        skrytyy: true,
        stil: 'punktir',
        gruppy: ['centry'],
        cvet: 'b',
      }),
      otr('QC', Q, C, { rol: 'aux', skrytyy: true, gruppy: ['centry', 'parall'], cvet: 'b' }),
      otr('OW', O.c, W, { rol: 'aux', skrytyy: true, gruppy: ['centry', 'parall'], cvet: 'a' }),
      otr('WA', W, A, { rol: 'aux', skrytyy: true, shtrihi: 1, gruppy: ['duga'], cvet: 'a' }),
      otr('WB', W, B, { rol: 'aux', skrytyy: true, shtrihi: 1, gruppy: ['duga'], cvet: 'a' }),
      ug('pC', Q, C, B, { skrytyy: true, pryamoy: true, gruppy: ['parall'], cvet: 'b' }),
      ug('uAKC', A, K, C, { skrytyy: true, gruppy: ['duga', 'otv'], cvet: 'c' }),
      ug('uCKB', C, K, B, { skrytyy: true, gruppy: ['duga', 'otv'], cvet: 'c' }),
      /* Данные условия на чертеже. */
      velOtr('d-KA', '6', K, A),
      velOtr('d-KB', '9', K, B),
      velOtr('d-AC', '4', A, C),
      tch('K', K),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('O', O.c, { skrytyy: true, gruppy: ['centry', 'parall'], cvet: 'a' }),
      tch('Q', Q, { skrytyy: true, gruppy: ['centry', 'parall'], cvet: 'b' }),
      tch('W', W, { skrytyy: true, gruppy: ['duga', 'centry', 'parall'] }),
    ];
    return el;
  },
});

/* ── ks-pryam-trap: Прямоугольная трапеция с вписанной окружностью ──────────── */

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
  postroit(t) {
    const { A, B, C, D, O, r, E } = tochkiPryamTrap(t);
    const el: Element[] = [
      mnog('t-fig', [A, B, C, D], { skrytyy: false, rol: 'figure' }),
      mnog('f-cod', [C, O, D], { gruppy: ['prya', 'r'], cvet: 'b' }),
      okr('o', O, r, { rol: 'figure' }),
      otr('AB', A, B, { rol: 'figure', gruppy: ['pito'], cvet: 'a' }),
      otr('BC', B, C, { rol: 'figure', gruppy: ['pito'], cvet: 'a' }),
      otr('CD', C, D, { rol: 'figure', gruppy: ['pito', 'r'], cvet: 'a' }),
      otr('DA', D, A, { rol: 'figure', gruppy: ['pito'], cvet: 'a' }),
      ug('pA', B, A, D, { pryamoy: true }),
      ug('pB', A, B, C, { pryamoy: true }),
      otr('OC', O, C, { rol: 'aux', gruppy: ['bis', 'prya'], cvet: 'b' }),
      otr('OD', O, D, { rol: 'aux', gruppy: ['bis', 'prya'], cvet: 'b' }),
      otr('OE', O, E, {
        rol: 'construction',
        skrytyy: true,
        stil: 'punktir',
        gruppy: ['r'],
        cvet: 'c',
      }),
      ug('uBCO', B, C, O, { skrytyy: true, gruppy: ['bis'], cvet: 'c' }),
      ug('uOCD', O, C, D, { skrytyy: true, gruppy: ['bis'], cvet: 'c' }),
      ug('uCDO', C, D, O, { skrytyy: true, gruppy: ['bis'], cvet: 'a', dugi: 2 }),
      ug('uODA', O, D, A, { skrytyy: true, gruppy: ['bis'], cvet: 'a', dugi: 2 }),
      ug('pO', C, O, D, { skrytyy: true, pryamoy: true, gruppy: ['prya'], cvet: 'b' }),
      ug('pE', O, E, D, { skrytyy: true, pryamoy: true, gruppy: ['r'], cvet: 'c' }),
      /* Данные условия на чертеже. */
      velOtr('d-OC', '15', O, C),
      /* Середина OD почти на окружности (r = 12, OD = 20): подпись — у внешней части. */
      velOtr('d-OD', '20', [O[0] + (D[0] - O[0]) * 0.6, O[1] + (D[1] - O[1]) * 0.6], D),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('D', D),
      tch('O', O),
      tch('E', E, { skrytyy: true, gruppy: ['r'], cvet: 'c' }),
    ];
    return el;
  },
});
