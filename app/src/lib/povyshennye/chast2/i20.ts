/**
 * №20 (варианты 15–16): сумма цифр и делимость.
 *
 * а) Существует ли натуральное число с суммой цифр S, делящееся на 9?
 *    (по признаку делимости — тогда и только тогда, когда 9 | S).
 * б) Существует ли трёхзначное число с суммой цифр S, делящееся на d?
 * в) Наименьшее натуральное число с суммой цифр S, делящееся на d.
 */

import type { Chast2Zadacha, Shablon2 } from './types';

export interface PI20 {
  S: number;
  d: number;
}

const sc = (n: number) =>
  String(n)
    .split('')
    .reduce((s, c) => s + Number(c), 0);

export function chislaI20(p: PI20) {
  const daA = p.S % 9 === 0;
  let tri: number | null = null;
  for (let n = 100; n <= 999; n += 1)
    if (sc(n) === p.S && n % p.d === 0) {
      tri = n;
      break;
    }
  let min = 0;
  for (let n = 1; n < 10_000_000; n += 1)
    if (sc(n) === p.S && n % p.d === 0) {
      min = n;
      break;
    }
  if (min === 0) throw new Error('i20: не найдено');
  if (p.d % 3 === 0 && p.S % 3 !== 0) throw new Error('i20: делимость на 3');
  return { daA, daB: tri !== null, tri, min };
}

function sobrat(p: PI20): Chast2Zadacha {
  const ch = chislaI20(p);
  const otv = (b: boolean) => (b ? 'да' : 'нет');
  return {
    no: 20,
    shablon: 'i20.summaCifr',
    uslovie:
      `Рассматриваются натуральные числа, сумма цифр которых равна $${p.S}$.\n` +
      `а) Существует ли среди них число, делящееся на $9$?\n` +
      `б) Существует ли среди них трёхзначное число, делящееся на $${p.d}$?\n` +
      `в) Найдите наименьшее из этих чисел, делящееся на $${p.d}$.`,
    risunok: null,
    punkty: [
      { bukva: 'а', pole: { vid: 'danet', verno: ch.daA } },
      { bukva: 'б', pole: { vid: 'danet', verno: ch.daB } },
      { bukva: 'в', podpis: 'Наименьшее число', pole: { vid: 'chislo', verno: String(ch.min) } },
    ],
    otvet: `а) ${otv(ch.daA)}; б) ${otv(ch.daB)}; в) $${ch.min}$`,
    reshenie: [
      {
        title: 'а) Признак делимости на 9',
        lines: [
          `Число делится на $9$ тогда и только тогда, когда сумма его цифр делится на $9$. $${p.S}$ ${ch.daA ? 'делится' : 'не делится'} на $9$, поэтому ответ — ${otv(ch.daA)}${ch.daA ? ` (например, $${'9'.repeat(p.S / 9)}$)` : ''}.`,
        ],
      },
      {
        title: 'б) Трёхзначные числа',
        lines: ch.daB
          ? [
              `Подходит, например, $${ch.tri}$: сумма цифр $${p.S}$, и $${ch.tri}=${p.d}\\cdot${ch.tri! / p.d}$. Ответ — да.`,
            ]
          : [
              `Перебираем трёхзначные числа с суммой цифр $${p.S}$ (цифра сотен от $1$ до $9$, остальные — с нужной суммой) и проверяем делимость на $${p.d}$: ни одно не подходит. Ответ — нет.`,
            ],
      },
      {
        title: 'в) Наименьшее число',
        lines: [
          `Сумма цифр $${p.S}$ требует не меньше $${Math.ceil(p.S / 9)}$ цифр. Перебирая числа по возрастанию длины и значению, находим первое, делящееся на $${p.d}$: $${ch.min}=${p.d}\\cdot${ch.min / p.d}$. Все меньшие числа с суммой цифр $${p.S}$ на $${p.d}$ не делятся.`,
          `Ответ: а) ${otv(ch.daA)}; б) ${otv(ch.daB)}; в) $${ch.min}$.`,
        ],
      },
    ],
    razbor: [
      {
        slovo: 'а) Признак делимости на 9',
        formula: `${p.S}\\ ${ch.daA ? '\\vdots' : '\\not\\vdots'}\\ 9`,
      },
      {
        slovo: 'б) Трёхзначные с суммой цифр $S$',
        formula: ch.daB ? String(ch.tri) : '\\text{нет}',
      },
      { slovo: 'в) Перебор по возрастанию', formula: String(ch.min) },
    ],
    kontrol: { daA: ch.daA, daB: ch.daB, min: ch.min },
  };
}

export const I20_SUMMA_CIFR: Shablon2<PI20> = {
  no: 20,
  prototip: 'Теория чисел: сумма цифр и делимость, наименьшее число с заданной суммой цифр',
  sobrat,
};
