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

/**
 * Тот же текст словами: для alt, заголовков и голосового доступа.
 * Читать «доллар слэш sqrt» вслух нельзя, поэтому корень
 * проговаривается словами.
 */
export function plain(text: string): string {
  return text.replace(/\$([^$]+)\$/g, (_match, formula: string) =>
    formula
      .replace(/\\sqrt\{([^}]*)\}/g, 'корень из $1')
      .replace(/[{}\\]/g, '')
      .trim(),
  );
}
