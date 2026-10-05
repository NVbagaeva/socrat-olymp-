/**
 * Банк задания №2: десять зафиксированных вариантов на прототип.
 *
 * Файл собирается скриптом scripts/build-bank-2.mjs и правится
 * только им: скрипт перебирает seed по порядку и берёт первые
 * десять, у которых условия и наборы векторов разные, а ответы не
 * повторяются (у косинуса — не чаще двух раз: двухзначных десятичных
 * косинусов всего восемь). Самотест проверяет то же самое. Здесь
 * только seed: ответы считаются из них там, где нужны.
 */

export interface BankVariant {
  /** Номер варианта: 1…10. */
  n: number;
  seed: string;
}

export interface BankEntry {
  prototype: string;
  variants: BankVariant[];
}

export const BANK: BankEntry[] = [
  {
    prototype: 'A1',
    variants: [
      { n: 1, seed: 'A1#1' },
      { n: 2, seed: 'A1#2' },
      { n: 3, seed: 'A1#3' },
      { n: 4, seed: 'A1#4' },
      { n: 5, seed: 'A1#5' },
      { n: 6, seed: 'A1#7' },
      { n: 7, seed: 'A1#8' },
      { n: 8, seed: 'A1#11' },
      { n: 9, seed: 'A1#14' },
      { n: 10, seed: 'A1#16' },
    ],
  },
  {
    prototype: 'A2',
    variants: [
      { n: 1, seed: 'A2#1' },
      { n: 2, seed: 'A2#2' },
      { n: 3, seed: 'A2#3' },
      { n: 4, seed: 'A2#4' },
      { n: 5, seed: 'A2#6' },
      { n: 6, seed: 'A2#7' },
      { n: 7, seed: 'A2#9' },
      { n: 8, seed: 'A2#11' },
      { n: 9, seed: 'A2#17' },
      { n: 10, seed: 'A2#19' },
    ],
  },
  {
    prototype: 'A3',
    variants: [
      { n: 1, seed: 'A3#1' },
      { n: 2, seed: 'A3#2' },
      { n: 3, seed: 'A3#3' },
      { n: 4, seed: 'A3#5' },
      { n: 5, seed: 'A3#6' },
      { n: 6, seed: 'A3#7' },
      { n: 7, seed: 'A3#9' },
      { n: 8, seed: 'A3#15' },
      { n: 9, seed: 'A3#17' },
      { n: 10, seed: 'A3#18' },
    ],
  },
  {
    prototype: 'A4',
    variants: [
      { n: 1, seed: 'A4#1' },
      { n: 2, seed: 'A4#2' },
      { n: 3, seed: 'A4#3' },
      { n: 4, seed: 'A4#4' },
      { n: 5, seed: 'A4#5' },
      { n: 6, seed: 'A4#6' },
      { n: 7, seed: 'A4#7' },
      { n: 8, seed: 'A4#9' },
      { n: 9, seed: 'A4#11' },
      { n: 10, seed: 'A4#18' },
    ],
  },
  {
    prototype: 'A5',
    variants: [
      { n: 1, seed: 'A5#1' },
      { n: 2, seed: 'A5#3' },
      { n: 3, seed: 'A5#4' },
      { n: 4, seed: 'A5#5' },
      { n: 5, seed: 'A5#6' },
      { n: 6, seed: 'A5#7' },
      { n: 7, seed: 'A5#8' },
      { n: 8, seed: 'A5#9' },
      { n: 9, seed: 'A5#11' },
      { n: 10, seed: 'A5#18' },
    ],
  },
  {
    prototype: 'A6',
    variants: [
      { n: 1, seed: 'A6#1' },
      { n: 2, seed: 'A6#2' },
      { n: 3, seed: 'A6#4' },
      { n: 4, seed: 'A6#5' },
      { n: 5, seed: 'A6#8' },
      { n: 6, seed: 'A6#10' },
      { n: 7, seed: 'A6#24' },
      { n: 8, seed: 'A6#78' },
      { n: 9, seed: 'A6#89' },
      { n: 10, seed: 'A6#111' },
    ],
  },
  {
    prototype: 'A7',
    variants: [
      { n: 1, seed: 'A7#1' },
      { n: 2, seed: 'A7#2' },
      { n: 3, seed: 'A7#3' },
      { n: 4, seed: 'A7#4' },
      { n: 5, seed: 'A7#5' },
      { n: 6, seed: 'A7#6' },
      { n: 7, seed: 'A7#8' },
      { n: 8, seed: 'A7#9' },
      { n: 9, seed: 'A7#12' },
      { n: 10, seed: 'A7#13' },
    ],
  },
  {
    prototype: 'A8',
    variants: [
      { n: 1, seed: 'A8#1' },
      { n: 2, seed: 'A8#2' },
      { n: 3, seed: 'A8#3' },
      { n: 4, seed: 'A8#4' },
      { n: 5, seed: 'A8#5' },
      { n: 6, seed: 'A8#6' },
      { n: 7, seed: 'A8#7' },
      { n: 8, seed: 'A8#9' },
      { n: 9, seed: 'A8#10' },
      { n: 10, seed: 'A8#11' },
    ],
  },
  {
    prototype: 'B1',
    variants: [
      { n: 1, seed: 'B1#1' },
      { n: 2, seed: 'B1#2' },
      { n: 3, seed: 'B1#3' },
      { n: 4, seed: 'B1#4' },
      { n: 5, seed: 'B1#5' },
      { n: 6, seed: 'B1#6' },
      { n: 7, seed: 'B1#8' },
      { n: 8, seed: 'B1#9' },
      { n: 9, seed: 'B1#10' },
      { n: 10, seed: 'B1#11' },
    ],
  },
  {
    prototype: 'B2',
    variants: [
      { n: 1, seed: 'B2#1' },
      { n: 2, seed: 'B2#2' },
      { n: 3, seed: 'B2#3' },
      { n: 4, seed: 'B2#4' },
      { n: 5, seed: 'B2#5' },
      { n: 6, seed: 'B2#6' },
      { n: 7, seed: 'B2#7' },
      { n: 8, seed: 'B2#8' },
      { n: 9, seed: 'B2#9' },
      { n: 10, seed: 'B2#11' },
    ],
  },
  {
    prototype: 'B3',
    variants: [
      { n: 1, seed: 'B3#1' },
      { n: 2, seed: 'B3#2' },
      { n: 3, seed: 'B3#3' },
      { n: 4, seed: 'B3#4' },
      { n: 5, seed: 'B3#5' },
      { n: 6, seed: 'B3#6' },
      { n: 7, seed: 'B3#7' },
      { n: 8, seed: 'B3#8' },
      { n: 9, seed: 'B3#9' },
      { n: 10, seed: 'B3#10' },
    ],
  },
  {
    prototype: 'B4',
    variants: [
      { n: 1, seed: 'B4#1' },
      { n: 2, seed: 'B4#2' },
      { n: 3, seed: 'B4#3' },
      { n: 4, seed: 'B4#4' },
      { n: 5, seed: 'B4#5' },
      { n: 6, seed: 'B4#6' },
      { n: 7, seed: 'B4#7' },
      { n: 8, seed: 'B4#8' },
      { n: 9, seed: 'B4#10' },
      { n: 10, seed: 'B4#11' },
    ],
  },
  {
    prototype: 'B5',
    variants: [
      { n: 1, seed: 'B5#1' },
      { n: 2, seed: 'B5#2' },
      { n: 3, seed: 'B5#3' },
      { n: 4, seed: 'B5#4' },
      { n: 5, seed: 'B5#5' },
      { n: 6, seed: 'B5#6' },
      { n: 7, seed: 'B5#7' },
      { n: 8, seed: 'B5#8' },
      { n: 9, seed: 'B5#9' },
      { n: 10, seed: 'B5#10' },
    ],
  },
  {
    prototype: 'B6',
    variants: [
      { n: 1, seed: 'B6#1' },
      { n: 2, seed: 'B6#2' },
      { n: 3, seed: 'B6#3' },
      { n: 4, seed: 'B6#4' },
      { n: 5, seed: 'B6#5' },
      { n: 6, seed: 'B6#6' },
      { n: 7, seed: 'B6#7' },
      { n: 8, seed: 'B6#9' },
      { n: 9, seed: 'B6#11' },
      { n: 10, seed: 'B6#12' },
    ],
  },
  {
    prototype: 'B7',
    variants: [
      { n: 1, seed: 'B7#1' },
      { n: 2, seed: 'B7#2' },
      { n: 3, seed: 'B7#3' },
      { n: 4, seed: 'B7#4' },
      { n: 5, seed: 'B7#5' },
      { n: 6, seed: 'B7#6' },
      { n: 7, seed: 'B7#7' },
      { n: 8, seed: 'B7#8' },
      { n: 9, seed: 'B7#9' },
      { n: 10, seed: 'B7#10' },
    ],
  },
  {
    prototype: 'B8',
    variants: [
      { n: 1, seed: 'B8#1' },
      { n: 2, seed: 'B8#2' },
      { n: 3, seed: 'B8#3' },
      { n: 4, seed: 'B8#4' },
      { n: 5, seed: 'B8#5' },
      { n: 6, seed: 'B8#6' },
      { n: 7, seed: 'B8#8' },
      { n: 8, seed: 'B8#9' },
      { n: 9, seed: 'B8#14' },
      { n: 10, seed: 'B8#20' },
    ],
  },
  {
    prototype: 'B9',
    variants: [
      { n: 1, seed: 'B9#1' },
      { n: 2, seed: 'B9#2' },
      { n: 3, seed: 'B9#3' },
      { n: 4, seed: 'B9#4' },
      { n: 5, seed: 'B9#5' },
      { n: 6, seed: 'B9#7' },
      { n: 7, seed: 'B9#8' },
      { n: 8, seed: 'B9#9' },
      { n: 9, seed: 'B9#10' },
      { n: 10, seed: 'B9#11' },
    ],
  },
  {
    prototype: 'C1',
    variants: [
      { n: 1, seed: 'C1#1' },
      { n: 2, seed: 'C1#2' },
      { n: 3, seed: 'C1#3' },
      { n: 4, seed: 'C1#4' },
      { n: 5, seed: 'C1#5' },
      { n: 6, seed: 'C1#6' },
      { n: 7, seed: 'C1#7' },
      { n: 8, seed: 'C1#8' },
      { n: 9, seed: 'C1#9' },
      { n: 10, seed: 'C1#13' },
    ],
  },
  {
    prototype: 'C2',
    variants: [
      { n: 1, seed: 'C2#1' },
      { n: 2, seed: 'C2#2' },
      { n: 3, seed: 'C2#3' },
      { n: 4, seed: 'C2#4' },
      { n: 5, seed: 'C2#5' },
      { n: 6, seed: 'C2#7' },
      { n: 7, seed: 'C2#8' },
      { n: 8, seed: 'C2#9' },
      { n: 9, seed: 'C2#11' },
      { n: 10, seed: 'C2#16' },
    ],
  },
];
