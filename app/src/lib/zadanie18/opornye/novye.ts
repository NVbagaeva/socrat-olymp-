/**
 * Чертежи новых опорных задач №18 (условия — из курса подготовки,
 * решения — content/zadanie18/opornye/novye.ts). Каждый чертёж строится
 * по данным задачи: касания, перпендикулярность и отношения считаются,
 * а не рисуются на глаз; scripts/verify_opornye18/novye.mjs проверяет
 * их и ответ б) по точкам чертежа.
 *
 * Оформление — тема чертежа (lib/skhemy/tema.ts): фигура условия —
 * роль figure, данные — записи-величины у своих отрезков и углов,
 * вспомогательные построения — construction, подсветка шагов решения —
 * скрытые элементы с группами.
 */

import { mnog, okr, otr, tch, ug, vel, velOtr, velUg } from '@/lib/skhemy/dsl';
import {
  add,
  angleAt,
  chisloTeX,
  circumcircle,
  dist,
  foot,
  incircle,
  intersect,
  lineCircle,
  mid,
  mul,
  polar,
  rotate,
  sub,
  vnevpisannaya,
} from '@/lib/skhemy/geometriya';
import type { Element, T2, Tochki } from '@/lib/skhemy/tipy';
import { goditsyaTreugolnik, scena, vPromezhutke } from './obshchee';

const RAD = Math.PI / 180;
/** Отношение p : q малыми целыми (до 9), если оно такое; иначе null. */
function malyeChisla(x: number): [number, number] | null {
  for (let q = 1; q <= 9; q += 1) {
    const p = Math.round(x * q);
    if (p >= 1 && p <= 9 && Math.abs(x - p / q) < 1e-7) return [p, q];
  }
  return null;
}
/** Часть отношения: 1 → «x», 3 → «3x». */
const chast = (n: number, b: string) => (n === 1 ? b : `${n}${b}`);
/** Дробь b/c, если обе — целые; иначе десятичная запись. */
function drobIliChislo(b: number, c: number): string {
  const cel = (x: number) => Math.abs(x - Math.round(x)) < 1e-9;
  return cel(b) && cel(c) ? `${Math.round(b)}/${Math.round(c)}` : ch(b / c);
}

/** Число для записи на чертеже: «4,5», «12». */
const ch = (x: number) => String(Math.round(x * 100) / 100).replace('.', ',');
const p2 = (t: Tochki, k: string, z: T2): T2 => t[k] ?? z;
const kon = (p: T2) => Number.isFinite(p[0]) && Number.isFinite(p[1]);

/* ── 656. Диагонали трапеции 5 и 12, основания 4 и 9 ─────────────── */

/** p = (AD, BC) — основания, q = (AC, BD) — диагонали. */
export function tochkiDiagTrap(t: Tochki) {
  const [a, b] = p2(t, 'p', [9, 4]);
  const [d1, d2] = p2(t, 'q', [12, 5]);
  const s = a + b;
  /* Треугольник ACE: AE = a + b, AC = d1, CE = d2 (CE ∥ BD, CE = BD). */
  const x = (d1 * d1 - d2 * d2 + s * s) / (2 * s);
  const h = Math.sqrt(Math.max(0, d1 * d1 - x * x));
  const A: T2 = [0, 0];
  const D: T2 = [a, 0];
  const E: T2 = [s, 0];
  const C: T2 = [x, h];
  const B: T2 = [x - b, h];
  const O = intersect(A, C, B, D) ?? mid(A, C);
  return { A, B, C, D, E, O, a, b, d1, d2, h };
}

export const OP_DIAG_TRAP = scena({
  id: 'diagonali-trapecii',
  nachalo: { p: [9, 4], q: [12, 5] },
  pole: [-30, -30, 30, 30],
  goditsya: (t) => {
    const { B, C, h, a, b } = tochkiDiagTrap(t);
    return (
      h > 0.2 * (a + b) * 0.3 && kon(B) && kon(C) && B[0] > -0.6 * a && C[0] < 1.6 * a && b < a
    );
  },
  sluchaynaya: (rnd) => {
    const a = vPromezhutke(rnd, 7, 11);
    const b = a * vPromezhutke(rnd, 0.3, 0.7);
    const u = vPromezhutke(rnd, 25, 65) * RAD;
    /* Диагонали перпендикулярны: d1² + d2² = (a + b)². */
    return { p: [a, b], q: [(a + b) * Math.cos(u), (a + b) * Math.sin(u)] };
  },
  postroit(t) {
    const { A, B, C, D, E, O, a, b, d1, d2 } = tochkiDiagTrap(t);
    const el: Element[] = [
      /* б) ищет площадь трапеции. */
      mnog('fig', [A, B, C, D], { skrytyy: false, rol: 'region-sought' }),
      mnog('f-bced', [B, C, E, D], { gruppy: ['perenos'], cvet: 'b' }),
      mnog('f-ace', [A, C, E], { gruppy: ['treug', 'ploshchad'], cvet: 'a' }),
      otr('AB', A, B, { rol: 'figure' }),
      otr('BC', B, C, { rol: 'figure' }),
      otr('CD', C, D, { rol: 'figure' }),
      otr('DA', D, A, { rol: 'figure' }),
      otr('AC', A, C, { rol: 'aux', gruppy: ['treug', 'ugol'], cvet: 'a' }),
      otr('BD', B, D, { rol: 'aux', gruppy: ['perenos', 'ugol'], cvet: 'b' }),
      otr('DE', D, E, {
        stil: 'prodolzhenie',
        rol: 'construction',
        skrytyy: true,
        gruppy: ['perenos', 'treug', 'ploshchad'],
        cvet: 'b',
      }),
      otr('CE', C, E, {
        stil: 'punktir',
        rol: 'construction',
        skrytyy: true,
        gruppy: ['perenos', 'treug', 'ugol', 'ploshchad'],
        cvet: 'b',
      }),
      ug('pC', A, C, E, { pryamoy: true, skrytyy: true, gruppy: ['treug'], cvet: 'a' }),
      ug('pO', A, O, B, { pryamoy: true, skrytyy: true, gruppy: ['ugol'], cvet: 'a' }),
      velOtr('d-AD', ch(a), A, D),
      velOtr('d-BC', ch(b), B, C),
      velOtr('d-AC', ch(d1), A, O),
      velOtr('d-BD', ch(d2), O, D),
      vel(
        'd-S',
        'S_ABCD = ?',
        { vnutri: [(A[0] + B[0] + O[0]) / 3, (A[1] + B[1] + O[1]) / 3] },
        { rol: 'region-sought' },
      ),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('D', D),
      tch('E', E, { skrytyy: true, gruppy: ['perenos', 'treug', 'ploshchad'] }),
      tch('O', O),
    ];
    return {
      elementy: el,
      zametka: null,
      znacheniya: [
        `$AC^2 + BD^2 = ${chisloTeX(d1 * d1 + d2 * d2)}$`,
        `$(AD + BC)^2 = ${chisloTeX((a + b) ** 2)}$`,
      ],
    };
  },
  shagi: ['Трапеция $ABCD$ и её диагонали'],
});

/* ── 657. Касающиеся окружности: E и F на O₁N и O₂N ───────────────── */

/** p = (R₁, R₂) — радиусы. */
export function tochkiKasEF(t: Tochki) {
  const [r1, r2] = p2(t, 'p', [8, 2]);
  const ab = 2 * Math.sqrt(r1 * r2);
  const A: T2 = [0, 0];
  const B: T2 = [ab, 0];
  const O1: T2 = [0, r1];
  const O2: T2 = [ab, r2];
  const K = add(O1, mul(sub(O2, O1), r1 / (r1 + r2)));
  const N: T2 = [ab / 2, 0];
  const E = intersect(A, K, O1, N) ?? mid(A, K);
  const F = intersect(B, K, O2, N) ?? mid(B, K);
  return { A, B, O1, O2, K, N, E, F, r1, r2 };
}

