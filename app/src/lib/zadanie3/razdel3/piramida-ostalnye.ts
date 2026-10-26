/**
 * Раздел III, прототипы P03-44…51: остальные прототипы правильной
 * пирамиды — высота по боковому ребру и стороне, сечение через
 * середины боковых рёбер, объём, часть пирамиды у середины ребра,
 * высота правильной треугольной и шестиугольной пирамиды, отсечение
 * плоскостью через вершину и среднюю линию основания.
 */

import { hullVolume, polygonArea, polyhedronVolume } from '../../solid/measure';
import { point, regularPyramidByEdge } from './common';
import { distance } from '../../solid/measure';
import { solveBySearch } from '../search';
import {
  shapeHeightOnly,
  shapeLateralEdge,
  shapeMidpointPyramid,
  shapeMidSection,
  shapeVertexMidline,
  NAMES4,
} from './drawings';
import { round, ru } from '../format';
import { type HintStep, type Params, type Prototype, type Variant, num } from '../types';
import { chisla, chislo, tex, vopros } from '../podskazka';

function variant(
  n: number,
  source: Variant['source'],
  ref: string,
  params: Params,
  sourceAnswer?: number,
): Variant {
  return sourceAnswer === undefined
    ? { n, source, ref, params }
    : { n, source, ref, params, sourceAnswer };
}

/** Настоящее боковое ребро правильной n-угольной пирамиды со стороной a и высотой h. */
function lateralEdge(n: number, a: number, h: number): number {
  const body = regularPyramidByEdge(n, a, h);
  return distance(point(body, 'S'), point(body, 'A'));
}

/**
 * Высота, при которой настоящее боковое ребро равно b: подбором на
 * модели, без формулы с корнем.
 */
function heightByLateral(n: number, a: number, b: number): number {
  return solveBySearch(b, (h) => lateralEdge(n, a, h));
}

/* ── P03-44. Высота по боковому ребру и стороне основания ───────── */

export const P03_44: Prototype = {
  id: 'P03-44',
  razdel: 'III',
  nazvanie: 'Высота по боковому ребру и стороне основания',
  tip: 'высота правильной четырёхугольной пирамиды',
  zadachnik: [136, 137],
  status: 'есть',
  format: 'десятичная',

  uslovie: (p) =>
    `В правильной четырёхугольной пирамиде боковое ребро равно ${ru(num(p, 'b'))}, а сторона ` +
    `основания равна ${ru(num(p, 'a'))}. Найдите высоту пирамиды.`,

  dopustimo: (p) => {
    const a = num(p, 'a');
    const b = num(p, 'b');
    return a > 0 && b * b > (a * a) / 2;
  },

  otvet: (p) => {
    const a = num(p, 'a');
    const b = num(p, 'b');
    return Math.sqrt(b * b - (a * a) / 2);
  },

  poModeli: (p) => heightByLateral(4, num(p, 'a'), num(p, 'b')),

  chertezh: () =>
    shapeHeightOnly(
      'Правильная четырёхугольная пирамида с высотой: даны боковое ребро и сторона основания',
      4,
    ),

  shagi: (p) => {
    const a = num(p, 'a');
    const b = num(p, 'b');
    /* Половина диагонали иррациональна, и приближать её десятичной
       дробью незачем: в теореме Пифагора она входит квадратом,
       а квадрат — число короткое. */
    const half2 = round((a * a) / 2);
    const h = round(Math.sqrt(b * b - half2));
    return [
      {
        text:
          `Половина диагонали основания — радиус описанной окружности: $${ru(a)} \\cdot \\sqrt{2} : 2$. ` +
          `Её квадрат: $${ru(a)}^2 : 2 = ${ru(half2)}$.`,
        value: half2,
      },
      {
        text: `Высота: $\\sqrt{${ru(b)}^2 - ${ru(half2)}} = \\sqrt{${ru(round(b * b - half2))}} = ${ru(h)}$.`,
        value: h,
      },
    ];
  },

  podskazka: (p) => podskazka44(p),
  varianty: [
    variant(1, 'задачник', 'задачник 136', { b: 7.5, a: 10 }),
    variant(2, 'задачник', 'задачник 137', { b: 4.5, a: 6 }),
    variant(3, 'домашка', 'домашка 26, вариант 1', { b: 6, a: 8 }, 2),
    variant(4, 'домашка', 'домашка 26, вариант 2', { b: 3, a: 4 }, 1),
    variant(5, 'домашка', 'домашка 26, вариант 3', { b: 15, a: 20 }, 5),
    variant(6, 'новый', 'новый', { b: 9, a: 12 }),
    variant(7, 'новый', 'новый', { b: 12, a: 16 }),
    variant(8, 'новый', 'новый', { b: 13.5, a: 18 }),
    variant(9, 'новый', 'новый', { b: 21, a: 28 }),
    variant(10, 'новый', 'новый', { b: 18, a: 24 }),
  ],
};

