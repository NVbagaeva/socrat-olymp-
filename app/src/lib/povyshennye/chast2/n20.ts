/**
 * №20 (варианты 25–26): суммы нескольких (не менее двух) подряд идущих
 * натуральных чисел.
 *
 * Сумма L чисел, начиная с m: S = Lm + L(L − 1)/2, то есть
 * 2S = L·(2m + L − 1), множители разной чётности, L < 2m + L − 1.
 * а) Представимо ли число S1 (степень двойки — нет, иначе — да, пример).
 * б) Можно ли S2 записать суммой ровно L2 таких чисел.
 * в) Наибольшее число слагаемых для S3: L(L + 1)/2 ≤ S3 и 2S3/L − L + 1
 *    чётно и положительно — перебор L сверху вниз.
 */

import type { Chast2Zadacha, Shablon2 } from './types';

export interface PN20 {
  S1: number;
  S2: number;
  L2: number;
  S3: number;
}

/** Начало суммы L подряд идущих натуральных чисел, равной S; null — нельзя. */
export function nachalo(S: number, L: number): number | null {
  const t = 2 * S - L * (L - 1);
  if (t <= 0 || t % (2 * L) !== 0) return null;
  return t / (2 * L);
}

export function chislaN20(p: PN20) {
  let a: { L: number; m: number } | null = null;
  for (let L = 2; L * (L + 1) <= 2 * p.S1; L += 1) {
    const m = nachalo(p.S1, L);
    if (m !== null) {
      a = { L, m };
      break;
    }
  }
  const b = nachalo(p.S2, p.L2);
  let v: { L: number; m: number } | null = null;
  for (let L = Math.floor(Math.sqrt(2 * p.S3)) + 1; L >= 2; L -= 1) {
    const m = nachalo(p.S3, L);
    if (m !== null) {
      v = { L, m };
      break;
    }
  }
  if (v === null) throw new Error('n20: S3 не представимо');
  return { a, b, v };
}

/** «7 + 8 + 9» или «7 + 8 + … + 15». */
function zapis(m: number, L: number): string {
  if (L <= 5) return Array.from({ length: L }, (_, i) => m + i).join('+');
  return `${m}+${m + 1}+\\ldots+${m + L - 1}`;
}

function sobrat(p: PN20): Chast2Zadacha {
  const ch = chislaN20(p);
  const aDa = ch.a !== null;
  const bDa = ch.b !== null;
  const stepen2 = (s: number) => (s & (s - 1)) === 0;
  const uslovie =
    `Натуральное число назовём хорошим, если его можно записать в виде суммы нескольких (не менее двух) подряд идущих натуральных чисел.\n` +
    `а) Является ли хорошим число $${p.S1}$?\n` +
    `б) Можно ли число $${p.S2}$ записать в виде суммы ровно $${p.L2}$ подряд идущих натуральных чисел?\n` +
    `в) Какое наибольшее количество слагаемых может быть в такой записи числа $${p.S3}$?`;
  const obshchee = `Если $S$ — сумма $L\\ge2$ подряд идущих натуральных чисел, начиная с $m\\ge1$, то $S=Lm+\\dfrac{L(L-1)}{2}$, то есть $2S=L\\,(2m+L-1)$. Множители $L$ и $2m+L-1$ разной чётности, и $L<2m+L-1$.`;
  const aLines = aDa
    ? [`Да: $${p.S1}=${zapis(ch.a!.m, ch.a!.L)}$.`]
    : [
        obshchee,
        `Если $${p.S1}=2^{${Math.log2(p.S1)}}$, то $2S=2^{${Math.log2(p.S1) + 1}}$ — произведение двух множителей разной чётности, больших единицы, равным степени двойки быть не может: у нечётного множителя, большего $1$, есть нечётный простой делитель. Значит, число $${p.S1}$ хорошим не является.`,
      ];
  if (!aDa && !stepen2(p.S1)) throw new Error('n20: а) нет, но не степень двойки');
  const b2S = 2 * p.S2;
  const bLines = bDa
    ? [`Да: $${p.S2}=${zapis(ch.b!, p.L2)}$ — ровно $${p.L2}$ слагаемых.`]
    : [
        obshchee,
        `При $L=${p.L2}$: $2m+${p.L2 - 1}=\\dfrac{${b2S}}{${p.L2}}${b2S % p.L2 === 0 ? `=${b2S / p.L2}` : ''}$${
          b2S % p.L2 !== 0
            ? ` — не целое число`
            : b2S / p.L2 <= p.L2
              ? ` — тогда $m\\le0$`
              : ` — тогда $2m=${b2S / p.L2 - p.L2 + 1}$, $m$ не целое`
        }. Значит, нельзя.`,
      ];
  const L3 = ch.v.L;
  const vLines = [
    `Оценка. Сумма $L$ подряд идущих натуральных чисел не меньше $1+2+\\ldots+L=\\dfrac{L(L+1)}{2}$, поэтому $\\dfrac{L(L+1)}{2}\\le ${p.S3}$ и $L\\le ${Math.floor((Math.sqrt(8 * p.S3 + 1) - 1) / 2)}$.`,
    `Из $2S=L(2m+L-1)$ число $L$ — делитель числа $${2 * p.S3}$, а $\\dfrac{${2 * p.S3}}{L}-L+1$ должно быть чётным и положительным. Проверяя $L$ сверху вниз, первое подходящее значение — $L=${L3}$: $\\dfrac{${2 * p.S3}}{${L3}}-${L3}+1=${(2 * p.S3) / L3 - L3 + 1}=2m$, $m=${ch.v.m}$.`,
    `Пример: $${p.S3}=${zapis(ch.v.m, L3)}$ — $${L3}$ слагаемых.`,
  ];
  const otv = `а) ${aDa ? 'да' : 'нет'}; б) ${bDa ? 'да' : 'нет'}; в) $${L3}$`;
  return {
    no: 20,
    shablon: 'n20.podryad',
    uslovie,
    risunok: null,
    punkty: [
      { bukva: 'а', pole: { vid: 'danet', verno: aDa } },
      { bukva: 'б', pole: { vid: 'danet', verno: bDa } },
      { bukva: 'в', podpis: 'Наибольшее количество', pole: { vid: 'chislo', verno: String(L3) } },
    ],
    otvet: otv,
    reshenie: [
      { title: `а) Число $${p.S1}$`, lines: aLines },
      { title: `б) Число $${p.S2}$ и $${p.L2}$ слагаемых`, lines: bLines },
      { title: 'в) Оценка и пример', lines: [...vLines, `Ответ: ${otv}.`] },
    ],
    razbor: [
      { slovo: 'Сумма подряд идущих чисел', formula: '2S=L(2m+L-1)' },
      { slovo: 'Множители разной чётности', formula: 'L\\not\\equiv 2m+L-1\\pmod 2' },
      { slovo: 'Оценка числа слагаемых', formula: `\\dfrac{L(L+1)}{2}\\le ${p.S3}` },
      { slovo: 'Ответ', formula: `L=${L3}` },
    ],
    kontrol: {
      a: aDa,
      b: bDa,
      v: L3,
      vm: ch.v.m,
    },
  };
}

export const N20_PODRYAD: Shablon2<PN20> = {
  no: 20,
  prototip:
    'Суммы подряд идущих натуральных чисел: представимость, заданное число слагаемых, наибольшее число слагаемых',
  sobrat,
};