export const OP_KAS_EF = scena({
  id: 'kasayushchiesya-ef',
  nachalo: { p: [8, 2] },
  pole: [-40, -40, 40, 40],
  goditsya: (t) => {
    const [r1, r2] = p2(t, 'p', [8, 2]);
    return r1 > 0 && r2 > 0 && r2 / r1 > 0.12 && r2 / r1 < 0.9;
  },
  sluchaynaya: (rnd) => {
    const r1 = vPromezhutke(rnd, 5, 9);
    return { p: [r1, r1 * vPromezhutke(rnd, 0.15, 0.8)] };
  },
  postroit(t) {
    const { A, B, O1, O2, K, N, E, F, r1, r2 } = tochkiKasEF(t);
    const el: Element[] = [
      okr('o1', O1, r1, { rol: 'figure' }),
      okr('o2', O2, r2, { rol: 'figure' }),
      otr('AB', A, B, { rol: 'figure', gruppy: ['n', 'ab'], cvet: 'a' }),
      otr('NK', N, K, { rol: 'aux', shtrihi: 1, gruppy: ['n', 'ugol'], cvet: 'a' }),
      otr('NA', N, A, { skrytyy: true, shtrihi: 1, gruppy: ['n', 'ugol'], cvet: 'a' }),
      otr('NB', N, B, { skrytyy: true, shtrihi: 1, gruppy: ['n', 'ugol'], cvet: 'a' }),
      otr('O1N', O1, N, { rol: 'aux', gruppy: ['bis', 'ef'], cvet: 'b' }),
      otr('O2N', O2, N, { rol: 'aux', gruppy: ['bis', 'ef'], cvet: 'b' }),
      otr('AK', A, K, { rol: 'aux', gruppy: ['ugol', 'ef'], cvet: 'a' }),
      otr('BK', B, K, { rol: 'aux', gruppy: ['ugol', 'ef'], cvet: 'a' }),
      otr('EF', E, F, { rol: 'aux', gruppy: ['ef', 'otvet'], cvet: 'b' }),
      otr('O1A', O1, A, { stil: 'punktir', rol: 'construction', gruppy: ['ab', 'bis'], cvet: 'c' }),
      otr('O2B', O2, B, { stil: 'punktir', rol: 'construction', gruppy: ['ab', 'bis'], cvet: 'c' }),
      otr('O1O2', O1, O2, {
        stil: 'punktir',
        rol: 'construction',
        skrytyy: true,
        gruppy: ['ab'],
        cvet: 'c',
      }),
      ug('pN', O1, N, O2, { pryamoy: true, skrytyy: true, gruppy: ['bis'], cvet: 'b' }),
      ug('pK', A, K, B, { pryamoy: true, skrytyy: true, gruppy: ['ugol'], cvet: 'a' }),
      /* Радиусы — записью у центра: на коротком радиусе малой окружности число не помещается. */
      vel('d-r1', `R = ${ch(r1)}`, { vnutri: O1 }),
      vel('d-r2', `r = ${ch(r2)}`, { vnutri: O2 }),
      tch('O_1', O1),
      tch('O_2', O2),
      tch('A', A),
      tch('B', B),
      tch('K', K),
      tch('N', N),
      tch('E', E),
      tch('F', F),
    ];
    return {
      elementy: el,
      zametka: null,
      znacheniya: [
        `$\\angle O_1NO_2 = ${chisloTeX(angleAt(O1, N, O2), 1)}^\\circ$`,
        `$\\angle AKB = ${chisloTeX(angleAt(A, K, B), 1)}^\\circ$`,
      ],
    };
  },
  shagi: ['Две окружности и общие касательные'],
});

/* ── 658. Квадраты на сторонах треугольника ───────────────────────── */

/** Вершина квадрата со стороной PQ при Q, по другую сторону от X. */
function vershinaKvadrata(p: T2, q: T2, x: T2): T2 {
  const v = sub(p, q);
  let n: T2 = [-v[1], v[0]];
  const m = mid(p, q);
  if ((x[0] - m[0]) * n[0] + (x[1] - m[1]) * n[1] > 0) n = [v[1], -v[0]];
  return add(q, n);
}

export function tochkiKvadraty(t: Tochki) {
  const A = t.A!;
  const B = t.B!;
  const C = t.C!;
  /* ACDE: D при C; BFKC: K при C. */
  const D = vershinaKvadrata(A, C, B);
  const E = add(A, sub(D, C));
  const K = vershinaKvadrata(B, C, A);
  const F = add(B, sub(K, C));
  const M = mid(A, B);
  const C2 = sub(mul(M, 2), C);
  return { A, B, C, D, E, K, F, M, C2, O1: mid(A, D), O2: mid(B, K) };
}

const C658: T2 = [0, 0];
export const OP_KVADRATY = scena({
  id: 'kvadraty-na-storonah',
  /* AC = 14, BC = 16, ∠ACB = 150°. */
  nachalo: { A: [14, 0], B: polar(150, 16), C: C658 },
  podvizhnye: ['A', 'B', 'C'],
  pole: [-40, -40, 40, 40],
  goditsya: (t) => goditsyaTreugolnik(t.A!, t.B!, t.C!, 12, 3),
  /* Угол C не острее 60°: при остром угле квадраты наползают друг на друга, и чертёж не читается. */
  sluchaynaya: (rnd) => ({
    A: [vPromezhutke(rnd, 10, 16), 0],
    B: polar(vPromezhutke(rnd, 60, 150), vPromezhutke(rnd, 10, 16)),
    C: C658,
  }),
  postroit(t) {
    const { A, B, C, D, E, K, F, M, C2, O1, O2 } = tochkiKvadraty(t);
    const el: Element[] = [
      mnog('fig', [A, B, C], { skrytyy: false, rol: 'figure' }),
      mnog('f-cac2', [C, A, C2], { gruppy: ['ravn'], cvet: 'a' }),
      mnog('f-dck', [D, C, K], { gruppy: ['ravn'], cvet: 'b' }),
      otr('AB', A, B, { rol: 'figure' }),
      otr('BC', B, C, { rol: 'figure' }),
      otr('CA', C, A, { rol: 'figure' }),
      otr('CD', C, D, { rol: 'figure' }),
      otr('DE', D, E, { rol: 'figure' }),
      otr('EA', E, A, { rol: 'figure' }),
      otr('BF', B, F, { rol: 'figure' }),
      otr('FK', F, K, { rol: 'figure' }),
      otr('KC', K, C, { rol: 'figure' }),
      otr('DK', D, K, { rol: 'aux', gruppy: ['ravn'], cvet: 'b' }),
      otr('CM', C, M, { rol: 'aux', shtrihi: 1, gruppy: ['udv'], cvet: 'a' }),
      otr('MC2', M, C2, {
        stil: 'punktir',
        rol: 'construction',
        skrytyy: true,
        shtrihi: 1,
        gruppy: ['udv', 'ugly', 'ravn'],
        cvet: 'a',
      }),
      otr('AC2', A, C2, {
        stil: 'punktir',
        rol: 'construction',
        skrytyy: true,
        gruppy: ['udv', 'ugly', 'ravn'],
        cvet: 'a',
      }),
      otr('BC2', B, C2, {
        stil: 'punktir',
        rol: 'construction',
        skrytyy: true,
        gruppy: ['udv'],
        cvet: 'a',
      }),
      otr('BD', B, D, {
        stil: 'punktir',
        rol: 'construction',
        skrytyy: true,
        gruppy: ['bd'],
        cvet: 'b',
      }),
      otr('AK', A, K, {
        stil: 'punktir',
        rol: 'construction',
        skrytyy: true,
        gruppy: ['ak'],
        cvet: 'b',
      }),
      otr('AD', A, D, {
        stil: 'punktir',
        rol: 'construction',
        skrytyy: true,
        gruppy: ['bd'],
        cvet: 'c',
      }),
      otr('BK', B, K, {
        stil: 'punktir',
        rol: 'construction',
        skrytyy: true,
        gruppy: ['ak'],
        cvet: 'c',
      }),
      otr('MO1', M, O1, { rol: 'aux', skrytyy: true, gruppy: ['bd', 'otvet'], cvet: 'a' }),
      otr('MO2', M, O2, { rol: 'aux', skrytyy: true, gruppy: ['ak', 'otvet'], cvet: 'a' }),
      ug('uCAC2', C, A, C2, { skrytyy: true, gruppy: ['ugly', 'ravn'], cvet: 'c' }),
      ug('uDCK', D, C, K, { skrytyy: true, gruppy: ['ugly', 'ravn'], cvet: 'c' }),
      /* Данные б) — только в их положении: в случайном это не данные задачи,
         а квадраты с треугольником оставляют числам мало места. */
      ...(Math.abs(angleAt(A, C, B) - 150) < 1e-6
        ? [
            velOtr('d-AC', ch(dist(A, C)), A, C),
            velOtr('d-BC', ch(dist(B, C)), B, C),
            velUg('d-C', `${Math.round(angleAt(A, C, B))}°`, A, C, B),
          ]
        : []),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('D', D),
      tch('E', E),
      tch('F', F),
      tch('K', K),
      tch('M', M),
      tch('C_1', C2, { skrytyy: true, gruppy: ['udv', 'ugly', 'ravn'] }),
      tch('O_1', O1),
      tch('O_2', O2),
    ];
    return {
      elementy: el,
      zametka: null,
      znacheniya: [
        `$CM = ${chisloTeX(dist(C, M))}$`,
        `$\\tfrac12 DK = ${chisloTeX(dist(D, K) / 2)}$`,
      ],
    };
  },
  shagi: ['Треугольник и квадраты на сторонах'],
});

