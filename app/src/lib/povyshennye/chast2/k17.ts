/**
 * №17 (варианты 19–20): освещённость края круглого стола.
 *
 * Лампа силой света I висит над центром стола радиуса R на высоте h.
 * Освещённость края E(h) = I·h/(h² + R²)^{3/2}; E′(h) ∝ R² − 2h²,
 * максимум при h = R/√2, E_max = 2I/(3√3·R²).
 * R задаётся так, что R² = 2k²: ответ на вопрос «h» — целое k.
 */

import { rat, ratTex, toNumber } from '@/lib/zadanie15/core/rational';
import { sqrtRat, surdTex, surdToNumber } from '@/lib/zadanie15/core/surd';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PK17 {
  /** h* = k (R = k√2). */
  k: number;
  /** Сила света, кд. */
  I: number;
  vopros: 'h' | 'E';
}

export function chislaK17(p: PK17) {
  const R2 = rat(2 * p.k * p.k);
  /* E_max² = 4I²/(27R⁴). */
  const E2 = rat(4 * p.I * p.I, 27 * Number(R2.n) * Number(R2.n));
  return { R2, h: p.k, E2, E: surdToNumber(sqrtRat(E2)) };
}

function sobrat(p: PK17): Chast2Zadacha {
  const ch = chislaK17(p);
  const RT = surdTex(sqrtRat(ch.R2));
  const ET = surdTex(sqrtRat(ch.E2));
  const hVopr = p.vopros === 'h';
  const uslovie =
    `Над центром круглого стола радиусом $R=${RT}$ м висит лампа силой света $I=${p.I}$ кд. Освещённость (в люксах) точки на краю стола равна $E=\\dfrac{I\\cos\\alpha}{r^2}$, ` +
    `где $r$ — расстояние от лампы до точки, а $\\alpha$ — угол между лучом и вертикалью. ` +
    (hVopr
      ? 'На какой высоте над столом нужно повесить лампу, чтобы освещённость края стола была наибольшей? Ответ дайте в метрах.'
      : 'Какую наибольшую освещённость края стола можно получить, меняя высоту лампы? Ответ дайте в люксах.');
  const otvT = hVopr ? String(p.k) : ET;
  const otvV = hVopr ? p.k : ch.E;
  return {
    no: 17,
    shablon: 'k17.lampa',
    uslovie,
    risunok: null,
    punkty: [
      {
        bukva: null,
        podpis: hVopr ? 'Высота, м' : 'Освещённость, лк',
        pole: { vid: 'chislo', verno: otvT.replace(/\\dfrac/g, '\\frac') },
      },
    ],
    otvet: `$${otvT}$`,
    reshenie: [
      {
        title: 'Функция от высоты',
        lines: [
          `Пусть $h$ — высота лампы над столом. Тогда $r=\\sqrt{h^2+R^2}$, $\\cos\\alpha=\\dfrac{h}{r}$, и $E(h)=\\dfrac{I h}{\\left(h^2+R^2\\right)^{3/2}}$, $h>0$, $R^2=${ratTex(ch.R2)}$.`,
        ],
      },
      {
        title: 'Производная',
        lines: [
          `$E'(h)=I\\cdot\\dfrac{\\left(h^2+R^2\\right)^{3/2}-h\\cdot\\frac32\\left(h^2+R^2\\right)^{1/2}\\cdot 2h}{\\left(h^2+R^2\\right)^3}=I\\cdot\\dfrac{R^2-2h^2}{\\left(h^2+R^2\\right)^{5/2}}$.`,
          `$E'(h)>0$ при $h<\\dfrac{R}{\\sqrt2}$ и $E'(h)<0$ при $h>\\dfrac{R}{\\sqrt2}$: $h=\\dfrac{R}{\\sqrt2}=\\dfrac{${RT}}{\\sqrt2}=${p.k}$ — точка максимума.`,
        ],
      },
      {
        title: 'Ответ',
        lines: hVopr
          ? [`Лампу нужно повесить на высоте $${p.k}$ м.`]
          : [
              `$E_{\\max}=E\\left(\\dfrac{R}{\\sqrt2}\\right)=\\dfrac{I\\cdot\\frac{R}{\\sqrt2}}{\\left(\\frac32R^2\\right)^{3/2}}=\\dfrac{2I}{3\\sqrt3\\,R^2}=\\dfrac{2\\cdot${p.I}}{3\\sqrt3\\cdot${ratTex(ch.R2)}}=${ET}$.`,
            ],
      },
    ],
    razbor: [
      { slovo: 'Освещённость как функция высоты', formula: 'E(h)=\\frac{Ih}{(h^2+R^2)^{3/2}}' },
      { slovo: 'Знак производной', formula: "E'(h)\\sim R^2-2h^2" },
      { slovo: 'Точка максимума', formula: `h=\\frac{R}{\\sqrt2}=${p.k}` },
      { slovo: 'Ответ', formula: otvT },
    ],
    kontrol: { otvet: otvV, R2: toNumber(ch.R2) },
  };
}

export const K17_LAMPA: Shablon2<PK17> = {
  no: 17,
  prototip: 'Освещённость края стола от лампы над центром: максимум функции E(h) через производную',
  sobrat,
};
