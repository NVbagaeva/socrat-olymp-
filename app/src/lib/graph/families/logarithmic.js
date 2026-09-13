/* families/logarithmic.js — логарифм y = logₐx.

   Область определения строго x > 0: левее нуля НИЧЕГО не рисуется.
   Вертикальная асимптота x = 0. Кривая обязана проходить через (1, 0)
   при любом основании — это контрольная точка семейства.
*/

'use strict';

import { registerCurve } from '../renderer.js';
import { fitWindow, sampleDense, verticalAsymptote, EPS } from './shared.js';

var BASE = 6;
var MAX = 12;
var STEPS = 500;
/* Ближе этого к асимптоте выборка не идёт: кривая там уже за окном. */
var NEAR = 1e-4;

function create(a) {
  if (a <= EPS) { throw new Error('logarithmic: основание должно быть положительным'); }
  if (Math.abs(a - 1) < EPS) { throw new Error('logarithmic: основание не может быть единицей'); }
  return { a: a };
}

/** Вне области определения возвращается null — выборка на нём рвётся. */
function valueAt(p, x) {
  if (x <= 0) { return null; }
  return Math.log(x) / Math.log(p.a);
}

function windowFor() {
  return fitWindow([{ x: 1, y: 0 }], BASE, MAX);
}

registerCurve('logarithmic', function (curve, win) {
  var base = Math.log(curve.a);
  /* Выборка начинается правее нуля и идёт только вправо: точек с x ≤ 0
     в ломаной нет вовсе, поэтому нарисовать их нечем. */
  return sampleDense(function (x) {
    return x <= 0 ? null : Math.log(x) / base;
  }, NEAR, win.xmax, STEPS, 3);
});

function asymptotes(p, win) {
  return [verticalAsymptote(0, win)];
}

var api = { BASE: BASE, MAX: MAX, create: create, valueAt: valueAt,
            windowFor: windowFor, asymptotes: asymptotes };

export default api;
export { create, valueAt, windowFor, asymptotes };
