/**
 * Чертежи опорных задач №18, тема «Площади»: треугольник с вершинами
 * на сторонах, сумма расстояний до сторон правильного треугольника.
 * Тексты — content/zadanie18/opornye/ploshchadi.ts.
 */

import { mnog, otr, tch, ug, vel } from '@/lib/skhemy/dsl';
import { chisloTeX, dist, foot, mid } from '@/lib/skhemy/geometriya';
import type { Element, T2, Tochki } from '@/lib/skhemy/tipy';
import {
  delit,
  goditsyaTreugolnik,
  parametry,
  scena,
  signedS,
  treugolnikNaBC,
  vPromezhutke,
} from './obshchee';

/* ── 15. Треугольник с вершинами на сторонах: общий угол ──────────── */

export function tochkiTrehUglov(t: Tochki) {
  const A = t.A!;
  const B = t.B!;
  const C = t.C!;
  return { A, B, C, K: delit(A, B, 1, 2), L: delit(B, C, 1, 2), M: delit(C, A, 1, 2) };
}

export const OP_TRI_UGLA = scena({
  id: 'tri-ugla-ploshchad',
  /* AB = 13, BC = 14, CA = 15. */
  nachalo: { A: [5, 12], B: [0, 0], C: [14, 0] },
  podvizhnye: ['A', 'B', 'C'],
  pole: [-14, -12, 30, 26],
  goditsya: (t) => goditsyaTreugolnik(t.A!, t.B!, t.C!, 22, 2),
  sluchaynaya: (rnd) => treugolnikNaBC(vPromezhutke(rnd, 35, 85), vPromezhutke(rnd, 35, 85), 14),
  postroit(t) {
    const { A, B, C, K, L, M } = tochkiTrehUglov(t);
    const el: Element[] = [
      /* б) ищет площадь: искомая фигура и «S = ?». */
      mnog('isk', [K, L, M], { skrytyy: false, rol: 'region-sought' }),
      vel(
        'd-S',
        'S_KLM = ?',
        { vnutri: [(K[0] + L[0] + M[0]) / 3, (K[1] + L[1] + M[1]) / 3] },
        { rol: 'region-sought' },
      ),
      mnog('f-abc', [A, B, C], { gruppy: ['geron'], cvet: 'c' }),
      mnog('f-akm', [A, K, M], { gruppy: ['akm', 'ugly'], cvet: 'a' }),
      mnog('f-bkl', [B, L, K], { gruppy: ['bkl', 'ugly'], cvet: 'b' }),
      mnog('f-clm', [C, M, L], { gruppy: ['clm', 'ugly'], cvet: 'c' }),
      mnog('f-klm', [K, L, M], { gruppy: ['klm'], cvet: 'a' }),
      otr('AB', A, B),
      otr('BC', B, C),
      otr('CA', C, A),
      otr('KL', K, L, { shag: 1 }),
      otr('LM', L, M, { shag: 1 }),
      otr('MK', M, K, { shag: 1 }),
      ug('uA', B, A, C, { skrytyy: true, gruppy: ['akm'], cvet: 'a' }),
      ug('uB', C, B, A, { skrytyy: true, gruppy: ['bkl'], cvet: 'b' }),
      ug('uC', A, C, B, { skrytyy: true, gruppy: ['clm'], cvet: 'c' }),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('K', K, { shag: 1 }),
      tch('L', L, { shag: 1 }),
      tch('M', M, { shag: 1 }),
    ];
    return {
      elementy: el,
      zametka: null,
      znacheniya: [
        `$S_{KLM} : S_{ABC} = ${chisloTeX(Math.abs(signedS([K, L, M]) / signedS([A, B, C])), 3)}$`,
      ],
    };
  },
  shagi: [
    'Треугольник $ABC$',
    'Точки $K$, $L$, $M$ делят стороны в отношении $1 : 2$; треугольник $KLM$',
  ],
});

/* ── 16. Расстояния до сторон правильного треугольника ────────────── */

