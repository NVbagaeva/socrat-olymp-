/**
 * Чертёж опорной задачи 11 №18 (тема «Трапеция»): четыре точки
 * трапеции на одной прямой. Текст — content/zadanie18/opornyeDop/trapeciya.ts.
 */

import { mnog, otr, tch } from '@/lib/skhemy/dsl';
import { intersect, mid } from '@/lib/skhemy/geometriya';
import type { Element, T2, Tochki } from '@/lib/skhemy/tipy';
import { parametry, scena } from './obshchee';

/**
 * Трапеция по вершинам A, B, D и отношению оснований λ = BC : AD:
 * C = B + λ·(D − A), так что BC ∥ AD при любом положении вершин.
 */
export function trapeciya(t: Tochki) {
  const A = t.A!;
  const B = t.B!;
  const D = t.D!;
  const [lam] = parametry(t);
  const C: T2 = [B[0] + lam * (D[0] - A[0]), B[1] + lam * (D[1] - A[1])];
  const O = intersect(A, C, B, D) ?? mid(A, C);
  return { A, B, C, D, O };
}

/* ── 11. Четыре точки трапеции на одной прямой ─────────────────────── */

export function tochkiChetyreh(t: Tochki) {
  const { A, B, C, D, O } = trapeciya(t);
  const P = intersect(A, B, D, C) ?? mid(B, C);
  return { A, B, C, D, O, P, M: mid(B, C), N: mid(A, D) };
}

/* AD = 6, BC = 2, MN = 4: N(3; 0), M = N + 4·(cos 70°; sin 70°). */
const M11: T2 = [3 + 4 * Math.cos((70 * Math.PI) / 180), 4 * Math.sin((70 * Math.PI) / 180)];

export const OP_CHETYRE = scena({
  id: 'chetyre-tochki-trapecii',
  nachalo: { A: [0, 0], B: [M11[0] - 1, M11[1]], D: [6, 0], p: [1 / 3, 0] },
  postroit(t) {
    const { A, B, C, D, O, P, M, N } = tochkiChetyreh(t);
    const el: Element[] = [
      mnog('f-pbc', [P, B, C], { gruppy: ['p'], cvet: 'b' }),
      mnog('f-pad', [P, A, D], { gruppy: ['p'], cvet: 'a' }),
      mnog('f-boc', [B, O, C], { gruppy: ['o'], cvet: 'b' }),
      mnog('f-doa', [D, O, A], { gruppy: ['o'], cvet: 'a' }),
      otr('AD', A, D),
      otr('BC', B, C),
      otr('AB', A, B),
      otr('CD', C, D),
      otr('BP', B, P, { stil: 'prodolzhenie' }),
      otr('CP', C, P, { stil: 'prodolzhenie' }),
      otr('AC', A, C),
      otr('BD', B, D),
      otr('BM', B, M, { skrytyy: true, shtrihi: 1, gruppy: ['p', 'o'], cvet: 'b' }),
      otr('MC', M, C, { skrytyy: true, shtrihi: 1, gruppy: ['p', 'o'], cvet: 'b' }),
      otr('AN', A, N, { skrytyy: true, shtrihi: 2, gruppy: ['p', 'o'], cvet: 'a' }),
      otr('ND', N, D, { skrytyy: true, shtrihi: 2, gruppy: ['p', 'o'], cvet: 'a' }),
      otr('PN', P, N, { stil: 'punktir', gruppy: ['p', 'o', 'itog'], cvet: 'c' }),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('D', D),
      tch('P', P),
      tch('O', O),
      tch('M', M),
      tch('N', N),
    ];
    return el;
  },
});
