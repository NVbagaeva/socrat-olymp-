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
import { hullVolume } from '../../solid/measure';
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