/* ── P03-45. Сечение через середины боковых рёбер ────────────────── */

export const P03_45: Prototype = {
  id: 'P03-45',
  razdel: 'III',
  nazvanie: 'Сечение через середины боковых рёбер',
  tip: 'площадь среднего сечения правильной четырёхугольной пирамиды',
  zadachnik: [138, 141],
  status: 'есть',
  format: 'целое',

  uslovie: (p) =>
    `В правильной четырёхугольной пирамиде все рёбра равны ${ru(num(p, 'a'))}. Найдите площадь ` +
    'сечения пирамиды плоскостью, проходящей через середины боковых рёбер.',

  dopustimo: (p) => num(p, 'a') > 0,

  otvet: (p) => (num(p, 'a') * num(p, 'a')) / 4,

  poModeli: (p) => {
    const a = num(p, 'a');
    /* Все рёбра равны a: высота из бокового ребра = стороне. */
    const h = Math.sqrt(a * a - (a * a) / 2);
    const body = regularPyramidByEdge(4, a, h);
    const mid = (u: string, v: string) => {
      const pu = point(body, u);
      const pv = point(body, v);
      return [(pu[0] + pv[0]) / 2, (pu[1] + pv[1]) / 2, (pu[2] + pv[2]) / 2] as const;
    };
    return polygonArea([mid('S', 'A'), mid('S', 'B'), mid('S', 'C'), mid('S', 'D')]);
  },

  chertezh: () =>
    shapeMidSection('Правильная четырёхугольная пирамида, сечение через середины боковых рёбер'),

  shagi: (p) => {
    const a = num(p, 'a');
    return [
      { text: 'Сечение — квадрат, подобный основанию с коэффициентом ½ (середины рёбер).' },
      { text: `Площадь: $(${ru(a)} : 2)^2 = ${ru((a * a) / 4)}$.`, value: (a * a) / 4 },
    ];
  },

  podskazka: (p) => podskazka45(p),
  varianty: [
    variant(1, 'задачник', 'задачник 138', { a: 2 }),
    variant(2, 'задачник', 'задачник 139', { a: 6 }),
    variant(3, 'задачник', 'задачник 140', { a: 8 }),
    variant(4, 'задачник', 'задачник 141', { a: 10 }),
    variant(5, 'домашка', 'домашка 27, вариант 3', { a: 4 }, 4),
    variant(6, 'домашка', 'домашка 27, вариант 4', { a: 12 }, 36),
    variant(7, 'новый', 'новый', { a: 14 }),
    variant(8, 'новый', 'новый', { a: 16 }),
    variant(9, 'новый', 'новый', { a: 18 }),
    variant(10, 'новый', 'новый', { a: 20 }),
  ],
};

/* ── P03-46. Объём по высоте и боковому ребру ────────────────────── */

