/** Блок P8-1 · Степени и корни. */

import { nice, round9 } from '../../numbers';
import { d, root } from '../../tex';
import type { PrepMicro } from '../types';
import { micro, naydi } from './common';

export const STEPENI: PrepMicro[] = [
  micro('P8-1-01', 'Произведение степеней', 'a^m \\cdot a^n = a^{m+n}', (r) => {
    const a = r.pick([2, 3, 5, 10]);
    const m = r.int(1, 5);
    const n = r.int(1, 5);
    const ans = a ** (m + n);
    if (ans > 1000) {
      return null;
    }
    return {
      uslovie: naydi(`${a}^{${m}} \\cdot ${a}^{${n}}`),
      otvet: ans,
      razbor: `$${a}^{${m}} \\cdot ${a}^{${n}} = ${a}^{${m + n}} = ${ans}$`,
      proverka: a ** m * a ** n,
    };
  }),
  micro('P8-1-02', 'Частное степеней', 'a^m : a^n = a^{m-n}', (r) => {
    const a = r.pick([2, 3, 5, 7, 10]);
    const e = r.int(1, 4);
    const n = r.int(1, 8);
    const m = n + e;
    const ans = a ** e;
    if (ans > 1000) {
      return null;
    }
    return {
      uslovie: naydi(`${a}^{${m}} : ${a}^{${n}}`),
      otvet: ans,
      razbor: `$${a}^{${m}} : ${a}^{${n}} = ${a}^{${m} - ${n}} = ${a}^{${e}} = ${ans}$`,
      proverka: Math.exp(m * Math.log(a) - n * Math.log(a)),
    };
  }),
  micro('P8-1-03', 'Степень степени', '(a^m)^n = a^{mn}', (r) => {
    const a = r.pick([2, 3, 5, 10]);
    const m = r.int(2, 5);
    const n = r.int(2, 5);
    const ans = a ** (m * n);
    if (m * n > 10 || ans > 1000) {
      return null;
    }
    return {
      uslovie: naydi(`(${a}^{${m}})^{${n}}`),
      otvet: ans,
      razbor: `$(${a}^{${m}})^{${n}} = ${a}^{${m} \\cdot ${n}} = ${a}^{${m * n}} = ${ans}$`,
      proverka: (a ** m) ** n,
    };
  }),
  micro('P8-1-04', 'Отрицательный показатель', 'a^{-n} = \\dfrac{1}{a^n}', (r) => {
    const a = r.pick([2, 4, 5, 8, 10, 20, 25]);
    const n = r.pick([1, 2, 3]);
    const ans = round9(a ** -n);
    if (a ** n > 1000 || !nice(ans, 3)) {
      return null;
    }
    return {
      uslovie: naydi(`${a}^{-${n}}`),
      otvet: ans,
      razbor: `$${a}^{-${n}} = \\dfrac{1}{${a}^{${n}}} = \\dfrac{1}{${a ** n}} = ${d(ans)}$`,
      proverka: 1 / a ** n,
    };
  }),
  micro('P8-1-05', 'Дробный показатель', 'a^{\\frac{m}{n}} = \\sqrt[n]{a^m}', (r) => {
    const b = r.pick([2, 3, 4, 5, 10]);
    const n = r.pick([2, 3]);
    const m = r.pick([1, 2]);
    const a = b ** n;
    const ans = b ** m;
    if (a > 1000 || ans > 1000) {
      return null;
    }
    const exp = n === 2 && m === 1 ? '0{,}5' : `\\frac{${m}}{${n}}`;
    return {
      uslovie: naydi(`${a}^{${exp}}`),
      otvet: ans,
      razbor: `$${a}^{${exp}} = ${root(n, `${a}^{${m}}`)} = (${root(n, String(a))})^{${m}} = ${b}^{${m}} = ${ans}$`,
      proverka: a ** (m / n),
    };
  }),
  micro('P8-1-06', 'Одинаковый показатель', 'a^n \\cdot b^n = (ab)^n', (r) => {
    const [a, b] = r.pick([
      [2, 5],
      [4, 25],
      [5, 20],
      [2, 50],
      [4, 5],
      [25, 4],
    ] as const);
    const n = r.pick([2, 3, 4]);
    const ans = (a * b) ** n;
    if (ans > 100000) {
      return null;
    }
    return {
      uslovie: naydi(`${a}^{${n}} \\cdot ${b}^{${n}}`),
      otvet: ans,
      razbor: `$${a}^{${n}} \\cdot ${b}^{${n}} = (${a} \\cdot ${b})^{${n}} = ${a * b}^{${n}} = ${ans}$`,
      proverka: a ** n * b ** n,
    };
  }),
  micro('P8-1-07', 'Произведение и частное корней', '\\sqrt{a} \\cdot \\sqrt{b} = \\sqrt{ab},\\quad \\dfrac{\\sqrt{a}}{\\sqrt{b}} = \\sqrt{\\dfrac{a}{b}}', (r) => {
    const k = r.int(2, 12);
    const a = r.pick([2, 3, 5, 6, 7, 8, 10, 12, 18, 20]);
    const quotient = r.int(0, 1) === 0;
    if (quotient) {
      const b = a;
      const top = a * k * k;
      return {
        uslovie: naydi(`\\dfrac{\\sqrt{${top}}}{\\sqrt{${b}}}`),
        otvet: k,
        razbor: `$\\dfrac{\\sqrt{${top}}}{\\sqrt{${b}}} = \\sqrt{\\dfrac{${top}}{${b}}} = \\sqrt{${k * k}} = ${k}$`,
        proverka: Math.sqrt(top) / Math.sqrt(b),
      };
    }
    if ((k * k) % a !== 0) {
      return null;
    }
    const b = (k * k) / a;
    if (b < 2 || b === a) {
      return null;
    }
    return {
      uslovie: naydi(`\\sqrt{${a}} \\cdot \\sqrt{${b}}`),
      otvet: k,
      razbor: `$\\sqrt{${a}} \\cdot \\sqrt{${b}} = \\sqrt{${a * b}} = ${k}$`,
      proverka: Math.sqrt(a) * Math.sqrt(b),
    };
  }),
  micro('P8-1-08', 'Корень из степени', '\\sqrt[n]{a^{nk}} = a^k', (r) => {
    const a = r.pick([2, 3, 5, 7, 10]);
    const n = r.pick([2, 3, 4]);
    const k = r.pick([1, 2]);
    const ans = a ** k;
    if (ans > 100 || a ** (n * k) > 100000) {
      return null;
    }
    const inner = k === 1 && r.int(0, 1) === 0 ? String(a ** n) : `${a}^{${n * k}}`;
    return {
      uslovie: naydi(root(n, inner)),
      otvet: ans,
      razbor: `$${root(n, inner)} = ${root(n, `${a}^{${n * k}}`)} = ${a}^{${n * k} : ${n}} = ${a}^{${k}} = ${ans}$`,
      proverka: Math.pow(a ** (n * k), 1 / n),
    };
  }),
];
