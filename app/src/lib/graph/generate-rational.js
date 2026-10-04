/* generate-rational.js — сборка вариантов задач о гиперболе.

   Внутри движка гипербола одна: y = m/(x − s) + t, вертикальная
   асимптота x = s, горизонтальная y = t. Четыре записи из условий —
   это та же кривая с разными буквами (буквы a и b в разных записях
   означают разное, поэтому их значения считает только coefficients()):

     basic    f(x) = k/x                 k = m
     shift-y  f(x) = k/x + a             k = m,  a = t       (вверх-вниз)
     shift-x  f(x) = k/(x + a)           k = m,  a = −s      (влево-вправо)
     shift-xy f(x) = k/(x + a) + b       k = m,  a = −s, b = t
     linear   f(x) = (kx + a)/(x + b)    k = t,  b = −s, a = m − t·s
                                         (целая часть: k + (a − kb)/(x + b))
     line     f(x) = k/x и g(x) = ax + b — гипербола и прямая

   Правила читаемости:
     • асимптоты — в узлах сетки (s и t целые), не ближе трёх клеток
       к рамке; окно квадратное, полуширина от 6 до 8;
     • отмеченные точки — в узлах сетки на самой кривой, не ближе
       клетки к рамке и не на осях; значит m целое;
     • |m| из списка mAbs (по умолчанию 1…12 без 7 и 11: у них
       узлов на кривой только по два на ветвь у самой асимптоты);
     • всё, что идёт в ответ, — целое или конечная десятичная дробь.

   Правила ответа (task.answerRule): value-at, argument-for, coef-k,
   coef-a, coef-b, coef-sum (k + a + b), cross-x, cross-y, line-a и
   line-b (коэффициенты прямой g). В шаблон условия подставляются
   {x0}, {y0}, {equation}, {line} и коэффициенты записи {k}, {a}, {b}.

   Ограничения задачи (task.constraints):
     mAbs, mSign: 'positive' | 'negative'
     sAbsMax, tAbsMax, sNonZero, tNonZero  — асимптоты
     marks: число отмеченных точек (1 или 2), branches: 'both' | 'one'
     answerKind: 'integer' | 'decimal'   — ответ целый или нецелый (уровни)
     query: { type: 'value-at' | 'argument-for',
              kind: 'integer' | 'decimal' | 'mixed' | 'any', decimals }
     line:  { absMin, absMax }               — наклон прямой (тип «гипербола и прямая»)
     intersection: { axis: 'x' | 'y', offscreenMin }  — B всегда за рамкой,
                   не ближе offscreenMin клеток (по умолчанию 3) по x или по y
*/

'use strict';

import renderer from './renderer.js';
import math from './math.js';
import Line from './families/line.js';
import Rational from './families/rational.js';
import { rng, shuffled } from './random.js';
import { plainText, typesetText, fillTemplate, answerText, decimalFriendly } from './text.js';

var frac = Line.frac, add = Line.add, sub = Line.sub, mul = Line.mul, div = Line.div,
    num = Line.num, isInt = Line.isInt, isZero = Line.isZero, toFrac = Line.toFrac;

var MINUS = '−';
var CANDIDATE_POOL = 120;
var HALF_MIN = 6;
var HALF_MAX = 8;
var ASYMPTOTE_MARGIN = 3;
var POINT_MARGIN = 1;
var M_ABS = [1, 2, 3, 4, 5, 6, 8, 9, 10, 12];
var ANSWER_MAX = 100;
var OFFSCREEN_MIN = 3;
var LINE_VISIBLE_MIN = 6;  /* видимая часть прямой, клеток, не меньше */     /* на сколько клеток B уходит за рамку, не меньше */

/* ══════════════════════════════════════════════════════════
   Числа
   ══════════════════════════════════════════════════════════ */
function key(f) { return String(Math.round(num(f) * 1e6) / 1e6); }

