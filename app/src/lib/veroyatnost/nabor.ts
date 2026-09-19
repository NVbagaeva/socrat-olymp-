/**
 * Набор разбора на сборке: формулы KaTeX и закрытая строка для браузера.
 *
 * Здесь единственное место, где разбор заданий №4 и №5 встречается с
 * KaTeX. Модуль импортируют страницы (они серверные) и автотест, а не
 * клиентские компоненты: те получают уже набранный HTML. Формат
 * разбора — в razbor.ts.
 *
 * Шаг банка хранит выкладку в поле `formula` в TeX (см. Step в
 * types.ts). Из неё получаются три вида: сам TeX для печатного листа,
 * вёрстка KaTeX для карточки и слова для alt. Ответ в конце последней
 * формулы выделяется жирным здесь же.
 */

import { katex } from '../graph/katex';
import { texPlain } from './model';
import type { Pryamaya } from './pryamaya';
import type { Razbor, RazborShag } from './razbor';
import { sealText } from './secret';
import type { Step } from './types';

/**
 * Ответ в конце последней формулы — жирным: `= 0{,}25` → `= \mathbf{0{,}25}`.
 * Берётся хвост после последнего знака отношения верхнего уровня
 * (=, ≈, ≥): внутри дробей и скобок знаки не ищутся.
 */
export function vydelitOtvet(formula: string): string {
  let glubina = 0;
  let poz = -1;
  let dlina = 0;
  for (let i = 0; i < formula.length; i += 1) {
    const ch = formula[i];
    if (ch === '{' || ch === '(') {
      glubina += 1;
    } else if (ch === '}' || ch === ')') {
      glubina -= 1;
    } else if (glubina === 0) {
      if (ch === '=') {
        poz = i;
        dlina = 1;
      } else if (formula.startsWith('\\approx', i) || formula.startsWith('\\ge', i)) {
        poz = i;
        dlina = formula.startsWith('\\approx', i) ? 7 : 3;
      }
    }
  }
  if (poz < 0) {
    return formula;
  }
  const hvost = formula.slice(poz + dlina).trim();
  if (hvost === '' || hvost.includes('\\mathbf')) {
    return formula;
  }
  return `${formula.slice(0, poz + dlina)} \\mathbf{${hvost}}`;
}

/**
 * Формула кусками, по которым её можно переносить на новую строку:
 * перед каждым знаком отношения верхнего уровня и после `,\quad`.
 * KaTeX внутри одной формулы строку не переносит, а в узкой колонке
 * карточки длинная цепочка равенств не помещается — поэтому каждый
 * кусок набирается отдельно, а между ними обычный пробел.
 */
export function kuskiFormuly(formula: string): string[] {
  const kuski: string[] = [];
  let glubina = 0;
  let nachalo = 0;
  for (let i = 0; i < formula.length; i += 1) {
    const ch = formula[i];
    if (ch === '{' || ch === '(') {
      glubina += 1;
    } else if (ch === '}' || ch === ')') {
      glubina -= 1;
    } else if (glubina === 0 && i > nachalo) {
      if (ch === '=' || formula.startsWith('\\approx', i)) {
        kuski.push(formula.slice(nachalo, i).trim());
        nachalo = i;
      } else if (formula.startsWith(',\\quad', i)) {
        kuski.push(formula.slice(nachalo, i + 1).trim());
        nachalo = i + 6;
      }
    }
  }
  kuski.push(formula.slice(nachalo).trim());
  return kuski.filter((k) => k !== '');
}

/**
 * Один кусок формулы вёрсткой KaTeX. `strogo` — падать на ошибке TeX:
 * так работает автотест; на сборке ошибка не роняет страницу, а
 * оставляет формулу исходным текстом.
 */
export function naborFormuly(tex: string, strogo = false): string {
  return katex.renderToString(tex, { throwOnError: strogo, displayMode: false });
}

/** Шаг разбора: текст и, если есть, формула в трёх видах. */
export function shagRazbora(shag: Step, posledniy: boolean, strogo = false): RazborShag {
  if (shag.formula === undefined) {
    return { text: shag.text };
  }
  const tex = posledniy ? vydelitOtvet(shag.formula) : shag.formula;
  const html = kuskiFormuly(tex)
    .map((kusok) => naborFormuly(kusok, strogo))
    .join(' ');
  return { text: shag.text, tex, html, plain: texPlain(tex) };
}

/**
 * Шаги банка → шаги для показа. Ответ выделяется в последней формуле
 * разбора. Метод, подсветка и ответ строкой добавляет тот, кто
 * собирает разбор целиком (pool.ts); здесь — только шаги и чертёж.
 */
export function naborRazbora(shagi: readonly Step[], pryamaya?: Pryamaya, strogo = false): Razbor {
  const posledniy = shagi.reduce((k, s, i) => (s.formula === undefined ? k : i), -1);
  return {
    metod: '',
    shagi: shagi.map((shag, i) => shagRazbora(shag, i === posledniy, strogo)),
    podsvetka: { method: 'direct-count', favorable: [] },
    otvet: '',
    ...(pryamaya === undefined ? {} : { pryamaya }),
  };
}

/** Закрыть разбор отпечатком ответа: вызывается на сборке. */
export function zapechatatRazbor(razbor: Razbor, seal: string): string {
  return sealText(JSON.stringify(razbor), seal);
}
