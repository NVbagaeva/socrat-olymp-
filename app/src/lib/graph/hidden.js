/* hidden.js — «невидимая» точка: общая проверка для всех семейств.

   Инвариант задания №12: если спрашивают координату точки, которая
   по смыслу задачи на рисунке не видна (вторая точка пересечения B,
   точка пересечения прямых «за кадром»), эта точка не попадает в окно
   рисунка. Не «почти за рамкой» и не «кривая там обрывается», а
   вынесена за рамку хотя бы на margin клеток — хотя бы по одной
   координате. Тогда на рисунке её нет, и ни одну её координату не
   прочитать с сетки.

   Окно задаётся как в сцене: { xmin, xmax, ymin, ymax } в клетках.
   Точка — { x, y } числами или точными дробями { p, q }.

   Генераторы берут эту проверку при подборе параметров: не прошла —
   набор параметров бракуется и подбирается другой. Окно при этом не
   трогается: оно стандартное, как у остальных задач.
*/

'use strict';

/** Запас по умолчанию: точка за рамкой не ближе одной клетки. */
var HIDDEN_MARGIN = 1;

function value(v) {
  return typeof v === 'number' ? v : v.p / v.q;
}

/**
 * На сколько клеток точка вынесена за рамку окна: наибольший вынос по
 * двум координатам. Отрицательно или ноль — точка в окне или на рамке.
 */
function outsideBy(point, win) {
  var x = value(point.x);
  var y = value(point.y);
  return Math.max(win.xmin - x, x - win.xmax, win.ymin - y, y - win.ymax);
}

/**
 * Точка скрыта: лежит за рамкой окна не ближе margin клеток хотя бы
 * по одной координате (по умолчанию — не ближе одной клетки).
 */
function isPointHidden(point, win, margin) {
  var m = margin === undefined ? HIDDEN_MARGIN : margin;
  return outsideBy(point, win) >= m - 1e-9;
}

const api = { HIDDEN_MARGIN: HIDDEN_MARGIN, outsideBy: outsideBy, isPointHidden: isPointHidden };

export default api;
export { HIDDEN_MARGIN, outsideBy, isPointHidden };
