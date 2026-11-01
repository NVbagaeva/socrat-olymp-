/**
 * Чертежи опорных задач №18, тема «Окружность и вписанные углы»:
 * лемма о трезубце, квадрат на гипотенузе, окружность через две
 * вершины треугольника. Тексты — content/zadanie18/opornye/okruzhnost.ts.
 */

import { mnog, okr, otr, tch, ug } from '@/lib/skhemy/dsl';
import {
  add,
  chisloTeX,
  circumcircle,
  dist,
  incircle,
  lineCircle,
  mid,
  sub,
  uglyTreugolnika,
  unit,
  angleAt,
} from '@/lib/skhemy/geometriya';
import type { Element, T2, Tochki } from '@/lib/skhemy/tipy';
import { goditsyaTreugolnik, parametry, scena, treugolnikNaBC, vPromezhutke } from './obshchee';

/* ── 4. Лемма о трезубце: центр вписанной окружности ──────────────── */

export function tochkiTrezubca(t: Tochki) {
  const A = t.A!;
  const B = t.B!;
  const C = t.C!;
  const I = incircle(A, B, C).c;
  const O = circumcircle(A, B, C);
  const per = lineCircle(A, I, O);
  /* Параметр вдоль AI: у A он 0, у второй точки — больше 1 (W за I). */
  const W = per.length === 2 ? per[1]!.p : I;
  return { A, B, C, I, O, W };
}

export const OP_TREZUBEC = scena({
  id: 'trezubec-incentr',
  /* BC = 8, ∠B = 70°, ∠C = 50°, значит ∠A = 60°. */
  nachalo: treugolnikNaBC(70, 50, 8),
  podvizhnye: ['A', 'B', 'C'],
  pole: [-10, -14, 18, 16],
  goditsya: (t) => goditsyaTreugolnik(t.A!, t.B!, t.C!, 20, 1.5),
  sluchaynaya: (rnd) => treugolnikNaBC(vPromezhutke(rnd, 30, 85), vPromezhutke(rnd, 30, 85), 8),
  postroit(t) {
    const { A, B, C, I, O, W } = tochkiTrezubca(t);
    const el: Element[] = [
      mnog('f-wbi', [W, B, I], { gruppy: ['rb'], cvet: 'b' }),
      mnog('f-bwc', [B, W, C], { gruppy: ['bwc'], cvet: 'a' }),
      okr('o', O.c, O.r),
      otr('AB', A, B),
      otr('BC', B, C, { gruppy: ['bwc'], cvet: 'a' }),
      otr('CA', C, A),
      otr('AW', A, W, { shag: 1 }),
      otr('BI', B, I, { shag: 2, gruppy: ['ugly-b', 'ugly-i', 'rb'], cvet: 'a' }),
      otr('CI', C, I, { shag: 2 }),
      otr('WB', W, B, { shag: 3, shtrihi: 1, gruppy: ['dugi', 'rb', 'bwc'], cvet: 'b' }),
      otr('WC', W, C, { shag: 3, shtrihi: 1, gruppy: ['dugi', 'bwc'], cvet: 'b' }),
      otr('WI', W, I, { skrytyy: true, shtrihi: 1, gruppy: ['rb'], cvet: 'b' }),
      ug('uBAW', B, A, W, { shag: 1, gruppy: ['dugi', 'ugly-i', 'bwc'], cvet: 'c' }),
      ug('uWAC', W, A, C, { shag: 1, gruppy: ['dugi', 'ugly-b', 'bwc'], cvet: 'c' }),
      ug('uWBC', W, B, C, { skrytyy: true, gruppy: ['ugly-b', 'bwc'], cvet: 'c' }),
      ug('uCBI', C, B, I, { skrytyy: true, gruppy: ['ugly-b'], cvet: 'a', dugi: 2 }),
      ug('uABI', A, B, I, { skrytyy: true, gruppy: ['ugly-i'], cvet: 'a', dugi: 2 }),
      ug('uWBI', W, B, I, { skrytyy: true, gruppy: ['rb'], cvet: 'b', dugi: 3 }),
      ug('uWIB', W, I, B, { skrytyy: true, gruppy: ['ugly-i', 'rb'], cvet: 'b', dugi: 3 }),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('W', W, { shag: 1 }),
      tch('I', I, { shag: 2 }),
    ];
    const wi = dist(W, I);
    return {
      elementy: el,
      zametka: null,
      znacheniya: [
        `$\\angle A = ${Math.round(uglyTreugolnika(A, B, C)[0])}^\\circ$`,
        `$WB : WI = ${chisloTeX(dist(W, B) / wi)}$`,
        `$WC : WI = ${chisloTeX(dist(W, C) / wi)}$`,
      ],
    };
  },
  shagi: [
    'Треугольник $ABC$ и описанная окружность',
    'Биссектриса угла $A$ до окружности: точка $W$',
    'Биссектрисы пересекаются в центре $I$ вписанной окружности',
    'Хорды $WB$ и $WC$',
  ],
});

