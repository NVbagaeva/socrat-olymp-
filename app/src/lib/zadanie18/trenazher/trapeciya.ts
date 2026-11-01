/**
 * Чертежи задач тренажёра №18, тема «Трапеция». Трапеция ABCD с
 * основаниями AD (внизу) и BC. Тексты — content/zadanie18/trenazher/trapeciya.ts.
 */

import { mnog, otr, tch, ug } from '@/lib/skhemy/dsl';
import {
  add,
  angleAt,
  chisloTeX,
  dist,
  foot,
  intersect,
  mid,
  mul,
  polar,
  sub,
} from '@/lib/skhemy/geometriya';
import type { Element, T2, Tochki } from '@/lib/skhemy/tipy';
import { scena, vPromezhutke } from './obshchee';

/** Трапеция: A(0; 0), D(ad; 0), B(x; h), C(x + bc; h). */
function trapeciya(ad: number, bc: number, x: number, h: number): Tochki {
  return { A: [0, 0], D: [ad, 0], B: [x, h], C: [x + bc, h] };
}

/** Невырожденная трапеция: основания не короче 1,5, высота не меньше 2, углы при AD от 25° до 155°. */
function goditsyaTrap(t: Tochki): boolean {
  const A = t.A!;
  const B = t.B!;
  const C = t.C!;
  const D = t.D!;
  const h = B[1] - A[1];
  if (h < 2 || dist(B, C) < 1.5 || dist(A, D) < 1.5) return false;
  const uA = angleAt(B, A, D);
  const uD = angleAt(C, D, A);
  return uA > 25 && uA < 155 && uD > 25 && uD < 155;
}

/* ── 13. Средняя линия и диагонали ───────────────────────────────── */

export function tochkiSredlinTrap(t: Tochki) {
  const A = t.A!;
  const B = t.B!;
  const C = t.C!;
  const D = t.D!;
  return { A, B, C, D, M: mid(A, B), N: mid(C, D), P: mid(B, D), Q: mid(A, C) };
}

export const TP_SREDLIN = scena({
  id: 'tp-sredlin',
  /* AD = 11, BC = 5. */
  nachalo: trapeciya(11, 5, 2.5, 6),
  goditsya: goditsyaTrap,
  sluchaynaya: (rnd) => {
    const ad = vPromezhutke(rnd, 9, 13);
    const bc = vPromezhutke(rnd, 2.5, ad - 3);
    return trapeciya(ad, bc, vPromezhutke(rnd, -1.5, ad - bc + 1.5), vPromezhutke(rnd, 4, 7));
  },
  postroit(t) {
    const { A, B, C, D, M, N, P, Q } = tochkiSredlinTrap(t);
    const el: Element[] = [
      mnog('f-abd', [A, B, D], { gruppy: ['mp'], cvet: 'a' }),
      mnog('f-abc', [A, B, C], { gruppy: ['mq'], cvet: 'b' }),
      otr('AB', A, B),
      otr('BC', B, C, { gruppy: ['mq', 'pq'], cvet: 'b' }),
      otr('CD', C, D),
      otr('DA', D, A, { gruppy: ['mp', 'pq'], cvet: 'a' }),
      otr('AC', A, C, { shag: 1 }),
      otr('BD', B, D, { shag: 1 }),
      otr('MN', M, N, { shag: 2 }),
      otr('MP', M, P, { skrytyy: true, gruppy: ['mp'], cvet: 'a' }),
      otr('MQ', M, Q, { skrytyy: true, gruppy: ['mq'], cvet: 'b' }),
      otr('PQ', P, Q, { skrytyy: true, gruppy: ['pq'], cvet: 'c' }),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('D', D),
      tch('M', M, { shag: 2 }),
      tch('N', N, { shag: 2 }),
      tch('P', P, { shag: 2 }),
      tch('Q', Q, { shag: 2 }),
    ];
    return {
      elementy: el,
      zametka: null,
      znacheniya: [
        `$PQ = ${chisloTeX(dist(P, Q))}$`,
        `$\\tfrac12(AD - BC) = ${chisloTeX((dist(A, D) - dist(B, C)) / 2)}$`,
      ],
    };
  },
  shagi: ['Трапеция $ABCD$', 'Диагонали $AC$ и $BD$', 'Средняя линия $MN$, точки $P$ и $Q$'],
});

/* ── 14. Равнобедренная трапеция: проекция диагонали ─────────────── */

export function tochkiRavnobokoy(t: Tochki) {
  const A = t.A!;
  const B = t.B!;
  const C = t.C!;
  const D = t.D!;
  return { A, B, C, D, H: foot(C, A, D), G: foot(B, A, D) };
}

/** Равнобедренная трапеция: AD = ad, BC = bc, высота h. */
function ravnobokaya(ad: number, bc: number, h: number): Tochki {
  return trapeciya(ad, bc, (ad - bc) / 2, h);
}