export const P03_46: Prototype = {
  id: 'P03-46',
  razdel: 'III',
  nazvanie: 'Объём по высоте и боковому ребру',
  tip: 'объём правильной четырёхугольной пирамиды',
  zadachnik: [142, 145],
  status: 'есть',
  format: 'целое',

  uslovie: (p) =>
    `В правильной четырёхугольной пирамиде высота равна ${ru(num(p, 'h'))}, боковое ребро равно ` +
    `${ru(num(p, 'b'))}. Найдите её объём.`,

  dopustimo: (p) => {
    const h = num(p, 'h');
    const b = num(p, 'b');
    return h > 0 && b > h;
  },

  otvet: (p) => {
    const h = num(p, 'h');
    const b = num(p, 'b');
    const a2 = 2 * (b * b - h * h);
    return (a2 * h) / 3;
  },

  poModeli: (p) => {
    const h = num(p, 'h');
    /* Сторона подбирается по настоящему боковому ребру, объём — по граням. */
    const a = solveBySearch(num(p, 'b'), (x) => lateralEdge(4, x, h));
    return polyhedronVolume(regularPyramidByEdge(4, a, h));
  },

  chertezh: () =>
    shapeHeightOnly(
      'Правильная четырёхугольная пирамида с высотой: даны высота и боковое ребро',
      4,
    ),

  shagi: (p) => {
    const h = num(p, 'h');
    const b = num(p, 'b');
    const a2 = 2 * (b * b - h * h);
    const v = (a2 * h) / 3;
    return [
      { text: `Квадрат стороны основания: $2 \\cdot (${ru(b)}^2 - ${ru(h)}^2) = ${ru(a2)}$.`, value: a2 },
      { text: `Объём: $${ru(a2)} \\cdot ${ru(h)} : 3 = ${ru(v)}$.`, value: v },
    ];
  },

  podskazka: (p) => podskazka46(p),
  varianty: [
    variant(1, 'задачник', 'задачник 142', { h: 3, b: 5 }),
    variant(2, 'задачник', 'задачник 143', { h: 2, b: 4 }),
    variant(3, 'задачник', 'задачник 144', { h: 2, b: 5 }),
    variant(4, 'задачник', 'задачник 145', { h: 3, b: 4 }),
    variant(5, 'домашка', 'домашка 28, вариант 2', { h: 6, b: 10 }, 256),
    variant(6, 'новый', 'новый', { h: 4, b: 5 }),
    variant(7, 'новый', 'новый', { h: 8, b: 10 }),
    variant(8, 'новый', 'новый', { h: 5, b: 13 }),
    variant(9, 'новый', 'новый', { h: 9, b: 15 }),
    variant(10, 'новый', 'новый', { h: 7, b: 25 }),
  ],
};

/* ── P03-47. Объём по боковому ребру и стороне a√2 ───────────────── */

export const P03_47: Prototype = {
  id: 'P03-47',
  razdel: 'III',
  nazvanie: 'Объём по боковому ребру и стороне $a\\sqrt{2}$',
  tip: 'объём правильной четырёхугольной пирамиды, сторона задана как k√2',
  zadachnik: [146, 149],
  status: 'добавить',
  format: 'целое',

  uslovie: (p) =>
    `В правильной четырёхугольной пирамиде $${NAMES4}$ с основанием $ABCD$ боковое ребро $SC$ равно ` +
    `${ru(num(p, 'sc'))}, сторона основания равна $${ru(num(p, 'k'))}\\sqrt{2}$. Найдите объём пирамиды.`,

  dopustimo: (p) => {
    const k = num(p, 'k');
    const sc = num(p, 'sc');
    return k > 0 && sc * sc > k * k;
  },

  otvet: (p) => {
    const k = num(p, 'k');
    const sc = num(p, 'sc');
    const h = Math.sqrt(sc * sc - k * k);
    const a = k * Math.SQRT2;
    return (a * a * h) / 3;
  },

  poModeli: (p) => {
    /* Сторона k√2 — из условия; высота подбирается по боковому ребру SC. */
    const a = num(p, 'k') * Math.SQRT2;
    const h = heightByLateral(4, a, num(p, 'sc'));
    return polyhedronVolume(regularPyramidByEdge(4, a, h));
  },

  chertezh: () =>
    shapeLateralEdge(`Правильная четырёхугольная пирамида ${NAMES4}, выделено боковое ребро SC`),

  shagi: (p) => {
    const k = num(p, 'k');
    const sc = num(p, 'sc');
    const h = Math.sqrt(sc * sc - k * k);
    const a2 = 2 * k * k;
    const v = (a2 * h) / 3;
    return [
      {
        text: `Сторона основания задана так, что половина диагонали равна ${ru(k)}: высота = $\\sqrt{${ru(sc)}^2 - ${ru(k)}^2} = ${ru(h)}$.`,
        value: h,
      },
      { text: `Площадь основания: $(${ru(k)}\\sqrt{2})^2 = ${ru(a2)}$.`, value: a2 },
      { text: `Объём: $${ru(a2)} \\cdot ${ru(h)} : 3 = ${ru(v)}$.`, value: v },
    ];
  },

  podskazka: (p) => podskazka47(p),
  varianty: [
    variant(1, 'задачник', 'задачник 146', { sc: 37, k: 35 }),
    variant(2, 'задачник', 'задачник 147', { sc: 17, k: 15 }),
    variant(3, 'задачник', 'задачник 148', { sc: 29, k: 21 }),
    variant(4, 'задачник', 'задачник 149', { sc: 26, k: 10 }),
    variant(5, 'новый', 'новый', { sc: 13, k: 12 }),
    variant(6, 'новый', 'новый', { sc: 25, k: 24 }),
    variant(7, 'новый', 'новый', { sc: 20, k: 16 }),
    variant(8, 'новый', 'новый', { sc: 41, k: 40 }),
    variant(9, 'новый', 'новый', { sc: 15, k: 9 }),
    variant(10, 'новый', 'новый', { sc: 61, k: 60 }),
  ],
};

