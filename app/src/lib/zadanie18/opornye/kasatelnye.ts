/**
 * Чертежи опорных задач №18, тема «Касательные»: касательная и
 * секущая, описанная трапеция, касающиеся окружности. Тексты —
 * content/zadanie18/opornye/kasatelnye.ts.
 */

import { mnog, okr, otr, tch, ug } from '@/lib/skhemy/dsl';
import {
  add,
  angleAt,
  chisloTeX,
  dist,
  foot,
  intersect,
  lineCircle,
  mid,
  sub,
} from '@/lib/skhemy/geometriya';
import type { Element, T2, Tochki } from '@/lib/skhemy/tipy';
import { goditsyaTreugolnik, parametry, scena, vPromezhutke } from './obshchee';

/* ── 7. Касательная и секущая из одной точки ──────────────────────── */

export function tochkiKasSek(t: Tochki) {
  const A = t.A!;
  const B = t.B!;
  const D = t.D!;
  /* Центр — на перпендикуляре к AB в точке B и на серединном перпендикуляре к BD. */
  const ab = sub(B, A);
  const bd = sub(D, B);
  const S = mid(B, D);
  const O = intersect(B, add(B, [-ab[1], ab[0]]), S, add(S, [-bd[1], bd[0]])) ?? mid(B, D);
  const krug = { c: O, r: dist(O, B) };
  /* Вторая точка секущей AD на окружности: у D параметр 1. */
  const per = lineCircle(A, D, krug);
  const C =
    per.length === 2
      ? Math.abs(per[0]!.t - 1) > Math.abs(per[1]!.t - 1)
        ? per[0]!.p
        : per[1]!.p
      : D;
  return { A, B, C, D, O, krug };
}

export const OP_KAS_SEK = scena({
  id: 'kasatelnaya-sekushchaya',
  /* AB = 6, AD = BD = 9. */
  nachalo: { A: [0, 0], B: [6, 0], D: [3, 6 * Math.SQRT2] },
  podvizhnye: ['A', 'B', 'D'],
  pole: [-8, -10, 18, 16],
  goditsya: (t) => {
    if (!goditsyaTreugolnik(t.A!, t.B!, t.D!, 14, 1.5)) return false;
    const { A, B, C, D } = tochkiKasSek(t);
    if (dist(A, D) < 1.25 * dist(A, B)) return false;
    const k = dist(A, C) / dist(A, D);
    return dist(A, C) + dist(C, D) - dist(A, D) < 1e-9 && k > 0.12 && k < 0.85;
  },
  sluchaynaya: (rnd) => {
    const ab = vPromezhutke(rnd, 4, 7);
    const ad = ab * vPromezhutke(rnd, 1.35, 2.2);
    const u = vPromezhutke(rnd, 25, 70);
    return {
      A: [0, 0],
      B: [ab, 0],
      D: [ad * Math.cos((u * Math.PI) / 180), ad * Math.sin((u * Math.PI) / 180)],
    };
  },
  postroit(t) {
    const { A, B, C, D, krug } = tochkiKasSek(t);
    const el: Element[] = [
      mnog('f-abc', [A, B, C], { gruppy: ['pod'], cvet: 'a' }),
      mnog('f-adb', [A, D, B], { gruppy: ['pod'], cvet: 'b' }),
      okr('o', krug.c, krug.r),
      otr('AB', A, B, { gruppy: ['kas'], cvet: 'a' }),
      otr('B+', B, add(B, [(B[0] - A[0]) * 0.35, (B[1] - A[1]) * 0.35]), {
        stil: 'prodolzhenie',
      }),
      otr('AD', A, D),
      otr('BC', B, C, { shag: 1, gruppy: ['kas', 'otn'], cvet: 'b' }),
      otr('BD', B, D, { shag: 1, gruppy: ['otn'], cvet: 'b' }),
      ug('uABC', A, B, C, { skrytyy: true, gruppy: ['kas', 'pod'], cvet: 'c' }),
      ug('uBDA', B, D, A, { skrytyy: true, gruppy: ['kas', 'pod'], cvet: 'c' }),
      ug('uA', B, A, D, { skrytyy: true, gruppy: ['pod'], cvet: 'b', dugi: 2 }),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('D', D),
    ];
    return {
      elementy: el,
      zametka: null,
      znacheniya: [
        `$\\angle ABC = ${chisloTeX(angleAt(A, B, C), 1)}^\\circ$`,
        `$\\angle BDA = ${chisloTeX(angleAt(B, D, A), 1)}^\\circ$`,
      ],
    };
  },
  shagi: ['Касательная $AB$ и секущая $ACD$', 'Хорды $BC$ и $BD$'],
});