/* ── 659. Две пересекающиеся окружности, диаметр CA ───────────────── */

/** p = (r₁, R₂) — радиусы, q = (h, 0) — половина общей хорды AB. */
export function tochkiDveOkr(t: Tochki) {
  const [r1, r2] = p2(t, 'p', [R659, 4 * R659]);
  const [h] = p2(t, 'q', [1, 0]);
  const A: T2 = [0, -h];
  const B: T2 = [0, h];
  const O1: T2 = [-Math.sqrt(Math.max(0, r1 * r1 - h * h)), 0];
  const O2: T2 = [Math.sqrt(Math.max(0, r2 * r2 - h * h)), 0];
  const C = sub(mul(O1, 2), A);
  const k2 = { c: O2, r: r2 };
  const dal = (p: T2, q: T2) => {
    const s = lineCircle(p, q, k2);
    return s.length === 2 ? (s[0]!.t > s[1]!.t ? s[0]!.p : s[1]!.p) : q;
  };
  const D = dal(C, A);
  const E = dal(C, B);
  return { A, B, C, D, E, O1, O2, r1, r2 };
}

/**
 * Радиус первой окружности для данных б): R = 4r, AB = 2, ∠DAE = ∠BAC = α.
 * AE — диаметр второй окружности (а), AE = 8r; в прямоугольном ABE
 * ∠AEB = 2α − 90°, sin ∠AEB = AB/AE = cos α / 4, откуда
 * 8cos²α + cos α − 4 = 0, cos α = (√129 − 1)/16 и r = 1/cos α.
 */
const R659 = 16 / (Math.sqrt(129) - 1);

export const OP_DVE_OKR = scena({
  id: 'dve-okruzhnosti-diametr',
  nachalo: { p: [R659, 4 * R659], q: [1, 0] },
  pole: [-40, -40, 40, 40],
  goditsya: (t) => {
    const [r1, r2] = p2(t, 'p', [1, 1]);
    const [h] = p2(t, 'q', [1, 0]);
    if (!(h > 0 && r1 > h * 1.05 && r2 > h * 1.05)) return false;
    const { A, B, C, D, E } = tochkiDveOkr(t);
    /* D — на продолжении CA за A, E — на продолжении CB за B. */
    return dist(C, D) > dist(C, A) + 0.1 && dist(C, E) > dist(C, B) + 0.1 && kon(D) && kon(E);
  },
  sluchaynaya: (rnd) => {
    const h = 1;
    const r1 = vPromezhutke(rnd, 1.15, 2.2);
    return { p: [r1, r1 * vPromezhutke(rnd, 1.2, 4)], q: [h, 0] };
  },
  postroit(t) {
    const { A, B, C, D, E, O1, O2, r1, r2 } = tochkiDveOkr(t);
    const el: Element[] = [
      okr('k1', O1, r1, { rol: 'figure' }),
      okr('k2', O2, r2, { rol: 'figure' }),
      mnog('f-cbd', [C, B, D], { gruppy: ['pod'], cvet: 'a' }),
      mnog('f-o1ao2', [O1, A, O2], { gruppy: ['pod'], cvet: 'b' }),
      otr('AB', A, B, { rol: 'aux' }),
      otr('CD', C, D, { rol: 'aux', gruppy: ['pod'], cvet: 'a' }),
      otr('CE', C, E, { rol: 'aux', gruppy: ['pod'], cvet: 'a' }),
      otr('BD', B, D, { rol: 'aux', gruppy: ['pod', 'ugolD'], cvet: 'a' }),
      otr('O1A', O1, A, { rol: 'aux', skrytyy: true, gruppy: ['pod', 'ugolC'], cvet: 'b' }),
      otr('O1B', O1, B, {
        rol: 'construction',
        stil: 'punktir',
        skrytyy: true,
        gruppy: ['ugolC'],
        cvet: 'b',
      }),
      otr('O2A', O2, A, { rol: 'aux', skrytyy: true, gruppy: ['pod', 'ugolD'], cvet: 'b' }),
      otr('O2B', O2, B, {
        rol: 'construction',
        stil: 'punktir',
        skrytyy: true,
        gruppy: ['ugolD'],
        cvet: 'b',
      }),
      otr('O1O2', O1, O2, {
        rol: 'aux',
        skrytyy: true,
        gruppy: ['pod', 'ugolC', 'ugolD'],
        cvet: 'b',
      }),
      otr('AE', A, E, {
        rol: 'construction',
        stil: 'punktir',
        skrytyy: true,
        gruppy: ['diam', 'b'],
        cvet: 'c',
      }),
      otr('DE', D, E, {
        rol: 'construction',
        stil: 'punktir',
        skrytyy: true,
        gruppy: ['b'],
        cvet: 'c',
      }),
      ug('uC', B, C, A, { skrytyy: true, gruppy: ['ugolC', 'pod'], cvet: 'c' }),
      ug('uO1', A, O1, O2, { skrytyy: true, gruppy: ['ugolC', 'pod'], cvet: 'c' }),
      ug('uD', B, D, C, { skrytyy: true, gruppy: ['ugolD', 'pod'], cvet: 'c', dugi: 2 }),
      ug('uO2', A, O2, O1, { skrytyy: true, gruppy: ['ugolD', 'pod'], cvet: 'c', dugi: 2 }),
      ug('pB', A, B, C, { pryamoy: true, skrytyy: true, gruppy: ['diam', 'b'], cvet: 'a' }),
      ug('pD', A, D, E, { pryamoy: true, skrytyy: true, gruppy: ['b'], cvet: 'a' }),
      /* Общая хорда короткая и зажата дугами: у неё места под запись нет,
         а поодаль «AB = 2» читается как подпись другого — строкой под чертежом. */
      vel('d-AB', `AB = ${ch(dist(A, B))}`, { podChertezhom: true }),
      tch('O_1', O1),
      tch('O_2', O2),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('D', D),
      tch('E', E),
    ];
    return {
      elementy: el,
      zametka: null,
      znacheniya: [
        `$\\angle BCD = ${chisloTeX(angleAt(B, C, D), 1)}^\\circ$, $\\angle AO_1O_2 = ${chisloTeX(angleAt(A, O1, O2), 1)}^\\circ$`,
      ],
    };
  },
  shagi: ['Две окружности, диаметр $CA$ первой'],
});

