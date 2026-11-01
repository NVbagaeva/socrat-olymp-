/**
 * №17 (варианты 17–18): прямоугольник, вписанный в полукруг радиуса R
 * (две вершины на диаметре). Половина основания x, высота √(R² − x²):
 * S(x) = 2x√(R² − x²), максимум при x = R/√2: S = R², стороны R√2 и R/√2.
 * R = k√2: стороны 2k и k, площадь 2k², периметр 6k.
 */

import type { Chast2Zadacha, Shablon2 } from './types';

export interface PAE17 {
  k: number;
  vopros: 'S' | 'dlina' | 'P';
}

function sobrat(p: PAE17): Chast2Zadacha {
  const R2 = 2 * p.k * p.k;
  const otv = p.vopros === 'S' ? R2 : p.vopros === 'dlina' ? 2 * p.k : 6 * p.k;
  const vopr =
    p.vopros === 'S'
      ? 'Найдите наибольшую возможную площадь такого прямоугольника.'
      : p.vopros === 'dlina'
        ? 'Найдите длину стороны, лежащей на диаметре, у прямоугольника наибольшей площади.'
        : 'Найдите периметр прямоугольника наибольшей площади.';
  return {
    no: 17,
    shablon: 'ae17.polukrug',
    uslovie: `В полукруг радиуса $\\sqrt{${R2}}$ вписан прямоугольник: две его вершины лежат на диаметре, две другие — на дуге. ${vopr}`,
    risunok: null,
    punkty: [{ bukva: null, podpis: 'Ответ', pole: { vid: 'chislo', verno: String(otv) } }],
    otvet: `$${otv}$`,
    reshenie: [
      {
        title: 'Функция',
        lines: [
          `Центр полукруга — середина стороны на диаметре. Пусть половина этой стороны равна $x$, $0<x<\\sqrt{${R2}}$; вершина на дуге удалена от центра на $\\sqrt{${R2}}$, высота $\\sqrt{${R2}-x^2}$. $S(x)=2x\\sqrt{${R2}-x^2}$.`,
        ],
      },
      {
        title: 'Производная',
        lines: [
          `$S'(x)=2\\sqrt{${R2}-x^2}-\\dfrac{2x^2}{\\sqrt{${R2}-x^2}}=\\dfrac{2(${R2}-2x^2)}{\\sqrt{${R2}-x^2}}$; $S'=0$ при $x^2=${p.k * p.k}$, $x=${p.k}$, знак меняется с «+» на «−»: максимум.`,
        ],
      },
      {
        title: 'Ответ',
        lines: [
          `Стороны: $2x=${2 * p.k}$ и $\\sqrt{${R2}-${p.k * p.k}}=${p.k}$; площадь $${R2}$, периметр $${6 * p.k}$. Ответ: $${otv}$.`,
        ],
      },
    ],
    razbor: [
      { slovo: 'Площадь как функция', formula: `S(x)=2x\\sqrt{${R2}-x^2}` },
      { slovo: 'Производная', formula: `S'(x)\\sim ${R2}-2x^2` },
      { slovo: 'Точка максимума', formula: `x=${p.k}` },
      { slovo: 'Ответ', formula: String(otv) },
    ],
    kontrol: { otvet: otv, R2 },
  };
}

export const AE17_POLUKRUG: Shablon2<PAE17> = {
  no: 17,
  prototip: 'Оптимизация: прямоугольник наибольшей площади, вписанный в полукруг',
  sobrat,
};
