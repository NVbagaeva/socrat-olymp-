/* graph/families/line.js — семейство «прямая» y = kx + b.

   Слой 2 архитектуры: знает, какие коэффициенты допустимы, где прямая
   пересекает оси и другую прямую, какие целые точки лежат внутри окна
   и каким должно быть окно чертежа. Не знает ни про SVG, ни про
   формулировки задач, ни про блоки и наборы.

   Коэффициенты хранятся точными дробями: ответы вида 26,5 и −0,8
   должны получаться без накопления ошибки double.
*/

'use strict';

/* ══════════════════════════════════════════════════════════
   Рациональная арифметика
   ══════════════════════════════════════════════════════════ */
function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a; }

function frac(p, q) {
  q = q === undefined ? 1 : q;
  if (q === 0) { throw new Error('line: нулевой знаменатель'); }
  if (q < 0) { p = -p; q = -q; }
  var d = gcd(p, q) || 1;
  return { p: p / d, q: q / d };
}

function toFrac(value) {
  if (value && typeof value === 'object') { return frac(value.p, value.q); }
  if (Array.isArray(value)) { return frac(value[0], value[1]); }
  if (Number.isInteger(value)) { return frac(value, 1); }
  /* Десятичные коэффициенты приходят из данных: 0.5, −1.5 и подобные. */
  var q = 1;
  var v = value;
  while (!Number.isInteger(v) && q <= 1000) { v *= 10; q *= 10; }
  if (!Number.isInteger(v)) { throw new Error('line: не удалось представить ' + value + ' дробью'); }
  return frac(v, q);
}

function add(a, b) { return frac(a.p * b.q + b.p * a.q, a.q * b.q); }
function sub(a, b) { return frac(a.p * b.q - b.p * a.q, a.q * b.q); }
function mul(a, b) { return frac(a.p * b.p, a.q * b.q); }
function div(a, b) { if (b.p === 0) { throw new Error('line: деление на ноль'); } return frac(a.p * b.q, a.q * b.p); }
function num(a) { return a.p / a.q; }
function isInt(a) { return a.q === 1; }
function isZero(a) { return a.p === 0; }

/* ══════════════════════════════════════════════════════════
   Правила генерации (§4 ТЗ). Значения — в одном месте.
   ══════════════════════════════════════════════════════════ */
var RULES = {
  minAbsK:        1 / 3,   /* наклон читаем: |k| от 1/3 до 3          */
  maxAbsK:        3,
  minIntPoints:   2,       /* две целые точки внутри окна             */
  minSpanCells:   6,       /* размах по горизонтали, клеток           */
  windowDefault:  8,
  windowSteep:    5,       /* при |k| >= 2                            */
  steepK:         2,
  windowMin:      4,       /* дальше сужать окно бессмысленно         */
  minSlopeGap:    0.5,     /* различимость двух прямых по k           */
  minAngleDeg:    12,      /* и по углу между ними                    */
  bEdgeGap:       2        /* точка (0, b) не ближе к границе (блок 2)*/
};

/* ══════════════════════════════════════════════════════════
   Прямая
   ══════════════════════════════════════════════════════════ */
function create(k, b) {
  var K = toFrac(k);
  var B = toFrac(b);
  return {
    family: 'line',
    k: K, b: B,
    kValue: num(K), bValue: num(B)
  };
}

function yAt(line, x) { return add(mul(line.k, toFrac(x)), line.b); }

/* x, при котором f(x) = y. Для горизонтальной прямой не существует. */
function xForValue(line, y) {
  if (isZero(line.k)) { return null; }
  return div(sub(toFrac(y), line.b), line.k);
}

function axisIntersections(line) {
  return {
    y: { x: frac(0), y: line.b },                               /* с осью Oy */
    x: isZero(line.k) ? null : { x: xForValue(line, 0), y: frac(0) }  /* с осью Ox */
  };
}

/* Точка пересечения двух прямых: null, если параллельны. */
function intersect(a, b) {
  if (isZero(sub(a.k, b.k))) { return null; }
  var x = div(sub(b.b, a.b), sub(a.k, b.k));
  return { x: x, y: yAt(a, x) };
}

/* Целые точки прямой строго внутри окна: точка на самой границе
   наполовину срезается краем поля и опорной быть не может. */
function integerPoints(line, win, opts) {
  var border = !!(opts && opts.includeBorder);
  var edge = border ? 0 : 1;
  var points = [];
  for (var x = Math.ceil(win.xmin) + edge; x <= win.xmax - edge; x++) {
    var y = yAt(line, x);
    if (!isInt(y)) { continue; }
    var value = num(y);
    if (value < win.ymin + edge || value > win.ymax - edge) { continue; }
    points.push({ x: x, y: value });
  }
  return points;
}

