/**
 * Схема 10. Средняя линия треугольника: определение, свойство, признак.
 *
 * M — середина AB, N — середина BC, MN — средняя линия. Для признака
 * «от противного» при подсветке показана точка N₁ на BC, отличная от
 * середины, и прямая MN₁ — она не параллельна AC. Тянутся A, B, C.
 */

import { mnog, otr, tch, ug } from '@/lib/skhemy/dsl';
import {
  chisloTeX,
  dist,
  lerp,
  mid,
  treugolnikPoUglam,
  uglyTreugolnika,
} from '@/lib/skhemy/geometriya';
import type { Element, Kadr, T2, Tochki, ZhivayaSkhema } from '@/lib/skhemy/tipy';

const POLE = [-5, -4, 12, 9] as const;

export function tochkiSredlinTreug(t: Tochki) {
  const A = t.A!;
  const B = t.B!;
  const C = t.C!;
  return { A, B, C, M: mid(A, B), N: mid(B, C), K: mid(A, C), N1: lerp(B, C, 0.7) };
}

function postroit(t: Tochki): Kadr {
  const { A, B, C, M, N, K, N1 } = tochkiSredlinTreug(t);
  /* Прямая через M параллельно AC — для признака. */
  const d: T2 = [C[0] - A[0], C[1] - A[1]];
  const P1: T2 = [M[0] - d[0] * 0.25, M[1] - d[1] * 0.25];
  const P2: T2 = [M[0] + d[0] * 0.75, M[1] + d[1] * 0.75];
  const el: Element[] = [
    mnog('f-abc', [A, B, C], { gruppy: ['podobie'], cvet: 'a' }),
    mnog('f-mbn', [M, B, N], { gruppy: ['podobie', 'chetyre'], cvet: 'b' }),
    mnog('f-amk', [A, M, K], { gruppy: ['chetyre'], cvet: 'b' }),
    mnog('f-knc', [K, N, C], { gruppy: ['chetyre'], cvet: 'b' }),
    mnog('f-mnk', [M, N, K], { gruppy: ['chetyre'], cvet: 'c' }),
    otr('AM', A, M, { shtrihi: 1, gruppy: ['opredelenie', 'podobie'], cvet: 'a' }),
    otr('MB', M, B, { shtrihi: 1, gruppy: ['opredelenie', 'podobie'], cvet: 'b' }),
    otr('BN', B, N, { shtrihi: 2, gruppy: ['opredelenie', 'podobie'], cvet: 'b' }),
    otr('NC', N, C, { shtrihi: 2, gruppy: ['opredelenie', 'podobie'], cvet: 'a' }),
    otr('AC', A, C, { gruppy: ['svoystvo', 'podobie', 'priznak'], cvet: 'a' }),
    otr('MN', M, N, {
      shag: 1,
      gruppy: ['opredelenie', 'svoystvo', 'podobie', 'priznak'],
      cvet: 'b',
    }),
    otr('MK', M, K, { skrytyy: true, stil: 'punktir', gruppy: ['chetyre'], cvet: 'c' }),
    otr('NK', N, K, { skrytyy: true, stil: 'punktir', gruppy: ['chetyre'], cvet: 'c' }),
    otr('par', P1, P2, { skrytyy: true, stil: 'punktir', gruppy: ['priznak'], cvet: 'b' }),
    otr('MN1', M, N1, { skrytyy: true, stil: 'punktir', gruppy: ['protivnoe'], cvet: 'c' }),
    ug('uA', B, A, C, { skrytyy: true, gruppy: ['svoystvo'], cvet: 'c' }),
    ug('uM', B, M, N, { skrytyy: true, gruppy: ['svoystvo'], cvet: 'c' }),
    tch('A', A),
    tch('B', B),
    tch('C', C),
    tch('M', M, { gruppy: ['opredelenie'], cvet: 'b' }),
    tch('N', N, { gruppy: ['opredelenie'], cvet: 'b' }),
    tch('K', K, { skrytyy: true, gruppy: ['chetyre'], cvet: 'c' }),
    tch('N_1', N1, { skrytyy: true, gruppy: ['protivnoe'], cvet: 'c' }),
  ];
  return {
    elementy: el,
    zametka: null,
    znacheniya: [
      `$MN = ${chisloTeX(dist(M, N))}$`,
      `$\\tfrac{AC}{2} = ${chisloTeX(dist(A, C) / 2)}$`,
    ],
  };
}

function goditsya(t: Tochki): boolean {
  if (Math.min(dist(t.A!, t.B!), dist(t.B!, t.C!), dist(t.A!, t.C!)) < 1.5) return false;
  return Math.min(...uglyTreugolnika(t.A!, t.B!, t.C!)) >= 18;
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
    const t = treugolnikPoUglam(30 + rnd() * 70, 30 + rnd() * 60, 6);
    if (goditsya(t)) return t;
  }
  return NACHALO;
}

const NACHALO: Tochki = { A: [0, 0], B: [2.4, 4.6], C: [7, 0] };

export const SREDLIN_TREUG: ZhivayaSkhema = {
  id: 'sredlin-treug',
  nachalo: NACHALO,
  podvizhnye: ['A', 'B', 'C'],
  pole: POLE,
  postroit,
  ogranichit,
  sluchaynaya,
  shagi: ['Треугольник $ABC$, середины $M$ и $N$ сторон $AB$ и $BC$', 'Средняя линия $MN$'],
};