/* ── P03-48. Пирамида EABC, E — середина SB ─────────────────────── */

export const P03_48: Prototype = {
  id: 'P03-48',
  razdel: 'III',
  nazvanie: 'Пирамида $EABC$, $E$ — середина $SB$',
  tip: 'объём части пирамиды — четверть полного',
  zadachnik: [150, 153],
  status: 'есть',
  format: 'целое',

  uslovie: (p) =>
    `Объём правильной четырёхугольной пирамиды $SABCD$ равен ${ru(num(p, 'V'))}. Точка $E$ — середина ` +
    'ребра $SB$. Найдите объём треугольной пирамиды $EABC$.',

  dopustimo: (p) => num(p, 'V') > 0,
  otvet: (p) => num(p, 'V') / 4,

  poModeli: (p) => {
    /* Пирамида с произвольными a, h, у которой a²h/3 = V. */
    const a = 6;
    const h = (3 * num(p, 'V')) / (a * a);
    const body = regularPyramidByEdge(4, a, h);
    const s = point(body, 'S');
    const b = point(body, 'B');
    const e: [number, number, number] = [(s[0] + b[0]) / 2, (s[1] + b[1]) / 2, (s[2] + b[2]) / 2];
    return hullVolume([e, point(body, 'A'), point(body, 'B'), point(body, 'C')]);
  },

  chertezh: () =>
    shapeMidpointPyramid(
      `Правильная четырёхугольная пирамида ${NAMES4}, E — середина ребра SB, выделена пирамида EABC`,
    ),

  shagi: (p) => {
    const V = num(p, 'V');
    return [
      {
        text: '$E$ лежит на середине $SB$, значит её высота над плоскостью $ABC$ вдвое меньше высоты $S$.',
      },
      { text: 'Основание $EABC$ (треугольник $ABC$) — половина основания $ABCD$.' },
      { text: `Объём $EABC$: ${ru(V)} · ½ · ½ = ${ru(V / 4)}.`, value: V / 4 },
    ];
  },

  podskazka: (p) => podskazka48(p),
  varianty: [
    variant(1, 'задачник', 'задачник 150', { V: 116 }),
    variant(2, 'задачник', 'задачник 151', { V: 152 }),
    variant(3, 'задачник', 'задачник 152', { V: 96 }),
    variant(4, 'задачник', 'задачник 153', { V: 88 }),
    variant(5, 'домашка', 'домашка 29, вариант 1', { V: 72 }, 18),
    variant(6, 'домашка', 'домашка 29, вариант 3', { V: 132 }, 33),
    variant(7, 'домашка', 'домашка 29, вариант 4', { V: 60 }, 15),
    variant(8, 'новый', 'новый', { V: 48 }),
    variant(9, 'новый', 'новый', { V: 200 }),
    variant(10, 'новый', 'новый', { V: 84 }),
  ],
};

/* ── P03-49. Высота правильной треугольной пирамиды ─────────────── */

