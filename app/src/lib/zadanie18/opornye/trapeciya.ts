/**
 * Чертежи опорных задач №18, тема «Трапеция»: «бабочка», четыре точки
 * на одной прямой, перпендикулярные диагонали. Тексты —
 * content/zadanie18/opornye/trapeciya.ts.
 */

import { mnog, otr, tch, ug } from '@/lib/skhemy/dsl';
import { angleAt, chisloTeX, dist, foot, intersect, mid, orient } from '@/lib/skhemy/geometriya';
import type { Element, T2, Tochki } from '@/lib/skhemy/tipy';
import { parametry, scena, signedS, vPromezhutke } from './obshchee';

/**
 * Трапеция по вершинам A, B, D и отношению оснований λ = BC : AD:
 * C = B + λ·(D − A), так что BC ∥ AD при любом положении вершин.
 */
export function trapeciya(t: Tochki) {
  const A = t.A!;
  const B = t.B!;
  const D = t.D!;
  const [lam] = parametry(t);
  const C: T2 = [B[0] + lam * (D[0] - A[0]), B[1] + lam * (D[1] - A[1])];
  const O = intersect(A, C, B, D) ?? mid(A, C);
  return { A, B, C, D, O };
}

/** Выпуклая трапеция без вырождения: B выше AD, углы при основании от 30° до 150°. */
function goditsyaTrapeciya(t: Tochki, minLam: number, maxLam: number): boolean {
  const [lam] = parametry(t);
  if (lam < minLam || lam > maxLam) return false;
  const { A, B, C, D } = trapeciya(t);
  const ad = dist(A, D);
  if (ad < 3) return false;
  const h = orient(A, D, B) / ad;
  if (h < 0.3 * ad || h > 1.6 * ad) return false;
  const uA = angleAt(B, A, D);
  const uD = angleAt(C, D, A);
  return uA > 30 && uA < 150 && uD > 30 && uD < 150;
}

function sluchaynayaTrapeciya(rnd: () => number, minLam: number, maxLam: number): Tochki {
  const ad = vPromezhutke(rnd, 6, 9);
  const h = ad * vPromezhutke(rnd, 0.45, 0.9);
  return {
    A: [0, 0],
    D: [ad, 0],
    B: [vPromezhutke(rnd, -0.2, 0.45) * ad, h],
    p: [vPromezhutke(rnd, minLam, maxLam), 0],
  };
}

/* ── 10. «Бабочка»: площади треугольников при диагоналях ─────────── */

export const OP_BABOCHKA = scena({
  id: 'babochka-ploshchad',
  /* AD = 6, BC = 4, высота 5: S(BOC) = 4, S(AOD) = 9. */
  nachalo: { A: [0, 0], B: [0.5, 5], D: [6, 0], p: [2 / 3, 0] },
  podvizhnye: ['A', 'B', 'D'],
  pole: [-6, -6, 16, 14],
  goditsya: (t) => goditsyaTrapeciya(t, 0.25, 0.8),
  sluchaynaya: (rnd) => sluchaynayaTrapeciya(rnd, 0.3, 0.75),
  postroit(t) {
    const { A, B, C, D, O } = trapeciya(t);
    const HB = foot(B, A, D);
    const HC = foot(C, A, D);
    const el: Element[] = [
      mnog('f-abd', [A, B, D], { gruppy: ['obsh'], cvet: 'a' }),
      mnog('f-acd', [A, C, D], { gruppy: ['obsh'], cvet: 'b' }),
      mnog('f-aob', [A, O, B], { gruppy: ['rav', 'vys'], cvet: 'b' }),
      mnog('f-cod', [C, O, D], { gruppy: ['rav', 'itog'], cvet: 'b' }),
      mnog('f-boc', [B, O, C], { gruppy: ['pod', 'itog'], cvet: 'a' }),
      mnog('f-aod', [A, O, D], { gruppy: ['pod', 'vys', 'itog'], cvet: 'a' }),
      otr('AD', A, D),
      otr('BC', B, C),
      otr('AB', A, B),
      otr('CD', C, D),
      otr('AC', A, C, { shag: 1 }),
      otr('BD', B, D, { shag: 1 }),
      otr('hB', B, HB, { skrytyy: true, stil: 'punktir', gruppy: ['obsh'], cvet: 'a' }),
      otr('hC', C, HC, { skrytyy: true, stil: 'punktir', gruppy: ['obsh'], cvet: 'b' }),
      ug('pB', B, HB, D, { pryamoy: true, skrytyy: true, gruppy: ['obsh'], cvet: 'a' }),
      ug('pC', C, HC, A, { pryamoy: true, skrytyy: true, gruppy: ['obsh'], cvet: 'b' }),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('D', D),
      tch('O', O, { shag: 1 }),
    ];
    return {
      elementy: el,
      zametka: null,
      znacheniya: [
        `$S_{AOB} : S_{COD} = ${chisloTeX(Math.abs(signedS([A, O, B]) / signedS([C, O, D])))}$`,
      ],
    };
  },
  shagi: ['Трапеция $ABCD$, $BC \\parallel AD$', 'Диагонали пересекаются в точке $O$'],
});

