/**
 * №17 (варианты 5–6): прямоугольный участок площади S примыкает к стене;
 * три другие стороны огораживают забором ценой c руб. за метр.
 * Длина забора L(x) = 2x + S/x, минимум при x = √(S/2): L = 2√(2S).
 * S = 2t²: x = t, L = 4t, стоимость 4tc.
 */

import type { Chast2Zadacha, Shablon2 } from './types';

export interface PW17 {
  t: number;
  c: number;
  vopros: 'L' | 'cena';
}

export function chislaW17(p: PW17) {
  const S = 2 * p.t * p.t;
  const L = 4 * p.t;
  return { S, L, cena: L * p.c };
}

function sobrat(p: PW17): Chast2Zadacha {
  const ch = chislaW17(p);
  const otv = p.vopros === 'L' ? ch.L : ch.cena;
  return {
    no: 17,
    shablon: 'w17.zaborStena',
    uslovie:
      `Прямоугольный участок площадью $${ch.S}$ м² одной стороной примыкает к стене дома, а три другие стороны огораживают забором. Метр забора стоит $${p.c}$ рублей. ` +
      (p.vopros === 'L'
        ? 'Какой наименьшей длины (в метрах) может быть забор?'
        : 'Какую наименьшую сумму (в рублях) придётся потратить на забор?'),
    risunok: null,
    punkty: [
      {
        bukva: null,
        podpis: p.vopros === 'L' ? 'Длина, м' : 'Стоимость, руб.',
        pole: { vid: 'chislo', verno: String(otv) },
      },
    ],
    otvet: `$${otv}$`,
    reshenie: [
      {
        title: 'Функция',
        lines: [
          `Пусть стороны, перпендикулярные стене, равны $x$ м, тогда сторона вдоль стены $\\dfrac{${ch.S}}{x}$ м. Длина забора $L(x)=2x+\\dfrac{${ch.S}}{x}$, $x>0$.`,
        ],
      },
      {
        title: 'Минимум',
        lines: [
          `$L'(x)=2-\\dfrac{${ch.S}}{x^2}$; $L'(x)=0$ при $x^2=${ch.S / 2}$, $x=${p.t}$. При $x<${p.t}$ производная отрицательна, при $x>${p.t}$ — положительна: $x=${p.t}$ — точка минимума.`,
          `$L(${p.t})=2\\cdot${p.t}+\\dfrac{${ch.S}}{${p.t}}=${ch.L}$ м.` +
            (p.vopros === 'cena' ? ` Стоимость $${ch.L}\\cdot${p.c}=${ch.cena}$ руб.` : ''),
        ],
      },
      { title: 'Ответ', lines: [`Ответ: $${otv}$.`] },
    ],
    razbor: [
      { slovo: 'Длина забора', formula: `L(x)=2x+\\frac{${ch.S}}{x}` },
      { slovo: 'Точка минимума', formula: `x=${p.t}` },
      { slovo: 'Ответ', formula: String(otv) },
    ],
    kontrol: { otvet: otv, S: ch.S },
  };
}

export const W17_ZABOR_STENA: Shablon2<PW17> = {
  no: 17,
  prototip: 'Участок у стены: наименьшая длина или стоимость забора через производную',
  sobrat,
};
