/**
 * Схема 17. Замечательное свойство трапеции: точка пересечения
 * диагоналей O, точка пересечения продолжений боковых сторон P и
 * середины оснований E (BC) и F (AD) лежат на одной прямой.
 */

import { mnog, otr, tch } from '@/lib/skhemy/dsl';
import { add, intersect, mid, mul, sub } from '@/lib/skhemy/geometriya';
import type { Element, Kadr, Tochki, ZhivayaSkhema } from '@/lib/skhemy/tipy';
import { SREDLIN_TRAP } from './sredlinTrap';

export function tochkiChetyreh(t: Tochki) {
  const A = t.A!;
  const B = t.B!;
  const C = t.C!;
  const D = t.D!;
  return {
    A,
    B,
    C,
    D,
    O: intersect(A, C, B, D) ?? A,
    P: intersect(A, B, D, C) ?? B,
    E: mid(B, C),
    F: mid(A, D),
  };
}

function postroit(t: Tochki): Kadr {
  const { A, B, C, D, O, P, E, F } = tochkiChetyreh(t);
  const el: Element[] = [
    mnog('f-pbe', [P, B, E], { gruppy: ['p'], cvet: 'b' }),
    mnog('f-paf', [P, A, F], { gruppy: ['p'], cvet: 'a' }),
    mnog('f-boe', [B, O, E], { gruppy: ['o'], cvet: 'b' }),
    mnog('f-dof', [D, O, F], { gruppy: ['o'], cvet: 'a' }),
    otr('AD', A, D),
    otr('BC', B, C),
    otr('AB', A, B),
    otr('CD', C, D),
    otr('BP', B, P, { shag: 1, stil: 'prodolzhenie' }),
    otr('CP', C, P, { shag: 1, stil: 'prodolzhenie' }),
    otr('AC', A, C, { shag: 2, stil: 'punktir' }),
    otr('BD', B, D, { shag: 2, stil: 'punktir' }),
    otr('PF', P, F, { shag: 3, gruppy: ['pryamaya', 'p', 'o'], cvet: 'c' }),
    otr('BE', B, E, { shtrihi: 1 }),
    otr('EC', E, C, { shtrihi: 1 }),
    otr('AF', A, F, { shtrihi: 2 }),
    otr('FD', F, D, { shtrihi: 2 }),
    tch('A', A),
    tch('B', B),
    tch('C', C),
    tch('D', D),
    tch('P', P, { shag: 1, gruppy: ['pryamaya', 'p'], cvet: 'c' }),
    tch('O', O, { shag: 2, gruppy: ['pryamaya', 'o'], cvet: 'c' }),
    tch('E', E, { gruppy: ['pryamaya', 'p', 'o'], cvet: 'c' }),
    tch('F', F, { gruppy: ['pryamaya', 'p', 'o'], cvet: 'c' }),
  ];
  return { elementy: el, zametka: null, znacheniya: [] };
}

/** Боковые стороны должны сходиться не слишком далеко: P в разумном поле. */
function goditsyaP(t: Tochki): boolean {
  const { P, A, D } = tochkiChetyreh(t);
  const c = mul(add(A, D), 0.5);
  const d = sub(P, c);
  return Math.hypot(d[0], d[1]) < 14;
}

export const CHETYRE_TOCHKI: ZhivayaSkhema = {
  ...SREDLIN_TRAP,
  id: 'chetyre-tochki',
  postroit,
  ogranichit: (imya, p, t) => {
    const q = SREDLIN_TRAP.ogranichit(imya, p, t);
    return q !== null && goditsyaP({ ...t, [imya]: q }) ? q : null;
  },
  prisposobit: (novye, prezhnie, imya) => {
    const s = SREDLIN_TRAP.prisposobit!(novye, prezhnie, imya);
    return s !== null && goditsyaP(s) ? s : null;
  },
  sluchaynaya: (rnd) => {
    for (let i = 0; i < 100; i += 1) {
      const t = SREDLIN_TRAP.sluchaynaya(rnd);
      if (goditsyaP(t)) return t;
    }
    return SREDLIN_TRAP.nachalo;
  },
  shagi: [
    'Трапеция $ABCD$ и середины оснований $E$ и $F$',
    'Продолжения боковых сторон пересекаются в $P$',
    'Диагонали пересекаются в $O$',
    'Прямая $PF$ проходит через $O$ и $E$',
  ],
};
