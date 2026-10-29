/**
 * Раздел II для «Вариантов повышенной сложности»: прототипы той же
 * формы, что прототипы раздела, но с «подвохом» задачи варианта.
 * В список прототипов раздела (тренажёр, банк, «Собрать вариант») не
 * входят — их берёт только раздел вариантов.
 *
 *   P03-20S — как P03-20, но катеты с корнем, боковое ребро равно
 *             гипотенузе, спрашивают полную поверхность;
 *   P03-28S — пирамида, отсечённая от треугольной (и наклонной) призмы
 *             плоскостью через сторону нижнего основания и вершину
 *             верхнего, спрашивают объём оставшейся части.
 *
 * Проверка формулу не повторяет: строится настоящее тело, площади и
 * объёмы меряются по координатам вершин.
 */

import { prism, vertex } from '../../solid/figures';
import { hullVolume, distance, surfaceArea } from '../../solid/measure';
import { type Model } from '../../solid/model';
import { edge, face, prismModel } from '../../solid/drawings/common';
import { legPrismBody, regularPrismByArea } from './common';
import { HEX_NAMES, shapeHexSolid, shapeLeg } from './drawings';
import { letters, ru } from '../format';
import { type Params, type Prototype, num } from '../types';

/** k√q в TeX: «3\sqrt{3}», «\sqrt{2}». */
function kq(k: number, q: number): string {
  return `${k === 1 ? '' : ru(k)}\\sqrt{${q}}`;
}

/** Гипотенуза основания без корня: катеты a√q и b√q → c√q. */
function gipotenuza(p: Params): number {
  return Math.sqrt(num(p, 'a') ** 2 + num(p, 'b') ** 2);
}

/* ── P03-20S. Прямая призма: катеты с корнем, ребро = гипотенуза ── */

export const P03_20S: Prototype = {
  id: 'P03-20S',
  razdel: 'II',
  nazvanie:
    'Прямая призма над прямоугольным треугольником: полная поверхность, ребро равно гипотенузе',
  tip: 'полная поверхность прямой треугольной призмы, катеты с корнем, боковое ребро — гипотенуза',
  zadachnik: [66, 69],
  status: 'добавить',
  format: 'целое',

  uslovie: (p) => {
    const q = num(p, 'q');
    return (
      `В основании прямой призмы лежит прямоугольный треугольник с катетами $${kq(num(p, 'a'), q)}$ ` +
      `и $${kq(num(p, 'b'), q)}$. Боковое ребро призмы равно гипотенузе этого треугольника. ` +
      'Найдите площадь полной поверхности призмы.'
    );
  },

  dopustimo: (p) =>
    num(p, 'a') > 0 &&
    num(p, 'b') > 0 &&
    num(p, 'q') > 1 &&
    Number.isInteger(gipotenuza(p)) &&
    !Number.isInteger(Math.sqrt(num(p, 'q'))),

  otvet: (p) => {
    const [a, b, q] = [num(p, 'a'), num(p, 'b'), num(p, 'q')];
    const c = gipotenuza(p);
    return a * b * q + (a + b + c) * c * q;
  },

  poModeli: (p) => {
    /* Катеты — настоящие длины с корнем; ребро — гипотенуза, измеренная на модели. */
    const s = Math.sqrt(num(p, 'q'));
    const base = legPrismBody(num(p, 'a') * s, num(p, 'b') * s, 1);
    const h = distance(vertex(base, 'B'), vertex(base, 'C'));
    return surfaceArea(legPrismBody(num(p, 'a') * s, num(p, 'b') * s, h));
  },

  chertezh: () =>
    shapeLeg(
      'Прямая треугольная призма, в основании прямоугольный треугольник; боковое ребро равно гипотенузе',
    ),

  shagi: (p) => {
    const [a, b, q] = [num(p, 'a'), num(p, 'b'), num(p, 'q')];
    const c = gipotenuza(p);
    const osn = a * b * q;
    const bok = (a + b + c) * c * q;
    return [
      {
        text:
          `Гипотенуза: $\\sqrt{(${kq(a, q)})^2 + (${kq(b, q)})^2} = \\sqrt{${a * a * q} + ${b * b * q}} = ` +
          `\\sqrt{${c * c * q}} = ${kq(c, q)}$. Боковое ребро тоже равно $${kq(c, q)}$.`,
        value: c * Math.sqrt(q),
      },
      {
        text: `Два основания — два прямоугольных треугольника, вместе это произведение катетов: $${kq(a, q)} \\cdot ${kq(b, q)} = ${a * b} \\cdot ${q} = ${osn}$.`,
        value: osn,
      },
      {
        text:
          `Боковая поверхность прямой призмы — периметр основания на боковое ребро: ` +
          `$(${kq(a, q)} + ${kq(b, q)} + ${kq(c, q)}) \\cdot ${kq(c, q)} = ${a + b + c}\\sqrt{${q}} \\cdot ${kq(c, q)} = ${a + b + c} \\cdot ${c} \\cdot ${q} = ${bok}$.`,
        value: bok,
      },
      {
        text: `Полная поверхность: $${osn} + ${bok} = ${osn + bok}$.`,
        value: osn + bok,
      },
    ];
  },

  varianty: [],
};

