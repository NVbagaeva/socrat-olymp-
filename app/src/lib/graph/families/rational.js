/* families/rational.js — гипербола y = k/(x + a) + b.

   Вертикальная асимптота x = −a, горизонтальная y = b. Ветви слева
   и справа от вертикальной асимптоты — РАЗНЫЕ куски ломаной и между
   собой не соединяются. Без поля a это прежняя y = k/x + b: старые
   сцены (миниатюры, превью) рисуются как раньше.

   Пунктиром рисуется только та асимптота, которая не совпала с осью:
   x = 0 — это сама ось y, её рисовать нечем. Проверку делает общее
   правило в shared.js.
*/

'use strict';

import { registerCurve } from '../renderer.js';
import { fitWindow, sampleDense, asymptotes as pack,
         verticalAsymptote, horizontalAsymptote, EPS } from './shared.js';

var BASE = 6;
var MAX = 14;
var STEPS = 400;
var NEAR = 1e-3;

function shiftOf(p) { return p.a === undefined ? 0 : p.a; }
function liftOf(p) { return p.b === undefined ? 0 : p.b; }

function create(k, b, a) {
  if (Math.abs(k) < EPS) { throw new Error('rational: k не может быть нулём'); }
  return { k: k, b: b === undefined ? 0 : b, a: a === undefined ? 0 : a };
}

function valueAt(p, x) {
  var d = x + shiftOf(p);
  return Math.abs(d) < EPS ? null : p.k / d + liftOf(p);
}

/** Обе асимптоты обязаны быть в кадре — иначе их не видно. */
function windowFor(p) {
  return fitWindow([{ x: -shiftOf(p), y: liftOf(p) }], BASE, MAX);
}

registerCurve('rational', function (curve, win) {
  var a = shiftOf(curve);
  var b = liftOf(curve);
  var x0 = -a;
  function f(x) { return curve.k / (x + a) + b; }

  /* Две независимые ветви: каждая идёт от асимптоты к краю окна.
     Возвращаются двумя кусками, поэтому соединить их рендереру нечем.
     Асимптота за левой или правой рамкой — ветвь с той стороны не
     видна вовсе, и выборки по ней не нужно. */
  var left = x0 - NEAR > win.xmin ? sampleDense(f, x0 - NEAR, win.xmin, STEPS, 3) : [];
  var right = x0 + NEAR < win.xmax ? sampleDense(f, x0 + NEAR, win.xmax, STEPS, 3) : [];
  return left.concat(right);
});

function asymptotes(p, win) {
  return pack([verticalAsymptote(-shiftOf(p), win), horizontalAsymptote(liftOf(p), win)]);
}

var api = { BASE: BASE, MAX: MAX, create: create, valueAt: valueAt,
            windowFor: windowFor, asymptotes: asymptotes };

export default api;
export { create, valueAt, windowFor, asymptotes };
