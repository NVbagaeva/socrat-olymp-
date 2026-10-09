/* families/quadratic.js — парабола y = ax² + bx + c.

   Математика семейства живёт здесь, рисует renderer.js, сцену
   описывают данные. Сэмплер встраивается штатным registerCurve —
   тело рендерера для этого править не нужно.

   Два слоя. Первый — числа double и сцена: им пользуются декоративные
   чертежи (миниатюры, теория). Второй — точные дроби: вершина, нули,
   значения, пересечения и правила читаемости для генератора задач.
   Дробная арифметика та же, что у прямой (families/line.js): ответы
   вида 0,5 и −1,25 должны получаться без накопления ошибки double.

   Обозначения единые на всю подтему: y = ax² + bx + c, вершина
   (m; n), формы записи — общая ax² + bx + c, через вершину
   a(x − m)² + n, через нули a(x − x₁)(x − x₂).
*/

'use strict';

import { registerCurve } from '../renderer.js';
import { fitWindow, sample, EPS } from './shared.js';
import Line from './line.js';

var frac = Line.frac, toFrac = Line.toFrac, add = Line.add, sub = Line.sub,
    mul = Line.mul, div = Line.div, num = Line.num, isInt = Line.isInt, isZero = Line.isZero;

var MINUS = '−';

/* Число в точную дробь: целое, десятичное, готовая дробь {p, q}
   или пара [p, q] из данных набора. */
function toExact(value) {
  if (Array.isArray(value)) { return frac(value[0], value[1]); }
  return toFrac(value);
}

/* ══════════════════════════════════════════════════════════
   Слой 1: числа и сцена
   ══════════════════════════════════════════════════════════ */

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

/* ══════════════════════════════════════════════════════════
   Слой 2: точные дроби. Правила генерации — в одном месте.
   ══════════════════════════════════════════════════════════ */
var RULES = {
  absAMin:       1 / 4,  /* парабола не плоская: |a| от 1/4 …            */
  absAMax:       3,      /* … и не игла: до 3                              */
  windowMin:     5,      /* окно подбирается от тесного к просторному      */
  windowMax:     8,
  vertexMargin:  1,      /* вершина не ближе клетки к рамке окна           */
  sidePoints:    1,      /* целых точек по каждую сторону от вершины       */
  edge:          1,      /* целая точка на самой рамке опорной не считается */

  /* Пересечение двух графиков: видимая точка — очевидная, скрытая —
     не угадывается продолжением графика. */
  crossMargin:       2,  /* видимая точка не ближе двух клеток к рамке      */
  crossOffscreenMin: 2,  /* скрытая точка вынесена за рамку не меньше чем на две клетки */
  crossAngleMin:     15  /* угол между кривыми в видимой точке, градусы     */
};

/**
 * Парабола точными дробями. Вершина считается сразу: m = −b/(2a),
 * n = c − b²/(4a). Числовые двойники aValue… нужны чертежу и meta.
 */
function exact(a, b, c) {
  var A = toExact(a);
  var B = toExact(b);
  var C = toExact(c);
  if (isZero(A)) { throw new Error('quadratic: a не может быть нулём'); }
  var m = div(B, mul(frac(-2), A));
  var n = sub(C, div(mul(B, B), mul(frac(4), A)));
  return {
    family: 'quadratic',
    a: A, b: B, c: C, m: m, n: n,
    aValue: num(A), bValue: num(B), cValue: num(C), mValue: num(m), nValue: num(n)
  };
}

/** Через вершину: y = a(x − m)² + n → b = −2am, c = am² + n. */
function fromVertex(a, m, n) {
  var A = toExact(a);
  var M = toExact(m);
  var N = toExact(n);
  var b = mul(frac(-2), mul(A, M));
  var c = add(mul(A, mul(M, M)), N);
  return exact(A, b, c);
}

/** Через нули: y = a(x − x₁)(x − x₂) → b = −a(x₁ + x₂), c = a·x₁·x₂. */
function fromRoots(a, x1, x2) {
  var A = toExact(a);
  var X1 = toExact(x1);
  var X2 = toExact(x2);
  return exact(A, mul(frac(-1), mul(A, add(X1, X2))), mul(A, mul(X1, X2)));
}

function yAt(p, x) {
  var X = toExact(x);
  return add(add(mul(p.a, mul(X, X)), mul(p.b, X)), p.c);
}

/* Целый квадратный корень или null. */
function isqrt(value) {
  if (value < 0) { return null; }
  var r = Math.round(Math.sqrt(value));
  return r * r === value ? r : null;
}

/* Рациональный корень из дроби: есть, только если числитель
   и знаменатель — точные квадраты. Иначе null. */
function rationalSqrt(f) {
  if (f.p < 0) { return null; }
  var sp = isqrt(f.p);
  var sq = isqrt(f.q);
  if (sp === null || sq === null) { return null; }
  return frac(sp, sq);
}

/**
 * Корни уравнения Ax² + Bx + C = 0 точными дробями, по возрастанию.
 * Нет действительных — пустой список; корни иррациональные — null:
 * такая задача не даёт конечного десятичного ответа и бракуется.
 */
