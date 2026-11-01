/**
 * Чертежи задач тренажёра №18, тема «Треугольник». Группы подсветки —
 * те же, что у шагов решения в content/zadanie18/trenazher/treugolnik.ts.
 * Функции точек берёт и проверка scripts/verify_trenazher18.
 */

import { mnog, okr, otr, tch, ug } from '@/lib/skhemy/dsl';
import {
  add,
  chisloTeX,
  dist,
  foot,
  intersect,
  mid,
  naDiametre,
  polar,
  sub,
  treugolnikPoUglam,
  uglyTreugolnika,
} from '@/lib/skhemy/geometriya';
import { bisectorFoot } from '@/lib/planimetriya/geom';
import type { Element, T2, Tochki } from '@/lib/skhemy/tipy';
import { goditsyaTreugolnik, naOsnovanie, poStoronam, scena, vPromezhutke } from './obshchee';

/* ── 1. Середины сторон: параллелограмм ───────────────────────────── */

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
  goditsya: (t) => goditsyaTreugolnik(t.A!, t.B!, t.C!, 20, 2),
  sluchaynaya: (rnd) =>
    naOsnovanie(
      treugolnikPoUglam(vPromezhutke(rnd, 30, 95), vPromezhutke(rnd, 30, 80), 14),
      'A',
      'C',
    ),
  postroit(t) {
    const { A, B, C, M, N, K } = tochkiSredlin(t);
    const el: Element[] = [
      mnog('f-amnk', [A, M, N, K], { gruppy: ['par', 'per'], cvet: 'b' }),
      otr('AB', A, B, { gruppy: ['nk'], cvet: 'a' }),
      otr('BC', B, C),
      otr('CA', C, A, { gruppy: ['mn'], cvet: 'a' }),
      otr('MN', M, N, { shag: 1, gruppy: ['mn', 'par', 'per'], cvet: 'b' }),
      otr('NK', N, K, { shag: 1, gruppy: ['nk', 'par', 'per'], cvet: 'b' }),
      otr('AM-r', A, M, { skrytyy: true, shtrihi: 1, gruppy: ['per'], cvet: 'c' }),
      otr('AK-r', A, K, { skrytyy: true, shtrihi: 2, gruppy: ['per'], cvet: 'c' }),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('M', M, { shag: 1 }),
      tch('N', N, { shag: 1 }),
      tch('K', K, { shag: 1 }),
    ];
    return {
      elementy: el,
      zametka: null,
      znacheniya: [
        `$MN : AK = ${chisloTeX(dist(M, N) / dist(A, K))}$`,
        `$NK : AM = ${chisloTeX(dist(N, K) / dist(A, M))}$`,
      ],
    };
  },
  shagi: ['Треугольник $ABC$', 'Середины сторон $M$, $N$, $K$ и отрезки $MN$, $NK$'],
});

/* ── 2. Две высоты: угол и отрезок между основаниями ──────────────── */

export function tochkiVysot(t: Tochki) {
  const A = t.A!;
  const B = t.B!;
  const C = t.C!;
  return { A, B, C, A1: foot(A, B, C), B1: foot(B, A, C), AB: naDiametre(A, B) };
}

/* AB = 12, ∠A = 70°, ∠B = 65°, значит ∠C = 45°. */
function vysotyNachalo(): Tochki {
  const A: T2 = [0, 0];
  const B: T2 = [12, 0];
  const C = intersect(A, polar(70), B, add(B, polar(115))) ?? [6, 10];
  return { A, B, C };
}

