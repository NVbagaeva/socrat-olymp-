/**
 * Общее для прототипов задания №5: чтение вероятностей, точная
 * арифметика с десятичными дробями и запись чисел в TeX.
 */

import { dec, num, type Params } from '../types';

/** Без округления: ответ обязан быть конечной десятичной дробью. */
export const tochno = (): null => null;

/** Вероятность из параметров, записанная числом от нуля до единицы. */
export function veroyatnost(p: Params, key: string): number {
  return num(p, key);
}

/** Отсечение хвоста плавающей запятой: 0,1 + 0,2 — это 0,3. */
export function tochnee(value: number): number {
  return Math.round(value * 1e9) / 1e9;
}

/** Десятичная дробь по-русски внутри формулы: `0{,}25`. */
export function tex(value: number): string {
  return dec(value).replace(',', '{,}');
}

/** Целое число с тонким пробелом между разрядами: `10\,000`. */
export function texInt(value: number): string {
  const s = String(Math.round(value));
  return s.length > 4 ? s.replace(/\B(?=(\d{3})+(?!\d))/g, '\\,') : s;
}

/** Число из 100 или 10 000 объектов: доля, умноженная на удобное число. */
export function shtuk(share: number, base: number): number {
  return Math.round(share * base);
}
