/* families/trig.js — кривые y = a · cos x + b, a · sin x + b, a · tg x + b
   в клетках сетки, как на рисунках открытого банка ФИПИ.

   Клетка по оси x — π/4 (curve.xu, по умолчанию π/4), по оси y — yu
   (1 или 0,5). Окно, точки и подписи — в клетках: X = x / xu, Y = y / yu.
   Так узлы сетки остаются целыми, а на оси x появляется π.

   У тангенса между ветвями — вертикальные асимптоты x = π/2 + πk;
   каждая ветвь выбирается отдельно и сгущается к асимптотам, чтобы
   ветви не соединились отрезком. */

'use strict';

import { registerCurve } from '../renderer.js';
import { sample, sampleDense } from './shared.js';

var STEPS = 600;
var NEAR = 1e-4;

function fnOf(name) {
  if (name === 'cos') { return Math.cos; }
  if (name === 'sin') { return Math.sin; }
  if (name === 'tg') { return Math.tan; }
  throw new Error('trig: неизвестная функция «' + name + '»');
}

/** Абсциссы асимптот тангенса в клетках внутри [from; to]. */
function tanAsymptotes(xu, from, to) {
  var out = [];
  var k0 = Math.ceil((from * xu - Math.PI / 2) / Math.PI - 1e-9);
  for (var k = k0; ; k++) {
    var X = (Math.PI / 2 + Math.PI * k) / xu;
    if (X > to + 1e-9) { break; }
    out.push(X);
  }
  return out;
}

registerCurve('trig', function (curve, win) {
  var xu = curve.xu || Math.PI / 4;
  var yu = curve.yu || 1;
  var a = curve.a, b = curve.b || 0;
  var f = fnOf(curve.fn);
  var Y = function (X) { return (a * f(X * xu) + b) / yu; };
  if (curve.fn !== 'tg') { return sample(Y, win.xmin, win.xmax, curve.steps || STEPS); }
  /* Ветви тангенса: каждую — от середины к обеим асимптотам. */
  var cuts = [win.xmin].concat(tanAsymptotes(xu, win.xmin, win.xmax)).concat([win.xmax]);
  var pieces = [];
  var limit = 1e4;
  for (var i = 0; i + 1 < cuts.length; i++) {
    var lo = cuts[i], hi = cuts[i + 1];
    if (hi - lo < 1e-6) { continue; }
    var mid = (lo + hi) / 2;
    var steps = Math.ceil((curve.steps || STEPS) / 4);
    var left = sampleDense(Y, i === 0 ? lo : lo + NEAR, mid, steps, 3, limit);
    var right = sampleDense(Y, i + 1 === cuts.length - 1 ? hi : hi - NEAR, mid, steps, 3, limit);
    var joined = [].concat.apply([], left.concat(right));
    joined.sort(function (p, q) { return p.x - q.x; });
    if (joined.length > 1) { pieces.push(joined); }
  }
  return pieces;
});

const api = { type: 'trig', tanAsymptotes: tanAsymptotes };
export default api;
export { tanAsymptotes };
