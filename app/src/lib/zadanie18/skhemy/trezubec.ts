/**
 * Схема 7. Лемма о трезубце (трилистнике).
 *
 * Треугольник ABC; P — центр вписанной окружности, Q — центр
 * вневписанной, касающейся стороны BC; M — вторая точка пересечения
 * биссектрисы угла A с описанной окружностью. MB = MC = MP = MQ.
 * Тянутся A, B, C.
 */

import { mnog, okr, otr, tch, ug } from '@/lib/skhemy/dsl';
import {
  chisloTeX,
  circumcircle,
  dist,
  incircle,
  lineCircle,
  treugolnikPoUglam,
  uglyTreugolnika,
  vnevpisannaya,
} from '@/lib/skhemy/geometriya';
import type { Element, Kadr, T2, Tochki, ZhivayaSkhema } from '@/lib/skhemy/tipy';

const POLE = [-6, -9, 13, 9] as const;

export interface TochkiTrezubca {
  A: T2;
  B: T2;
  C: T2;
  P: T2;
  Q: T2;
  M: T2;
  O: T2;
  R: number;
  r: number;
  ra: number;
}

export function tochkiTrezubca(t: Tochki): TochkiTrezubca {
  const A = t.A!;
  const B = t.B!;
  const C = t.C!;
  const vp = incircle(A, B, C);
  const vn = vnevpisannaya(A, B, C);
  const o = circumcircle(A, B, C);
  const per = lineCircle(A, vp.c, o);
  const M = per.length === 2 ? per[1]!.p : vp.c;
  return { A, B, C, P: vp.c, Q: vn.c, M, O: o.c, R: o.r, r: vp.r, ra: vn.r };
}

function postroit(t: Tochki): Kadr {
  const { A, B, C, P, Q, M, O, R, r, ra } = tochkiTrezubca(t);
  const mb = dist(M, B);
  const el: Element[] = [
    mnog('f-bmp', [B, M, P], { gruppy: ['bmp'], cvet: 'b' }),
    okr('o', O, R, { gruppy: ['trezubec', 'bmc', 'dugi'], cvet: 'a' }),
    okr('vp', P, r, { stil: 'punktir', skrytyy: true, gruppy: ['vp'], cvet: 'c' }),
    okr('vn', Q, ra, { stil: 'punktir', skrytyy: true, gruppy: ['vn'], cvet: 'c' }),
    okr('om', M, mb, { stil: 'punktir', skrytyy: true, gruppy: ['okr-m'], cvet: 'b' }),
    otr('AB', A, B),
    otr('BC', B, C, { gruppy: ['bmc'], cvet: 'a' }),
    otr('CA', C, A),
    otr('AB+', B, [2 * B[0] - A[0], 2 * B[1] - A[1]], {
      stil: 'prodolzhenie',
      skrytyy: true,
      gruppy: ['vn'],
    }),
    otr('AC+', C, [2 * C[0] - A[0], 2 * C[1] - A[1]], {
      stil: 'prodolzhenie',
      skrytyy: true,
      gruppy: ['vn'],
    }),
    otr('AQ', A, Q, { shag: 1, stil: 'punktir' }),
    otr('AM', A, M, { shag: 1 }),
    otr('MB', M, B, {
      shag: 2,
      gruppy: ['trezubec', 'bmc', 'bmp', 'okr-m'],
      cvet: 'b',
      shtrihi: 1,
    }),
    otr('MC', M, C, { shag: 2, gruppy: ['trezubec', 'bmc', 'okr-m'], cvet: 'b', shtrihi: 1 }),
    otr('MP', M, P, { shag: 2, gruppy: ['trezubec', 'bmp', 'okr-m'], cvet: 'b', shtrihi: 1 }),
    otr('MQ', M, Q, { shag: 2, gruppy: ['trezubec', 'okr-m'], cvet: 'b', shtrihi: 1 }),
    otr('BP', B, P, { skrytyy: true, gruppy: ['bmp', 'pbq'], cvet: 'a' }),
    otr('BQ', B, Q, { skrytyy: true, gruppy: ['pbq'], cvet: 'a' }),
    ug('pPBQ', P, B, Q, { pryamoy: true, skrytyy: true, gruppy: ['pbq'], cvet: 'a' }),
    ug('uBAM', B, A, M, { gruppy: ['bmc', 'bmp'], cvet: 'c' }),
    ug('uMAC', M, A, C, { gruppy: ['bmc', 'bmp'], cvet: 'c' }),
    ug('uBCM', B, C, M, { skrytyy: true, gruppy: ['bmc'], cvet: 'c' }),
    ug('uCBM', C, B, M, { skrytyy: true, gruppy: ['bmc', 'bmp'], cvet: 'c' }),
    ug('uABP', A, B, P, { skrytyy: true, gruppy: ['bmp'], cvet: 'a', dugi: 2 }),
    ug('uPBC', P, B, C, { skrytyy: true, gruppy: ['bmp'], cvet: 'a', dugi: 2 }),
    tch('A', A),
    tch('B', B, { gruppy: ['okr-m'], cvet: 'b' }),
    tch('C', C, { gruppy: ['okr-m'], cvet: 'b' }),
    tch('P', P, { shag: 1, gruppy: ['okr-m', 'vp'], cvet: 'b' }),
    tch('Q', Q, { shag: 1, gruppy: ['okr-m', 'vn'], cvet: 'b' }),
    tch('M', M, { shag: 1, gruppy: ['trezubec', 'okr-m'], cvet: 'b' }),
  ];
  return {
    elementy: el,
    zametka: null,
    znacheniya: [
      `$MB = ${chisloTeX(mb)}$`,
      `$MC = ${chisloTeX(dist(M, C))}$`,
      `$MP = ${chisloTeX(dist(M, P))}$`,
      `$MQ = ${chisloTeX(dist(M, Q))}$`,
    ],
  };
}

function goditsya(t: Tochki): boolean {
  const A = t.A!;
  const B = t.B!;
  const C = t.C!;
  if (Math.min(dist(A, B), dist(B, C), dist(A, C)) < 1.5) return false;
  const u = uglyTreugolnika(A, B, C);
  /* Острый угол A не мельче 25°: иначе вневписанная окружность улетает далеко. */
  return Math.min(...u) >= 18 && u[0] >= 30;
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
    const uA = 45 + rnd() * 50;
    const uC = 30 + rnd() * (180 - uA - 60);
    const t = treugolnikPoUglam(uA, uC, 6);
    if (goditsya(t)) return t;
  }
  return NACHALO;
}

const NACHALO: Tochki = { A: [0, 0], B: [2.6, 4.4], C: [6.4, 0] };

export const TREZUBEC: ZhivayaSkhema = {
  id: 'trezubec',
  nachalo: NACHALO,
  podvizhnye: ['A', 'B', 'C'],
  pole: POLE,
  postroit,
  ogranichit,
  sluchaynaya,
  shagi: [
    'Треугольник $ABC$ и описанная окружность',
    'Биссектриса угла $A$: центр вписанной $P$, центр вневписанной $Q$, точка $M$ на окружности',
    'Трезубец: $MB = MC = MP = MQ$',
  ],
};