export const TP_RAVNOBOKAYA = scena({
  id: 'tp-ravnobokaya',
  /* AD = 12, BC = 4, CH = 6: AH = 8, AC = 10. */
  nachalo: ravnobokaya(12, 4, 6),
  goditsya: goditsyaTrap,
  sluchaynaya: (rnd) => {
    const ad = vPromezhutke(rnd, 9, 14);
    return ravnobokaya(ad, vPromezhutke(rnd, 2, ad - 3), vPromezhutke(rnd, 4, 8));
  },
  postroit(t) {
    const { A, B, C, D, H, G } = tochkiRavnobokoy(t);
    const el: Element[] = [
      mnog('f-abg', [A, B, G], { gruppy: ['proekcii'], cvet: 'a' }),
      mnog('f-dch', [D, C, H], { gruppy: ['proekcii'], cvet: 'a' }),
      mnog('f-ach', [A, C, H], { gruppy: ['pl'], cvet: 'b' }),
      otr('AB', A, B, { shtrihi: 1 }),
      otr('BC', B, C, { gruppy: ['ah'], cvet: 'b' }),
      otr('CD', C, D, { shtrihi: 1 }),
      otr('DA', D, A),
      otr('AC', A, C, { shag: 1, gruppy: ['pl'], cvet: 'b' }),
      otr('CH', C, H, { shag: 1, stil: 'punktir' }),
      ug('pH', C, H, D, { pryamoy: true, shag: 1 }),
      otr('BG', B, G, { skrytyy: true, stil: 'punktir', gruppy: ['proekcii'], cvet: 'a' }),
      ug('pG', B, G, A, { skrytyy: true, pryamoy: true, gruppy: ['proekcii'], cvet: 'a' }),
      otr('AG-r', A, G, { skrytyy: true, shtrihi: 2, gruppy: ['proekcii'], cvet: 'c' }),
      otr('HD-r', H, D, { skrytyy: true, shtrihi: 2, gruppy: ['proekcii'], cvet: 'c' }),
      otr('GH-r', G, H, { skrytyy: true, gruppy: ['ah'], cvet: 'b' }),
      otr('AH', A, H, { skrytyy: true, gruppy: ['ah', 'pl'], cvet: 'b' }),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('D', D),
      tch('H', H, { shag: 1 }),
      tch('G', G, { skrytyy: true, gruppy: ['proekcii', 'ah'], cvet: 'a' }),
    ];
    return {
      elementy: el,
      zametka: null,
      znacheniya: [
        `$AH = ${chisloTeX(dist(A, H))}$`,
        `$\\tfrac12(AD + BC) = ${chisloTeX((dist(A, D) + dist(B, C)) / 2)}$`,
      ],
    };
  },
  shagi: ['Равнобедренная трапеция $ABCD$', 'Диагональ $AC$ и высота $CH$'],
});

/* ── 15. Отрезок через точку пересечения диагоналей ──────────────── */

export function tochkiBabochki(t: Tochki) {
  const A = t.A!;
  const B = t.B!;
  const C = t.C!;
  const D = t.D!;
  const O = intersect(A, C, B, D) ?? mid(A, C);
  const vdol = add(O, sub(D, A));
  return {
    A,
    B,
    C,
    D,
    O,
    K: intersect(O, vdol, A, B) ?? O,
    L: intersect(O, vdol, C, D) ?? O,
  };
}

export const TP_BABOCHKA = scena({
  id: 'tp-babochka',
  /* BC = 3, AD = 6. */
  nachalo: trapeciya(6, 3, 1, 4),
  goditsya: goditsyaTrap,
  sluchaynaya: (rnd) => {
    const ad = vPromezhutke(rnd, 6, 10);
    const bc = vPromezhutke(rnd, 2, ad - 2);
    return trapeciya(ad, bc, vPromezhutke(rnd, -1, ad - bc + 1), vPromezhutke(rnd, 3.5, 6));
  },
  postroit(t) {
    const { A, B, C, D, O, K, L } = tochkiBabochki(t);
    const el: Element[] = [
      mnog('f-boc', [B, O, C], { gruppy: ['bab'], cvet: 'a' }),
      mnog('f-doa', [D, O, A], { gruppy: ['bab'], cvet: 'b' }),
      mnog('f-ako', [A, K, O], { gruppy: ['pod1'], cvet: 'b' }),
      mnog('f-abc', [A, B, C], { gruppy: ['pod1'], cvet: 'a' }),
      mnog('f-dlo', [D, L, O], { gruppy: ['pod2'], cvet: 'b' }),
      mnog('f-dcb', [D, C, B], { gruppy: ['pod2'], cvet: 'a' }),
      otr('AB', A, B),
      otr('BC', B, C, { gruppy: ['pod1', 'pod2'], cvet: 'a' }),
      otr('CD', C, D),
      otr('DA', D, A),
      otr('AC', A, C, { shag: 1 }),
      otr('BD', B, D, { shag: 1 }),
      otr('KO', K, O, { shag: 2, shtrihi: 1, gruppy: ['pod1', 'otv'], cvet: 'b' }),
      otr('OL', O, L, { shag: 2, shtrihi: 1, gruppy: ['pod2', 'otv'], cvet: 'b' }),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('D', D),
      tch('O', O, { shag: 1 }),
      tch('K', K, { shag: 2 }),
      tch('L', L, { shag: 2 }),
    ];
    return {
      elementy: el,
      zametka: null,
      znacheniya: [`$KO : OL = ${chisloTeX(dist(K, O) / dist(O, L))}$`],
    };
  },
  shagi: [
    'Трапеция $ABCD$',
    'Диагонали, точка $O$',
    'Прямая через $O$ параллельно основаниям: отрезок $KL$',
  ],
});

