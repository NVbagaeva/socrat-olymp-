/**
 * №17 (варианты 11–12): плотность распределения кинетической энергии
 * молекул f(ε) = 2√(ε/π)·(1/kT)^{3/2}·e^{−ε/kT}. Наибольшее значение —
 * при ε = kT/2 (производная). Вопрос: ε по температуре или температура
 * по ε, k = 1,38·10⁻²³ Дж/К.
 */

import { div, mul, rat, ratDec, toNumber, type Rat } from '@/lib/zadanie15/core/rational';
import { tochnoTex } from './chisla';
import type { Chast2Zadacha, Shablon2 } from './types';

const GAZY = ['гелия', 'неона', 'аргона', 'криптона', 'ксенона', 'радона'] as const;

export interface PF17 {
  /** Температура, К. */
  T: number;
  gaz: number;
  /** eps — найти энергию по температуре; T — температуру по энергии. */
  vopros: 'eps' | 'T';
}

/** x = m·10^e, 1 ≤ m < 10: TeX и запись для поля. */
export function nauchn(x: Rat, e0 = 0): { tex: string; pole: string; m: Rat; e: number } {
  let m = x;
  let e = e0;
  while (toNumber(m) >= 10) {
    m = div(m, rat(10));
    e += 1;
  }
  while (toNumber(m) < 1) {
    m = mul(m, rat(10));
    e -= 1;
  }
  const mT = tochnoTex(m);
  return {
    tex: e === 0 ? mT : `${mT}\\cdot10^{${e}}`,
    pole: `${mT.replace('{,}', ',')}*10^(${e})`,
    m,
    e,
  };
}

/** Мантисса kT/2 при множителе 10⁻²³: 1,38·T/2. */
export function epsF17(p: PF17): Rat {
  return mul(ratDec(1.38), rat(p.T, 2));
}

function sobrat(p: PF17): Chast2Zadacha {
  const g = GAZY[p.gaz];
  if (g === undefined) throw new Error('f17: газ');
  const eps = nauchn(epsF17(p), -23);
  const naitiEps = p.vopros === 'eps';
  const uslovie =
    `Распределение молекул ${g} по кинетической энергии при тепловом движении описывается функцией плотности\n` +
    `$\\displaystyle f(\\varepsilon)=2\\sqrt{\\dfrac{\\varepsilon}{\\pi}}\\cdot\\left(\\dfrac{1}{kT}\\right)^{\\frac32}\\cdot e^{-\\frac{\\varepsilon}{kT}},$\n` +
    `где $\\varepsilon$ — кинетическая энергия молекулы (в джоулях), $T$ — температура газа (в кельвинах), $k=1{,}38\\cdot10^{-23}$ Дж/К — постоянная Больцмана. ` +
    (naitiEps
      ? `При каком значении энергии $\\varepsilon$ функция $f(\\varepsilon)$ принимает наибольшее значение, если $T=${p.T}$ К?`
      : `При какой температуре $T$ (в кельвинах) функция $f(\\varepsilon)$ принимает наибольшее значение при $\\varepsilon=${eps.tex}$ Дж?`);
  const otvTex = naitiEps ? `${eps.tex}` : `${p.T}`;
  return {
    no: 17,
    shablon: 'f17.raspredelenie',
    uslovie,
    risunok: null,
    punkty: [
      {
        bukva: null,
        podpis: naitiEps ? 'Энергия $\\varepsilon$, Дж' : 'Температура $T$, К',
        pole: { vid: 'chislo', verno: naitiEps ? eps.pole : String(p.T) },
      },
    ],
    otvet: naitiEps ? `$${otvTex}$ Дж` : `$${otvTex}$ К`,
    reshenie: [
      {
        title: 'Производная',
        lines: [
          'Обозначим $A=\\dfrac{2}{\\sqrt\\pi}\\left(\\dfrac{1}{kT}\\right)^{\\frac32}>0$ — при фиксированной температуре это число. Тогда $f(\\varepsilon)=A\\sqrt{\\varepsilon}\\,e^{-\\frac{\\varepsilon}{kT}}$, $\\varepsilon>0$.',
          "$f'(\\varepsilon)=A\\,e^{-\\frac{\\varepsilon}{kT}}\\left(\\dfrac{1}{2\\sqrt\\varepsilon}-\\dfrac{\\sqrt\\varepsilon}{kT}\\right)=A\\,e^{-\\frac{\\varepsilon}{kT}}\\cdot\\dfrac{kT-2\\varepsilon}{2kT\\sqrt\\varepsilon}$.",
        ],
      },
      {
        title: 'Точка максимума',
        lines: [
          "Знак $f'$ совпадает со знаком $kT-2\\varepsilon$: $f'>0$ при $\\varepsilon<\\dfrac{kT}{2}$ и $f'<0$ при $\\varepsilon>\\dfrac{kT}{2}$. Значит, наибольшее значение — при $\\varepsilon=\\dfrac{kT}{2}$.",
        ],
      },
      {
        title: naitiEps ? 'Вычисляем энергию' : 'Вычисляем температуру',
        lines: naitiEps
          ? [`$\\varepsilon=\\dfrac{1{,}38\\cdot10^{-23}\\cdot${p.T}}{2}=${eps.tex}$ (Дж).`]
          : [
              `$T=\\dfrac{2\\varepsilon}{k}=\\dfrac{2\\cdot${eps.tex}}{1{,}38\\cdot10^{-23}}=${p.T}$ (К).`,
            ],
      },
    ],
    razbor: [
      {
        slovo: 'Производная произведения',
        formula:
          "f'=A\\,e^{-\\frac{\\varepsilon}{kT}}\\cdot\\dfrac{kT-2\\varepsilon}{2kT\\sqrt\\varepsilon}",
      },
      { slovo: 'Максимум при $\\varepsilon=kT/2$', formula: '\\varepsilon=\\dfrac{kT}{2}' },
      { slovo: 'Подставляем числа', formula: otvTex },
    ],
    kontrol: { eps: toNumber(epsF17(p)) * 1e-23, T: p.T },
  };
}

export const F17_RASPREDELENIE: Shablon2<PF17> = {
  no: 17,
  prototip: 'Наибольшее значение плотности распределения энергии молекул: производная',
  sobrat,
};
