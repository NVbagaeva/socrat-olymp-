/**
 * Общие куски разборов задания №11: строка ответа, вопрос «что
 * обозначить за x», стандартные неверные варианты.
 */

import { d } from '../num';

/** Последняя строка разбора: «Ответ: 12.» */
export function otvet(x: number): string {
  return `**Ответ:** $${d(x)}$.`;
}

/** $…$ вокруг TeX. */
export function m(tex: string): string {
  return `$${tex}$`;
}

/** Проценты в TeX: 15\%. */
export function pct(x: number): string {
  return `${d(x)}\\%`;
}

/** Слова для «вдвое / втрое / вчетверо». */
export const VO_SKOLKO: Record<number, string> = {
  2: 'вдвое',
  3: 'втрое',
  4: 'вчетверо',
  5: 'в пять раз',
};