/* ── 5. Квадрат на гипотенузе ─────────────────────────────────────── */

export function tochkiKvadrata(t: Tochki) {
  const A = t.A!;
  const B = t.B!;
  const C = t.C!;
  /* Квадрат ABDE строится по другую сторону от AB, чем C. */
  const ab = sub(B, A);
  const n1: T2 = [-ab[1], ab[0]];
  const storonaC = (C[0] - A[0]) * n1[0] + (C[1] - A[1]) * n1[1];
  const n: T2 = storonaC > 0 ? [ab[1], -ab[0]] : n1;
  const D = add(B, n);
  const E = add(A, n);
  return { A, B, C, D, E, O: mid(A, D) };
}

const A5: T2 = [0, 0];
const B5: T2 = [10, 0];

export const OP_KVADRAT = scena({
  id: 'kvadrat-na-gipotenuze',
  /* AB = 10, AC = 6, BC = 8: C(3,6; 4,8). */
  nachalo: { A: A5, B: B5, C: [3.6, 4.8] },
  podvizhnye: ['C'],
  pole: [-2, -12, 12, 12],
  goditsya: (t) =>
    goditsyaTreugolnik(t.A!, t.B!, t.C!, 15, 1) && Math.abs(angleAt(t.A!, t.C!, t.B!) - 90) < 1e-6,
  /* C — на окружности с диаметром AB: угол C остаётся прямым. */
  privyazat: (_imya, p, t) => {
    const c = mid(t.A!, t.B!);
    const r = dist(t.A!, t.B!) / 2;
    const u = unit(sub(p, c));
    return add(c, [u[0] * r, u[1] * r]);
  },
  sluchaynaya: (rnd) => {
    const a = vPromezhutke(rnd, 18, 72);
    const k = 10 * Math.cos((a * Math.PI) / 180);
    const C: T2 = [k * Math.cos((a * Math.PI) / 180), k * Math.sin((a * Math.PI) / 180)];
    return { A: A5, B: B5, C };
  },
  postroit(t) {
    const { A, B, C, D, E, O } = tochkiKvadrata(t);
    const el: Element[] = [
      mnog('f-aco', [A, C, O], { gruppy: ['aco'], cvet: 'a' }),
      okr('o-ab', mid(A, B), dist(A, B) / 2, {
        stil: 'punktir',
        skrytyy: true,
        gruppy: ['okr', 'hord'],
        cvet: 'a',
      }),
      otr('AC', A, C, { gruppy: ['aco'], cvet: 'a' }),
      otr('CB', C, B),
      otr('AB', A, B),
      ug('uC', A, C, B, { pryamoy: true, gruppy: ['okr'], cvet: 'b' }),
      otr('BD', B, D, { shag: 1 }),
      otr('DE', D, E, { shag: 1 }),
      otr('EA', E, A, { shag: 1 }),
      otr('AD', A, D, { shag: 2, stil: 'punktir' }),
      otr('BE', B, E, { shag: 2, stil: 'punktir' }),
      ug('uO', A, O, B, { pryamoy: true, skrytyy: true, gruppy: ['okr'], cvet: 'b' }),
      otr('OA', O, A, { skrytyy: true, shtrihi: 1, gruppy: ['hord', 'aco'], cvet: 'b' }),
      otr('OB', O, B, { skrytyy: true, shtrihi: 1, gruppy: ['hord'], cvet: 'b' }),
      otr('CO', C, O, { shag: 3, gruppy: ['bis', 'aco'], cvet: 'c' }),
      ug('uACO', A, C, O, { skrytyy: true, gruppy: ['bis', 'hord', 'aco'], cvet: 'c' }),
      ug('uOCB', O, C, B, { skrytyy: true, gruppy: ['bis', 'hord'], cvet: 'c' }),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('D', D, { shag: 1 }),
      tch('E', E, { shag: 1 }),
      tch('O', O, { shag: 2 }),
    ];
    return {
      elementy: el,
      zametka: null,
      znacheniya: [
        `$\\angle ACO = ${chisloTeX(angleAt(A, C, O), 1)}^\\circ$`,
        `$\\angle OCB = ${chisloTeX(angleAt(O, C, B), 1)}^\\circ$`,
      ],
    };
  },
  shagi: [
    'Прямоугольный треугольник $ABC$',
    'Квадрат $ABDE$ на гипотенузе вне треугольника',
    'Центр квадрата $O$ — точка пересечения диагоналей',
    'Отрезок $CO$',
  ],
});

