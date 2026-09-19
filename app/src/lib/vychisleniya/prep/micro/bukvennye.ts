/** Блок P8-5 · Буквенные выражения. */

import { round9 } from '../../numbers';
import { d } from '../../tex';
import type { Rng } from '../../rng';
import type { PrepMicro } from '../types';
import { micro } from './common';

function pri(tex: string, a: number, b?: number): string {
  const vals = b === undefined ? `a = ${d(a)}` : `a = ${d(a)},\\ b = ${d(b)}`;
  return `Найдите значение выражения $${tex}$ при $${vals}$.`;
}

function tenth(r: Rng, from: number, to: number): number {
  for (let i = 0; i < 50; i += 1) {
    const x = r.dec(from, to, 1);
    if (x !== 0) {
      return x;
    }
  }
  return 1.5;
}

function par(x: number): string {
  return x < 0 ? `(${d(x)})` : d(x);
}

export const BUKVENNYE: PrepMicro[] = [
  micro('P8-5-01', 'Разность квадратов', 'a^2 - b^2 = (a - b)(a + b)', (r) => {
    const a = tenth(r, -9.9, 9.9);
    const b = tenth(r, -9.9, 9.9);
    const ans = round9(a + b);
    if (Math.abs(a - b) < 1e-9 || ans === 0) {
      return null;
    }
    return {
      uslovie: pri('\\dfrac{a^2 - b^2}{a - b}', a, b),
      otvet: ans,
      razbor: `$\\dfrac{a^2 - b^2}{a - b} = a + b = ${d(a)} + ${par(b)} = ${d(ans)}$`,
      proverka: (a * a - b * b) / (a - b),
    };
  }),
  micro('P8-5-02', 'Квадрат суммы', '(a + b)^2 = a^2 + 2ab + b^2', (r) => {
    const a = tenth(r, -5.9, 5.9);
    const b = tenth(r, -5.9, 5.9);
    const s = round9(a + b);
    if (s === 0 || Number.isInteger(a) || Number.isInteger(b)) {
      return null;
    }
    const ans = round9(s * s);
    return {
      uslovie: pri('a^2 + 2ab + b^2', a, b),
      otvet: ans,
      razbor: `$a^2 + 2ab + b^2 = (a + b)^2 = (${d(a)} + ${par(b)})^2 = ${par(s)}^2 = ${d(ans)}$`,
      proverka: a * a + 2 * a * b + b * b,
    };
  }),
  micro('P8-5-03', 'Квадрат разности', '(a - b)^2 = a^2 - 2ab + b^2', (r) => {
    const a = tenth(r, -5.9, 5.9);
    const b = tenth(r, -5.9, 5.9);
    const s = round9(a - b);
    if (s === 0 || Number.isInteger(a) || Number.isInteger(b)) {
      return null;
    }
    const ans = round9(s * s);
    return {
      uslovie: pri('a^2 - 2ab + b^2', a, b),
      otvet: ans,
      razbor: `$a^2 - 2ab + b^2 = (a - b)^2 = (${d(a)} - ${par(b)})^2 = ${par(s)}^2 = ${d(ans)}$`,
      proverka: a * a - 2 * a * b + b * b,
    };
  }),
  micro('P8-5-04', 'Общий множитель', 'ka + kb = k(a + b)', (r) => {
    const k = r.int(2, 9);
    const a = tenth(r, -4.9, 4.9);
    const b = tenth(r, -4.9, 4.9);
    if (Math.abs(a + b) < 1e-9) {
      return null;
    }
    return {
      uslovie: pri(`\\dfrac{${k}a + ${k}b}{a + b}`, a, b),
      otvet: k,
      razbor: `$\\dfrac{${k}a + ${k}b}{a + b} = \\dfrac{${k}(a + b)}{a + b} = ${k}$ при любых $a$, $b$ с $a + b \\ne 0$`,
      proverka: (k * a + k * b) / (a + b),
    };
  }),
  micro('P8-5-05', 'Степень с буквой', 'a^m : a^n = a^{m-n}', (r) => {
    const a = r.pick([0.5, 0.2, 2, 3, 5, 10]);
    const e = r.pick([1, 2, 3]);
    const n = r.int(1, 6);
    const m = n + e;
    const ans = round9(a ** e);
    return {
      uslovie: pri(`\\dfrac{a^{${m}}}{a^{${n}}}`, a),
      otvet: ans,
      razbor: `$\\dfrac{a^{${m}}}{a^{${n}}} = a^{${m} - ${n}} = a^{${e}} = ${d(a)}^{${e}} = ${d(ans)}$`,
      proverka: a ** m / a ** n,
    };
  }),
  micro('P8-5-06', 'Корень из квадрата', '\\sqrt{a^2} = \\lvert a \\rvert', (r) => {
    const a = -Math.abs(r.int(0, 1) === 0 ? r.int(1, 12) : tenth(r, 0.1, 9.9));
    return {
      uslovie: pri('\\sqrt{a^2}', a),
      otvet: round9(-a),
      razbor: `$\\sqrt{a^2} = \\lvert a \\rvert = \\lvert ${d(a)} \\rvert = ${d(-a)}$`,
      proverka: Math.sqrt(a * a),
    };
  }),
  micro('P8-5-07', 'Корни с буквами', '\\sqrt{a} \\cdot \\sqrt{b} = \\sqrt{ab}', (r) => {
    const k = r.int(2, 12);
    const a = r.pick([0.2, 0.5, 1.6, 2.5, 4.9, 0.4, 1.2, 3.6, 6.4]);
    const b = round9((k * k) / a);
    if (!Number.isInteger(b * 10) || b === a || b > 999) {
      return null;
    }
    return {
      uslovie: pri('\\sqrt{a} \\cdot \\sqrt{b}', a, b),
      otvet: k,
      razbor: `$\\sqrt{a} \\cdot \\sqrt{b} = \\sqrt{ab} = \\sqrt{${d(a)} \\cdot ${d(b)}} = \\sqrt{${k * k}} = ${k}$`,
      proverka: Math.sqrt(a) * Math.sqrt(b),
    };
  }),
  micro('P8-5-08', 'Логарифм с буквой', '\\log_a a^k = k', (r) => {
    const a = r.pick([2, 3, 5, 7]);
    const k = r.int(2, 6);
    return {
      uslovie: pri(`\\log_a a^{${k}}`, a),
      otvet: k,
      razbor: `$\\log_a a^{${k}} = ${k}$ при любом допустимом $a$; значение $a = ${a}$ на ответ не влияет`,
      proverka: Math.log(a ** k) / Math.log(a),
    };
  }),
];