/* ── 8. Окружность, вписанная в равнобедренную трапецию ───────────── */

export function tochkiOpisTrap(t: Tochki) {
  const [a, b] = parametry(t);
  const h = Math.sqrt(a * b);
  const A: T2 = [-a / 2, 0];
  const D: T2 = [a / 2, 0];
  const B: T2 = [-b / 2, h];
  const C: T2 = [b / 2, h];
  const I: T2 = [0, h / 2];
  const K = foot(I, A, B);
  const N = foot(I, C, D);
  const P = foot(I, A, D);
  const Q = foot(I, B, C);
  const X = intersect(K, N, B, D) ?? mid(B, D);
  return { A, B, C, D, I, r: h / 2, K, N, P, Q, X };
}

export const OP_OPIS_TRAP = scena({
  id: 'opisannaya-trapeciya',
  /* AD = 8, BC = 2. */
  nachalo: { p: [8, 2] },
  goditsya: (t) => {
    const [a, b] = parametry(t);
    return a > 0 && b > 0.12 * a && b < 0.8 * a;
  },
  sluchaynaya: (rnd) => {
    const a = vPromezhutke(rnd, 6, 10);
    return { p: [a, a * vPromezhutke(rnd, 0.18, 0.7)] };
  },
  postroit(t) {
    const { A, B, C, D, I, r, K, N, P, Q, X } = tochkiOpisTrap(t);
    const s = (id: string, p: T2, q: T2, shtrihi: 1 | 2, cvet: 'a' | 'b') =>
      otr(id, p, q, { skrytyy: true, shtrihi, gruppy: ['kas'], cvet });
    const el: Element[] = [
      mnog('f-bad', [B, A, D], { gruppy: ['kx'], cvet: 'a' }),
      mnog('f-bkx', [B, K, X], { gruppy: ['kx'], cvet: 'b' }),
      mnog('f-dbc', [D, B, C], { gruppy: ['xn'], cvet: 'a' }),
      mnog('f-dxn', [D, X, N], { gruppy: ['xn'], cvet: 'b' }),
      okr('vp', I, r, { gruppy: ['kas'], cvet: 'c' }),
      otr('AD', A, D),
      otr('BC', B, C),
      otr('AB', A, B, { gruppy: ['bok'], cvet: 'b' }),
      otr('CD', C, D, { gruppy: ['bok'], cvet: 'b' }),
      s('AK', A, K, 1, 'a'),
      s('AP', A, P, 1, 'a'),
      s('DP', D, P, 1, 'a'),
      s('DN', D, N, 1, 'a'),
      s('BK', B, K, 2, 'b'),
      s('BQ', B, Q, 2, 'b'),
      s('CQ', C, Q, 2, 'b'),
      s('CN', C, N, 2, 'b'),
      otr('KN', K, N, { shag: 1, gruppy: ['kx', 'xn'], cvet: 'c' }),
      otr('BD', B, D, { shag: 2, stil: 'punktir', gruppy: ['kx', 'xn'] }),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('D', D),
      tch('K', K),
      tch('N', N),
      tch('P', P),
      tch('Q', Q),
      tch('X', X, { shag: 2 }),
    ];
    return {
      elementy: el,
      zametka: null,
      znacheniya: [
        `$AB = ${chisloTeX(dist(A, B))}$`,
        `$\\dfrac{AD + BC}{2} = ${chisloTeX((dist(A, D) + dist(B, C)) / 2)}$`,
      ],
    };
  },
  shagi: [
    'Равнобедренная трапеция $ABCD$ и вписанная окружность',
    'Отрезок $KN$ между точками касания на боковых сторонах',
    'Диагональ $BD$ пересекает $KN$ в точке $X$',
  ],
});

/* ── 9. Две окружности касаются внешним образом ───────────────────── */

