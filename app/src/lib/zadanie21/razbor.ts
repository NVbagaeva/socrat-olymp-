/**
 * Общие куски разбора задания «Наибольшее и наименьшее значение
 * функции»: тексты условий, подсказки, схема знаков на отрезке. Ими
 * пользуются и прототипы P01–P21 (prototypes.ts), и прототипы общего
 * вида P22 и дальше (prototypes22.ts).
 */

import type { Rng } from '@/lib/veroyatnost/generator';
import { chislo, num, otrezokTex } from './tex';
import type { Shema } from './shema';
import type { HintStep, Params } from './types';

export type Cel = 'max' | 'min';

export const N = (p: Params, k: string): number => Number(p[k]);
export const S = (p: Params, k: string): string => String(p[k]);

/* ── Тексты ──────────────────────────────────────────────────────── */

export const SLOVO_TOCHKI: Record<Cel, string> = { max: 'максимума', min: 'минимума' };
export const SLOVO_ZNACH: Record<Cel, string> = { max: 'наибольшее', min: 'наименьшее' };

export function uslovieTochki(cel: Cel, fn: string, promezhutok?: string): string {
  const prom = promezhutok === undefined ? '' : `, принадлежащую промежутку $${promezhutok}$`;
  return `Найдите точку ${SLOVO_TOCHKI[cel]} функции $${fn}$${prom}.`;
}

export function uslovieOtrezka(
  cel: Cel,
  fn: string,
  a: string,
  b: string,
  slovo = 'отрезке',
): string {
  return `Найдите ${SLOVO_ZNACH[cel]} значение функции $${fn}$ на ${slovo} $${otrezokTex(a, b)}$.`;
}

export function uslovieBezOtrezka(cel: Cel, fn: string): string {
  return `Найдите ${SLOVO_ZNACH[cel]} значение функции $${fn}$.`;
}

/** Варианты ответа подсказки: верный и три других, без повторов. */
export function varianty(
  verno: number,
  drugie: readonly number[],
): { options: string[]; correct: number } {
  const set: number[] = [verno];
  for (const d of drugie) if (!set.some((x) => Math.abs(x - d) < 1e-9)) set.push(d);
  const options = set.slice(0, 4).map(chislo);
  /* Верный — не всегда первый: место от самого ответа, без случайности. */
  const mesto = Math.abs(Math.round(verno * 7)) % options.length;
  const [v] = options.splice(0, 1);
  options.splice(mesto, 0, v as string);
  return { options, correct: mesto };
}

export const HINT_CHTO_TOCHKA: HintStep = {
  question: 'Что нужно записать в ответ?',
  options: ['Точку — значение $x$', 'Значение функции $y$'],
  correct: 0,
  comment: 'Спрашивают точку, поэтому в ответе $x$, а не $y$.',
};

export const HINT_CHTO_ZNACH: HintStep = {
  question: 'Что нужно записать в ответ?',
  options: ['Точку — значение $x$', 'Значение функции $y$'],
  correct: 1,
  comment: 'Спрашивают значение, поэтому в ответе $y$, а не $x$.',
};

/** Область поиска для самотеста у двух точек экстремума: искомая — внутри. */
export function oblastDvuh(
  p1: number,
  p2: number,
  answer: number,
  levaya = p1 - 3 * (p2 - p1),
  pravaya = p2 + 3 * (p2 - p1),
): [number, number] {
  return answer === p1 ? [levaya, p2] : [p1, pravaya];
}

/** Схема знаков на отрезке: концы — скобки, внутри — критические точки. */
export function otr(lo: string, vnutri: string[], hi: string, znaki: ('+' | '-')[]): Shema {
  return {
    tochki: [
      { podpis: lo, vid: 'konec' },
      ...vnutri.map((podpis) => ({ podpis, vid: 'krit' as const })),
      { podpis: hi, vid: 'konec' },
    ],
    znaki,
    luchLevo: false,
    luchPravo: false,
  };
}

/** Знаки вокруг единственной точки экстремума. */
export const zn = (cel: Cel): ('+' | '-')[] => (cel === 'max' ? ['+', '-'] : ['-', '+']);

/** «+5», «-3» или ничего: свободный член в конце формулы. */
export const plusC = (c: number): string => (c === 0 ? '' : c < 0 ? `-${num(-c)}` : `+${num(c)}`);

export const cel = (r: Rng): Cel => r.pick(['max', 'min'] as const);
export const znakOt = (r: Rng, a: number, b: number): number => r.pick([-1, 1]) * r.int(a, b);