export const P03_49: Prototype = {
  id: 'P03-49',
  razdel: 'III',
  nazvanie: 'Высота правильной треугольной пирамиды',
  tip: 'высота по боковому ребру и стороне основания',
  zadachnik: [154, 155],
  status: 'есть',
  format: 'десятичная',

  uslovie: (p) =>
    `В правильной треугольной пирамиде боковое ребро равно ${ru(num(p, 'b'))}, а сторона основания ` +
    `равна ${ru(num(p, 'a'))}. Найдите высоту пирамиды.`,

  dopustimo: (p) => {
    const a = num(p, 'a');
    const b = num(p, 'b');
    return a > 0 && b * b > (a * a) / 3;
  },

  otvet: (p) => {
    const a = num(p, 'a');
    const b = num(p, 'b');
    return Math.sqrt(b * b - (a * a) / 3);
  },

  poModeli: (p) => heightByLateral(3, num(p, 'a'), num(p, 'b')),

  chertezh: () =>
    shapeHeightOnly(
      'Правильная треугольная пирамида с высотой: даны боковое ребро и сторона основания',
      3,
    ),

  shagi: (p) => {
    const a = num(p, 'a');
    const b = num(p, 'b');
    /* Радиус иррационален, а его квадрат — нет: в теореме Пифагора
       нужен именно квадрат, поэтому десятичное приближение радиуса
       в разбор не идёт. */
    const r2 = round((a * a) / 3);
    const h = round(Math.sqrt(b * b - r2));
    return [
      {
        text:
          `Радиус окружности, описанной около основания: $${ru(a)} / \\sqrt{3}$. ` +
          `Его квадрат: $${ru(a)}^2 : 3 = ${ru(r2)}$.`,
        value: r2,
      },
      {
        text: `Высота: $\\sqrt{${ru(b)}^2 - ${ru(r2)}} = \\sqrt{${ru(round(b * b - r2))}} = ${ru(h)}$.`,
        value: h,
      },
    ];
  },

  podskazka: (p) => podskazka49(p),
  varianty: [
    variant(1, 'задачник', 'задачник 154', { b: 7, a: 10.5 }),
    variant(2, 'задачник', 'задачник 155', { b: 3, a: 4.5 }),
    variant(3, 'домашка', 'домашка 30, вариант 1', { b: 12, a: 18 }, 6),
    variant(4, 'домашка', 'домашка 30, вариант 3', { b: 4, a: 6 }, 2),
    variant(5, 'домашка', 'домашка 30, вариант 4', { b: 9, a: 13.5 }, 4.5),
    variant(6, 'новый', 'новый', { b: 6, a: 9 }),
    variant(7, 'новый', 'новый', { b: 8, a: 12 }),
    variant(8, 'новый', 'новый', { b: 14, a: 21 }),
    variant(9, 'новый', 'новый', { b: 10, a: 15 }),
    variant(10, 'новый', 'новый', { b: 11, a: 16.5 }),
  ],
};

/* ── P03-50. Пирамида, отсечённая через среднюю линию ────────────── */

export const P03_50: Prototype = {
  id: 'P03-50',
  razdel: 'III',
  nazvanie: 'Пирамида, отсечённая через среднюю линию',
  tip: 'объём отсечённой части — четверть полного',
  zadachnik: [156, 159],
  status: 'есть',
  format: 'десятичная',

  uslovie: (p) =>
    `Объём треугольной пирамиды равен ${ru(num(p, 'V'))}. Через вершину пирамиды и среднюю линию ` +
    'её основания проведена плоскость. Найдите объём отсечённой треугольной пирамиды.',

  dopustimo: (p) => num(p, 'V') > 0,
  otvet: (p) => num(p, 'V') / 4,

  poModeli: (p) => {
    /* Любой удобный треугольник в основании: катеты 3 и 4, высота из V. */
    const area = 6;
    const h = (3 * num(p, 'V')) / area;
    const A: [number, number, number] = [0, 0, 0];
    const B: [number, number, number] = [3, 0, 0];
    const C: [number, number, number] = [0, 4, 0];
    const S: [number, number, number] = [0, 0, h];
    const M: [number, number, number] = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2, 0];
    const N: [number, number, number] = [(A[0] + C[0]) / 2, (A[1] + C[1]) / 2, 0];
    return hullVolume([A, M, N, S]);
  },

  chertezh: () =>
    shapeVertexMidline('Треугольная пирамида, сечение через вершину и среднюю линию основания'),

  shagi: (p) => {
    const V = num(p, 'V');
    return [
      {
        text: 'Средняя линия отсекает от основания треугольник площадью в четверть исходного (подобие с коэффициентом ½); высота у отсечённой пирамиды та же.',
      },
      { text: `Объём отсечённой части: $${ru(V)} : 4 = ${ru(V / 4)}$.`, value: V / 4 },
    ];
  },

  podskazka: (p) => podskazka50(p),
  varianty: [
    variant(1, 'задачник', 'задачник 156', { V: 78 }),
    variant(2, 'задачник', 'задачник 157', { V: 94 }),
    variant(3, 'задачник', 'задачник 158', { V: 66 }),
    variant(4, 'задачник', 'задачник 159', { V: 82 }),
    variant(5, 'домашка', 'домашка 31, вариант 1', { V: 90 }, 22.5),
    variant(6, 'домашка', 'домашка 31, вариант 2', { V: 50 }, 12.5),
    variant(7, 'домашка', 'домашка 31, вариант 4', { V: 70 }, 17.5),
    variant(8, 'новый', 'новый', { V: 60 }),
    variant(9, 'новый', 'новый', { V: 100 }),
    variant(10, 'новый', 'новый', { V: 44 }),
  ],
};

