/**
 * Формулы внутри обычного текста.
 *
 * Условия задач хранятся строкой, а формулы в них помечены знаками
 * доллара: «Диагональ куба равна $\sqrt{12}$». Здесь эта разметка
 * превращается в готовый HTML на сборке: KaTeX отрабатывает при
 * сборке страницы, в браузер уходит только вёрстка.
 *
 * Модуль отдельный, чтобы у стереометрии не появилось своей второй
 * такой функции: набор формул в проекте один.
 */

import { katex } from './graph/katex';

/** Текст с формулами → HTML: $...$ набирается KaTeX. */
export function typeset(text: string): string {
  return text.replace(/\$([^$]+)\$/g, (_match, formula: string) =>
    katex.renderToString(formula, { throwOnError: false, displayMode: false }),
  );
}

/** Цифра в нижний индекс: 1 → ₁. Только для alt и заголовков. */
function subscript(digits: string): string {
  return digits.replace(/\d/g, (d) => String.fromCharCode(0x2080 + Number(d)));
}

/**
 * Тот же текст словами: для alt, заголовков и голосового доступа.
 * Читать «доллар слэш sqrt» вслух нельзя, поэтому корень
 * проговаривается словами, а индекс становится подстрочной цифрой:
 * «A_1» вслух не прочесть, «A₁» — можно. Это единственное место,
 * где Юникод-индекс уместен.
 */
export function plain(text: string): string {
  return text.replace(/\$([^$]+)\$/g, (_match, formula: string) =>
    formula
      .replace(/\\sqrt\{([^}]*)\}/g, 'корень из $1')
      .replace(/\^\\circ/g, '°')
      .replace(/_\{(\d+)\}/g, (_m, d: string) => subscript(d))
      .replace(/_(\d)/g, (_m, d: string) => subscript(d))
      .replace(/\{,\}/g, ',')
      .replace(/[{}\\]/g, '')
      .trim(),
  );
}