/* ── 660. Окружность через центр большей ──────────────────────────── */

/** p = (φ, R): φ — угол AOC в градусах (знак — сторона), R — радиус большей окружности. */
export function tochkiCherezCentr(t: Tochki) {
  const [fi, R] = p2(t, 'p', [Math.acos(0.25) / RAD, 6]);
  const O: T2 = [0, 0];
  const A: T2 = [0, R];
  const C = rotate(A, O, -fi);
  const B = sub(O, C);
  const M = foot(A, B, C);
  const P = sub(O, A);
  const Q = sub(mul(M, 2), A);
  const K = intersect(P, C, A, Q) ?? M;
  return { O, A, B, C, M, P, Q, K, R, fi };
}

/** sin угла с cos = 1/d: «√15/4» (d = 4), иначе десятичной дробью. */
function zapisSinusa(fiGr: number): string {
  const d = 1 / Math.cos(fiGr * RAD);
  if (Math.abs(d - Math.round(d)) < 1e-9) {
    const n = Math.round(d) ** 2 - 1;
    return `√${n}/${Math.round(d)}`;
  }
  return ch(Math.sin(fiGr * RAD));
}

export const OP_CHEREZ_CENTR = scena({
  id: 'okruzhnost-cherez-centr',
  nachalo: { p: [Math.acos(0.25) / RAD, 6] },
  pole: [-40, -40, 40, 40],
  goditsya: (t) => {
    const [fi] = p2(t, 'p', [60, 6]);
    return Math.abs(fi) > 18 && Math.abs(fi) < 82;
  },
  sluchaynaya: (rnd) => ({ p: [vPromezhutke(rnd, 22, 80) * (rnd() < 0.5 ? 1 : -1), 6] }),
  postroit(t) {
    const { O, A, B, C, M, P, Q, K, R, fi } = tochkiCherezCentr(t);
    const el: Element[] = [
      okr('big', O, R, { rol: 'figure' }),
      okr('small', mid(A, O), R / 2, { rol: 'aux', gruppy: ['pryamye'], cvet: 'c' }),
      otr('BC', B, C, { rol: 'aux', gruppy: ['par', 'om'], cvet: 'a' }),
      otr('AP', A, P, { rol: 'aux', gruppy: ['pryamye', 'om'], cvet: 'b' }),
      otr('AQ', A, Q, { rol: 'aux', gruppy: ['pryamye', 'par'], cvet: 'b' }),
      otr('PQ', P, Q, { rol: 'aux', gruppy: ['par', 'om', 'pod'], cvet: 'a' }),
      otr('PC', P, C, { rol: 'aux', gruppy: ['pod'], cvet: 'b' }),
      otr('OA', O, A, {
        rol: 'construction',
        stil: 'punktir',
        skrytyy: true,
        gruppy: ['dugi'],
        cvet: 'c',
      }),
      otr('OC', O, C, {
        rol: 'construction',
        stil: 'punktir',
        skrytyy: true,
        gruppy: ['dugi'],
        cvet: 'c',
      }),
      mnog('f-kqp', [K, Q, P], { gruppy: ['pod'], cvet: 'a' }),
      mnog('f-kmc', [K, M, C], { gruppy: ['pod'], cvet: 'b' }),
      ug('pM', A, M, O, { pryamoy: true, skrytyy: true, gruppy: ['pryamye', 'par'], cvet: 'a' }),
      ug('pQ', A, Q, P, { pryamoy: true, skrytyy: true, gruppy: ['pryamye', 'par'], cvet: 'a' }),
      ug('uAOC', A, O, C, { rol: 'angle', gruppy: ['dugi'], cvet: 'c' }),
      /* Синус: у дуги угла AOC тесно от хорд, а поодаль запись не «его» —
         строкой под чертежом (дуга угла остаётся). */
      vel('d-AOC', `sin ∠AOC = ${zapisSinusa(Math.abs(fi))}`, { podChertezhom: true }),
      tch('O', O),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('M', M),
      tch('P', P),
      tch('Q', Q),
      tch('K', K),
    ];
    return {
      elementy: el,
      zametka: null,
      znacheniya: [`$KA : QK = ${chisloTeX(dist(K, A) / dist(Q, K))}$`],
    };
  },
  shagi: ['Две окружности, касающиеся в точке $A$'],
});

/* ── 661. Вписанная окружность треугольника KLM ───────────────────── */

export function tochkiVpisKLM(t: Tochki) {
  const K = t.K!;
  const L = t.L!;
  const M = t.M!;
  const k = incircle(K, L, M);
  return { K, L, M, I: k.c, r: k.r, A: foot(k.c, K, L), B: foot(k.c, L, M), C: foot(k.c, M, K) };
}

/* KL = 8, KM = 5, LM = 7: ∠K = 60°, KC : CM = 3 : 2. */
const K661: T2 = [0, 0];
const L661: T2 = [8, 0];
export const OP_VPIS_KLM = scena({
  id: 'vpisannaya-otrezki',
  nachalo: { K: K661, L: L661, M: polar(60, 5) },
  podvizhnye: ['K', 'L', 'M'],
  pole: [-20, -20, 20, 20],
  goditsya: (t) => goditsyaTreugolnik(t.K!, t.L!, t.M!, 18, 2),
  sluchaynaya: (rnd) => ({
    K: K661,
    L: L661,
    M: polar(vPromezhutke(rnd, 35, 110), vPromezhutke(rnd, 4, 8)),
  }),
  postroit(t) {
    const { K, L, M, I, r, A, B, C } = tochkiVpisKLM(t);
    const kc = dist(K, C);
    const cm = dist(C, M);
    const el: Element[] = [
      mnog('fig', [K, L, M], { skrytyy: false, rol: 'figure' }),
      otr('KL', K, L, { rol: 'figure' }),
      otr('LM', L, M, { rol: 'figure' }),
      otr('MK', M, K, { rol: 'figure' }),
      okr('vp', I, r, { rol: 'aux' }),
      otr('KA', K, A, { skrytyy: true, shtrihi: 1, gruppy: ['kas'], cvet: 'a' }),
      otr('KC', K, C, { rol: 'part-x', shtrihi: 1, gruppy: ['kas'], cvet: 'a' }),
      otr('LA', L, A, { skrytyy: true, shtrihi: 2, gruppy: ['kas', 'b'], cvet: 'b' }),
      otr('LB', L, B, { skrytyy: true, shtrihi: 2, gruppy: ['kas', 'b'], cvet: 'b' }),
      otr('MB', M, B, { skrytyy: true, shtrihi: 3, gruppy: ['kas', 'b'], cvet: 'c' }),
      otr('MC', M, C, { rol: 'part-x', shtrihi: 3, gruppy: ['kas'], cvet: 'c' }),
      ug('uK', L, K, M, { rol: 'angle' }),
      /* Отношение KC : CM частями x — когда оно из малых целых (данные б)). */
      ...(() => {
        const o = malyeChisla(kc / cm);
        return o === null
          ? []
          : [
              velOtr('d-KC', chast(o[0], 'x'), K, C, { rol: 'part-x' }),
              velOtr('d-CM', chast(o[1], 'x'), C, M, { rol: 'part-x' }),
            ];
      })(),
      velUg('d-K', `${Math.round(angleAt(L, K, M))}°`, L, K, M),
      tch('K', K),
      tch('L', L),
      tch('M', M),
      tch('A', A),
      tch('B', B),
      tch('C', C),
    ];
    return {
      elementy: el,
      zametka: null,
      znacheniya: [
        `$KC : CM = ${chisloTeX(kc / cm)}$`,
        `$BL : BM = ${chisloTeX(dist(B, L) / dist(B, M))}$`,
      ],
    };
  },
  shagi: ['Треугольник $KLM$ и вписанная окружность'],
});