/** Сколько знаков после запятой у конечной десятичной дроби. */
function places(f) {
  if (!decimalFriendly(f)) { return Infinity; }
  var n = 0;
  var v = Math.abs(num(f));
  while (Math.abs(v - Math.round(v)) > 1e-9 && n < 8) { v *= 10; n++; }
  return n;
}

/**
 * Число в условие: запятая и типографский минус; трети — смешанной
 * дробью «6⅓», как их пишут в задачах. Другие несократимые дроби
 * в условия не попадают: генератор их отбраковывает.
 */
function valueText(f) {
  var sign = f.p < 0 ? MINUS : '';
  if (f.q === 3) {
    var whole = Math.floor(Math.abs(f.p) / 3);
    var rest = Math.abs(f.p) % 3;
    return sign + (whole === 0 ? '' : whole) + (rest === 1 ? '⅓' : '⅔');
  }
  return sign + String(Math.abs(Math.round(num(f) * 1e6) / 1e6)).replace('.', ',');
}

/* ══════════════════════════════════════════════════════════
   Кривая и её коэффициенты в каждой записи
   ══════════════════════════════════════════════════════════ */
function curve(m, s, t) {
  var M = toFrac(m), S = toFrac(s), T = toFrac(t);
  return { m: M, s: S, t: T, mValue: num(M), sValue: num(S), tValue: num(T) };
}

function valueAt(c, x) {
  var d = sub(x, c.s);
  if (isZero(d)) { return null; }
  return add(div(c.m, d), c.t);
}

/** Коэффициенты записи условия. Буквы у каждой записи свои. */
function coefficients(c, form) {
  if (form === 'basic' || form === 'line') { return { k: c.m }; }
  if (form === 'shift-y') { return { k: c.m, a: c.t }; }
  if (form === 'shift-x') { return { k: c.m, a: mul(frac(-1), c.s) }; }
  if (form === 'shift-xy') { return { k: c.m, a: mul(frac(-1), c.s), b: c.t }; }
  if (form === 'linear') {
    return { k: c.t, b: mul(frac(-1), c.s), a: sub(c.m, mul(c.t, c.s)) };
  }
  throw new Error('generate-rational: неизвестная запись «' + form + '»');
}

/** Шаблон записи в условии, буквами. */
var FORM_TEXT = {
  basic: 'f(x) = k/x',
  'shift-y': 'f(x) = k/x + a',
  'shift-x': 'f(x) = k/(x + a)',
  'shift-xy': 'f(x) = k/(x + a) + b',
  linear: 'f(x) = (kx + a)/(x + b)',
  line: 'f(x) = k/x'
};

/* Слагаемое со знаком: « + 3», « − 0,5». */
function signed(f) {
  if (isZero(f)) { return ''; }
  return (f.p > 0 ? ' + ' : ' − ') + valueText(frac(Math.abs(f.p), f.q));
}

/** Формула с числами, обычной строкой: «f(x) = 3/(x − 2) + 1». */
function equationText(c, form) {
  var co = coefficients(c, form);
  var k = valueText(co.k);
  if (form === 'basic' || form === 'line') { return 'f(x) = ' + k + '/x'; }
  if (form === 'shift-y') { return 'f(x) = ' + k + '/x' + signed(co.a); }
  if (form === 'shift-x') { return 'f(x) = ' + k + '/(x' + signed(co.a) + ')'; }
  if (form === 'shift-xy') { return 'f(x) = ' + k + '/(x' + signed(co.a) + ')' + signed(co.b); }
  var kx = isInt(co.k) && co.k.p === 1 ? 'x' : (isInt(co.k) && co.k.p === -1 ? '−x' : k + 'x');
  return 'f(x) = (' + kx + signed(co.a) + ')/(x' + signed(co.b) + ')';
}

/* ══════════════════════════════════════════════════════════
   Окно и отмеченные точки
   ══════════════════════════════════════════════════════════ */
/** Целый ответ, десятичный или любой: так уровни задач различаются числами. */
function answerKindOk(value, kind) {
  if (places(value) > 2) { return false; }
  if (kind === 'integer') { return isInt(value); }
  if (kind === 'decimal') { return !isInt(value); }
  return true;
}

