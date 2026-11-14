/** Блок P8-1 · Степени и корни. */

import { nice, round9 } from '../../numbers';
import { shag } from '../../prototypes/common';
import { root } from '../../tex';
import type { PrepMicro } from '../types';
import { micro, naydi, vDesyatichnuyu } from './common';

/** «квадратный корень», «корень третьей степени», «корень четвёртой степени». */
function korenStepeni(n: number): string {
  if (n === 2) return 'квадратный корень';
  return `корень ${n === 3 ? 'третьей' : 'четвёртой'} степени`;
}

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
      razbor: [
        shag(
          'Основания одинаковые — при умножении показатели складываются: $a^{m} \\cdot a^{n} = a^{m + n}$',
          `${a}^{${m}} \\cdot ${a}^{${n}} = ${a}^{${m} + ${n}} = ${a}^{${m + n}} = ${ans}`,
        ),
      ],
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
      razbor: [
        shag(
          'Основания одинаковые — при делении показатели вычитаются: $a^{m} : a^{n} = a^{m - n}$. Большие степени считать не нужно',
          `${a}^{${m}} : ${a}^{${n}} = ${a}^{${m} - ${n}} = ${e === 1 ? ans : `${a}^{${e}} = ${ans}`}`,
        ),
      ],
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
      razbor: [
        shag(
          'Степень возводим в степень — показатели перемножаются: $(a^{m})^{n} = a^{m \\cdot n}$',
          `(${a}^{${m}})^{${n}} = ${a}^{${m} \\cdot ${n}} = ${a}^{${m * n}} = ${ans}`,
        ),
      ],
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
      razbor: vDesyatichnuyu(
        n === 1
          ? 'Показатель $-1$ означает обратное число: $a^{-1} = \\dfrac{1}{a}$'
          : 'Отрицательный показатель означает дробь: $a^{-n} = \\dfrac{1}{a^{n}}$',
        n === 1 ? `${a}^{-1} = ` : `${a}^{-${n}} = \\dfrac{1}{${a}^{${n}}} = `,
        1,
        a ** n,
      ),
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
    let razbor;
    if (m === n) {
      razbor = shag(
        `Дробь в показателе сокращается: $\\frac{${m}}{${n}} = 1$, а первая степень числа равна самому числу`,
        `${a}^{${exp}} = ${a}^{1} = ${ans}`,
      );
    } else if (m === 1) {
      razbor = shag(
        n === 2
          ? 'Показатель $0{,}5 = \\frac{1}{2}$ — это квадратный корень: $a^{\\frac{1}{2}} = \\sqrt{a}$'
          : `Показатель $\\frac{1}{${n}}$ — это ${korenStepeni(n)}: $a^{\\frac{1}{n}} = \\sqrt[n]{a}$`,
        `${a}^{${exp}} = ${n === 2 ? `${a}^{\\frac{1}{2}} = ` : ''}${root(n, String(a))} = ${ans}`,
      );
    } else {
      razbor = shag(
        'Дробный показатель — это корень: $a^{\\frac{m}{n}} = (\\sqrt[n]{a})^{m}$. Сначала извлекаем корень, потом возводим в степень — так числа меньше',
        `${a}^{${exp}} = (${root(n, String(a))})^{${m}} = ${b}^{${m}} = ${ans}`,
      );
    }
    return {
      uslovie: naydi(`${a}^{${exp}}`),
      otvet: ans,
      razbor: [razbor],
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
      razbor: [
        shag(
          `Показатели одинаковые — перемножаем основания: $a^{n} \\cdot b^{n} = (ab)^{n}$. Произведение $${a} \\cdot ${b} = ${a * b}$ — круглое число, его степень считать легко`,
          `${a}^{${n}} \\cdot ${b}^{${n}} = (${a} \\cdot ${b})^{${n}} = ${a * b}^{${n}} = ${ans}`,
        ),
      ],
      proverka: a ** n * b ** n,
    };
  }),
  micro(
    'P8-1-07',
    'Произведение и частное корней',
    '\\sqrt{a} \\cdot \\sqrt{b} = \\sqrt{ab},\\quad \\dfrac{\\sqrt{a}}{\\sqrt{b}} = \\sqrt{\\dfrac{a}{b}}',
    (r) => {
      const k = r.int(2, 12);
      const a = r.pick([2, 3, 5, 6, 7, 8, 10, 12, 18, 20]);
      const quotient = r.int(0, 1) === 0;
      if (quotient) {
        const b = a;
        const top = a * k * k;
        return {
          uslovie: naydi(`\\dfrac{\\sqrt{${top}}}{\\sqrt{${b}}}`),
          otvet: k,
          razbor: [
            shag(
              'Частное корней — корень из частного: $\\dfrac{\\sqrt{a}}{\\sqrt{b}} = \\sqrt{\\dfrac{a}{b}}$. Под корнем делится нацело и получается точный квадрат',
              `\\dfrac{\\sqrt{${top}}}{\\sqrt{${b}}} = \\sqrt{\\dfrac{${top}}{${b}}} = \\sqrt{${k * k}} = ${k}`,
            ),
          ],
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
        razbor: [
          shag(
            'Произведение корней — корень из произведения: $\\sqrt{a} \\cdot \\sqrt{b} = \\sqrt{ab}$. Под корнем получается точный квадрат',
            `\\sqrt{${a}} \\cdot \\sqrt{${b}} = \\sqrt{${a} \\cdot ${b}} = \\sqrt{${a * b}} = ${k}`,
          ),
        ],
        proverka: Math.sqrt(a) * Math.sqrt(b),
      };
    },
  ),
  micro('P8-1-08', 'Корень из степени', '\\sqrt[n]{a^{nk}} = a^k', (r) => {
    const a = r.pick([2, 3, 5, 7, 10]);
    const n = r.pick([2, 3, 4]);
    const k = r.pick([1, 2]);
    const ans = a ** k;
    if (ans > 100 || a ** (n * k) > 100000) {
      return null;
    }
    const inner = k === 1 && r.int(0, 1) === 0 ? String(a ** n) : `${a}^{${n * k}}`;
    const kStepeni = korenStepeni(n);
    return {
      uslovie: naydi(root(n, inner)),
      otvet: ans,
      razbor: [
        inner === String(a ** n)
          ? shag(
              `Записываем $${a ** n}$ как степень: $${a ** n} = ${a}^{${n}}$. ${kStepeni[0]?.toUpperCase() ?? ''}${kStepeni.slice(1)} снимает ${n === 2 ? 'квадрат' : n === 3 ? 'куб' : 'четвёртую степень'}: $${root(n, `a^{${n}}`)} = a$ при $a > 0$`,
              `${root(n, inner)} = ${root(n, `${a}^{${n}}`)} = ${ans}`,
            )
          : shag(
              'Корень из степени — показатель делим на степень корня: $\\sqrt[n]{a^{nk}} = a^{k}$',
              `${root(n, inner)} = ${a}^{${n * k} : ${n}} = ${k === 1 ? ans : `${a}^{${k}} = ${ans}`}`,
            ),
      ],
      proverka: Math.pow(a ** (n * k), 1 / n),
    };
  }),
  micro(
    'P8-1-09',
    'Степень дроби',
    '\\left(\\dfrac{a}{b}\\right)^n = \\dfrac{a^n}{b^n},\\quad \\left(\\dfrac{a}{b}\\right)^{-n} = \\left(\\dfrac{b}{a}\\right)^n',
    (r) => {
      const [p, q] = r.pick([
        [1, 2],
        [3, 2],
        [1, 4],
        [3, 4],
        [1, 5],
        [2, 5],
        [3, 5],
        [5, 2],
      ] as const);
      const n = r.pick([2, 3, -2, -3]);
      const k = Math.abs(n);
      const ans = round9((p / q) ** n);
      if (!nice(ans, 3) || ans > 1000) {
        return null;
      }
      const tex = `\\left(\\dfrac{${p}}{${q}}\\right)^{${n}}`;
      /* Дробь, которая возводится в степень k: после разворота — q/p. */
      const [top, bottom] = n > 0 ? [p, q] : [q, p];
      const vStepen =
        bottom === 1
          ? `${top}^{${k}} = `
          : top === 1
            ? `\\dfrac{1}{${bottom}^{${k}}} = `
            : `\\dfrac{${top}^{${k}}}{${bottom}^{${k}}} = `;
      const razbor =
        n > 0
          ? vDesyatichnuyu(
              'Дробь возводим в степень — числитель и знаменатель по отдельности: $\\left(\\dfrac{a}{b}\\right)^{n} = \\dfrac{a^{n}}{b^{n}}$',
              `${tex} = ${vStepen}`,
              top ** k,
              bottom ** k,
            )
          : vDesyatichnuyu(
              `Отрицательный показатель переворачивает дробь: $\\left(\\dfrac{a}{b}\\right)^{-n} = \\left(\\dfrac{b}{a}\\right)^{n}$. ${
                bottom === 1
                  ? `Перевёрнутая дробь $\\dfrac{${top}}{1}$ — это просто $${top}$`
                  : 'Дальше возводим в степень числитель и знаменатель по отдельности'
              }`,
              `${tex} = ${bottom === 1 ? '' : `\\left(\\dfrac{${top}}{${bottom}}\\right)^{${k}} = `}${vStepen}`,
              top ** k,
              bottom ** k,
            );
      return { uslovie: naydi(tex), otvet: ans, razbor, proverka: (p / q) ** n };
    },
  ),
  micro('P8-1-10', 'Вынесение степени за скобки', 'a^{n+k} + a^n = a^n(a^k + 1)', (r) => {
    const a = r.pick([2, 3, 5]);
    const n = r.int(3, 9);
    const k = r.int(1, 3);
    const minus = r.int(0, 1) === 0;
    const sign = minus ? '-' : '+';
    const ans = minus ? a ** k - 1 : a ** k + 1;
    const tex = `\\dfrac{${a}^{${n + k}} ${sign} ${a}^{${n}}}{${a}^{${n}}}`;
    const ak = k === 1 ? String(a) : `${a}^{${k}}`;
    return {
      uslovie: naydi(tex),
      otvet: ans,
      razbor: [
        shag(
          `Выносим за скобки меньшую степень $${a}^{${n}}$, ведь $a^{n + k} = a^{n} \\cdot a^{k}$: $a^{n + k} ${sign} a^{n} = a^{n}(a^{k} ${sign} 1)$. Она сокращается со знаменателем — большие степени считать не нужно`,
          `${tex} = \\dfrac{${a}^{${n}}(${ak} ${sign} 1)}{${a}^{${n}}} = ${k === 1 ? '' : `${ak} ${sign} 1 = `}${a ** k} ${sign} 1 = ${ans}`,
        ),
      ],
      proverka: (a ** (n + k) + (minus ? -1 : 1) * a ** n) / a ** n,
    };
  }),
];