/* ── P03-28S. Пирамида, отсечённая от призмы: оставшаяся часть ──── */

/** Наклонная треугольная призма для картинки: верх сдвинут вправо и назад. */
function naklonnaya(): Model {
  const body = prism(
    [
      [0, 0, 0],
      [4.6, 0, 0],
      [1.6, 2.6, 0],
    ],
    [1.5, 0.6, 4],
  );
  return prismModel(
    'Наклонная треугольная призма ABCA₁B₁C₁; плоскость через AB и C₁ отсекает пирамиду C₁ABC',
    body,
    {
      lines: [edge(body, 'A', 'C1'), edge(body, 'B', 'C1')],
      sections: [face(body, 'A', 'B', 'C1')],
    },
  );
}

export const P03_28S: Prototype = {
  id: 'P03-28S',
  razdel: 'II',
  nazvanie: 'Пирамида, отсечённая от треугольной призмы: объём оставшейся части',
  tip: 'объём части призмы, оставшейся после отсечения пирамиды через сторону основания и вершину другого основания',
  zadachnik: [94, 95],
  status: 'добавить',
  format: 'целое',

  uslovie: (p) =>
    `Объём треугольной призмы $ABCA_1B_1C_1$ равен ${ru(num(p, 'V'))}. Плоскость, проходящая через ` +
    'сторону $AB$ нижнего основания и вершину $C_1$ верхнего основания, отсекает от призмы ' +
    'треугольную пирамиду. Найдите объём оставшейся части призмы.',

  dopustimo: (p) => num(p, 'V') > 0,

  otvet: (p) => (2 * num(p, 'V')) / 3,

  poModeli: (p) => {
    /* Наклонная призма с произвольным треугольником в основании, высота — из V. */
    const area = 7.5;
    const h = num(p, 'V') / area;
    const body = prism(
      [
        [0, 0, 0],
        [5, 0, 0],
        [1, 3, 0],
      ],
      [2, 1, h],
    );
    return hullVolume(['A', 'B', 'A1', 'B1', 'C1'].map((n) => vertex(body, n)));
  },

  chertezh: () => naklonnaya(),

  shagi: (p) => {
    const V = num(p, 'V');
    return [
      {
        text: 'Отсечённая пирамида $C_1ABC$: её основание — основание призмы $ABC$, а высота — расстояние от $C_1$ до плоскости $ABC$, то есть высота призмы (и у наклонной призмы тоже).',
      },
      {
        text: `Объём пирамиды — треть объёма призмы: $${ru(V)} : 3 = ${ru(V / 3)}$.`,
        value: V / 3,
      },
      {
        text: `Остаётся $${ru(V)} - ${ru(V / 3)} = ${ru((2 * V) / 3)}$ — две трети призмы.`,
        value: (2 * V) / 3,
      },
    ];
  },

  varianty: [],
};

/* ── Партия 5. Многогранник на вершинах шестиугольной призмы ────── */

const SHEST = ['A', 'B', 'C', 'D', 'E', 'F'] as const;

