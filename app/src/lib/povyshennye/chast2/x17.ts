/**
 * №17 (варианты 7–8): участок у стены. Прямоугольный участок одной
 * стороной примыкает к стене; две стороны, перпендикулярные стене
 * (по x м), огораживают сеткой по k₂ руб./м, сторону вдоль стены
 * (y м) — забором по k₁ руб./м. Бюджет B руб.
 *
 * 2k₂x + k₁y = B, S = xy = x(B − 2k₂x)/k₁ — парабола ветвями вниз,
 * вершина x* = B/(4k₂), y* = B/(2k₁), S* = B²/(8k₁k₂).
 * Спрашивается S* («S») или длина стороны вдоль стены («y»).
 */

import { div, mul, rat, ratTex, toNumber } from '@/lib/zadanie15/core/rational';
import type { Chast2Zadacha, Shablon2 } from './types';

const SYUZHETY = [
  'Фермер огораживает у стены сарая прямоугольный загон',
  'У глухой стены склада размечают прямоугольную площадку',
  'Вдоль стены дома разбивают прямоугольный огород',
  'К стене спортзала пристраивают прямоугольную площадку для тренировок',
] as const;

export interface PX17 {
  B: number;
  k1: number;
  k2: number;
  syuzhet: number;
  vopros: 'S' | 'y';
}

export function chislaX17(p: PX17) {
  const x = rat(p.B, 4 * p.k2);
  const y = rat(p.B, 2 * p.k1);
  const S = mul(x, y);
  return { x, y, S };
}

function sobrat(p: PX17): Chast2Zadacha {
  const S0 = SYUZHETY[p.syuzhet];
  if (S0 === undefined || p.k1 <= 0 || p.k2 <= 0 || p.B <= 0) throw new Error('x17: параметры');
  const ch = chislaX17(p);
  const otvR = p.vopros === 'S' ? ch.S : ch.y;
  if (otvR.d !== 1n) throw new Error('x17: ответ не целый');
  const otv = ratTex(otvR);
  const uslovie =
    `${S0}. Одна его сторона примыкает к стене и не огораживается. Две стороны, перпендикулярные стене, огораживают сеткой по цене $${p.k2}$ руб. за метр, а сторону, параллельную стене, — забором по цене $${p.k1}$ руб. за метр. На ограждение выделено $${p.B}$ руб. ` +
    (p.vopros === 'S'
      ? 'Какую наибольшую площадь (в квадратных метрах) может иметь участок?'
      : 'Какой должна быть длина стороны, параллельной стене (в метрах), чтобы площадь участка была наибольшей?');
  return {
    no: 17,
    shablon: 'x17.uchastok',
    uslovie,
    risunok: null,
    punkty: [
      {
        bukva: null,
        podpis: p.vopros === 'S' ? 'Площадь, м²' : 'Длина, м',
        pole: { vid: 'chislo', verno: otv },
      },
    ],
    otvet: `$${otv}$`,
    reshenie: [
      {
        title: 'Составляем функцию',
        lines: [
          'Пусть $x$ м — сторона, перпендикулярная стене, $y$ м — сторона вдоль стены.',
          `Стоимость ограждения: $2\\cdot${p.k2}x+${p.k1}y=${p.B}$, откуда $y=\\dfrac{${p.B}-${2 * p.k2}x}{${p.k1}}$, $0<x<${ratTex(rat(p.B, 2 * p.k2))}$.`,
          `Площадь $S(x)=xy=\\dfrac{x(${p.B}-${2 * p.k2}x)}{${p.k1}}$.`,
        ],
      },
      {
        title: 'Наибольшее значение',
        lines: [
          `$S(x)$ — квадратичная функция с отрицательным старшим коэффициентом; наибольшее значение — в вершине, посередине между корнями $0$ и $${ratTex(rat(p.B, 2 * p.k2))}$: $x=${ratTex(ch.x)}$.`,
          `Можно и через производную: $S'(x)=\\dfrac{${p.B}-${4 * p.k2}x}{${p.k1}}=0$ при $x=${ratTex(ch.x)}$; слева $S'>0$, справа $S'<0$ — это точка максимума.`,
        ],
      },
      {
        title: 'Ответ',
        lines: [
          `$y=\\dfrac{${p.B}-${2 * p.k2}\\cdot${ratTex(ch.x)}}{${p.k1}}=${ratTex(ch.y)}$, $S=${ratTex(ch.x)}\\cdot${ratTex(ch.y)}=${ratTex(ch.S)}$.`,
          `Ответ: $${otv}$.`,
        ],
      },
    ],
    razbor: [
      { slovo: 'Условие на стоимость', formula: `${2 * p.k2}x+${p.k1}y=${p.B}` },
      {
        slovo: 'Площадь как функция одной переменной',
        formula: `S(x)=\\frac{x(${p.B}-${2 * p.k2}x)}{${p.k1}}`,
      },
      { slovo: 'Вершина параболы', formula: `x=${ratTex(ch.x)}` },
      { slovo: 'Ответ', formula: otv },
    ],
    kontrol: { otvet: toNumber(otvR), x: toNumber(ch.x), S: toNumber(div(ch.S, rat(1))) },
  };
}

export const X17_UCHASTOK: Shablon2<PX17> = {
  no: 17,
  prototip: 'Участок у стены с разной ценой ограждения: наибольшая площадь при заданном бюджете',
  sobrat,
};
