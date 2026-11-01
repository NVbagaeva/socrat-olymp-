/**
 * Один вывод формулы на странице: вёрстка KaTeX + подпись словами.
 *
 * KaTeX по умолчанию кладёт формулу дважды: видимую вёрстку и MathML
 * для скринридера (а внутри MathML — ещё и TeX). Робот поиска и
 * копирование текста читают все копии сразу, и в заголовке «умножить
 * на k» превращался в «умножить на kkk». Теперь вывод один — видимая
 * вёрстка (output: 'html'), вид формулы прежний. Скринридеру формула
 * доступна подписью: role="math" и aria-label с той же формулой
 * текстом (lib/tekstFormul.js: «1/a», «x² + √x ≤ 3»).
 *
 * Модуль на JS: его грузят и Next.js, и скрипты проверок на Node через
 * lib/graph/katex.js (ES-модули Node TypeScript не читают).
 */

import katexLib from 'katex';
import { formulaVTekst } from './tekstFormul.js';

/**
 * Подпись формулы: та же формула текстом. Пусто (одни служебные
 * команды) — слово «формула», чтобы скринридер не пропустил её молча.
 * @param {string} tex
 */
function podpis(tex) {
  const t = formulaVTekst(tex);
  return t === '' ? 'формула' : t;
}

/** @param {string} s */
function vAtribut(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Подписать готовую вёрстку KaTeX: role="math" и формула словами в aria-label.
 * @param {string} html
 * @param {string} tex
 * @returns {string}
 */
export function podpisat(html, tex) {
  if (html.includes('<span class="katex" role="math"')) return html;
  return html.replace(
    '<span class="katex">',
    `<span class="katex" role="math" aria-label="${vAtribut(podpis(tex))}">`,
  );
}

/**
 * То же для узла, уже набранного KaTeX в браузере.
 * @param {Element} node
 * @param {string} tex
 */
export function podpisatUzel(node, tex) {
  const k = node.classList.contains('katex') ? node : node.querySelector('.katex');
  if (k === null) return;
  k.setAttribute('role', 'math');
  k.setAttribute('aria-label', podpis(tex));
}

/**
 * Вывод по умолчанию — только вёрстка; явно заданный output не трогается.
 * @template {object | undefined} T
 * @param {T} options
 * @returns {T & { output: 'html' | 'mathml' | 'htmlAndMathml' }}
 */
export function opciiOdin(options) {
  const o = /** @type {any} */ (options ?? {});
  return { ...o, output: o.output ?? 'html' };
}

/**
 * katex.renderToString с одним выводом и подписью.
 * @param {string} tex
 * @param {import('katex').KatexOptions} [options]
 * @returns {string}
 */
export function katexOdin(tex, options) {
  const o = opciiOdin(options);
  const html = katexLib.renderToString(tex, o);
  return o.output === 'html' ? podpisat(html, tex) : html;
}
