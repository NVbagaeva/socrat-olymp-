/**
 * Схема 2. Биссектриса: отношение сторон и равнобедренный треугольник.
 *
 * В треугольнике ABC проведена биссектриса AL. Построения при
 * подсветке: прямая через C параллельно AL до пересечения с прямой AB
 * в точке D; прямая через L параллельно AB до пересечения с AC в
 * точке N; вторая точка W пересечения прямой AL с описанной
 * окружностью. Тянутся вершины A, B, C.
 */

import { mnog, okr, otr, tch, ug } from '@/lib/skhemy/dsl';
import {
  add,
  chisloTeX,
  circumcircle,
  dist,
  intersect,
  lineCircle,
  sub,
  treugolnikPoUglam,
  uglyTreugolnika,
  unit,
} from '@/lib/skhemy/geometriya';
import type { Element, Kadr, T2, Tochki, ZhivayaSkhema } from '@/lib/skhemy/tipy';

const MIN_UGOL = 15;
const MIN_STORONA = 1.2;
const POLE = [-5, -4.5, 12, 10] as const;

export interface TochkiBissektrisy {
  A: T2;
  B: T2;
  C: T2;
  L: T2;
  D: T2;
  N: T2;
  W: T2;
  O: T2;
  R: number;
}

/** Все точки схемы по вершинам; их же берёт scripts/verify_schemes/bissektrisa.mjs. */
export function tochkiBissektrisy(t: Tochki): TochkiBissektrisy {
  const A = t.A!;
  const B = t.B!;
  const C = t.C!;
  /* Основание биссектрисы делит BC в отношении AB : AC — но строим
     как пересечение BC с биссектрисой угла, а не по формуле: формулу
     проверяет тест. */
  const napr = add(unit(sub(B, A)), unit(sub(C, A)));
  const L = intersect(A, add(A, napr), B, C) ?? A;
  /* D: прямая через C параллельно AL, пересечение с прямой AB. */
  const D = intersect(C, add(C, sub(L, A)), A, B) ?? A;
  /* N: прямая через L параллельно AB, пересечение с AC. */
  const N = intersect(L, add(L, sub(B, A)), A, C) ?? A;
  const O = circumcircle(A, B, C);
  const per = lineCircle(A, L, O);
  const W = per.length === 2 ? per[1]!.p : L;
  return { A, B, C, L, D, N, W, O: O.c, R: O.r };
}