/* ── 11. Четыре точки трапеции на одной прямой ─────────────────────── */

export function tochkiChetyreh(t: Tochki) {
  const { A, B, C, D, O } = trapeciya(t);
  const P = intersect(A, B, D, C) ?? mid(B, C);
  return { A, B, C, D, O, P, M: mid(B, C), N: mid(A, D) };
}

/* AD = 6, BC = 2, MN = 4: N(3; 0), M = N + 4·(cos 70°; sin 70°). */
const M11: T2 = [3 + 4 * Math.cos((70 * Math.PI) / 180), 4 * Math.sin((70 * Math.PI) / 180)];

export const OP_CHETYRE = scena({
  id: 'chetyre-tochki-trapecii',
  nachalo: { A: [0, 0], B: [M11[0] - 1, M11[1]], D: [6, 0], p: [1 / 3, 0] },
  podvizhnye: ['A', 'B', 'D'],
  pole: [-8, -6, 18, 16],
  goditsya: (t) => goditsyaTrapeciya(t, 0.2, 0.7),
  sluchaynaya: (rnd) => sluchaynayaTrapeciya(rnd, 0.25, 0.6),
  postroit(t) {
    const { A, B, C, D, O, P, M, N } = tochkiChetyreh(t);
    const el: Element[] = [
      mnog('f-pbc', [P, B, C], { gruppy: ['p'], cvet: 'b' }),
      mnog('f-pad', [P, A, D], { gruppy: ['p'], cvet: 'a' }),
      mnog('f-boc', [B, O, C], { gruppy: ['o'], cvet: 'b' }),
      mnog('f-doa', [D, O, A], { gruppy: ['o'], cvet: 'a' }),
      otr('AD', A, D),
      otr('BC', B, C),
      otr('AB', A, B),
      otr('CD', C, D),
      otr('BP', B, P, { shag: 1, stil: 'prodolzhenie' }),
      otr('CP', C, P, { shag: 1, stil: 'prodolzhenie' }),
      otr('AC', A, C, { shag: 2 }),
      otr('BD', B, D, { shag: 2 }),
      otr('BM', B, M, { skrytyy: true, shtrihi: 1, gruppy: ['p', 'o'], cvet: 'b' }),
      otr('MC', M, C, { skrytyy: true, shtrihi: 1, gruppy: ['p', 'o'], cvet: 'b' }),
      otr('AN', A, N, { skrytyy: true, shtrihi: 2, gruppy: ['p', 'o'], cvet: 'a' }),
      otr('ND', N, D, { skrytyy: true, shtrihi: 2, gruppy: ['p', 'o'], cvet: 'a' }),
      otr('PN', P, N, { shag: 3, stil: 'punktir', gruppy: ['p', 'o', 'itog'], cvet: 'c' }),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('D', D),
      tch('P', P, { shag: 1 }),
      tch('O', O, { shag: 2 }),
      tch('M', M, { shag: 3 }),
      tch('N', N, { shag: 3 }),
    ];
    return {
      elementy: el,
      zametka: null,
      znacheniya: [
        `$BC : AD = ${chisloTeX(dist(B, C) / dist(A, D))}$`,
        `$PM : PN = ${chisloTeX(dist(P, M) / dist(P, N))}$`,
        `$MO : ON = ${chisloTeX(dist(M, O) / dist(O, N))}$`,
      ],
    };
  },
  shagi: [
    'Трапеция $ABCD$, $BC \\parallel AD$',
    'Продолжения боковых сторон пересекаются в точке $P$',
    'Диагонали пересекаются в точке $O$',
    'Середины оснований $M$ и $N$ и прямая $PN$',
  ],
});

