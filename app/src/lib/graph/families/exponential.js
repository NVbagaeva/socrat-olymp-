/* families/exponential.js — показательная y = aˣ.

   Основание строго положительное и не равно единице. Кривая всюду
   выше оси x и её не касается: горизонтальная асимптота y = 0.
*/

'use strict';

import { registerCurve } from '../renderer.js';
import { fitWindow, sample, horizontalAsymptote, EPS } from './shared.js';

var BASE = 6;
var MAX = 12;
var STEPS = 600;

function create(a) {
  if (a <= EPS) { throw new Error('exponential: основание должно быть положительным'); }
  if (Math.abs(a - 1) < EPS) { throw new Error('exponential: основание не может быть единицей'); }
  return { a: a };
}

function valueAt(p, x) {
  return Math.pow(p.a, x);
}

/** Растёт (или убывает) быстро, поэтому окно по умолчанию не расширяем:
    важна не вся кривая, а её поведение около нуля и вдоль асимптоты. */
function windowFor() {
  return fitWindow([{ x: 0, y: 1 }], BASE, MAX);
}

registerCurve('exponential', function (curve, win) {
  return sample(function (x) {
    return Math.pow(curve.a, x);
  }, win.xmin, win.xmax, STEPS);
});

/** Единственная асимптота — сама ось x, но пунктиром и цветом сетки. */
function asymptotes(p, win) {
  return [horizontalAsymptote(0, win)];
}

var api = { BASE: BASE, MAX: MAX, create: create, valueAt: valueAt,
            windowFor: windowFor, asymptotes: asymptotes };

export default api;
export { create, valueAt, windowFor, asymptotes };
