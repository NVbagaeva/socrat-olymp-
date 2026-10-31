/**
 * Схема 19. Теоремы Менелая и Чевы.
 *
 * Треугольник ABC. Менелай: прямая через C₁ на AB и A₁ на BC
 * пересекает продолжение AC в B₁ (ручки — C₁ и A₁, скользят по
 * сторонам). Чева: точка P внутри треугольника, чевианы AA₂, BB₂, CC₂.
 * Пока тянут вершины, C₁ и A₁ сохраняют доли на сторонах, а P —
 * барицентрические координаты.
 */

import { mnog, otr, tch } from '@/lib/skhemy/dsl';
import {
  chisloTeX,
  dist,
  intersect,
  lerp,
  orient,
  projT,
  treugolnikPoUglam,
  uglyTreugolnika,
} from '@/lib/skhemy/geometriya';
import type { Element, Kadr, T2, Tochki, ZhivayaSkhema } from '@/lib/skhemy/tipy';

const POLE = [-6, -5, 14, 9] as const;

export function tochkiMenelaya(t: Tochki) {
  const A = t.A!;
  const B = t.B!;
  const C = t.C!;
  const C1 = t.C1!;
  const A1 = t.A1!;
  const B1 = intersect(C1, A1, A, C) ?? C;
  const P = t.P!;
  return {
    A,
    B,
    C,
    C1,
    A1,
    B1,
    P,
    A2: intersect(A, P, B, C) ?? B,
    B2: intersect(B, P, A, C) ?? C,
    C2: intersect(C, P, A, B) ?? A,
  };
}

function postroit(t: Tochki): Kadr {
  const { A, B, C, C1, A1, B1, P, A2, B2, C2 } = tochkiMenelaya(t);
  const daleko = dist(C, B1) < dist(A, B1) ? C : A;
  const el: Element[] = [
    mnog('f-apc', [A, P, C], { gruppy: ['cheva-dok'], cvet: 'a' }),
    mnog('f-bpc', [B, P, C], { gruppy: ['cheva-dok'], cvet: 'b' }),
    otr('AB', A, B),
    otr('BC', B, C),
    otr('CA', C, A),
    otr('CB1', daleko, B1, { stil: 'prodolzhenie', gruppy: ['menelay'] }),
    otr('men', C1, B1, { gruppy: ['menelay', 'menelay-dok'], cvet: 'b' }),
    otr('AA2', A, A2, { skrytyy: true, gruppy: ['cheva', 'cheva-dok'], cvet: 'a' }),
    otr('BB2', B, B2, { skrytyy: true, gruppy: ['cheva', 'cheva-dok'], cvet: 'a' }),
    otr('CC2', C, C2, { skrytyy: true, gruppy: ['cheva', 'cheva-dok'], cvet: 'a' }),
    tch('A', A, { gruppy: ['menelay'], cvet: 'a' }),
    tch('B', B, { gruppy: ['menelay'], cvet: 'a' }),
    tch('C', C, { gruppy: ['menelay'], cvet: 'a' }),
    tch('C_1', C1, { ruchka: 'C1', gruppy: ['menelay'], cvet: 'b' }),
    tch('A_1', A1, { ruchka: 'A1', gruppy: ['menelay'], cvet: 'b' }),
    tch('B_1', B1, { gruppy: ['menelay'], cvet: 'b' }),
    tch('P', P, { skrytyy: true, ruchka: 'P', gruppy: ['cheva', 'cheva-dok'], cvet: 'a' }),
    tch('A_2', A2, { skrytyy: true, gruppy: ['cheva'], cvet: 'a' }),
    tch('B_2', B2, { skrytyy: true, gruppy: ['cheva'], cvet: 'a' }),
    tch('C_2', C2, { skrytyy: true, gruppy: ['cheva'], cvet: 'a' }),
  ];
  const men =
    (dist(A, C1) / dist(C1, B)) * (dist(B, A1) / dist(A1, C)) * (dist(C, B1) / dist(B1, A));
  const che =
    (dist(A, C2) / dist(C2, B)) * (dist(B, A2) / dist(A2, C)) * (dist(C, B2) / dist(B2, A));
  return {
    elementy: el,
    zametka: null,
    znacheniya: [
      `Менелай: $\\tfrac{AC_1}{C_1B}\\cdot\\tfrac{BA_1}{A_1C}\\cdot\\tfrac{CB_1}{B_1A} = ${chisloTeX(men)}$`,
      `Чева: $\\tfrac{AC_2}{C_2B}\\cdot\\tfrac{BA_2}{A_2C}\\cdot\\tfrac{CB_2}{B_2A} = ${chisloTeX(che)}$`,
    ],
  };
}

