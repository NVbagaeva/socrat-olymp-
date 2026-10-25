/* lib/risunki/shrifty.js — шрифты подписей на всех рисунках сайта.

   Один источник для всех движков: графики (graph, proizvodnaya),
   векторы, планиметрия, стереометрия (solid, chertezh3). Подписи
   набраны как формулы KaTeX: числа и знаки — KaTeX_Main прямым,
   буквы-обозначения — KaTeX_Math курсивом. Обычное начертание, не
   жирное; минус — типографский «−» (U+2212).

   Шрифты KaTeX подключены на страницах сайта и листах (katex.min.css),
   а для отдельного SVG/PDF их встраивает vstroitShrifty — тогда рисунок
   выглядит одинаково везде. Запасные — Latin Modern и Times: та же
   антиква, если KaTeX не загрузился. */

'use strict';

/** Числа, скобки, знаки: прямое начертание. */
export var CHISLA = "KaTeX_Main, 'Latin Modern Roman', 'Times New Roman', serif";
/** Буквы-обозначения (x, y, f, A, B…): курсив. */
export var BUKVY = "KaTeX_Math, KaTeX_Main, 'Latin Modern Roman', 'Times New Roman', serif";
/** Разрешённые шрифты подписей (для проверок). */
export var RAZRESHENNYE = [CHISLA, BUKVY];
/** Начертание подписей — обычное. */
export var VES = 400;
/** Типографский минус. */
export var MINUS = '−';

export default { CHISLA: CHISLA, BUKVY: BUKVY, RAZRESHENNYE: RAZRESHENNYE, VES: VES, MINUS: MINUS };
