/**
 * №20 (варианты 11–12): монеты двух номиналов p и q (взаимно простые),
 * монет каждого номинала сколько угодно.
 *
 * а), б) Можно ли набрать ровно S₁ (S₂) рублей? — перебор числа монет p.
 * в) Наибольшая сумма, которую набрать нельзя: pq − p − q.
 *    Оценка: если N = pq − p − q = px + qy, то p(x + 1) + q(y + 1) = pq ⇒
 *    q | x + 1, p | y + 1 ⇒ левая часть ≥ 2pq — противоречие.
 *    Пример: любая N > pq − p − q набирается (остатки xp по модулю q
 *    при x = 0, …, q − 1 различны).
 */

import type { Chast2Zadacha, Shablon2 } from './types';

export interface PA20 {
  p: number;
  q: number;
  S1: number;
  S2: number;
}

const gcd = (u: number, v: number): number => (v === 0 ? u : gcd(v, u % v));

export function nabor(p: number, q: number, S: number): [number, number] | null {
  for (let x = 0; x * p <= S; x += 1) if ((S - x * p) % q === 0) return [x, (S - x * p) / q];
  return null;
}

export function chislaA20(p: PA20) {
  if (gcd(p.p, p.q) !== 1 || p.p < 2 || p.q <= p.p) throw new Error('a20: номиналы');
  const F = p.p * p.q - p.p - p.q;
  return { F, nA: nabor(p.p, p.q, p.S1), nB: nabor(p.p, p.q, p.S2) };
}

function sobrat(p: PA20): Chast2Zadacha {
  const ch = chislaA20(p);
  const da = (x: unknown) => x !== null;
  const lin = (S: number, n: [number, number] | null) =>
    n !== null
      ? `Да: $${S}=${p.p}\\cdot${n[0]}+${p.q}\\cdot${n[1]}$.`
      : `Нет. Если $${S}=${p.p}x+${p.q}y$ с целыми неотрицательными $x$, $y$, то $${p.p}x\\le${S}$, то есть $x\\le${Math.floor(S / p.p)}$; перебирая эти значения $x$, видим, что ни при одном из них $${S}-${p.p}x$ не делится на $${p.q}$.`;
  return {
    no: 20,
    shablon: 'a20.monety',
    uslovie:
      `В автомате есть только монеты номиналом $${p.p}$ и $${p.q}$ рублей, и монет каждого номинала сколько угодно.\n` +
      `а) Можно ли выдать ровно $${p.S1}$ рублей?\n` +
      `б) Можно ли выдать ровно $${p.S2}$ рублей?\n` +
      `в) Найдите наибольшую сумму (в рублях), которую выдать нельзя.`,
    risunok: null,
    punkty: [
      { bukva: 'а', pole: { vid: 'danet', verno: da(ch.nA) } },
      { bukva: 'б', pole: { vid: 'danet', verno: da(ch.nB) } },
      { bukva: 'в', podpis: 'Сумма', pole: { vid: 'chislo', verno: String(ch.F) } },
    ],
    otvet: `а) ${da(ch.nA) ? 'да' : 'нет'}; б) ${da(ch.nB) ? 'да' : 'нет'}; в) $${ch.F}$`,
    reshenie: [
      { title: 'а)', lines: [lin(p.S1, ch.nA)] },
      { title: 'б)', lines: [lin(p.S2, ch.nB)] },
      {
        title: 'в) Оценка',
        lines: [
          `Покажем, что $${ch.F}=${p.p}\\cdot${p.q}-${p.p}-${p.q}$ выдать нельзя. Пусть $${ch.F}=${p.p}x+${p.q}y$, тогда $${p.p}(x+1)+${p.q}(y+1)=${p.p * p.q}$. Числа $${p.p}$ и $${p.q}$ взаимно просты, поэтому $x+1$ делится на $${p.q}$, а $y+1$ — на $${p.p}$; тогда левая часть не меньше $2\\cdot${p.p * p.q}$ — противоречие.`,
        ],
      },
      {
        title: 'в) Любая большая сумма выдаётся',
        lines: [
          `Числа $0,\\ ${p.p},\\ 2\\cdot${p.p},\\ \\ldots,\\ ${p.q - 1}\\cdot${p.p}$ дают различные остатки при делении на $${p.q}$ (иначе разность двух из них делилась бы на $${p.q}$). Для суммы $N>${ch.F}$ выберем среди них число $${p.p}x$ с тем же остатком, что и $N$; оно не больше $${(p.q - 1) * p.p}=${ch.F}+${p.q}<N+${p.q}$, поэтому $N-${p.p}x$ — неотрицательное кратное $${p.q}$.`,
          `Ответ в): $${ch.F}$.`,
        ],
      },
    ],
    razbor: [
      { slovo: 'а), б) Перебор числа монет одного номинала', formula: `S=${p.p}x+${p.q}y` },
      { slovo: 'в) Оценка через делимость', formula: `${p.p}(x+1)+${p.q}(y+1)=${p.p * p.q}` },
      { slovo: 'в) Пример через остатки', formula: String(ch.F) },
    ],
    kontrol: { a: da(ch.nA), b: da(ch.nB), F: ch.F },
  };
}

export const A20_MONETY: Shablon2<PA20> = {
  no: 20,
  prototip:
    'Монеты двух взаимно простых номиналов: представимость сумм и наибольшая непредставимая сумма',
  sobrat,
};