/* ── 16. Сумма углов при основании 90° ───────────────────────────── */

export function tochkiUgol90(t: Tochki) {
  const A = t.A!;
  const B = t.B!;
  const C = t.C!;
  const D = t.D!;
  const P = intersect(A, B, D, C) ?? mid(B, C);
  return { A, B, C, D, P, M: mid(B, C), N: mid(A, D) };
}

/** AD = ad, угол A (градусы), k = BC : AD: P — вершина прямого угла над AD. */
function ugol90(ad: number, uA: number, k: number): Tochki {
  const A: T2 = [0, 0];
  const D: T2 = [ad, 0];
  const P = polar(uA, ad * Math.cos((uA * Math.PI) / 180));
  const B = add(A, mul(sub(P, A), 1 - k));
  const C = add(D, mul(sub(P, D), 1 - k));
  return { A, B, C, D };
}

export const TP_UGOL_90 = scena({
  id: 'tp-ugol-90',
  /* AD = 14, BC = 4, AB = 6: PA = 8,4, cos A = 0,6. */
  nachalo: ugol90(14, (Math.acos(0.6) * 180) / Math.PI, 4 / 14),
  goditsya: goditsyaTrap,
  sluchaynaya: (rnd) =>
    ugol90(vPromezhutke(rnd, 10, 14), vPromezhutke(rnd, 30, 60), vPromezhutke(rnd, 0.2, 0.5)),
  postroit(t) {
    const { A, B, C, D, P, M, N } = tochkiUgol90(t);
    const el: Element[] = [
      mnog('f-apd', [A, P, D], { gruppy: ['p', 'h'], cvet: 'a' }),
      otr('AB', A, B),
      otr('BC', B, C, { gruppy: ['med'], cvet: 'b' }),
      otr('CD', C, D),
      otr('DA', D, A, { gruppy: ['med'], cvet: 'a' }),
      otr('BP', B, P, { shag: 1, stil: 'prodolzhenie' }),
      otr('CP', C, P, { shag: 1, stil: 'prodolzhenie' }),
      ug('pP', A, P, D, { pryamoy: true, shag: 1, gruppy: ['p'], cvet: 'b' }),
      otr('PN', P, N, { shag: 2, stil: 'punktir', gruppy: ['pryamaya', 'med'], cvet: 'c' }),
      otr('AN-r', A, N, { skrytyy: true, shtrihi: 1, gruppy: ['med'], cvet: 'a' }),
      otr('ND-r', N, D, { skrytyy: true, shtrihi: 1, gruppy: ['med'], cvet: 'a' }),
      otr('BM-r', B, M, { skrytyy: true, shtrihi: 2, gruppy: ['med'], cvet: 'b' }),
      otr('MC-r', M, C, { skrytyy: true, shtrihi: 2, gruppy: ['med'], cvet: 'b' }),
      ug('uA', B, A, D, { skrytyy: true, gruppy: ['p'], cvet: 'c' }),
      ug('uD', A, D, C, { skrytyy: true, gruppy: ['p'], cvet: 'c', dugi: 2 }),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('D', D),
      tch('P', P, { shag: 1 }),
      tch('M', M, { shag: 2 }),
      tch('N', N, { shag: 2 }),
    ];
    return {
      elementy: el,
      zametka: null,
      znacheniya: [
        `$MN = ${chisloTeX(dist(M, N))}$`,
        `$\\tfrac12(AD - BC) = ${chisloTeX((dist(A, D) - dist(B, C)) / 2)}$`,
      ],
    };
  },
  shagi: [
    'Трапеция $ABCD$, $\\angle A + \\angle D = 90^\\circ$',
    'Продолжения боковых сторон до точки $P$',
    'Середины оснований $M$ и $N$ на прямой через $P$',
  ],
});
