/**
 * Тип генератора аналогов задания №10 и форматирование чисел условия.
 */

import type { Rng } from '../../vychisleniya/rng';
import { d, txt } from '../../zadanie11/num';
import type { Params } from '../types';

export interface Syuzhet {
  /** Ключ сюжета внутри прототипа: «samokat». */
  key: string;
  /** Короткая метка для галереи: «электросамокат». */
  plot: string;
  /** Современный сюжет для подростков. */
  modern: boolean;
  text(p: Params): string;
  /** Постоянные параметры сюжета (форма вопроса, напряжение сети…). */
  params?: Params;
}

export interface GeneratorAnalogov {
  syuzhety: Syuzhet[];
  /** Параметры по сюжету; null — кандидат не подошёл. */
  gen(r: Rng, s: Syuzhet): Params | null;
  /** Правдоподобность ответа и данных (диапазоны величин). */
  fizika(p: Params, answer: number): boolean;
  /** Своя проверка вида ответа (по умолчанию — положительный, ≤ 3 знаков). */
  okOtvet?(x: number): boolean;
}

/** Число для текста условия: 0,5; 1500; −2. */
export function T(x: number | string | undefined): string {
  return txt(Number(x));
}

/** Число в TeX: 0{,}5. */
export function M(x: number | string | undefined): string {
  return d(Number(x));
}
