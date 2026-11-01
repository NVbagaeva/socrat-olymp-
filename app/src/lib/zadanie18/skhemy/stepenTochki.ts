/**
 * Схема 24. Степень точки относительно окружности.
 *
 * Окружность (O, R) неподвижна. Тянутся точка M (внутри или вне круга)
 * и ручка P на окружности: прямая MP пересекает окружность в A и B.
 * Вне круга — касательная MT; через центр — прямая с концами U, V.
 */

import { okr, otr, ruchka, tch, ug } from '@/lib/skhemy/dsl';
import {
  add,
  chisloTeX,
  dist,
  lineCircle,
  mul,
  polar,
  sub,
  tangentPoints,
  unit,
} from '@/lib/skhemy/geometriya';
import type { Element, Kadr, T2, Tochki, ZhivayaSkhema } from '@/lib/skhemy/tipy';

const O: T2 = [0, 0];
const R = 3;
const POLE = [-12, -10, 12, 10] as const;

export function tochkiStepeni(t: Tochki) {
  const M = t.M!;
  const per = lineCircle(M, t.P!, { c: O, r: R });
  const A = per.length === 2 ? per[0]!.p : t.P!;
  const B = per.length === 2 ? per[1]!.p : t.P!;
  const d = dist(M, O);
  const u = d < 1e-9 ? ([1, 0] as T2) : unit(sub(M, O));
  /* U — ближний к M конец диаметра через M, V — дальний. */
  const U = add(O, mul(u, R));
  const V = add(O, mul(u, -R));
  const kas = d > R ? tangentPoints(M, { c: O, r: R }) : null;
  return { M, A, B, U, V, T: kas === null ? null : kas[0], d, vne: d > R };
}

function postroit(t: Tochki): Kadr {
  const { M, A, B, U, V, T, d, vne } = tochkiStepeni(t);
  const el: Element[] = [
    okr('o', O, R),
    otr('AB', vne ? M : A, vne ? (dist(M, A) > dist(M, B) ? A : B) : B, {
      gruppy: ['proizv', 'opredelenie'],
      cvet: 'a',
    }),
    otr('UV', vne ? M : U, V, { stil: 'punktir', gruppy: ['diametr', 'opredelenie'], cvet: 'b' }),
    ...(T === null
      ? []
      : [
          otr('MT', M, T, { gruppy: ['kasatelnaya'], cvet: 'c' }),
          otr('OT', O, T, { skrytyy: true, stil: 'punktir', gruppy: ['kasatelnaya'], cvet: 'c' }),
          ug('pT', O, T, M, { pryamoy: true, skrytyy: true, gruppy: ['kasatelnaya'], cvet: 'c' }),
          tch('T', T, { gruppy: ['kasatelnaya'], cvet: 'c' }),
        ]),
    ruchka('P', t.P!),
    tch('O', O),
    tch('M', M),
    tch('A', A, { gruppy: ['proizv'], cvet: 'a' }),
    tch('B', B, { gruppy: ['proizv'], cvet: 'a' }),
    tch('U', U, { skrytyy: true, gruppy: ['diametr'], cvet: 'b' }),
    tch('V', V, { skrytyy: true, gruppy: ['diametr'], cvet: 'b' }),
  ];
  const st = d * d - R * R;
  return {
    elementy: el,
    zametka: vne
      ? 'Точка $M$ вне окружности: степень положительна и равна квадрату касательной.'
      : 'Точка $M$ внутри окружности: степень отрицательна, $MA\\cdot MB = R^2 - MO^2$.',
    znacheniya: [
      `$MO^2 - R^2 = ${chisloTeX(st)}$`,
      `$MA\\cdot MB = ${chisloTeX(dist(M, A) * dist(M, B))}$`,
      ...(T === null ? [] : [`$MT^2 = ${chisloTeX(dist(M, T) ** 2)}$`]),
    ],
  };
}

function goditsya(t: Tochki): boolean {
  const M = t.M!;
  const d = dist(M, O);
  if (Math.abs(d - R) < 0.4 || d < 0.3) return false;
  const v = sub(t.P!, M);
  const l = Math.hypot(v[0], v[1]);
  if (l < 0.3) return false;
  const otC = Math.abs(v[0] * (O[1] - M[1]) - v[1] * (O[0] - M[0])) / l;
  return otC < 0.88 * R;
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
    const vne = rnd() < 0.6;
    const M = polar(kuda, vne ? R * (1.4 + rnd()) : R * (0.25 + rnd() * 0.5));
    const t: Tochki = { M, P: polar(kuda + 180 + (rnd() * 2 - 1) * 45, R) };
    if (goditsya(t)) return t;
  }
  return NACHALO;
}

const NACHALO: Tochki = { M: [-6.8, 1.6], P: polar(-60, R) };

export const STEPEN_TOCHKI: ZhivayaSkhema = {
  id: 'stepen-tochki',
  nachalo: NACHALO,
  podvizhnye: ['M', 'P'],
  pole: POLE,
  postroit,
  ogranichit,
  sluchaynaya,
  shagi: ['Окружность с центром $O$, точка $M$ и прямая через $M$'],
  imenaRuchek: { P: 'Точка прямой на окружности' },
};
