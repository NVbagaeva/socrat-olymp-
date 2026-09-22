/**
 * Задание №5, прототип 5.5 — условная вероятность на двух костях.
 * Условие «шесть очков не выпало ни разу» отбрасывает исходы с этой
 * гранью, остаётся таблица 5×5 равновозможных пар.
 */

import { prototip, type Rng } from '../generator';
import { shagP } from '../bank4/vizual';
import { konechnaya, num, type Params, type Prototype } from '../types';
import { tablitsaBezGrani } from './vizual5';
import { tochno } from './obshchee';

/** Пары без запрещённой грани: сколько всего и сколько с суммой s. */
function paryBezGrani(zapret: number, s: number): { ok: number; vsego: number } {
  let ok = 0;
  let vsego = 0;
  for (let a = 1; a <= 6; a += 1) {
    for (let b = 1; b <= 6; b += 1) {
      if (a === zapret || b === zapret) {
        continue;
      }
      vsego += 1;
      if (a + b === s) {
        ok += 1;
      }
    }
  }
  return { ok, vsego };
}

const P05: Prototype = prototip({
  id: 'p5-05',
  blok: 'uslovnaya',
  nazvanie: 'Две кости: сумма при известном условии',
  tip: 'Условная вероятность',
  zadachnik: [25, 28],
  format: 'десятичная',
  okruglenie: tochno,
  uslovie: (p) => {
    const zapret = num(p, 'zapret');
    const slovo = zapret === 6 ? 'шесть очков не выпало' : 'единица не выпала';
    return `Игральную кость бросили два раза. Известно, что ${slovo} ни разу. Найдите при этом условии вероятность события «сумма очков равна ${num(p, 's')}».`;
  },
  dopustimo: (p) => {
    const zapret = num(p, 'zapret');
    const s = num(p, 's');
    if (zapret !== 1 && zapret !== 6) {
      return false;
    }
    const { ok, vsego } = paryBezGrani(zapret, s);
    return ok > 0 && konechnaya(ok / vsego);
  },
  otvet: (p) => {
    const { ok, vsego } = paryBezGrani(num(p, 'zapret'), num(p, 's'));
    return ok / vsego;
  },
  /* Второй путь: по определению условной вероятности P(A \cap B) : P(B),
     обе вероятности — от всех 36 исходов. */
  perebor: (p) => {
    const zapret = num(p, 'zapret');
    const s = num(p, 's');
    let iAiB = 0;
    let iB = 0;
    for (let a = 1; a <= 6; a += 1) {
      for (let b = 1; b <= 6; b += 1) {
        if (a !== zapret && b !== zapret) {
          iB += 1;
          if (a + b === s) {
            iAiB += 1;
          }
        }
      }
    }
    return iAiB / 36 / (iB / 36);
  },
  shagi: (p) => {
    const zapret = num(p, 'zapret');
    const s = num(p, 's');
    const { ok, vsego } = paryBezGrani(zapret, s);
    return [
      {
        text: `Условие отбрасывает броски с ${zapret === 6 ? 'шестёркой' : 'единицей'}: у каждой кости остаётся 5 граней, а пары — клетки таблицы 5×5, все равновозможны:`,
        formula: `n = 5 \\cdot 5 = ${vsego}`,
        value: vsego,
      },
      { text: `Благоприятные — клетки с суммой ${s}:`, formula: `m = ${ok}`, value: ok },
      shagP(ok, vsego),
    ];
  },
  varianty: [
    { n: 1, source: 'задачник', ref: 'задачник 05, № 25', params: { zapret: 6, s: 8 } },
    { n: 2, source: 'задачник', ref: 'задачник 05, № 26', params: { zapret: 6, s: 9 } },
    { n: 3, source: 'задачник', ref: 'задачник 05, № 27', params: { zapret: 6, s: 7 } },
    { n: 4, source: 'задачник', ref: 'задачник 05, № 28', params: { zapret: 6, s: 10 } },
  ],
  generator: (r: Rng): Params => {
    const zapret = r.pick([6, 1]);
    return { zapret, s: zapret === 6 ? r.int(2, 10) : r.int(4, 12) };
  },
  metodika: {
    metod: 'outcome-table',
    methodHints: [
      'два броска кости — пара исходов',
      'дано условие, которое отбрасывает часть исходов',
      'оставшиеся пары — таблица, в ней считаем клетки',
    ],
    fraza: () =>
      'таблица исходов — условие оставляет по пять граней у каждой кости, пары равновозможны.',
    vizual: (p) => tablitsaBezGrani(num(p, 'zapret'), num(p, 's')),
  },
});

export const TABLITSA: readonly Prototype[] = [P05];
