/**
 * Пример из банка для блока «Степени десяти» общей теории единиц:
 * звезда по закону Стефана — Больцмана (П-20), счёт степеней по шагам —
 * числа отдельно, степени отдельно.
 *
 * Шаги считаются из параметров задачи банка точной арифметикой, а не
 * вписаны руками: автотест сверяет температуру с решателем банка.
 * Модуль серверный — ответ в браузер не уходит.
 */

import { d, div, fq, fromDecimal, mul, q, val, type Q } from '../zadanie11/num';
import { korenQ } from './kit';
import type { ShagRazbora } from '../../content/teoriya-edinicy';
import type { Params } from './types';

function n(p: Params, k: string): number {
  const v = p[k];
  if (typeof v !== 'number') {
    throw new Error(`Стефан — Больцман: нет числа ${k}`);
  }
  return v;
}

/** 10 в степени: показатель в фигурных скобках. */
const st = (e: number | string): string => `10^{${e}}`;
/** Сумма показателей словами TeX: −8+20, 26−12, 3−(−2). */
const plyus = (a: number, b: number): string => `${a}+${b < 0 ? `(${b})` : b}`;
const minus = (a: number, b: number): string => `${a}-${b < 0 ? `(${b})` : b}`;

export interface PrimerStepeni {
  shagi: ShagRazbora[];
  /** Температура, К. */
  T: number;
  otvet: string;
}

export function primerStefana(p: Params): PrimerStepeni {
  const sM = fromDecimal(n(p, 'sigmaM'));
  const sE = n(p, 'sigmaE');
  const Sden = n(p, 'Sden');
  const Sexp = n(p, 'Sexp');
  const Pm = fromDecimal(n(p, 'Pm'));
  const Pe = n(p, 'Pe');

  /* σS: числа отдельно, степени отдельно. */
  const c1 = div(sM, q(Sden));
  const E1 = sE + Sexp;
  /* T⁴ = P : (σS). */
  const c2 = div(Pm, c1);
  const E2 = Pe - E1;
  /* Подгоняем под четвёртую степень: c2·10^E2 = N·10^(4k). */
  let podbor: { N: number; k: number; r: number; s: number } | null = null;
  for (let k = Math.floor(E2 / 4); k >= E2 / 4 - 6 && podbor === null; k -= 1) {
    const s = E2 - 4 * k;
    const N: Q = mul(c2, q(10 ** s));
    if (N.m !== 1 || N.n <= 0) {
      continue;
    }
    const r = korenQ(N, 4);
    if (r !== null && r.m === 1) {
      podbor = { N: N.n, k, r: r.n, s };
    }
  }
  if (podbor === null) {
    throw new Error('Стефан — Больцман: корень четвёртой степени не извлекается');
  }
  const { N, k, r, s } = podbor;
  const T = r * 10 ** k;

  const sigma = `${fq(sM, true)}\\cdot${st(sE)}`;
  const S = `\\dfrac{1}{${d(Sden)}}\\cdot${st(Sexp)}`;
  const P = `${fq(Pm, true)}\\cdot${st(Pe)}`;
  const c1t = fq(c1, true);
  const c2t = fq(c2, true);

  const shagi: ShagRazbora[] = [
    { podpis: 'Выражаем $T^4$ из формулы $P=\\sigma ST^4$', tex: ['T^4=\\dfrac{P}{\\sigma S}'] },
    {
      podpis:
        'Знаменатель: числа перемножаем отдельно, степени — отдельно; при умножении показатели складываем',
      tex: [
        `\\sigma S=${sigma}\\cdot${S}`,
        `=\\left(${fq(sM, true)}\\cdot\\dfrac{1}{${d(Sden)}}\\right)\\cdot\\left(${st(sE)}\\cdot${st(Sexp)}\\right)`,
        `=${c1t}\\cdot${st(plyus(sE, Sexp))}=${c1t}\\cdot${st(E1)}`,
      ],
    },
    {
      podpis: 'Делим: числа отдельно, степени отдельно; при делении показатели вычитаем',
      tex: [
        `T^4=\\dfrac{${P}}{${c1t}\\cdot${st(E1)}}`,
        `=\\dfrac{${fq(Pm, true)}}{${c1t}}\\cdot${st(minus(Pe, E1))}`,
        `=${c2t}\\cdot${st(E2)}`,
      ],
    },
    ...(s === 0
      ? []
      : [
          {
            podpis: `Показатель должен делиться на $4$: переносим запятую, $${c2t}=${d(N)}\\cdot${st(-s)}$`,
            tex: [
              `${c2t}\\cdot${st(E2)}=${d(N)}\\cdot${st(-s)}\\cdot${st(E2)}`,
              `=${d(N)}\\cdot${st(4 * k)}`,
            ],
          },
        ]),
    {
      podpis: `Степень степени: $${st(4 * k)}=(${st(k)})^4$, а $${d(N)}=${d(r)}^4$`,
      tex: [`T^4=${d(r)}^4\\cdot(${st(k)})^4=(${d(r)}\\cdot${st(k)})^4`],
    },
    {
      podpis: 'Температура в кельвинах положительна — берём положительный корень',
      tex: [`T=${d(r)}\\cdot${st(k)}=${d(T)}`],
    },
  ];
  /* σ и S подставлены как в условии: проверка, что разбор шёл от них. */
  if (Math.abs(val(c1) * 10 ** E1 - val(sM) * 10 ** sE * (10 ** Sexp / Sden)) > 1e-6 * 10 ** E1) {
    throw new Error('Стефан — Больцман: знаменатель посчитан неверно');
  }
  return { shagi, T, otvet: `Ответ: $${d(T)}$ К.` };
}
