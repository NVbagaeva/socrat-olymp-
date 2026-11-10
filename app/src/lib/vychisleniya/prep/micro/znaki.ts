/** Блок P8-3 · Знаки и четверти. */

import { gcd, round9 } from '../../numbers';
import { shag } from '../../prototypes/common';
import { d, fn, paren, quarterInterval } from '../../tex';
import type { Shag } from '../../types';
import type { PrepMicro } from '../types';
import { micro, ZNAK } from './common';

type Q = 1 | 2 | 3 | 4;
type F = 'sin' | 'cos' | 'tg';
const SIGN: Record<F, Record<Q, 1 | -1>> = {
  sin: { 1: 1, 2: 1, 3: -1, 4: -1 },
  cos: { 1: 1, 2: -1, 3: -1, 4: 1 },
  tg: { 1: 1, 2: -1, 3: 1, 4: -1 },
};
const ROMAN: Record<Q, string> = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV' };
const DEG: Record<Q, [number, number]> = { 1: [0, 90], 2: [90, 180], 3: [180, 270], 4: [270, 360] };

/** Имя функции: «синус»; в родительном падеже: «синуса». */
const IMYA: Record<F, string> = { sin: 'синус', cos: 'косинус', tg: 'тангенс' };
const IMYA_R: Record<F, string> = { sin: 'синуса', cos: 'косинуса', tg: 'тангенса' };

/** «В I четверти», «Во II четверти». */
function vChetverti(q: Q): string {
  return `${q === 2 ? 'Во' : 'В'} ${ROMAN[q]} четверти`;
}

/** Четверть в выкладке: \text{III четверть}. */
function chetvert(q: Q): string {
  return `\\text{${ROMAN[q]} четверть}`;
}

function mark(s: number): string {
  return s > 0 ? '> 0' : '< 0';
}

/** Почему у функции такой знак в четвертях. */
const PRAVILO: Record<F, string> = {
  sin: 'Синус — ордината точки на единичной окружности: выше оси $Ox$, в I и II четвертях, он положителен, ниже, в III и IV, — отрицателен',
  cos: 'Косинус — абсцисса точки на единичной окружности: правее оси $Oy$, в I и IV четвертях, он положителен, левее, во II и III, — отрицателен',
  tg: 'Тангенс — частное синуса и косинуса: где их знаки одинаковые (I и III четверти), он положителен, где разные (II и IV) — отрицателен',
};

function znak(f: F, formula: string, id: string, nazvanie: string): PrepMicro {
  return micro(
    id,
    nazvanie,
    formula,
    (r) => {
      const q = r.pick([1, 2, 3, 4] as const);
      const degrees = r.int(0, 1) === 0;
      const where = degrees
        ? `${DEG[q][0]}^\\circ < \\alpha < ${DEG[q][1]}^\\circ`
        : `\\alpha \\in ${quarterInterval(q)}`;
      const plus = SIGN[f][q] > 0;
      const chetvertTex =
        f === 'tg'
          ? `${chetvert(q)}:\\ \\sin\\alpha ${mark(SIGN.sin[q])},\\ \\cos\\alpha ${mark(SIGN.cos[q])}`
          : chetvert(q);
      return {
        uslovie: `Определите знак $${fn(f)}\\alpha$, если $${where}$.`,
        otvet: plus ? '1' : '2',
        razbor: [
          shag(
            PRAVILO[f],
            `${where} \\;\\Rightarrow\\; ${chetvertTex} \\;\\Rightarrow\\; ${fn(f)}\\alpha ${plus ? '> 0' : '< 0'}`,
          ),
        ],
        proverka: null,
      };
    },
    ZNAK,
  );
}

/**
 * Квадрат из основного тождества: find² = 1 − given², given = g.
 * Минус у g при возведении в квадрат пропадает.
 */