function windowOf(half) { return { xmin: -half, xmax: half, ymin: -half, ymax: half }; }

function inside(x, y, win, margin) {
  return Math.abs(x) <= win.xmax - margin + 1e-9 && Math.abs(y) <= win.ymax - margin + 1e-9;
}

/** Узлы сетки на кривой: x = s + d, где d делит m. */
function gridNodes(c) {
  var out = [];
  if (!isInt(c.m) || !isInt(c.s) || !isInt(c.t)) { return out; }
  var m = Math.abs(c.m.p);
  for (var d = 1; d <= m; d++) {
    if (m % d !== 0) { continue; }
    [d, -d].forEach(function (dd) {
      var x = c.sValue + dd;
      var y = c.tValue + c.mValue / dd;
      out.push({ x: x, y: y, d: dd });
    });
  }
  return out;
}

/* Точка у изгиба читается лучше, чем у самой асимптоты: там кривая
   почти прямая, и узел легко спутать с соседним. */
function bendScore(c, node) {
  var dx = Math.abs(node.d);
  var dy = Math.abs(c.mValue / node.d);
  return -Math.abs(Math.log(dx / dy));
}

function usableNodes(c, win) {
  return gridNodes(c).filter(function (node) {
    if (!inside(node.x, node.y, win, POINT_MARGIN)) { return false; }
    /* На осях точка садится на подпись деления и путается с ней. */
    if (node.x === 0 || node.y === 0) { return false; }
    return true;
  });
}

function chooseMarks(c, win, count, branches, random) {
  var nodes = usableNodes(c, win);
  if (nodes.length < count) { return null; }
  var ranked = shuffled(nodes, random).sort(function (u, v) {
    return bendScore(c, v) - bendScore(c, u);
  });
  if (count === 1) { return [ranked[0]]; }
  /* Две точки: на разных ветвях, если набор так просит, иначе любые
     две различные; вторая — тоже не у самой асимптоты. */
  var first = ranked[0];
  var rest = ranked.slice(1).filter(function (node) {
    var other = (node.d > 0) !== (first.d > 0);
    if (branches === 'both') { return other; }
    if (branches === 'one') { return !other; }
    return true;
  });
  if (!rest.length) { return null; }
  return [first, rest[0]];
}

function windowFor(c, constraints) {
  var min = constraints.windowMin || HALF_MIN;
  var max = constraints.windowMax || HALF_MAX;
  for (var half = min; half <= max; half++) {
    var win = windowOf(half);
    if (Math.abs(c.sValue) > half - ASYMPTOTE_MARGIN) { continue; }
    if (Math.abs(c.tValue) > half - ASYMPTOTE_MARGIN) { continue; }
    /* Обе ветви должны проходить хотя бы через один узел внутри окна:
       иначе ветвь на чертеже есть, а опереться на ней не на что. */
    var nodes = usableNodes(c, win);
    var right = nodes.some(function (n) { return n.d > 0; });
    var left = nodes.some(function (n) { return n.d < 0; });
    if (!right || !left) { continue; }
    return win;
  }
  return null;
}

/* ══════════════════════════════════════════════════════════
   Запросы: f(x₀) и x по значению
   ══════════════════════════════════════════════════════════ */
var X_INTEGER = [7, 8, 9, 10, 12, 14, 15, 16, 18, 20, 24, 25, 30, 40, 50];
var X_DECIMAL = [[1, 4], [1, 2], [3, 4], [5, 4], [3, 2], [5, 2], [7, 2], [9, 2], [15, 2],
                 [1, 5], [2, 5], [4, 5], [6, 5], [8, 5], [12, 5], [11, 4], [13, 4]];
var X_MIXED_WHOLE = [1, 2, 3, 4, 5, 6, 7, 8, 9];

