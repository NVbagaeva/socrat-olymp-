/* families/trigonometric.js — синусоида y = a·sin(bx + c) + d.

   Период 2π/|b|. Окно подбирается так, чтобы в кадр попал хотя бы один
   полный период и вся амплитуда.

   Ось x размечена в долях π: сетка, засечки и подписи идут шагом π/2.
   Подписи задаются строками через поле axes.ticks — числом «π/2»
   записать нельзя. По оси y деления обычные, целые.
*/

'use strict';

import { registerCurve } from '../renderer.js';
import { windowBox, sample, piTicks, HALF, PI_HALF, EPS } from './shared.js';

var MAX_HALVES = 12;   /* потолок охвата по x, в единицах π/2 */
/* Шагов больше, чем у других семейств: у синусоиды изгиб на всём
   протяжении, а не только в одном месте. */
var STEPS = 900;

function create(a, b, c, d) {
  if (Math.abs(b) < EPS) { throw new Error('trigonometric: b не может быть нулём'); }
  return { a: a === undefined ? 1 : a, b: b, c: c === undefined ? 0 : c, d: d === undefined ? 0 : d };
}

/** Период — единственная величина, от которой зависит ширина окна. */
function period(p) {
  return (2 * Math.PI) / Math.abs(p.b);
}

function valueAt(p, x) {
  return p.a * Math.sin(p.b * x + p.c) + p.d;
}

/**
 * Окно. По горизонтали — не меньше одного полного периода, граница
 * ложится на деление, кратное π/2, чтобы крайняя засечка была
 * подписана. По вертикали охват как у остальных семейств.
 *
 * Масштаб при этом общий: и по x, и по y одна единица — одно и то же
 * число пикселей. Меняется только охват, поэтому длинный период
 * расширяет кадр вширь, а не сжимает клетку.
 */
function windowFor(p) {
  var halves = Math.ceil(Math.max(period(p) / 2, HALF) / PI_HALF - EPS);
  var half = Math.min(halves, MAX_HALVES) * PI_HALF;
  return windowBox(-half, half, -HALF, HALF);
}

/** Деления оси x: шаг π/2, подписи строками. Ось y — как у всех. */
function ticksFor(win) {
  return { x: piTicks(win) };
}

registerCurve('trigonometric', function (curve, win) {
  var a = curve.a === undefined ? 1 : curve.a;
  var c = curve.c === undefined ? 0 : curve.c;
  var d = curve.d === undefined ? 0 : curve.d;
  return sample(function (x) {
    return a * Math.sin(curve.b * x + c) + d;
  }, win.xmin, win.xmax, STEPS);
});

/** Асимптот у синусоиды нет. */
function asymptotes() {
  return [];
}

var api = { MAX_HALVES: MAX_HALVES, create: create, period: period, valueAt: valueAt,
            windowFor: windowFor, ticksFor: ticksFor, asymptotes: asymptotes };

export default api;
export { create, period, valueAt, windowFor, ticksFor, asymptotes };
