/**
 * №17 (варианты 27–28): открытая коробка из прямоугольного листа a × b
 * (b < a): по углам вырезают квадраты со стороной x, V(x) = x(a − 2x)(b − 2x),
 * 0 < x < b/2.
 *
 * V′(x) = 12x² − 4(a + b)x + ab; меньший корень
 * x* = ((a + b) − √(a² − ab + b²))/6 лежит в (0; b/2), производная меняет
 * знак с «+» на «−» — максимум. a² − ab + b² — точный квадрат.
 */

import { dec } from './tex';
import type { Chast2Zadacha, Shablon2 } from './types';

const MATERIALY = [
  { list: 'жести', ed: 'см' },
  { list: 'картона', ed: 'см' },
  { list: 'фанеры', ed: 'дм' },
  { list: 'пластика', ed: 'см' },
] as const;

export interface PP17 {
  a: number;
  b: number;
  material: number;
  /** Что спрашиваем: сторону квадрата или наибольший объём. */
  vopros: 'x' | 'V';
}

export function chislaP17(p: PP17) {
  const D = p.a * p.a - p.a * p.b + p.b * p.b;
  const k = Math.round(Math.sqrt(D));
  if (k * k !== D) throw new Error('p17: a² − ab + b² не квадрат');
  const x = (p.a + p.b - k) / 6;
  const x2 = (p.a + p.b + k) / 6;
  const V = x * (p.a - 2 * x) * (p.b - 2 * x);
  return { D, k, x, x2, V };
}

function sobrat(p: PP17): Chast2Zadacha {
  const M = MATERIALY[p.material];
  if (M === undefined || !(p.b < p.a)) throw new Error('p17: параметры');
  const ch = chislaP17(p);
  if (
    Math.abs(ch.x * 100 - Math.round(ch.x * 100)) > 1e-9 ||
    Math.abs(ch.V * 100 - Math.round(ch.V * 100)) > 1e-9
  )
    throw new Error('p17: ответ не конечная десятичная дробь');
  const uslovie =
    `Из прямоугольного листа ${M.list} размером $${p.a}\\times ${p.b}$ ${M.ed} делают открытую коробку: по углам листа вырезают четыре одинаковых квадрата со стороной $x$ ${M.ed} и загибают края вверх. Объём коробки (в кубических ${M.ed === 'см' ? 'сантиметрах' : 'дециметрах'}) равен\n` +
    `$\\displaystyle V(x)=x(${p.a}-2x)(${p.b}-2x).$\n` +
    (p.vopros === 'x'
      ? `При какой стороне вырезаемого квадрата объём коробки будет наибольшим?`
      : `Найдите наибольший возможный объём такой коробки.`);
  const otvT = p.vopros === 'x' ? dec(ch.x) : dec(ch.V);
  const ed = p.vopros === 'x' ? M.ed : `${M.ed}³`;
  return {
    no: 17,
    shablon: 'p17.korobka',
    uslovie,
    risunok: null,
    punkty: [
      {
        bukva: null,
        podpis: p.vopros === 'x' ? `Сторона квадрата $x$, ${M.ed}` : `Объём, ${M.ed}$^3$`,
        pole: { vid: 'chislo', verno: String(p.vopros === 'x' ? ch.x : ch.V) },
      },
    ],
    otvet: `$${otvT}$ ${ed}`,
    reshenie: [
      {
        title: 'Область и производная',
        lines: [
          `Размеры коробки положительны: $0<x<\\dfrac{${p.b}}{2}$.`,
          `$V(x)=4x^3-${2 * (p.a + p.b)}x^2+${p.a * p.b}x$, $V'(x)=12x^2-${4 * (p.a + p.b)}x+${p.a * p.b}$.`,
        ],
      },
      {
        title: 'Нули производной',
        lines: [
          `$12x^2-${4 * (p.a + p.b)}x+${p.a * p.b}=0$: $\\dfrac{D}{4}=${4 * (p.a + p.b) ** 2}-${12 * p.a * p.b}=${4 * ch.D}=${2 * ch.k}^2$, $x=\\dfrac{${2 * (p.a + p.b)}\\pm${2 * ch.k}}{12}$, то есть $x_1=${dec(ch.x)}$, $x_2=${dec(ch.x2)}$.`,
          `$x_2=${dec(ch.x2)}\\ge\\dfrac{${p.b}}{2}$ — вне области. На $\\left(0;\\ ${dec(ch.x)}\\right)$ производная положительна, на $\\left(${dec(ch.x)};\\ \\dfrac{${p.b}}{2}\\right)$ — отрицательна: $x=${dec(ch.x)}$ — точка максимума.`,
        ],
      },
      {
        title: 'Ответ',
        lines: [
          p.vopros === 'x'
            ? `Наибольший объём получается при $x=${dec(ch.x)}$ ${M.ed}.`
            : `$V_{\\max}=V(${dec(ch.x)})=${dec(ch.x)}\\cdot ${dec(p.a - 2 * ch.x)}\\cdot ${dec(p.b - 2 * ch.x)}=${dec(ch.V)}$ ${M.ed}$^3$.`,
          `Ответ: $${otvT}$.`,
        ],
      },
    ],
    razbor: [
      { slovo: 'Область определения', formula: `0<x<\\dfrac{${p.b}}{2}` },
      { slovo: 'Производная', formula: `V'(x)=12x^2-${4 * (p.a + p.b)}x+${p.a * p.b}` },
      { slovo: 'Нуль производной в области — максимум', formula: `x=${dec(ch.x)}` },
      { slovo: 'Ответ', formula: otvT },
    ],
    kontrol: { x: ch.x, V: ch.V },
  };
}

export const P17_KOROBKA: Shablon2<PP17> = {
  no: 17,
  prototip:
    'Открытая коробка из прямоугольного листа: V(x) = x(a − 2x)(b − 2x), сторона вырезаемого квадрата или наибольший объём',
  sobrat,
};