/* ── 6. Окружность через две вершины треугольника ─────────────────── */

export function tochkiOkrDveVershiny(t: Tochki) {
  const A = t.A!;
  const B = t.B!;
  const C = t.C!;
  const [lam] = parametry(t);
  const K: T2 = [B[0] + (A[0] - B[0]) * lam, B[1] + (A[1] - B[1]) * lam];
  const krug = circumcircle(A, C, K);
  /* Вторая точка прямой BC на окружности: у C параметр 1. */
  const per = lineCircle(B, C, krug);
  const M =
    per.length === 2
      ? Math.abs(per[0]!.t - 1) > Math.abs(per[1]!.t - 1)
        ? per[0]!.p
        : per[1]!.p
      : C;
  return { A, B, C, K, M, krug };
}

export const OP_DVE_VERSHINY = scena({
  id: 'okruzhnost-cherez-dve-vershiny',
  /* BC = 10, AB = 15, AC = 12, BK = 4. */
  nachalo: { A: [9.05, Math.sqrt(225 - 9.05 ** 2)], B: [0, 0], C: [10, 0], p: [4 / 15, 0] },
  podvizhnye: ['A', 'B', 'C'],
  pole: [-12, -12, 26, 24],
  goditsya: (t) => {
    if (!goditsyaTreugolnik(t.A!, t.B!, t.C!, 22, 2)) return false;
    const [lam] = parametry(t);
    if (lam < 0.15 || lam > 0.85) return false;
    const { B, C, M } = tochkiOkrDveVershiny(t);
    const k = dist(B, M) / dist(B, C);
    const naBC = dist(B, M) + dist(M, C) - dist(B, C) < 1e-9;
    return naBC && k > 0.15 && k < 0.85;
  },
  sluchaynaya: (rnd) => ({
    ...treugolnikNaBC(vPromezhutke(rnd, 35, 85), vPromezhutke(rnd, 35, 85), 10),
    p: [vPromezhutke(rnd, 0.2, 0.7), 0],
  }),
  postroit(t) {
    const { A, B, C, K, M, krug } = tochkiOkrDveVershiny(t);
    const el: Element[] = [
      mnog('f-akmc', [A, K, M, C], { gruppy: ['vpis'], cvet: 'c' }),
      mnog('f-bac', [B, A, C], { gruppy: ['pod'], cvet: 'a' }),
      mnog('f-bmk', [B, M, K], { gruppy: ['pod', 'koef'], cvet: 'b' }),
      otr('AB', A, B),
      otr('BC', B, C),
      otr('CA', C, A, { gruppy: ['koef'], cvet: 'a' }),
      okr('o', krug.c, krug.r, { shag: 1, gruppy: ['vpis'], cvet: 'c' }),
      otr('KM', K, M, { shag: 2, gruppy: ['pod', 'koef'], cvet: 'b' }),
      ug('uAKM', A, K, M, { skrytyy: true, gruppy: ['ugol'], cvet: 'a', dugi: 2 }),
      ug('uBKM', B, K, M, { skrytyy: true, gruppy: ['ugol', 'pod'], cvet: 'c' }),
      ug('uACB', A, C, B, { skrytyy: true, gruppy: ['ugol', 'pod'], cvet: 'c' }),
      ug('uB', A, B, C, { skrytyy: true, gruppy: ['pod'], cvet: 'b', dugi: 2 }),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('K', K, { shag: 1 }),
      tch('M', M, { shag: 1 }),
    ];
    return {
      elementy: el,
      zametka: null,
      znacheniya: [
        `$\\angle BKM = ${chisloTeX(angleAt(B, K, M), 1)}^\\circ$`,
        `$\\angle BCA = ${chisloTeX(angleAt(B, C, A), 1)}^\\circ$`,
      ],
    };
  },
  shagi: [
    'Треугольник $ABC$',
    'Окружность через $A$ и $C$ пересекает $AB$ в $K$, $BC$ — в $M$',
    'Отрезок $KM$',
  ],
});
