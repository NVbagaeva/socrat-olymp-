/**
 * Схема 1. Высоты треугольника и ортоцентр.
 *
 * В треугольнике ABC проведены высоты AM (M на прямой BC) и CK
 * (K на прямой AB), H — их точка пересечения. Тянутся вершины A, B, C.
 * При тупом угле высоты падают на продолжения сторон: продолжения
 * рисуются пунктиром, а до ортоцентра H высота продлевается тоже
 * пунктиром. Группы подсветки — те же, что у следствий и шагов
 * доказательства в content/zadanie18/skhemy/vysoty.ts.
 */

import {
  angleAt,
  chisloTeX,
  circumcircle,
  dist,
  foot,
  naDiametre,
  orthocenter,
  projT,
  treugolnikPoUglam,
  uglyTreugolnika,
} from '@/lib/skhemy/geometriya';
import { mnog, okr, otr, tch, ug } from '@/lib/skhemy/dsl';
import type { Element, Kadr, T2, Tochki, ZhivayaSkhema } from '@/lib/skhemy/tipy';

/** Наименьший угол треугольника, градусы: острее — фигура нечитаема. */
const MIN_UGOL = 14;
/** Наименьшая сторона в единицах модели. */
const MIN_STORONA = 1.2;
/** Угол ближе к прямому, чем на столько градусов, — схема вырождается. */
const POCHTI_PRYAMOY = 2;

const POLE = [-5, -4.5, 12, 10] as const;

function dalnyaya(p: T2, a: T2, b: T2): T2 {
  return dist(p, a) > dist(p, b) ? a : b;
}

export interface TochkiVysot {
  A: T2;
  B: T2;
  C: T2;
  M: T2;
  K: T2;
  H: T2;
}

/** Все точки схемы по вершинам — их же берёт проверка scripts/verify_schemes. */
export function tochkiVysot(t: Tochki): TochkiVysot {
  const A = t.A!;
  const B = t.B!;
  const C = t.C!;
  return { A, B, C, M: foot(A, B, C), K: foot(C, A, B), H: orthocenter(A, B, C) };
}

/** Продолжение стороны PQ до основания F, если F вне отрезка. */
function prodolzhenie(id: string, f: T2, p: T2, q: T2, shag: number): Element[] {
  const t = projT(f, p, q);
  if (t < 0) return [otr(id, p, f, { stil: 'prodolzhenie', shag })];
  if (t > 1) return [otr(id, q, f, { stil: 'prodolzhenie', shag })];
  return [];
}

/** Высота VF и её продолжение до ортоцентра H пунктиром. */
function vysotaDoH(id: string, v: T2, f: T2, h: T2): Element[] {
  const s = projT(h, v, f);
  if (s > 1 + 1e-9) return [otr(`${id}-h`, f, h, { stil: 'punktir', shag: 3 })];
  if (s < -1e-9) return [otr(`${id}-h`, v, h, { stil: 'punktir', shag: 3 })];
  return [];
}

