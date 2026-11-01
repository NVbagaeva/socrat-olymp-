/**
 * Чертежи опорных задач 14–15 №18 (тема «Площади»): треугольник с
 * вершинами на сторонах, сумма расстояний до сторон правильного
 * треугольника. Тексты — content/zadanie18/opornyeDop/ploshchadi.ts.
 */

import { mnog, otr, tch, ug } from '@/lib/skhemy/dsl';
import { foot, mid } from '@/lib/skhemy/geometriya';
import type { Element, T2, Tochki } from '@/lib/skhemy/tipy';
import { delit, parametry, scena } from './obshchee';

/* ── 14. Треугольник с вершинами на сторонах: общий угол ──────────── */

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
  postroit(t) {
    const { A, B, C, K, L, M } = tochkiTrehUglov(t);
    const el: Element[] = [
      mnog('f-abc', [A, B, C], { gruppy: ['geron'], cvet: 'c' }),
      mnog('f-akm', [A, K, M], { gruppy: ['akm', 'ugly'], cvet: 'a' }),
      mnog('f-bkl', [B, L, K], { gruppy: ['bkl', 'ugly'], cvet: 'b' }),
      mnog('f-clm', [C, M, L], { gruppy: ['clm', 'ugly'], cvet: 'c' }),
      mnog('f-klm', [K, L, M], { gruppy: ['klm'], cvet: 'a' }),
      otr('AB', A, B),
      otr('BC', B, C),
      otr('CA', C, A),
      otr('KL', K, L),
      otr('LM', L, M),
      otr('MK', M, K),
      ug('uA', B, A, C, { skrytyy: true, gruppy: ['akm'], cvet: 'a' }),
      ug('uB', C, B, A, { skrytyy: true, gruppy: ['bkl'], cvet: 'b' }),
      ug('uC', A, C, B, { skrytyy: true, gruppy: ['clm'], cvet: 'c' }),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('K', K),
      tch('L', L),
      tch('M', M),
    ];
    return el;
  },
});

/* ── 15. Расстояния до сторон правильного треугольника ────────────── */

export function tochkiRasstoyaniy(t: Tochki) {
  const [a] = parametry(t);
  const A: T2 = [0, 0];
  const B: T2 = [a, 0];
  const C: T2 = [a / 2, (a * Math.sqrt(3)) / 2];
  const P = t.P!;
  return { A, B, C, P, K: foot(P, A, B), L: foot(P, B, C), M: foot(P, C, A), H: mid(B, C) };
}

const A16 = 4 * Math.sqrt(3);

export const OP_RASSTOYANIYA = scena({
  id: 'rasstoyaniya-do-storon',
  /* Сторона 4√3, расстояния до AB, BC, CA равны 1, 2, 3. */
  nachalo: { P: [7 / Math.sqrt(3), 1], p: [A16, 0] },
  postroit(t) {
    const { A, B, C, P, K, L, M, H } = tochkiRasstoyaniy(t);
    const el: Element[] = [
      mnog('f-pab', [P, A, B], { gruppy: ['razb'], cvet: 'a' }),
      mnog('f-pbc', [P, B, C], { gruppy: ['razb'], cvet: 'b' }),
      mnog('f-pca', [P, C, A], { gruppy: ['razb'], cvet: 'c' }),
      otr('AB', A, B),
      otr('BC', B, C),
      otr('CA', C, A),
      otr('PK', P, K, { gruppy: ['sum'], cvet: 'a' }),
      otr('PL', P, L, { gruppy: ['sum'], cvet: 'b' }),
      otr('PM', P, M, { gruppy: ['sum'], cvet: 'c' }),
      ug('uK', P, K, B, { pryamoy: true }),
      ug('uL', P, L, C, { pryamoy: true }),
      ug('uM', P, M, A, { pryamoy: true }),
      otr('PA', P, A, { skrytyy: true, stil: 'punktir', gruppy: ['razb'] }),
      otr('PB', P, B, { skrytyy: true, stil: 'punktir', gruppy: ['razb'] }),
      otr('PC', P, C, { skrytyy: true, stil: 'punktir', gruppy: ['razb'] }),
      otr('AH', A, H, { skrytyy: true, stil: 'punktir', gruppy: ['sum', 'vys'], cvet: 'c' }),
      ug('uH', A, H, C, { pryamoy: true, skrytyy: true, gruppy: ['sum', 'vys'], cvet: 'c' }),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('P', P),
      tch('K', K),
      tch('L', L),
      tch('M', M),
      tch('H', H, { skrytyy: true, gruppy: ['sum', 'vys'], cvet: 'c' }),
    ];
    return el;
  },
});
