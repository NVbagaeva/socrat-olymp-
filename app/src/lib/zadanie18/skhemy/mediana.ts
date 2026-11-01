/**
 * Схема 3. Удвоение медианы.
 *
 * В треугольнике ABC проведена медиана BM; на её продолжении за точку M
 * отложен отрезок MD = BM. Получается параллелограмм ABCD. Тянутся
 * вершины A, B, C.
 */

import { mnog, otr, tch, ug } from '@/lib/skhemy/dsl';
import { chisloTeX, dist, mid, treugolnikPoUglam, uglyTreugolnika } from '@/lib/skhemy/geometriya';
import type { Element, Kadr, T2, Tochki, ZhivayaSkhema } from '@/lib/skhemy/tipy';

const MIN_UGOL = 15;
const MIN_STORONA = 1.2;
const POLE = [-5, -6, 12, 9] as const;

export interface TochkiMediany {
  A: T2;
  B: T2;
  C: T2;
  M: T2;
  D: T2;
}

export function tochkiMediany(t: Tochki): TochkiMediany {
  const A = t.A!;
  const B = t.B!;
  const C = t.C!;
  const M = mid(A, C);
  const D: T2 = [2 * M[0] - B[0], 2 * M[1] - B[1]];
  return { A, B, C, M, D };
}

function postroit(t: Tochki): Kadr {
  const { A, B, C, M, D } = tochkiMediany(t);

  const el: Element[] = [
    mnog('f-abcd', [A, B, C, D], { gruppy: ['parall'], cvet: 'a' }),
    mnog('f-amd', [A, M, D], { gruppy: ['ravnye'], cvet: 'a' }),
    mnog('f-cmb', [C, M, B], { gruppy: ['ravnye'], cvet: 'b' }),
    mnog('f-abd', [A, B, D], { gruppy: ['abd'], cvet: 'b' }),

    /* Шаг 0: треугольник. */
    otr('AB', A, B, {
      gruppy: ['parall', 'formula', 'abd'],
      cvet: { parall: 'a', formula: 'b', abd: 'b' },
    }),
    otr('BC', B, C, {
      gruppy: ['parall', 'ravnye', 'formula'],
      cvet: { parall: 'a', ravnye: 'b', formula: 'b' },
    }),
    otr('AM', A, M, { shtrihi: 1, gruppy: ['formula'], cvet: 'a' }),
    otr('MC', M, C, { shtrihi: 1, gruppy: ['formula'], cvet: 'a' }),

    /* Шаг 1: медиана. */
    otr('BM', B, M, {
      shag: 1,
      shtrihi: 2,
      gruppy: ['formula', 'abd'],
      cvet: { formula: 'a', abd: 'b' },
    }),

    /* Шаг 2: удвоение. */
    otr('MD', M, D, {
      shag: 2,
      stil: 'punktir',
      shtrihi: 2,
      gruppy: ['formula', 'abd'],
      cvet: { formula: 'a', abd: 'b' },
    }),

    /* Шаг 3: стороны параллелограмма. */
    otr('AD', A, D, {
      shag: 3,
      stil: 'punktir',
      gruppy: ['parall', 'ravnye', 'formula', 'abd'],
      cvet: { parall: 'a', ravnye: 'a', formula: 'b', abd: 'b' },
    }),
    otr('CD', C, D, {
      shag: 3,
      stil: 'punktir',
      gruppy: ['parall', 'formula'],
      cvet: { parall: 'a', formula: 'b' },
    }),

    /* Углы. */
    ug('uAMD', A, M, D, { skrytyy: true, gruppy: ['ravnye'], cvet: 'c' }),
    ug('uCMB', C, M, B, { skrytyy: true, gruppy: ['ravnye'], cvet: 'c' }),
    ug('uMDA', M, D, A, { skrytyy: true, gruppy: ['ravnye', 'abd'], cvet: 'b', dugi: 2 }),
    ug('uMBC', M, B, C, { skrytyy: true, gruppy: ['ravnye', 'abd'], cvet: 'b', dugi: 2 }),
    ug('uABM', A, B, M, { skrytyy: true, gruppy: ['abd'], cvet: 'a' }),

    tch('A', A),
    tch('B', B),
    tch('C', C),
    tch('M', M, { shag: 1 }),
    tch('D', D, { shag: 2, gruppy: ['parall', 'abd'], cvet: 'b' }),
  ];

  const ab = dist(A, B);
  const bc = dist(B, C);
  const ac = dist(A, C);
  const bm = dist(B, M);
  return {
    elementy: el,
    zametka: null,
    znacheniya: [
      `$4BM^2 = ${chisloTeX(4 * bm * bm, 1)}$`,
      `$2AB^2 + 2BC^2 - AC^2 = ${chisloTeX(2 * ab * ab + 2 * bc * bc - ac * ac, 1)}$`,
      `$BM = ${chisloTeX(bm)}$`,
      `$\\tfrac{AB + BC}{2} = ${chisloTeX((ab + bc) / 2)}$`,
    ],
  };
}

function goditsya(t: Tochki): boolean {
  const A = t.A!;
  const B = t.B!;
  const C = t.C!;
  if (Math.min(dist(A, B), dist(B, C), dist(A, C)) < MIN_STORONA) return false;
  return Math.min(...uglyTreugolnika(A, B, C)) >= MIN_UGOL;
}

function ogranichit(imya: string, p: T2, t: Tochki): T2 | null {
  const q: T2 = [
    Math.max(POLE[0], Math.min(POLE[2], p[0])),
    Math.max(POLE[1], Math.min(POLE[3], p[1])),
  ];
  return goditsya({ ...t, [imya]: q }) ? q : null;
}

function sluchaynaya(rnd: () => number): Tochki {
  for (let i = 0; i < 200; i += 1) {
    const uA = 25 + rnd() * 80;
    const uC = 25 + rnd() * (180 - uA - 50);
    if (180 - uA - uC < 25) continue;
    return treugolnikPoUglam(uA, uC, 6);
  }
  return NACHALO;
}

const NACHALO: Tochki = { A: [0, 0], B: [2.2, 4.2], C: [6.4, 0] };

export const MEDIANA: ZhivayaSkhema = {
  id: 'udvoenie-mediany',
  nachalo: NACHALO,
  podvizhnye: ['A', 'B', 'C'],
  pole: POLE,
  postroit,
  ogranichit,
  sluchaynaya,
  shagi: [
    'Треугольник $ABC$',
    'Медиана $BM$: $AM = MC$',
    'Продлим медиану за $M$ на $MD = BM$',
    'Стороны $AD$ и $CD$ — получился параллелограмм $ABCD$',
  ],
};
