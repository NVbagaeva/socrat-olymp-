/**
 * Схема 12. Касательная и секущая.
 *
 * Окружность неподвижна. Тянутся точка M вне круга и ручка P на
 * окружности: секущая MP пересекает окружность в B (ближе) и A (дальше).
 * MT — касательная, T — та из двух точек касания, что дальше от
 * секущей.
 */

import { mnog, okr, otr, ruchka, tch, ug } from '@/lib/skhemy/dsl';
import {
  angleAt,
  chisloTeX,
  dist,
  lineCircle,
  orient,
  polar,
  sub,
  tangentPoints,
} from '@/lib/skhemy/geometriya';
import type { Element, Kadr, T2, Tochki, ZhivayaSkhema } from '@/lib/skhemy/tipy';

const O: T2 = [0, 0];
const R = 3;
const POLE = [-12, -10, 12, 10] as const;

export function tochkiKasatelnoy(t: Tochki) {
  const M = t.M!;
  const per = lineCircle(M, t.P!, { c: O, r: R });
  const [x1, x2] = per.length === 2 ? [per[0]!.p, per[1]!.p] : [t.P!, t.P!];
  const A = dist(M, x1) > dist(M, x2) ? x1 : x2;
  const B = A === x1 ? x2 : x1;
  const kas = tangentPoints(M, { c: O, r: R }) ?? [t.P!, t.P!];
  /* Точка касания по другую сторону от секущей, чем центр, — или дальняя от неё. */
  const d0 = Math.abs(orient(M, A, kas[0]));
  const d1 = Math.abs(orient(M, A, kas[1]));
  const T = d0 >= d1 ? kas[0] : kas[1];
  return { M, A, B, T };
}

function postroit(t: Tochki): Kadr {
  const { M, A, B, T } = tochkiKasatelnoy(t);
  const el: Element[] = [
    mnog('f-mtb', [M, T, B], { gruppy: ['podobie'], cvet: 'b' }),
    mnog('f-mat', [M, A, T], { gruppy: ['podobie'], cvet: 'a' }),
    okr('o', O, R),
    otr('MA', M, A, { shag: 1, gruppy: ['kvadrat'], cvet: 'a' }),
    otr('MT', M, T, { shag: 2, gruppy: ['kvadrat', 'ugol', 'radius'], cvet: 'b' }),
    otr('TB', T, B, { skrytyy: true, gruppy: ['ugol', 'podobie'], cvet: 'c' }),
    otr('TA', T, A, { skrytyy: true, gruppy: ['ugol', 'podobie'], cvet: 'c' }),
    otr('OT', O, T, { skrytyy: true, gruppy: ['radius'], cvet: 'a' }),
    ug('pT', O, T, M, { pryamoy: true, skrytyy: true, gruppy: ['radius'], cvet: 'a' }),
    ug('uMTB', M, T, B, { skrytyy: true, gruppy: ['ugol', 'podobie'], cvet: 'b', dugi: 2 }),
    ug('uTAB', T, A, B, { skrytyy: true, gruppy: ['ugol', 'podobie'], cvet: 'b', dugi: 2 }),
    ug('uM', T, M, A, { skrytyy: true, gruppy: ['podobie'], cvet: 'c' }),
    ruchka('P', t.P!),
    tch('O', O, { skrytyy: true, gruppy: ['radius'], cvet: 'a' }),
    tch('M', M),
    tch('A', A, { shag: 1 }),
    tch('B', B, { shag: 1 }),
    tch('T', T, { shag: 2, gruppy: ['kvadrat'], cvet: 'b' }),
  ];
  return {
    elementy: el,
    zametka: null,
    znacheniya: [
      `$MT^2 = ${chisloTeX(dist(M, T) ** 2)}$`,
      `$MA\\cdot MB = ${chisloTeX(dist(M, A) * dist(M, B))}$`,
      `$\\angle MTB = ${Math.round(angleAt(M, T, B))}^\\circ$`,
      `$\\angle TAB = ${Math.round(angleAt(T, A, B))}^\\circ$`,
    ],
  };
}

function goditsya(t: Tochki): boolean {
  const M = t.M!;
  if (dist(M, O) < 1.35 * R) return false;
  const d = sub(t.P!, M);
  const l = Math.hypot(d[0], d[1]);
  const otC = Math.abs(d[0] * (O[1] - M[1]) - d[1] * (O[0] - M[0])) / l;
  if (otC > 0.85 * R) return false;
  const { A, B, T } = tochkiKasatelnoy(t);
  return dist(T, B) > 0.5 && dist(T, A) > 0.5 && dist(A, B) > 0.6;
}

function ogranichit(imya: string, p: T2, t: Tochki): T2 | null {
  let q: T2 = [
    Math.max(POLE[0], Math.min(POLE[2], p[0])),
    Math.max(POLE[1], Math.min(POLE[3], p[1])),
  ];
  if (imya === 'P') {
    const l = Math.hypot(q[0], q[1]) || 1;
    q = [(q[0] / l) * R, (q[1] / l) * R];
  }
  return goditsya({ ...t, [imya]: q }) ? q : null;
}

function sluchaynaya(rnd: () => number): Tochki {
  for (let i = 0; i < 300; i += 1) {
    const kuda = rnd() * 360;
    const d = R * (1.6 + rnd() * 1.0);
    const M = polar(kuda, d);
    const t: Tochki = { M, P: polar(kuda + 180 + (rnd() * 2 - 1) * 40, R) };
    if (goditsya(t)) return t;
  }
  return NACHALO;
}

const NACHALO: Tochki = { M: [-7.5, -0.8], P: polar(-15, R) };

export const KASATELNAYA: ZhivayaSkhema = {
  id: 'kasatelnaya-sekushchaya',
  nachalo: NACHALO,
  podvizhnye: ['M', 'P'],
  pole: POLE,
  postroit,
  ogranichit,
  sluchaynaya,
  shagi: ['Окружность и точка $M$ вне её', 'Секущая $MA$, точки $B$ и $A$', 'Касательная $MT$'],
  imenaRuchek: { P: 'Точка секущей на окружности' },
};