export const TR_VYSOTY = scena({
  id: 'tr-vysoty',
  nachalo: vysotyNachalo(),
  goditsya: (t) =>
    goditsyaTreugolnik(t.A!, t.B!, t.C!, 25, 2) &&
    Math.max(...uglyTreugolnika(t.A!, t.B!, t.C!)) < 85,
  sluchaynaya: (rnd) => {
    const uA = vPromezhutke(rnd, 40, 82);
    const uB = vPromezhutke(rnd, 40, 82);
    const A: T2 = [0, 0];
    const B: T2 = [12, 0];
    const C = intersect(A, polar(uA), B, add(B, polar(180 - uB))) ?? [6, 10];
    return { A, B, C };
  },
  postroit(t) {
    const { A, B, C, A1, B1, AB } = tochkiVysot(t);
    const el: Element[] = [
      mnog('f-abc', [A, B, C], { gruppy: ['pod'], cvet: 'a' }),
      mnog('f-a1b1c', [A1, B1, C], { gruppy: ['pod', 'otv'], cvet: 'b' }),
      okr('o-ab', AB.c, AB.r, { stil: 'punktir', skrytyy: true, gruppy: ['okr'], cvet: 'b' }),
      otr('AB', A, B, { gruppy: ['okr', 'otv'], cvet: 'a' }),
      otr('BC', B, C),
      otr('CA', C, A),
      otr('AA1', A, A1, { shag: 1 }),
      otr('BB1', B, B1, { shag: 1 }),
      ug('pA1', A, A1, B, { pryamoy: true, shag: 1, gruppy: ['okr'], cvet: 'b' }),
      ug('pB1', B, B1, A, { pryamoy: true, shag: 1, gruppy: ['okr'], cvet: 'b' }),
      otr('A1B1', A1, B1, { shag: 2, gruppy: ['ugly', 'pod', 'otv'], cvet: 'b' }),
      ug('uAA1B1', A, A1, B1, { skrytyy: true, gruppy: ['ugly'], cvet: 'c' }),
      ug('uABB1', A, B, B1, { skrytyy: true, gruppy: ['ugly'], cvet: 'c' }),
      ug('uC', A1, C, B1, { skrytyy: true, gruppy: ['pod', 'otv'], cvet: 'a', dugi: 2 }),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('A_1', A1, { shag: 1 }),
      tch('B_1', B1, { shag: 1 }),
    ];
    const uC = uglyTreugolnika(A, B, C)[2];
    return {
      elementy: el,
      zametka: null,
      znacheniya: [
        `$\\angle C = ${Math.round(uC)}^\\circ$`,
        `$A_1B_1 : AB = ${chisloTeX(dist(A1, B1) / dist(A, B))}$`,
      ],
    };
  },
  shagi: ['Треугольник $ABC$', 'Высоты $AA_1$ и $BB_1$', 'Отрезок $A_1B_1$'],
});

/* ── 3. Центр вписанной окружности делит биссектрису ──────────────── */

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
  goditsya: (t) => goditsyaTreugolnik(t.A!, t.B!, t.C!, 20, 2),
  sluchaynaya: (rnd) => {
    const { A, B, C } = treugolnikPoUglam(
      vPromezhutke(rnd, 35, 100),
      vPromezhutke(rnd, 30, 70),
      10,
    );
    /* Сторона BC — внизу, как в исходном положении. */
    return naOsnovanie<'A' | 'B' | 'C'>({ A: B, B: A, C }, 'B', 'C');
  },
  postroit(t) {
    const { A, B, C, A1, B1, I } = tochkiIncentra(t);
    const el: Element[] = [
      mnog('f-aba1', [A, B, A1], { gruppy: ['bisB'], cvet: 'a' }),
      otr('AB', A, B, { gruppy: ['bisA', 'bisB'], cvet: 'a' }),
      otr('BC', B, C),
      otr('CA', C, A, { gruppy: ['bisA'], cvet: 'a' }),
      otr('AA1', A, A1, { shag: 1, gruppy: ['otv'], cvet: 'b' }),
      otr('BB1', B, B1, { shag: 1 }),
      otr('BA1', B, A1, { skrytyy: true, gruppy: ['bisA', 'bisB'], cvet: 'b' }),
      ug('uA1', B, A, A1, { shag: 1, gruppy: ['bisA'], cvet: 'c' }),
      ug('uA2', A1, A, C, { shag: 1, gruppy: ['bisA'], cvet: 'c' }),
      ug('uB1', A, B, B1, { shag: 1, gruppy: ['bisB'], cvet: 'c', dugi: 2 }),
      ug('uB2', B1, B, C, { shag: 1, gruppy: ['bisB'], cvet: 'c', dugi: 2 }),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('A_1', A1, { shag: 1 }),
      tch('B_1', B1, { shag: 1 }),
      tch('I', I, { shag: 1, gruppy: ['otv'], cvet: 'b' }),
    ];
    return {
      elementy: el,
      zametka: null,
      znacheniya: [
        `$AI : IA_1 = ${chisloTeX(dist(A, I) / dist(I, A1))}$`,
        `$(AB + AC) : BC = ${chisloTeX((dist(A, B) + dist(A, C)) / dist(B, C))}$`,
      ],
    };
  },
  shagi: ['Треугольник $ABC$', 'Биссектрисы $AA_1$ и $BB_1$, точка $I$'],
});

