/**
 * Чертёж опорной задачи 10 №18 (тема «Касательные»): окружность,
 * вписанная в равнобедренную трапецию. Текст —
 * content/zadanie18/opornyeDop/kasatelnye.ts.
 */

import { mnog, okr, otr, tch } from '@/lib/skhemy/dsl';
import { foot, intersect, mid } from '@/lib/skhemy/geometriya';
import type { Element, T2, Tochki } from '@/lib/skhemy/tipy';
import { parametry, scena } from './obshchee';

/* ── 10. Окружность, вписанная в равнобедренную трапецию ───────────── */

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
      otr('KN', K, N, { gruppy: ['kx', 'xn'], cvet: 'c' }),
      otr('BD', B, D, { skrytyy: true, stil: 'punktir', gruppy: ['kx', 'xn'] }),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('D', D),
      tch('K', K),
      tch('N', N),
      tch('P', P),
      tch('Q', Q),
      tch('X', X, { skrytyy: true, gruppy: ['kx', 'xn'] }),
    ];
    return el;
  },
});
