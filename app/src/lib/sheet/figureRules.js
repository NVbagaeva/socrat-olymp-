/* sheet/figureRules.js — размеры рисунков на печатных листах.

   Правила общие для всех листов (генераторы разделов, «Собрать
   вариант»): ученик должен прочитать рисунок с распечатки.

   1. Рисунок на клетчатой плоскости (векторы №2, графики №9 и №12) —
      крупный: под условием, по центру, клетка на печати GRID_CELL_MM
      (не меньше GRID_CELL_MIN_MM). Под ширину колонки он не сжимается.
      Такой рисунок движок помечает атрибутом data-grid-cell — сколько
      единиц viewBox в клетке.
   2. Остальные рисунки (планиметрия, стереометрия, деревья, мост) могут
      стоять справа от текста, но колонка рисунка — не уже SIDE_MIN_SHARE
      строки, и ширина такая, чтобы подписи вышли не мельче LABEL_PT.
   3. Минимумы на печати, после масштабирования: подписи LABEL_PT,
      индексы INDEX_PT, основные линии LINE_PT, сетка GRID_LINE_PT и не
      светлее GRID_COLOR_MAX.

   Кегль подписей не уменьшается вместе с SVG: движок клетчатого рисунка
   на печать рисует подписи сразу того кегля, который при клетке
   GRID_CELL_MM даёт LABEL_PT (printFontFloor), и подбирает им места
   уже этим кеглем — подписи не налезают на линии и друг на друга. */

var PT_PER_MM = 72 / 25.4;

var RULES = {
  gridCellMm: 7,
  gridCellMinMm: 6,
  /* Тесный рисунок: если печатным кеглем подписям нет места при клетке
     7 мм, движок рисует его ещё раз с клеткой крупнее — по этим
     ступеням. Подписи от этого мельче 10 pt не становятся. */
  gridCellSteps: [7, 8, 9, 10],
  labelPt: 10,
  indexPt: 7,
  linePt: 1.5,
  gridLinePt: 0.5,
  gridColorMax: '#BBBBBB',
  /* Колонка рисунка справа от текста — не уже этой доли строки. */
  sideMinShare: 0.4,
  /* Шире этой доли строки рисунок справа не встаёт: уходит под условие. */
  sideMaxShare: 0.55,
  /* Ширина тела карточки задачи на листе A4, мм: страница 210 мм без
     полей листа, номера задачи и отступов карточки (sheet.css). */
  rowMm: 158
};

function roundUp(value) {
  return Math.ceil(value * 10 - 1e-9) / 10;
}

/** Кегль в единицах viewBox, который на печати даёт pt пунктов. */
function unitsForPt(pt, unitsPerMm) {
  return roundUp(pt / PT_PER_MM * unitsPerMm);
}

/**
 * Наименьшие кегли подписей клетчатого рисунка в единицах viewBox:
 * клетка cellUnits единиц печатается клеткой cellMm (по умолчанию
 * RULES.gridCellMm).
 */
function printFontFloor(cellUnits, cellMm) {
  var mm = cellMm || RULES.gridCellMm;
  var unitsPerMm = cellUnits / mm;
  return {
    cellMm: mm,
    label: unitsForPt(RULES.labelPt, unitsPerMm),
    index: unitsForPt(RULES.indexPt, unitsPerMm),
    line: unitsForPt(RULES.linePt, unitsPerMm)
  };
}

/* Печатный профиль движков клетчатых рисунков (graph/renderer.js,
   vektory/render.ts, proizvodnaya/render.ts): пока он включён, движок
   рисует с печатными кеглями и ставит data-grid-cell. Включается на
   время сборки листа — сборка синхронная, и сайт профиль не видит. */
var printDepth = 0;

/* Автотесты подписей (check-point-labels, check-curve-labels,
   check-vektory, check-proizvodnaya) гоняются и в печатном профиле:
   SHEET_PRINT_FIGURES=1 включает его на весь прогон. */
var PRINT_ENV = typeof process !== 'undefined' && Boolean(process.env) &&
  process.env.SHEET_PRINT_FIGURES === '1';

/* Генерация задачи профиль не видит никогда: генераторы отбраковывают
   расположения по отчёту движка, и с печатными кеглями тот же seed
   дал бы другую задачу, чем на сайте. */
var suspended = 0;

function printProfile() {
  return suspended === 0 && (printDepth > 0 || PRINT_ENV);
}

/** Выполнить fn с печатным профилем рисунков. */
function withPrintFigures(fn) {
  printDepth += 1;
  try {
    return fn();
  } finally {
    printDepth -= 1;
  }
}

/** Выполнить fn без печатного профиля: генерация задачи (seed → задача). */
function withoutPrintFigures(fn) {
  suspended += 1;
  try {
    return fn();
  } finally {
    suspended -= 1;
  }
}

/* ── Разбор SVG ─────────────────────────────────────────────── */

function viewBoxOf(svg) {
  var m = /viewBox="\s*(-?[0-9.]+)[\s,]+(-?[0-9.]+)[\s,]+([0-9.]+)[\s,]+([0-9.]+)/.exec(svg || '');
  return m ? { width: Number(m[3]), height: Number(m[4]) } : null;
}