export function tochkiRasstoyaniy(t: Tochki) {
  const [a] = parametry(t);
  const A: T2 = [0, 0];
  const B: T2 = [a, 0];
  const C: T2 = [a / 2, (a * Math.sqrt(3)) / 2];
  const P = t.P!;
  return { A, B, C, P, K: foot(P, A, B), L: foot(P, B, C), M: foot(P, C, A), H: mid(B, C) };
}

/** Точка внутри треугольника и не ближе 6% стороны к его сторонам. */
function goditsyaRasst(t: Tochki): boolean {
  const { A, B, C, P, K, L, M } = tochkiRasstoyaniy(t);
  const a = dist(A, B);
  const vnutri =
    Math.sign(signedS([A, B, P])) === Math.sign(signedS([B, C, P])) &&
    Math.sign(signedS([B, C, P])) === Math.sign(signedS([C, A, P]));
  return vnutri && Math.min(dist(P, K), dist(P, L), dist(P, M)) > 0.06 * a && C[1] > 0;
}

const A16 = 4 * Math.sqrt(3);

export const OP_RASSTOYANIYA = scena({
  id: 'rasstoyaniya-do-storon',
  /* Сторона 4√3, расстояния до AB, BC, CA равны 1, 2, 3. */
  nachalo: { P: [7 / Math.sqrt(3), 1], p: [A16, 0] },
  podvizhnye: ['P'],
  pole: [-2, -2, 10, 9],
  goditsya: goditsyaRasst,
  sluchaynaya: (rnd) => {
    const u = vPromezhutke(rnd, 0.12, 0.7);
    const v = vPromezhutke(rnd, 0.12, 0.7);
    const w = 1 - u - v;
    const C: T2 = [A16 / 2, 6];
    return { P: [v * A16 + w * C[0], w * C[1]], p: [A16, 0] };
  },
  postroit(t) {
    const { A, B, C, P, K, L, M, H } = tochkiRasstoyaniy(t);
    const el: Element[] = [
      mnog('f-pab', [P, A, B], { gruppy: ['razb'], cvet: 'a' }),
      mnog('f-pbc', [P, B, C], { gruppy: ['razb'], cvet: 'b' }),
      mnog('f-pca', [P, C, A], { gruppy: ['razb'], cvet: 'c' }),
      otr('AB', A, B),
      otr('BC', B, C),
      otr('CA', C, A),
      otr('PK', P, K, { shag: 1, gruppy: ['sum'], cvet: 'a' }),
      otr('PL', P, L, { shag: 1, gruppy: ['sum'], cvet: 'b' }),
      otr('PM', P, M, { shag: 1, gruppy: ['sum'], cvet: 'c' }),
      ug('uK', P, K, B, { pryamoy: true, shag: 1 }),
      ug('uL', P, L, C, { pryamoy: true, shag: 1 }),
      ug('uM', P, M, A, { pryamoy: true, shag: 1 }),
      otr('PA', P, A, { shag: 2, stil: 'punktir', gruppy: ['razb'] }),
      otr('PB', P, B, { shag: 2, stil: 'punktir', gruppy: ['razb'] }),
      otr('PC', P, C, { shag: 2, stil: 'punktir', gruppy: ['razb'] }),
      otr('AH', A, H, { skrytyy: true, stil: 'punktir', gruppy: ['sum', 'vys'], cvet: 'c' }),
      ug('uH', A, H, C, { pryamoy: true, skrytyy: true, gruppy: ['sum', 'vys'], cvet: 'c' }),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('P', P),
      tch('K', K, { shag: 1 }),
      tch('L', L, { shag: 1 }),
      tch('M', M, { shag: 1 }),
      tch('H', H, { skrytyy: true, gruppy: ['sum', 'vys'], cvet: 'c' }),
    ];
    const s = dist(P, K) + dist(P, L) + dist(P, M);
    return {
      elementy: el,
      zametka: null,
      znacheniya: [`$PK + PL + PM = ${chisloTeX(s)}$`, `$AH = ${chisloTeX(dist(A, H))}$`],
    };
  },
  shagi: [
    'Правильный треугольник $ABC$ и точка $P$ внутри',
    'Перпендикуляры $PK$, $PL$, $PM$ к сторонам',
    'Отрезки $PA$, $PB$, $PC$ делят треугольник на три',
  ],
});