/* Видимая часть прямой внутри окна: размахи и длина в клетках. */
function visiblePart(line, win) {
  var k = line.kValue;
  var b = line.bValue;
  var xs = [];

  [win.xmin, win.xmax].forEach(function (x) {
    var y = k * x + b;
    if (y >= win.ymin - 1e-9 && y <= win.ymax + 1e-9) { xs.push(x); }
  });
  if (Math.abs(k) > 1e-12) {
    [win.ymin, win.ymax].forEach(function (y) {
      var x = (y - b) / k;
      if (x >= win.xmin - 1e-9 && x <= win.xmax + 1e-9) { xs.push(x); }
    });
  }
  if (xs.length < 2) { return { spanX: 0, spanY: 0, length: 0 }; }

  var x1 = Math.min.apply(null, xs);
  var x2 = Math.max.apply(null, xs);
  var spanX = x2 - x1;
  var spanY = Math.abs(k) * spanX;
  return { spanX: spanX, spanY: spanY, length: Math.sqrt(spanX * spanX + spanY * spanY), x1: x1, x2: x2 };
}

/* Наибольший размах по горизонтали, какой вообще возможен при таком
   наклоне: у крутой прямой он меньше шести клеток чисто геометрически. */
function maxSpanX(line, win) {
  var full = win.xmax - win.xmin;
  var k = Math.abs(line.kValue);
  return k < 1e-12 ? full : Math.min(full, (win.ymax - win.ymin) / k);
}

/* Прямая проходит окно насквозь, а не задевает угол. */
function crossesWindow(line, win) {
  var part = visiblePart(line, win);
  if (part.length < RULES.minSpanCells - 1e-9) { return false; }
  var need = Math.min(RULES.minSpanCells, maxSpanX(line, win) - 1e-9);
  return part.spanX >= need - 1e-9;
}

/* Наклон читаем глазами: |k| от 1/3 до 3, почти вертикальные запрещены. */
function slopeReadable(line, opts) {
  var abs = Math.abs(line.kValue);
  if (abs < 1e-12) { return !!(opts && opts.allowZeroSlope); }
  return abs >= RULES.minAbsK - 1e-9 && abs <= RULES.maxAbsK + 1e-9;
}

/* Две прямые пересекаются под различимым на глаз углом. */
function distinguishable(a, b) {
  if (Math.abs(a.kValue - b.kValue) < RULES.minSlopeGap - 1e-9) { return false; }
  var angle = Math.abs(Math.atan(a.kValue) - Math.atan(b.kValue)) * 180 / Math.PI;
  return angle >= RULES.minAngleDeg - 1e-9;
}

/* Окно чертежа (§3): по умолчанию −8…8, при |k| >= 2 сужается до −5…5.
   Если прямая не проходит окно насквозь — окно сужается ещё на шаг.
   Не собралось — null, и вариант бракуется генератором. */
function windowFor(line, opts) {
  var start = Math.abs(line.kValue) >= RULES.steepK ? RULES.windowSteep : RULES.windowDefault;
  if (opts && opts.window) { start = opts.window; }

  for (var n = start; n >= RULES.windowMin; n--) {
    var win = { xmin: -n, xmax: n, ymin: -n, ymax: n };
    if (!crossesWindow(line, win)) { continue; }
    if (integerPoints(line, win).length < RULES.minIntPoints) { continue; }
    return win;
  }
  return null;
}

/* Две опорные точки: подальше друг от друга, но ближе к центру —
   так наклон читается по клеткам без прищуривания. */
function referencePoints(line, win) {
  var points = integerPoints(line, win);
  if (points.length < 2) { return null; }

  var best = null;
  for (var i = 0; i < points.length; i++) {
    for (var j = i + 1; j < points.length; j++) {
      var a = points[i];
      var b = points[j];
      var score = Math.min(Math.abs(b.x - a.x), 4) - 0.1 * (Math.abs(a.x) + Math.abs(b.x));
      if (!best || score > best.score + 1e-9) { best = { pair: [a, b], score: score }; }
    }
  }
  return best.pair;
}

module.exports = {
  RULES: RULES,
  frac: frac, toFrac: toFrac, add: add, sub: sub, mul: mul, div: div,
  num: num, isInt: isInt, isZero: isZero,
  create: create,
  yAt: yAt,
  xForValue: xForValue,
  axisIntersections: axisIntersections,
  intersect: intersect,
  integerPoints: integerPoints,
  referencePoints: referencePoints,
  visiblePart: visiblePart,
  crossesWindow: crossesWindow,
  slopeReadable: slopeReadable,
  distinguishable: distinguishable,
  windowFor: windowFor
};
