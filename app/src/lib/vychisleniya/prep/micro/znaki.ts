/** Блок P8-3 · Знаки и четверти. */

import { round9 } from '../../numbers';
import { d, fn, quarterInterval } from '../../tex';
import type { PrepMicro } from '../types';
import { micro, ZNAK } from './common';

type Q = 1 | 2 | 3 | 4;
const SIGN: Record<'sin' | 'cos' | 'tg', Record<Q, 1 | -1>> = {
  sin: { 1: 1, 2: 1, 3: -1, 4: -1 },
  cos: { 1: 1, 2: -1, 3: -1, 4: 1 },
  tg: { 1: 1, 2: -1, 3: 1, 4: -1 },
};
const ROMAN: Record<Q, string> = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV' };
const DEG: Record<Q, [number, number]> = { 1: [0, 90], 2: [90, 180], 3: [180, 270], 4: [270, 360] };

function znak(f: 'sin' | 'cos' | 'tg', formula: string, id: string, nazvanie: string): PrepMicro {
  return micro(
    id,
    nazvanie,
    formula,
    (r) => {
      const q = r.pick([1, 2, 3, 4] as const);
      const degrees = r.int(0, 1) === 0;
      const where = degrees ? `${DEG[q][0]}^\\circ < \\alpha < ${DEG[q][1]}^\\circ` : `\\alpha \\in ${quarterInterval(q)}`;
      const plus = SIGN[f][q] > 0;
      return {
        uslovie: `Определите знак $${fn(f)}\\alpha$, если $${where}$.`,
        otvet: plus ? '1' : '2',
        razbor: `$\\alpha$ в ${ROMAN[q]} четверти, там $${fn(f)}\\alpha ${plus ? '> 0' : '< 0'}$: знак «${plus ? 'плюс' : 'минус'}»`,
        proverka: null,
      };
    },
    ZNAK,
  );
}

const TRIPLES: [number, number, number][] = [
  [3, 4, 5],
  [6, 8, 10],
  [15, 20, 25],
  [7, 24, 25],
];

export const ZNAKI: PrepMicro[] = [
  micro('P8-3-01', 'Четверть по интервалу', '\\text{I}: \\left(0; \\frac{\\pi}{2}\\right),\\ \\text{II}: \\left(\\frac{\\pi}{2}; \\pi\\right),\\ \\text{III}: \\left(\\pi; \\frac{3\\pi}{2}\\right),\\ \\text{IV}: \\left(\\frac{3\\pi}{2}; 2\\pi\\right)', (r) => {
    const q = r.pick([1, 2, 3, 4] as const);
    const degrees = r.int(0, 1) === 0;
    const where = degrees ? `${DEG[q][0]}^\\circ < \\alpha < ${DEG[q][1]}^\\circ` : `\\alpha \\in ${quarterInterval(q)}`;
    return {
      uslovie: `Укажите номер четверти, в которой лежит $\\alpha$, если $${where}$.`,
      otvet: q,
      razbor: `$${where}$ — это ${ROMAN[q]} четверть, номер ${q}`,
      proverka: q,
    };
  }),
  znak('sin', '\\sin\\alpha > 0 \\text{ в I и II четвертях},\\ \\sin\\alpha < 0 \\text{ в III и IV}', 'P8-3-02', 'Знак синуса'),
  znak('cos', '\\cos\\alpha > 0 \\text{ в I и IV четвертях},\\ \\cos\\alpha < 0 \\text{ во II и III}', 'P8-3-03', 'Знак косинуса'),
  znak('tg', '\\operatorname{tg}\\alpha > 0 \\text{ в I и III четвертях},\\ \\operatorname{tg}\\alpha < 0 \\text{ во II и IV}', 'P8-3-04', 'Знак тангенса'),
  micro('P8-3-05', 'Основное тождество, квадрат', '\\sin^2\\alpha + \\cos^2\\alpha = 1', (r) => {
    const s = r.pick([-9, -8, -7, -6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7, 8, 9]) / 10;
    const given = r.pick(['sin', 'cos'] as const);
    const find = given === 'sin' ? 'cos' : 'sin';
    const ans = round9(1 - s * s);
    return {
      uslovie: `Найдите $${fn(find)}^2\\alpha$, если $${fn(given)}\\alpha = ${d(s)}$.`,
      otvet: ans,
      razbor: `$${fn(find)}^2\\alpha = 1 - ${fn(given)}^2\\alpha = 1 - ${d(round9(s * s))} = ${d(ans)}$`,
      proverka: 1 - s * s,
    };
  }),
  micro('P8-3-06', 'Значение в первой четверти', '\\sin\\alpha = \\sqrt{1 - \\cos^2\\alpha} \\text{ при } \\sin\\alpha > 0', (r) => {
    const [a, b, c] = r.pick(TRIPLES);
    const given = r.pick(['sin', 'cos'] as const);
    const find = given === 'sin' ? 'cos' : 'sin';
    const [g, f] = r.int(0, 1) === 0 ? [a / c, b / c] : [b / c, a / c];
    return {
      uslovie: `Найдите $${fn(find)}\\alpha$, если $${fn(given)}\\alpha = ${d(g)}$ и $\\alpha \\in \\left(0; \\frac{\\pi}{2}\\right)$.`,
      otvet: round9(f),
      razbor: `$${fn(find)}^2\\alpha = 1 - ${d(round9(g * g))} = ${d(round9(f * f))}$, в I четверти $${fn(find)}\\alpha > 0$, поэтому $${fn(find)}\\alpha = ${d(f)}$`,
      proverka: Math.sqrt(1 - g * g),
    };
  }),
  micro('P8-3-07', 'Тангенс через синус и косинус', '\\operatorname{tg}\\alpha = \\dfrac{\\sin\\alpha}{\\cos\\alpha}', (r) => {
    const [a, b, c] = r.pick(TRIPLES.slice(0, 3));
    const q = r.pick([1, 2, 3, 4] as const);
    const [s, co] = r.int(0, 1) === 0 ? [a / c, b / c] : [b / c, a / c];
    const sinV = SIGN.sin[q] * s;
    const cosV = SIGN.cos[q] * co;
    const ans = round9(sinV / cosV);
    if (!Number.isInteger(ans * 100)) {
      return null;
    }
    return {
      uslovie: `Найдите $\\operatorname{tg}\\alpha$, если $\\sin\\alpha = ${d(sinV)}$, $\\cos\\alpha = ${d(cosV)}$.`,
      otvet: ans,
      razbor: `$\\operatorname{tg}\\alpha = \\dfrac{${d(sinV)}}{${d(cosV)}} = ${d(ans)}$`,
      proverka: sinV / cosV,
    };
  }),
  micro('P8-3-08', 'Косинус двойного угла', '\\cos 2\\alpha = 1 - 2\\sin^2\\alpha = 2\\cos^2\\alpha - 1', (r) => {
    const s = r.pick([-9, -8, -7, -6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7, 8, 9]) / 10;
    const given = r.pick(['sin', 'cos'] as const);
    const ans = round9(given === 'sin' ? 1 - 2 * s * s : 2 * s * s - 1);
    const line = given === 'sin' ? `1 - 2 \\cdot ${d(round9(s * s))}` : `2 \\cdot ${d(round9(s * s))} - 1`;
    return {
      uslovie: `Найдите $\\cos 2\\alpha$, если $${fn(given)}\\alpha = ${d(s)}$.`,
      otvet: ans,
      razbor: `$\\cos 2\\alpha = ${line} = ${d(ans)}$`,
      proverka: Math.cos(2 * (given === 'sin' ? Math.asin(s) : Math.acos(s))),
    };
  }),
];
