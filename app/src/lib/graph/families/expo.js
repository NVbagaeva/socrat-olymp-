/* families/expo.js — показательная кривая y = k · a^(x + c) + d.

   Рисует её генератор задач показательной подтемы (generate-exponential.js),
   миниатюры и рисунки теории. Асимптоту y = d кривая не пересекает и не
   касается; у края окна зазор до неё проверяет генератор — окно он не
   двигает, а перебирает параметры. */

'use strict';

import { registerCurve } from '../renderer.js';
import { sample } from './shared.js';

var STEPS = 700;

/* k — растяжение (живой график теории), steps — редкая выборка для
   миниатюр: плотная весила бы килобайты на картинку в 136 px. */
registerCurve('expo', function (curve, win) {
  var c = curve.c || 0, d = curve.d || 0, k = curve.k === undefined ? 1 : curve.k;
  return sample(function (x) { return k * Math.pow(curve.a, x + c) + d; }, win.xmin, win.xmax,
    curve.steps || STEPS, 1e4);
});

const api = { type: 'expo' };
export default api;
