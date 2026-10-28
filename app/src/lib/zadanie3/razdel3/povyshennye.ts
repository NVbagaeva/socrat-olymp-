/**
 * Раздел III для «Вариантов повышенной сложности»: прототип той же
 * формы, что P03-48 (часть пирамиды у точки на боковом ребре), но
 * точка делит ребро в отношении m : n, считая от вершины, а плоскость
 * проходит через сторону основания; спрашивают меньшую из двух частей.
 * В список прототипов раздела не входит — его берёт только раздел
 * вариантов.
 *
 * Проверка формулу не повторяет: строится неправильная пирамида
 * объёма V, точка ставится на ребро, объёмы частей меряются по
 * координатам вершин.
 */

import { regularPyramid, vertex } from '../../solid/figures';
import { hullVolume, surfaceArea } from '../../solid/measure';
import { unlabelled } from '../../solid/drawings/common';
import { type Model } from '../../solid/model';
import type { Vec3 } from '../../solid/vec';
import { ru } from '../format';
import { type Params, type Prototype, num } from '../types';

/** Точка ребра PQ, делящая его в отношении m : n от P. */
function delit(P: Vec3, Q: Vec3, m: number, n: number): Vec3 {
  const t = m / (m + n);
  return [P[0] + (Q[0] - P[0]) * t, P[1] + (Q[1] - P[1]) * t, P[2] + (Q[2] - P[2]) * t];
}

function MN(p: Params): [number, number] {
  return [num(p, 'm'), num(p, 'n')];
}

/* ── P03-48S. Плоскость через сторону основания делит боковое ребро ─ */

export const P03_48S: Prototype = {
  id: 'P03-48S',
  razdel: 'III',
  nazvanie: 'Плоскость через сторону основания делит боковое ребро $m:n$: меньшая часть',
  tip: 'объём меньшей из частей треугольной пирамиды, на которые её делит плоскость через сторону основания',
  zadachnik: [150, 153],
  status: 'добавить',
  format: 'десятичная',

  uslovie: (p) => {
    const [m, n] = MN(p);
    return (
      `Объём треугольной пирамиды $SABC$ равен ${ru(num(p, 'V'))}. Плоскость проходит через сторону ` +
      `$AB$ основания и точку $M$ бокового ребра $SC$, причём $SM : MC = ${ru(m)} : ${ru(n)}$. ` +
      'Найдите объём меньшей из двух частей, на которые эта плоскость делит пирамиду.'
    );
  },

  dopustimo: (p) => {
    const [m, n] = MN(p);
    return num(p, 'V') > 0 && m > 0 && n > 0 && m !== n;
  },

  otvet: (p) => {
    const [m, n] = MN(p);
    return (num(p, 'V') * Math.min(m, n)) / (m + n);
  },

  poModeli: (p) => {
    /* Неправильная пирамида: основание — произвольный треугольник, вершина не над центром. */
    const [m, n] = MN(p);
    const A: Vec3 = [0, 0, 0];
    const B: Vec3 = [5, 0, 0];
    const C: Vec3 = [1, 4, 0];
    const h = (3 * num(p, 'V')) / 10;
    const S: Vec3 = [3, 1, h];
    const M = delit(S, C, m, n);
    return Math.min(hullVolume([S, A, B, M]), hullVolume([M, A, B, C]));
  },

  chertezh: (p) => {
    const [m, n] = MN(p);
    const body = regularPyramid(3, 2.6, 4.2);
    const M = delit(vertex(body, 'S'), vertex(body, 'C'), m, n);
    const model: Model = {
      alt: `Треугольная пирамида SABC; плоскость через AB и точку M ребра SC, SM : MC = ${m} : ${n}`,
      bodies: [body],
      marks: [{ p: M, label: 'M' }],
      lines: [
        { a: vertex(body, 'A'), b: M },
        { a: vertex(body, 'B'), b: M },
      ],
      sections: [{ points: [vertex(body, 'A'), vertex(body, 'B'), M] }],
    };
    return model;
  },

  shagi: (p) => {
    const V = num(p, 'V');
    const [m, n] = MN(p);
    const verh = (V * m) / (m + n);
    const niz = (V * n) / (m + n);
    return [
      {
        text: `Плоскость делит пирамиду на две треугольные пирамиды: $MABC$ (у основания) и $SABM$ (у вершины). Точка $M$ делит $SC$ на $${ru(m + n)}$ равных частей: $SM$ — ${ru(m)} из них, $MC$ — ${ru(n)}.`,
      },
      {
        text: `У пирамиды $MABC$ то же основание $ABC$, а высота в $\\dfrac{MC}{SC} = \\dfrac{${ru(n)}}{${ru(m + n)}}$ от высоты $S$: её объём $${ru(V)} \\cdot \\dfrac{${ru(n)}}{${ru(m + n)}} = ${ru(niz)}$.`,
        value: niz,
      },
      {
        text: `Вторая часть: $${ru(V)} - ${ru(niz)} = ${ru(verh)}$. Меньшая из частей — $${ru(Math.min(verh, niz))}$.`,
        value: Math.min(verh, niz),
      },
    ];
  },

  varianty: [],
};

