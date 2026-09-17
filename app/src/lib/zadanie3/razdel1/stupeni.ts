/**
 * Раздел I, прототипы P03-05 и P03-11: ступенчатый многогранник.
 *
 * Это единственные два прототипа раздела, где числа стоят на самом
 * чертеже, а не в тексте. Поэтому у каждого варианта свой чертёж,
 * и вариант — это профиль ступеньки: вся ширина, обе высоты, ширина
 * высокой части и глубина.
 *
 * Пять профилей каждого прототипа взяты с чертежей домашней работы,
 * и все пять сошлись с её ответами. Остальные пять собраны по тому же
 * шаблону: числа новые, вид ступеньки тот же.
 */

import { surfaceArea, polyhedronVolume } from '../../solid/measure';
import { type Step, stepAlt, stepBody, stepModel } from '../../solid/drawings/steps';
import { ru } from '../format';
import { type Params, type Prototype, type Variant, num } from '../types';

function stepOf(p: Params): Step {
  return {
    W: num(p, 'W'),
    H: num(p, 'H'),
    w: num(p, 'w'),
    h: num(p, 'h'),
    depth: num(p, 'depth'),
  };
}

/** Площадь ступенчатого профиля: два прямоугольника. */
function profileArea(s: Step): number {
  return s.W * s.h + s.w * (s.H - s.h);
}

/** Периметр ступенчатого профиля: у ступеньки он равен 2(W + H). */
function profilePerimeter(s: Step): number {
  return 2 * (s.W + s.H);
}

function correct(p: Params): boolean {
  const s = stepOf(p);
  return s.w > 0 && s.w < s.W && s.h > 0 && s.h < s.H && s.depth > 0;
}

function variant(
  n: number,
  source: Variant['source'],
  ref: string,
  s: Step,
  sourceAnswer?: number,
): Variant {
  const params: Params = { W: s.W, H: s.H, w: s.w, h: s.h, depth: s.depth };
  return sourceAnswer === undefined
    ? { n, source, ref, params }
    : { n, source, ref, params, sourceAnswer };
}

/* Профили с чертежей домашней работы: ответы домашки сошлись. */
const SURFACE: { step: Step; ref: string; answer: number }[] = [
  { step: { W: 5, H: 3, w: 2, h: 2, depth: 4 }, ref: 'домашка 4', answer: 88 },
  { step: { W: 4, H: 4, w: 2, h: 3, depth: 4 }, ref: 'домашка 4, вариант 1', answer: 92 },
  { step: { W: 7, H: 5, w: 2, h: 3, depth: 3 }, ref: 'домашка 4, вариант 2', answer: 122 },
  { step: { W: 6, H: 4, w: 3, h: 3, depth: 4 }, ref: 'домашка 4, вариант 3', answer: 122 },
  { step: { W: 6, H: 3, w: 4, h: 2, depth: 5 }, ref: 'домашка 4, вариант 4', answer: 122 },
];

const SURFACE_NEW: Step[] = [
  { W: 4, H: 5, w: 1, h: 2, depth: 3 },
  { W: 6, H: 5, w: 2, h: 2, depth: 2 },
  { W: 5, H: 4, w: 2, h: 1, depth: 4 },
  { W: 7, H: 4, w: 3, h: 2, depth: 2 },
  { W: 8, H: 5, w: 3, h: 3, depth: 3 },
];

const VOLUME: { step: Step; ref: string; answer: number }[] = [
  { step: { W: 6, H: 4, w: 4, h: 2, depth: 3 }, ref: 'домашка 8', answer: 60 },
  { step: { W: 7, H: 6, w: 2, h: 5, depth: 3 }, ref: 'домашка 8, вариант 1', answer: 111 },
  { step: { W: 5, H: 4, w: 3, h: 2, depth: 2 }, ref: 'домашка 8, вариант 2', answer: 32 },
  { step: { W: 8, H: 4, w: 3, h: 2, depth: 3 }, ref: 'домашка 8, вариант 3', answer: 66 },
  { step: { W: 5, H: 6, w: 3, h: 2, depth: 2 }, ref: 'домашка 8, вариант 4', answer: 44 },
];

