/* families/sqrt.js — корень y = a·√(x − c) + d.

   Область определения x ≥ c: левее границы НИЧЕГО не рисуется.
   В самой точке (c, d) кривая начинается — это не разрыв, а край,
   поэтому она в выборку входит. Без поля d это прежняя y = a·√(x − c):
   старые сцены (миниатюры, превью) рисуются как раньше.

   Асимптот у семейства нет. В точке c касательная вертикальна,
   поэтому выборка сгущается к левому краю: равномерный шаг дал бы
   там ломаную из двух-трёх отрезков.

   Точка (c + 1, a) лежит на кривой при любом a и обязана попадать
   в окно — это контрольная точка семейства.
*/

'use strict';

import { registerCurve } from '../renderer.js';
import { fitWindow, sampleDense, asymptotes as pack, HALF, EPS } from './shared.js';

var MAX = 12;
var STEPS = 400;

function create(a, c, d) {
  if (Math.abs(a) < EPS) { throw new Error('sqrt: множитель a не может быть нулём'); }
  return { a: a, c: c === undefined ? 0 : c, d: d === undefined ? 0 : d };
}

function liftOf(p) { return p.d === undefined ? 0 : p.d; }

function valueAt(p, x) {
  return x - p.c < 0 ? null : p.a * Math.sqrt(x - p.c) + liftOf(p);
}

/**
 * Окно общее для всех семейств: масштаб сетки один на весь движок.
 * Расширяется только если край области определения или контрольная
 * точка (c + 1, a) иначе не попадут в кадр.
 */
function windowFor(p) {
  return fitWindow([{ x: p.c, y: liftOf(p) }, { x: 1 + p.c, y: p.a + liftOf(p) }], HALF, MAX);
}

registerCurve('sqrt', function (curve, win) {
  var a = curve.a === undefined ? 1 : curve.a;
  var c = curve.c === undefined ? 0 : curve.c;
  var d = liftOf(curve);
  /* Выборка идёт от края области определения вправо: точек с x < c
     в ломаной нет вовсе, поэтому нарисовать их нечем. Сгущение к
     левому концу отрабатывает вертикальную касательную. */
  return sampleDense(function (x) {
    return x - c < 0 ? null : a * Math.sqrt(x - c) + d;
  }, c, win.xmax, STEPS, 3);
});

/** Асимптот у корня нет: список всегда пустой. */
function asymptotes() {
  return pack([]);
}

var api = { MAX: MAX, create: create, valueAt: valueAt,
            windowFor: windowFor, asymptotes: asymptotes };

export default api;
export { create, valueAt, windowFor, asymptotes };