/* ── P03-51. Высота правильной шестиугольной пирамиды ───────────── */

export const P03_51: Prototype = {
  id: 'P03-51',
  razdel: 'III',
  nazvanie: 'Высота правильной шестиугольной пирамиды',
  tip: 'высота по боковому ребру и стороне основания',
  zadachnik: [160, 163],
  status: 'есть',
  format: 'десятичная',

  uslovie: (p) =>
    `В правильной шестиугольной пирамиде боковое ребро равно ${ru(num(p, 'b'))}, а сторона основания ` +
    `равна ${ru(num(p, 'a'))}. Найдите высоту пирамиды.`,

  dopustimo: (p) => {
    const a = num(p, 'a');
    const b = num(p, 'b');
    return a > 0 && b > a;
  },

  otvet: (p) => {
    const a = num(p, 'a');
    const b = num(p, 'b');
    return Math.sqrt(b * b - a * a);
  },

  poModeli: (p) => heightByLateral(6, num(p, 'a'), num(p, 'b')),

  chertezh: () =>
    shapeHeightOnly(
      'Правильная шестиугольная пирамида с высотой: даны боковое ребро и сторона основания',
      6,
    ),

  shagi: (p) => {
    const a = num(p, 'a');
    const b = num(p, 'b');
    return [
      { text: 'Радиус окружности, описанной около правильного шестиугольника, равен его стороне.' },
      {
        text: `Высота: $\\sqrt{${ru(b)}^2 - ${ru(a)}^2} = ${ru(round(Math.sqrt(b * b - a * a)))}$.`,
        value: Math.sqrt(b * b - a * a),
      },
    ];
  },

  podskazka: (p) => podskazka51(p),
  varianty: [
    variant(1, 'задачник', 'задачник 160', { b: 6.5, a: 2.5 }),
    variant(2, 'задачник', 'задачник 161', { b: 7.4, a: 2.4 }),
    variant(3, 'задачник', 'задачник 162', { b: 8.5, a: 4 }),
    variant(4, 'задачник', 'задачник 163', { b: 4.1, a: 4 }),
    variant(5, 'домашка', 'домашка 32, вариант 1', { b: 2.9, a: 2 }, 2.1),
    variant(6, 'домашка', 'домашка 32, вариант 3', { b: 17, a: 8 }, 15),
    variant(7, 'новый', 'новый', { b: 5, a: 3 }),
    variant(8, 'новый', 'новый', { b: 10, a: 6 }),
    variant(9, 'новый', 'новый', { b: 13, a: 5 }),
    variant(10, 'новый', 'новый', { b: 6, a: 3.6 }),
  ],
};

/* ── Подсказки-вопросы ──────────────────────────────────────────── */

/** По какой формуле считать объём пирамиды: формула и типичные промахи. */
function formulaObema(): HintStep {
  return vopros(
    'По какой формуле найти объём пирамиды?',
    '$V = \\frac{1}{3} S h$',
    ['$V = S h$', '$V = \\frac{1}{2} S h$'],
    'Объём пирамиды — треть произведения площади основания на высоту.',
  );
}

function podskazka44(p: Params): HintStep[] {
  const a = num(p, 'a');
  const b = num(p, 'b');
  const half2 = (a * a) / 2;
  const otvet = Math.sqrt(b * b - half2);
  return [
    vopros(
      'Из какого прямоугольного треугольника найти высоту?',
      'Высота, половина диагонали основания и боковое ребро',
      [
        'Высота, половина стороны основания и боковое ребро',
        'Высота, сторона основания и боковое ребро',
      ],
      'Вершина правильной пирамиды проектируется в центр квадрата — середину диагонали.',
    ),
    vopros(
      'Чему равен квадрат половины диагонали основания?',
      chislo(half2),
      chisla([(a * a) / 4, a * a, 2 * a * a], half2, otvet),
      `Половина диагонали — $\\frac{${tex(a)}\\sqrt{2}}{2}$, её квадрат — $\\frac{${tex(a)}^2}{2}$.`,
    ),
    vopros(
      'Как найти высоту?',
      `$\\sqrt{${tex(b)}^2 - ${tex(half2)}}$`,
      [
        `$\\sqrt{${tex(b)}^2 + ${tex(half2)}}$`,
        `$\\sqrt{${tex(b)}^2 - ${tex(a)}^2}$`,
        `$${tex(b)}^2 - ${tex(half2)}$`,
      ],
      'Боковое ребро — гипотенуза, высота — катет.',
    ),
  ];
}

