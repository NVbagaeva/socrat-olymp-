/** Блок P8-2 · Логарифмы. */

import { round9 } from '../../numbers';
import { shag } from '../../prototypes/common';
import { d, log, root } from '../../tex';
import type { PrepMicro } from '../types';
import { micro, naydi } from './common';

function isPowerOf(x: number, b: number): boolean {
  for (let e = 0; e <= 10; e += 1) {
    if (Math.abs(b ** e - x) < 1e-9) {
      return true;
    }
  }
  return false;
}

/** Хвост выкладки: log_a a^c = c; при c = 1 степень не пишем. */
function doPokazatelya(a: number, c: number): string {
  return c === 1 ? `${c}` : `${log(String(a), `${a}^{${c}}`)} = ${c}`;
}

/** Подпись: число — само основание или его степень. */
function stepenOsnovaniya(a: number, c: number): string {
  return c === 1 ? 'это само основание' : `степень основания: $${a ** c} = ${a}^{${c}}$`;
}

export const LOGARIFMY: PrepMicro[] = [
  micro('P8-2-01', 'Определение логарифма', '\\log_a b = c \\Leftrightarrow a^c = b', (r) => {
    const a = r.pick([2, 3, 5, 7, 10]);
    const c = r.int(1, 5);
    const b = a ** c;
    if (b > 1000) {
      return null;
    }
    return {
      uslovie: naydi(log(String(a), String(b))),
      otvet: c,
      razbor: [
        shag(
          `Логарифм — это показатель, в который возводим основание, чтобы получить число. Записываем $${b}$ как степень основания: $${b} = ${a}^{${c}}$`,
          `${log(String(a), String(b))} = ${log(String(a), `${a}^{${c}}`)} = ${c}`,
        ),
      ],
      proverka: Math.log(b) / Math.log(a),
    };
  }),
  micro('P8-2-02', 'Логарифм дроби', '\\log_a \\dfrac{1}{a^n} = -n', (r) => {
    const a = r.pick([2, 3, 5, 10]);
    const n = r.pick([1, 2, 3]);
    const dec = (a === 2 || a === 5 || a === 10) && r.int(0, 1) === 0;
    const value = round9(a ** -n);
    const arg = dec ? d(value) : `\\dfrac{1}{${a ** n}}`;
    if (dec && String(value).length > 7) {
      return null;
    }
    return {
      uslovie: naydi(log(String(a), arg)),
      otvet: -n,
      razbor: [
        shag(
          `${dec ? `Переводим $${arg}$ в обыкновенную дробь и записываем её` : 'Записываем дробь'} как степень основания с отрицательным показателем: $\\dfrac{1}{a^{n}} = a^{-n}$. Логарифм равен этому показателю`,
          `${log(String(a), arg)} = ${dec ? `${log(String(a), `\\dfrac{1}{${a ** n}}`)} = ` : ''}${log(String(a), `${a}^{-${n}}`)} = -${n}`,
        ),
      ],
      proverka: Math.log(value) / Math.log(a),
    };
  }),
  micro('P8-2-03', 'Логарифм основания и единицы', '\\log_a a = 1,\\quad \\log_a 1 = 0', (r) => {
    const a = r.int(2, 13);
    const one = r.int(0, 1) === 0;
    const tex = one ? log(String(a), '1') : log(String(a), String(a));
    return {
      uslovie: naydi(tex),
      otvet: one ? 0 : 1,
      razbor: [
        one
          ? shag(
              'Любое основание в нулевой степени равно единице: $a^{0} = 1$, поэтому логарифм единицы равен нулю',
              `${tex} = ${log(String(a), `${a}^{0}`)} = 0`,
            )
          : shag(
              'Основание в первой степени — само основание: $a^{1} = a$, поэтому логарифм основания равен единице',
              `${tex} = ${log(String(a), `${a}^{1}`)} = 1`,
            ),
      ],
      proverka: one ? 0 : 1,
    };
  }),
  micro('P8-2-04', 'Сумма логарифмов', '\\log_a x + \\log_a y = \\log_a (xy)', (r) => {
    const a = r.pick([2, 3, 4, 5, 6, 7, 10]);
    const c = r.int(1, 4);
    const T = a ** c;
    const x = r.int(2, 50);
    if (T % x !== 0 || T > 1000) {
      return null;
    }
    const y = T / x;
    if (y < 2 || y === x || isPowerOf(x, a) || isPowerOf(y, a)) {
      return null;
    }
    const tex = `${log(String(a), String(x))} + ${log(String(a), String(y))}`;
    return {
      uslovie: naydi(tex),
      otvet: c,
      razbor: [
        shag(
          `Основания одинаковые — сумма логарифмов равна логарифму произведения: $\\log_a x + \\log_a y = \\log_a (xy)$. Произведение $${x} \\cdot ${y} = ${T}$ — ${stepenOsnovaniya(a, c)}`,
          `${tex} = ${log(String(a), `(${x} \\cdot ${y})`)} = ${log(String(a), String(T))} = ${doPokazatelya(a, c)}`,
        ),
      ],
      proverka: Math.log(x) / Math.log(a) + Math.log(y) / Math.log(a),
    };
  }),
  micro('P8-2-05', 'Разность логарифмов', '\\log_a x - \\log_a y = \\log_a \\dfrac{x}{y}', (r) => {
    const a = r.pick([2, 3, 4, 5, 6, 7, 10]);
    const c = r.int(1, 4);
    const y = r.int(2, 9);
    const x = y * a ** c;
    if (x > 999 || isPowerOf(y, a)) {
      return null;
    }
    const tex = `${log(String(a), String(x))} - ${log(String(a), String(y))}`;
    return {
      uslovie: naydi(tex),
      otvet: c,
      razbor: [
        shag(
          `Основания одинаковые — разность логарифмов равна логарифму частного: $\\log_a x - \\log_a y = \\log_a \\dfrac{x}{y}$. Частное $${x} : ${y} = ${a ** c}$ — ${stepenOsnovaniya(a, c)}`,
          `${tex} = ${log(String(a), `\\dfrac{${x}}{${y}}`)} = ${log(String(a), String(a ** c))} = ${doPokazatelya(a, c)}`,
        ),
      ],
      proverka: Math.log(x) / Math.log(a) - Math.log(y) / Math.log(a),
    };
  }),
  micro('P8-2-06', 'Показатель из аргумента', '\\log_a b^k = k \\log_a b', (r) => {
    const a = r.pick([2, 3, 5, 7]);
    const j = r.pick([1, 2, 3]);
    const rootForm = r.int(0, 2) === 0;
    if (rootForm) {
      const n = r.pick([2, 4]);
      const ans = round9(j / n);
      const arg = root(n, j === 1 ? String(a) : `${a}^{${j}}`);
      return {
        uslovie: naydi(log(String(a), arg)),
        otvet: ans,
        razbor: [
          shag(
            `Корень записываем как степень с дробным показателем: $${root(n, 'a^{m}')} = a^{\\frac{m}{${n}}}$. Показатель выносим вперёд: $\\log_a b^{k} = k \\log_a b$, а $${log(String(a), String(a))} = 1$`,
            `${log(String(a), arg)} = ${log(String(a), `${a}^{\\frac{${j}}{${n}}}`)} = \\dfrac{${j}}{${n}} \\cdot ${log(String(a), String(a))} = \\dfrac{${j}}{${n}} = ${d(ans)}`,
          ),
        ],
        proverka: Math.log(Math.pow(a ** j, 1 / n)) / Math.log(a),
      };
    }
    const k = r.int(2, 5);
    const b = a ** j;
    if (b ** k > 1e9) {
      return null;
    }
    const arg = `${b}^{${k}}`;
    return {
      uslovie: naydi(log(String(a), arg)),
      otvet: k * j,
      razbor: [
        shag(
          `Показатель степени под логарифмом выносим вперёд множителем: $\\log_a b^{k} = k \\log_a b$. Возводить $${b}$ в степень не нужно`,
          `${log(String(a), arg)} = ${k} \\cdot ${log(String(a), String(b))} = ${j === 1 ? '' : `${k} \\cdot ${log(String(a), `${a}^{${j}}`)} = `}${k} \\cdot ${j} = ${k * j}`,
        ),
      ],
      proverka: (k * Math.log(b)) / Math.log(a),
    };
  }),
  micro('P8-2-07', 'Показатель из основания', '\\log_{a^k} b = \\dfrac{1}{k}\\log_a b', (r) => {
    const a = r.pick([2, 3, 5]);
    const k = r.pick([2, 3, 4, 0.5]);
    const j = r.pick([1, 2, 3, 4]);
    const ans = round9(j / k);
    if (!Number.isInteger(ans * 100) || a ** j > 1000) {
      return null;
    }
    const base = k === 0.5 ? `\\sqrt{${a}}` : String(a ** k);
    if (k !== 0.5 && a ** k > 100) {
      return null;
    }
    const arg = String(a ** j);
    const argPow = j === 1 ? String(a) : `${a}^{${j}}`;
    const razbor =
      k === 0.5
        ? shag(
            `Корень — степень с показателем $\\frac{1}{2}$: $\\sqrt{${a}} = ${a}^{\\frac{1}{2}}$. Показатель основания уходит в знаменатель: $\\log_{a^{k}} b = \\dfrac{1}{k}\\log_a b$, а делить на $\\frac{1}{2}$ — то же, что умножать на $2$`,
            `${log(base, arg)} = ${log(`${a}^{\\frac{1}{2}}`, argPow)} = 2 \\cdot ${log(String(a), argPow)} = 2 \\cdot ${j} = ${d(ans)}`,
          )
        : shag(
            `Записываем основание и число как степени $${a}$: $${a ** k} = ${a}^{${k}}$${j === 1 ? '' : `, $${arg} = ${argPow}$`}. Показатель основания уходит в знаменатель: $\\log_{a^{k}} b = \\dfrac{1}{k}\\log_a b$`,
            `${log(base, arg)} = ${log(`${a}^{${k}}`, argPow)} = \\dfrac{1}{${k}} \\cdot ${log(String(a), argPow)} = \\dfrac{${j}}{${k}} = ${d(ans)}`,
          );
    return {
      uslovie: naydi(log(base, arg)),
      otvet: ans,
      razbor: [razbor],
      proverka: Math.log(a ** j) / Math.log(a ** k),
    };
  }),
  micro('P8-2-08', 'Основное логарифмическое тождество', 'a^{\\log_a b} = b', (r) => {
    const a = r.pick([2, 3, 5, 7]);
    const b = r.int(2, 20);
    if (b === a) {
      return null;
    }
    const k = r.pick([1, 1, 2]);
    const tex = `${a}^{${k === 1 ? '' : k}${log(String(a), String(b))}}`;
    return {
      uslovie: naydi(tex),
      otvet: b ** k,
      razbor: [
        k === 1
          ? shag(
              `Основное логарифмическое тождество: $${log(String(a), String(b))}$ — это показатель, в который возводим $${a}$, чтобы получить $${b}$. Поэтому $a^{\\log_a b} = b$`,
              `${tex} = ${b}`,
            )
          : shag(
              `Множитель $${k}$ в показателе выносим как внешнюю степень: $a^{${k}x} = (a^{x})^{${k}}$. В скобках основное логарифмическое тождество: $a^{\\log_a b} = b$`,
              `${tex} = (${a}^{${log(String(a), String(b))}})^{${k}} = ${b}^{${k}} = ${b ** k}`,
            ),
      ],
      proverka: Math.pow(a, (k * Math.log(b)) / Math.log(a)),
    };
  }),
  micro('P8-2-09', 'Произведение логарифмов', '\\log_a b \\cdot \\log_b c = \\log_a c', (r) => {
    const a = r.pick([2, 3, 5]);
    const j = r.int(2, 4);
    const c = a ** j;
    const b = r.pick([6, 7, 10, 11, 13]);
    if (b === a || c > 1000) {
      return null;
    }
    const tex = `${log(String(a), String(b))} \\cdot ${log(String(b), String(c))}`;
    return {
      uslovie: naydi(tex),
      otvet: j,
      razbor: [
        shag(
          `Число $${b}$ — аргумент первого логарифма и основание второго, поэтому оно сокращается: $\\log_a b \\cdot \\log_b c = \\log_a c$. Остаётся логарифм степени основания: $${c} = ${a}^{${j}}$`,
          `${tex} = ${log(String(a), String(c))} = ${log(String(a), `${a}^{${j}}`)} = ${j}`,
        ),
      ],
      proverka: (Math.log(b) / Math.log(a)) * (Math.log(c) / Math.log(b)),
    };
  }),
  micro(
    'P8-2-10',
    'Переход к новому основанию',
    '\\log_a b = \\dfrac{\\log_c b}{\\log_c a}',
    (r) => {
      const a = r.pick([2, 3, 5]);
      const c = r.pick([2, 3, 5, 7, 10]);
      const j = r.int(2, 5);
      if (c === a || a ** j > 1000) {
        return null;
      }
      const b = a ** j;
      const tex = `\\dfrac{${log(String(c), String(b))}}{${log(String(c), String(a))}}`;
      return {
        uslovie: naydi(tex),
        otvet: j,
        razbor: [
          shag(
            `Частное логарифмов с одинаковым основанием $${c}$ — это логарифм по новому основанию: $\\dfrac{\\log_c b}{\\log_c a} = \\log_a b$. Знаменатель становится основанием, а $${b} = ${a}^{${j}}$`,
            `${tex} = ${log(String(a), String(b))} = ${log(String(a), `${a}^{${j}}`)} = ${j}`,
          ),
        ],
        proverka: Math.log(b) / Math.log(c) / (Math.log(a) / Math.log(c)),
      };
    },
  ),
];
