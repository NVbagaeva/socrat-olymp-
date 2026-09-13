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
import { fitWindow, sample, asymptotes as pack, horizontalAsymptote,
         HALF, CLEARANCE, EPS } from './shared.js';

var MAX = 12;
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
 * Окно общее для всех семейств: масштаб сетки один на весь движок,
 * поэтому полуширина берётся та же, что у прямой и параболы.
 * Расширяется только тогда, когда асимптота или точка (0, 1 + d)
 * иначе не попадут в кадр.
 */
function windowFor(p) {
  return fitWindow([{ x: 0, y: p.d }, { x: 0, y: 1 + p.d }], HALF, MAX);
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