/**
 * Вершины многогранника: vid 0 — тетраэдр на вершинах X, Y, W нижнего
 * основания (соседние X, Y и W через одну от Y) и вершине над соседней с W;
 * vid 1 — пирамида с основанием-прямоугольником X, Y, W, Z и вершиной
 * над оставшейся между Y и W. Сдвиг s поворачивает буквы по кругу.
 */
function shestVershiny(p: Params): string[] {
  const s = num(p, 's');
  const L = (k: number) => SHEST[(s + k) % 6] as string;
  return num(p, 'vid') === 1 ? [L(0), L(1), L(3), L(4), `${L(2)}1`] : [L(0), L(1), L(3), `${L(4)}1`];
}

/**
 * Объём многогранника на вершинах правильной шестиугольной призмы
 * (как P03-36…40): тетраэдр с основанием ABD или пирамида с основанием
 * ABDE. Подвох — треугольник ABD прямоугольный и занимает треть
 * шестиугольника, прямоугольник ABDE — две трети; объём — треть
 * произведения этой площади на боковое ребро.
 */
export const PV03_SHEST: Prototype = {
  id: 'PV03-shest',
  razdel: 'II',
  nazvanie: 'Многогранник на вершинах правильной шестиугольной призмы: тетраэдр или пирамида',
  tip: 'объём тетраэдра с основанием ABD или пирамиды с основанием ABDE',
  zadachnik: [124, 125],
  status: 'добавить',
  format: 'десятичная',
  uslovie: (p) =>
    `Найдите объём многогранника, вершинами которого являются точки $${shestVershiny(p).map(letters).join(', ')}$ ` +
    `правильной шестиугольной призмы $${HEX_NAMES}$, площадь основания которой равна ${ru(num(p, 'S'))}, ` +
    `а боковое ребро равно ${ru(num(p, 'h'))}.`,
  dopustimo: (p) => num(p, 'S') > 0 && num(p, 'h') > 0 && [0, 1].includes(num(p, 'vid')),
  otvet: (p) => {
    const k = num(p, 'vid') === 1 ? 2 : 1;
    return Math.round(((k * num(p, 'S') * num(p, 'h')) / 9) * 1e9) / 1e9;
  },
  poModeli: (p) => {
    const body = regularPrismByArea(6, num(p, 'S'), num(p, 'h'));
    return hullVolume(shestVershiny(p).map((name) => vertex(body, name)));
  },
  chertezh: (p) => {
    const v = shestVershiny(p);
    const apex = v.at(-1) as string;
    const osn = v.slice(0, -1);
    const rebra: [string, string][] = [
      ...osn.map((x, i) => [x, osn[(i + 1) % osn.length] as string] as [string, string]),
      ...osn.map((x) => [apex, x] as [string, string]),
    ];
    return shapeHexSolid(
      `Правильная шестиугольная призма ${HEX_NAMES}, выделен многогранник ${v.join(', ')}`,
      rebra,
    );
  },
  shagi: (p) => {
    const S = num(p, 'S');
    const h = num(p, 'h');
    const v = shestVershiny(p).map(letters);
    const pir = num(p, 'vid') === 1;
    const osn = pir ? v.slice(0, 4).join('') : v.slice(0, 3).join('');
    const dolya = pir ? 2 : 1;
    const so = (dolya * S) / 3;
    const ans = (so * h) / 3;
    return [
      {
        text: pir
          ? `Основание многогранника — прямоугольник $${osn}$: две его стороны — стороны шестиугольника, две другие — короткие диагонали. Он занимает две трети шестиугольника: $\\dfrac23\\cdot ${ru(S)}=${ru(so)}$.`
          : `Основание многогранника — треугольник $${osn}$: угол при вершине $${v[1]}$ прямой, катеты — сторона $a$ и короткая диагональ $a\\sqrt3$. Его площадь $\\dfrac{a^2\\sqrt3}{2}$ — треть шестиугольника: $${ru(S)} : 3=${ru(so)}$.`,
        value: so,
      },
      {
        text: `Вершина $${v.at(-1)}$ лежит в другом основании, высота многогранника равна боковому ребру. Объём: $\\dfrac13\\cdot ${ru(so)}\\cdot ${ru(h)}=${ru(ans)}$.`,
        value: ans,
      },
    ];
  },
  varianty: [],
};