function argumentPool(kind) {
  var out = [];
  function both(f) { out.push(f); out.push(mul(frac(-1), f)); }
  if (kind === 'integer' || kind === 'any') { X_INTEGER.forEach(function (v) { both(frac(v)); }); }
  if (kind === 'decimal' || kind === 'any') {
    X_DECIMAL.forEach(function (v) { both(frac(v[0], v[1])); });
  }
  if (kind === 'mixed' || kind === 'any') {
    X_MIXED_WHOLE.forEach(function (w) { both(frac(3 * w + 1, 3)); both(frac(3 * w + 2, 3)); });
  }
  return out;
}

var C_INTEGER = [-12, -10, -9, -8, -6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 8, 9, 10, 12];
var C_DECIMAL = [[1, 5], [1, 4], [2, 5], [1, 2], [3, 5], [3, 4], [4, 5], [5, 4], [3, 2],
                 [5, 2], [7, 2], [9, 2], [6, 5], [8, 5]];

function valuePool(kind) {
  var out = [];
  if (kind === 'integer' || kind === 'any') { C_INTEGER.forEach(function (v) { out.push(frac(v)); }); }
  if (kind === 'decimal' || kind === 'any') {
    C_DECIMAL.forEach(function (v) { out.push(frac(v[0], v[1])); out.push(frac(-v[0], v[1])); });
  }
  return out;
}

/* С чертежа ответ читаться не должен: целая точка в окне — это уже
   не вычисление, а чтение по клеткам. */
function readable(x, y, win) {
  return isInt(x) && isInt(y) && inside(num(x), num(y), win, 0);
}

function queryCandidates(c, win, spec) {
  var decimals = spec.decimals === undefined ? 2 : spec.decimals;
  var kind = spec.kind || 'any';
  var out = [];
  if (spec.type === 'value-at') {
    argumentPool(kind).forEach(function (x0) {
      var y = valueAt(c, x0);
      if (y === null || places(y) > decimals || Math.abs(num(y)) > ANSWER_MAX) { return; }
      if (readable(x0, y, win)) { return; }
      out.push({ type: 'value-at', x0: x0, answer: y });
    });
  } else if (spec.type === 'argument-for') {
    valuePool(kind).forEach(function (y0) {
      var d = sub(y0, c.t);
      if (isZero(d)) { return; }
      var x = add(c.s, div(c.m, d));
      if (places(x) > decimals || Math.abs(num(x)) > ANSWER_MAX) { return; }
      if (readable(x, y0, win)) { return; }
      out.push({ type: 'argument-for', y0: y0, answer: x });
    });
  } else {
    throw new Error('generate-rational: неизвестный запрос «' + spec.type + '»');
  }
  return out;
}

/* ══════════════════════════════════════════════════════════
   Одиночная гипербола
   ══════════════════════════════════════════════════════════ */
function range(maxAbs, nonZero) {
  var out = [];
  for (var v = -maxAbs; v <= maxAbs; v++) {
    if (nonZero && v === 0) { continue; }
    out.push(v);
  }
  return out;
}

function mCandidates(constraints) {
  var list = [];
  (constraints.mAbs || M_ABS).forEach(function (v) {
    if (constraints.mSign !== 'negative') { list.push(v); }
    if (constraints.mSign !== 'positive') { list.push(-v); }
  });
  return list;
}

/* Какие асимптоты сдвинуты — задаёт запись. */
function shiftRules(form, constraints) {
  var sFixed = form === 'basic' || form === 'shift-y';
  var tFixed = form === 'basic' || form === 'shift-x';
  return {
    s: sFixed ? [0] : range(constraints.sAbsMax || 4, true),
    t: tFixed ? [0] : range(constraints.tAbsMax || 4, true)
  };
}

function answerOf(rule, c, form, query) {
  var co = coefficients(c, form);
  if (rule === 'coef-k') { return co.k; }
  if (rule === 'coef-a') { return co.a; }
  if (rule === 'coef-b') { return co.b; }
  if (rule === 'coef-sum') { return add(add(co.k, co.a), co.b); }
  if (query) { return query.answer; }
  throw new Error('generate-rational: нечем ответить на «' + rule + '»');
}

