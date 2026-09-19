/** Блок P8-2 · Логарифмы. */

import { round9 } from '../../numbers';
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
      razbor: `$${log(String(a), String(b))} = ${c}$, так как $${a}^{${c}} = ${b}$`,
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
      razbor: `$${arg} = ${a}^{-${n}}$, поэтому $${log(String(a), arg)} = -${n}$`,
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
      razbor: one ? `$${tex} = 0$, так как $${a}^{0} = 1$` : `$${tex} = 1$, так как $${a}^{1} = ${a}$`,
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
      razbor: `$${tex} = ${log(String(a), `(${x} \\cdot ${y})`)} = ${log(String(a), String(T))} = ${c}$`,
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
      razbor: `$${tex} = ${log(String(a), `\\dfrac{${x}}{${y}}`)} = ${log(String(a), String(a ** c))} = ${c}$`,
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
        razbor: `$${arg} = ${a}^{\\frac{${j}}{${n}}}$, поэтому $${log(String(a), arg)} = \\dfrac{${j}}{${n}} = ${d(ans)}$`,
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
      razbor: `$${log(String(a), arg)} = ${k} \\cdot ${log(String(a), String(b))} = ${k} \\cdot ${j} = ${k * j}$`,
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
    return {
      uslovie: naydi(log(base, arg)),
      otvet: ans,
      razbor: `$${log(base, arg)} = \\dfrac{1}{${d(k)}} \\cdot ${log(String(a), arg)} = \\dfrac{${j}}{${d(k)}} = ${d(ans)}$`,
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
      razbor: k === 1 ? `$${tex} = ${b}$` : `$${tex} = (${a}^{${log(String(a), String(b))}})^{${k}} = ${b}^{${k}} = ${b ** k}$`,
      proverka: Math.pow(a, (k * Math.log(b)) / Math.log(a)),
    };
  }),
];