/* ── 12. Равнобедренная трапеция с перпендикулярными диагоналями ──── */

export function tochkiPerpDiag(t: Tochki) {
  const [a, b] = parametry(t);
  const h = (a + b) / 2;
  const A: T2 = [-a / 2, 0];
  const D: T2 = [a / 2, 0];
  const B: T2 = [-b / 2, h];
  const C: T2 = [b / 2, h];
  const O = intersect(A, C, B, D) ?? [0, h / 2];
  return { A, B, C, D, O, P: foot(O, A, D), Q: foot(O, B, C), H: foot(B, A, D) };
}

export const OP_PERP_DIAG = scena({
  id: 'perpendikulyarnye-diagonali',
  /* BC = √10, AD = 2√10: боковая сторона 5. */
  nachalo: { p: [2 * Math.sqrt(10), Math.sqrt(10)] },
  goditsya: (t) => {
    const [a, b] = parametry(t);
    return a > 0 && b > 0.15 * a && b < 0.8 * a;
  },
  sluchaynaya: (rnd) => {
    const a = vPromezhutke(rnd, 6, 9);
    return { p: [a, a * vPromezhutke(rnd, 0.2, 0.7)] };
  },
  postroit(t) {
    const { A, B, C, D, O, P, Q, H } = tochkiPerpDiag(t);
    const el: Element[] = [
      mnog('f-abcd', [A, B, C, D], { gruppy: ['pl'], cvet: 'c' }),
      mnog('f-aod', [A, O, D], { gruppy: ['pr', 'vys'], cvet: 'a' }),
      mnog('f-boc', [B, O, C], { gruppy: ['pr', 'vys'], cvet: 'b' }),
      mnog('f-abh', [A, B, H], { gruppy: ['ah'], cvet: 'b' }),
      otr('AD', A, D),
      otr('BC', B, C),
      otr('AB', A, B, { gruppy: ['ah'], cvet: 'b' }),
      otr('CD', C, D),
      otr('AC', A, C, { shag: 1 }),
      otr('BD', B, D, { shag: 1 }),
      ug('uO', A, O, D, { pryamoy: true, shag: 1, gruppy: ['pr'], cvet: 'b' }),
      ug('uOAD', O, A, D, { skrytyy: true, gruppy: ['pr'], cvet: 'a' }),
      ug('uODA', O, D, A, { skrytyy: true, gruppy: ['pr'], cvet: 'a' }),
      otr('PQ', P, Q, { shag: 2, stil: 'punktir', gruppy: ['vys', 'pl'], cvet: 'c' }),
      ug('uP', O, P, D, { pryamoy: true, shag: 2 }),
      otr('BH', B, H, { skrytyy: true, stil: 'punktir', gruppy: ['ah'], cvet: 'b' }),
      ug('uH', B, H, D, { pryamoy: true, skrytyy: true, gruppy: ['ah'], cvet: 'b' }),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('D', D),
      tch('O', O, { shag: 1 }),
      tch('P', P, { shag: 2 }),
      tch('Q', Q, { shag: 2 }),
      tch('H', H, { skrytyy: true, gruppy: ['ah'], cvet: 'b' }),
    ];
    const h = dist(P, Q);
    return {
      elementy: el,
      zametka: null,
      znacheniya: [
        `$\\angle AOD = ${chisloTeX(angleAt(A, O, D), 1)}^\\circ$`,
        `$PQ : \\dfrac{AD + BC}{2} = ${chisloTeX(h / ((dist(A, D) + dist(B, C)) / 2))}$`,
      ],
    };
  },
  shagi: [
    'Равнобедренная трапеция $ABCD$',
    'Диагонали перпендикулярны и пересекаются в точке $O$',
    'Высота $PQ$ через точку $O$',
  ],
});
