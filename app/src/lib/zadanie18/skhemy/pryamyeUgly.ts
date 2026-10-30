/**
 * Схема 6. Общая сторона и прямые углы: окружность на диаметре.
 *
 * У треугольников ABC и AMC общая гипотенуза AC, углы B и M прямые.
 * Тянутся A и C (концы диаметра), B и M — по окружности с диаметром AC.
 * Точки B и M могут быть по одну или по разные стороны от AC.
 */

import { mnog, okr, otr, tch, ug } from '@/lib/skhemy/dsl';
import {
  angleAt,
  angleOf,
  chisloTeX,
  dist,
  mid,
  orient,
  polar,
  sub,
} from '@/lib/skhemy/geometriya';
import type { Element, Kadr, T2, Tochki, ZhivayaSkhema } from '@/lib/skhemy/tipy';

const POLE = [-6, -6, 12, 9] as const;
/** Ближе этого угла (по окружности) к A или C точка B или M не подходит. */
const MIN_DUGA = 14;

function naOkr(p: T2, c: T2, r: number): T2 {
  const d = dist(p, c);
  return d < 1e-9
    ? [c[0] + r, c[1]]
    : [c[0] + ((p[0] - c[0]) / d) * r, c[1] + ((p[1] - c[1]) / d) * r];
}

function postroit(t: Tochki): Kadr {
  const A = t.A!;
  const C = t.C!;
  const B = t.B!;
  const M = t.M!;
  const O = mid(A, C);
  const R = dist(A, C) / 2;
  const odnaStorona = Math.sign(orient(A, C, B)) === Math.sign(orient(A, C, M));
  const el: Element[] = [
    mnog('f-abc', [A, B, C], { gruppy: ['diametr'], cvet: 'a' }),
    mnog('f-amc', [A, M, C], { gruppy: ['diametr'], cvet: 'b' }),
    okr('o', O, R, {
      stil: 'punktir',
      skrytyy: true,
      gruppy: ['okr', 'diametr', 'mediana', 'gmt', 'vpisannye'],
      cvet: 'a',
    }),
    otr('AC', A, C, { gruppy: ['diametr', 'gmt'], cvet: 'c' }),
    otr('AB', A, B, { shag: 1 }),
    otr('BC', B, C, { shag: 1 }),
    otr('AM', A, M, { shag: 2 }),
    otr('MC', M, C, { shag: 2 }),
    ug('pB', A, B, C, { pryamoy: true, shag: 1, gruppy: ['okr', 'diametr', 'gmt'], cvet: 'b' }),
    ug('pM', A, M, C, { pryamoy: true, shag: 2, gruppy: ['okr', 'diametr', 'gmt'], cvet: 'b' }),
    otr('OB', O, B, { skrytyy: true, gruppy: ['mediana'], cvet: 'b', shtrihi: 1 }),
    otr('OA', O, A, { skrytyy: true, gruppy: ['mediana', 'diametr'], cvet: 'a', shtrihi: 1 }),
    otr('OC', O, C, { skrytyy: true, gruppy: ['mediana', 'diametr'], cvet: 'a', shtrihi: 1 }),
    otr('OM', O, M, { skrytyy: true, gruppy: ['mediana'], cvet: 'b', shtrihi: 1 }),
    otr('BM', B, M, { skrytyy: true, gruppy: ['vpisannye'], cvet: 'b' }),
    ...(odnaStorona
      ? [
          ug('uBAM', B, A, M, {
            skrytyy: true,
            gruppy: ['vpisannye'],
            cvet: 'b',
            dugi: 2 as const,
          }),
          ug('uBCM', B, C, M, {
            skrytyy: true,
            gruppy: ['vpisannye'],
            cvet: 'b',
            dugi: 2 as const,
          }),
        ]
      : [
          ug('uBAC', B, A, C, {
            skrytyy: true,
            gruppy: ['vpisannye'],
            cvet: 'b',
            dugi: 2 as const,
          }),
          ug('uBMC', B, M, C, {
            skrytyy: true,
            gruppy: ['vpisannye'],
            cvet: 'b',
            dugi: 2 as const,
          }),
        ]),
    tch('A', A),
    tch('C', C),
    tch('B', B, { shag: 1, gruppy: ['okr'], cvet: 'a' }),
    tch('M', M, { shag: 2, gruppy: ['okr'], cvet: 'a' }),
    tch('O', O, { skrytyy: true, gruppy: ['mediana', 'diametr'], cvet: 'a' }),
  ];
  return {
    elementy: el,
    zametka: odnaStorona
      ? null
      : 'Точки $B$ и $M$ по разные стороны от $AC$: $ABCM$ — вписанный четырёхугольник, его противоположные углы $B$ и $M$ в сумме дают $180^\\circ$.',
    znacheniya: [
      `$\\angle ABC = ${Math.round(angleAt(A, B, C))}^\\circ$`,
      `$\\angle AMC = ${Math.round(angleAt(A, M, C))}^\\circ$`,
      `$OB = ${chisloTeX(dist(O, B))}$`,
      `$\\tfrac{AC}{2} = ${chisloTeX(R)}$`,
    ],
  };
}