const VOLUME_NEW: Step[] = [
  { W: 6, H: 5, w: 2, h: 3, depth: 4 },
  { W: 7, H: 5, w: 3, h: 2, depth: 3 },
  { W: 4, H: 6, w: 2, h: 3, depth: 5 },
  { W: 9, H: 4, w: 4, h: 2, depth: 2 },
  { W: 5, H: 5, w: 2, h: 2, depth: 4 },
];

function variants(source: { step: Step; ref: string; answer: number }[], fresh: Step[]): Variant[] {
  return [
    ...source.map((item, i) => variant(i + 1, 'домашка', item.ref, item.step, item.answer)),
    ...fresh.map((step, i) => variant(source.length + i + 1, 'новый', 'новый', step)),
  ];
}

/* ── P03-05. Площадь поверхности ступенчатого многогранника ─────── */

export const P03_05: Prototype = {
  id: 'P03-05',
  razdel: 'I',
  nazvanie: 'Площадь поверхности ступенчатого многогранника',
  tip: 'площадь полной поверхности по числам на чертеже',
  zadachnik: [19, 20],
  status: 'есть',
  format: 'целое',

  uslovie: () =>
    'Найдите площадь поверхности многогранника, изображённого на рисунке ' +
    '(все двугранные углы — прямые).',

  dopustimo: correct,

  /* Два основания плюс боковая поверхность: периметр на глубину. */
  otvet: (p) => {
    const s = stepOf(p);
    return 2 * profileArea(s) + profilePerimeter(s) * s.depth;
  },

  poModeli: (p) => surfaceArea(stepBody(stepOf(p))),

  chertezh: (p) => {
    const s = stepOf(p);
    return stepModel(stepAlt(s), s);
  },

  shagi: (p) => {
    const s = stepOf(p);
    const area = profileArea(s);
    const per = profilePerimeter(s);
    return [
      {
        text: `Тело — призма над ступенчатым профилем. Площадь профиля: ${ru(s.W)} · ${ru(s.h)} + ${ru(s.w)} · ${ru(s.H - s.h)} = ${ru(area)}.`,
        value: area,
      },
      {
        text: `Ступенька вписана в прямоугольник ${ru(s.W)} на ${ru(s.H)}, поэтому её периметр равен периметру этого прямоугольника: ${ru(per)}.`,
        value: per,
      },
      {
        text: `Поверхность: два профиля плюс боковая: 2 · ${ru(area)} + ${ru(per)} · ${ru(s.depth)} = ${ru(2 * area + per * s.depth)}.`,
        value: 2 * area + per * s.depth,
      },
    ];
  },

  varianty: variants(SURFACE, SURFACE_NEW),
};

/* ── P03-11. Объём ступенчатого многогранника ───────────────────── */

export const P03_11: Prototype = {
  id: 'P03-11',
  razdel: 'I',
  nazvanie: 'Объём ступенчатого многогранника',
  tip: 'объём по числам на чертеже',
  zadachnik: [41, 41],
  status: 'есть',
  format: 'целое',

  uslovie: () =>
    'Найдите объём многогранника, изображённого на рисунке ' +
    '(все двугранные углы многогранника прямые).',

  dopustimo: correct,

  otvet: (p) => {
    const s = stepOf(p);
    return profileArea(s) * s.depth;
  },

  poModeli: (p) => polyhedronVolume(stepBody(stepOf(p))),

  chertezh: (p) => {
    const s = stepOf(p);
    return stepModel(stepAlt(s), s);
  },

  shagi: (p) => {
    const s = stepOf(p);
    const area = profileArea(s);
    return [
      {
        text: 'Тело — призма над ступенчатым профилем: объём равен площади профиля на глубину.',
      },
      {
        text: `Площадь профиля: ${ru(s.W)} · ${ru(s.h)} + ${ru(s.w)} · ${ru(s.H - s.h)} = ${ru(area)}.`,
        value: area,
      },
      {
        text: `Объём: ${ru(area)} · ${ru(s.depth)} = ${ru(area * s.depth)}.`,
        value: area * s.depth,
      },
    ];
  },

  varianty: variants(VOLUME, VOLUME_NEW),
};
