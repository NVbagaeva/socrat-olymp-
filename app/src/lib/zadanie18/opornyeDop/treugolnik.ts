/**
 * Чертёж опорной задачи 7 №18 (тема «Треугольник»): удвоение медианы.
 * Группы подсветки — те же, что у шагов решения в
 * content/zadanie18/opornyeDop/treugolnik.ts. Функции точек берёт и
 * проверка scripts/verify_schemes/opornyeDop.
 */

import { mnog, otr, tch, ug } from '@/lib/skhemy/dsl';
import { mid } from '@/lib/skhemy/geometriya';
import type { Element, T2, Tochki } from '@/lib/skhemy/tipy';
import { naOsnovanie, scena } from './obshchee';

/* ── 7. Удвоение медианы ──────────────────────────────────────────── */

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
      otr('AM', A, M, { shtrihi: 2 }),
      otr('MD', M, D, {
        skrytyy: true,
        stil: 'punktir',
        shtrihi: 2,
        gruppy: ['udv', 'ner', 'geron', 'pl'],
      }),
      otr('BD', B, D, {
        skrytyy: true,
        stil: 'punktir',
        gruppy: ['udv', 'ner', 'geron', 'pl'],
        cvet: 'b',
      }),
      otr('AD', A, D, { skrytyy: true, gruppy: ['ner', 'geron'], cvet: 'a' }),
      ug('uAMC', A, M, C, { skrytyy: true, gruppy: ['udv'], cvet: 'c' }),
      ug('uDMB', D, M, B, { skrytyy: true, gruppy: ['udv'], cvet: 'c' }),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('M', M),
      tch('D', D, { skrytyy: true, gruppy: ['udv', 'ner', 'geron', 'pl'] }),
    ];
    return el;
  },
});
