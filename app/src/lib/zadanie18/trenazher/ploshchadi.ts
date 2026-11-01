/**
 * Чертежи задач тренажёра №18, тема «Площади».
 * Тексты — content/zadanie18/trenazher/ploshchadi.ts.
 */

import { mnog, otr, tch, ug } from '@/lib/skhemy/dsl';
import { chisloTeX, dist, foot, mid, treugolnikPoUglam } from '@/lib/skhemy/geometriya';
import { bisectorFoot } from '@/lib/planimetriya/geom';
import type { Element, T2, Tochki } from '@/lib/skhemy/tipy';
import {
  delit,
  goditsyaTreugolnik,
  naOsnovanie,
  poDvumStoronam,
  scena,
  signedS,
  vPromezhutke,
} from './obshchee';

const S = (pts: readonly T2[]) => Math.abs(signedS(pts));

/* ── 21. Общая высота: чевиана и медиана ─────────────────────────── */

export function tochkiObshchVysoty(t: Tochki) {
  const A = t.A!;
  const B = t.B!;
  const C = t.C!;
  const M = delit(B, C, 2, 3);
  return { A, B, C, M, N: mid(A, M), H: foot(A, B, C) };
}

export const PL_OBSHCHAYA_VYSOTA = scena({
  id: 'pl-obshchaya-vysota',
  /* S(ABC) = 40: BC = 10, высота 8. */
  nachalo: { A: [3, 8], B: [0, 0], C: [10, 0] },
  goditsya: (t) => goditsyaTreugolnik(t.A!, t.B!, t.C!, 25, 2),
  sluchaynaya: (rnd) => {
    const { A, B, C } = treugolnikPoUglam(vPromezhutke(rnd, 40, 80), vPromezhutke(rnd, 40, 80), 10);
    return naOsnovanie<'A' | 'B' | 'C'>({ A: B, B: A, C }, 'B', 'C');
  },
  postroit(t) {
    const { A, B, C, M, N, H } = tochkiObshchVysoty(t);
    const el: Element[] = [
      mnog('f-abm', [A, B, M], { gruppy: ['h'], cvet: 'a' }),
      mnog('f-amc', [A, M, C], { gruppy: ['h'], cvet: 'b' }),
      mnog('f-abn', [A, B, N], { gruppy: ['n'], cvet: 'b' }),
      otr('AB', A, B),
      otr('BC', B, C),
      otr('CA', C, A),
      otr('AM', A, M, { shag: 1 }),
      otr('BN', B, N, { shag: 2, gruppy: ['n'], cvet: 'b' }),
      otr('AN-r', A, N, { skrytyy: true, shtrihi: 1, gruppy: ['n'], cvet: 'c' }),
      otr('NM-r', N, M, { skrytyy: true, shtrihi: 1, gruppy: ['n'], cvet: 'c' }),
      otr('AH', A, H, { skrytyy: true, stil: 'punktir', gruppy: ['h'], cvet: 'c' }),
      ug('pH', A, H, C, { skrytyy: true, pryamoy: true, gruppy: ['h'], cvet: 'c' }),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('M', M, { shag: 1 }),
      tch('N', N, { shag: 2 }),
      tch('H', H, { skrytyy: true, gruppy: ['h'], cvet: 'c' }),
    ];
    return {
      elementy: el,
      zametka: null,
      znacheniya: [`$S_{ABM} : S_{AMC} = ${chisloTeX(S([A, B, M]) / S([A, M, C]))}$`],
    };
  },
  shagi: ['Треугольник $ABC$', 'Отрезок $AM$', 'Середина $N$ отрезка $AM$ и отрезок $BN$'],
});

/* ── 22. Общий угол ──────────────────────────────────────────────── */

export function tochkiObshchUgla(t: Tochki) {
  const A = t.A!;
  const B = t.B!;
  const C = t.C!;
  return { A, B, C, K: delit(A, B, 1, 2), L: delit(A, C, 3, 1) };
}

export const PL_OBSHCHIY_UGOL = scena({
  id: 'pl-obshchiy-ugol',
  /* AB = 9, AC = 8, ∠A = 30°. */
  nachalo: poDvumStoronam(9, 8, 30),
  goditsya: (t) => goditsyaTreugolnik(t.A!, t.B!, t.C!, 20, 2),
  sluchaynaya: (rnd) =>
    poDvumStoronam(vPromezhutke(rnd, 7, 11), vPromezhutke(rnd, 6, 10), vPromezhutke(rnd, 30, 100)),
  postroit(t) {
    const { A, B, C, K, L } = tochkiObshchUgla(t);
    const el: Element[] = [
      mnog('f-akl', [A, K, L], { gruppy: ['ugol', 'pl'], cvet: 'b' }),
      mnog('f-kbcl', [K, B, C, L], { gruppy: ['pl'], cvet: 'a' }),
      otr('AB', A, B, { gruppy: ['ugol'], cvet: 'a' }),
      otr('BC', B, C),
      otr('CA', C, A, { gruppy: ['ugol'], cvet: 'a' }),
      otr('KL', K, L, { shag: 1 }),
      ug('uA', B, A, C, { gruppy: ['ugol'], cvet: 'c' }),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('K', K, { shag: 1 }),
      tch('L', L, { shag: 1 }),
    ];
    return {
      elementy: el,
      zametka: null,
      znacheniya: [`$S_{AKL} : S_{ABC} = ${chisloTeX(S([A, K, L]) / S([A, B, C]))}$`],
    };
  },
  shagi: ['Треугольник $ABC$', 'Точки $K$, $L$ и отрезок $KL$'],
});