function gridCellOf(svg) {
  var m = /^<svg[^>]*\sdata-grid-cell="([0-9.]+)"/.exec(svg || '');
  return m ? Number(m[1]) : null;
}

/* Клетка на печати, под которую движок рисовал подписи (data-cell-mm). */
function printCellMmOf(svg) {
  var m = /^<svg[^>]*\sdata-cell-mm="([0-9.]+)"/.exec(svg || '');
  return m ? Number(m[1]) : RULES.gridCellMm;
}

/* Кегли подписей в единицах viewBox: атрибут font-size и font-size
   в style. Проценты (индекс 70 %) считаются от кегля подписи. Рисунок,
   у которого кегли заданы в CSS (№6: components/probability), сообщает
   самый мелкий сам — атрибутом data-min-font на <svg>. */
function fontSizesOf(svg) {
  var out = [];
  var own = /^<svg[^>]*\sdata-min-font="([0-9.]+)"/.exec(svg || '');
  if (own) { out.push(Number(own[1])); }
  var re = /font-size(?:="|:\s*)([0-9.]+)(%|px)?/g;
  var m;
  while ((m = re.exec(svg || '')) !== null) {
    if (m[2] !== '%') { out.push(Number(m[1])); }
  }
  return out;
}

/**
 * Размер рисунка на печати.
 *
 *   svg       разметка рисунка
 *   widthMm   ширина, которую просит лист (по клетке раздела или прямо
 *             в мм); у клетчатого рисунка не используется
 *   rowMm     ширина строки (тела карточки), мм
 *
 * → { grid, widthMm, cellMm, below, minWidthMm }
 *   grid       клетчатый рисунок: под условием, по центру
 *   cellMm     клетка на печати (у клетчатого)
 *   minWidthMm ширина, при которой самая мелкая подпись — LABEL_PT
 *   below      рисунок под условием (клетчатый или слишком широкий)
 */
function figureSize(svg, widthMm, rowMm) {
  var row = rowMm || RULES.rowMm;
  var box = viewBoxOf(svg);
  var cell = gridCellOf(svg);
  if (box && cell) {
    var cells = box.width / cell;
    var cellMm = Math.max(RULES.gridCellMinMm, Math.min(printCellMmOf(svg), row / cells));
    return { grid: true, widthMm: cells * cellMm, cellMm: cellMm, below: true, minWidthMm: null };
  }
  var fonts = fontSizesOf(svg);
  var minFont = fonts.length ? Math.min.apply(null, fonts) : null;
  var minWidth = box && minFont ? RULES.labelPt * box.width / (minFont * PT_PER_MM) : null;
  var side = row * RULES.sideMinShare;
  var w = Math.max(widthMm || 0, minWidth || 0, side);
  var below = w > row * RULES.sideMaxShare;
  return {
    grid: false,
    widthMm: Math.min(w, row),
    cellMm: null,
    below: below,
    minWidthMm: minWidth
  };
}

/* Основные линии не тоньше LINE_PT на печати. Основные — не тоньше
   MAIN_SHARE самой толстой линии рисунка; тонкие (пунктиры построений,
   штриховка, засечки) не трогаются. Все основные утолщаются в одно и
   то же число раз — так, чтобы самая тонкая из них дала LINE_PT:
   иерархия толщин (искомый отрезок толще стороны) остаётся. */
var MAIN_SHARE = 0.6;
var STROKE = /(<(?:path|line|polyline|polygon|circle|ellipse|rect)\b[^>]*?\sstroke-width=")([0-9.]+)"/g;

function strokeFloor(svg, widthMm) {
  var box = viewBoxOf(svg);
  if (!box || !widthMm) { return svg; }
  var floor = RULES.linePt / PT_PER_MM * (box.width / widthMm);
  var widths = [];
  svg.replace(STROKE, function (all, head, w) { widths.push(Number(w)); return all; });
  if (!widths.length) { return svg; }
  var thick = Math.max.apply(null, widths);
  var main = widths.filter(function (w) { return w >= thick * MAIN_SHARE; });
  var ratio = floor / Math.min.apply(null, main);
  if (ratio <= 1) { return svg; }
  return svg.replace(STROKE, function (all, head, w) {
    var value = Number(w);
    if (value < thick * MAIN_SHARE) { return all; }
    return head + (Math.round(value * ratio * 100) / 100) + '"';
  });
}

const api = {
  RULES: RULES,
  PT_PER_MM: PT_PER_MM,
  printFontFloor: printFontFloor,
  printProfile: printProfile,
  withPrintFigures: withPrintFigures,
  withoutPrintFigures: withoutPrintFigures,
  figureSize: figureSize,
  strokeFloor: strokeFloor,
  viewBoxOf: viewBoxOf,
  gridCellOf: gridCellOf
};

export default api;
export { RULES, PT_PER_MM, printFontFloor, printProfile, withPrintFigures, withoutPrintFigures,
         figureSize, strokeFloor, viewBoxOf, gridCellOf };