function kvadrat(find: 'sin' | 'cos', given: 'sin' | 'cos', g: number): Shag {
  const f2 = round9(1 - g * g);
  return shag(
    `Из основного тождества $\\sin^2\\alpha + \\cos^2\\alpha = 1$ находим квадрат ${IMYA_R[find]}${
      g < 0 ? `. Минус у ${IMYA_R[given]} при возведении в квадрат пропадает` : ''
    }`,
    `${fn(find)}^2\\alpha = 1 - ${fn(given)}^2\\alpha = 1 - ${paren(round9(g))}^{2} = 1 - ${d(round9(g * g))} = ${d(f2)}`,
  );
}

/** Корень из квадрата со знаком по четверти: f — искомое значение. */
function koren(find: 'sin' | 'cos', q: Q, f: number): Shag {
  const plus = f > 0;
  return shag(
    `${vChetverti(q)} ${IMYA[find]} ${plus ? 'положителен' : 'отрицателен'}, поэтому берём корень со знаком ${plus ? 'плюс' : 'минус'}. Корень находим подбором: $${d(Math.abs(f))}^{2} = ${d(round9(f * f))}$`,
    `${fn(find)}\\alpha = ${plus ? '' : '-'}\\sqrt{${d(round9(f * f))}} = ${d(round9(f))}`,
  );
}

const TRIPLES: [number, number, number][] = [
  [3, 4, 5],
  [6, 8, 10],
  [15, 20, 25],
  [7, 24, 25],
];

