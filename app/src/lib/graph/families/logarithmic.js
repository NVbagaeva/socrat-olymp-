/* families/logarithmic.js — логарифм y = logₐ(x − c).

   Область определения строго x > c: левее асимптоты НИЧЕГО не
   рисуется. При c = 0 асимптота совпадает с осью y и пунктиром
   не рисуется.

   Точка (1 + c, 0) лежит на кривой при любом основании и обязана
   попадать в окно — это контрольная точка семейства.
*/

'use strict';

import { registerCurve } from '../renderer.js';
import { windowOf, sampleDense, asymptotes as pack, verticalAsymptote,
         CLEARANCE, EPS } from './shared.js';

var BASE = 6;
var MIN = 2;
var MAX = 12;
var STEPS = 500;
var NEAR = 1e-4;

function create(a, c) {
  if (a <= EPS) { throw new Error('logarithmic: основание должно быть положительным'); }
  if (Math.abs(a - 1) < EPS) { throw new Error('logarithmic: основание не может быть единицей'); }
  return { a: a, c: c === undefined ? 0 : c };
}

function valueAt(p, x) {
  if (x - p.c <= 0) { return null; }
  return Math.log(x - p.c) / Math.log(p.a);
}

/**
 * По вертикали кривая отходит от асимптоты медленно: на расстоянии
 * CLEARANCE от неё значение равно этой величине. Выше по модулю
 * кривая уже ближе к асимптоте, чем зазор.
 */
function tailReach(a) {
  return Math.abs(Math.log(CLEARANCE) / Math.log(a));
}

/**
 * Окно: видны участки и левее, и правее точки (1 + c, 0), сама точка
 * в кадре, и кривая не прижата к асимптоте на видимой высоте.
 */
function windowFor(p) {
  var byTail = Math.max(MIN, Math.floor(tailReach(p.a) + EPS));
  /* Точка (1 + c, 0) и сама асимптота должны попасть в кадр,
     плюс клетка запаса справа — иначе «правее точки» не видно. */
  var needed = Math.ceil(Math.max(Math.abs(p.c), Math.abs(1 + p.c) + 1) - EPS);
  return windowOf(Math.min(Math.max(byTail, needed, MIN), MAX));
}

/** Фактический зазор до асимптоты на нижней или верхней границе. */
function tailClearance(p, win) {
  var yEdge = p.a > 1 ? win.ymin : win.ymax;
  return Math.abs(Math.pow(p.a, yEdge));
}

registerCurve('logarithmic', function (curve, win) {
  var c = curve.c === undefined ? 0 : curve.c;
  var base = Math.log(curve.a);
  /* Выборка идёт только правее асимптоты: точек с x ≤ c в ломаной
     нет вовсе, поэтому нарисовать их нечем. */
  return sampleDense(function (x) {
    return x - c <= 0 ? null : Math.log(x - c) / base;
  }, c + NEAR, win.xmax, STEPS, 3);
});

function asymptotes(p, win) {
  return pack([verticalAsymptote(p.c === undefined ? 0 : p.c, win)]);
}

var api = { BASE: BASE, MIN: MIN, MAX: MAX, create: create, valueAt: valueAt,
            tailReach: tailReach, tailClearance: tailClearance,
            windowFor: windowFor, asymptotes: asymptotes };

export default api;
export { create, valueAt, tailReach, tailClearance, windowFor, asymptotes };