function singleCandidates(task, set, seed) {
  var constraints = task.constraints || {};
  var form = task.form || set.form;
  var base = set.id + ':' + task.id + ':' + seed;
  var random = rng(base);
  var shifts = shiftRules(form, constraints);
  var found = [];

  shuffled(mCandidates(constraints), random).forEach(function (m) {
    shuffled(shifts.s, random).forEach(function (s) {
      shuffled(shifts.t, random).forEach(function (t) {
        var c = curve(m, s, t);
        var co = coefficients(c, form);
        /* У (kx + a)/(x + b) нулевое a — уже другая запись, kx/(x + b). */
        if (form === 'linear' && isZero(co.a)) { return; }
        var win = windowFor(c, constraints);
        if (!win) { return; }
        var sig = m + '@' + s + ';' + t;
        var marks = chooseMarks(c, win, constraints.marks || 1, constraints.branches || 'any',
          rng(base + ':marks:' + sig));
        if (!marks) { return; }

        var query = null;
        if (constraints.query) {
          var pool = queryCandidates(c, win, constraints.query);
          if (!pool.length) { return; }
          query = pool[Math.floor(rng(base + ':query:' + sig)() * pool.length)];
        }
        var answer = answerOf(task.answerRule, c, form, query);
        if (!answerKindOk(answer, constraints.answerKind)) { return; }

        found.push({
          kind: 'single', form: form, curve: c, window: win, query: query,
          points: marks.map(function (node) { return { x: node.x, y: node.y, role: 'mark' }; }),
          answer: answer,
          answerKey: 'ans:' + key(answer),
          pairKey: 'r:' + sig,
          slopeKey: 'm:' + m,
          interceptKey: 'st:' + s + ';' + t,
          score: random()
        });
      });
    });
  });

  return found.slice(0, CANDIDATE_POOL);
}

/* ══════════════════════════════════════════════════════════
   Гипербола и прямая: f(x) = k/x, g(x) = ax + b
   A — общая точка в узле сетки, P — ещё одна точка прямой в узле.
   Вторая точка B: из ax² + bx − k = 0 по Виету x_A·x_B = −k/a,
   значит x_B = −k/(a·x_A), а y_B = k/x_B = −a·x_A.
   ══════════════════════════════════════════════════════════ */
function offscreen(B, win, min) {
  return Math.abs(num(B.x)) >= win.xmax + min - 1e-9 || Math.abs(num(B.y)) >= win.ymax + min - 1e-9;
}

function crossOf(k, line, xA) {
  var xB = div(mul(frac(-1), k), mul(line.k, xA));
  var yB = div(k, xB);
  return { x: xB, y: yB };
}

