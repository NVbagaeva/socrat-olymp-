/* families/quadratic.js — парабола y = ax² + bx + c.

   Математика семейства живёт здесь, рисует renderer.js, сцену
   описывают данные. Сэмплер встраивается штатным registerCurve —
   тело рендерера для этого править не нужно.
*/

'use strict';

import { registerCurve } from '../renderer.js';
import { fitWindow, sample, EPS } from './shared.js';

/* Окно семейства по умолчанию и потолок расширения. */
var BASE = 6;
var MAX = 14;
var STEPS = 600;

/** Вершина считается точно по формуле, а не поиском по выборке. */
function vertex(a, b, c) {
  var x = -b / (2 * a);
  return { x: x, y: a * x * x + b * x + c };
}

/** Корни, если они есть. Дискриминант меньше нуля — пересечений нет. */
function roots(a, b, c) {
  var d = b * b - 4 * a * c;
  if (d < -EPS) { return []; }
  if (Math.abs(d) <= EPS) { return [-b / (2 * a)]; }
  var s = Math.sqrt(d);
  return [(-b - s) / (2 * a), (-b + s) / (2 * a)];
}

function create(a, b, c) {
  if (Math.abs(a) < EPS) { throw new Error('quadratic: a не может быть нулём'); }
  return { a: a, b: b, c: c };
}

function valueAt(p, x) {
  return p.a * x * x + p.b * x + p.c;
}

/**
 * Окно подбирается так, чтобы были видны вершина и пересечения с осями.
 * Ось симметрии не рисуется — это отдельное методическое решение.
 */
function windowFor(p) {
  var v = vertex(p.a, p.b, p.c);
  var points = [v, { x: 0, y: p.c }];
  roots(p.a, p.b, p.c).forEach(function (x) { points.push({ x: x, y: 0 }); });
  return fitWindow(points, BASE, MAX);
}

/* Парабола определена всюду: кусок ровно один, разрывов нет. */
registerCurve('quadratic', function (curve, win) {
  return sample(function (x) {
    return curve.a * x * x + curve.b * x + curve.c;
  }, win.xmin, win.xmax, STEPS);
});

/** Асимптот у параболы нет. */
function asymptotes() {
  return [];
}

var api = { BASE: BASE, MAX: MAX, create: create, vertex: vertex, roots: roots,
            valueAt: valueAt, windowFor: windowFor, asymptotes: asymptotes };

export default api;
export { create, vertex, roots, valueAt, windowFor, asymptotes };