/* ── 662. Высоты и перпендикуляры к ним ──────────────────────────── */

export function tochkiVysPerp(t: Tochki) {
  const A = t.A!;
  const B = t.B!;
  const C = t.C!;
  const K = foot(A, B, C);
  const M = foot(C, A, B);
  const E = foot(M, A, K);
  const H = foot(K, C, M);
  const T = intersect(A, K, C, M) ?? K;
  return { A, B, C, K, M, E, H, T };
}

/* ∠B = 30°, ∠A = 80°, ∠C = 70°; BC = 10. */
const B662: T2 = [0, 0];
const C662: T2 = [10, 0];
export const OP_VYS_PERP = scena({
  id: 'vysoty-perpendikulyary',
  nachalo: {
    A: polar(30, (10 * Math.sin(70 * RAD)) / Math.sin(80 * RAD)),
    B: B662,
    C: C662,
  },
  podvizhnye: ['A', 'B', 'C'],
  pole: [-20, -20, 20, 20],
  goditsya: (t) => {
    if (!goditsyaTreugolnik(t.A!, t.B!, t.C!, 20, 2)) return false;
    const u = [angleAt(t.B!, t.A!, t.C!), angleAt(t.A!, t.B!, t.C!), angleAt(t.A!, t.C!, t.B!)];
    return u.every((x) => x < 82);
  },
  sluchaynaya: (rnd) => {
    const b = vPromezhutke(rnd, 25, 75);
    const c = vPromezhutke(rnd, Math.max(25, 95 - b), Math.min(75, 160 - b));
    const a = 180 - b - c;
    return { A: polar(b, (10 * Math.sin(c * RAD)) / Math.sin(a * RAD)), B: B662, C: C662 };
  },
  postroit(t) {
    const { A, B, C, K, M, E, H } = tochkiVysPerp(t);
    const k1 = { c: mid(A, C), r: dist(A, C) / 2 };
    const k2 = { c: mid(M, K), r: dist(M, K) / 2 };
    const el: Element[] = [
      mnog('fig', [A, B, C], { skrytyy: false, rol: 'figure' }),
      otr('AB', A, B, { rol: 'figure' }),
      otr('BC', B, C, { rol: 'figure' }),
      otr('CA', C, A, { rol: 'figure', gruppy: ['ugly', 'eh'], cvet: 'a' }),
      otr('AK', A, K, { rol: 'aux' }),
      otr('CM', C, M, { rol: 'aux' }),
      otr('ME', M, E, { rol: 'aux' }),
      otr('KH', K, H, { rol: 'aux' }),
      otr('EH', E, H, { rol: 'aux', gruppy: ['ugly', 'eh', 'otvet'], cvet: 'b' }),
      otr('MK', M, K, {
        rol: 'construction',
        stil: 'punktir',
        skrytyy: true,
        gruppy: ['okr2', 'mk', 'eh'],
        cvet: 'c',
      }),
      okr('k1', k1.c, k1.r, { rol: 'construction', skrytyy: true, gruppy: ['okr1'], cvet: 'a' }),
      okr('k2', k2.c, k2.r, {
        rol: 'construction',
        skrytyy: true,
        gruppy: ['okr2', 'eh'],
        cvet: 'b',
      }),
      mnog('f-mbk', [M, B, K], { gruppy: ['mk'], cvet: 'b' }),
      mnog('f-cba', [C, B, A], { gruppy: ['mk'], cvet: 'a' }),
      ug('pK', A, K, C, { pryamoy: true, gruppy: ['okr1'], cvet: 'a' }),
      ug('pM', C, M, A, { pryamoy: true, gruppy: ['okr1'], cvet: 'a' }),
      ug('pE', M, E, K, { pryamoy: true, gruppy: ['okr2'], cvet: 'b' }),
      ug('pH', K, H, M, { pryamoy: true, gruppy: ['okr2'], cvet: 'b' }),
      ug('uKEH', K, E, H, { skrytyy: true, gruppy: ['ugly'], cvet: 'c' }),
      ug('uKAC', K, A, C, { skrytyy: true, gruppy: ['ugly'], cvet: 'c' }),
      ug('uB', A, B, C, { rol: 'angle' }),
      velUg('d-B', `${Math.round(angleAt(A, B, C))}°`, A, B, C),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('K', K),
      tch('M', M),
      tch('E', E),
      tch('H', H),
    ];
    return {
      elementy: el,
      zametka: null,
      znacheniya: [`$EH : AC = ${chisloTeX(dist(E, H) / dist(A, C), 3)}$`],
    };
  },
  shagi: ['Треугольник, высоты $AK$ и $CM$'],
});

/* ── 663. Биссектриса и средняя линия в прямоугольном треугольнике ── */

/** p = (AC, BC) — катеты; C — прямой угол. */
export function tochkiBissSred(t: Tochki) {
  const [b, a] = p2(t, 'p', [7, 24]);
  const C: T2 = [0, 0];
  const A: T2 = [-b, 0];
  const B: T2 = [0, a];
  const M = mid(A, B);
  const N = mid(B, C);
  const c = Math.hypot(a, b);
  const u = add(mul(sub(B, A), 1 / c), mul(sub(C, A), 1 / b));
  const L = intersect(A, add(A, u), M, N) ?? N;
  return { A, B, C, M, N, L };
}

export const OP_BISS_SRED = scena({
  id: 'bissektrisa-srednyaya-liniya',
  nachalo: { p: [7, 24] },
  pole: [-40, -40, 40, 40],
  goditsya: (t) => {
    const [b, a] = p2(t, 'p', [7, 24]);
    return a > 0 && b > 0 && a / b > 0.4 && a / b < 4;
  },
  sluchaynaya: (rnd) => {
    const b = vPromezhutke(rnd, 6, 12);
    return { p: [b, b * vPromezhutke(rnd, 0.6, 3.6)] };
  },
  postroit(t) {
    const { A, B, C, M, N, L } = tochkiBissSred(t);
    const [b, a] = p2(t, 'p', [7, 24]);
    const cosZapis = drobIliChislo(b, Math.hypot(a, b));
    const el: Element[] = [
      mnog('fig', [A, B, C], { skrytyy: false, rol: 'figure' }),
      mnog('f-blc', [B, L, C], { gruppy: ['pod', 'lb'], cvet: 'a' }),
      mnog('f-aml', [A, M, L], { gruppy: ['pod', 'ml'], cvet: 'b' }),
      otr('AB', A, B, { rol: 'figure' }),
      otr('BC', B, C, { rol: 'figure' }),
      otr('CA', C, A, { rol: 'figure' }),
      otr('MN', M, N, { rol: 'aux', gruppy: ['mn'], cvet: 'a' }),
      otr('NL', N, L, { rol: 'construction', stil: 'prodolzhenie', gruppy: ['mn'], cvet: 'a' }),
      otr('AL', A, L, { rol: 'aux', gruppy: ['ml', 'k'], cvet: 'b' }),
      otr('BL', B, L, { rol: 'aux', shtrihi: 1, gruppy: ['lb', 'pod'], cvet: 'a' }),
      otr('CL', C, L, { rol: 'aux', shtrihi: 1, gruppy: ['lb', 'pod'], cvet: 'a' }),
      otr('AM', A, M, { skrytyy: true, shtrihi: 2, gruppy: ['ml'], cvet: 'b' }),
      otr('ML', M, L, { skrytyy: true, shtrihi: 2, gruppy: ['ml'], cvet: 'b' }),
      ug('pC', A, C, B, { pryamoy: true }),
      ug('pN', B, N, L, { pryamoy: true, skrytyy: true, gruppy: ['mn'], cvet: 'a' }),
      ug('pL', A, L, B, { pryamoy: true, skrytyy: true, gruppy: ['lbc', 'k'], cvet: 'a' }),
      ug('u1', B, A, L, { skrytyy: true, gruppy: ['ml', 'lbc'], cvet: 'c' }),
      ug('u2', L, A, C, { skrytyy: true, gruppy: ['ml'], cvet: 'c' }),
      ug('u3', A, L, M, { skrytyy: true, gruppy: ['ml'], cvet: 'c' }),
      ug('u4', L, B, C, { skrytyy: true, gruppy: ['lbc'], cvet: 'c' }),
      ug('uA', B, A, C, { rol: 'angle' }),
      velUg('d-A', `cos A = ${cosZapis}`, B, A, C),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('M', M),
      tch('N', N),
      tch('L', L),
    ];
    return { elementy: el, zametka: null, znacheniya: [] };
  },
  shagi: ['Прямоугольный треугольник $ABC$'],
});

