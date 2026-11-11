/** Блок P8-5 · Буквенные выражения. */

import { round9 } from '../../numbers';
import { shag } from '../../prototypes/common';
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

/** Степень a^e после подстановки: при e = 1 — само число. */
function podstanovka(a: number, e: number, ans: number): string {
  return e === 1 ? `a = ${d(ans)}` : `a^{${e}} = ${par(a)}^{${e}} = ${d(ans)}`;
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
      razbor: [
        shag(
          'Раскладываем числитель по формуле разности квадратов $a^2 - b^2 = (a - b)(a + b)$ и сокращаем на $a - b$. Возводить числа в квадрат не нужно — подставляем в $a + b$',
          `\\dfrac{a^2 - b^2}{a - b} = \\dfrac{(a - b)(a + b)}{a - b} = a + b = ${d(a)} + ${par(b)} = ${d(ans)}`,
        ),
      ],
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
      razbor: [
        shag(
          'Узнаём квадрат суммы: $a^2 + 2ab + b^2 = (a + b)^2$. Сначала складываем, потом возводим в квадрат одно число вместо трёх слагаемых',
          `a^2 + 2ab + b^2 = (a + b)^2 = (${d(a)} + ${par(b)})^2 = ${par(s)}^2 = ${d(ans)}`,
        ),
      ],
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
      razbor: [
        shag(
          'Узнаём квадрат разности: $a^2 - 2ab + b^2 = (a - b)^2$. Сначала вычитаем, потом возводим в квадрат одно число вместо трёх слагаемых',
          `a^2 - 2ab + b^2 = (a - b)^2 = (${d(a)} - ${par(b)})^2 = ${par(s)}^2 = ${d(ans)}`,
        ),
      ],
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
      razbor: [
        shag(
          `Выносим в числителе общий множитель $${k}$ за скобки: $ka + kb = k(a + b)$, и сокращаем на $a + b$. Здесь $a + b = ${d(round9(a + b))} \\ne 0$, так что сокращать можно, а сами значения $a$ и $b$ не нужны`,
          `\\dfrac{${k}a + ${k}b}{a + b} = \\dfrac{${k}(a + b)}{a + b} = ${k}`,
        ),
      ],
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
      razbor: [
        shag(
          'Основания одинаковые — при делении показатели вычитаются: $a^{m} : a^{n} = a^{m - n}$. Число подставляем только в то, что осталось',
          `\\dfrac{a^{${m}}}{a^{${n}}} = a^{${m} - ${n}} = ${podstanovka(a, e, ans)}`,
        ),
      ],
      proverka: a ** m / a ** n,
    };
  }),
  micro('P8-5-06', 'Корень из квадрата', '\\sqrt{a^2} = \\lvert a \\rvert', (r) => {
    const a = -Math.abs(r.int(0, 1) === 0 ? r.int(1, 12) : tenth(r, 0.1, 9.9));
    return {
      uslovie: pri('\\sqrt{a^2}', a),
      otvet: round9(-a),
      razbor: [
        shag(
          'Корень из квадрата — модуль числа: $\\sqrt{a^2} = \\lvert a \\rvert$. Здесь $a < 0$, поэтому модуль меняет знак: $\\lvert a \\rvert = -a$',
          `\\sqrt{a^2} = \\lvert a \\rvert = \\lvert ${d(a)} \\rvert = ${d(-a)}`,
        ),
      ],
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
      razbor: [
        shag(
          'Произведение корней — корень из произведения: $\\sqrt{a} \\cdot \\sqrt{b} = \\sqrt{ab}$. Под корнем получается точный квадрат',
          `\\sqrt{a} \\cdot \\sqrt{b} = \\sqrt{ab} = \\sqrt{${d(a)} \\cdot ${d(b)}} = \\sqrt{${k * k}} = ${k}`,
        ),
      ],
      proverka: Math.sqrt(a) * Math.sqrt(b),
    };
  }),
  micro('P8-5-08', 'Логарифм с буквой', '\\log_a a^k = k', (r) => {
    const a = r.pick([2, 3, 5, 7]);
    const k = r.int(2, 6);
    return {
      uslovie: pri(`\\log_a a^{${k}}`, a),
      otvet: k,
      razbor: [
        shag(
          `Показатель выносим вперёд, а логарифм основания равен $1$: $\\log_a a^{k} = k \\log_a a = k$. Значение $a = ${a}$ на ответ не влияет`,
          `\\log_a a^{${k}} = ${k} \\cdot \\log_a a = ${k} \\cdot 1 = ${k}`,
        ),
      ],
      proverka: Math.log(a ** k) / Math.log(a),
    };
  }),
  micro('P8-5-09', 'Произведение степеней с буквой', 'a^m \\cdot a^n = a^{m+n}', (r) => {
    const a = r.pick([2, 3, 5, -2, -3, 0.5, 0.2, 1.5, -0.5]);
    const e = r.pick([1, 2, 3]);
    const m = r.int(2, 9);
    const n = r.int(1, 6);
    const k = m + n - e;
    if (k < 1) {
      return null;
    }
    const ans = round9(a ** e);
    if (!Number.isInteger(ans * 1000) || Math.abs(ans) > 1000) {
      return null;
    }
    const tex = `\\dfrac{a^{${m}} \\cdot a^{${n}}}{a^{${k}}}`;
    return {
      uslovie: pri(tex, a),
      otvet: ans,
      razbor: [
        shag(
          'Основания одинаковые: при умножении показатели складываем, при делении — вычитаем. Число подставляем только в итоговую степень',
          `${tex} = a^{${m} + ${n} - ${k}} = ${podstanovka(a, e, ans)}`,
        ),
      ],
      proverka: (a ** m * a ** n) / a ** k,
    };
  }),
  micro(
    'P8-5-10',
    'Сумма квадратов через сумму и произведение',
    'a^2 + b^2 = (a + b)^2 - 2ab',
    (r) => {
      const s = r.int(0, 1) === 0 ? r.int(2, 12) : tenth(r, 1.5, 9.9);
      const p = r.int(-20, 20);
      if (p === 0 || s * s - 4 * p < 0) {
        return null;
      }
      const ans = round9(s * s - 2 * p);
      return {
        uslovie: `Найдите значение выражения $a^2 + b^2$, если $a + b = ${d(s)}$ и $ab = ${d(p)}$.`,
        otvet: ans,
        razbor: [
          shag(
            'В квадрате суммы $(a + b)^2 = a^2 + 2ab + b^2$ есть нужная сумма квадратов и лишнее $2ab$ — вычитаем его: $a^2 + b^2 = (a + b)^2 - 2ab$. Сами $a$ и $b$ искать не нужно',
            `a^2 + b^2 = (a + b)^2 - 2ab = ${par(s)}^2 - 2 \\cdot ${par(p)} = ${d(round9(s * s))} ${p > 0 ? '-' : '+'} ${d(Math.abs(2 * p))} = ${d(ans)}`,
          ),
        ],
        proverka: s * s - 2 * p,
      };
    },
  ),
];
