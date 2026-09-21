/**
 * Числа и подписи в условиях задания №3.
 *
 * Условие набирается так, как его набирает задачник: десятичная
 * запятая, буквы вершин с нижним индексом, знак умножения не
 * пишется. Формулы набора KaTeX здесь не нужны: в условиях
 * стереометрии формул нет, есть только буквы и числа.
 */

import { subscript } from '../solid/figures';
import { type AnswerFormat } from './types';

/** Число в условии: 2,5 — с запятой, как в задачнике. */
export function ru(value: number): string {
  return String(value).replace('.', ',');
}

/**
 * Число в формуле разбора: 2{,}5 — запятая в группе.
 *
 * В TeX голая запятая между цифрами набирается как знак препинания и
 * получает отбивку справа: «2, 5» вместо «2,5». Группа эту отбивку
 * снимает. Та же запись, что в разборах №4 и №5.
 */
export function tex(value: number): string {
  return String(value).replace('.', '{,}');
}

/** Имя вершины или отрезка с индексами: AC1 → AC₁. */
export function letters(name: string): string {
  return subscript(name);
}

/** Отрезок по паре вершин: ['D', 'B1'] → DB₁. */
export function segment(pair: readonly [string, string]): string {
  return subscript(pair[0] + pair[1]);
}

/**
 * Имя вершины или отрезка в формуле: AC1 → AC_1.
 *
 * В тексте индекс стоит готовым знаком (AC₁), а в формуле его ставит
 * KaTeX: иначе индекс набирается кеглем основного текста и рядом с
 * курсивными буквами формулы смотрится чужим.
 */
export function texLetters(name: string): string {
  return name.replace(/(\d+)/g, '_{$1}');
}

/** Отрезок по паре вершин в формуле: ['D', 'B1'] → DB_{1}. */
export function texSegment(pair: readonly [string, string]): string {
  return texLetters(pair[0] + pair[1]);
}

/** Слагаемое под корнем: как оно записано, чему равно и с каким знаком. */
export interface ChlenKornya {
  /** Запись слагаемого в TeX без знака: «4^2», «65». */
  tex: string;
  /** Величина слагаемого, тоже без знака. */
  value: number;
  /** Знак перед слагаемым; у первого он не пишется. По умолчанию «+». */
  znak?: '+' | '-';
}

/**
 * Цепочка извлечения корня без перепрыгивания через шаг:
 * «√(65 + 4²) = √(65 + 16) = √81 = 9».
 *
 * Ступени выписываются только те, что что-то меняют: если слагаемые
 * уже числа, второй ступени нет; если слагаемое одно, нет третьей.
 * Так у ученика не остаётся числа, взявшегося ниоткуда, но и лишних
 * равенств не появляется.
 *
 * Корень обязан быть точным: иначе последней ступенью встало бы
 * округление, выданное за равенство. Неточный корень роняет сборку с
 * указанием, где он, — как и любая другая ошибка в данных банка.
 */
export function korenSummy(chleny: readonly ChlenKornya[]): string {
  const summa = round(chleny.reduce((s, c) => (c.znak === '-' ? s - c.value : s + c.value), 0));
  const znachenie = round(Math.sqrt(summa));
  if (!Number.isInteger(round(znachenie * 1000))) {
    throw new Error(`Корень из ${summa} не точный: ${znachenie}`);
  }
  /* Знак пишется перед слагаемым, у первого его нет: «b^2 - 18». */
  const podryad = (kak: (c: ChlenKornya) => string) =>
    chleny.map((c, i) => (i === 0 ? kak(c) : ` ${c.znak ?? '+'} ${kak(c)}`)).join('');
  const stupeni = [`\\sqrt{${podryad((c) => c.tex)}}`];
  const chislami = `\\sqrt{${podryad((c) => tex(c.value))}}`;
  if (chislami !== stupeni.at(-1)) {
    stupeni.push(chislami);
  }
  const odnim = `\\sqrt{${tex(summa)}}`;
  if (odnim !== stupeni.at(-1)) {
    stupeni.push(odnim);
  }
  stupeni.push(tex(znachenie));
  return stupeni.join(' = ');
}

/**
 * Ответ в том виде, в каком его вводят на ЕГЭ.
 * Целое — без запятой, десятичная дробь — с запятой.
 */
export function answerText(value: number, format: AnswerFormat): string {
  if (format === 'на-пи') {
    return ru(round(value));
  }
  return ru(round(value));
}

/** Убрать машинную погрешность: 79,99999999 — это 80. */
export function round(value: number): number {
  return Math.round(value * 1e9) / 1e9;
}

/**
 * Подходит ли число под формат ответа ЕГЭ: целое или конечная
 * десятичная дробь. Дробь считается конечной, если у неё не больше
 * трёх знаков после запятой и она точно представима.
 */
export function fitsFormat(value: number, format: AnswerFormat): boolean {
  const v = round(value);
  if (!Number.isFinite(v)) {
    return false;
  }
  if (format === 'целое') {
    return Number.isInteger(v);
  }
  /* Конечная десятичная: домножение на 1000 даёт целое. */
  return Number.isInteger(round(v * 1000));
}

/**
 * Слово «раз» в нужной форме: «в 2 раза», «в 5 раз», «в 1,5 раза».
 * Дробные множители всегда идут с «раза».
 */
export function razaWord(value: number): string {
  if (!Number.isInteger(value)) {
    return 'раза';
  }
  const tens = value % 100;
  const ones = value % 10;
  if (tens >= 12 && tens <= 14) {
    return 'раз';
  }
  return ones >= 2 && ones <= 4 ? 'раза' : 'раз';
}