function postroit(t: Tochki): Kadr {
  const { A, B, C, M, K, H } = tochkiVysot(t);
  const [uA, uB, uC] = uglyTreugolnika(A, B, C);
  const O = circumcircle(A, B, C);
  const AHC = circumcircle(A, H, C);
  const BHC = circumcircle(B, H, C);
  const ABH = circumcircle(A, B, H);
  const BH = naDiametre(B, H);
  const AC = naDiametre(A, C);

  const el: Element[] = [
    /* Заливки: подобные треугольники. */
    mnog('f-abm', [A, B, M], { gruppy: ['pr1'], cvet: 'a' }),
    mnog('f-cbk', [C, B, K], { gruppy: ['pr1'], cvet: 'b' }),
    mnog('f-abc', [A, B, C], { gruppy: ['podobie'], cvet: 'a' }),
    mnog('f-mbk', [M, B, K], { gruppy: ['podobie'], cvet: 'b' }),

    /* Вспомогательные окружности. */
    okr('o-ac', AC.c, AC.r, { stil: 'punktir', skrytyy: true, gruppy: ['akmc'], cvet: 'b' }),
    okr('o-bh', BH.c, BH.r, {
      stil: 'punktir',
      skrytyy: true,
      gruppy: ['bkhm', 'bh-dok'],
      cvet: 'b',
    }),
    okr('o-abc', O.c, O.r, {
      stil: 'punktir',
      skrytyy: true,
      gruppy: ['ravnye-r', 'ahc', 'bh'],
      cvet: 'a',
    }),
    okr('o-ahc', AHC.c, AHC.r, {
      stil: 'punktir',
      skrytyy: true,
      gruppy: ['ravnye-r', 'ahc'],
      cvet: 'b',
    }),
    okr('o-bhc', BHC.c, BHC.r, { stil: 'punktir', skrytyy: true, gruppy: ['ravnye-r'], cvet: 'c' }),
    okr('o-abh', ABH.c, ABH.r, { stil: 'punktir', skrytyy: true, gruppy: ['ravnye-r'], cvet: 'c' }),

    /* Шаг 0: треугольник. */
    otr('AB', A, B, { gruppy: ['podobie', 'pr1'], cvet: 'a' }),
    otr('BC', B, C, { gruppy: ['podobie', 'pr1'], cvet: { podobie: 'a', pr1: 'b' } }),
    otr('CA', C, A, { gruppy: ['podobie', 'akmc'], cvet: { podobie: 'a', akmc: 'b' } }),

    /* Шаг 1: высота AM. */
    ...prodolzhenie('BC+', M, B, C, 1),
    otr('AM', A, M, { shag: 1, gruppy: ['pr1'], cvet: 'a' }),
    ug('pM', A, M, dalnyaya(M, B, C), {
      pryamoy: true,
      shag: 1,
      gruppy: ['akmc', 'bkhm', 'pr1'],
      cvet: 'b',
    }),

    /* Шаг 2: высота CK. */
    ...prodolzhenie('AB+', K, A, B, 2),
    otr('CK', C, K, { shag: 2, gruppy: ['pr1'], cvet: 'b' }),
    ug('pK', C, K, dalnyaya(K, A, B), {
      pryamoy: true,
      shag: 2,
      gruppy: ['akmc', 'bkhm', 'pr1'],
      cvet: 'b',
    }),

    /* Шаг 3: ортоцентр (и продолжения высот до него). */
    ...vysotaDoH('AM', A, M, H),
    ...vysotaDoH('CK', C, K, H),

    /* Шаг 4: отрезок MK. */
    otr('MK', M, K, { shag: 4, gruppy: ['podobie', 'bh-dok'], cvet: 'b' }),

    /* Отрезок BH — при подсветке. */
    otr('BH', B, H, { skrytyy: true, gruppy: ['bkhm', 'bh', 'bh-dok'], cvet: 'b' }),

    /* Углы. Равные — одним цветом и одинаковым числом дуг. */
    ug('uB', A, B, C, { skrytyy: true, gruppy: ['podobie', 'ahc', 'bh-dok'], cvet: 'c' }),
    ug('uABM', A, B, M, { skrytyy: true, gruppy: ['pr1'], cvet: 'c' }),
    ug('uCBK', C, B, K, { skrytyy: true, gruppy: ['pr1'], cvet: 'c' }),
    ug('uBKM', B, K, M, { skrytyy: true, gruppy: ['podobie'], cvet: 'a' }),
    ug('uBCA', B, C, A, { skrytyy: true, gruppy: ['podobie'], cvet: 'a' }),
    ug('uBMK', B, M, K, { skrytyy: true, gruppy: ['podobie'], cvet: 'b', dugi: 2 }),
    ug('uBAC', B, A, C, { skrytyy: true, gruppy: ['podobie'], cvet: 'b', dugi: 2 }),
    ug('uAHC', A, H, C, { skrytyy: true, gruppy: ['ahc'], cvet: 'c', dugi: 2 }),

    /* Точки. */
    tch('A', A, { gruppy: ['akmc'], cvet: 'b' }),
    tch('B', B, { gruppy: ['bkhm', 'bh'], cvet: 'b' }),
    tch('C', C, { gruppy: ['akmc'], cvet: 'b' }),
    tch('M', M, { shag: 1, gruppy: ['akmc', 'bkhm'], cvet: 'b' }),
    tch('K', K, { shag: 2, gruppy: ['akmc', 'bkhm'], cvet: 'b' }),
    tch('H', H, { shag: 3, gruppy: ['bkhm', 'bh', 'ahc'], cvet: 'b' }),
    tch('O', O.c, { skrytyy: true, gruppy: ['bh'], cvet: 'a' }),
  ];
  /* При тупом B угол MBK вертикален углу ABC — отмечаем и его. */
  if (uB > 90) {
    el.push(ug('uMBK', M, B, K, { skrytyy: true, gruppy: ['podobie'], cvet: 'c' }));
  }

  const kosB = Math.abs(Math.cos((uB * Math.PI) / 180));
  const imena = ['A', 'B', 'C'] as const;
  const ugly = [uA, uB, uC];
  let zametka: string | null = null;
  const pochti = ugly.findIndex((u) => Math.abs(u - 90) < POCHTI_PRYAMOY);
  const tupoy = ugly.findIndex((u) => u > 90);
  if (pochti >= 0) {
    zametka = `Угол $${imena[pochti]}$ почти прямой: основания высот сливаются с вершиной $${imena[pochti]}$, и ортоцентр — тоже. Схема вырождается.`;
  } else if (tupoy === 1) {
    zametka =
      'Угол $B$ тупой: высоты $AM$ и $CK$ падают на продолжения сторон, ортоцентр $H$ — вне треугольника. Следствия сохраняются, коэффициент подобия — $|\\cos B|$.';
  } else if (tupoy >= 0) {
    const v = imena[tupoy];
    zametka = `Угол $${v}$ тупой: одна из высот падает на продолжение стороны, ортоцентр $H$ — вне треугольника. Следствия сохраняются.`;
  }

  const mk = dist(M, K) / dist(A, C);
  const bh = dist(B, H) / (2 * O.r);
  return {
    elementy: el,
    zametka,
    znacheniya: [
      `$\\angle B = ${Math.round(uB)}^\\circ$`,
      `$|\\cos B| = ${chisloTeX(kosB)}$`,
      `$MK : AC = ${chisloTeX(mk)}$`,
      `$BH : 2R = ${chisloTeX(bh)}$`,
    ],
  };
}

