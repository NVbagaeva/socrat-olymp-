/* families/rational.js — гипербола y = k/x + b.

   Вертикальная асимптота x = 0, горизонтальная y = b. Ветви слева
   и справа от нуля — РАЗНЫЕ куски ломаной и между собой не
   соединяются: это самая частая ошибка построения.
*/

'use strict';

import { registerCurve } from '../renderer.js';
import { fitWindow, sampleDense, verticalAsymptote, horizontalAsymptote, EPS } from './shared.js';

var BASE = 6;
var MAX = 14;
var STEPS = 400;
/* Ближе этого к асимптоте точки не берутся: там кривая уже далеко
   за окном, и рамку всё равно режет рендерер. */
var NEAR = 1e-3;

function create(k, b) {
  if (Math.abs(k) < EPS) { throw new Error('rational: k не может быть нулём'); }
  return { k: k, b: b === undefined ? 0 : b };
}

function valueAt(p, x) {
  return Math.abs(x) < EPS ? null : p.k / x + p.b;
}

/** Горизонтальная асимптота должна быть в кадре — иначе её не видно. */
function windowFor(p) {
  return fitWindow([{ x: 0, y: p.b }], BASE, MAX);
}

registerCurve('rational', function (curve, win) {
  var b = curve.b === undefined ? 0 : curve.b;
  function f(x) { return curve.k / x + b; }

  /* Две независимые ветви: каждая идёт от асимптоты к краю окна.
     Возвращаются двумя кусками, поэтому соединить их рендереру нечем. */
  var left = sampleDense(f, -NEAR, win.xmin, STEPS, 3);
  var right = sampleDense(f, NEAR, win.xmax, STEPS, 3);
  return left.concat(right);
});

/** Обе асимптоты пунктиром цветом сетки. */
function asymptotes(p, win) {
  return [verticalAsymptote(0, win), horizontalAsymptote(p.b === undefined ? 0 : p.b, win)];
}

var api = { BASE: BASE, MAX: MAX, create: create, valueAt: valueAt,
            windowFor: windowFor, asymptotes: asymptotes };

export default api;
export { create, valueAt, windowFor, asymptotes };
