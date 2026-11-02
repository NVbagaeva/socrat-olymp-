/**
 * Чертежи перенесённых задач тренажёра №18, тема «Треугольник».
 * Тексты — content/zadanie18/trenazherDop/treugolnik.ts; функции точек берёт
 * и проверка scripts/verify_schemes/trenazherDop.
 */

import { bisectorFoot } from '@/lib/planimetriya/geom';
import { mnog, otr, tch, ug, velOtr } from '@/lib/skhemy/dsl';
import { intersect, mid } from '@/lib/skhemy/geometriya';
import type { Element, Tochki } from '@/lib/skhemy/tipy';
import { naOsnovanie, poStoronam, scena } from './obshchee';

/* ── tr-sredlin: Середины сторон: параллелограмм ───────────────────────────── */

export function tochkiSredlin(t: Tochki) {
  const A = t.A!;
  const B = t.B!;
  const C = t.C!;
  return { A, B, C, M: mid(A, B), N: mid(B, C), K: mid(A, C) };
}

export const TR_SREDLIN = scena({
  id: 'tr-sredlin',
  /* AB = 10, AC = 14, BC = 12. */
  nachalo: naOsnovanie(poStoronam(12, 14, 10), 'A', 'C'),
  postroit(t) {
    const { A, B, C, M, N, K } = tochkiSredlin(t);
    const el: Element[] = [
      mnog('t-fig', [A, B, C], { skrytyy: false, rol: 'figure' }),
      mnog('f-amnk', [A, M, N, K], { gruppy: ['par', 'per'], cvet: 'b' }),
      otr('AB', A, B, { rol: 'figure', gruppy: ['nk'], cvet: 'a' }),
      otr('BC', B, C, { rol: 'figure' }),
      otr('CA', C, A, { rol: 'figure', gruppy: ['mn'], cvet: 'a' }),
      otr('MN', M, N, { rol: 'aux', gruppy: ['mn', 'par', 'per'], cvet: 'b' }),
      otr('NK', N, K, { rol: 'aux', gruppy: ['nk', 'par', 'per'], cvet: 'b' }),
      otr('AM-r', A, M, { rol: 'aux', skrytyy: true, shtrihi: 1, gruppy: ['per'], cvet: 'c' }),
      otr('AK-r', A, K, { rol: 'aux', skrytyy: true, shtrihi: 2, gruppy: ['per'], cvet: 'c' }),
      /* Данные условия на чертеже. */
      velOtr('d-AB', '10', A, B),
      velOtr('d-AC', '14', A, C),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('M', M),
      tch('N', N),
      tch('K', K),
    ];
    return el;
  },
});

/* ── tr-incentr: Центр вписанной окружности делит биссектрису ──────────────── */

export function tochkiIncentra(t: Tochki) {
  const A = t.A!;
  const B = t.B!;
  const C = t.C!;
  const A1 = bisectorFoot(A, B, C);
  const B1 = bisectorFoot(B, A, C);
  const I = intersect(A, A1, B, B1) ?? mid(A, A1);
  return { A, B, C, A1, B1, I };
}

export const TR_INCENTR = scena({
  id: 'tr-incentr',
  /* AB = 6, AC = 9, BC = 10. */
  nachalo: poStoronam(10, 9, 6),
  postroit(t) {
    const { A, B, C, A1, B1, I } = tochkiIncentra(t);
    const el: Element[] = [
      mnog('t-fig', [A, B, C], { skrytyy: false, rol: 'figure' }),
      mnog('f-aba1', [A, B, A1], { gruppy: ['bisB'], cvet: 'a' }),
      otr('AB', A, B, { rol: 'figure', gruppy: ['bisA', 'bisB'], cvet: 'a' }),
      otr('BC', B, C, { rol: 'figure' }),
      otr('CA', C, A, { rol: 'figure', gruppy: ['bisA'], cvet: 'a' }),
      otr('AA1', A, A1, { rol: 'aux', gruppy: ['otv'], cvet: 'b' }),
      otr('BB1', B, B1, { rol: 'aux' }),
      otr('BA1', B, A1, { rol: 'aux', skrytyy: true, gruppy: ['bisA', 'bisB'], cvet: 'b' }),
      ug('uA1', B, A, A1, { gruppy: ['bisA'], cvet: 'c' }),
      ug('uA2', A1, A, C, { gruppy: ['bisA'], cvet: 'c' }),
      ug('uB1', A, B, B1, { gruppy: ['bisB'], cvet: 'c', dugi: 2 }),
      ug('uB2', B1, B, C, { gruppy: ['bisB'], cvet: 'c', dugi: 2 }),
      /* Данные условия на чертеже. */
      velOtr('d-AB', '6', A, B),
      velOtr('d-AC', '9', A, C),
      velOtr('d-BC', '10', B, C),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('A_1', A1),
      tch('B_1', B1),
      tch('I', I, { gruppy: ['otv'], cvet: 'b' }),
    ];
    return el;
  },
});