function podskazka45(p: Params): HintStep[] {
  const a = num(p, 'a');
  return [
    vopros(
      'Чем являются стороны сечения?',
      'Средними линиями боковых граней',
      ['Средними линиями основания', 'Высотами боковых граней'],
      'Каждая сторона сечения соединяет середины двух боковых рёбер и равна половине стороны основания.',
    ),
    vopros(
      'Во сколько раз площадь сечения меньше площади основания?',
      'В 4 раза',
      ['В 2 раза', 'В 8 раз', 'В $\\sqrt{2}$ раз'],
      'Сечение подобно основанию с коэффициентом $\\frac{1}{2}$, а площади относятся как квадрат коэффициента.',
    ),
    vopros(
      'Как найти площадь сечения?',
      `$(${tex(a)} : 2)^2$`,
      [`$${tex(a)}^2 : 2$`, `$(${tex(a)} : 4)^2$`, `$${tex(a)} \\cdot ${tex(a)} : 8$`],
    ),
  ];
}

function podskazka46(p: Params): HintStep[] {
  const h = num(p, 'h');
  const b = num(p, 'b');
  const d2 = b * b - h * h;
  return [
    vopros(
      'Как найти квадрат половины диагонали основания?',
      `$${tex(b)}^2 - ${tex(h)}^2$`,
      [`$${tex(b)}^2 + ${tex(h)}^2$`, `$(${tex(b)} - ${tex(h)})^2$`],
      `Высота, половина диагонали и боковое ребро образуют прямоугольный треугольник: $${tex(b)}^2 - ${tex(h)}^2 = ${tex(d2)}$.`,
    ),
    vopros(
      'Как найти площадь основания, если квадрат половины диагонали равен $d^2$?',
      '$S = 2d^2$',
      ['$S = d^2$', '$S = 4d^2$', '$S = \\frac{d^2}{2}$'],
      'Площадь квадрата — половина квадрата диагонали: $\\frac{(2d)^2}{2} = 2d^2$.',
    ),
    formulaObema(),
  ];
}

function podskazka47(p: Params): HintStep[] {
  const k = num(p, 'k');
  const sc = num(p, 'sc');
  const h = Math.sqrt(sc * sc - k * k);
  const s = 2 * k * k;
  const otvet = (s * h) / 3;
  return [
    vopros(
      'Чему равна половина диагонали основания?',
      chislo(k),
      [`$${tex(k)}\\sqrt{2}$`, ...chisla([2 * k, k / 2], k, otvet)],
      `Диагональ квадрата со стороной $${tex(k)}\\sqrt{2}$ равна $${tex(k)}\\sqrt{2} \\cdot \\sqrt{2} = ${tex(2 * k)}$.`,
    ),
    vopros(
      'Как найти высоту пирамиды?',
      `$\\sqrt{${tex(sc)}^2 - ${tex(k)}^2}$`,
      [
        `$\\sqrt{${tex(sc)}^2 + ${tex(k)}^2}$`,
        `$\\sqrt{${tex(sc)}^2 - 2 \\cdot ${tex(k)}^2}$`,
        `$${tex(sc)} - ${tex(k)}$`,
      ],
      'Боковое ребро $SC$ — гипотенуза, высота и половина диагонали — катеты.',
    ),
    vopros(
      'Чему равна площадь основания?',
      chislo(s),
      chisla([k * k, 4 * k * k, 2 * k], s, otvet),
      `$(${tex(k)}\\sqrt{2})^2 = ${tex(k)}^2 \\cdot 2$.`,
    ),
    formulaObema(),
  ];
}

