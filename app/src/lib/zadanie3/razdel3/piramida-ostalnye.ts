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
import { korenSummy, round, ru, tex } from '../format';
import { type Params, type Prototype, type Variant, num } from '../types';

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
        text: 'Половина диагонали основания — радиус описанной окружности. Приближать её незачем: в теореме Пифагора она входит квадратом, а квадрат — число короткое.',
        formula: `\\left(\\dfrac{${tex(a)}\\sqrt{2}}{2}\\right)^2 = \\dfrac{${tex(a)}^2}{2} = \\dfrac{${tex(round(a * a))}}{2} = ${tex(half2)}`,
        value: half2,
      },
      {
        text: 'Высота, радиус и боковое ребро образуют прямоугольный треугольник.',
        formula: `h = ${korenSummy([
          { tex: `${tex(b)}^2`, value: b * b },
          { tex: tex(half2), value: half2, znak: '-' },
        ])}`,
        value: h,
      },
    ];
  },

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
      {
        text: 'Значит сторона сечения вдвое меньше стороны основания, а площадь — квадрат этой стороны.',
        formula: `\\left(\\dfrac{${tex(a)}}{2}\\right)^2 = \\dfrac{${tex(round(a * a))}}{4} = ${tex(round((a * a) / 4))}`,
        value: (a * a) / 4,
      },
    ];
  },

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
      {
        text: 'Половина диагонали основания — катет прямоугольного треугольника с высотой и боковым ребром, а сторона основания вдвое больше её квадрата.',
        formula: `2 \\cdot (${tex(b)}^2 - ${tex(h)}^2) = 2 \\cdot (${tex(round(b * b))} - ${tex(round(h * h))}) = ${tex(round(a2))}`,
        value: a2,
      },
      {
        text: 'Объём пирамиды — треть произведения площади основания на высоту.',
        formula: `\\dfrac{${tex(round(a2))} \\cdot ${tex(h)}}{3} = \\dfrac{${tex(round(a2 * h))}}{3} = ${tex(round(v))}`,
        value: v,
      },
    ];
  },

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
  nazvanie: 'Объём по боковому ребру и стороне a√2',
  tip: 'объём правильной четырёхугольной пирамиды, сторона задана как k√2',
  zadachnik: [146, 149],
  status: 'добавить',
  format: 'целое',

  uslovie: (p) =>
    `В правильной четырёхугольной пирамиде ${NAMES4} с основанием ABCD боковое ребро SC равно ` +
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
        text: `Сторона основания задана так, что половина диагонали равна ${ru(k)}. Высота, эта половина и боковое ребро образуют прямоугольный треугольник.`,
        formula: `h = ${korenSummy([
          { tex: `${tex(sc)}^2`, value: sc * sc },
          { tex: `${tex(k)}^2`, value: k * k, znak: '-' },
        ])}`,
        value: h,
      },
      {
        text: 'Сторона основания равна половине диагонали, умноженной на корень из двух, а площадь — её квадрат.',
        formula: `(${tex(k)}\\sqrt{2})^2 = 2 \\cdot ${tex(round(k * k))} = ${tex(round(a2))}`,
        value: a2,
      },
      {
        text: 'Объём пирамиды — треть произведения площади основания на высоту.',
        formula: `\\dfrac{${tex(round(a2))} \\cdot ${tex(round(h))}}{3} = \\dfrac{${tex(round(a2 * h))}}{3} = ${tex(round(v))}`,
        value: v,
      },
    ];
  },

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
  nazvanie: 'Пирамида EABC, E — середина SB',
  tip: 'объём части пирамиды — четверть полного',
  zadachnik: [150, 153],
  status: 'есть',
  format: 'целое',

  uslovie: (p) =>
    `Объём правильной четырёхугольной пирамиды SABCD равен ${ru(num(p, 'V'))}. Точка E — середина ` +
    'ребра SB. Найдите объём треугольной пирамиды EABC.',

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
        text: 'E лежит на середине SB, значит её высота над плоскостью ABC вдвое меньше высоты S.',
      },
      { text: 'Основание EABC (треугольник ABC) — половина основания ABCD.' },
      {
        text: 'Вдвое меньше высота и вдвое меньше основание — объём меньше вчетверо.',
        formula: `\\dfrac{1}{2} \\cdot \\dfrac{1}{2} \\cdot ${tex(V)} = \\dfrac{${tex(V)}}{4} = ${tex(round(V / 4))}`,
        value: V / 4,
      },
    ];
  },

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
        text: 'Радиус окружности, описанной около основания, иррационален, а его квадрат — нет: в теореме Пифагора нужен именно квадрат.',
        formula: `\\left(\\dfrac{${tex(a)}}{\\sqrt{3}}\\right)^2 = \\dfrac{${tex(a)}^2}{3} = \\dfrac{${tex(round(a * a))}}{3} = ${tex(r2)}`,
        value: r2,
      },
      {
        text: 'Высота, радиус и боковое ребро образуют прямоугольный треугольник.',
        formula: `h = ${korenSummy([
          { tex: `${tex(b)}^2`, value: b * b },
          { tex: tex(r2), value: r2, znak: '-' },
        ])}`,
        value: h,
      },
    ];
  },

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
      {
        text: 'Значит объём отсечённой части — четверть исходного.',
        formula: `\\dfrac{${tex(V)}}{4} = ${tex(round(V / 4))}`,
        value: V / 4,
      },
    ];
  },

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
        text: 'Высота, радиус и боковое ребро образуют прямоугольный треугольник.',
        formula: `h = ${korenSummy([
          { tex: `${tex(b)}^2`, value: b * b },
          { tex: `${tex(a)}^2`, value: a * a, znak: '-' },
        ])}`,
        value: Math.sqrt(b * b - a * a),
      },
    ];
  },

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