function goditsya(t: Tochki): boolean {
  const { A, B, C, C1, A1, B1, P } = tochkiMenelaya(t);
  if (Math.min(dist(A, B), dist(B, C), dist(A, C)) < 2) return false;
  /* Вершины в поле: иначе ручка вершины упрётся в край, не дойдя до точки. */
  const vPole = (p: T2) => p[0] >= POLE[0] && p[0] <= POLE[2] && p[1] >= POLE[1] && p[1] <= POLE[3];
  if (![A, B, C].every(vPole)) return false;
  if (Math.min(...uglyTreugolnika(A, B, C)) < 20) return false;
  const tc = projT(C1, A, B);
  const ta = projT(A1, B, C);
  if (tc < 0.15 || tc > 0.85 || ta < 0.15 || ta > 0.85) return false;
  /* B₁ на продолжении AC, не слишком далеко; прямая не параллельна AC. */
  const tb = projT(B1, A, C);
  if (tb > 0 && tb < 1) return false;
  if (dist(B1, A) > 3.2 * dist(A, C)) return false;
  /* P внутри треугольника с запасом. */
  const s = orient(A, B, C);
  const w = [orient(P, B, C) / s, orient(A, P, C) / s, orient(A, B, P) / s];
  return w.every((x) => x > 0.12);
}

function ogranichit(imya: string, p: T2, t: Tochki): T2 | null {
  let q: T2 = [
    Math.max(POLE[0], Math.min(POLE[2], p[0])),
    Math.max(POLE[1], Math.min(POLE[3], p[1])),
  ];
  if (imya === 'C1') q = lerp(t.A!, t.B!, Math.max(0, Math.min(1, projT(q, t.A!, t.B!))));
  if (imya === 'A1') q = lerp(t.B!, t.C!, Math.max(0, Math.min(1, projT(q, t.B!, t.C!))));
  return goditsya({ ...t, [imya]: q }) ? q : null;
}

/** Тянут вершину — C₁, A₁ сохраняют доли на сторонах, P — барицентрические координаты. */
function prisposobit(novye: Tochki, prezhnie: Tochki, imya: string): Tochki | null {
  if (!['A', 'B', 'C'].includes(imya)) return novye;
  const tc = projT(prezhnie.C1!, prezhnie.A!, prezhnie.B!);
  const ta = projT(prezhnie.A1!, prezhnie.B!, prezhnie.C!);
  const s = orient(prezhnie.A!, prezhnie.B!, prezhnie.C!);
  const P0 = prezhnie.P!;
  const w = [
    orient(P0, prezhnie.B!, prezhnie.C!) / s,
    orient(prezhnie.A!, P0, prezhnie.C!) / s,
    orient(prezhnie.A!, prezhnie.B!, P0) / s,
  ];
  const A = novye.A!;
  const B = novye.B!;
  const C = novye.C!;
  const nov = {
    ...novye,
    C1: lerp(A, B, tc),
    A1: lerp(B, C, ta),
    P: [
      w[0]! * A[0] + w[1]! * B[0] + w[2]! * C[0],
      w[0]! * A[1] + w[1]! * B[1] + w[2]! * C[1],
    ] as T2,
  };
  return goditsya(nov) ? nov : null;
}

function sluchaynaya(rnd: () => number): Tochki {
  for (let i = 0; i < 400; i += 1) {
    const tr = treugolnikPoUglam(35 + rnd() * 60, 35 + rnd() * 50, 6);
    const w = [0.2 + rnd(), 0.2 + rnd(), 0.2 + rnd()];
    const sw = w[0]! + w[1]! + w[2]!;
    const t: Tochki = {
      ...tr,
      C1: lerp(tr.A, tr.B, 0.2 + rnd() * 0.6),
      A1: lerp(tr.B, tr.C, 0.2 + rnd() * 0.6),
      P: [
        (w[0]! * tr.A[0] + w[1]! * tr.B[0] + w[2]! * tr.C[0]) / sw,
        (w[0]! * tr.A[1] + w[1]! * tr.B[1] + w[2]! * tr.C[1]) / sw,
      ],
    };
    if (goditsya(t)) return t;
  }
  return NACHALO;
}

const TR = { A: [0, 0] as T2, B: [2.4, 4.4] as T2, C: [6.4, 0] as T2 };
const NACHALO: Tochki = {
  ...TR,
  C1: lerp(TR.A, TR.B, 0.55),
  A1: lerp(TR.B, TR.C, 0.3),
  P: [2.9, 1.5],
};

export const MENELAY: ZhivayaSkhema = {
  id: 'menelay-cheva',
  nachalo: NACHALO,
  podvizhnye: ['A', 'B', 'C', 'C1', 'A1', 'P'],
  pole: POLE,
  postroit,
  ogranichit,
  prisposobit,
  sluchaynaya,
  shagi: ['Треугольник $ABC$ и прямая через $C_1$ и $A_1$, пересекающая продолжение $AC$ в $B_1$'],
  imenaRuchek: {
    C1: 'Точка C₁ на стороне AB',
    A1: 'Точка A₁ на стороне BC',
    P: 'Точка пересечения чевиан',
  },
};