function solve(A, B, C) {
  if (isZero(A)) {
    if (isZero(B)) { return isZero(C) ? null : []; }
    return [div(mul(frac(-1), C), B)];
  }
  var d = sub(mul(B, B), mul(frac(4), mul(A, C)));
  if (num(d) < 0) { return []; }
  var s = rationalSqrt(d);
  if (s === null) { return null; }
  var twoA = mul(frac(2), A);
  var x1 = div(sub(mul(frac(-1), B), s), twoA);
  var x2 = div(add(mul(frac(-1), B), s), twoA);
  if (isZero(s)) { return [x1]; }
  return num(x1) < num(x2) ? [x1, x2] : [x2, x1];
}

/** x, при которых f(x) = y: два, один или ни одного. */
function xForValue(p, y) {
  return solve(p.a, p.b, sub(p.c, toExact(y)));
}

/** Нули функции точными дробями. */
function rootsOf(p) {
  return xForValue(p, 0);
}

/** Пересечение с прямой y = kx + b: точки по возрастанию x. */
function intersectLine(p, line) {
  var xs = solve(p.a, sub(p.b, line.k), sub(p.c, line.b));
  if (xs === null) { return null; }
  return xs.map(function (x) { return { x: x, y: yAt(p, x) }; });
}

/** Пересечение двух парабол: точки по возрастанию x. */
function intersectParabola(p, q) {
  var xs = solve(sub(p.a, q.a), sub(p.b, q.b), sub(p.c, q.c));
  if (xs === null) { return null; }
  return xs.map(function (x) { return { x: x, y: yAt(p, x) }; });
}

/* ── Пересечение двух графиков ─────────────────────────────── */

/* Значение и наклон кривой в точке: парабола или прямая семейства line. */
function curveValue(part, x) {
  return part.kind === 'line'
    ? part.line.kValue * x + part.line.bValue
    : part.curve.aValue * x * x + part.curve.bValue * x + part.curve.cValue;
}

function curveSlope(part, x) {
  return part.kind === 'line' ? part.line.kValue : 2 * part.curve.aValue * x + part.curve.bValue;
}

/** Угол между кривыми в точке с абсциссой x, в градусах. */
function crossAngle(first, second, x) {
  var a1 = Math.atan(curveSlope(first, x));
  var a2 = Math.atan(curveSlope(second, x));
  return Math.abs(a1 - a2) * 180 / Math.PI;
}

/**
 * Кривые расходятся от видимой точки и на видимой части окна больше
 * не сближаются: зазор между ними по вертикали от видимой точки в
 * сторону скрытой не убывает, пока обе кривые в окне. Иначе вторая
 * точка читалась бы на глаз продолжением графика.
 */
function gapGrows(first, second, win, visible, hidden) {
  var dir = hidden.x > visible.x ? 1 : -1;
  var prev = 0;
  for (var t = 0; ; t += 0.1) {
    var x = visible.x + dir * t;
    if (x < win.xmin - 1e-9 || x > win.xmax + 1e-9) { break; }
    var f = curveValue(first, x);
    var g = curveValue(second, x);
    if (Math.abs(f) > win.ymax + 1e-9 || Math.abs(g) > win.ymax + 1e-9) { break; }
    var gap = Math.abs(f - g);
    if (gap < prev - 1e-9) { return false; }
    prev = gap;
  }
  return true;
}

/** На сколько клеток точка вынесена за рамку окна; внутри — ноль. */
function offscreenBy(point, win) {
  return Math.max(Math.abs(point.x) - win.xmax, Math.abs(point.y) - win.ymax, 0);
}

/* ── Читаемость на сетке ───────────────────────────────────── */

/* Целые точки параболы внутри окна: узлы сетки, через которые
   проходит кривая. Точка на самой рамке опорной быть не может. */
function integerPoints(p, win, opts) {
  var edge = opts && opts.includeBorder ? 0 : RULES.edge;
  var points = [];
  for (var x = Math.ceil(win.xmin) + edge; x <= win.xmax - edge; x++) {
    var y = yAt(p, x);
    if (!isInt(y)) { continue; }
    var value = num(y);
    if (value < win.ymin + edge || value > win.ymax - edge) { continue; }
    points.push({ x: x, y: value });
  }
  return points;
}

function pointInside(point, win, margin) {
  var m = margin === undefined ? 0 : margin;
  return point.x >= win.xmin + m - 1e-9 && point.x <= win.xmax - m + 1e-9 &&
         point.y >= win.ymin + m - 1e-9 && point.y <= win.ymax - m + 1e-9;
}

/** Вершина внутри окна и не ближе margin клеток к рамке. */
function vertexInside(p, win, margin) {
  return pointInside({ x: p.mValue, y: p.nValue }, win,
    margin === undefined ? RULES.vertexMargin : margin);
}

/**
 * Парабола читается на сетке: вершина видна с запасом, и по каждую
 * сторону от неё ветвь проходит хотя бы через один узел сетки внутри
 * окна — то есть не уходит за рамку раньше, чем ученик увидит вершину
 * и ещё одну точку слева и справа.
 */