/* ── 4. Медиана и формула Герона ─────────────────────────────────── */

export function tochkiMediany(t: Tochki) {
  const A = t.A!;
  const B = t.B!;
  const C = t.C!;
  const M = mid(B, C);
  const D: T2 = sub(add(M, M), A);
  return { A, B, C, M, D };
}

export const TR_MEDIANA = scena({
  id: 'tr-mediana',
  /* AB = 7, AC = 9, BC = 8 — тогда AM = 7. */
  nachalo: poStoronam(8, 9, 7),
  goditsya: (t) => goditsyaTreugolnik(t.A!, t.B!, t.C!, 20, 2),
  sluchaynaya: (rnd) => {
    const { A, B, C } = treugolnikPoUglam(vPromezhutke(rnd, 35, 85), vPromezhutke(rnd, 35, 85), 8);
    return naOsnovanie<'A' | 'B' | 'C'>({ A: B, B: A, C }, 'B', 'C');
  },
  postroit(t) {
    const { A, B, C, M, D } = tochkiMediany(t);
    const el: Element[] = [
      mnog('f-abdc', [A, B, D, C], { gruppy: ['par'], cvet: 'a' }),
      mnog('f-abc', [A, B, C], { gruppy: ['geron'], cvet: 'b' }),
      otr('AB', A, B, { gruppy: ['par'], cvet: 'a' }),
      otr('BC', B, C, { gruppy: ['diag'], cvet: 'b' }),
      otr('CA', C, A, { gruppy: ['par'], cvet: 'a' }),
      otr('AM', A, M, { shag: 1, shtrihi: 2, gruppy: ['diag'], cvet: 'b' }),
      otr('MD', M, D, { shag: 2, stil: 'punktir', shtrihi: 2, gruppy: ['diag'], cvet: 'b' }),
      otr('BD', B, D, { shag: 2, stil: 'punktir', gruppy: ['par'], cvet: 'a' }),
      otr('CD', C, D, { shag: 2, stil: 'punktir', gruppy: ['par'], cvet: 'a' }),
      otr('BM-r', B, M, { skrytyy: true, shtrihi: 1, gruppy: ['diag'], cvet: 'c' }),
      otr('MC-r', M, C, { skrytyy: true, shtrihi: 1, gruppy: ['diag'], cvet: 'c' }),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('M', M, { shag: 1 }),
      tch('D', D, { shag: 2 }),
    ];
    const lev = dist(A, B) ** 2 + dist(A, C) ** 2;
    const prav = 2 * dist(A, M) ** 2 + dist(B, C) ** 2 / 2;
    return {
      elementy: el,
      zametka: null,
      znacheniya: [
        `$AB^2 + AC^2 = ${chisloTeX(lev, 1)}$`,
        `$2AM^2 + \\tfrac12 BC^2 = ${chisloTeX(prav, 1)}$`,
      ],
    };
  },
  shagi: [
    'Треугольник $ABC$',
    'Медиана $AM$',
    'Продолжение медианы: $MD = AM$, параллелограмм $ABDC$',
  ],
});
