/* families/trigonometric.js — синусоида y = a·sin(bx + c) + d.

   Период 2π/|b|. Окно подбирается так, чтобы в кадр попал хотя бы один
   полный период и вся амплитуда.

   ОГРАНИЧЕНИЕ РЕНДЕРЕРА. Деления и подписи на осях renderer.js ставит
   строго по целым: цикл засечек идёт шагом 1 и подписи берёт как число.
   Долей π на оси он поставить не может, а править его в этой задаче
   нельзя. Поэтому сетка здесь целая, а не πʼная — про это сказано
   отдельно в отчёте.
*/

'use strict';

import { registerCurve } from '../renderer.js';
import { windowOf, sample, EPS } from './shared.js';

var BASE = 6;
var MAX = 14;
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
 * Окно: не меньше одного полного периода по горизонтали и вся амплитуда
 * по вертикали. Расширяется до ближайшего целого деления, как у всех
 * семейств — общая логика лежит в shared.js.
 */
function windowFor(p) {
  var byPeriod = Math.ceil(period(p) / 2 - EPS);
  var byAmplitude = Math.ceil(Math.abs(p.a) + Math.abs(p.d) - EPS);
  return windowOf(Math.min(Math.max(BASE, byPeriod, byAmplitude), MAX));
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

var api = { BASE: BASE, MAX: MAX, create: create, period: period, valueAt: valueAt,
            windowFor: windowFor, asymptotes: asymptotes };

export default api;
export { create, period, valueAt, windowFor, asymptotes };