function readable(p, win, opts) {
  var margin = opts && opts.vertexMargin !== undefined ? opts.vertexMargin : RULES.vertexMargin;
  var need = opts && opts.sidePoints !== undefined ? opts.sidePoints : RULES.sidePoints;
  if (!vertexInside(p, win, margin)) { return false; }
  var points = integerPoints(p, win);
  var left = 0;
  var right = 0;
  points.forEach(function (point) {
    if (point.x < p.mValue - 1e-9) { left++; }
    if (point.x > p.mValue + 1e-9) { right++; }
  });
  return left >= need && right >= need;
}

function windowOf(half) {
  return { xmin: -half, xmax: half, ymin: -half, ymax: half };
}

/**
 * Окно чертежа: квадратное симметричное, как у прямой, от тесного
 * к просторному — клетка крупнее, а вершина и ветви уже читаются.
 * opts.window задаёт окно жёстко. Не собралось — null.
 */
function windowForExact(p, opts) {
  var o = opts || {};
  if (o.window) {
    var fixed = windowOf(o.window);
    return readable(p, fixed, o) ? fixed : null;
  }
  var from = o.windowMin || RULES.windowMin;
  var to = o.windowMax || RULES.windowMax;
  for (var half = from; half <= to; half++) {
    var win = windowOf(half);
    if (readable(p, win, o)) { return win; }
  }
  return null;
}

/* ── Запись формулы ────────────────────────────────────────── */

/* Число для формулы: запятая и типографский минус. */
function numberText(f) {
  return String(num(f)).replace('.', ',').replace('-', MINUS);
}

/* Коэффициент перед x или x²: 1 и −1 не пишутся. */
function coefficientText(f) {
  if (f.q === 1 && f.p === 1) { return ''; }
  if (f.q === 1 && f.p === -1) { return MINUS; }
  return numberText(f);
}

/* Слагаемое со знаком внутри суммы: « + 3», « − 3», у нуля — пусто. */
function signedTerm(f, tail) {
  if (isZero(f)) { return ''; }
  var abs = frac(Math.abs(f.p), f.q);
  var body = tail ? coefficientText(abs) + tail : numberText(abs);
  return (f.p > 0 ? ' + ' : ' ' + MINUS + ' ') + body;
}

/* Скобка (x − m): при m < 0 знак меняется, при m = 0 остаётся x. */
function shiftText(m) {
  if (isZero(m)) { return 'x'; }
  var abs = frac(Math.abs(m.p), m.q);
  return '(x ' + (m.p > 0 ? MINUS : '+') + ' ' + numberText(abs) + ')';
}

/**
 * Формула параболы обычным текстом, для набора math.html: общая
 * форма, через вершину или через нули. Квадрат — знаком ², его
 * набор формул переводит в ^2 для KaTeX.
 */
function equationText(p, form) {
  var left = 'y = ';
  if (form === 'vertex') {
    var shift = shiftText(p.m);
    var square = shift === 'x' ? 'x²' : shift + '²';
    return left + coefficientText(p.a) + square + signedTerm(p.n);
  }
  if (form === 'roots') {
    var xs = rootsOf(p);
    if (xs === null || xs.length !== 2) {
      throw new Error('quadratic: форма через нули требует двух нулей');
    }
    return left + coefficientText(p.a) + shiftText(xs[0]) + shiftText(xs[1]);
  }
  var head = coefficientText(p.a) + 'x²';
  var body = head + signedTerm(p.b, 'x') + signedTerm(p.c);
  return left + body;
}

/* Формы записи, которые умеет генератор. */
var FORMS = ['general', 'vertex', 'roots'];

var api = {
  BASE: BASE, MAX: MAX, RULES: RULES, FORMS: FORMS, toExact: toExact,
  create: create, vertex: vertex, roots: roots, valueAt: valueAt, windowFor: windowFor,
  asymptotes: asymptotes,
  exact: exact, fromVertex: fromVertex, fromRoots: fromRoots, yAt: yAt, solve: solve,
  xForValue: xForValue, rootsOf: rootsOf, intersectLine: intersectLine,
  intersectParabola: intersectParabola, integerPoints: integerPoints,
  pointInside: pointInside, vertexInside: vertexInside, readable: readable,
  windowOf: windowOf, windowForExact: windowForExact,
  curveValue: curveValue, curveSlope: curveSlope, crossAngle: crossAngle, gapGrows: gapGrows,
  offscreenBy: offscreenBy,
  equationText: equationText, coefficientText: coefficientText, signedTerm: signedTerm,
  numberText: numberText
};

export default api;
export { create, vertex, roots, valueAt, windowFor, asymptotes,
         RULES, FORMS, toExact, exact, fromVertex, fromRoots, yAt, solve, xForValue, rootsOf,
         intersectLine, intersectParabola, integerPoints, pointInside, vertexInside, readable,
         windowOf, windowForExact, curveValue, curveSlope, crossAngle, gapGrows, offscreenBy,
         equationText, coefficientText, signedTerm, numberText };
