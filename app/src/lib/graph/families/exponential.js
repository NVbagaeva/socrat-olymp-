/* families/exponential.js — показательная y = aˣ + d.

   Основание строго положительное и не равно единице. Кривая нигде
   не касается своей горизонтальной асимптоты y = d: при d = 0 это
   сама ось x, и тогда пунктир не рисуется.

   Хвост кривой не должен читаться утолщением асимптоты, поэтому окно
   по горизонтали не растягивается, а СУЖАЕТСЯ до ширины, на которой
   у края остаётся различимый зазор.
*/

'use strict';

import { registerCurve } from '../renderer.js';
import { windowBox, sample, asymptotes as pack, horizontalAsymptote,
         CLEARANCE, EPS } from './shared.js';

var MAX = 12;
var SPAN_Y = 12;   /* высота кадра в клетках — как у остальных семейств */
var STEPS = 600;

function create(a, d) {
  if (a <= EPS) { throw new Error('exponential: основание должно быть положительным'); }
  if (Math.abs(a - 1) < EPS) { throw new Error('exponential: основание не может быть единицей'); }
  return { a: a, d: d === undefined ? 0 : d };
}

function valueAt(p, x) {
  return Math.pow(p.a, x) + p.d;
}

/**
 * Насколько далеко от нуля кривая ещё отстоит от асимптоты на CLEARANCE.
 * Дальше этого места aˣ меньше зазора и сливается с асимптотой.
 */
function tailReach(a) {
  return Math.log(1 / CLEARANCE) / Math.abs(Math.log(a));
}

/**
 * Окно прямоугольное: по x охват обрезан там, где кривая уже неотличима
 * от асимптоты, по y — столько, сколько нужно кривой и асимптоте.
 *
 * Хвост отрезается границей окна, а не искусственным обрывом кривой:
 * поведение функции не искажается, просто неразличимый участок
 * не попадает в кадр. Масштаб клетки при этом не меняется.
 */
function windowFor(p) {
  /* Дальше этого места aˣ меньше зазора и сливается с асимптотой. */
  var reach = Math.max(1, Math.floor(tailReach(p.a) + EPS));
  var grow = 3;                       /* сторона, куда кривая растёт */
  var xmin = p.a > 1 ? -reach : -grow;
  var xmax = p.a > 1 ? grow : reach;

  /* Высота кадра постоянная: столько же клеток, сколько у прямой
     и параболы. Что не поместилось — обрежет рамка. */
  var ymin = Math.min(p.d, 0) - 2;
  return windowBox(xmin, xmax, ymin, ymin + SPAN_Y);
}

/** Фактический зазор у края окна: по нему и проверяется правило. */
function tailClearance(p, win) {
  var xEdge = p.a > 1 ? win.xmin : win.xmax;
  return Math.abs(valueAt(p, xEdge) - p.d);
}

registerCurve('exponential', function (curve, win) {
  var d = curve.d === undefined ? 0 : curve.d;
  return sample(function (x) {
    return Math.pow(curve.a, x) + d;
  }, win.xmin, win.xmax, STEPS);
});

function asymptotes(p, win) {
  return pack([horizontalAsymptote(p.d === undefined ? 0 : p.d, win)]);
}

var api = { MAX: MAX, create: create, valueAt: valueAt,
            tailReach: tailReach, tailClearance: tailClearance,
            windowFor: windowFor, asymptotes: asymptotes };

export default api;
export { create, valueAt, tailReach, tailClearance, windowFor, asymptotes };
