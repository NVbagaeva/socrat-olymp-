/**
 * №17 (варианты 23–24): экономичная скорость судна.
 *
 * Расход на топливо в час k·v² рублей, прочие расходы C рублей в час.
 * Рейс длиной D км: Y(v) = (k v² + C)·D/v = D(k v + C/v).
 * Y′(v) = D(k − C/v²) = 0 ⇔ v = √(C/k) (C/k — квадрат), Y_min = 2D√(kC).
 */

import type { Chast2Zadacha, Shablon2 } from './types';

export interface PM17 {
  k: number;
  C: number;
  D: number;
  vopros: 'v' | 'Y';
}

export function chislaM17(p: PM17) {
  const v = Math.sqrt(p.C / p.k);
  if (!Number.isInteger(v)) throw new Error('m17: C/k — не квадрат');
  const Y = 2 * p.D * p.k * v;
  return { v, Y };
}

function sobrat(p: PM17): Chast2Zadacha {
  const ch = chislaM17(p);
  const voprV = p.vopros === 'v';
  const otv = voprV ? ch.v : ch.Y;
  const uslovie =
    `Расходы на топливо для речного судна пропорциональны квадрату скорости: при скорости $v$ км/ч они составляют $${p.k}v^2$ рублей в час. Прочие расходы равны ${p.C} рублей в час и от скорости не зависят. Судну нужно пройти ${p.D} км. ` +
    (voprV
      ? 'С какой скоростью нужно идти, чтобы общие расходы на рейс были наименьшими? Ответ дайте в километрах в час.'
      : 'Найдите наименьшие возможные общие расходы на рейс. Ответ дайте в рублях.');
  return {
    no: 17,
    shablon: 'm17.sudno',
    uslovie,
    risunok: null,
    punkty: [
      {
        bukva: null,
        podpis: voprV ? 'Скорость, км/ч' : 'Расходы, руб.',
        pole: { vid: 'chislo', verno: String(otv) },
      },
    ],
    otvet: `$${otv}$`,
    reshenie: [
      {
        title: 'Функция расходов',
        lines: [
          `Время в пути $\\dfrac{${p.D}}{v}$ ч, расходы в час $${p.k}v^2+${p.C}$. Общие расходы $Y(v)=\\left(${p.k}v^2+${p.C}\\right)\\cdot\\dfrac{${p.D}}{v}=${p.D}\\left(${p.k}v+\\dfrac{${p.C}}{v}\\right)$, $v>0$.`,
        ],
      },
      {
        title: 'Производная',
        lines: [
          `$Y'(v)=${p.D}\\left(${p.k}-\\dfrac{${p.C}}{v^2}\\right)$; $Y'(v)=0$ при $v^2=${p.C / p.k}$, $v=${ch.v}$.`,
          `При $v<${ch.v}$ производная отрицательна, при $v>${ch.v}$ — положительна: $v=${ch.v}$ — точка минимума.`,
        ],
      },
      {
        title: 'Ответ',
        lines: voprV
          ? [`Расходы наименьшие при скорости $${ch.v}$ км/ч.`]
          : [
              `$Y(${ch.v})=${p.D}\\left(${p.k}\\cdot${ch.v}+\\dfrac{${p.C}}{${ch.v}}\\right)=${ch.Y}$ рублей.`,
            ],
      },
    ],
    razbor: [
      {
        slovo: 'Расходы на рейс как функция скорости',
        formula: `Y(v)=${p.D}\\left(${p.k}v+\\frac{${p.C}}{v}\\right)`,
      },
      { slovo: 'Нуль производной', formula: `v^2=\\frac{${p.C}}{${p.k}}` },
      { slovo: 'Минимум', formula: `v=${ch.v}` },
      { slovo: 'Ответ', formula: String(otv) },
    ],
    kontrol: { otvet: otv, v: ch.v },
  };
}

export const M17_SUDNO: Shablon2<PM17> = {
  no: 17,
  prototip:
    'Экономичная скорость судна: расходы на рейс как функция скорости, минимум через производную',
  sobrat,
};