function lineCandidates(task, set, seed) {
  var constraints = task.constraints || {};
  var spec = constraints.line || {};
  var cross = constraints.intersection || {};
  var axis = cross.axis || 'x';
  var offscreenMin = cross.offscreenMin === undefined ? OFFSCREEN_MIN : cross.offscreenMin;
  var base = set.id + ':' + task.id + ':' + seed;
  var random = rng(base);
  var absMin = spec.absMin === undefined ? 0.25 : spec.absMin;
  var absMax = spec.absMax === undefined ? 4 : spec.absMax;
  var found = [];

  shuffled(mCandidates(constraints), random).forEach(function (m) {
    var c = curve(m, 0, 0);
    var win = windowFor(c, constraints);
    if (!win) { return; }
    var nodes = shuffled(usableNodes(c, win), random);
    nodes.forEach(function (A) {
      /* P — узел сетки в окне, не на гиперболе и не на осях. */
      for (var px = -win.xmax + POINT_MARGIN; px <= win.xmax - POINT_MARGIN; px++) {
        for (var py = -win.ymax + POINT_MARGIN; py <= win.ymax - POINT_MARGIN; py++) {
          if (px === A.x || px === 0 || py === 0) { continue; }
          if (px * py === m) { continue; }
          if (Math.abs(px - A.x) < 2 && Math.abs(py - A.y) < 2) { continue; }
          var slope = frac(py - A.y, px - A.x);
          var abs = Math.abs(num(slope));
          if (isZero(slope) || abs < absMin - 1e-9 || abs > absMax + 1e-9) { continue; }
          var line = { k: slope, b: sub(frac(A.y), mul(slope, frac(A.x))) };
          /* Прямая на чертеже — не огрызок в углу: видимая часть
             не короче LINE_VISIBLE_MIN клеток. */
          if (Line.visiblePart({ kValue: num(line.k), bValue: num(line.b) }, win).length <
              LINE_VISIBLE_MIN) { continue; }
          /* b = 0: B симметрична A относительно начала координат и
             читается без вычислений. */
          if (isZero(line.b)) { continue; }
          var B = crossOf(c.m, line, frac(A.x));
          if (key(B.x) === key(frac(A.x))) { continue; }
          var asked = task.answerRule === 'line-a' ? line.k
            : task.answerRule === 'line-b' ? line.b
            : axis === 'x' ? B.x : B.y;
          if (!answerKindOk(asked, constraints.answerKind) || Math.abs(num(asked)) > 40) { continue; }
          /* Наклон и свободный член прямой — тоже конечные дроби:
             в разборе они идут в уравнение. */
          if (places(line.k) > 2 || places(line.b) > 2) { continue; }
          /* B на рисунке не видна никогда: её координаты не должны
             читаться с чертежа. Она заметно за рамкой — не ближе
             offscreenMin клеток за границей по x или по y. */
          if (!offscreen(B, win, offscreenMin)) { continue; }
          /* P не должна случайно совпасть с B или лежать на продолжении
             через начало: на чертеже это путает. */
          if (key(B.x) === String(px)) { continue; }

          var sig = m + '|' + A.x + ';' + A.y + '|' + px + ';' + py;
          found.push({
            kind: 'line', form: 'line', curve: c, window: win, line: line,
            points: [{ x: A.x, y: A.y, role: 'cross', label: 'A' },
                     { x: px, y: py, role: 'line' }],
            intersection: { A: { x: A.x, y: A.y }, B: B, axis: axis },
            answer: asked,
            answerKey: 'ans:' + key(asked),
            pairKey: 'rl:' + sig,
            slopeKey: 'm:' + m,
            interceptKey: 'l:' + key(line.k) + ';' + key(line.b),
            score: random()
          });
        }
      }
    });
  });

  /* Перебор даёт тысячи прямых у одной гиперболы: перемешиваем по
     seed и ограничиваем, чтобы каждая гипербола попала в пул. */
  var perM = {};
  return shuffled(found, random).filter(function (cand) {
    perM[cand.slopeKey] = (perM[cand.slopeKey] || 0) + 1;
    return perM[cand.slopeKey] <= 12;
  }).slice(0, CANDIDATE_POOL);
}

function candidates(task, set, seed) {
  var form = task.form || set.form;
  if (!form) { throw new Error('generate-rational: у ' + task.id + ' не задана запись функции'); }
  return form === 'line' ? lineCandidates(task, set, seed) : singleCandidates(task, set, seed);
}

/* ══════════════════════════════════════════════════════════
   Сцена чертежа
   ══════════════════════════════════════════════════════════ */
function sceneFor(built, task, set) {
  var c = built.curve;
  var win = built.window;
  var hyper = { k: c.mValue, a: -c.sValue, b: c.tValue };
  /* Как в ЕГЭ: кривые не подписаны, подписана только точка A. */
  var curves = [{ type: 'rational', k: hyper.k, a: hyper.a, b: hyper.b, color: 'lineA',
                  label: null }];
  if (built.kind === 'line') {
    curves.push({ type: 'line', k: num(built.line.k), b: num(built.line.b), color: 'lineB',
                  label: null });
  }
  var points = built.points.map(function (point) {
    return { x: point.x, y: point.y, style: 'solid',
             color: point.role === 'cross' ? 'cross' : (point.role === 'line' ? 'lineB' : 'lineA'),
             label: point.label || null };
  });
  return {
    window: win,
    grid: { step: 1, show: true },
    axes: { labelX: 'x', labelY: 'y', origin: '0' },
    labelRules: 'strict',
    axisLabels: task.axisLabels || set.axisLabels || 'minimal',
    curves: curves,
    points: points,
    shapes: Rational.asymptotes(hyper, win),
    alt: built.kind === 'line' ? 'Графики гиперболы и прямой' : 'График гиперболы'
  };
}

