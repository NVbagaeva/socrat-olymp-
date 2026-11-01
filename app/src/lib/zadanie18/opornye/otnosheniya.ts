/**
 * Чертежи опорных задач №18, тема «Отношения отрезков»: теорема
 * Менелая, биссектриса и медиана. Тексты —
 * content/zadanie18/opornye/otnosheniya.ts.
 */

import { mnog, otr, tch, ug } from '@/lib/skhemy/dsl';
import { add, chisloTeX, dist, intersect, mid, sub, unit } from '@/lib/skhemy/geometriya';
import type { Element, T2, Tochki } from '@/lib/skhemy/tipy';
import { delit, goditsyaTreugolnik, scena, treugolnikNaBC, vPromezhutke } from './obshchee';

/* ── 13. Менелай: прямая из вершины через середину чевианы ────────── */

export function tochkiMenelaya(t: Tochki) {
  const A = t.A!;
  const B = t.B!;
  const C = t.C!;
  const M = delit(B, C, 2, 1);
  const K = mid(A, M);
  const N = intersect(B, K, A, C) ?? mid(A, C);
  return { A, B, C, M, K, N };
}

export const OP_MENELAY = scena({
  id: 'menelay-ploshchad',
  /* S(ABC) = 30: BC = 10, высота 6. */
  nachalo: { A: [3, 6], B: [0, 0], C: [10, 0] },
  podvizhnye: ['A', 'B', 'C'],
  pole: [-10, -10, 22, 18],
  goditsya: (t) => goditsyaTreugolnik(t.A!, t.B!, t.C!, 20, 2),
  sluchaynaya: (rnd) => treugolnikNaBC(vPromezhutke(rnd, 35, 90), vPromezhutke(rnd, 35, 85), 10),
  postroit(t) {
    const { A, B, C, M, K, N } = tochkiMenelaya(t);
    const el: Element[] = [
      mnog('f-amc', [A, M, C], { gruppy: ['men', 'amc'], cvet: 'a' }),
      mnog('f-akn', [A, K, N], { gruppy: ['akn'], cvet: 'b' }),
      mnog('f-kmcn', [K, M, C, N], { gruppy: ['itog'], cvet: 'c' }),
      otr('AB', A, B),
      otr('BC', B, C),
      otr('CA', C, A),
      otr('AM', A, M, { shag: 1 }),
      otr('AK', A, K, { skrytyy: true, shtrihi: 1, gruppy: ['men', 'akn'], cvet: 'b' }),
      otr('KM', K, M, { skrytyy: true, shtrihi: 1, gruppy: ['men'], cvet: 'b' }),
      otr('BN', B, N, { shag: 2, gruppy: ['men'], cvet: 'c' }),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('M', M, { shag: 1 }),
      tch('K', K, { shag: 1 }),
      tch('N', N, { shag: 2 }),
    ];
    return {
      elementy: el,
      zametka: null,
      znacheniya: [
        `$BM : MC = ${chisloTeX(dist(B, M) / dist(M, C))}$`,
        `$AN : NC = ${chisloTeX(dist(A, N) / dist(N, C))}$`,
      ],
    };
  },
  shagi: [
    'Треугольник $ABC$',
    'Точка $M$ на $BC$, $BM : MC = 2 : 1$; середина $K$ отрезка $AM$',
    'Прямая $BK$ пересекает $AC$ в точке $N$',
  ],
});

/* ── 14. Биссектриса и медиана ─────────────────────────────────────── */

export function tochkiBissMed(t: Tochki) {
  const A = t.A!;
  const B = t.B!;
  const C = t.C!;
  const M = mid(A, C);
  const napr = add(unit(sub(B, A)), unit(sub(C, A)));
  const L = intersect(A, add(A, napr), B, C) ?? mid(B, C);
  const P = intersect(A, L, B, M) ?? mid(B, M);
  return { A, B, C, M, L, P };
}

export const OP_BISS_MED = scena({
  id: 'bissektrisa-i-mediana',
  /* AB = 6, AC = 8, sin A = 5/6: S(ABC) = 20. */
  nachalo: { A: [0, 0], B: [Math.sqrt(11), 5], C: [8, 0] },
  podvizhnye: ['A', 'B', 'C'],
  pole: [-10, -10, 22, 18],
  goditsya: (t) => goditsyaTreugolnik(t.A!, t.B!, t.C!, 20, 2),
  sluchaynaya: (rnd) => {
    const { A, B, C } = treugolnikNaBC(vPromezhutke(rnd, 35, 85), vPromezhutke(rnd, 35, 85), 10);
    return { A: B, B: A, C } as Record<'A' | 'B' | 'C', T2>;
  },
  postroit(t) {
    const { A, B, C, M, L, P } = tochkiBissMed(t);
    const el: Element[] = [
      mnog('f-abm', [A, B, M], { gruppy: ['bis', 'abm'], cvet: 'a' }),
      mnog('f-abp', [A, B, P], { gruppy: ['abp'], cvet: 'b' }),
      otr('AB', A, B, { gruppy: ['bis'], cvet: 'a' }),
      otr('BC', B, C),
      otr('CA', C, A),
      otr('AM', A, M, { skrytyy: true, shtrihi: 1, gruppy: ['am', 'bis'], cvet: 'b' }),
      otr('MC', M, C, { skrytyy: true, shtrihi: 1, gruppy: ['am'], cvet: 'b' }),
      otr('BM', B, M, { shag: 1 }),
      otr('AL', A, L, { shag: 2, gruppy: ['bis'], cvet: 'c' }),
      ug('u1', B, A, L, { shag: 2, gruppy: ['bis'], cvet: 'c' }),
      ug('u2', L, A, C, { shag: 2, gruppy: ['bis'], cvet: 'c' }),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('M', M, { shag: 1 }),
      tch('L', L, { shag: 2 }),
      tch('P', P, { shag: 2 }),
    ];
    return {
      elementy: el,
      zametka: null,
      znacheniya: [
        `$BP : PM = ${chisloTeX(dist(B, P) / dist(P, M))}$`,
        `$2AB : AC = ${chisloTeX((2 * dist(A, B)) / dist(A, C))}$`,
      ],
    };
  },
  shagi: ['Треугольник $ABC$', 'Медиана $BM$', 'Биссектриса $AL$ пересекает медиану в точке $P$'],
});
