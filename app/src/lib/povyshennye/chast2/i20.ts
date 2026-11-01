/**
 * №20 (варианты 15–16): сумма цифр и делимость на 5 или 25.
 *
 * а) Существует ли натуральное число с суммой цифр S, делящееся на 9?
 *    (признак: тогда и только тогда, когда 9 | S).
 * б) Существует ли трёхзначное число с суммой цифр S, делящееся на d?
 * в) Наименьшее натуральное число с суммой цифр S, делящееся на d.
 * d = 5 или 25: делимость решают последние цифры — концовки 0, 5 или
 * 00, 25, 50, 75; при фиксированной концовке остаток числа — наименьшее
 * число с оставшейся суммой цифр.
 */

import type { Chast2Zadacha, Shablon2 } from './types';

export interface PI20 {
  S: number;
  d: 5 | 25;
}

/** Наименьшее натуральное число с суммой цифр s ≥ 1: остаток от деления на 9, затем девятки. */
export function naimSumma(s: number): number {
  const r = s % 9;
  return Number((r === 0 ? '' : String(r)) + '9'.repeat(Math.floor(s / 9)));
}

const KONCOVKI: Record<5 | 25, string[]> = { 5: ['0', '5'], 25: ['00', '25', '50', '75'] };
const sc = (t: string) => t.split('').reduce((s, c) => s + Number(c), 0);

export function chislaI20(p: PI20) {
  const daA = p.S % 9 === 0;
  const kand = KONCOVKI[p.d]
    .filter((k) => p.S - sc(k) >= 1)
    .map((k) => ({ k, ost: p.S - sc(k), n: Number(String(naimSumma(p.S - sc(k))) + k) }));
  const min = Math.min(...kand.map((c) => c.n));
  /* б) трёхзначное: первые цифры перед концовкой. */
  const tri = KONCOVKI[p.d]
    .map((k) => {
      const ost = p.S - sc(k);
      if (k.length === 2) return ost >= 1 && ost <= 9 ? Number(`${ost}${k}`) : null;
      if (ost < 1 || ost > 18) return null;
      const a = Math.max(1, ost - 9);
      return Number(`${a}${ost - a}${k}`);
    })
    .filter((x): x is number => x !== null);
  return { daA, daB: tri.length > 0, tri: tri[0] ?? null, kand, min };
}

function sobrat(p: PI20): Chast2Zadacha {
  const ch = chislaI20(p);
  const otv = (b: boolean) => (b ? 'да' : 'нет');
  const konc = KONCOVKI[p.d];
  const dvaZnaka = p.d === 25;
  const bNet = dvaZnaka
    ? `У трёхзначного числа, делящегося на $25$, вид $\\overline{a\\,xy}$ с концовкой $\\overline{xy}\\in\\{00,25,50,75\\}$, и цифра $a=${p.S}-(x+y)$ равна $${konc.map((k) => p.S - sc(k)).join(',\\ ')}$ — ни одно из этих чисел не цифра от $1$ до $9$.`
    : `У трёхзначного числа, делящегося на $5$, последняя цифра $0$ или $5$, и сумма двух первых цифр равна $${p.S}$ или $${p.S - 5}$; но она не больше $9+9=18$.`;
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
          ch.daA
            ? `Число делится на $9$ тогда и только тогда, когда сумма его цифр делится на $9$. $${p.S}=9\\cdot${p.S / 9}$, поэтому подходит, например, $${'9'.repeat(p.S / 9)}$. Ответ — да.`
            : `Число делится на $9$ тогда и только тогда, когда сумма его цифр делится на $9$, а $${p.S}$ на $9$ не делится. Ответ — нет.`,
        ],
      },
      {
        title: 'б) Трёхзначные числа',
        lines: ch.daB
          ? [
              `Подходит, например, $${ch.tri}$: сумма цифр $${p.S}$, и $${ch.tri}=${p.d}\\cdot${ch.tri! / p.d}$. Ответ — да.`,
            ]
          : [`${bNet} Ответ — нет.`],
      },
      {
        title: 'в) Наименьшее число',
        lines: [
          `Наименьшее натуральное число с суммой цифр $s$ — это число из как можно меньшего количества цифр $\\lceil s/9\\rceil$, у которого все цифры, кроме первой, равны $9$: при меньшем числе цифр сумма не наберётся, а при том же числе цифр меньшее число имеет меньшую первую цифру, и тогда остальным цифрам пришлось бы дать больше $9$.`,
          `Число делится на $${p.d}$ тогда и только тогда, когда оно оканчивается на ${konc.map((k) => `$${k}$`).join(', ')}. При выбранной концовке число равно $10^{${konc[0]!.length}}\\cdot M+{}$концовка, где у $M$ сумма цифр $${p.S}$ минус сумма цифр концовки, поэтому наименьшее число с этой концовкой получается при наименьшем $M$:`,
          ch.kand
            .map((c) => `концовка $${c.k}$: $M=${naimSumma(c.ost)}$, число $${c.n}$`)
            .join('; ') + '.',
          `Наименьшее из них — $${ch.min}$.`,
          `Ответ: а) ${otv(ch.daA)}; б) ${otv(ch.daB)}; в) $${ch.min}$.`,
        ],
      },
    ],
    razbor: [
      {
        slovo: 'а) Признак делимости на 9',
        formula: `${p.S}\\ ${ch.daA ? '\\vdots' : '\\not\\vdots'}\\ 9`,
      },
      { slovo: `б) Концовки чисел, кратных $${p.d}$`, formula: konc.join(',\\ ') },
      { slovo: 'в) Наименьшее число', formula: String(ch.min) },
    ],
    kontrol: { daA: ch.daA, daB: ch.daB, min: ch.min },
  };
}

export const I20_SUMMA_CIFR: Shablon2<PI20> = {
  no: 20,
  prototip:
    'Теория чисел: сумма цифр и делимость на 5 и 25, наименьшее число с заданной суммой цифр',
  sobrat,
};
