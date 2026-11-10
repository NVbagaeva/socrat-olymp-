/** Блок P8-4 · Формулы тригонометрии. */

import { gcd, nice, round9 } from '../../numbers';
import { shag } from '../../prototypes/common';
import { table } from '../../prototypes/trig-preobr';
import { coefRoot, d, deg, fn, rad } from '../../tex';
import type { Shag } from '../../types';
import type { PrepMicro } from '../types';
import { micro, naydi } from './common';

type F = 'sin' | 'cos' | 'tg';

function toRad(x: number): number {
  return (x * Math.PI) / 180;
}

function numeric(f: F, x: number): number {
  return f === 'sin' ? Math.sin(toRad(x)) : f === 'cos' ? Math.cos(toRad(x)) : Math.tan(toRad(x));
}

function angleTex(degrees: number, radians: boolean): string {
  if (!radians) {
    return deg(degrees);
  }
  const g = gcd(degrees, 180);
  return rad(degrees / g, 180 / g);
}

/* ── Табличные значения в решении ────────────────────────────── */

function near(x: number, y: number): boolean {
  return Math.abs(x - y) < 1e-9;
}

/** Табличное значение |v|·√r без знака: 1, ½, √3/2, √3, √3/3. */
function tabTex(av: number, r: number, cmd: string): string {
  if (r === 1) {
    return near(av, 1) ? '1' : `${cmd}{1}{2}`;
  }
  if (near(av, 1)) {
    return `\\sqrt{${r}}`;
  }
  return `${cmd}{\\sqrt{${r}}}{${near(av, 0.5) ? 2 : 3}}`;
}

/** Коэффициент c·√r перед функцией; единица — пусто. */
function koef(c: number, r: number): string {
  const s = coefRoot(c, r);
  return s === '1' ? '' : s;
}

/**
 * Выкладка «коэффициент · табличное значение = … = ответ»: c·√r·(|v|·√r),
 * корень на корень дают r. neg — минус впереди.
 */
function umnozhenie(c: number, r: number, av: number, ans: number, neg: boolean): string {
  const m = neg ? '-' : '';
  const k = koef(c, r);
  const tab = tabTex(av, r, '\\dfrac');
  const parts = [k === '' ? `${m}${tab}` : `${m}${k} \\cdot ${tab}`];
  if (r !== 1) {
    const den = near(av, 1) ? 1 : near(av, 0.5) ? 2 : 3;
    const top = c === 1 ? String(r) : `${c} \\cdot ${r}`;
    parts.push(den === 1 ? `${m}${top}` : `${m}\\dfrac{${top}}{${den}}`);
  }
  parts.push(d(ans));
  return parts.filter((p, i) => i === 0 || p !== parts[i - 1]).join(' = ');
}

/** Подпись про корни: √r · √r = r. */
function kornyNaKorni(r: number): string {
  return r === 1 ? '' : `, а $\\sqrt{${r}} \\cdot \\sqrt{${r}} = ${r}$`;
}

/**
 * Шаг «подставляем табличное значение»: c√r·f(A) = … = ответ. A — угол
 * в градусах (0 < A < 360), в выражении он записан в радианах, если
 * radians. Тупой угол сначала приводим к острому.
 */
function tablichnyy(f: F, c: number, A: number, radians: boolean, ans: number): Shag {
  const t = table(f, A);
  if (t === null) {
    throw new Error(`Нет табличного значения ${f} ${A}`);
  }
  const neg = t.v < 0;
  const av = Math.abs(t.v);
  const F = fn(f);
  const k = koef(c, t.r);
  const ref = A <= 90 ? A : A < 180 ? 180 - A : A < 270 ? A - 180 : 360 - A;
  const around = A < 180 ? `180^\\circ - x` : A < 270 ? `180^\\circ + x` : `360^\\circ - x`;
  const chain = [`${k}${F}${angleTex(A, radians)}`];
  const chto: string[] = [];
  if (radians) {
    chain.push(`${k}${F}${deg(A)}`);
    chto.push(`переходим к градусам: $${angleTex(A, true)} = ${deg(A)}$`);
  }
  if (ref !== A) {
    chain.push(`${neg ? '-' : ''}${k}${F}${deg(ref)}`);
    chto.push(`приводим к острому углу: $${F}(${around}) = ${neg ? '-' : ''}${F} x$`);
  }
  chain.push(umnozhenie(c, t.r, av, ans, neg));
  chto.push(
    `подставляем табличное значение $${F} ${deg(ref)} = ${tabTex(av, t.r, '\\frac')}$${kornyNaKorni(t.r)}`,
  );
  const text = chto.join('; ');
  return shag(`${text[0]?.toUpperCase() ?? ''}${text.slice(1)}`, chain.join(' = '));
}

