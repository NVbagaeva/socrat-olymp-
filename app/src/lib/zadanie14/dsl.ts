/**
 * Короткая запись задач №14 в данных: ur(…) — уравнение с пунктами а
 * и б, rz(…) — разминка в формате части 1, v(…) — вопрос подсказки.
 */

import type { HintStep, Razminka14, Uravnenie14 } from './tipy';

export { ARC, otrezok, s, u, ua } from './ugol';
export type { Promezhutok } from './ugol';

export function ur(z: Omit<Uravnenie14, 'vid'>): Uravnenie14 {
  return { vid: 'uravnenie', ...z };
}

export function rz(z: Omit<Razminka14, 'vid'>): Razminka14 {
  return { vid: 'razminka', ...z };
}

/** Вопрос подсказки: верная кнопка — по номеру (с нуля). */
export function v(question: string, options: string[], correct: number, comment?: string): HintStep {
  return comment === undefined ? { question, options, correct } : { question, options, correct, comment };
}

/** Полуоткрытый промежуток: какие концы входят. */
export function promezhutok<T extends { vkl: [boolean, boolean] }>(p: T, vkl: [boolean, boolean]): T {
  return { ...p, vkl };
}

/* Функции для f(x) в данных: тригонометрия с котангенсом. */
export const { sin, cos, tan: tg, sqrt, PI } = Math;
export const ctg = (x: number): number => Math.cos(x) / Math.sin(x);
