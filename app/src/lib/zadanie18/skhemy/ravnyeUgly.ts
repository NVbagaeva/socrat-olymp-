/**
 * Схема 5. Общая сторона и равные углы: четыре точки на окружности.
 *
 * У треугольников ABC и AMC общая сторона AC, точки B и M — по одну
 * сторону от AC. Тянутся A, C, B и M. Точку M можно увести с
 * окружности ABC: тогда видно, что изнутри круга отрезок AC виден под
 * бо́льшим углом, снаружи — под меньшим. Рядом с окружностью M
 * «примагничивается» к ней; пока M лежит на окружности, она остаётся
 * на ней и при перетаскивании A, B, C.
 */

import { duga, mnog, okr, otr, tch, ug } from '@/lib/skhemy/dsl';
import {
  angleAt,
  angleOf,
  circumcircle,
  dist,
  orient,
  polar,
  sub,
  uglyTreugolnika,
} from '@/lib/skhemy/geometriya';
import type { Element, Kadr, T2, Tochki, ZhivayaSkhema } from '@/lib/skhemy/tipy';

const POLE = [-5, -3, 11, 10] as const;
const MIN_UGOL = 12;
/** Ближе этого к окружности (доля радиуса) точка M примагничивается. */
const MAGNIT = 0.05;
/** Допуск «M на окружности» в построении. */
const NA_OKR = 1e-6;

export type PolozhenieM = 'na' | 'vnutri' | 'vne';

export function polozhenieM(t: Tochki): PolozhenieM {
  const o = circumcircle(t.A!, t.B!, t.C!);
  const d = dist(t.M!, o.c) - o.r;
  if (Math.abs(d) < NA_OKR * Math.max(1, o.r)) return 'na';
  return d < 0 ? 'vnutri' : 'vne';
}

/** Дуга окружности ABC от A до C, на которой лежит B (углы против часовой). */
export function dugaSB(A: T2, B: T2, C: T2): { c: T2; r: number; ot: number; do: number } {
  const o = circumcircle(A, B, C);
  const uA = angleOf(sub(A, o.c));
  const uB = angleOf(sub(B, o.c));
  const uC = angleOf(sub(C, o.c));
  const norm = (x: number) => ((x % 360) + 360) % 360;
  /* Против часовой от A до C проходим через B? */
  return norm(uB - uA) < norm(uC - uA)
    ? { c: o.c, r: o.r, ot: uA, do: uC }
    : { c: o.c, r: o.r, ot: uC, do: uA };
}

/** Отражение точки относительно прямой AC. */
function otrazit(p: T2, a: T2, c: T2): T2 {
  const d = sub(c, a);
  const t = ((p[0] - a[0]) * d[0] + (p[1] - a[1]) * d[1]) / (d[0] * d[0] + d[1] * d[1]);
  const f: T2 = [a[0] + d[0] * t, a[1] + d[1] * t];
  return [2 * f[0] - p[0], 2 * f[1] - p[1]];
}

function postroit(t: Tochki): Kadr {
  const A = t.A!;
  const B = t.B!;
  const C = t.C!;
  const M = t.M!;
  const o = circumcircle(A, B, C);
  const g = dugaSB(A, B, C);
  const oZerk = otrazit(o.c, A, C);
  /* Зеркальная дуга: те же углы, отражённые относительно AC. */
  const gA = angleOf(sub(A, oZerk));
  const gC = angleOf(sub(C, oZerk));
  const norm = (x: number) => ((x % 360) + 360) % 360;
  const zerkB = otrazit(B, A, C);
  const uZB = angleOf(sub(zerkB, oZerk));
  const [zOt, zDo] = norm(uZB - gA) < norm(gC - gA) ? [gA, gC] : [gC, gA];
  const pol = polozhenieM(t);
  const phi = angleAt(A, B, C);
  const psi = angleAt(A, M, C);

  const el: Element[] = [
    mnog('f-abc', [A, B, C], { gruppy: ['sinusy'], cvet: 'a' }),
    mnog('f-amc', [A, M, C], { gruppy: ['sinusy'], cvet: 'b' }),

    okr('o', o.c, o.r, {
      stil: 'punktir',
      skrytyy: true,
      gruppy: ['okr', 'vpisannye', 'sinusy', 'radius'],
      cvet: 'a',
    }),
    duga('g1', g.c, g.r, g.ot, g.do, { skrytyy: true, gruppy: ['gmt'], cvet: 'a' }),
    duga('g2', oZerk, g.r, zOt, zDo, {
      skrytyy: true,
      stil: 'punktir',
      gruppy: ['gmt'],
      cvet: 'b',
    }),

    otr('AC', A, C, { gruppy: ['gmt', 'radius'], cvet: 'c' }),
    otr('AB', A, B, { shag: 1 }),
    otr('BC', B, C, { shag: 1 }),
    otr('AM', A, M, { shag: 2 }),
    otr('MC', M, C, { shag: 2 }),
    otr('BM', B, M, { skrytyy: true, gruppy: ['vpisannye'], cvet: 'b' }),
    otr('OA', o.c, A, { skrytyy: true, gruppy: ['radius'], cvet: 'a' }),
    otr('OC', o.c, C, { skrytyy: true, gruppy: ['radius'], cvet: 'a' }),

    ug('uB', A, B, C, { shag: 1, gruppy: ['okr', 'sinusy', 'gmt', 'radius'], cvet: 'c' }),
    ug('uM', A, M, C, {
      shag: 2,
      gruppy: ['okr', 'sinusy', 'gmt'],
      cvet: 'c',
      ...(pol === 'na' ? {} : { dugi: 2 as const }),
    }),
    ug('uBAM', B, A, M, { skrytyy: true, gruppy: ['vpisannye'], cvet: 'b', dugi: 2 }),
    ug('uBCM', B, C, M, { skrytyy: true, gruppy: ['vpisannye'], cvet: 'b', dugi: 2 }),

    tch('A', A),
    tch('C', C),
    tch('B', B, { shag: 1, gruppy: ['okr', 'vpisannye'], cvet: 'a' }),
    tch('M', M, { shag: 2, gruppy: ['okr', 'vpisannye'], cvet: 'a' }),
    tch('O', o.c, { skrytyy: true, gruppy: ['radius'], cvet: 'a' }),
  ];

  const zametka =
    pol === 'na'
      ? null
      : pol === 'vnutri'
        ? 'Точка $M$ внутри круга $ABC$: отрезок $AC$ виден из неё под бо́льшим углом, $\\angle AMC > \\angle ABC$. Верни $M$ на окружность — углы сравняются.'
        : 'Точка $M$ вне круга $ABC$: отрезок $AC$ виден из неё под меньшим углом, $\\angle AMC < \\angle ABC$. Верни $M$ на окружность — углы сравняются.';
  return {
    elementy: el,
    zametka,
    znacheniya: [
      `$\\angle ABC = ${Math.round(phi)}^\\circ$`,
      `$\\angle AMC = ${Math.round(psi)}^\\circ$`,
      pol === 'na'
        ? '$M$ на окружности $ABC$'
        : pol === 'vnutri'
          ? '$M$ внутри круга'
          : '$M$ вне круга',
    ],
  };
}

