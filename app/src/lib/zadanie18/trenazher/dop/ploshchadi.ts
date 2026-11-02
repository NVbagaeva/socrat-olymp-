/**
 * Чертежи перенесённых задач тренажёра №18, тема «Площади».
 * Тексты — content/zadanie18/trenazherDop/ploshchadi.ts; функции точек берёт
 * и проверка scripts/verify_schemes/trenazherDop.
 */

import { bisectorFoot } from '@/lib/planimetriya/geom';
import { mnog, otr, tch, ug, vel, velOtr, velUg } from '@/lib/skhemy/dsl';
import { foot, mid } from '@/lib/skhemy/geometriya';
import type { Element, Tochki } from '@/lib/skhemy/tipy';
import { delit, poDvumStoronam, scena } from './obshchee';

/* ── pl-obshchaya-vysota: Общая высота: чевиана и медиана ─────────────────────────── */

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
  postroit(t) {
    const { A, B, C, M, N, H } = tochkiObshchVysoty(t);
    const el: Element[] = [
      mnog('f-abm', [A, B, M], { gruppy: ['h'], cvet: 'a' }),
      mnog('f-amc', [A, M, C], { gruppy: ['h'], cvet: 'b' }),
      mnog('f-abn', [A, B, N], { gruppy: ['n'], cvet: 'b' }),
      otr('AB', A, B),
      otr('BC', B, C),
      otr('CA', C, A),
      otr('AM', A, M),
      otr('BN', B, N, { gruppy: ['n'], cvet: 'b' }),
      otr('AN-r', A, N, { skrytyy: true, shtrihi: 1, gruppy: ['n'], cvet: 'c' }),
      otr('NM-r', N, M, { skrytyy: true, shtrihi: 1, gruppy: ['n'], cvet: 'c' }),
      otr('AH', A, H, { skrytyy: true, stil: 'punktir', gruppy: ['h'], cvet: 'c' }),
      ug('pH', A, H, C, { skrytyy: true, pryamoy: true, gruppy: ['h'], cvet: 'c' }),
      /* Данные условия на чертеже. */
      velOtr('d-BM', '2x', B, M),
      velOtr('d-MC', '3x', M, C),
      vel('d-S', 'S_ABC = 40', { vnutri: [(A[0] + B[0] + C[0]) / 3, (A[1] + B[1] + C[1]) / 3] }),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('M', M),
      tch('N', N),
      tch('H', H, { skrytyy: true, gruppy: ['h'], cvet: 'c' }),
    ];
    return el;
  },
});

/* ── pl-bissektrisa: Биссектриса через площади ───────────────────────────────── */

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
  postroit(t) {
    const { A, B, C, L } = tochkiBissektrisy(t);
    const el: Element[] = [
      mnog('f-abl', [A, B, L], { gruppy: ['pl'], cvet: 'a' }),
      mnog('f-alc', [A, L, C], { gruppy: ['pl'], cvet: 'b' }),
      otr('AB', A, B),
      otr('BC', B, C),
      otr('CA', C, A),
      otr('AL', A, L, { gruppy: ['otv'], cvet: 'b' }),
      ug('u1', B, A, L, { gruppy: ['pl', 'otv'], cvet: 'c' }),
      ug('u2', L, A, C, { gruppy: ['pl', 'otv'], cvet: 'c' }),
      /* Данные условия на чертеже. */
      velOtr('d-AB', '3', A, B),
      velOtr('d-AC', '6', A, C),
      velUg('d-A', '120°', B, A, C),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('L', L),
    ];
    return el;
  },
});
