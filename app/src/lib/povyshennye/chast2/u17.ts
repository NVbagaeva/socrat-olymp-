/**
 * №17 (варианты 1–2): кредит на два года равными (аннуитетными) платежами.
 *
 * Долг S, раз в год он растёт на r %, затем вносится платёж X; после двух
 * платежей долг погашен: (S·k − X)·k − X = 0, k = 1 + r/100, откуда
 * X = S·k²/(k + 1). Вопрос — платёж или переплата.
 */

import { add, div, mul, rat, ratTex, sub, toNumber } from '@/lib/zadanie15/core/rational';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PU17 {
  /** Сумма кредита, тыс. руб. */
  S: number;
  r: number;
  vopros: 'X' | 'pere';
}

export function chislaU17(p: PU17) {
  const k = rat(100 + p.r, 100);
  const X = div(mul(rat(p.S), mul(k, k)), add(k, rat(1)));
  if (X.d !== 1n) throw new Error('u17: платёж не целый');
  const pere = sub(mul(X, rat(2)), rat(p.S));
  return { k, X, pere };
}

const tys = (n: string) => n.replace(/\B(?=(\d{3})+(?!\d))/g, '\\,');

function sobrat(p: PU17): Chast2Zadacha {
  const ch = chislaU17(p);
  const XT = ratTex(ch.X);
  const otv = p.vopros === 'X' ? XT : ratTex(ch.pere);
  return {
    no: 17,
    shablon: 'u17.kredit2',
    uslovie:
      `Семья взяла в банке кредит $${tys(String(p.S))}$ тыс. рублей на два года. Условия возврата: каждый год после начисления процентов долг увеличивается на $${p.r}\\%$, затем семья вносит платёж. ` +
      `Оба платежа одинаковы, после второго платежа долг погашен полностью. ` +
      (p.vopros === 'X'
        ? 'Найдите размер одного платежа (в тысячах рублей).'
        : 'Сколько тысяч рублей семья переплатит банку сверх взятой суммы?'),
    risunok: null,
    punkty: [{ bukva: null, podpis: 'Ответ, тыс. руб.', pole: { vid: 'chislo', verno: otv } }],
    otvet: `$${otv}$`,
    reshenie: [
      {
        title: 'Долг по годам',
        lines: [
          `Пусть платёж $X$ тыс. руб., $k=1+\\dfrac{${p.r}}{100}=${ratTex(ch.k)}$. После первого года долг $${p.S}k-X$, после второго $(${p.S}k-X)k-X$.`,
          `Кредит погашен: $(${p.S}k-X)k-X=0$, откуда $X=\\dfrac{${p.S}k^2}{k+1}=\\dfrac{${p.S}\\cdot${ratTex(mul(ch.k, ch.k))}}{${ratTex(add(ch.k, rat(1)))}}=${XT}$.`,
        ],
      },
      {
        title: 'Итог',
        lines:
          p.vopros === 'X'
            ? [`Один платёж — $${XT}$ тыс. рублей.`]
            : [
                `За два года выплачено $2\\cdot${XT}=${ratTex(mul(ch.X, rat(2)))}$ тыс. руб., переплата $${ratTex(mul(ch.X, rat(2)))}-${p.S}=${ratTex(ch.pere)}$ тыс. рублей.`,
              ],
      },
      { title: 'Ответ', lines: [`Ответ: $${otv}$.`] },
    ],
    razbor: [
      { slovo: 'Коэффициент роста долга', formula: `k=${ratTex(ch.k)}` },
      { slovo: 'Долг после двух лет равен нулю', formula: `(${p.S}k-X)k-X=0` },
      { slovo: 'Платёж', formula: `X=\\frac{${p.S}k^2}{k+1}=${XT}` },
      { slovo: 'Ответ', formula: otv },
    ],
    kontrol: { otvet: toNumber(p.vopros === 'X' ? ch.X : ch.pere), X: toNumber(ch.X) },
  };
}

export const U17_KREDIT2: Shablon2<PU17> = {
  no: 17,
  prototip: 'Кредит на два года равными платежами: уравнение по годам, платёж или переплата',
  sobrat,
};