function goditsya(t: Tochki): boolean {
  const A = t.A!;
  const C = t.C!;
  const O = mid(A, C);
  if (dist(A, C) < 2) return false;
  const uA = angleOf(sub(A, O));
  const uC = angleOf(sub(C, O));
  for (const k of ['B', 'M'] as const) {
    const u = angleOf(sub(t[k]!, O));
    for (const v of [uA, uC]) {
      const d = Math.abs(((u - v + 540) % 360) - 180);
      if (d < MIN_DUGA) return false;
    }
  }
  return dist(t.B!, t.M!) > 0.6;
}

function ogranichit(imya: string, p: T2, t: Tochki): T2 | null {
  let q: T2 = [
    Math.max(POLE[0], Math.min(POLE[2], p[0])),
    Math.max(POLE[1], Math.min(POLE[3], p[1])),
  ];
  if (imya === 'B' || imya === 'M') q = naOkr(q, mid(t.A!, t.C!), dist(t.A!, t.C!) / 2);
  return goditsya({ ...t, [imya]: q }) ? q : null;
}

/** Тянут A или C — B и M остаются на новой окружности под теми же углами к диаметру. */
function prisposobit(novye: Tochki, prezhnie: Tochki, imya: string): Tochki | null {
  if (imya !== 'A' && imya !== 'C') return novye;
  const O0 = mid(prezhnie.A!, prezhnie.C!);
  const O1 = mid(novye.A!, novye.C!);
  const povorot = angleOf(sub(novye.C!, novye.A!)) - angleOf(sub(prezhnie.C!, prezhnie.A!));
  const R1 = dist(novye.A!, novye.C!) / 2;
  const perenesti = (p: T2): T2 => {
    const u = angleOf(sub(p, O0)) + povorot;
    const q = polar(u, R1);
    return [O1[0] + q[0], O1[1] + q[1]];
  };
  const s = { ...novye, B: perenesti(prezhnie.B!), M: perenesti(prezhnie.M!) };
  return goditsya(s) ? s : null;
}

function sluchaynaya(rnd: () => number): Tochki {
  for (let i = 0; i < 300; i += 1) {
    const uB = 20 + rnd() * 140;
    const uM = rnd() < 0.7 ? 20 + rnd() * 140 : -(20 + rnd() * 140);
    const t: Tochki = {
      A: [0, 0],
      C: [6, 0],
      B: [3 + polar(uB, 3)[0], polar(uB, 3)[1]],
      M: [3 + polar(uM, 3)[0], polar(uM, 3)[1]],
    };
    if (goditsya(t)) return t;
  }
  return NACHALO;
}

const NACHALO: Tochki = {
  A: [0, 0],
  C: [6, 0],
  B: [3 + polar(128, 3)[0], polar(128, 3)[1]],
  M: [3 + polar(48, 3)[0], polar(48, 3)[1]],
};

export const PRYAMYE_UGLY: ZhivayaSkhema = {
  id: 'pryamye-ugly',
  nachalo: NACHALO,
  podvizhnye: ['A', 'C', 'B', 'M'],
  pole: POLE,
  postroit,
  ogranichit,
  prisposobit,
  sluchaynaya,
  shagi: [
    'Отрезок $AC$',
    'Прямоугольный треугольник $ABC$, $\\angle B = 90^\\circ$',
    'Прямоугольный треугольник $AMC$, $\\angle M = 90^\\circ$',
  ],
};
