/* lib/risunki/shrifty.js — шрифты подписей и нижние индексы на всех рисунках сайта.

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

/* ── Нижний индекс (x₁, x₁₃, A₁, k₂) ───────────────────────────────
   Одна типографика на всех рисунках, как в KaTeX: буква курсивом,
   индекс прямыми цифрами (KaTeX_Main), 70 % кегля буквы, опущен ниже
   строки; многозначный индекс — одним блоком. */

/** Размер индекса и сдвиг вниз — в долях кегля буквы. */
export var INDEKS = { razmer: 0.7, sdvig: 0.25 };

var PODSTROCHNYE = '₀₁₂₃₄₅₆₇₈₉';

/**
 * Имя с индексом: «x10», «A_1», «x_{13}», «D₂» → { bukva: 'x', indeks: '10' }.
 * Без индекса — indeks пустой.
 */
export function razobrat(text) {
  var t = String(text).replace(/[₀-₉]/g, function (ch) {
    return String(PODSTROCHNYE.indexOf(ch));
  });
  var m = /^(.*?[A-Za-zА-Яа-яα-ωΑ-Ω'′])_?\{?([0-9]+)\}?$/.exec(t);
  return m ? { bukva: m[1], indeks: m[2] } : { bukva: t, indeks: '' };
}

function px(v) {
  return String(Math.round(v * 100) / 100);
}

/**
 * Нижний индекс разметкой SVG для подписи кеглем size (в единицах
 * рисунка): tspan прямого шрифта чисел, 70 % кегля, опущен на четверть
 * кегля. dalshe — после индекса подпись продолжается: строка
 * возвращается на место.
 */
export function indeksSvg(indeks, size, dalshe) {
  /* Без кегля (подпись внутри текста неизвестного размера) — в долях
     кегля: 70 %, сдвиг в em самого индекса. */
  var otn = size === null || size === undefined;
  var dy = otn ? (INDEKS.sdvig / INDEKS.razmer).toFixed(3) + 'em' : px(size * INDEKS.sdvig);
  var nazad = otn ? '-' + INDEKS.sdvig + 'em' : px(-size * INDEKS.sdvig);
  return (
    '<tspan class="indeks" font-size="' +
    (otn ? INDEKS.razmer * 100 + '%' : px(size * INDEKS.razmer)) +
    '" font-style="normal" dy="' +
    dy +
    '" style="font-family:' +
    CHISLA +
    '">' +
    indeks +
    '</tspan>' +
    (dalshe ? '<tspan dy="' + nazad + '"></tspan>' : '')
  );
}

/** Ширина индекса в единицах рисунка (цифра KaTeX_Main ≈ 0,5 кегля). */
export function shirinaIndeksa(indeks, size) {
  return String(indeks).length * size * INDEKS.razmer * 0.5;
}

var shrifty = {
  CHISLA: CHISLA,
  BUKVY: BUKVY,
  RAZRESHENNYE: RAZRESHENNYE,
  VES: VES,
  MINUS: MINUS,
  INDEKS: INDEKS,
  razobrat: razobrat,
  indeksSvg: indeksSvg,
  shirinaIndeksa: shirinaIndeksa,
};
export default shrifty;
