/**
 * №17 (варианты 29–30): спрос убывает экспоненциально: N(p) = A·e^{−p/k}.
 * «pribyl»: P(p) = (p − c)·N(p), P′ = A e^{−p/k}(1 − (p − c)/k) = 0 ⇒ p = c + k;
 * «vyruchka»: R(p) = p·N(p) ⇒ p = k. Производная меняет знак с «+» на «−».
 */

import type { Chast2Zadacha, Shablon2 } from './types';

const TOVARY = [
  { kto: 'Пекарня', chto: 'фирменный пирог', chtoRod: 'пирогов' },
  { kto: 'Кофейня', chto: 'авторский десерт', chtoRod: 'десертов' },
  { kto: 'Сувенирная лавка', chto: 'керамическую кружку', chtoRod: 'кружек' },
  { kto: 'Цветочный магазин', chto: 'букет', chtoRod: 'букетов' },
  { kto: 'Книжный магазин', chto: 'настольную игру', chtoRod: 'настольных игр' },
  { kto: 'Фермерская лавка', chto: 'банку мёда', chtoRod: 'банок мёда' },
] as const;

export interface PQ17 {
  A: number;
  k: number;
  c: number;
  tovar: number;
  vopros: 'pribyl' | 'vyruchka';
}

export function chislaQ17(p: PQ17) {
  const opt = p.vopros === 'pribyl' ? p.c + p.k : p.k;
  return { opt };
}

function sobrat(p: PQ17): Chast2Zadacha {
  const T = TOVARY[p.tovar];
  if (T === undefined) throw new Error('q17: товар');
  const ch = chislaQ17(p);
  const pr = p.vopros === 'pribyl';
  const fT = pr
    ? `P(p)=(p-${p.c})\\cdot ${p.A}e^{-\\frac{p}{${p.k}}}`
    : `R(p)=p\\cdot ${p.A}e^{-\\frac{p}{${p.k}}}`;
  const uslovie =
    `${T.kto} продаёт ${T.chto} по цене $p$ рублей за штуку. Маркетологи установили, что при такой цене за день продаётся в среднем\n` +
    `$\\displaystyle N(p)=${p.A}\\,e^{-\\frac{p}{${p.k}}}$\n` +
    `${T.chtoRod}. ` +
    (pr
      ? `Себестоимость одной штуки равна $${p.c}$ рублям, так что дневная прибыль равна $P(p)=(p-${p.c})\\cdot N(p)$. При какой цене дневная прибыль будет наибольшей?`
      : `Дневная выручка равна $R(p)=p\\cdot N(p)$. При какой цене дневная выручка будет наибольшей?`);
  const proizv = pr
    ? `P'(p)=${p.A}e^{-\\frac{p}{${p.k}}}\\left(1-\\dfrac{p-${p.c}}{${p.k}}\\right)=\\dfrac{${p.A}}{${p.k}}e^{-\\frac{p}{${p.k}}}\\left(${p.k + p.c}-p\\right)`
    : `R'(p)=${p.A}e^{-\\frac{p}{${p.k}}}\\left(1-\\dfrac{p}{${p.k}}\\right)=\\dfrac{${p.A}}{${p.k}}e^{-\\frac{p}{${p.k}}}\\left(${p.k}-p\\right)`;
  return {
    no: 17,
    shablon: 'q17.cenaSpros',
    uslovie,
    risunok: null,
    punkty: [
      { bukva: null, podpis: 'Цена $p$, руб.', pole: { vid: 'chislo', verno: String(ch.opt) } },
    ],
    otvet: `$${ch.opt}$ руб.`,
    reshenie: [
      {
        title: 'Производная',
        lines: [
          `Функция $${fT}$ рассматривается при $p${pr ? `>${p.c}` : '>0'}$. По правилу произведения и $\\left(e^{-\\frac{p}{${p.k}}}\\right)'=-\\dfrac1{${p.k}}e^{-\\frac{p}{${p.k}}}$:`,
          `$${proizv}$.`,
        ],
      },
      {
        title: 'Знак производной',
        lines: [
          `Множитель $\\dfrac{${p.A}}{${p.k}}e^{-\\frac{p}{${p.k}}}$ положителен, поэтому знак производной — знак разности $${ch.opt}-p$: при $p<${ch.opt}$ производная положительна, при $p>${ch.opt}$ — отрицательна.`,
          `Значит, $p=${ch.opt}$ — точка максимума, и в ней функция принимает наибольшее значение.`,
        ],
      },
      { title: 'Ответ', lines: [`Ответ: $${ch.opt}$ рублей.`] },
    ],
    razbor: [
      { slovo: 'Производная произведения', formula: proizv },
      { slovo: 'Нуль производной', formula: `p=${ch.opt}` },
      { slovo: 'Смена знака с «+» на «−» — максимум', formula: `p=${ch.opt}` },
    ],
    kontrol: { opt: ch.opt },
  };
}

export const Q17_CENA_SPROS: Shablon2<PQ17> = {
  no: 17,
  prototip: 'Цена при экспоненциальном спросе: наибольшая прибыль или выручка через производную',
  sobrat,
};
