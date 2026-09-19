/** Блок P8-4 · Формулы тригонометрии. */

import { gcd, nice, round9 } from '../../numbers';
import { coefRoot, d, deg, fn, rad } from '../../tex';
import { table } from '../../prototypes/trig-preobr';
import type { PrepMicro } from '../types';
import { micro, naydi } from './common';

function toRad(x: number): number {
  return (x * Math.PI) / 180;
}

function numeric(f: 'sin' | 'cos' | 'tg', x: number): number {
  return f === 'sin' ? Math.sin(toRad(x)) : f === 'cos' ? Math.cos(toRad(x)) : Math.tan(toRad(x));
}

function angleTex(degrees: number, radians: boolean): string {
  if (!radians) {
    return deg(degrees);
  }
  const g = gcd(degrees, 180);
  return rad(degrees / g, 180 / g);
}

export const FORMULY: PrepMicro[] = [
  micro('P8-4-01', 'Табличное значение', '\\sin 30^\\circ = \\frac{1}{2},\\ \\sin 45^\\circ = \\frac{\\sqrt2}{2},\\ \\sin 60^\\circ = \\frac{\\sqrt3}{2};\\ \\cos 30^\\circ = \\frac{\\sqrt3}{2},\\ \\cos 45^\\circ = \\frac{\\sqrt2}{2},\\ \\cos 60^\\circ = \\frac12;\\ \\operatorname{tg} 30^\\circ = \\frac{\\sqrt3}{3},\\ \\operatorname{tg} 45^\\circ = 1,\\ \\operatorname{tg} 60^\\circ = \\sqrt3', (r) => {
    const f = r.pick(['sin', 'cos', 'tg'] as const);
    const x = r.pick([30, 45, 60]);
    const t = table(f, x);
    if (t === null) {
      return null;
    }
    const c = r.int(2, 12);
    const ans = round9(c * t.v * t.r);
    if (!nice(ans, 1) || ans > 100) {
      return null;
    }
    const radians = r.int(0, 1) === 0;
    const coef = coefRoot(c, t.r);
    const tex = `${coef === '1' ? '' : coef}${fn(f)}${angleTex(x, radians)}`;
    return {
      uslovie: naydi(tex),
      otvet: ans,
      razbor: `$${fn(f)}${angleTex(x, radians)} = ${t.r === 1 ? (t.v === 1 ? '1' : '\\frac{1}{2}') : t.v === 1 ? `\\sqrt{${t.r}}` : `\\frac{\\sqrt{${t.r}}}{${t.v === 0.5 ? 2 : 3}}`}$, поэтому $${tex} = ${d(ans)}$`,
      proverka: c * Math.sqrt(t.r) * numeric(f, x),
    };
  }),
  micro('P8-4-02', 'Радианы в градусы', '\\pi \\text{ рад} = 180^\\circ', (r) => {
    const den = r.pick([2, 3, 4, 6, 12]);
    const num = r.int(1, 2 * den - 1);
    if (gcd(num, den) !== 1) {
      return null;
    }
    const ans = (180 * num) / den;
    return {
      uslovie: `Переведите угол $${rad(num, den)}$ в градусы. В ответе укажите число градусов.`,
      otvet: ans,
      razbor: `$${rad(num, den)} = \\dfrac{${num} \\cdot 180^\\circ}{${den}} = ${ans}^\\circ$`,
      proverka: ans,
    };
  }),
  micro('P8-4-03', 'Приведение через 180°', '\\sin(180^\\circ - x) = \\sin x,\\ \\sin(180^\\circ + x) = -\\sin x,\\ \\cos(180^\\circ \\pm x) = -\\cos x', (r) => {
    const x = r.int(1, 89);
    if ([30, 45, 60].includes(x)) {
      return null;
    }
    const f = r.pick(['sin', 'cos'] as const);
    const plus = r.int(0, 1) === 0;
    const angle = plus ? 180 + x : 180 - x;
    const sign = f === 'sin' && !plus ? '' : '-';
    return {
      uslovie: `Известно, что $${fn(f)}${deg(angle)} = ${sign}${fn(f)} x^\\circ$, где $0 < x < 90$. Найдите $x$.`,
      otvet: x,
      razbor: `$${fn(f)}${deg(angle)} = ${fn(f)}(${plus ? '180^\\circ + ' : '180^\\circ - '}${deg(x)}) = ${sign}${fn(f)}${deg(x)}$, поэтому $x = ${x}$`,
      proverka: x,
    };
  }),
  micro('P8-4-04', 'Приведение через 90°', '\\sin(90^\\circ - x) = \\cos x,\\ \\cos(90^\\circ - x) = \\sin x', (r) => {
    const x = r.int(1, 89);
    if ([30, 45, 60].includes(x)) {
      return null;
    }
    const f = r.pick(['sin', 'cos'] as const);
    const other = f === 'sin' ? 'cos' : 'sin';
    return {
      uslovie: `Известно, что $${fn(f)}${deg(90 - x)} = ${fn(other)} x^\\circ$, где $0 < x < 90$. Найдите $x$.`,
      otvet: x,
      razbor: `$${fn(f)}${deg(90 - x)} = ${fn(f)}(90^\\circ - ${deg(x)}) = ${fn(other)}${deg(x)}$, поэтому $x = ${x}$`,
      proverka: x,
    };
  }),
  micro('P8-4-05', 'Период', '\\sin(x + 360^\\circ) = \\sin x,\\ \\cos(x + 360^\\circ) = \\cos x,\\ \\cos(-x) = \\cos x', (r) => {
    const x = r.int(1, 89);
    if ([30, 45, 60].includes(x)) {
      return null;
    }
    const f = r.pick(['sin', 'cos'] as const);
    const turns = r.pick([1, 1, 2]);
    const negative = f === 'cos' && r.int(0, 2) === 0;
    const angle = negative ? -(x + 360 * turns) : x + 360 * turns;
    return {
      uslovie: `Известно, что $${fn(f)}${deg(angle)} = ${fn(f)} x^\\circ$, где $0 < x < 90$. Найдите $x$.`,
      otvet: x,
      razbor: `$${fn(f)}${deg(angle)} = ${fn(f)}${deg(x)}$: ${negative ? 'косинус чётный, а ' : ''}полный оборот $360^\\circ$ значения не меняет; $x = ${x}$`,
      proverka: x,
    };
  }),
  micro('P8-4-06', 'Синус двойного угла', '\\sin 2x = 2\\sin x\\cos x', (r) => {
    const x = r.pick([15, 75, 105, 165, 30, 60]);
    const t = table('sin', 2 * x);
    if (t === null || t.v === 0) {
      return null;
    }
    const k = r.int(1, 10);
    const ans = round9(k * t.v * t.r);
    if (!nice(ans, 1)) {
      return null;
    }
    const coef = coefRoot(2 * k, t.r);
    const tex = `${coef}\\sin${deg(x)} \\cdot \\cos${deg(x)}`;
    return {
      uslovie: naydi(tex),
      otvet: ans,
      razbor: `$2\\sin${deg(x)}\\cos${deg(x)} = \\sin${deg(2 * x)}$, поэтому $${tex} = ${d(ans)}$`,
      proverka: 2 * k * Math.sqrt(t.r) * Math.sin(toRad(x)) * Math.cos(toRad(x)),
    };
  }),
  micro('P8-4-07', 'Косинус двойного угла', '\\cos 2x = \\cos^2 x - \\sin^2 x', (r) => {
    const x = r.pick([30, 60, 120, 150, 15, 75]);
    const t = table('cos', 2 * x);
    if (t === null || t.v === 0) {
      return null;
    }
    const k = r.int(1, 9);
    const ans = round9(k * t.v * t.r);
    if (!nice(ans, 1)) {
      return null;
    }
    const radians = r.int(0, 1) === 0 && [30, 60, 120, 150].includes(x);
    const angle = angleTex(x, radians);
    const coef = coefRoot(k, t.r);
    const kk = coef === '1' ? '' : coef;
    const tex = `${kk}\\cos^2${angle} - ${kk}\\sin^2${angle}`;
    return {
      uslovie: naydi(tex),
      otvet: ans,
      razbor: `$\\cos^2${angle} - \\sin^2${angle} = \\cos${angleTex(2 * x, radians)}$, поэтому $${tex} = ${d(ans)}$`,
      proverka: k * Math.sqrt(t.r) * (Math.cos(toRad(x)) ** 2 - Math.sin(toRad(x)) ** 2),
    };
  }),
  micro('P8-4-08', 'Тангенсы дополнительных углов', '\\operatorname{tg} x \\cdot \\operatorname{tg}(90^\\circ - x) = 1', (r) => {
    const x = r.int(1, 44);
    if (x === 30) {
      return null;
    }
    const k = r.int(1, 12);
    const tex = `${k === 1 ? '' : k}\\operatorname{tg}${deg(x)} \\cdot \\operatorname{tg}${deg(90 - x)}`;
    return {
      uslovie: naydi(tex),
      otvet: k,
      razbor: `$\\operatorname{tg}${deg(90 - x)} = \\operatorname{ctg}${deg(x)}$, произведение равно $1$, поэтому $${tex} = ${k}$`,
      proverka: k * Math.tan(toRad(x)) * Math.tan(toRad(90 - x)),
    };
  }),
];
