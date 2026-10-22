/* families/loga.js — логарифмическая кривая y = k · logₐ(x + c) + d.

   Область определения x > −c: левее асимптоты x = −c ничего не
   рисуется. У асимптоты кривая почти вертикальна, поэтому выборка
   сгущается к ней (sampleDense). Зазор до асимптоты у верхней или
   нижней рамки проверяет генератор (generate-logarithmic.js) — окно он
   не двигает, а перебирает параметры. */

'use strict';

import { registerCurve } from '../renderer.js';
import { sampleDense } from './shared.js';

var STEPS = 600;
var NEAR = 1e-4;

registerCurve('loga', function (curve, win) {
  var c = curve.c || 0, d = curve.d || 0, k = curve.k === undefined ? 1 : curve.k;
  var base = Math.log(curve.a);
  var from = Math.max(win.xmin, -c + NEAR);
  return sampleDense(function (x) {
    return x + c <= 0 ? null : k * Math.log(x + c) / base + d;
  }, from, win.xmax, curve.steps || STEPS, 3, 1e4);
});

const api = { type: 'loga' };
export default api;
