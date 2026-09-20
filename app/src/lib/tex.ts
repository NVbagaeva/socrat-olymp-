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

/**
 * Текст с формулами → HTML: $...$ набирается KaTeX. `strogo` — ошибка
 * TeX роняет набор, а не оставляет формулу текстом: так набираются
 * разборы заданий №4 и №5, у которых формула обязана собраться.
 */
export function typeset(text: string, strogo = false): string {
  return text.replace(/\$([^$]+)\$/g, (_match, formula: string) =>
    katex.renderToString(formula, { throwOnError: strogo, displayMode: false }),
  );
}

/**
 * Строки выкладки одной строкой.
 *
 * В данных формула хранится строками с разрывами по знаку «=», и на
 * разрыве знак стоит дважды — в конце строки и в начале следующей.
 * Когда формула помещается целиком, она показывается одной строкой,
 * и второй знак на стыке лишний: он снимается здесь. Строки, не
 * начинающиеся со знака, склеиваются как есть.
 */
export function odnoyStrokoy(stroki: readonly string[]): string {
  return stroki.reduce((formula, stroka) => {
    const dalshe = stroka.trim();
    const dubl = formula.trimEnd().endsWith('=') && dalshe.startsWith('=');
    return `${formula} ${dubl ? dalshe.slice(1).trim() : dalshe}`;
  });
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
