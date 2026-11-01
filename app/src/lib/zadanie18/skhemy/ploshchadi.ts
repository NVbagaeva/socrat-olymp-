/**
 * Схемы 20–23 — площади треугольников: метод площадей, общая высота
 * (чевиана, медианы), общий угол, «рельсы Евклида».
 */

import { mnog, okr, otr, tch, ug } from '@/lib/skhemy/dsl';
import {
  chisloTeX,
  dist,
  foot,
  incircle,
  lerp,
  mid,
  orient,
  projT,
  treugolnikPoUglam,
  uglyTreugolnika,
} from '@/lib/skhemy/geometriya';
import type { Element, Kadr, T2, Tochki, ZhivayaSkhema } from '@/lib/skhemy/tipy';

const POLE = [-6, -5, 13, 9] as const;
export const S = (a: T2, b: T2, c: T2) => Math.abs(orient(a, b, c)) / 2;
const vPole = (p: T2): T2 => [
  Math.max(POLE[0], Math.min(POLE[2], p[0])),
  Math.max(POLE[1], Math.min(POLE[3], p[1])),
];

function treugolnikGoditsya(t: Tochki, minUgol = 20): boolean {
  if (Math.min(dist(t.A!, t.B!), dist(t.B!, t.C!), dist(t.A!, t.C!)) < 1.5) return false;
  return Math.min(...uglyTreugolnika(t.A!, t.B!, t.C!)) >= minUgol;
}

/* ── 20. Метод площадей ─────────────────────────────────────────── */

export function tochkiMetoda(t: Tochki) {
  const A = t.A!;
  const B = t.B!;
  const C = t.C!;
  const vp = incircle(A, B, C);
  return { A, B, C, Ha: foot(A, B, C), Hb: foot(B, A, C), I: vp.c, r: vp.r };
}

export const METOD_PLOSHCHADEY: ZhivayaSkhema = {
  id: 'metod-ploshchadey',
  nachalo: { A: [0, 0], B: [2.2, 4.4], C: [6.6, 0] },
  podvizhnye: ['A', 'B', 'C'],
  pole: POLE,
  postroit(t): Kadr {
    const { A, B, C, Ha, Hb, I, r } = tochkiMetoda(t);
    const el: Element[] = [
      mnog('f', [A, B, C], { gruppy: ['dva-sposoba'], cvet: 'a' }),
      mnog('f-aib', [A, I, B], { gruppy: ['r'], cvet: 'a' }),
      mnog('f-bic', [B, I, C], { gruppy: ['r'], cvet: 'b' }),
      mnog('f-cia', [C, I, A], { gruppy: ['r'], cvet: 'c' }),
      okr('vp', I, r, { skrytyy: true, gruppy: ['r'], cvet: 'c' }),
      otr('AB', A, B),
      otr('BC', B, C, { gruppy: ['dva-sposoba'], cvet: 'a' }),
      otr('CA', C, A, { gruppy: ['dva-sposoba'], cvet: 'b' }),
      otr('AHa', A, Ha, { shag: 1, stil: 'punktir', gruppy: ['dva-sposoba'], cvet: 'a' }),
      otr('BHb', B, Hb, { shag: 1, stil: 'punktir', gruppy: ['dva-sposoba'], cvet: 'b' }),
      ug('pHa', A, Ha, C, { pryamoy: true, shag: 1 }),
      ug('pHb', B, Hb, C, { pryamoy: true, shag: 1 }),
      otr('IA', I, A, { skrytyy: true, stil: 'punktir', gruppy: ['r'] }),
      otr('IB', I, B, { skrytyy: true, stil: 'punktir', gruppy: ['r'] }),
      otr('IC', I, C, { skrytyy: true, stil: 'punktir', gruppy: ['r'] }),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('H_a', Ha, { shag: 1 }),
      tch('H_b', Hb, { shag: 1 }),
      tch('I', I, { skrytyy: true, gruppy: ['r'], cvet: 'c' }),
    ];
    const ploshch = S(A, B, C);
    return {
      elementy: el,
      zametka: null,
      znacheniya: [
        `$BC\\cdot AH_a = ${chisloTeX(dist(B, C) * dist(A, Ha))}$`,
        `$AC\\cdot BH_b = ${chisloTeX(dist(A, C) * dist(B, Hb))}$`,
        `$r = ${chisloTeX(r)}$`,
        `$\\tfrac{2S}{a + b + c} = ${chisloTeX((2 * ploshch) / (dist(A, B) + dist(B, C) + dist(A, C)))}$`,
      ],
    };
  },
  ogranichit(imya, p, t) {
    const q = vPole(p);
    return treugolnikGoditsya({ ...t, [imya]: q }) ? q : null;
  },
  sluchaynaya(rnd) {
    for (let i = 0; i < 200; i += 1) {
      const t = treugolnikPoUglam(30 + rnd() * 70, 30 + rnd() * 60, 6);
      if (treugolnikGoditsya(t)) return t;
    }
    return METOD_PLOSHCHADEY.nachalo;
  },
  shagi: ['Треугольник $ABC$', 'Высоты $AH_a$ и $BH_b$ — площадь двумя способами'],
};