function goditsya(t: Tochki): boolean {
  const A = t.A!;
  const B = t.B!;
  const C = t.C!;
  const M = t.M!;
  const ac = dist(A, C);
  if (ac < 1.5 || dist(B, M) < 0.5) return false;
  /* По одну сторону от AC и не вплотную к прямой. */
  const sB = orient(A, C, B) / ac;
  const sM = orient(A, C, M) / ac;
  if (Math.abs(sB) < 0.4 || Math.abs(sM) < 0.4 || Math.sign(sB) !== Math.sign(sM)) return false;
  if (Math.min(...uglyTreugolnika(A, B, C), ...uglyTreugolnika(A, M, C)) < MIN_UGOL) return false;
  return dist(A, B) > 1 && dist(B, C) > 1 && dist(A, M) > 1 && dist(M, C) > 1;
}

function vPole(p: T2): T2 {
  return [Math.max(POLE[0], Math.min(POLE[2], p[0])), Math.max(POLE[1], Math.min(POLE[3], p[1]))];
}

function naOkr(p: T2, c: T2, r: number): T2 {
  const d = dist(p, c);
  return d < 1e-9
    ? [c[0] + r, c[1]]
    : [c[0] + ((p[0] - c[0]) / d) * r, c[1] + ((p[1] - c[1]) / d) * r];
}

function ogranichit(imya: string, p: T2, t: Tochki): T2 | null {
  let q = vPole(p);
  if (imya === 'M') {
    const o = circumcircle(t.A!, t.B!, t.C!);
    if (Math.abs(dist(q, o.c) - o.r) < MAGNIT * o.r) q = naOkr(q, o.c, o.r);
  }
  return goditsya({ ...t, [imya]: q }) ? q : null;
}

/** M на окружности — остаётся на ней, когда тянут A, B или C. */
function prisposobit(novye: Tochki, prezhnie: Tochki, imya: string): Tochki | null {
  if (imya === 'M' || polozhenieM(prezhnie) !== 'na') return novye;
  const o = circumcircle(novye.A!, novye.B!, novye.C!);
  const s = { ...novye, M: naOkr(novye.M!, o.c, o.r) };
  return goditsya(s) ? s : null;
}

/** Точки дуги AC через вершину: доли x ∈ (0; 1) от A к C. */
function naDuge(phi: number, x: number): T2 {
  /* AC = 6 на оси x, дуга сверху; центр (3, 3 / tg φ), R = 3 / sin φ. */
  const rad = (phi * Math.PI) / 180;
  const c: T2 = [3, 3 / Math.tan(rad)];
  const r = 3 / Math.sin(rad);
  const uA = angleOf(sub([0, 0], c));
  const uC = angleOf(sub([6, 0], c));
  /* Верхняя дуга — по часовой от A к C. */
  const razmah = (((uA - uC) % 360) + 360) % 360;
  const p = polar(uA - razmah * x, r);
  return [c[0] + p[0], c[1] + p[1]];
}

function sluchaynaya(rnd: () => number): Tochki {
  for (let i = 0; i < 300; i += 1) {
    const phi = 35 + rnd() * 95;
    const x1 = 0.15 + rnd() * 0.7;
    const x2 = 0.15 + rnd() * 0.7;
    if (Math.abs(x1 - x2) < 0.25) continue;
    const t: Tochki = { A: [0, 0], C: [6, 0], B: naDuge(phi, x1), M: naDuge(phi, x2) };
    if (goditsya(t)) return t;
  }
  return NACHALO;
}

const NACHALO: Tochki = { A: [0, 0], C: [6, 0], B: naDuge(58, 0.3), M: naDuge(58, 0.74) };

export const RAVNYE_UGLY: ZhivayaSkhema = {
  id: 'ravnye-ugly',
  nachalo: NACHALO,
  podvizhnye: ['A', 'C', 'B', 'M'],
  pole: POLE,
  postroit,
  ogranichit,
  prisposobit,
  sluchaynaya,
  shagi: [
    'Отрезок $AC$',
    'Треугольник $ABC$ с углом $\\varphi$ при вершине $B$',
    'Точка $M$ по ту же сторону от $AC$, $\\angle AMC = \\varphi$',
  ],
};