/* ══════════════════════════════════════════════════════════
   Итог задачи
   ══════════════════════════════════════════════════════════ */
function lineText(line) {
  var k = line.k, b = line.b;
  var slope = isInt(k) && k.p === 1 ? 'x' : (isInt(k) && k.p === -1 ? '−x' : valueText(k) + 'x');
  return 'g(x) = ' + slope + signed(b);
}

function exactMeta(f) { return { p: f.p, q: f.q }; }

function result(set, task, built, seed) {
  var form = built.form;
  var c = built.curve;
  var query = built.query;
  var values = {
    form: FORM_TEXT[form],
    equation: equationText(c, form),
    x0: query && query.x0 ? valueText(query.x0) : '',
    y0: query && query.y0 ? valueText(query.y0) : '',
    line: built.line ? lineText(built.line) : ''
  };
  var co = coefficients(c, form);
  /* Известные коэффициенты для условий вида «f(x) = 4/x + a»:
     число подставляется в шаблон как {k}, {a}, {b}. */
  Object.keys(co).forEach(function (name) { values[name] = valueText(co[name]); });
  var coMeta = {};
  Object.keys(co).forEach(function (name) { coMeta[name] = exactMeta(co[name]); });

  return {
    id: task.id,
    kind: set.kind,
    svg: task.noChart ? null : renderer.renderGraph(sceneFor(built, task, set)),
    question: plainText(fillTemplate(task.question, values)),
    questionHtml: typesetText(fillTemplate(task.question, values)),
    hint: task.hint ? plainText(fillTemplate(task.hint, values)) : null,
    hintHtml: task.hint ? typesetText(fillTemplate(task.hint, values)) : null,
    answer: answerText(built.answer),
    answerHtml: math.html(answerText(built.answer)),
    options: null,
    answerType: 'number',
    level: task.level || null,
    levelReason: task.levelReason || null,
    meta: {
      family: 'rational',
      set: set.id,
      seed: seed,
      form: form,
      rule: task.answerRule,
      answer: exactMeta(built.answer),
      /* Гипербола в общем виде: m/(x − s) + t. */
      m: exactMeta(c.m), s: exactMeta(c.s), t: exactMeta(c.t),
      coefficients: coMeta,
      equation: values.equation,
      window: built.window,
      points: built.points.map(function (point) {
        return { x: point.x, y: point.y, role: point.role, label: point.label || null };
      }),
      query: query ? { type: query.type,
                       x0: query.x0 ? exactMeta(query.x0) : null,
                       y0: query.y0 ? exactMeta(query.y0) : null,
                       answer: exactMeta(query.answer) } : null,
      line: built.line ? { k: exactMeta(built.line.k), b: exactMeta(built.line.b),
                           text: values.line } : null,
      intersection: built.intersection ? {
        axis: built.intersection.axis,
        A: built.intersection.A,
        B: { x: exactMeta(built.intersection.B.x), y: exactMeta(built.intersection.B.y) }
      } : null,
      level: task.level || null
    }
  };
}

const api = {
  candidates: candidates,
  result: result,
  coefficients: coefficients,
  equationText: equationText,
  valueText: valueText,
  valueAt: valueAt,
  curve: curve,
  FORM_TEXT: FORM_TEXT
};

export default api;
export { candidates, result, coefficients, equationText, valueText, valueAt, curve, FORM_TEXT };