/* ── 21. Общая высота: чевиана, медианы ─────────────────────────── */

export function tochkiVysoty(t: Tochki) {
  const A = t.A!;
  const B = t.B!;
  const C = t.C!;
  const Ma = mid(B, C);
  const Mb = mid(A, C);
  const Mc = mid(A, B);
  const G: T2 = [(A[0] + B[0] + C[0]) / 3, (A[1] + B[1] + C[1]) / 3];
  return { A, B, C, D: t.D!, H: foot(A, B, C), Ma, Mb, Mc, G };
}

export const OBSHCHAYA_VYSOTA: ZhivayaSkhema = {
  id: 'obshchaya-vysota',
  nachalo: { A: [1.6, 4.6], B: [0, 0], C: [7, 0], D: [2.6, 0] },
  podvizhnye: ['A', 'B', 'C', 'D'],
  pole: POLE,
  postroit(t): Kadr {
    const { A, B, C, D, H, Ma, Mb, Mc, G } = tochkiVysoty(t);
    const shest: [T2, T2, T2][] = [
      [G, B, Ma],
      [G, Ma, C],
      [G, C, Mb],
      [G, Mb, A],
      [G, A, Mc],
      [G, Mc, B],
    ];
    const el: Element[] = [
      mnog('f-abd', [A, B, D], { gruppy: ['cheviana'], cvet: 'a' }),
      mnog('f-adc', [A, D, C], { gruppy: ['cheviana'], cvet: 'b' }),
      mnog('f-abm', [A, B, Ma], { gruppy: ['mediana'], cvet: 'a' }),
      mnog('f-amc', [A, Ma, C], { gruppy: ['mediana'], cvet: 'b' }),
      ...shest.map((tr, i) =>
        mnog(`f6-${i}`, tr, { gruppy: ['shest'], cvet: i % 2 === 0 ? 'a' : 'b' }),
      ),
      otr('AB', A, B),
      otr('BC', B, C),
      otr('CA', C, A),
      otr('AD', A, D, { shag: 1, gruppy: ['cheviana'], cvet: 'c' }),
      otr('BD', B, D, { skrytyy: true, gruppy: ['cheviana'], cvet: 'a' }),
      otr('DC', D, C, { skrytyy: true, gruppy: ['cheviana'], cvet: 'b' }),
      otr('AH', A, H, { skrytyy: true, stil: 'punktir', gruppy: ['cheviana', 'mediana'] }),
      ug('pH', A, H, C, { pryamoy: true, skrytyy: true, gruppy: ['cheviana', 'mediana'] }),
      otr('AMa', A, Ma, { skrytyy: true, gruppy: ['mediana', 'shest'], cvet: 'c' }),
      otr('BMb', B, Mb, { skrytyy: true, gruppy: ['shest'], cvet: 'c' }),
      otr('CMc', C, Mc, { skrytyy: true, gruppy: ['shest'], cvet: 'c' }),
      otr('BMa', B, Ma, { skrytyy: true, shtrihi: 1, gruppy: ['mediana', 'shest'], cvet: 'a' }),
      otr('MaC', Ma, C, { skrytyy: true, shtrihi: 1, gruppy: ['mediana', 'shest'], cvet: 'b' }),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('D', D, { shag: 1, ruchka: 'D', gruppy: ['cheviana'], cvet: 'c' }),
      tch('M', Ma, { skrytyy: true, gruppy: ['mediana', 'shest'], cvet: 'c' }),
      tch('G', G, { skrytyy: true, gruppy: ['shest'], cvet: 'c' }),
    ];
    return {
      elementy: el,
      zametka: null,
      znacheniya: [
        `$\\tfrac{S_{ABD}}{S_{ADC}} = ${chisloTeX(S(A, B, D) / S(A, D, C))}$`,
        `$\\tfrac{BD}{DC} = ${chisloTeX(dist(B, D) / dist(D, C))}$`,
      ],
    };
  },
  ogranichit(imya, p, t) {
    let q = vPole(p);
    if (imya === 'D') q = lerp(t.B!, t.C!, Math.max(0.12, Math.min(0.88, projT(q, t.B!, t.C!))));
    /* Точку D после сдвига вершины ставит на место prisposobit. */
    return treugolnikGoditsya({ ...t, [imya]: q }) ? q : null;
  },
  prisposobit(novye, prezhnie, imya) {
    if (imya === 'D') return novye;
    const k = projT(prezhnie.D!, prezhnie.B!, prezhnie.C!);
    return { ...novye, D: lerp(novye.B!, novye.C!, k) };
  },
  sluchaynaya(rnd) {
    for (let i = 0; i < 200; i += 1) {
      const tr = treugolnikPoUglam(30 + rnd() * 70, 30 + rnd() * 60, 6);
      /* Здесь основание — BC: переименуем вершины. */
      const t: Tochki = { A: tr.B, B: tr.A, C: tr.C, D: lerp(tr.A, tr.C, 0.2 + rnd() * 0.6) };
      if (treugolnikGoditsya(t)) return t;
    }
    return OBSHCHAYA_VYSOTA.nachalo;
  },
  shagi: ['Треугольник $ABC$', 'Чевиана $AD$ делит его на два треугольника с общей высотой'],
};