/* ── 664. Вневписанные окружности прямоугольного треугольника ─────── */

/** p = (BC, AC) — катеты; C — прямой угол. */
export function tochkiVnevpis(t: Tochki) {
  const [a, b] = p2(t, 'p', [A664, A664 + 4]);
  const C: T2 = [0, 0];
  const B: T2 = [a, 0];
  const A: T2 = [0, b];
  /* Вневписанные: напротив A (касается BC) и напротив B (касается AC). */
  const ka = vnevpisannaya(A, B, C);
  const kb = vnevpisannaya(B, C, A);
  return { A, B, C, ka, kb, a, b };
}
/**
 * Катеты для данных б): радиусы вневписанных r_a = s − b и r_b = s − a
 * равны 4 и 8, поэтому AC − BC = 4 и BC·AC/2 = 32: BC = 2√17 − 2.
 */
const A664 = 2 * Math.sqrt(17) - 2;

export const OP_VNEVPIS = scena({
  id: 'vnevpisannye-pryamougolnyy',
  nachalo: { p: [A664, A664 + 4] },
  pole: [-60, -60, 60, 60],
  goditsya: (t) => {
    const [a, b] = p2(t, 'p', [1, 1]);
    return a > 0 && b > 0 && a / b > 0.35 && a / b < 3;
  },
  sluchaynaya: (rnd) => {
    const a = vPromezhutke(rnd, 5, 10);
    return { p: [a, a * vPromezhutke(rnd, 0.5, 2)] };
  },
  postroit(t) {
    const { A, B, C, ka, kb } = tochkiVnevpis(t);
    /* Касания вневписанной (напротив A) с прямыми AB, AC, BC. */
    const T = foot(ka.c, A, B);
    const S = foot(ka.c, A, C);
    const P = foot(ka.c, B, C);
    const T2b = foot(kb.c, A, B);
    const prodl = (p: T2, q: T2, k: number) => add(q, mul(sub(q, p), k));
    const el: Element[] = [
      /* б) ищет площадь ACB. */
      mnog('fig', [A, B, C], { skrytyy: false, rol: 'region-sought' }),
      mnog('f-kv', [C, P, ka.c, S], { gruppy: ['kv'], cvet: 'a' }),
      otr('AB', A, B, { rol: 'figure' }),
      otr('BC', B, C, { rol: 'figure' }),
      otr('CA', C, A, { rol: 'figure' }),
      otr('AB+', B, prodl(A, B, 1.1), { rol: 'construction', stil: 'prodolzhenie' }),
      otr('BA+', A, prodl(B, A, 1.1), { rol: 'construction', stil: 'prodolzhenie' }),
      otr('AC+', C, prodl(A, C, 1.6), { rol: 'construction', stil: 'prodolzhenie' }),
      otr('BC+', C, prodl(B, C, 1.6), { rol: 'construction', stil: 'prodolzhenie' }),
      okr('ka', ka.c, ka.r, { rol: 'figure' }),
      okr('kb', kb.c, kb.r, { rol: 'figure' }),
      otr('AT', A, T, { skrytyy: true, gruppy: ['kas', 'polu'], cvet: 'a' }),
      otr('AS', A, S, { skrytyy: true, gruppy: ['kas', 'polu'], cvet: 'a' }),
      otr('BT', B, T, { skrytyy: true, shtrihi: 1, gruppy: ['kas'], cvet: 'b' }),
      otr('BP', B, P, { skrytyy: true, shtrihi: 1, gruppy: ['kas'], cvet: 'b' }),
      otr('CS', C, S, { skrytyy: true, shtrihi: 2, gruppy: ['kas', 'kv'], cvet: 'c' }),
      otr('CP', C, P, { skrytyy: true, shtrihi: 2, gruppy: ['kas', 'kv'], cvet: 'c' }),
      otr('IaP', ka.c, P, { rol: 'construction', stil: 'punktir', gruppy: ['kv'], cvet: 'a' }),
      otr('IaS', ka.c, S, { rol: 'construction', stil: 'punktir', gruppy: ['kv'], cvet: 'a' }),
      otr('IbT', kb.c, T2b, { rol: 'construction', stil: 'punktir' }),
      ug('pC', A, C, B, { pryamoy: true }),
      vel('d-ra', `r = ${ch(ka.r)}`, { vnutri: ka.c }),
      vel('d-rb', `r = ${ch(kb.r)}`, { vnutri: kb.c }),
      vel(
        'd-S',
        'S_ACB = ?',
        { vnutri: [(A[0] + B[0] + C[0]) / 3, (A[1] + B[1] + C[1]) / 3] },
        { rol: 'region-sought' },
      ),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('T', T, { skrytyy: true, gruppy: ['kas', 'polu'] }),
      tch('S', S, { skrytyy: true, gruppy: ['kas', 'polu', 'kv'] }),
      tch('P', P, { skrytyy: true, gruppy: ['kas', 'kv'] }),
    ];
    return { elementy: el, zametka: null, znacheniya: [] };
  },
  shagi: ['Прямоугольный треугольник и две окружности'],
});

/* ── 665. Квадрат и треугольник с периметром 2a ───────────────────── */

/** p = (CM, 0); сторона квадрата 7. */
export function tochkiKvadratPer(t: Tochki) {
  const [m, s0] = p2(t, 'p', [3, 7]);
  const s = s0 > 0 ? s0 : 7;
  /* CN из CM + CN + MN = 2s. */
  const n = (2 * s * s - 2 * s * m) / (2 * s - m);
  const A: T2 = [0, 0];
  const B: T2 = [0, s];
  const C: T2 = [s, s];
  const D: T2 = [s, 0];
  /* M на BC: CM = m; N на CD: CN = n. */
  const M: T2 = [s - m, s];
  const N: T2 = [s, s - n];
  const P = foot(A, M, N);
  return { A, B, C, D, M, N, P, s, m, n };
}

