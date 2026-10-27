/**
 * №17: распределение Максвелла f(v) = 4πv²(M/(2πRT))^{3/2}·e^{−Mv²/(2RT)}.
 * При каком v плотность наибольшая: v = √(2RT/M) — выражение с R.
 *
 * Газ и температура свои; 2T/M = q²·m, ответ q√(mR), как в образцах
 * (125√(2R), 50√(10R)).
 */

import { decText } from './tex';
import type { Chast2Zadacha, Shablon2 } from './types';

/** Газы: название в родительном падеже, формула вещества, молярная масса в г/моль. */
const GAZY = [
  { chego: 'азота', formula: '\\mathrm{N_2}', g: 28 },
  { chego: 'гелия', formula: '\\mathrm{He}', g: 4 },
  { chego: 'аргона', formula: '\\mathrm{Ar}', g: 40 },
  { chego: 'неона', formula: '\\mathrm{Ne}', g: 20 },
  { chego: 'метана', formula: '\\mathrm{CH_4}', g: 16 },
  { chego: 'углекислого газа', formula: '\\mathrm{CO_2}', g: 44 },
  { chego: 'водорода', formula: '\\mathrm{H_2}', g: 2 },
] as const;

export interface PC17 {
  gaz: number;
  /** Температура, K. */
  T: number;
}

/** 2T/M = q²·m (m без квадратов); null — не целое. */
export function chislaC17(p: PC17): { K: number; q: number; m: number } | null {
  const G = GAZY[p.gaz];
  if (G === undefined) return null;
  /* M = g/1000 кг/моль: 2T/M = 2000T/g. */
  if ((2000 * p.T) % G.g !== 0) return null;
  const K = (2000 * p.T) / G.g;
  let q = 1;
  let m = K;
  for (let i = 2; i * i <= m; i += 1)
    while (m % (i * i) === 0) {
      m /= i * i;
      q *= i;
    }
  return { K, q, m };
}

function sobrat(p: PC17): Chast2Zadacha {
  const G = GAZY[p.gaz];
  const ch = chislaC17(p);
  if (G === undefined || ch === null) throw new Error('c17: газ или T не те');
  const { K, q, m } = ch;
  const M = decText(G.g / 1000, 3).replace(',', '{,}');
  const otvet = `${q === 1 ? '' : q}\\sqrt{${m === 1 ? '' : m}R}`;
  const formula =
    'f(v)=4\\pi v^2\\left(\\dfrac{M}{2\\pi RT}\\right)^{\\frac32}\\cdot e^{-\\frac{Mv^2}{2RT}}';
  const uslovie =
    `Скорости молекул ${G.chego} $(${G.formula})$ при тепловом движении распределены по закону Максвелла: плотность распределения скорости $v$ (в м/с) равна\n` +
    `$\\displaystyle ${formula}.$\n` +
    `Здесь $R$ — универсальная газовая постоянная, $M=${M}$ кг/моль — молярная масса ${G.chego}, $T$ — температура газа в кельвинах. ` +
    `При какой скорости $v$ плотность $f(v)$ наибольшая, если $T=${p.T}$ К? Ответ выразите через $R$.`;

  return {
    no: 17,
    shablon: 'c17.maksvell',
    uslovie,
    risunok: null,
    punkty: [
      {
        bukva: null,
        podpis: 'Скорость $v$ (выражение через $R$), м/с',
        pole: { vid: 'vyrazhenie', verno: otvet, oblast: { r: [8, 8.7] } },
      },
    ],
    otvet: `$v=${otvet}$ м/с`,
    reshenie: [
      {
        title: 'Отбрасываем постоянный множитель',
        lines: [
          'Множитель $C=4\\pi\\left(\\dfrac{M}{2\\pi RT}\\right)^{3/2}$ положителен и от $v$ не зависит. Обозначим $\\alpha=\\dfrac{M}{2RT}>0$; тогда $f(v)=C\\,v^2e^{-\\alpha v^2}$, и наибольшее значение $f$ там же, где у $g(v)=v^2e^{-\\alpha v^2}$, $v>0$.',
        ],
      },
      {
        title: 'Производная',
        lines: [
          "$g'(v)=2ve^{-\\alpha v^2}+v^2\\cdot\\left(-2\\alpha v\\right)e^{-\\alpha v^2}=2v\\,e^{-\\alpha v^2}\\left(1-\\alpha v^2\\right)$.",
          "При $v>0$ множитель $2ve^{-\\alpha v^2}$ положителен, поэтому знак $g'$ — знак $1-\\alpha v^2$.",
        ],
      },
      {
        title: 'Точка максимума',
        lines: [
          "$g'(v)>0$ при $0<v<\\dfrac{1}{\\sqrt\\alpha}$ и $g'(v)<0$ при $v>\\dfrac{1}{\\sqrt\\alpha}$: функция сначала возрастает, потом убывает, и наибольшее значение — в точке $v_0=\\dfrac{1}{\\sqrt\\alpha}=\\sqrt{\\dfrac{2RT}{M}}$.",
        ],
      },
      {
        title: 'Подставляем числа',
        lines: [
          `$\\dfrac{2T}{M}=\\dfrac{2\\cdot${p.T}}{${M}}=${K}${q === 1 ? '' : `=${q}^2\\cdot${m}`}$, поэтому $v_0=\\sqrt{${K}R}=${otvet}$ м/с.`,
        ],
      },
    ],
    razbor: [
      {
        slovo: 'Постоянный множитель не влияет на точку максимума',
        formula: 'g(v)=v^2e^{-\\alpha v^2},\\ \\alpha=\\dfrac{M}{2RT}',
      },
      {
        slovo: 'Находим производную',
        formula: "g'(v)=2ve^{-\\alpha v^2}\\left(1-\\alpha v^2\\right)",
      },
      { slovo: 'Производная меняет знак с плюса на минус', formula: 'v_0=\\sqrt{\\dfrac{2RT}{M}}' },
      { slovo: 'Подставляем $T$ и $M$', formula: `v_0=${otvet}` },
    ],
    kontrol: { K, T: p.T, M: G.g / 1000 },
  };
}

export const C17_MAKSVELL: Shablon2<PC17> = {
  no: 17,
  prototip: 'Максимум плотности распределения Максвелла; ответ — выражение с R',
  sobrat,
};