/* ── Партия 4. Правильная четырёхугольная пирамида: полная поверхность ─ */

/** Апофема: по боковому ребру (vid 0) или по высоте (vid 1). */
function apofema(p: Params): number {
  const a = num(p, 'a');
  return num(p, 'vid') === 0
    ? Math.sqrt(num(p, 'b') ** 2 - (a / 2) ** 2)
    : Math.sqrt(num(p, 'h') ** 2 + (a / 2) ** 2);
}

/**
 * Полная поверхность правильной четырёхугольной пирамиды по стороне
 * основания и боковому ребру или высоте. Подвох — площадь боковой грани
 * считают через апофему, а не через ребро или высоту пирамиды; и не
 * забывают основание.
 */
export const PV03_PIRAMIDA_POVERHNOST: Prototype = {
  id: 'PV03-piramida-poverhnost',
  razdel: 'III',
  nazvanie: 'Правильная четырёхугольная пирамида: полная поверхность по ребру или высоте',
  tip: 'площадь полной поверхности правильной четырёхугольной пирамиды',
  zadachnik: [140, 141],
  status: 'добавить',
  format: 'десятичная',
  uslovie: (p) =>
    num(p, 'vid') === 0
      ? `У правильной четырёхугольной пирамиды сторона основания равна ${ru(num(p, 'a'))}, а каждое боковое ребро равно ${ru(num(p, 'b'))}. Найдите площадь полной поверхности пирамиды.`
      : `Высота правильной четырёхугольной пирамиды равна ${ru(num(p, 'h'))}, а сторона её основания равна ${ru(num(p, 'a'))}. Найдите площадь полной поверхности пирамиды.`,
  dopustimo: (p) => {
    const f = apofema(p);
    /* Пирамида существует: боковое ребро длиннее половины диагонали основания. */
    const est = num(p, 'vid') !== 0 || num(p, 'b') ** 2 > num(p, 'a') ** 2 / 2;
    return (
      est &&
      num(p, 'a') > 0 &&
      Number.isFinite(f) &&
      f > 0 &&
      Math.abs(f * 100 - Math.round(f * 100)) < 1e-9
    );
  },
  otvet: (p) => {
    const a = num(p, 'a');
    return Math.round((a * a + 2 * a * apofema(p)) * 1e9) / 1e9;
  },
  /* Настоящая пирамида: высота из ребра или дана, площадь — по граням. */
  poModeli: (p) => {
    const a = num(p, 'a');
    const h =
      num(p, 'vid') === 0 ? Math.sqrt(num(p, 'b') ** 2 - (a * a) / 2) : num(p, 'h');
    return Math.round(surfaceArea(regularPyramid(4, a / Math.SQRT2, h)) * 1e6) / 1e6;
  },
  chertezh: () => {
    const model: Model = {
      alt: 'Правильная четырёхугольная пирамида',
      bodies: [unlabelled(regularPyramid(4, 2.9, 4.2))],
    };
    return model;
  },
  shagi: (p) => {
    const a = num(p, 'a');
    const f = apofema(p);
    const osn = a * a;
    const bok = 2 * a * f;
    const pervyy =
      num(p, 'vid') === 0
        ? `Боковая грань — равнобедренный треугольник с основанием ${ru(a)} и боковыми сторонами ${ru(num(p, 'b'))}. Его высота (апофема) по теореме Пифагора: $\\sqrt{${ru(num(p, 'b'))}^2-${ru(a / 2)}^2}=${ru(f)}$.`
        : `Апофему находим из прямоугольного треугольника: высота пирамиды ${ru(num(p, 'h'))} и половина стороны основания ${ru(a / 2)} — катеты, апофема — гипотенуза: $\\sqrt{${ru(num(p, 'h'))}^2+${ru(a / 2)}^2}=${ru(f)}$.`;
    return [
      { text: pervyy, value: f },
      {
        text: `Четыре боковые грани: $4\\cdot\\dfrac12\\cdot ${ru(a)}\\cdot ${ru(f)} = ${ru(bok)}$. Основание — квадрат: $${ru(a)}^2 = ${ru(osn)}$.`,
        value: bok,
      },
      { text: `Полная поверхность: $${ru(osn)} + ${ru(bok)} = ${ru(osn + bok)}$.`, value: osn + bok },
    ];
  },
  varianty: [],
};