function goditsya(t: Tochki): boolean {
  const A = t.A!;
  const B = t.B!;
  const C = t.C!;
  if (Math.min(dist(A, B), dist(B, C), dist(A, C)) < MIN_STORONA) return false;
  return Math.min(...uglyTreugolnika(A, B, C)) >= MIN_UGOL;
}

function ogranichit(imya: string, p: T2, t: Tochki): T2 | null {
  const q: T2 = [
    Math.max(POLE[0], Math.min(POLE[2], p[0])),
    Math.max(POLE[1], Math.min(POLE[3], p[1])),
  ];
  return goditsya({ ...t, [imya]: q }) ? q : null;
}

/**
 * Случайный треугольник для карточек: углы не меньше 24°, не ближе 8°
 * к прямому; примерно в каждом четвёртом угол B тупой.
 */
function sluchaynaya(rnd: () => number): Tochki {
  for (let popytka = 0; popytka < 200; popytka += 1) {
    const tupoyB = rnd() < 0.25;
    const uB = tupoyB ? 100 + rnd() * 30 : 35 + rnd() * 45;
    const uA = 24 + rnd() * (180 - uB - 48);
    const uC = 180 - uA - uB;
    const ugly = [uA, uB, uC];
    if (ugly.some((u) => u < 24 || Math.abs(u - 90) < 8)) continue;
    return treugolnikPoUglam(uA, uC, 6);
  }
  return NACHALO;
}

const NACHALO: Tochki = { A: [0, 0], B: [2.3, 4.5], C: [6.6, 0] };

export const VYSOTY: ZhivayaSkhema = {
  id: 'vysoty',
  nachalo: NACHALO,
  podvizhnye: ['A', 'B', 'C'],
  pole: POLE,
  postroit,
  ogranichit,
  sluchaynaya,
  shagi: [
    'Треугольник $ABC$',
    'Высота $AM$ к прямой $BC$',
    'Высота $CK$ к прямой $AB$',
    'Высоты пересекаются в ортоцентре $H$',
    'Отрезок $MK$ — основания высот',
  ],
};

/** Угол в градусах — для проверок. */
export const ugolGr = angleAt;
