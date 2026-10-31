/**
 * Схема 11. Средняя линия трапеции.
 *
 * Трапеция ABCD, AD ∥ BC. M, N — середины боковых сторон AB и CD.
 * Тянутся A, D (большее основание), B и C; C скользит по прямой через
 * B, параллельной AD. Для доказательства свойства: прямая BN
 * пересекает прямую AD в точке E. Отрезок средней линии между
 * диагоналями — KL.
 */

import { mnog, otr, tch, ug } from '@/lib/skhemy/dsl';
import { add, chisloTeX, dist, dot, intersect, mid, mul, sub, unit } from '@/lib/skhemy/geometriya';
import type { Element, Kadr, T2, Tochki, ZhivayaSkhema } from '@/lib/skhemy/tipy';

const POLE = [-5, -4, 13, 8] as const;

export function tochkiSredlinTrap(t: Tochki) {
  const A = t.A!;
  const B = t.B!;
  const C = t.C!;
  const D = t.D!;
  const M = mid(A, B);
  const N = mid(C, D);
  const E = intersect(B, N, A, D) ?? D;
  const K = intersect(M, N, A, C) ?? M;
  const L = intersect(M, N, B, D) ?? N;
  return { A, B, C, D, M, N, E, K, L, N1: add(C, mul(sub(D, C), 0.72)) };
}

function postroit(t: Tochki): Kadr {
  const { A, B, C, D, M, N, E, K, L, N1 } = tochkiSredlinTrap(t);
  const el: Element[] = [
    mnog('f-bcn', [B, C, N], { gruppy: ['dok'], cvet: 'a' }),
    mnog('f-edn', [E, D, N], { gruppy: ['dok'], cvet: 'b' }),
    otr('AD', A, D, { gruppy: ['svoystvo', 'dok'], cvet: 'a' }),
    otr('BC', B, C, { gruppy: ['svoystvo', 'dok'], cvet: 'a' }),
    otr('AM', A, M, { shtrihi: 1, gruppy: ['opredelenie'], cvet: 'b' }),
    otr('MB', M, B, { shtrihi: 1, gruppy: ['opredelenie'], cvet: 'b' }),
    otr('CN', C, N, { shtrihi: 2, gruppy: ['opredelenie', 'dok'], cvet: 'b' }),
    otr('ND', N, D, { shtrihi: 2, gruppy: ['opredelenie', 'dok'], cvet: 'b' }),
    otr('MN', M, N, { shag: 1, gruppy: ['opredelenie', 'svoystvo', 'dok', 'priznak'], cvet: 'b' }),
    otr('DE', D, E, { skrytyy: true, stil: 'prodolzhenie', gruppy: ['dok'], cvet: 'b' }),
    otr('BE', B, E, { skrytyy: true, stil: 'punktir', gruppy: ['dok'], cvet: 'c' }),
    otr('AC', A, C, { skrytyy: true, stil: 'punktir', gruppy: ['diagonali'], cvet: 'c' }),
    otr('BD', B, D, { skrytyy: true, stil: 'punktir', gruppy: ['diagonali'], cvet: 'c' }),
    otr('KL', K, L, { skrytyy: true, gruppy: ['diagonali'], cvet: 'b' }),
    otr('MN1', M, N1, { skrytyy: true, stil: 'punktir', gruppy: ['protivnoe'], cvet: 'c' }),
    ug('uC', B, C, N, { skrytyy: true, gruppy: ['dok'], cvet: 'c' }),
    ug('uD', E, D, N, { skrytyy: true, gruppy: ['dok'], cvet: 'c' }),
    tch('A', A),
    tch('B', B),
    tch('C', C),
    tch('D', D),
    tch('M', M, { gruppy: ['opredelenie'], cvet: 'b' }),
    tch('N', N, { gruppy: ['opredelenie'], cvet: 'b' }),
    tch('E', E, { skrytyy: true, gruppy: ['dok'], cvet: 'b' }),
    tch('K', K, { skrytyy: true, gruppy: ['diagonali'], cvet: 'b' }),
    tch('L', L, { skrytyy: true, gruppy: ['diagonali'], cvet: 'b' }),
    tch('N_1', N1, { skrytyy: true, gruppy: ['protivnoe'], cvet: 'c' }),
  ];
  const ad = dist(A, D);
  const bc = dist(B, C);
  return {
    elementy: el,
    zametka: null,
    znacheniya: [
      `$MN = ${chisloTeX(dist(M, N))}$`,
      `$\\tfrac{AD + BC}{2} = ${chisloTeX((ad + bc) / 2)}$`,
      `$KL = ${chisloTeX(dist(K, L))}$`,
      `$\\tfrac{AD - BC}{2} = ${chisloTeX((ad - bc) / 2)}$`,
    ],
  };
}

function goditsya(t: Tochki): boolean {
  const A = t.A!;
  const B = t.B!;
  const C = t.C!;
  const D = t.D!;
  const u = unit(sub(D, A));
  const nrm: T2 = [-u[1], u[0]];
  const h = dot(sub(B, A), nrm);
  /* B и C выше AD, BC короче AD, направление BC — как у AD. */
  if (h < 1.2) return false;
  const bc = dot(sub(C, B), u);
  if (bc < 0.8 || bc > dist(A, D) - 0.8) return false;
  /* Боковые стороны не пересекаются и не слишком пологие. */
  const xb = dot(sub(B, A), u);
  const xc = dot(sub(C, A), u);
  return xb > -h * 1.6 && xc < dist(A, D) + h * 1.6 && dist(A, D) > 2.5;
}

function ogranichit(imya: string, p: T2, t: Tochki): T2 | null {
  let q: T2 = [
    Math.max(POLE[0], Math.min(POLE[2], p[0])),
    Math.max(POLE[1], Math.min(POLE[3], p[1])),
  ];
  if (imya === 'C') {
    const u = unit(sub(t.D!, t.A!));
    q = add(t.B!, mul(u, dot(sub(q, t.B!), u)));
  }
  return goditsya({ ...t, [imya]: q }) ? q : null;
}

/** BC остаётся параллельной AD: C — на прямой через B, длина BC прежняя. */
function prisposobit(novye: Tochki, prezhnie: Tochki, imya: string): Tochki | null {
  if (imya === 'C') return novye;
  const u = unit(sub(novye.D!, novye.A!));
  const s = { ...novye, C: add(novye.B!, mul(u, dist(prezhnie.B!, prezhnie.C!))) };
  return goditsya(s) ? s : null;
}

function sluchaynaya(rnd: () => number): Tochki {
  for (let i = 0; i < 300; i += 1) {
    const ad = 6 + rnd() * 2;
    const h = 2 + rnd() * 2;
    const xb = rnd() * 3 - 0.5;
    const bc = 1.2 + rnd() * (ad - 3);
    const t: Tochki = { A: [0, 0], D: [ad, 0], B: [xb, h], C: [xb + bc, h] };
    if (goditsya(t)) return t;
  }
  return NACHALO;
}

const NACHALO: Tochki = { A: [0, 0], D: [7.5, 0], B: [1.6, 3.4], C: [4.8, 3.4] };

export const SREDLIN_TRAP: ZhivayaSkhema = {
  id: 'sredlin-trap',
  nachalo: NACHALO,
  podvizhnye: ['A', 'D', 'B', 'C'],
  pole: POLE,
  postroit,
  ogranichit,
  prisposobit,
  sluchaynaya,
  shagi: [
    'Трапеция $ABCD$, $AD \\parallel BC$; середины $M$ и $N$ боковых сторон',
    'Средняя линия $MN$',
  ],
};
