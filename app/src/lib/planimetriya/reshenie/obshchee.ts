/**
 * Общие куски решений: градусы и числа в TeX, шаг, вопрос подсказки,
 * сверка с рисунком, сокращение «с умом» (то же, что в №11:
 * lib/zadanie11/proporciya/sokrashchenie.ts — второй копии нет).
 */

import { sokratit } from '../../zadanie11/proporciya/sokrashchenie';
import type { Sokr, ShagResheniya, VoprosPodskazki } from './types';

/** Число в TeX: десятичная запятая. */
export function n(x: number): string {
  const r = Math.round(x * 1e6) / 1e6;
  return String(r).replace('.', '{,}').replace('-', '-');
}

/** Градусы в TeX. */
export const g = (x: number) => `${n(x)}^\\circ`;

/**
 * Доля угла total : k в TeX. Делится нацело или до тысячных — числом,
 * иначе дробью: «7,333333°» в выкладке школьнику не прочитать.
 */
export function gDolya(total: number, k: number): string {
  const x = total / k;
  return Math.abs(x * 1000 - Math.round(x * 1000)) < 1e-9 ? g(x) : `\\dfrac{${g(total)}}{${k}}`;
}

export function shag(
  zagolovok: string,
  tekst: string | string[],
  formuly?: string[],
  sloy?: number,
  sokrashchenie?: Sokr[],
): ShagResheniya {
  return {
    zagolovok,
    tekst: Array.isArray(tekst) ? tekst : [tekst],
    ...(formuly === undefined ? {} : { formuly }),
    ...(sloy === undefined ? {} : { sloy }),
    ...(sokrashchenie === undefined || sokrashchenie.length === 0 ? {} : { sokrashchenie }),
  };
}

export function vopros(
  tekst: string,
  varianty: string[],
  poyasnenie: string,
  sloy?: number,
  verno = 0,
): VoprosPodskazki {
  /* На некоторых числах неверный вариант совпадает с верным или с
     другим неверным — одинаковые кнопки схлопываются, верная остаётся. */
  const pravilnyy = varianty[verno] ?? '';
  const knopki = varianty.filter((v, i) =>
    v === pravilnyy ? i === verno : varianty.indexOf(v) === i,
  );
  return {
    vopros: tekst,
    knopki,
    verno: knopki.indexOf(pravilnyy),
    poyasnenie,
    ...(sloy === undefined ? {} : { sloy }),
  };
}

/**
 * Факт шага: кнопка «Показать свойство» под вопросом. id — из реестра
 * фактов справочника, null — шаг без факта. vNashey — тот же факт на
 * буквах этой задачи (без ответа шага), vvod — фраза перед вопросом,
 * которой вводится новая точка.
 */
export function f(
  v: VoprosPodskazki,
  fakt: string | null,
  vNashey?: string,
  vvod?: string,
): VoprosPodskazki {
  return {
    ...v,
    fakt,
    ...(vNashey === undefined ? {} : { vNashey }),
    ...(vvod === undefined ? {} : { vvod }),
  };
}

/** Факты шага решения: кнопки «Показать свойство» под шагом. */
export function sf(s: ShagResheniya, fakty: readonly string[]): ShagResheniya {
  return { ...s, fakty };
}

/** Коэффициент при x: единицу не пишут — «x», «3x». */
export const kx = (k: number) => (k === 1 ? 'x' : `${k}x`);

/** Какой угол по виду: острый, прямой, тупой. */
export function vid(u: number): string {
  return u < 90 - 1e-9 ? 'острый' : u > 90 + 1e-9 ? 'тупой' : 'прямой';
}

/** Сверка угла с рисунком. */
export function sverkaUgla(imya: string, u: number): string {
  const sravnenie =
    u < 90 - 1e-9
      ? `ответ $${g(u)}$ меньше $90^\\circ$`
      : u > 90 + 1e-9
        ? `ответ $${g(u)}$ больше $90^\\circ$`
        : `ответ $${g(u)}$`;
  return `Сверяем с рисунком: угол ${imya} на чертеже ${vid(u)}, ${sravnenie} — сходится.`;
}

/** Сверка длины: искомое меньше (или больше) известного отрезка. */
export function sverkaDliny(
  chto: string,
  x: number,
  sChem: string,
  y: number,
  pochemu: string,
): string {
  const znak = x < y ? '<' : '>';
  return `Сверяем с рисунком: ${chto} ${x < y ? 'короче' : 'длиннее'}, чем ${sChem} (${pochemu}): $${n(x)}${znak}${n(y)}$ — сходится.`;
}

/**
 * Сокращение «с умом» для x = (ch₀·ch₁·…)/zn: шаги с признаками
 * делимости и итог. Нецелые числа — без сокращения.
 */
export function sokr(ch: number[], zn: number, x: string): { shagi: Sokr[]; itog: number } {
  const s = sokratit(ch, zn, x);
  return { shagi: s.shagi.map((sh) => ({ tekst: sh.tekst, tex: sh.tex })), itog: s.itog };
}

/** Перемешать варианты не нужно: порядок задаёт тренажёр. Здесь — подписи градусов. */
export const variantyGradusov = (...x: number[]) => x.map((u) => `$${g(u)}$`);
