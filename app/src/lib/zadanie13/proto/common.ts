/**
 * Общие куски прототипов: подсказки, шаги решения, проверка границ
 * «наибольшее / наименьшее целое».
 */

import { D, type Drob, type DrobInput } from '../drob';
import { TYPE_NAMES, type HintStep, type SolutionStep, type TypeCode } from '../types';

/** Перемешать варианты подсказки детерминированно и вернуть индекс верного. */
export function choice(
  question: string,
  right: string,
  wrong: string[],
  shift: number,
  comment?: string,
): HintStep {
  const all = [right, ...wrong];
  const k = ((shift % all.length) + all.length) % all.length;
  const options = [...all.slice(all.length - k), ...all.slice(0, all.length - k)];
  return { question, options, correct: options.indexOf(right), ...(comment ? { comment } : {}) };
}

const SIGN: Record<TypeCode, string> = {
  A: 'долг уменьшается на одну и ту же величину весь срок',
  B: 'путь долга задан, но не одной равномерной лесенкой',
  C: 'известны платежи, а долг по месяцам не задан',
  D: 'деньги копятся: вклад растёт, его пополняют или снимают',
};

/** Первый вопрос любой подсказки: какая это схема. Типы называются словами. */
export function hintType(type: TypeCode, shift: number): HintStep {
  const right = TYPE_NAMES[type];
  const wrong = (Object.keys(TYPE_NAMES) as TypeCode[])
    .filter((t) => t !== type)
    .map((t) => TYPE_NAMES[t]);
  return choice('Какая это схема?', right, wrong, shift, `Признак: ${SIGN[type]}.`);
}

export const hintChangeSum = (shift: number): HintStep =>
  choice(
    'Чему равна сумма столбца «Сумма изменения долга»?',
    '$S$ — сумме кредита',
    ['$S_{\\text{перепл}}$ — переплате', '$n \\cdot S$'],
    shift,
    'Долг уменьшился с $S$ до нуля, значит, все изменения вместе дают $S$.',
  );

export const hintOverpayFormula = (shift: number): HintStep =>
  choice(
    'Как найти переплату за весь срок?',
    '$S \\cdot \\dfrac{n+1}{2} \\cdot \\dfrac{r}{100}$',
    ['$S \\cdot \\dfrac{n}{2} \\cdot \\dfrac{r}{100}$', '$S \\cdot n \\cdot \\dfrac{r}{100}$'],
    shift,
    'Долги на начало: $S, \\dfrac{(n-1)S}{n}, \\dots, \\dfrac{S}{n}$ — их сумма $S \\cdot \\dfrac{n+1}{2}$.',
  );

export const hintK = (shift: number): HintStep =>
  choice(
    'Во сколько раз вырастает долг после начисления процентов?',
    '$k = 1 + \\dfrac{r}{100}$',
    ['$k = \\dfrac{r}{100}$', '$k = 1 - \\dfrac{r}{100}$'],
    shift,
    'Было 100 %, стало $(100 + r)$ %: умножаем на $1 + \\dfrac{r}{100}$.',
  );

/** Шаг решения. */
export const step = (
  title: string,
  text: string,
  formula?: string,
  table?: boolean,
): SolutionStep => ({
  title,
  text,
  ...(formula ? { formula } : {}),
  ...(table ? { table: true } : {}),
});

/** Число в KaTeX: «1\\,200\\,000», «4{,}55». */
export const tex = (x: DrobInput): string =>
  D(x)
    .toRu()
    .replace(/,(\d)/g, '{,}$1')
    .replace(/\u00a0/g, '\\,')
    .replace(/−/g, '-');

/**
 * Граница для «наибольшее целое S, при котором cond(S)»: cond верно для
 * ответа и неверно для следующего. Возвращает ответ или null.
 */
export function largestInt(cond: (s: number) => boolean, from: number, to: number): number | null {
  let best: number | null = null;
  for (let s = from; s <= to; s++) if (cond(s)) best = s;
  if (best === null || best === to) return null;
  for (let s = from; s <= best; s++) if (!cond(s) && s < best) return null; // условие должно быть монотонным
  return best;
}

export function smallestInt(cond: (s: number) => boolean, from: number, to: number): number | null {
  for (let s = from; s <= to; s++) {
    if (cond(s)) {
      if (s === from) return null;
      for (let t = s; t <= to; t++) if (!cond(t)) return null;
      return s;
    }
  }
  return null;
}

export const isNice = (x: Drob, decimals = 2): boolean =>
  x.isPositive() && x.isFiniteDecimal() && x.decimals() <= decimals;