export function tochkiKasOkr(t: Tochki) {
  const [R, r] = parametry(t);
  const AB = 2 * Math.sqrt(R * r);
  const A: T2 = [0, 0];
  const B: T2 = [AB, 0];
  const O1: T2 = [0, R];
  const O2: T2 = [AB, r];
  const K: T2 = [O1[0] + ((O2[0] - O1[0]) * R) / (R + r), O1[1] + ((O2[1] - O1[1]) * R) / (R + r)];
  /* Общая касательная в K — перпендикуляр к O₁O₂; M — её пересечение с AB. */
  const o12 = sub(O2, O1);
  const M = intersect(K, add(K, [-o12[1], o12[0]]), A, B) ?? mid(A, B);
  const H: T2 = [0, r];
  const L = foot(A, O1, M);
  return { A, B, O1, O2, R, r, K, M, H, L };
}

export const OP_KAS_OKR = scena({
  id: 'kasayushchiesya-okruzhnosti',
  /* Радиусы 9 и 4. */
  nachalo: { p: [9, 4] },
  goditsya: (t) => {
    const [R, r] = parametry(t);
    return R > 0 && r >= 0.2 * R && r <= R;
  },
  sluchaynaya: (rnd) => {
    const R = vPromezhutke(rnd, 3, 7);
    return { p: [R, R * vPromezhutke(rnd, 0.25, 0.95)] };
  },
  postroit(t) {
    const { A, B, O1, O2, R, r, K, M, H, L } = tochkiKasOkr(t);
    const el: Element[] = [
      mnog('f-o1am', [O1, A, M], { gruppy: ['o1m'], cvet: 'a' }),
      okr('o1', O1, R),
      okr('o2', O2, r),
      otr('AB', A, B),
      otr('KM', K, M, { shag: 1, gruppy: ['kas-m'], cvet: 'c' }),
      otr('MA', M, A, { skrytyy: true, shtrihi: 1, gruppy: ['kas-m', 'pr'], cvet: 'b' }),
      otr('MK', M, K, { skrytyy: true, shtrihi: 1, gruppy: ['kas-m', 'pr'], cvet: 'b' }),
      otr('MB', M, B, { skrytyy: true, shtrihi: 1, gruppy: ['kas-m', 'pr'], cvet: 'b' }),
      otr('AK', A, K, { shag: 2, gruppy: ['pr', 'o1m'], cvet: 'a' }),
      otr('BK', B, K, { shag: 2, gruppy: ['pr'], cvet: 'a' }),
      ug('uK', A, K, B, { pryamoy: true, skrytyy: true, gruppy: ['pr'], cvet: 'b' }),
      otr('O1O2', O1, O2, { shag: 3, stil: 'punktir', gruppy: ['trap'], cvet: 'a' }),
      otr('O1A', O1, A, { shag: 3, stil: 'punktir', gruppy: ['trap', 'o1m'], cvet: 'a' }),
      otr('O2B', O2, B, { shag: 3, stil: 'punktir', gruppy: ['trap'], cvet: 'a' }),
      otr('O2H', O2, H, { skrytyy: true, stil: 'punktir', gruppy: ['trap'], cvet: 'b' }),
      ug('uH', O1, H, O2, { pryamoy: true, skrytyy: true, gruppy: ['trap'], cvet: 'b' }),
      ug('uA', O1, A, B, { pryamoy: true, skrytyy: true, gruppy: ['trap', 'o1m'], cvet: 'b' }),
      otr('O1M', O1, M, { skrytyy: true, gruppy: ['o1m'], cvet: 'c' }),
      ug('uL', A, L, O1, { pryamoy: true, skrytyy: true, gruppy: ['o1m'], cvet: 'c' }),
      tch('A', A),
      tch('B', B),
      tch('K', K),
      tch('M', M, { shag: 1 }),
      tch('O_1', O1, { shag: 3 }),
      tch('O_2', O2, { shag: 3 }),
      tch('H', H, { skrytyy: true, gruppy: ['trap'], cvet: 'b' }),
      tch('L', L, { skrytyy: true, gruppy: ['o1m'], cvet: 'c' }),
    ];
    return {
      elementy: el,
      zametka: null,
      znacheniya: [
        `$\\angle AKB = ${chisloTeX(angleAt(A, K, B), 1)}^\\circ$`,
        `$MA : MK : MB = 1 : ${chisloTeX(dist(M, K) / dist(M, A))} : ${chisloTeX(dist(M, B) / dist(M, A))}$`,
      ],
    };
  },
  shagi: [
    'Окружности касаются в точке $K$, прямая $AB$ — их общая касательная',
    'Общая касательная в точке $K$ пересекает $AB$ в точке $M$',
    'Хорды $AK$ и $BK$',
    'Центры $O_1$, $O_2$ и радиусы в точки касания',
  ],
});