/* ── 22. Общий угол ──────────────────────────────────────────────── */

export const OBSHCHIY_UGOL: ZhivayaSkhema = {
  id: 'obshchiy-ugol',
  nachalo: { A: [0, 0], B: [2.6, 4.6], C: [7, 0], B1: [1.3, 2.3], C1: [4.6, 0] },
  podvizhnye: ['A', 'B', 'C', 'B1', 'C1'],
  pole: POLE,
  postroit(t): Kadr {
    const A = t.A!;
    const B = t.B!;
    const C = t.C!;
    const B1 = t.B1!;
    const C1 = t.C1!;
    const el: Element[] = [
      mnog('f-abc', [A, B, C], { gruppy: ['otnoshenie'], cvet: 'a' }),
      mnog('f-ab1c1', [A, B1, C1], { gruppy: ['otnoshenie'], cvet: 'b' }),
      otr('AB', A, B, { gruppy: ['otnoshenie'], cvet: 'a' }),
      otr('BC', B, C),
      otr('CA', C, A, { gruppy: ['otnoshenie'], cvet: 'a' }),
      otr('B1C1', B1, C1, { shag: 1, gruppy: ['otnoshenie'], cvet: 'b' }),
      ug('uA', B, A, C, { gruppy: ['otnoshenie'], cvet: 'c' }),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('B_1', B1, { shag: 1, ruchka: 'B1', gruppy: ['otnoshenie'], cvet: 'b' }),
      tch('C_1', C1, { shag: 1, ruchka: 'C1', gruppy: ['otnoshenie'], cvet: 'b' }),
    ];
    return {
      elementy: el,
      zametka: null,
      znacheniya: [
        `$\\tfrac{S_{AB_1C_1}}{S_{ABC}} = ${chisloTeX(S(A, B1, C1) / S(A, B, C))}$`,
        `$\\tfrac{AB_1\\cdot AC_1}{AB\\cdot AC} = ${chisloTeX((dist(A, B1) * dist(A, C1)) / (dist(A, B) * dist(A, C)))}$`,
      ],
    };
  },
  ogranichit(imya, p, t) {
    let q = vPole(p);
    if (imya === 'B1') q = lerp(t.A!, t.B!, Math.max(0.15, Math.min(0.92, projT(q, t.A!, t.B!))));
    if (imya === 'C1') q = lerp(t.A!, t.C!, Math.max(0.15, Math.min(0.92, projT(q, t.A!, t.C!))));
    return treugolnikGoditsya({ ...t, [imya]: q }) ? q : null;
  },
  prisposobit(novye, prezhnie, imya) {
    if (imya === 'B1' || imya === 'C1') return novye;
    return {
      ...novye,
      B1: lerp(novye.A!, novye.B!, projT(prezhnie.B1!, prezhnie.A!, prezhnie.B!)),
      C1: lerp(novye.A!, novye.C!, projT(prezhnie.C1!, prezhnie.A!, prezhnie.C!)),
    };
  },
  sluchaynaya(rnd) {
    for (let i = 0; i < 200; i += 1) {
      const tr = treugolnikPoUglam(30 + rnd() * 70, 30 + rnd() * 60, 6);
      const t: Tochki = {
        ...tr,
        B1: lerp(tr.A, tr.B, 0.25 + rnd() * 0.6),
        C1: lerp(tr.A, tr.C, 0.25 + rnd() * 0.6),
      };
      if (treugolnikGoditsya(t)) return t;
    }
    return OBSHCHIY_UGOL.nachalo;
  },
  shagi: ['Треугольник $ABC$', 'Треугольник $AB_1C_1$ с тем же углом $A$'],
};

