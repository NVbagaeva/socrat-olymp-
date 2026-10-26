/**
 * Подсказки-вопросы прототипов №3: ход решения кнопками.
 *
 * Шаг подсказки — вопрос и кнопки, одна верная (types.ts, HintStep).
 * Подсказка ведёт по решению — какой треугольник взять, какое число
 * найти первым, какую формулу применить, — но само число ответа не
 * называет: его ученик считает сам. Автотест (selftest.ts,
 * problemyPodskazki) проверяет кнопки и ищет число ответа во всех
 * шагах.
 *
 * Здесь две мелочи, которые иначе повторялись бы в каждом прототипе
 * (как у №4 и №5, lib/veroyatnost/podskazka.ts):
 *  - верная кнопка стоит не всегда первой: её место считается из
 *    текста вопроса и ответа, так что у одного варианта оно постоянно,
 *    а у разных вариантов разное;
 *  - неверные кнопки, которые на экране совпали бы с верной или друг
 *    с другом, отбрасываются.
 */

import { ru } from './format';
import { type HintStep } from './types';

/** Видимый текст кнопки: без разметки формул и пробелов. */
export function bezRazmetki(stroka: string): string {
  return stroka
    .replace(/\{,\}/g, ',')
    .replace(/\\(?:dfrac|tfrac|frac|sqrt|cdot|pi|circ|text|quad|,|;|!)/g, ' ')
    .replace(/[${}\\\s]/g, '');
}

/** Устойчивый номер места из строки: одно и то же для одного варианта. */
function mesto(klyuch: string, dlina: number): number {
  let h = 0;
  for (const ch of klyuch) {
    h = (Math.imul(h, 31) + ch.charCodeAt(0)) >>> 0;
  }
  return h % dlina;
}

/**
 * Шаг-вопрос: верная кнопка и до трёх неверных. Неверные, которые на
 * экране совпали бы с верной или друг с другом, отбрасываются.
 */
export function vopros(
  question: string,
  verny: string,
  nevernye: readonly string[],
  comment?: string,
): HintStep {
  const vidny = new Set([bezRazmetki(verny)]);
  const drugie: string[] = [];
  for (const o of nevernye) {
    const v = bezRazmetki(o);
    if (v !== '' && !vidny.has(v) && drugie.length < 3) {
      vidny.add(v);
      drugie.push(o);
    }
  }
  const correct = mesto(question + verny, drugie.length + 1);
  const options = [...drugie];
  options.splice(correct, 0, verny);
  return { question, options, correct, ...(comment === undefined ? {} : { comment }) };
}

/** Число в формуле: «$2{,}5$», целое — без запятой. */
export function chislo(value: number): string {
  return `$${tex(value)}$`;
}

/** Число для вставки внутрь формулы: «2{,}5». */
export function tex(value: number): string {
  return ru(Math.round(value * 1e9) / 1e9).replace(',', '{,}');
}

/**
 * Неверные числа рядом с верным: типичные промахи счёта (вдвое больше
 * и меньше, ±1) — без совпадений с верным и без неположительных.
 */
export function ryadom(verno: number, ...eshche: number[]): number[] {
  const out: number[] = [];
  for (const x of [...eshche, verno * 2, verno / 2, verno + 1, verno - 1]) {
    const r = Math.round(x * 1e9) / 1e9;
    if (r > 0 && Math.abs(r - verno) > 1e-9 && !out.includes(r)) {
      out.push(r);
    }
  }
  return out;
}

/** Убрать из неверных чисел запретные: ответ задачи и верное число шага. */
export function krome(spisok: readonly number[], ...zapret: number[]): number[] {
  return spisok.filter((x) => zapret.every((z) => Math.abs(x - z) > 1e-9));
}

/** Неверные числа кнопками: без ответа задачи и без верного числа. */
export function chisla(spisok: readonly number[], ...zapret: number[]): string[] {
  return krome(spisok, ...zapret)
    .filter((x) => x > 0)
    .map(chislo);
}