/* ── 23. Трапеция и середина боковой стороны ─────────────────────── */

export function tochkiSerediny(t: Tochki) {
  const A = t.A!;
  const B = t.B!;
  const C = t.C!;
  const D = t.D!;
  const M = mid(C, D);
  return { A, B, C, D, M, H: foot(M, A, B) };
}

export const PL_RELSY = scena({
  id: 'pl-relsy',
  /* AD = 10, BC = 6, высота 8, AB = 10. */
  nachalo: { A: [0, 0], B: [6, 8], C: [12, 8], D: [10, 0] },
  goditsya: (t) => t.B![1] > 2 && dist(t.B!, t.C!) > 1.5 && dist(t.A!, t.D!) > 2,
  sluchaynaya: (rnd) => {
    const ad = vPromezhutke(rnd, 8, 12);
    const bc = vPromezhutke(rnd, 3, 9);
    const x = vPromezhutke(rnd, -2, 5);
    const h = vPromezhutke(rnd, 4, 8);
    return { A: [0, 0], B: [x, h], C: [x + bc, h], D: [ad, 0] };
  },
  postroit(t) {
    const { A, B, C, D, M, H } = tochkiSerediny(t);
    const el: Element[] = [
      mnog('f-bcm', [B, C, M], { gruppy: ['ostatok'], cvet: 'a' }),
      mnog('f-amd', [A, M, D], { gruppy: ['ostatok'], cvet: 'b' }),
      mnog('f-abm', [A, B, M], { gruppy: ['abm', 'd'], cvet: 'c' }),
      otr('AB', A, B, { gruppy: ['d'], cvet: 'c' }),
      otr('BC', B, C),
      otr('CD', C, D),
      otr('DA', D, A),
      otr('AM', A, M, { shag: 1 }),
      otr('BM', B, M, { shag: 1 }),
      otr('CM-r', C, M, { skrytyy: true, shtrihi: 1, gruppy: ['ostatok'], cvet: 'c' }),
      otr('MD-r', M, D, { skrytyy: true, shtrihi: 1, gruppy: ['ostatok'], cvet: 'c' }),
      otr('MH', M, H, { skrytyy: true, stil: 'punktir', gruppy: ['d'], cvet: 'b' }),
      ug('pH', M, H, A, { skrytyy: true, pryamoy: true, gruppy: ['d'], cvet: 'b' }),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('D', D),
      tch('M', M, { shag: 1 }),
      tch('H', H, { skrytyy: true, gruppy: ['d'], cvet: 'b' }),
    ];
    return {
      elementy: el,
      zametka: null,
      znacheniya: [`$S_{ABM} : S_{ABCD} = ${chisloTeX(S([A, B, M]) / S([A, B, C, D]))}$`],
    };
  },
  shagi: ['Трапеция $ABCD$', 'Середина $M$ стороны $CD$, отрезки $AM$ и $BM$'],
});

/* ── 24. Биссектриса через площади ───────────────────────────────── */

export function tochkiBissektrisy(t: Tochki) {
  const A = t.A!;
  const B = t.B!;
  const C = t.C!;
  return { A, B, C, L: bisectorFoot(A, B, C) };
}

export const PL_BISSEKTRISA = scena({
  id: 'pl-bissektrisa',
  /* AB = 3, AC = 6, ∠A = 120°. */
  nachalo: poDvumStoronam(3, 6, 120),
  goditsya: (t) => goditsyaTreugolnik(t.A!, t.B!, t.C!, 15, 1.5),
  sluchaynaya: (rnd) =>
    poDvumStoronam(vPromezhutke(rnd, 3, 8), vPromezhutke(rnd, 4, 9), vPromezhutke(rnd, 40, 130)),
  postroit(t) {
    const { A, B, C, L } = tochkiBissektrisy(t);
    const el: Element[] = [
      mnog('f-abl', [A, B, L], { gruppy: ['pl'], cvet: 'a' }),
      mnog('f-alc', [A, L, C], { gruppy: ['pl'], cvet: 'b' }),
      otr('AB', A, B),
      otr('BC', B, C),
      otr('CA', C, A),
      otr('AL', A, L, { shag: 1, gruppy: ['otv'], cvet: 'b' }),
      ug('u1', B, A, L, { shag: 1, gruppy: ['pl', 'otv'], cvet: 'c' }),
      ug('u2', L, A, C, { shag: 1, gruppy: ['pl', 'otv'], cvet: 'c' }),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('L', L, { shag: 1 }),
    ];
    return {
      elementy: el,
      zametka: null,
      znacheniya: [`$AL = ${chisloTeX(dist(A, L))}$`],
    };
  },
  shagi: ['Треугольник $ABC$', 'Биссектриса $AL$'],
});
