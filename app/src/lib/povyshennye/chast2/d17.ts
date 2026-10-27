/**
 * №17 (варианты 7–8): последовательная цепь из резистора, катушки и
 * конденсатора; амплитуда напряжения на катушке
 * U_L(ω) = ULω/√(R² + (ωL − 1/(ωC))²). При какой частоте ω она
 * наибольшая.
 *
 * Без производной: U_L = UL/√g, g = R²/ω² + (L − 1/(ω²C))² — квадратичная
 * функция от z = 1/ω²; минимум в вершине z₀ = C(2L − R²C)/2, то есть
 * ω² = 2/(C(2L − R²C)). Числа подобраны так, что ω — целое.
 */

import { add, div, mul, rat, ratDec, sub, toNumber, type Rat } from '@/lib/zadanie15/core/rational';
import { dec } from './tex';
import type { Chast2Zadacha, Shablon2 } from './types';

const SYUZHETY = [
  'К генератору переменного тока подключили колебательный контур радиоприёмника',
  'К сети переменного тока через фильтр подключили обмотку дросселя',
  'Катушку металлоискателя включили в цепь переменного тока',
  'В лабораторной установке к источнику переменного тока подключили цепь',
  'Обмотку индукционного нагревателя включили в цепь переменного тока',
  'Катушку электромагнитного датчика подключили к генератору переменного тока',
] as const;

export interface PD17 {
  /** Индуктивность, Гн (десятичная). */
  L: number;
  /** Ёмкость: Cm·10^{−5} Ф. */
  Cm: number;
  R: number;
  U: number;
  syuzhet: number;
}

export function omegaD17(p: PD17): { w2: Rat; z0: Rat; C: Rat; L: Rat } {
  const L = ratDec(p.L);
  const C = mul(ratDec(p.Cm), rat(1, 100000));
  const raz = sub(mul(rat(2), L), mul(rat(p.R * p.R), C));
  if (toNumber(raz) <= 0) throw new Error('d17: 2L ≤ R²C');
  const z0 = div(mul(C, raz), rat(2));
  return { w2: div(rat(1), z0), z0, C, L };
}

function sobrat(p: PD17): Chast2Zadacha {
  const S = SYUZHETY[p.syuzhet];
  if (S === undefined) throw new Error('d17: сюжет');
  const { w2, C, L } = omegaD17(p);
  const w = Math.round(Math.sqrt(toNumber(w2)));
  if (w * w !== toNumber(w2)) throw new Error('d17: ω не целое');
  const Ct = `${dec(p.Cm)}\\cdot10^{-5}`;
  const uslovie =
    `${S}: последовательно соединены резистор, катушка индуктивности и конденсатор. Амплитуда напряжения на катушке (в вольтах) зависит от частоты так:\n` +
    `$\\displaystyle U_L(\\omega)=\\dfrac{UL\\omega}{\\sqrt{R^2+\\left(\\omega L-\\dfrac{1}{\\omega C}\\right)^2}},$\n` +
    `где $U$ — амплитуда напряжения источника, $L$ — индуктивность катушки, $\\omega$ — частота тока (в $\\text{с}^{-1}$), $R$ — сопротивление резистора, $C$ — ёмкость конденсатора. ` +
    `При какой частоте $\\omega$ амплитуда напряжения на катушке будет наибольшей, если $U=${p.U}$ В, $L=${dec(p.L)}$ Гн, $C=${Ct}$ Ф и $R=${p.R}$ Ом?`;
  const raz = sub(mul(rat(2), L), mul(rat(p.R * p.R), C));
  return {
    no: 17,
    shablon: 'd17.katushka',
    uslovie,
    risunok: null,
    punkty: [
      {
        bukva: null,
        podpis: 'Частота $\\omega$, $\\text{с}^{-1}$',
        pole: { vid: 'chislo', verno: String(w) },
      },
    ],
    otvet: `$\\omega=${w}$ $\\text{с}^{-1}$`,
    reshenie: [
      {
        title: 'Переходим к знаменателю',
        lines: [
          'Делим числитель и знаменатель на $\\omega>0$: $U_L=\\dfrac{UL}{\\sqrt{g(\\omega)}}$, где $g=\\dfrac{R^2}{\\omega^2}+\\left(L-\\dfrac{1}{\\omega^2C}\\right)^2$. Амплитуда наибольшая, когда $g$ наименьшее.',
        ],
      },
      {
        title: 'Замена',
        lines: [
          'Пусть $z=\\dfrac{1}{\\omega^2}>0$: $g=R^2z+\\left(L-\\dfrac{z}{C}\\right)^2=\\dfrac{z^2}{C^2}+\\left(R^2-\\dfrac{2L}{C}\\right)z+L^2$ — парабола ветвями вверх.',
          'Наименьшее значение — в вершине: $z_0=\\dfrac{C(2L-R^2C)}{2}$ (при $2L>R^2C$ она положительна).',
        ],
      },
      {
        title: 'Подставляем числа',
        lines: [
          `$2L-R^2C=${dec(toNumber(mul(rat(2), L)))}-${p.R * p.R}\\cdot${Ct}=${dec(toNumber(raz))}>0$, $z_0=\\dfrac{${Ct}\\cdot${dec(toNumber(raz))}}{2}=\\dfrac{1}{${toNumber(w2)}}$.`,
          `$\\omega^2=\\dfrac{1}{z_0}=${toNumber(w2)}$, $\\omega=${w}$ $\\text{с}^{-1}$.`,
        ],
      },
    ],
    razbor: [
      {
        slovo: 'Делим на $\\omega$ — ищем наименьшее значение подкоренного выражения',
        formula: 'g=\\dfrac{R^2}{\\omega^2}+\\left(L-\\dfrac{1}{\\omega^2C}\\right)^2',
      },
      {
        slovo: 'Замена $z=1/\\omega^2$ — квадратичная функция',
        formula: 'z_0=\\dfrac{C(2L-R^2C)}{2}',
      },
      { slovo: 'Возвращаемся к $\\omega$', formula: `\\omega=${w}` },
    ],
    kontrol: { w, L: p.L, C: toNumber(C), R: p.R },
  };
}

void add;

export const D17_KATUSHKA: Shablon2<PD17> = {
  no: 17,
  prototip: 'Наибольшая амплитуда напряжения на катушке в RLC-цепи: замена z = 1/ω²',
  sobrat,
};
