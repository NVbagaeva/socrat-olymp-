/**
 * №17 (варианты 9–10): кредит на два года равными платежами.
 *
 * Сумма S тыс. руб., раз в год долг увеличивается на r% (q = 1 + r/100),
 * затем вносится платёж X. Через два года долг погашен:
 * (S·q − X)·q − X = 0 ⇒ X = S·q²/(q + 1).
 * Спрашивается платёж X («X») или переплата 2X − S («P»).
 */

import { add, div, mul, rat, ratTex, sub, toNumber } from '@/lib/zadanie15/core/rational';
import type { Chast2Zadacha, Shablon2 } from './types';

export interface PY17 {
  /** Сумма кредита, тыс. руб. */
  S: number;
  /** Ставка, %. */
  r: number;
  vopros: 'X' | 'P';
}

export function chislaY17(p: PY17) {
  const q = add(rat(1), rat(p.r, 100));
  const X = div(mul(rat(p.S), mul(q, q)), add(q, rat(1)));
  const P = sub(mul(rat(2), X), rat(p.S));
  return { q, X, P };
}

function sobrat(p: PY17): Chast2Zadacha {
  const ch = chislaY17(p);
  const otvR = p.vopros === 'X' ? ch.X : ch.P;
  if (otvR.d !== 1n) throw new Error('y17: ответ не целый');
  const otv = ratTex(otvR);
  const qT = ratTex(ch.q).replace('.', '{,}');
  return {
    no: 17,
    shablon: 'y17.kreditDvaGoda',
    uslovie:
      `Клиент взял в банке кредит $${p.S}$ тыс. рублей на два года. Условия возврата таковы: в конце каждого года долг увеличивается на $${p.r}\\%$ по сравнению с долгом на начало года, после чего клиент вносит платёж. Оба платежа одинаковы, и после второго платежа кредит полностью погашен. ` +
      (p.vopros === 'X'
        ? 'Найдите размер ежегодного платежа (в тыс. рублей).'
        : 'Сколько тысяч рублей составит переплата по кредиту (разность между суммой платежей и суммой кредита)?'),
    risunok: null,
    punkty: [{ bukva: null, podpis: 'Ответ, тыс. руб.', pole: { vid: 'chislo', verno: otv } }],
    otvet: `$${otv}$`,
    reshenie: [
      {
        title: 'Схема долга',
        lines: [
          `Пусть $q=1+\\dfrac{${p.r}}{100}=${qT}$, $X$ — платёж. После первого года долг $${p.S}q-X$, после второго $(${p.S}q-X)q-X$.`,
        ],
      },
      {
        title: 'Уравнение',
        lines: [
          `Кредит погашен: $${p.S}q^2-Xq-X=0$, откуда $X=\\dfrac{${p.S}q^2}{q+1}$.`,
          `$X=\\dfrac{${p.S}\\cdot ${ratTex(mul(ch.q, ch.q)).replace('.', '{,}')}}{${ratTex(add(ch.q, rat(1)))}}=${ratTex(ch.X)}$ тыс. руб.`,
        ],
      },
      {
        title: 'Ответ',
        lines:
          p.vopros === 'X'
            ? [`Ответ: $${otv}$.`]
            : [
                `Переплата $2X-${p.S}=2\\cdot${ratTex(ch.X)}-${p.S}=${otv}$ тыс. руб.`,
                `Ответ: $${otv}$.`,
              ],
      },
    ],
    razbor: [
      { slovo: 'Долг после каждого года', formula: `(${p.S}q-X)q-X=0` },
      { slovo: 'Выражаем платёж', formula: `X=\\frac{${p.S}q^2}{q+1}` },
      { slovo: 'Ответ', formula: otv },
    ],
    kontrol: { otvet: toNumber(otvR), X: toNumber(ch.X) },
  };
}

export const Y17_KREDIT_DVA_GODA: Shablon2<PY17> = {
  no: 17,
  prototip: 'Кредит на два года равными платежами: платёж или переплата',
  sobrat,
};
