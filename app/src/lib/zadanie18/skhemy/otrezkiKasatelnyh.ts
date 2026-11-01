/**
 * Схема 13. Отрезки касательных и полупериметр.
 *
 * Треугольник ABC; вписанная окружность касается AB, BC, CA в K, L, N;
 * вневписанная (напротив A) касается BC в L₁ и продолжений AB, AC в
 * K₁ и N₁. Тянутся A, B, C.
 */

import { okr, otr, tch } from '@/lib/skhemy/dsl';
import {
  chisloTeX,
  dist,
  foot,
  incircle,
  treugolnikPoUglam,
  uglyTreugolnika,
  vnevpisannaya,
} from '@/lib/skhemy/geometriya';
import type { Element, Kadr, T2, Tochki, ZhivayaSkhema } from '@/lib/skhemy/tipy';

const POLE = [-6, -9, 14, 9] as const;

export function tochkiKasatelnyh(t: Tochki) {
  const A = t.A!;
  const B = t.B!;
  const C = t.C!;
  const vp = incircle(A, B, C);
  const vn = vnevpisannaya(A, B, C);
  return {
    A,
    B,
    C,
    I: vp.c,
    r: vp.r,
    J: vn.c,
    ra: vn.r,
    K: foot(vp.c, A, B),
    L: foot(vp.c, B, C),
    N: foot(vp.c, A, C),
    K1: foot(vn.c, A, B),
    L1: foot(vn.c, B, C),
    N1: foot(vn.c, A, C),
  };
}

function postroit(t: Tochki): Kadr {
  const { A, B, C, I, r, J, ra, K, L, N, K1, L1, N1 } = tochkiKasatelnyh(t);
  const el: Element[] = [
    okr('vp', I, r, { gruppy: ['ravnye', 'p-bc'], cvet: 'c' }),
    okr('vn', J, ra, { skrytyy: true, stil: 'punktir', gruppy: ['vnevp'], cvet: 'c' }),
    otr('AB', A, B),
    otr('BC', B, C),
    otr('CA', C, A),
    otr('BK1', B, K1, { skrytyy: true, stil: 'prodolzhenie', gruppy: ['vnevp'] }),
    otr('CN1', C, N1, { skrytyy: true, stil: 'prodolzhenie', gruppy: ['vnevp'] }),
    /* Равные отрезки касательных: одна, две, три засечки. */
    otr('AK', A, K, { skrytyy: true, shtrihi: 1, gruppy: ['ravnye', 'p-bc'], cvet: 'a' }),
    otr('AN', A, N, { skrytyy: true, shtrihi: 1, gruppy: ['ravnye', 'p-bc'], cvet: 'a' }),
    otr('BK', B, K, { skrytyy: true, shtrihi: 2, gruppy: ['ravnye'], cvet: 'b' }),
    otr('BL', B, L, { skrytyy: true, shtrihi: 2, gruppy: ['ravnye', 'p-bc'], cvet: 'b' }),
    otr('CL', C, L, { skrytyy: true, shtrihi: 3, gruppy: ['ravnye', 'p-bc'], cvet: 'c' }),
    otr('CN', C, N, { skrytyy: true, shtrihi: 3, gruppy: ['ravnye'], cvet: 'c' }),
    otr('AK1', A, K1, { skrytyy: true, shtrihi: 1, gruppy: ['vnevp'], cvet: 'b' }),
    otr('AN1', A, N1, { skrytyy: true, shtrihi: 1, gruppy: ['vnevp'], cvet: 'b' }),
    otr('BL1', B, L1, { skrytyy: true, gruppy: ['vnevp'], cvet: 'a' }),
    otr('CL1', C, L1, { skrytyy: true, gruppy: ['vnevp'], cvet: 'a' }),
    tch('A', A),
    tch('B', B),
    tch('C', C),
    tch('K', K),
    tch('L', L),
    tch('N', N),
    tch('K_1', K1, { skrytyy: true, gruppy: ['vnevp'], cvet: 'b' }),
    tch('L_1', L1, { skrytyy: true, gruppy: ['vnevp'], cvet: 'b' }),
    tch('N_1', N1, { skrytyy: true, gruppy: ['vnevp'], cvet: 'b' }),
  ];
  const p = (dist(A, B) + dist(B, C) + dist(A, C)) / 2;
  return {
    elementy: el,
    zametka: null,
    znacheniya: [
      `$AK = ${chisloTeX(dist(A, K))}$`,
      `$p - BC = ${chisloTeX(p - dist(B, C))}$`,
      `$AK_1 = ${chisloTeX(dist(A, K1))}$`,
      `$p = ${chisloTeX(p)}$`,
    ],
  };
}

function goditsya(t: Tochki): boolean {
  if (Math.min(dist(t.A!, t.B!), dist(t.B!, t.C!), dist(t.A!, t.C!)) < 1.5) return false;
  const u = uglyTreugolnika(t.A!, t.B!, t.C!);
  return Math.min(...u) >= 22 && u[0] >= 35;
}

function ogranichit(imya: string, p: T2, t: Tochki): T2 | null {
  const q: T2 = [
    Math.max(POLE[0], Math.min(POLE[2], p[0])),
    Math.max(POLE[1], Math.min(POLE[3], p[1])),
  ];
  return goditsya({ ...t, [imya]: q }) ? q : null;
}

function sluchaynaya(rnd: () => number): Tochki {
  for (let i = 0; i < 300; i += 1) {
    const t = treugolnikPoUglam(45 + rnd() * 45, 30 + rnd() * 50, 6);
    if (goditsya(t)) return t;
  }
  return NACHALO;
}

const NACHALO: Tochki = { A: [0, 0], B: [2.2, 4.2], C: [6.2, 0] };

export const OTREZKI_KASATELNYH: ZhivayaSkhema = {
  id: 'otrezki-kasatelnyh',
  nachalo: NACHALO,
  podvizhnye: ['A', 'B', 'C'],
  pole: POLE,
  postroit,
  ogranichit,
  sluchaynaya,
  shagi: ['Треугольник $ABC$ и вписанная окружность, точки касания $K$, $L$, $N$'],
};