/* ── 23. «Рельсы Евклида» ────────────────────────────────────────── */

export const RELSY: ZhivayaSkhema = {
  id: 'relsy-evklida',
  nachalo: { A: [0, 0], B: [4, 0], C: [1.2, 3], D: [6.2, 3] },
  podvizhnye: ['A', 'B', 'C', 'D'],
  pole: [-6, -1, 12, 7],
  postroit(t): Kadr {
    const A = t.A!;
    const B = t.B!;
    const C = t.C!;
    const D = t.D!;
    const h = C[1];
    const xs = [A[0], B[0], C[0], D[0]];
    const x0 = Math.min(...xs) - 1.5;
    const x1 = Math.max(...xs) + 1.5;
    const el: Element[] = [
      mnog('f-abc', [A, B, C], { gruppy: ['ravny', 'trap'], cvet: 'a' }),
      mnog('f-abd', [A, B, D], { gruppy: ['ravny', 'trap'], cvet: 'b' }),
      otr('niz', [x0, 0], [x1, 0], { stil: 'punktir' }),
      otr('verh', [x0, h], [x1, h], { stil: 'punktir', gruppy: ['obratno'], cvet: 'c' }),
      otr('AB', A, B, { gruppy: ['ravny', 'obratno'], cvet: 'c' }),
      otr('AC', A, C, { shag: 1 }),
      otr('BC', B, C, { shag: 1 }),
      otr('AD', A, D, { shag: 1 }),
      otr('BD', B, D, { shag: 1 }),
      otr('CD', C, D, { skrytyy: true, gruppy: ['trap'], cvet: 'c' }),
      otr('hC', C, [C[0], 0], { skrytyy: true, stil: 'punktir', gruppy: ['ravny'], cvet: 'a' }),
      otr('hD', D, [D[0], 0], { skrytyy: true, stil: 'punktir', gruppy: ['ravny'], cvet: 'b' }),
      tch('A', A),
      tch('B', B),
      tch('C', C, { shag: 1 }),
      tch('D', D, { shag: 1 }),
    ];
    return {
      elementy: el,
      zametka: null,
      znacheniya: [`$S_{ABC} = ${chisloTeX(S(A, B, C))}$`, `$S_{ABD} = ${chisloTeX(S(A, B, D))}$`],
    };
  },
  ogranichit(imya, p, t) {
    let q: T2 = [Math.max(-6, Math.min(12, p[0])), p[1]];
    if (imya === 'A' || imya === 'B') q = [q[0], 0];
    if (imya === 'D') q = [q[0], t.C![1]];
    if (imya === 'C') q = [q[0], Math.max(1.2, Math.min(6, q[1]))];
    const s = { ...t, [imya]: q };
    if (imya === 'C') s.D = [s.D![0], q[1]];
    if (dist(s.A!, s.B!) < 1.5 || dist(s.C!, s.D!) < 0.8) return null;
    return q;
  },
  prisposobit(novye, prezhnie, imya) {
    if (imya !== 'C') return novye;
    return { ...novye, D: [prezhnie.D![0], novye.C![1]] };
  },
  sluchaynaya(rnd) {
    const h = 2 + rnd() * 2.5;
    const ab = 3 + rnd() * 3;
    const xc = -1 + rnd() * 4;
    return { A: [0, 0], B: [ab, 0], C: [xc, h], D: [xc + 2 + rnd() * 3, h] };
  },
  shagi: ['Основание $AB$ на одном «рельсе»', 'Вершины $C$ и $D$ — на параллельном рельсе'],
};