function podskazka48(p: Params): HintStep[] {
  const V = num(p, 'V');
  return [
    vopros(
      'Во сколько раз высота пирамиды $EABC$ меньше высоты $SABCD$?',
      'В 2 раза',
      ['Они равны', 'В 3 раза', 'В 4 раза'],
      '$E$ — середина $SB$, поэтому она вдвое ближе к плоскости основания, чем $S$.',
    ),
    vopros(
      'Какую часть основания $ABCD$ составляет треугольник $ABC$?',
      'Половину',
      ['Четверть', 'Треть', 'Всё основание'],
      'Диагональ $AC$ делит квадрат на два равных треугольника.',
    ),
    vopros(
      'Как найти объём $EABC$?',
      `$${tex(V)} \\cdot \\frac{1}{2} \\cdot \\frac{1}{2}$`,
      [
        `$${tex(V)} \\cdot \\frac{1}{2}$`,
        `$${tex(V)} \\cdot \\frac{1}{2} \\cdot \\frac{1}{3}$`,
        `$${tex(V)} \\cdot \\frac{1}{8}$`,
      ],
      'И высота, и площадь основания уменьшились вдвое.',
    ),
  ];
}

function podskazka49(p: Params): HintStep[] {
  const a = num(p, 'a');
  const b = num(p, 'b');
  const r2 = (a * a) / 3;
  const otvet = Math.sqrt(b * b - r2);
  return [
    vopros(
      'Куда проектируется вершина правильной треугольной пирамиды?',
      'В центр описанной окружности основания',
      ['В середину стороны основания', 'В вершину основания'],
      'Поэтому высота, радиус $R$ этой окружности и боковое ребро образуют прямоугольный треугольник.',
    ),
    vopros(
      'Чему равен $R^2$?',
      chislo(r2),
      chisla([(a * a) / 2, (a * a) / 4, (a * a) / 12], r2, otvet),
      `$R = \\frac{a}{\\sqrt{3}}$, поэтому $R^2 = \\frac{${tex(a)}^2}{3}$.`,
    ),
    vopros(
      'Как найти высоту?',
      `$\\sqrt{${tex(b)}^2 - ${tex(r2)}}$`,
      [
        `$\\sqrt{${tex(b)}^2 + ${tex(r2)}}$`,
        `$\\sqrt{${tex(b)}^2 - ${tex(a)}^2}$`,
        `$${tex(b)}^2 - ${tex(r2)}$`,
      ],
      'Боковое ребро — гипотенуза, высота — катет.',
    ),
  ];
}

function podskazka50(p: Params): HintStep[] {
  const V = num(p, 'V');
  return [
    vopros(
      'Как высота отсечённой пирамиды относится к высоте исходной?',
      'Она та же',
      ['Вдвое меньше', 'Вчетверо меньше'],
      'Вершина у пирамид общая, а основания лежат в одной плоскости.',
    ),
    vopros(
      'Какую часть площади основания отсекает средняя линия?',
      'Четверть',
      ['Половину', 'Треть', 'Восьмую'],
      'Отсечённый треугольник подобен основанию с коэффициентом $\\frac{1}{2}$, а площади относятся как квадрат коэффициента.',
    ),
    vopros(
      'Как найти объём отсечённой пирамиды?',
      `$${tex(V)} : 4$`,
      [`$${tex(V)} : 2$`, `$${tex(V)} : 8$`, `$${tex(V)} : 3$`],
    ),
  ];
}

function podskazka51(p: Params): HintStep[] {
  const a = num(p, 'a');
  const b = num(p, 'b');
  const otvet = Math.sqrt(b * b - a * a);
  return [
    vopros(
      'Из какого прямоугольного треугольника найти высоту?',
      'Высота, радиус описанной окружности основания и боковое ребро',
      [
        'Высота, радиус вписанной окружности основания и боковое ребро',
        'Высота, сторона основания и апофема',
      ],
      'Вершина правильной пирамиды проектируется в центр основания.',
    ),
    vopros(
      'Чему равен радиус окружности, описанной около основания?',
      chislo(a),
      [`$${tex(a)}\\sqrt{3}$`, ...chisla([a / 2, 2 * a], a, otvet)],
      'Правильный шестиугольник складывается из шести правильных треугольников со стороной, равной стороне основания.',
    ),
    vopros(
      'Как найти высоту?',
      `$\\sqrt{${tex(b)}^2 - ${tex(a)}^2}$`,
      [
        `$\\sqrt{${tex(b)}^2 + ${tex(a)}^2}$`,
        `$\\sqrt{${tex(b)}^2 - ${tex(a / 2)}^2}$`,
        `$${tex(b)} - ${tex(a)}$`,
      ],
      'Боковое ребро — гипотенуза, высота — катет.',
    ),
  ];
}