export const OP_KVADRAT_PER = scena({
  id: 'kvadrat-perimetr',
  nachalo: { p: [3, 7] },
  pole: [-20, -20, 20, 20],
  goditsya: (t) => {
    const { m, n, s } = tochkiKvadratPer(t);
    return m > 0.8 && m < s - 0.8 && n > 0.8 && n < s - 0.8;
  },
  sluchaynaya: (rnd) => ({ p: [vPromezhutke(rnd, 1.2, 5.8), 7] }),
  postroit(t) {
    const { A, B, C, D, M, N, P, s } = tochkiKvadratPer(t);
    const el: Element[] = [
      mnog('fig', [A, B, C, D], { skrytyy: false, rol: 'figure' }),
      mnog('reg', [C, M, N], { skrytyy: false, rol: 'region' }),
      otr('AB', A, B, { rol: 'figure' }),
      otr('BC', B, C, { rol: 'figure' }),
      otr('CD', C, D, { rol: 'figure' }),
      otr('DA', D, A, { rol: 'figure' }),
      otr('MN', M, N, { rol: 'aux' }),
      otr('AM', A, M, { rol: 'aux', gruppy: ['bis'], cvet: 'a' }),
      otr('AN', A, N, { rol: 'aux', gruppy: ['bis'], cvet: 'a' }),
      otr('AP', A, P, {
        rol: 'construction',
        stil: 'punktir',
        skrytyy: true,
        gruppy: ['kas', 'bis'],
        cvet: 'c',
      }),
      okr('vnev', A, s, {
        rol: 'construction',
        stil: 'punktir',
        skrytyy: true,
        gruppy: ['okr', 'kas'],
        cvet: 'c',
      }),
      otr('MB', M, B, { skrytyy: true, shtrihi: 1, gruppy: ['kas', 'bis'], cvet: 'a' }),
      otr('MP', M, P, { skrytyy: true, shtrihi: 1, gruppy: ['kas', 'bis'], cvet: 'a' }),
      otr('NP', N, P, { skrytyy: true, shtrihi: 2, gruppy: ['kas', 'bis'], cvet: 'b' }),
      otr('ND', N, D, { skrytyy: true, shtrihi: 2, gruppy: ['kas', 'bis'], cvet: 'b' }),
      ug('pB', A, B, C, { pryamoy: true, skrytyy: true, gruppy: ['okr'], cvet: 'a' }),
      ug('pD', C, D, A, { pryamoy: true, skrytyy: true, gruppy: ['okr'], cvet: 'a' }),
      ug('pP', A, P, M, { pryamoy: true, skrytyy: true, gruppy: ['kas'], cvet: 'a' }),
      ug('uMAN', M, A, N, { rol: 'angle', skrytyy: true, gruppy: ['bis', 'otvet'] }),
      velOtr('d-AB', ch(s), A, B),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('D', D),
      tch('M', M),
      tch('N', N),
      tch('P', P, { skrytyy: true, gruppy: ['kas', 'bis'] }),
    ];
    return {
      elementy: el,
      zametka: null,
      znacheniya: [
        `$CM + CN + MN = ${chisloTeX(dist(C, M) + dist(C, N) + dist(M, N))}$`,
        `$\\angle MAN = ${chisloTeX(angleAt(M, A, N), 1)}^\\circ$`,
      ],
    };
  },
  shagi: ['Квадрат $ABCD$, точки $M$ и $N$'],
});

/* ── 666. Середины сторон и основание высоты ─────────────────────── */

/** p = (∠A, ∠C) — углы в градусах; BC = 2√3. */
export function tochkiSerVys(t: Tochki) {
  const [uA, uC] = p2(t, 'p', [60, 45]);
  const [k] = p2(t, 'q', [1, 0]);
  const uB = 180 - uA - uC;
  /* BC = 2√3 · k. */
  const a = 2 * Math.sqrt(3) * (k > 0 ? k : 1);
  const c = (a * Math.sin(uC * RAD)) / Math.sin(uA * RAD);
  const B: T2 = [0, 0];
  const C: T2 = [a, 0];
  const A = polar(uB, c);
  const H = foot(A, B, C);
  return { A, B, C, H, A1: mid(B, C), B1: mid(A, C), C1: mid(A, B), uA, uB, uC, k: k > 0 ? k : 1 };
}

export const OP_SER_VYS = scena({
  id: 'serediny-i-vysota',
  nachalo: { p: [60, 45] },
  pole: [-20, -20, 20, 20],
  goditsya: (t) => {
    const { uA, uB, uC, H, A1, B, C } = tochkiSerVys(t);
    /* Основание высоты — на стороне, не совпадает с серединой. */
    return Math.min(uA, uB, uC) > 25 && uB < 88 && uC < 88 && dist(H, A1) > 0.12 * dist(B, C);
  },
  sluchaynaya: (rnd) => ({ p: [vPromezhutke(rnd, 40, 90), vPromezhutke(rnd, 30, 70)], q: [1, 0] }),
  postroit(t) {
    const { A, B, C, H, A1, B1, C1, uA, uC, k: kk } = tochkiSerVys(t);
    const k = circumcircle(A1, B1, C1);
    const el: Element[] = [
      mnog('fig', [A, B, C], { skrytyy: false, rol: 'figure' }),
      mnog('f-trap', [C1, B1, A1, H], { gruppy: ['trap'], cvet: 'a' }),
      otr('AB', A, B, { rol: 'figure' }),
      otr('BC', B, C, { rol: 'figure' }),
      otr('CA', C, A, { rol: 'figure' }),
      otr('AH', A, H, { rol: 'aux' }),
      otr('A1B1', A1, B1, { rol: 'aux', shtrihi: 1, gruppy: ['hc1'], cvet: 'b' }),
      otr('B1C1', B1, C1, { rol: 'aux', gruppy: ['trap'], cvet: 'a' }),
      otr('C1A1', C1, A1, { rol: 'aux' }),
      otr('HC1', H, C1, {
        rol: 'construction',
        stil: 'punktir',
        shtrihi: 1,
        skrytyy: true,
        gruppy: ['hc1', 'trap'],
        cvet: 'b',
      }),
      okr('k9', k.c, k.r, {
        rol: 'construction',
        stil: 'punktir',
        skrytyy: true,
        gruppy: ['okr'],
        cvet: 'c',
      }),
      ug('pH', A, H, B, { pryamoy: true }),
      ug('uA', B, A, C, { rol: 'angle' }),
      ug('uC', A, C, B, { rol: 'angle', dugi: 2 }),
      velUg('d-A', `${Math.round(uA)}°`, B, A, C),
      velUg('d-C', `${Math.round(uC)}°`, A, C, B),
      velOtr('d-BC', kk === 1 ? '2√3' : `${ch(2 * kk)}√3`, B, C),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('H', H),
      tch('A_1', A1),
      tch('B_1', B1),
      tch('C_1', C1),
    ];
    return { elementy: el, zametka: null, znacheniya: [`$A_1H = ${chisloTeX(dist(A1, H))}$`] };
  },
  shagi: ['Треугольник, середины сторон и высота'],
});

/* ── 668. Квадрат на гипотенузе: CM : OM ─────────────────────────── */

/** p = (AC, BC) — катеты; C — прямой угол. */
export function tochkiKvGipOtn(t: Tochki) {
  const [b, a] = p2(t, 'p', [8, 6]);
  const C: T2 = [0, 0];
  const A: T2 = [b, 0];
  const B: T2 = [0, a];
  const v = sub(B, A);
  const n: T2 = [v[1], -v[0]];
  /* Квадрат ABDE — по другую сторону от AB, чем C. */
  const m = mid(A, B);
  const nn: T2 = (C[0] - m[0]) * n[0] + (C[1] - m[1]) * n[1] > 0 ? [-n[0], -n[1]] : n;
  const D = add(B, nn);
  const E = add(A, nn);
  const O = mid(A, D);
  const M = intersect(O, C, A, B) ?? m;
  const I = incircle(A, B, C).c;
  return { A, B, C, D, E, O, M, I };
}

