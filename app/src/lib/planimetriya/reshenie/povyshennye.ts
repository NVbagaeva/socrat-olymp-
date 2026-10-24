/**
 * Решения прототипов раздела «Варианты повышенной сложности»
 * (stseny/povyshennye.ts): те же шаги, вопросы и сверка, что у
 * прототипов Блока 1.
 */

import type { Params } from '../stseny/dsl';
import { n, shag, vopros } from './obshchee';
import type { Reshenie } from './types';

export const RESHENIYA_POVYSHENNYE: Record<number, (p: Params) => Reshenie> = {
  101: (p) => {
    const s = p.a / 4;
    return {
      shagi: [
        shag(
          'Формула площади через угол',
          `Площадь треугольника — половина произведения двух сторон на синус угла между ними. Обе боковые стороны равны $\\sqrt{${p.a}}$, угол между ними $30^\\circ$, $\\sin 30^\\circ = \\dfrac12$.`,
          [`S = \\dfrac12\\cdot \\sqrt{${p.a}}\\cdot \\sqrt{${p.a}}\\cdot \\sin 30^\\circ`],
          1,
        ),
        shag(
          'Корень на корень',
          `Произведение одинаковых корней — подкоренное число: $\\sqrt{${p.a}}\\cdot\\sqrt{${p.a}} = ${p.a}$. Корень из ответа извлекать не нужно.`,
          [`S = \\dfrac12\\cdot ${p.a}\\cdot \\dfrac12 = \\dfrac{${p.a}}{4} = ${n(s)}`],
        ),
      ],
      voprosy: [
        vopros(
          'По какой формуле считаем площадь?',
          ['$\\frac12 ab\\sin\\gamma$', '$\\frac12 ah$ с высотой к основанию', '$a^2$'],
          'Известны две стороны и угол между ними — это формула через синус.',
          1,
        ),
        vopros(
          `Чему равно $\\sqrt{${p.a}}\\cdot\\sqrt{${p.a}}$?`,
          [`$${p.a}$`, `$2\\sqrt{${p.a}}$`, `$\\sqrt{${2 * p.a}}$`],
          'Квадрат корня равен подкоренному числу.',
        ),
        vopros(
          'Чему равен $\\sin 30^\\circ$?',
          ['$\\frac12$', '$\\frac{\\sqrt3}{2}$', '$1$'],
          'Катет против угла $30^\\circ$ — половина гипотенузы.',
          1,
        ),
      ],
      sverka: `Сверяем: высота к боковой стороне равна половине стороны, $\\frac{\\sqrt{${p.a}}}{2}$, и $S = \\frac12\\cdot\\sqrt{${p.a}}\\cdot\\frac{\\sqrt{${p.a}}}{2} = ${n(s)}$ — сходится.`,
      otvet: s,
    };
  },
};