/** Почему в формуле приведения через 180° такой знак: четверть угла. */
const PRIVEDENIE: Record<'sin' | 'cos', Record<'plus' | 'minus', string>> = {
  sin: {
    plus: 'угол в III четверти, где синус отрицателен',
    minus: 'угол во II четверти, где синус положителен',
  },
  cos: {
    plus: 'угол в III четверти, где косинус отрицателен',
    minus: 'угол во II четверти, где косинус отрицателен',
  },
};

export const FORMULY: PrepMicro[] = [
  micro(
    'P8-4-01',
    'Табличное значение',
    '\\sin 30^\\circ = \\frac{1}{2},\\ \\sin 45^\\circ = \\frac{\\sqrt2}{2},\\ \\sin 60^\\circ = \\frac{\\sqrt3}{2};\\ \\cos 30^\\circ = \\frac{\\sqrt3}{2},\\ \\cos 45^\\circ = \\frac{\\sqrt2}{2},\\ \\cos 60^\\circ = \\frac12;\\ \\operatorname{tg} 30^\\circ = \\frac{\\sqrt3}{3},\\ \\operatorname{tg} 45^\\circ = 1,\\ \\operatorname{tg} 60^\\circ = \\sqrt3',
    (r) => {
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
        razbor: [tablichnyy(f, c, x, radians, ans)],
        proverka: c * Math.sqrt(t.r) * numeric(f, x),
      };
    },
  ),
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
      razbor: [
        num === 1
          ? shag(
              `Угол $\\pi$ — это $180^\\circ$. Заменяем $\\pi$ на $180$ и делим на знаменатель $${den}$`,
              `\\dfrac{180}{${den}} = ${ans}`,
            )
          : shag(
              `Угол $\\pi$ — это $180^\\circ$. Заменяем $\\pi$ на $180$; удобнее сначала разделить $180$ на знаменатель $${den}$, потом умножить на $${num}$`,
              `\\dfrac{${num} \\cdot 180}{${den}} = ${num} \\cdot ${180 / den} = ${ans}`,
            ),
      ],
      proverka: ans,
    };
  }),
  micro(
    'P8-4-03',
    'Приведение через 180°',
    '\\sin(180^\\circ - x) = \\sin x,\\ \\sin(180^\\circ + x) = -\\sin x,\\ \\cos(180^\\circ \\pm x) = -\\cos x',
    (r) => {
      const x = r.int(1, 89);
      if ([30, 45, 60].includes(x)) {
        return null;
      }
      const f = r.pick(['sin', 'cos'] as const);
      const plus = r.int(0, 1) === 0;
      const angle = plus ? 180 + x : 180 - x;
      const sign = f === 'sin' && !plus ? '' : '-';
      const op = plus ? '+' : '-';
      return {
        uslovie: `Известно, что $${fn(f)}${deg(angle)} = ${sign}${fn(f)} x^\\circ$, где $0 < x < 90$. Найдите $x$.`,
        otvet: x,
        razbor: [
          shag(
            `Записываем угол как $180^\\circ ${op} ${deg(x)}$. Формула приведения $${fn(f)}(180^\\circ ${op} x) = ${sign}${fn(f)} x$: ${PRIVEDENIE[f][plus ? 'plus' : 'minus']}, а от $180^\\circ$ функция не меняется`,
            `${fn(f)}${deg(angle)} = ${fn(f)}(180^\\circ ${op} ${deg(x)}) = ${sign}${fn(f)}${deg(x)} \\;\\Rightarrow\\; x = ${x}`,
          ),
        ],
        proverka: x,
      };
    },
  ),
  micro(
    'P8-4-04',
    'Приведение через 90°',
    '\\sin(90^\\circ - x) = \\cos x,\\ \\cos(90^\\circ - x) = \\sin x',
    (r) => {
      const x = r.int(1, 89);
      if ([30, 45, 60].includes(x)) {
        return null;
      }
      const f = r.pick(['sin', 'cos'] as const);
      const other = f === 'sin' ? 'cos' : 'sin';
      return {
        uslovie: `Известно, что $${fn(f)}${deg(90 - x)} = ${fn(other)} x^\\circ$, где $0 < x < 90$. Найдите $x$.`,
        otvet: x,
        razbor: [
          shag(
            `Записываем угол как $90^\\circ - ${deg(x)}$. Формула приведения $${fn(f)}(90^\\circ - x) = ${fn(other)} x$: от $90^\\circ$ синус меняется на косинус и наоборот, а в I четверти знак плюс`,
            `${fn(f)}${deg(90 - x)} = ${fn(f)}(90^\\circ - ${deg(x)}) = ${fn(other)}${deg(x)} \\;\\Rightarrow\\; x = ${x}`,
          ),
        ],
        proverka: x,
      };
    },
  ),
  micro(
    'P8-4-05',
    'Период',
    '\\sin(x + 360^\\circ) = \\sin x,\\ \\cos(x + 360^\\circ) = \\cos x,\\ \\cos(-x) = \\cos x',
    (r) => {
      const x = r.int(1, 89);
      if ([30, 45, 60].includes(x)) {
        return null;
      }
      const f = r.pick(['sin', 'cos'] as const);
      const turns = r.pick([1, 1, 2]);
      const negative = f === 'cos' && r.int(0, 2) === 0;
      const angle = negative ? -(x + 360 * turns) : x + 360 * turns;
      const full = x + 360 * turns;
      const oboroty = turns === 1 ? '360^\\circ' : `${turns} \\cdot 360^\\circ`;
      return {
        uslovie: `Известно, что $${fn(f)}${deg(angle)} = ${fn(f)} x^\\circ$, где $0 < x < 90$. Найдите $x$.`,
        otvet: x,
        razbor: [
          shag(
            negative
              ? 'Косинус чётный — минус у угла убираем: $\\cos(-x) = \\cos x$. Полный оборот $360^\\circ$ значения не меняет, поэтому отбрасываем целые обороты'
              : `Полный оборот $360^\\circ$ значения не меняет: $${fn(f)}(x + 360^\\circ) = ${fn(f)} x$, поэтому отбрасываем целые обороты`,
            `${fn(f)}${deg(angle)} = ${negative ? `${fn(f)}${deg(full)} = ` : ''}${fn(f)}(${oboroty} + ${deg(x)}) = ${fn(f)}${deg(x)} \\;\\Rightarrow\\; x = ${x}`,
          ),
        ],
        proverka: x,
      };
    },
  ),
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
    const kk = koef(k, t.r);
    return {
      uslovie: naydi(tex),
      otvet: ans,
      razbor: [
        shag(
          `Выделяем синус двойного угла: $2\\sin x\\cos x = \\sin 2x$${kk === '' ? '' : `. Для этого записываем $${coef}$ как $${kk} \\cdot 2$`}`,
          kk === ''
            ? `${tex} = \\sin${deg(2 * x)}`
            : `${tex} = ${kk} \\cdot 2\\sin${deg(x)}\\cos${deg(x)} = ${kk}\\sin${deg(2 * x)}`,
        ),
        tablichnyy('sin', k, 2 * x, false, ans),
      ],
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
    const angle2 = angleTex(2 * x, radians);
    return {
      uslovie: naydi(tex),
      otvet: ans,
      razbor: [
        kk === ''
          ? shag(
              'Узнаём косинус двойного угла: $\\cos^2 x - \\sin^2 x = \\cos 2x$',
              `${tex} = \\cos${angle2}`,
            )
          : shag(
              `Выносим $${kk}$ за скобки — в скобках косинус двойного угла: $\\cos^2 x - \\sin^2 x = \\cos 2x$`,
              `${tex} = ${kk}(\\cos^2${angle} - \\sin^2${angle}) = ${kk}\\cos${angle2}`,
            ),
        tablichnyy('cos', k, 2 * x, radians, ans),
      ],
      proverka: k * Math.sqrt(t.r) * (Math.cos(toRad(x)) ** 2 - Math.sin(toRad(x)) ** 2),
    };
  }),
  micro(
    'P8-4-08',
    'Тангенсы дополнительных углов',
    '\\operatorname{tg} x \\cdot \\operatorname{tg}(90^\\circ - x) = 1',
    (r) => {
      const x = r.int(1, 44);
      if (x === 30) {
        return null;
      }
      const k = r.int(1, 12);
      const tex = `${k === 1 ? '' : k}\\operatorname{tg}${deg(x)} \\cdot \\operatorname{tg}${deg(90 - x)}`;
      const tgCtg = `\\operatorname{tg}${deg(x)} \\cdot \\operatorname{ctg}${deg(x)}`;
      return {
        uslovie: naydi(tex),
        otvet: k,
        razbor: [
          shag(
            `Углы $${deg(x)}$ и $${deg(90 - x)}$ в сумме дают $90^\\circ$, поэтому $\\operatorname{tg} ${deg(90 - x)} = \\operatorname{ctg} ${deg(x)}$. Тангенс и котангенс одного угла — взаимно обратные числа, их произведение равно $1$`,
            k === 1 ? `${tex} = ${tgCtg} = 1` : `${tex} = ${k}${tgCtg} = ${k} \\cdot 1 = ${k}`,
          ),
        ],
        proverka: k * Math.tan(toRad(x)) * Math.tan(toRad(90 - x)),
      };
    },
  ),
  micro(
    'P8-4-09',
    'Нечётность синуса и тангенса',
    '\\sin(-x) = -\\sin x,\\quad \\operatorname{tg}(-x) = -\\operatorname{tg} x',
    (r) => {
      const f = r.pick(['sin', 'tg'] as const);
      const x = r.pick([30, 45, 60]);
      const t = table(f, x);
      if (t === null) {
        return null;
      }
      const c = r.int(2, 12);
      const ans = round9(-c * t.v * t.r);
      if (!nice(ans, 1) || ans < -100) {
        return null;
      }
      const radians = r.int(0, 1) === 0;
      const angle = radians ? `-${angleTex(x, true)}` : `-${x}^\\circ`;
      const coef = coefRoot(c, t.r);
      const tex = `${coef === '1' ? '' : coef}${fn(f)}\\left(${angle}\\right)`;
      const k = koef(c, t.r);
      const chain = [tex, `-${k}${fn(f)}${angleTex(x, radians)}`];
      if (radians) {
        chain.push(`-${k}${fn(f)}${deg(x)}`);
      }
      chain.push(umnozhenie(c, t.r, t.v, ans, true));
      return {
        uslovie: naydi(tex),
        otvet: ans,
        razbor: [
          shag(
            `${f === 'sin' ? 'Синус' : 'Тангенс'} нечётный — минус выносим вперёд: $${fn(f)}(-x) = -${fn(f)} x$${
              radians ? `. Переходим к градусам: $${angleTex(x, true)} = ${deg(x)}$` : ''
            }. Подставляем табличное значение $${fn(f)} ${deg(x)} = ${tabTex(t.v, t.r, '\\frac')}$${kornyNaKorni(t.r)}`,
            chain.join(' = '),
          ),
        ],
        proverka: -c * Math.sqrt(t.r) * numeric(f, x),
      };
    },
  ),
  micro('P8-4-10', 'Основное тригонометрическое тождество', '\\sin^2 x + \\cos^2 x = 1', (r) => {
    const x = r.pick([13, 17, 22, 28, 34, 41, 52, 67, 71, 83]);
    const k = r.int(2, 12);
    const radians = r.int(0, 1) === 0;
    const angle = radians ? rad(1, r.pick([5, 7, 8, 9])) : deg(x);
    const kk = String(k);
    const second = r.int(0, 1) === 0;
    const tex = second
      ? `\\dfrac{${kk} - ${kk}\\sin^2${angle}}{\\cos^2${angle}}`
      : `${kk}\\sin^2${angle} + ${kk}\\cos^2${angle}`;
    const razbor = second
      ? shag(
          `В числителе выносим $${kk}$ за скобки. По основному тождеству $1 - \\sin^2 x = \\cos^2 x$, и $\\cos^2 x$ сокращается со знаменателем — значение угла не нужно`,
          `${tex} = \\dfrac{${kk}(1 - \\sin^2${angle})}{\\cos^2${angle}} = \\dfrac{${kk}\\cos^2${angle}}{\\cos^2${angle}} = ${kk}`,
        )
      : shag(
          `Выносим $${kk}$ за скобки — в скобках основное тождество $\\sin^2 x + \\cos^2 x = 1$, и значение угла не нужно`,
          `${tex} = ${kk}(\\sin^2${angle} + \\cos^2${angle}) = ${kk} \\cdot 1 = ${kk}`,
        );
    return { uslovie: naydi(tex), otvet: k, razbor: [razbor], proverka: k };
  }),
];
