/**
 * Сборка подсказок-вопросов для прототипов №4 и №5.
 *
 * Шаг подсказки — вопрос и кнопки, одна верная (types.ts, HintStep).
 * Здесь две мелочи, которые иначе повторялись бы в каждом прототипе:
 *  - верная кнопка стоит не всегда первой: её место считается из
 *    текста вопроса и ответа, так что у одного варианта оно постоянно,
 *    а у разных вариантов разное;
 *  - неверные кнопки, которые на экране совпали бы с верной или друг
 *    с другом (у иных чисел «p·q» и «1 − p» равны), отбрасываются.
 *
 * Последний шаг каждой подсказки спрашивает сам ответ: автотест
 * (selftest.ts, problemyPodskazki) сверяет его верную кнопку с ответом
 * задачи.
 */

import { dec, type HintStep } from './types';

/** Видимый текст кнопки: формула без разметки и пробелов. */
function vid(stroka: string): string {
  return stroka.replace(/[$\s]/g, '').replace(/\{,\}/g, ',');
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
  const vidny = new Set([vid(verny)]);
  const drugie: string[] = [];
  for (const o of nevernye) {
    const v = vid(o);
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

/** Число в формуле: «$0{,}25$», целое — без запятой. */
export function chislo(value: number): string {
  return `$${dec(value).replace(',', '{,}')}$`;
}

/**
 * Последний шаг: сам ответ. Неверные числа — типичные ошибки этой
 * задачи; бессмысленные (не числа, не больше нуля, бесконечные дроби)
 * отбрасываются.
 */
export function otvetShag(
  question: string,
  otvet: number,
  oshibki: readonly number[],
  comment?: string,
): HintStep {
  /* Неверное число, которое не записать в бланк (бесконечная дробь,
     больше четырёх знаков), выдало бы себя видом, — его не берём. */
  const nevernye = oshibki
    .map((x) => Math.round(x * 1e9) / 1e9)
    .filter((x) => Number.isFinite(x) && x > 0 && Math.abs(x * 1e4 - Math.round(x * 1e4)) < 1e-6)
    .map((x) => chislo(x));
  return vopros(question, chislo(otvet), nevernye, comment);
}
