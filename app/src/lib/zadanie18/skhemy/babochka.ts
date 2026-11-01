/**
 * Схема 16. «Бабочка» в трапеции. Конструкция и ограничения — как у
 * средней линии трапеции (sredlinTrap.ts): AD ∥ BC, O — точка
 * пересечения диагоналей.
 */

import { mnog, otr, tch, ug } from '@/lib/skhemy/dsl';
import { chisloTeX, dist, intersect, orient } from '@/lib/skhemy/geometriya';
import type { Element, Kadr, T2, Tochki, ZhivayaSkhema } from '@/lib/skhemy/tipy';
import { SREDLIN_TRAP } from './sredlinTrap';

export function tochkiBabochki(t: Tochki) {
  const A = t.A!;
  const B = t.B!;
  const C = t.C!;
  const D = t.D!;
  return { A, B, C, D, O: intersect(A, C, B, D) ?? A };
}

const S = (a: T2, b: T2, c: T2) => Math.abs(orient(a, b, c)) / 2;

function postroit(t: Tochki): Kadr {
  const { A, B, C, D, O } = tochkiBabochki(t);
  const el: Element[] = [
    mnog('f-aod', [A, O, D], { gruppy: ['podobie', 'ploshchadi'], cvet: 'a' }),
    mnog('f-boc', [B, O, C], { gruppy: ['podobie', 'ploshchadi'], cvet: 'b' }),
    mnog('f-aob', [A, O, B], { gruppy: ['bokovye', 'ploshchadi'], cvet: 'c' }),
    mnog('f-cod', [C, O, D], { gruppy: ['bokovye', 'ploshchadi'], cvet: 'c' }),
    mnog('f-abd', [A, B, D], { gruppy: ['bokovye-dok'], cvet: 'a' }),
    mnog('f-acd', [A, C, D], { gruppy: ['bokovye-dok'], cvet: 'b' }),
    otr('AD', A, D, { gruppy: ['podobie'], cvet: 'a' }),
    otr('BC', B, C, { gruppy: ['podobie'], cvet: 'b' }),
    otr('AB', A, B),
    otr('CD', C, D),
    otr('AC', A, C, { shag: 1 }),
    otr('BD', B, D, { shag: 1 }),
    ug('uOAD', O, A, D, { skrytyy: true, gruppy: ['podobie'], cvet: 'a' }),
    ug('uOCB', O, C, B, { skrytyy: true, gruppy: ['podobie'], cvet: 'a' }),
    ug('uODA', O, D, A, { skrytyy: true, gruppy: ['podobie'], cvet: 'b', dugi: 2 }),
    ug('uOBC', O, B, C, { skrytyy: true, gruppy: ['podobie'], cvet: 'b', dugi: 2 }),
    tch('A', A),
    tch('B', B),
    tch('C', C),
    tch('D', D),
    tch('O', O, { shag: 1 }),
  ];
  const s1 = S(A, O, D);
  const s2 = S(B, O, C);
  const s3 = S(A, O, B);
  return {
    elementy: el,
    zametka: null,
    znacheniya: [
      `$\\tfrac{AD}{BC} = ${chisloTeX(dist(A, D) / dist(B, C))}$`,
      `$\\tfrac{AO}{OC} = ${chisloTeX(dist(A, O) / dist(O, C))}$`,
      `$S_{AOB} = S_{COD} = ${chisloTeX(s3)}$`,
      `$\\sqrt{S_{AOD}\\cdot S_{BOC}} = ${chisloTeX(Math.sqrt(s1 * s2))}$`,
    ],
  };
}

export const BABOCHKA: ZhivayaSkhema = {
  ...SREDLIN_TRAP,
  id: 'babochka',
  postroit,
  shagi: ['Трапеция $ABCD$, $AD \\parallel BC$', 'Диагонали пересекаются в точке $O$'],
};
