/**
 * Схема 8. Угол между хордами и угол между секущими — через дуги.
 *
 * Та же конструкция, что у «Двух секущих» (sekushchie.ts): точка M и
 * прямые через две ручки на окружности. M внутри круга — хорды AB и
 * CD, угол AMD равен полусумме дуг AD и BC; M снаружи — секущие,
 * угол AMD равен полуразности дуг AD и BC. Дуга XY здесь — та, что
 * не содержит двух других точек.
 */

import { duga, mnog, okr, otr, ruchka, tch, ug } from '@/lib/skhemy/dsl';
import { angleAt, angleOf, sub } from '@/lib/skhemy/geometriya';
import type { Element, Kadr, T2, Tochki, ZhivayaSkhema } from '@/lib/skhemy/tipy';
import { SEKUSHCHIE, tochkiSekushchih } from './sekushchie';

const O: T2 = [0, 0];
const R = 3;

const norm = (x: number) => ((x % 360) + 360) % 360;

/** Дуга XY, не содержащая точек Z1, Z2: начало, конец (против часовой) и величина в градусах. */
export function dugaBez(
  x: T2,
  y: T2,
  z1: T2,
  z2: T2,
): { ot: number; do: number; velichina: number } {
  const ux = angleOf(sub(x, O));
  const uy = angleOf(sub(y, O));
  const vnutri = (z: T2) => norm(angleOf(sub(z, O)) - ux) < norm(uy - ux);
  /* Против часовой от X к Y; если там лежат Z — берём от Y к X. */
  if (!vnutri(z1) && !vnutri(z2)) return { ot: ux, do: uy, velichina: norm(uy - ux) };
  return { ot: uy, do: ux, velichina: norm(ux - uy) };
}

function postroit(t: Tochki): Kadr {
  const { M, A, B, C, D, vnutri } = tochkiSekushchih(t);
  const ad = dugaBez(A, D, B, C);
  const bc = dugaBez(B, C, A, D);
  const ugol = angleAt(A, M, D);
  const el: Element[] = [
    mnog('f-bmd', [B, M, D], { gruppy: ['dok'], cvet: 'c' }),
    okr('o', O, R),
    duga('dAD', O, R, ad.ot, ad.do, { gruppy: ['hordy', 'sekushchie', 'dok'], cvet: 'a' }),
    duga('dBC', O, R, bc.ot, bc.do, { gruppy: ['hordy', 'sekushchie', 'dok'], cvet: 'b' }),
    ...(vnutri
      ? [otr('s1', A, B, { shag: 1 }), otr('s2', D, C, { shag: 2 })]
      : [otr('s1', M, A, { shag: 1 }), otr('s2', M, D, { shag: 2 })]),
    otr('BD', B, D, { skrytyy: true, stil: 'punktir', gruppy: ['dok'], cvet: 'c' }),
    ug('uM', A, M, D, { shag: 2, gruppy: ['hordy', 'sekushchie', 'dok', 'vpisannyy'], cvet: 'c' }),
    ug('uABD', A, B, D, { skrytyy: true, gruppy: ['dok', 'vpisannyy'], cvet: 'a', dugi: 2 }),
    ug('uCDB', C, D, B, { skrytyy: true, gruppy: ['dok', 'vpisannyy'], cvet: 'b', dugi: 2 }),
    ruchka('P', t.P!),
    ruchka('Q', t.Q!),
    tch('M', M),
    tch('A', A, { shag: 1 }),
    tch('B', B, { shag: 1 }),
    tch('C', C, { shag: 2 }),
    tch('D', D, { shag: 2 }),
  ];
  const formula = vnutri
    ? `$\\tfrac{${Math.round(ad.velichina)}^\\circ + ${Math.round(bc.velichina)}^\\circ}{2} = ${Math.round((ad.velichina + bc.velichina) / 2)}^\\circ$`
    : `$\\tfrac{${Math.round(ad.velichina)}^\\circ - ${Math.round(bc.velichina)}^\\circ}{2} = ${Math.round((ad.velichina - bc.velichina) / 2)}^\\circ$`;
  return {
    elementy: el,
    zametka: vnutri
      ? 'Точка $M$ внутри круга — угол между хордами: полусумма дуг.'
      : 'Точка $M$ вне круга — угол между секущими: полуразность дуг.',
    znacheniya: [
      `$\\angle AMD = ${Math.round(ugol)}^\\circ$`,
      `$\\smile AD = ${Math.round(ad.velichina)}^\\circ$`,
      `$\\smile BC = ${Math.round(bc.velichina)}^\\circ$`,
      formula,
    ],
  };
}

export const UGLY_DUGI: ZhivayaSkhema = {
  ...SEKUSHCHIE,
  id: 'ugly-i-dugi',
  nachalo: { M: [-0.6, 0.5], P: [2.6, -1.5], Q: [1.2, 2.75] },
  postroit,
  shagi: [
    'Окружность и точка $M$',
    'Прямая через $M$: точки $A$ и $B$',
    'Вторая прямая: точки $C$ и $D$, угол $AMD$',
  ],
};