export const OP_KV_GIP_OTN = scena({
  id: 'kvadrat-na-gipotenuze-otnoshenie',
  nachalo: { p: [8, 6] },
  pole: [-40, -40, 40, 40],
  goditsya: (t) => {
    const [b, a] = p2(t, 'p', [8, 6]);
    return a > 0 && b > 0 && a / b > 0.3 && a / b < 3.3;
  },
  sluchaynaya: (rnd) => {
    const b = vPromezhutke(rnd, 6, 10);
    return { p: [b, b * vPromezhutke(rnd, 0.4, 2.4)] };
  },
  postroit(t) {
    const { A, B, C, D, E, O, M, I } = tochkiKvGipOtn(t);
    const sinA = dist(B, C) / dist(A, B);
    const el: Element[] = [
      mnog('fig', [A, B, C], { skrytyy: false, rol: 'figure' }),
      otr('AB', A, B, { rol: 'figure', gruppy: ['hordy'], cvet: 'b' }),
      otr('BC', B, C, { rol: 'figure' }),
      otr('CA', C, A, { rol: 'figure' }),
      otr('BD', B, D, { rol: 'figure' }),
      otr('DE', D, E, { rol: 'figure' }),
      otr('EA', E, A, { rol: 'figure' }),
      otr('OC', O, C, { rol: 'aux', gruppy: ['oa', 'hordy'], cvet: 'a' }),
      otr('OA', O, A, {
        rol: 'construction',
        stil: 'punktir',
        skrytyy: true,
        shtrihi: 1,
        gruppy: ['oa'],
        cvet: 'a',
      }),
      otr('OB', O, B, {
        rol: 'construction',
        stil: 'punktir',
        skrytyy: true,
        shtrihi: 1,
        gruppy: ['oa'],
        cvet: 'a',
      }),
      okr('k', mid(A, B), dist(A, B) / 2, {
        rol: 'construction',
        stil: 'punktir',
        skrytyy: true,
        gruppy: ['okr', 'oa', 'hordy'],
        cvet: 'c',
      }),
      ug('pC', A, C, B, { pryamoy: true, gruppy: ['okr'], cvet: 'a' }),
      ug('pO', A, O, B, { pryamoy: true, skrytyy: true, gruppy: ['okr'], cvet: 'a' }),
      ug('u1', A, C, O, { skrytyy: true, gruppy: ['oa', 'biss'], cvet: 'c' }),
      ug('u2', O, C, B, { skrytyy: true, gruppy: ['oa', 'biss'], cvet: 'c' }),
      ug('uA', B, A, C, { rol: 'angle' }),
      velUg('d-A', `sin A = ${String(Math.round(sinA * 1000) / 1000).replace('.', ',')}`, B, A, C),
      tch('A', A),
      tch('B', B),
      tch('C', C),
      tch('D', D),
      tch('E', E),
      tch('O', O),
      tch('M', M),
      tch('I', I, { skrytyy: true, gruppy: ['biss'] }),
    ];
    return {
      elementy: el,
      zametka: null,
      znacheniya: [`$CM : OM = ${chisloTeX(dist(C, M) / dist(O, M), 3)}$`],
    };
  },
  shagi: ['Прямоугольный треугольник и квадрат на гипотенузе'],
});

/* ── 669. Вписанный четырёхугольник с LM = MN ────────────────────── */

/** p = (∠LMN, положение K на дуге LN от 0 до 1). */
export function tochkiVpisLMN(t: Tochki) {
  const [uM, s] = p2(t, 'p', [150, 0.35]);
  const R = 1;
  /* Дуга LMN (с M) = 2(180° − ∠LMN); M — её середина, сверху. */
  const polu = 180 - uM;
  const M: T2 = polar(90, R);
  const L: T2 = polar(90 + polu, R);
  const N: T2 = polar(90 - polu, R);
  /* K — на дуге LN, не содержащей M. */
  const K: T2 = polar(90 + polu + s * (360 - 2 * polu), R);
  const P = intersect(K, M, L, N) ?? mid(L, N);
  /* Масштаб: KM задано (по умолчанию 8). */
  const [km] = p2(t, 'q', [8, 0]);
  const k = (km > 0 ? km : 8) / dist(K, M);
  const sk = (p: T2): T2 => [p[0] * k, p[1] * k];
  return { K: sk(K), L: sk(L), M: sk(M), N: sk(N), P: sk(P), O: [0, 0] as T2, R: R * k, uM };
}

/**
 * Середина сегмента круга (c, r), отсечённого хордой pq, — точка между
 * серединой хорды и серединой дуги pq (дуга против часовой от p к q).
 */
function segmentZaHordoy(c: T2, r: number, p: T2, q: T2): T2 {
  const m = mid(p, q);
  const d: T2 = [q[0] - p[0], q[1] - p[1]];
  /* Нормаль вправо от направления p → q: туда лежит дуга против часовой от p к q. */
  const l = Math.hypot(d[0], d[1]) || 1;
  const n: T2 = [d[1] / l, -d[0] / l];
  const h = r - ((m[0] - c[0]) * n[0] + (m[1] - c[1]) * n[1]);
  return [m[0] + (n[0] * h) / 2, m[1] + (n[1] * h) / 2];
}

export const OP_VPIS_LMN = scena({
  id: 'vpisannyy-ravnye-hordy',
  /* K не в середине дуги: ответ б) от положения K не зависит — так это видно. */
  nachalo: { p: [150, 0.35] },
  pole: [-60, -60, 60, 60],
  goditsya: (t) => {
    const [uM, s] = p2(t, 'p', [150, 0.35]);
    return uM > 95 && uM < 165 && s > 0.08 && s < 0.92;
  },
  sluchaynaya: (rnd) => ({ p: [vPromezhutke(rnd, 105, 160), vPromezhutke(rnd, 0.12, 0.88)] }),
  postroit(t) {
    const { K, L, M, N, P, O, R, uM } = tochkiVpisLMN(t);
    const el: Element[] = [
      okr('k', O, R, { rol: 'figure' }),
      /* б) ищет площадь KLMN. */
      mnog('fig', [K, L, M, N], { skrytyy: false, rol: 'region-sought' }),
      mnog('f-mlp', [M, L, P], { gruppy: ['pod'], cvet: 'a' }),
      mnog('f-mkl', [M, K, L], { gruppy: ['pod'], cvet: 'b' }),
      mnog('reg', [K, L, M, N], { gruppy: ['pl', 'otvet'], cvet: 'a' }),
      otr('KL', K, L, { rol: 'figure', gruppy: ['pl'], cvet: 'a' }),
      otr('LM', L, M, { rol: 'figure', shtrihi: 1 }),
      otr('MN', M, N, { rol: 'figure', shtrihi: 1 }),
      otr('NK', N, K, { rol: 'figure', gruppy: ['pl'], cvet: 'a' }),
      otr('KM', K, M, { rol: 'aux', gruppy: ['pod', 'pl'], cvet: 'b' }),
      otr('LN', L, N, { rol: 'aux', gruppy: ['pod', 'ptol'], cvet: 'a' }),
      ug('uMKL', M, K, L, { skrytyy: true, gruppy: ['ugly', 'pod', 'pl'], cvet: 'c' }),
      ug('uMLN', M, L, N, { skrytyy: true, gruppy: ['ugly', 'pod'], cvet: 'c' }),
      ug('uMKN', M, K, N, { skrytyy: true, gruppy: ['pl'], cvet: 'c' }),
      ug('uLMN', L, M, N, { rol: 'angle' }),
      velOtr('d-KM', ch(dist(K, M)), K, P),
      vel(
        'd-S',
        'S_KLMN = ?',
        /* KLMN узкий: подпись — в свободном сегменте круга за хордой KN (дуга без M). */
        { vnutri: segmentZaHordoy(O, R, K, N) },
        { rol: 'region-sought' },
      ),
      velUg('d-M', `${Math.round(uM)}°`, L, M, N),
      tch('K', K),
      tch('L', L),
      tch('M', M),
      tch('N', N),
      tch('P', P),
    ];
    return {
      elementy: el,
      zametka: null,
      znacheniya: [
        `$KM \\cdot MP = ${chisloTeX(dist(K, M) * dist(M, P))}$, $LM^2 = ${chisloTeX(dist(L, M) ** 2)}$`,
      ],
    };
  },
  shagi: ['Вписанный четырёхугольник $KLMN$'],
});

export const SCENY_NOVYE = [
  OP_DIAG_TRAP,
  OP_KAS_EF,
  OP_KVADRATY,
  OP_DVE_OKR,
  OP_CHEREZ_CENTR,
  OP_VPIS_KLM,
  OP_VYS_PERP,
  OP_BISS_SRED,
  OP_VNEVPIS,
  OP_KVADRAT_PER,
  OP_SER_VYS,
  OP_KV_GIP_OTN,
  OP_VPIS_LMN,
] as const;