function postroit(t: Tochki): Kadr {
  const { A, B, C, L, D, N, W, O, R } = tochkiBissektrisy(t);

  const el: Element[] = [
    /* Заливки: подобные треугольники для длины биссектрисы. */
    mnog('f-abl', [A, B, L], { gruppy: ['dlina'], cvet: 'a' }),
    mnog('f-awc', [A, W, C], { gruppy: ['dlina'], cvet: 'b' }),
    mnog('f-acd', [A, C, D], { gruppy: ['paral-c'], cvet: 'b' }),
    mnog('f-anl', [A, N, L], { gruppy: ['paral-l'], cvet: 'b' }),

    okr('o', O, R, { stil: 'punktir', skrytyy: true, gruppy: ['dlina'], cvet: 'a' }),

    /* Шаг 0: треугольник. */
    otr('AB', A, B, { gruppy: ['otnoshenie'], cvet: 'a' }),
    otr('BC', B, C),
    otr('CA', C, A, { gruppy: ['otnoshenie'], cvet: 'b' }),

    /* Части стороны BC — при подсветке отношения. */
    otr('BL', B, L, { skrytyy: true, gruppy: ['otnoshenie'], cvet: 'a' }),
    otr('LC', L, C, { skrytyy: true, gruppy: ['otnoshenie'], cvet: 'b' }),

    /* Шаг 1: биссектриса. */
    otr('AL', A, L, { shag: 1, gruppy: ['dlina'], cvet: 'c' }),
    ug('u1', B, A, L, {
      shag: 1,
      gruppy: ['otnoshenie', 'paral-c', 'paral-l', 'dlina'],
      cvet: 'c',
    }),
    ug('u2', L, A, C, {
      shag: 1,
      gruppy: ['otnoshenie', 'paral-c', 'paral-l', 'dlina'],
      cvet: 'c',
    }),

    /* Параллельная через C и равнобедренный ACD. */
    otr('AD', A, D, {
      skrytyy: true,
      stil: 'prodolzhenie',
      gruppy: ['paral-c'],
      cvet: 'b',
      shtrihi: 1,
    }),
    otr('CD', C, D, { skrytyy: true, stil: 'punktir', gruppy: ['paral-c'], cvet: 'b' }),
    otr('AC1', A, C, { skrytyy: true, gruppy: ['paral-c'], cvet: 'b', shtrihi: 1 }),
    ug('uD', A, D, C, { skrytyy: true, gruppy: ['paral-c'], cvet: 'c' }),
    ug('uC', A, C, D, { skrytyy: true, gruppy: ['paral-c'], cvet: 'c' }),

    /* Параллельная через L и равнобедренный ANL. */
    otr('LN', L, N, { skrytyy: true, stil: 'punktir', gruppy: ['paral-l'], cvet: 'b', shtrihi: 2 }),
    otr('AN', A, N, { skrytyy: true, gruppy: ['paral-l'], cvet: 'b', shtrihi: 2 }),
    ug('uL', N, L, A, { skrytyy: true, gruppy: ['paral-l'], cvet: 'c' }),

    /* Длина биссектрисы: W на описанной окружности. */
    otr('LW', L, W, { skrytyy: true, stil: 'punktir', gruppy: ['dlina'], cvet: 'c' }),
    otr('WC', W, C, { skrytyy: true, gruppy: ['dlina'], cvet: 'b' }),
    ug('uB', A, B, L, { skrytyy: true, gruppy: ['dlina'], cvet: 'a', dugi: 2 }),
    ug('uW', A, W, C, { skrytyy: true, gruppy: ['dlina'], cvet: 'a', dugi: 2 }),

    tch('A', A),
    tch('B', B, { gruppy: ['otnoshenie'], cvet: 'a' }),
    tch('C', C, { gruppy: ['otnoshenie'], cvet: 'b' }),
    tch('L', L, { shag: 1, gruppy: ['otnoshenie'], cvet: 'c' }),
    tch('D', D, { skrytyy: true, gruppy: ['paral-c'], cvet: 'b' }),
    tch('N', N, { skrytyy: true, gruppy: ['paral-l'], cvet: 'b' }),
    tch('W', W, { skrytyy: true, gruppy: ['dlina'], cvet: 'b' }),
  ];

  const ab = dist(A, B);
  const ac = dist(A, C);
  const bl = dist(B, L);
  const lc = dist(L, C);
  return {
    elementy: el,
    zametka: null,
    znacheniya: [
      `$AB : AC = ${chisloTeX(ab / ac)}$`,
      `$BL : LC = ${chisloTeX(bl / lc)}$`,
      `$AL^2 = ${chisloTeX(dist(A, L) ** 2, 1)}$`,
      `$AB\\cdot AC - BL\\cdot LC = ${chisloTeX(ab * ac - bl * lc, 1)}$`,
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
    const uA = 40 + rnd() * 70;
    const uC = 25 + rnd() * (180 - uA - 50);
    if (180 - uA - uC < 25) continue;
    return treugolnikPoUglam(uA, uC, 6);
  }
  return NACHALO;
}

const NACHALO: Tochki = { A: [0, 0], B: [1.6, 4.6], C: [7, 0] };

export const BISSEKTRISA: ZhivayaSkhema = {
  id: 'bissektrisa',
  nachalo: NACHALO,
  podvizhnye: ['A', 'B', 'C'],
  pole: POLE,
  postroit,
  ogranichit,
  sluchaynaya,
  shagi: ['Треугольник $ABC$', 'Биссектриса $AL$ делит угол $A$ пополам'],
};