export const ZNAKI: PrepMicro[] = [
  micro(
    'P8-3-01',
    'Четверть по интервалу',
    '\\text{I}: \\left(0; \\frac{\\pi}{2}\\right),\\ \\text{II}: \\left(\\frac{\\pi}{2}; \\pi\\right),\\ \\text{III}: \\left(\\pi; \\frac{3\\pi}{2}\\right),\\ \\text{IV}: \\left(\\frac{3\\pi}{2}; 2\\pi\\right)',
    (r) => {
      const q = r.pick([1, 2, 3, 4] as const);
      const degrees = r.int(0, 1) === 0;
      const where = degrees
        ? `${DEG[q][0]}^\\circ < \\alpha < ${DEG[q][1]}^\\circ`
        : `\\alpha \\in ${quarterInterval(q)}`;
      return {
        uslovie: `Укажите номер четверти, в которой лежит $\\alpha$, если $${where}$.`,
        otvet: q,
        razbor: [
          shag(
            degrees
              ? 'Четверти отделены друг от друга углами $0^\\circ$, $90^\\circ$, $180^\\circ$, $270^\\circ$ и $360^\\circ$ — смотрим, между какими из них лежит $\\alpha$'
              : 'Четверти отделены друг от друга углами $0$, $\\frac{\\pi}{2}$, $\\pi$, $\\frac{3\\pi}{2}$ и $2\\pi$ — смотрим, между какими из них лежит $\\alpha$',
            `${where} \\;\\Rightarrow\\; \\text{${ROMAN[q]} четверть, номер } ${q}`,
          ),
        ],
        proverka: q,
      };
    },
  ),
  znak(
    'sin',
    '\\sin\\alpha > 0 \\text{ в I и II четвертях},\\ \\sin\\alpha < 0 \\text{ в III и IV}',
    'P8-3-02',
    'Знак синуса',
  ),
  znak(
    'cos',
    '\\cos\\alpha > 0 \\text{ в I и IV четвертях},\\ \\cos\\alpha < 0 \\text{ во II и III}',
    'P8-3-03',
    'Знак косинуса',
  ),
  znak(
    'tg',
    '\\operatorname{tg}\\alpha > 0 \\text{ в I и III четвертях},\\ \\operatorname{tg}\\alpha < 0 \\text{ во II и IV}',
    'P8-3-04',
    'Знак тангенса',
  ),
  micro('P8-3-05', 'Основное тождество, квадрат', '\\sin^2\\alpha + \\cos^2\\alpha = 1', (r) => {
    const s = r.pick([-9, -8, -7, -6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7, 8, 9]) / 10;
    const given = r.pick(['sin', 'cos'] as const);
    const find = given === 'sin' ? 'cos' : 'sin';
    const ans = round9(1 - s * s);
    return {
      uslovie: `Найдите $${fn(find)}^2\\alpha$, если $${fn(given)}\\alpha = ${d(s)}$.`,
      otvet: ans,
      razbor: [kvadrat(find, given, s)],
      proverka: 1 - s * s,
    };
  }),
  micro(
    'P8-3-06',
    'Значение в первой четверти',
    '\\sin\\alpha = \\sqrt{1 - \\cos^2\\alpha} \\text{ при } \\sin\\alpha > 0',
    (r) => {
      const [a, b, c] = r.pick(TRIPLES);
      const given = r.pick(['sin', 'cos'] as const);
      const find = given === 'sin' ? 'cos' : 'sin';
      const [g, f] = r.int(0, 1) === 0 ? [a / c, b / c] : [b / c, a / c];
      return {
        uslovie: `Найдите $${fn(find)}\\alpha$, если $${fn(given)}\\alpha = ${d(g)}$ и $\\alpha \\in \\left(0; \\frac{\\pi}{2}\\right)$.`,
        otvet: round9(f),
        razbor: [kvadrat(find, given, g), koren(find, 1, f)],
        proverka: Math.sqrt(1 - g * g),
      };
    },
  ),
  micro(
    'P8-3-07',
    'Тангенс через синус и косинус',
    '\\operatorname{tg}\\alpha = \\dfrac{\\sin\\alpha}{\\cos\\alpha}',
    (r) => {
      const [a, b, c] = r.pick(TRIPLES.slice(0, 3));
      const q = r.pick([1, 2, 3, 4] as const);
      const [s, co] = r.int(0, 1) === 0 ? [a / c, b / c] : [b / c, a / c];
      const sinV = SIGN.sin[q] * s;
      const cosV = SIGN.cos[q] * co;
      const ans = round9(sinV / cosV);
      if (!Number.isInteger(ans * 100)) {
        return null;
      }
      /* Без запятых: числитель и знаменатель умножаем на 10 или 100. */
      const scale =
        Number.isInteger(round9(s * 10)) && Number.isInteger(round9(co * 10)) ? 10 : 100;
      const top = Math.round(s * scale);
      const bottom = Math.round(co * scale);
      const g = gcd(top, bottom);
      const minus = ans < 0 ? '-' : '';
      const znaki =
        sinV < 0 && cosV < 0
          ? '. Синус и косинус оба отрицательны — частное положительно'
          : ans < 0
            ? '. Знаки синуса и косинуса разные — частное отрицательно'
            : '';
      return {
        uslovie: `Найдите $\\operatorname{tg}\\alpha$, если $\\sin\\alpha = ${d(sinV)}$, $\\cos\\alpha = ${d(cosV)}$.`,
        otvet: ans,
        razbor: [
          shag(
            `Тангенс — отношение синуса к косинусу: $\\operatorname{tg}\\alpha = \\dfrac{\\sin\\alpha}{\\cos\\alpha}$${znaki}. Убираем запятые — умножаем числитель и знаменатель на $${scale}$ — и сокращаем`,
            `\\operatorname{tg}\\alpha = \\dfrac{${d(sinV)}}{${d(cosV)}} = ${minus}\\dfrac{${top}}{${bottom}} = ${
              g === 1 ? '' : `${minus}\\dfrac{${top / g}}{${bottom / g}} = `
            }${d(ans)}`,
          ),
        ],
        proverka: sinV / cosV,
      };
    },
  ),
  micro(
    'P8-3-08',
    'Косинус двойного угла',
    '\\cos 2\\alpha = 1 - 2\\sin^2\\alpha = 2\\cos^2\\alpha - 1',
    (r) => {
      const s = r.pick([-9, -8, -7, -6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7, 8, 9]) / 10;
      const given = r.pick(['sin', 'cos'] as const);
      const ans = round9(given === 'sin' ? 1 - 2 * s * s : 2 * s * s - 1);
      const s2 = round9(s * s);
      const line =
        given === 'sin'
          ? `1 - 2\\sin^2\\alpha = 1 - 2 \\cdot ${paren(s)}^{2} = 1 - 2 \\cdot ${d(s2)} = 1 - ${d(round9(2 * s2))}`
          : `2\\cos^2\\alpha - 1 = 2 \\cdot ${paren(s)}^{2} - 1 = 2 \\cdot ${d(s2)} - 1 = ${d(round9(2 * s2))} - 1`;
      return {
        uslovie: `Найдите $\\cos 2\\alpha$, если $${fn(given)}\\alpha = ${d(s)}$.`,
        otvet: ans,
        razbor: [
          shag(
            `Берём формулу косинуса двойного угла, в которой есть только ${IMYA[given]}: $\\cos 2\\alpha = ${
              given === 'sin' ? '1 - 2\\sin^2\\alpha' : '2\\cos^2\\alpha - 1'
            }$${s < 0 ? `. Знак ${IMYA_R[given]} не важен — он стоит в квадрате` : ''}`,
            `\\cos 2\\alpha = ${line} = ${d(ans)}`,
          ),
        ],
        proverka: Math.cos(2 * (given === 'sin' ? Math.asin(s) : Math.acos(s))),
      };
    },
  ),
  micro(
    'P8-3-09',
    'Знак произведения',
    '(+)(+) = +,\\quad (-)(-) = +,\\quad (+)(-) = -',
    (r) => {
      const q = r.pick([1, 2, 3, 4] as const);
      const [f, g] = r.pick([
        ['sin', 'cos'],
        ['sin', 'tg'],
        ['cos', 'tg'],
      ] as const);
      const degrees = r.int(0, 1) === 0;
      const where = degrees
        ? `${DEG[q][0]}^\\circ < \\alpha < ${DEG[q][1]}^\\circ`
        : `\\alpha \\in ${quarterInterval(q)}`;
      const sf = SIGN[f][q];
      const sg = SIGN[g][q];
      const plus = sf * sg > 0;
      return {
        uslovie: `Определите знак $${fn(f)}\\alpha \\cdot ${fn(g)}\\alpha$, если $${where}$.`,
        otvet: plus ? '1' : '2',
        razbor: [
          shag(
            `Находим четверть, а в ней — знаки множителей: ${IMYA_R[f]} и ${IMYA_R[g]}`,
            `${where} \\;\\Rightarrow\\; ${chetvert(q)}:\\ ${fn(f)}\\alpha ${mark(sf)},\\ ${fn(g)}\\alpha ${mark(sg)}`,
          ),
          shag(
            plus
              ? `Знаки множителей одинаковые — произведение положительно${sf < 0 ? ': минус на минус даёт плюс' : ''}`
              : 'Знаки множителей разные — произведение отрицательно: плюс на минус даёт минус',
            `${fn(f)}\\alpha \\cdot ${fn(g)}\\alpha ${plus ? '> 0' : '< 0'}`,
          ),
        ],
        proverka: null,
      };
    },
    ZNAK,
  ),
  micro(
    'P8-3-10',
    'Значение с учётом четверти',
    '\\cos\\alpha = \\pm\\sqrt{1 - \\sin^2\\alpha},\\quad \\sin\\alpha = \\pm\\sqrt{1 - \\cos^2\\alpha}',
    (r) => {
      const [a, b, c] = r.pick(TRIPLES);
      const q = r.pick([2, 3, 4] as const);
      const given = r.pick(['sin', 'cos'] as const);
      const find = given === 'sin' ? 'cos' : 'sin';
      const [gAbs, fAbs] = r.int(0, 1) === 0 ? [a / c, b / c] : [b / c, a / c];
      const g = SIGN[given][q] * gAbs;
      const f = SIGN[find][q] * fAbs;
      return {
        uslovie: `Найдите $${fn(find)}\\alpha$, если $${fn(given)}\\alpha = ${d(round9(g))}$ и $\\alpha \\in ${quarterInterval(q)}$.`,
        otvet: round9(f),
        razbor: [kvadrat(find, given, g), koren(find, q, f)],
        proverka: f,
      };
    },
  ),
];
