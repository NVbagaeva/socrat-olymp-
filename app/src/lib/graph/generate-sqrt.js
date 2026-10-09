/* generate-sqrt.js — сборка вариантов задач о графике корня.

   Внутри движка кривая одна: y = k·√(x − x₀) + y₀, начало графика —
   точка (x₀; y₀) в узле сетки. Три записи из условий:

     basic   f(x) = k√x                    начало в (0; 0) — прототип ФИПИ
     shift   f(x) = k√(x − x₀) + y₀        начало в узле (x₀; y₀)
     line    f(x) = k√x и g(x) = ax + b    корень и прямая

   Правила читаемости:
     • k кратно 1/2, 0 < |k| ≤ 3 (список kAbs);
     • на графике жирно отмечены целые точки (x₀ + n²; y₀ + k·n),
       n = 1, 2, 3, — по ним находится k; хотя бы одна в окне, не
       ближе клетки к рамке; начало сдвинутого графика тоже отмечено;
     • окно квадратное, полуширина от 6 до 8;
     • всё, что идёт в ответ, — целое или конечная десятичная дробь
       не длиннее двух знаков;
     • ответ задач на f(x₀) и на x по значению не читается с рисунка.

   Правила ответа (task.answerRule): coef-k, value-at, argument-for,
   cross-x, cross-y, line-a, line-b. В шаблон условия подставляются
   {x0} — аргумент запроса, {y0} — значение запроса.

   Ограничения задачи (task.constraints):
     kAbs, kSign: 'positive' | 'negative'
     x0Abs, y0Abs — насколько далеко от начала координат может стоять
                    начало сдвинутого графика (по умолчанию 3)
     answerKind: 'integer' | 'decimal'
     query: { type: 'value-at' | 'argument-for', kind: 'integer' | 'decimal' | 'any' }
     line:  { absMin, absMax }           — наклон прямой
     intersection: { axis: 'x' | 'y', offscreenMin } — спрошенная координата B
                   не читается: B за рамкой или эта координата нецелая

   Пересечение корня и прямой: замена t = √x, t ≥ 0, даёт
   a·t² − k·t + b = 0. Один корень известен — t_A = √x_A у точки A,
   второй по Виету: t_B = k/a − t_A. Точка B существует, только если
   t_B > 0. Её координаты только вычисляются: она за рамкой, или
   спрошенная координата нецелая и с клеток не снимается.
*/

'use strict';

import renderer from './renderer.js';
import math from './math.js';
import Line from './families/line.js';
import './families/sqrt.js';
import { rng, shuffled } from './random.js';
import { plainText, typesetText, fillTemplate, answerText, decimalFriendly } from './text.js';

var frac = Line.frac, add = Line.add, sub = Line.sub, mul = Line.mul, div = Line.div,
    num = Line.num, isInt = Line.isInt, isZero = Line.isZero, toFrac = Line.toFrac;

var MINUS = '−';
var CANDIDATE_POOL = 120;
var HALF_MIN = 6;
var HALF_MAX = 8;
var POINT_MARGIN = 1;
var K_ABS = [[1, 2], [1, 1], [3, 2], [2, 1], [5, 2], [3, 1]];
var ANSWER_MAX = 100;
var OFFSCREEN_MIN = 3;
var LINE_VISIBLE_MIN = 6;

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

/** Число в условие: запятая и типографский минус. */
function valueText(f) {
  var sign = f.p < 0 ? MINUS : '';
  return sign + String(Math.abs(Math.round(num(f) * 1e6) / 1e6)).replace('.', ',');
}

/** Точный квадратный корень из дроби или null, если он нерационален. */
function sqrtExact(f) {
  if (f.p < 0) { return null; }
  var p = Math.round(Math.sqrt(f.p));
  var q = Math.round(Math.sqrt(f.q));
  if (p * p !== f.p || q * q !== f.q) { return null; }
  return frac(p, q);
}

/* ══════════════════════════════════════════════════════════
   Кривая
   ══════════════════════════════════════════════════════════ */
function curve(k, x0, y0) {
  var K = toFrac(k);
  return { k: K, x0: x0, y0: y0, kValue: num(K) };
}

/** Значение в точке; null — вне области определения или корень нерационален. */
function valueAt(c, x) {
  var t = sqrtExact(sub(x, frac(c.x0)));
  if (t === null) { return null; }
  return add(mul(c.k, t), frac(c.y0));
}

/** Целые точки графика: (x₀ + n²; y₀ + k·n), n = 1, 2, 3. */
function gridNodes(c) {
  var out = [];
  for (var n = 1; n <= 3; n++) {
    var y = add(mul(c.k, frac(n)), frac(c.y0));
    if (!isInt(y)) { continue; }
    out.push({ x: c.x0 + n * n, y: num(y), n: n });
  }
  return out;
}

function inside(x, y, win, margin) {
  return Math.abs(x) <= win.xmax - margin + 1e-9 && Math.abs(y) <= win.ymax - margin + 1e-9;
}

function usableNodes(c, win) {
  return gridNodes(c).filter(function (node) {
    if (!inside(node.x, node.y, win, POINT_MARGIN)) { return false; }
    /* На осях точка садится на подпись деления и путается с ней. */
    return node.x !== 0 && node.y !== 0;
  });
}

function windowOf(half) { return { xmin: -half, xmax: half, ymin: -half, ymax: half }; }

function windowFor(c, constraints) {
  var min = constraints.windowMin || HALF_MIN;
  var max = constraints.windowMax || HALF_MAX;
  /* Сначала ищется окно, где есть точка со смещением 4 или 9: по
     смещению на 1 клетку k тоже читается, но слишком близко к началу. */
  for (var pass = 0; pass < 2; pass++) {
    for (var half = min; half <= max; half++) {
      var win = windowOf(half);
      /* Начало графика — в поле, не у самой рамки: иначе непонятно,
         где кривая начинается. */
      if (!inside(c.x0, c.y0, win, POINT_MARGIN)) { continue; }
      var nodes = usableNodes(c, win);
      if (nodes.some(function (n) { return pass === 1 || n.n >= 2; })) { return win; }
    }
  }
  return null;
}

/* ══════════════════════════════════════════════════════════
   Запросы: f(x₀) и x по значению
   ══════════════════════════════════════════════════════════ */
/* √(x − x₀) = s. Целые s — аргумент за рамкой, ответ целый или с
   половинкой; дробные s дают аргументы вида 6,76 = 2,6². */
var S_INTEGER = [4, 5, 6, 7, 8, 9, 10, 11, 12];
var S_DECIMAL = [];
(function () {
  for (var i = 3; i <= 49; i++) { if (i % 10 !== 0) { S_DECIMAL.push(frac(i, 10)); } }
  [[1, 4], [3, 4], [5, 4], [7, 4], [9, 4]].forEach(function (v) { S_DECIMAL.push(frac(v[0], v[1])); });
})();

function rootPool(kind) {
  var out = [];
  if (kind === 'integer' || kind === 'any') { S_INTEGER.forEach(function (s) { out.push(frac(s)); }); }
  if (kind === 'decimal' || kind === 'any') { S_DECIMAL.forEach(function (s) { out.push(s); }); }
  return out;
}

/* С чертежа ответ читаться не должен: целая точка в окне — это уже
   не вычисление, а чтение по клеткам. */
function readable(x, y, win) {
  return isInt(x) && isInt(y) && inside(num(x), num(y), win, 0);
}

function queryCandidates(c, win, spec) {
  var kind = spec.kind || 'any';
  var out = [];
  rootPool(kind).forEach(function (s) {
    var x = add(frac(c.x0), mul(s, s));
    var y = add(mul(c.k, s), frac(c.y0));
    if (places(x) > 2 || places(y) > 2) { return; }
    if (Math.abs(num(x)) > ANSWER_MAX || Math.abs(num(y)) > ANSWER_MAX) { return; }
    if (readable(x, y, win)) { return; }
    /* Значение запроса не совпадает с ординатой начала: тогда s = 0. */
    if (spec.type === 'value-at') {
      out.push({ type: 'value-at', x0: x, answer: y, root: s });
    } else if (spec.type === 'argument-for') {
      if (isZero(sub(y, frac(c.y0)))) { return; }
      out.push({ type: 'argument-for', y0: y, answer: x, root: s });
    } else {
      throw new Error('generate-sqrt: неизвестный запрос «' + spec.type + '»');
    }
  });
  return out;
}

/* ══════════════════════════════════════════════════════════
   Один график корня
   ══════════════════════════════════════════════════════════ */
function kCandidates(constraints) {
  var list = [];
  (constraints.kAbs || K_ABS).forEach(function (v) {
    var f = Array.isArray(v) ? frac(v[0], v[1]) : toFrac(v);
    if (constraints.kSign !== 'negative') { list.push(f); }
    if (constraints.kSign !== 'positive') { list.push(mul(frac(-1), f)); }
  });
  return list;
}

function range(maxAbs, nonZero) {
  var out = [];
  for (var v = -maxAbs; v <= maxAbs; v++) {
    if (nonZero && v === 0) { continue; }
    out.push(v);
  }
  return out;
}

/** Ответ целый, нецелый или любой: так уровни задач различаются числами. */
function answerKindOk(value, kind) {
  if (places(value) > 2) { return false; }
  if (kind === 'integer') { return isInt(value); }
  if (kind === 'decimal') { return !isInt(value); }
  return true;
}

function marksOf(c, win, form) {
  var marks = usableNodes(c, win).map(function (node) {
    return { x: node.x, y: node.y, role: 'mark', n: node.n };
  });
  /* Начало сдвинутого графика отмечено: от него отсчитываются
     смещения 1, 4, 9. У k√x начало — начало координат, там уже
     стоит подпись 0. */
  if (form === 'shift') { marks.unshift({ x: c.x0, y: c.y0, role: 'start', n: 0 }); }
  return marks;
}

function singleCandidates(task, set, seed) {
  var constraints = task.constraints || {};
  var form = task.form || set.form;
  var base = set.id + ':' + task.id + ':' + seed;
  var random = rng(base);
  var xs = form === 'basic' ? [0] : range(constraints.x0Abs || 3, false);
  var ys = form === 'basic' ? [0] : range(constraints.y0Abs || 3, false);
  var found = [];

  shuffled(kCandidates(constraints), random).forEach(function (k) {
    shuffled(xs, random).forEach(function (x0) {
      shuffled(ys, random).forEach(function (y0) {
        /* Сдвинутый график сдвинут по-настоящему: хотя бы по одной оси. */
        if (form === 'shift' && x0 === 0 && y0 === 0) { return; }
        var c = curve(k, x0, y0);
        var win = windowFor(c, constraints);
        if (!win) { return; }
        var sig = key(k) + '@' + x0 + ';' + y0;

        var query = null;
        if (constraints.query) {
          var pool = queryCandidates(c, win, constraints.query);
          if (!pool.length) { return; }
          query = pool[Math.floor(rng(base + ':query:' + sig)() * pool.length)];
        }
        var answer = task.answerRule === 'coef-k' ? c.k : query ? query.answer : null;
        if (answer === null) {
          throw new Error('generate-sqrt: нечем ответить на «' + task.answerRule + '»');
        }
        if (!answerKindOk(answer, constraints.answerKind)) { return; }

        found.push({
          kind: 'single', form: form, curve: c, window: win, query: query,
          points: marksOf(c, win, form),
          answer: answer,
          answerKey: 'ans:' + key(answer),
          pairKey: 's:' + sig + (query ? ':' + key(query.root) : ''),
          slopeKey: 'k:' + key(k),
          interceptKey: 'start:' + x0 + ';' + y0,
          score: random()
        });
      });
    });
  });

  return shuffled(found, random).slice(0, CANDIDATE_POOL);
}

/* ══════════════════════════════════════════════════════════
   Корень и прямая: f(x) = k√x, g(x) = ax + b
   A — общая точка в узле сетки, P — ещё одна точка прямой в узле.
   ══════════════════════════════════════════════════════════ */
function offscreen(B, win, min) {
  return Math.abs(num(B.x)) >= win.xmax + min - 1e-9 || Math.abs(num(B.y)) >= win.ymax + min - 1e-9;
}

function lineCandidates(task, set, seed) {
  var constraints = task.constraints || {};
  var spec = constraints.line || {};
  var cross = constraints.intersection || {};
  var axis = cross.axis || 'x';
  var offscreenMin = cross.offscreenMin === undefined ? OFFSCREEN_MIN : cross.offscreenMin;
  var base = set.id + ':' + task.id + ':' + seed;
  var random = rng(base);
  var absMin = spec.absMin === undefined ? 0.2 : spec.absMin;
  var absMax = spec.absMax === undefined ? 3 : spec.absMax;
  var found = [];

  shuffled(kCandidates(constraints), random).forEach(function (k) {
    var c = curve(k, 0, 0);
    var win = windowFor(c, constraints);
    if (!win) { return; }
    usableNodes(c, win).forEach(function (A) {
      for (var px = -win.xmax + POINT_MARGIN; px <= win.xmax - POINT_MARGIN; px++) {
        for (var py = -win.ymax + POINT_MARGIN; py <= win.ymax - POINT_MARGIN; py++) {
          if (px === A.x || px === 0 || py === 0) { continue; }
          if (Math.abs(px - A.x) < 2 && Math.abs(py - A.y) < 2) { continue; }
          /* P не на графике корня. */
          var onRoot = valueAt(c, frac(px));
          if (onRoot !== null && key(onRoot) === String(py)) { continue; }
          var slope = frac(py - A.y, px - A.x);
          var abs = Math.abs(num(slope));
          if (isZero(slope) || abs < absMin - 1e-9 || abs > absMax + 1e-9) { continue; }
          var line = { k: slope, b: sub(frac(A.y), mul(slope, frac(A.x))) };
          if (places(line.k) > 2 || places(line.b) > 2) { continue; }
          if (Line.visiblePart({ kValue: num(line.k), bValue: num(line.b) }, win).length <
              LINE_VISIBLE_MIN) { continue; }
          /* a·t² − k·t + b = 0: t_A = n известен, t_B = k/a − t_A. */
          var tB = sub(div(c.k, line.k), frac(A.n));
          if (num(tB) <= 0 || key(tB) === String(A.n)) { continue; }
          var B = { x: mul(tB, tB), y: mul(c.k, tB), t: tB };
          if (places(B.x) > 2 || places(B.y) > 2) { continue; }
          var lineOnly = task.answerRule === 'line-a' || task.answerRule === 'line-b';
          var asked = task.answerRule === 'line-a' ? line.k
            : task.answerRule === 'line-b' ? line.b
            : axis === 'x' ? B.x : B.y;
          /* Спрошенная координата B с рисунка не читается: B за рамкой
             или внутри поля, но спрошенная координата нецелая. */
          if (!lineOnly && !offscreen(B, win, offscreenMin)) {
            if (isInt(asked)) { continue; }
            /* У самого начала координат точка B сливается с ним. */
            if (num(tB) < 0.5) { continue; }
          }
          if (!answerKindOk(asked, constraints.answerKind) || Math.abs(num(asked)) > ANSWER_MAX) { continue; }

          var sig = key(k) + '|' + A.x + ';' + A.y + '|' + px + ';' + py;
          found.push({
            kind: 'line', form: 'line', curve: c, window: win, line: line,
            points: [{ x: A.x, y: A.y, role: 'cross', label: 'A', n: A.n },
                     { x: px, y: py, role: 'line' }],
            intersection: { A: { x: A.x, y: A.y, t: A.n }, B: B, axis: axis },
            answer: asked,
            answerKey: 'ans:' + key(asked),
            pairKey: 'sl:' + sig,
            slopeKey: 'k:' + key(k),
            interceptKey: 'l:' + key(line.k) + ';' + key(line.b),
            score: random()
          });
        }
      }
    });
  });

  /* У одного корня прямых сотни: перемешиваем по seed и ограничиваем,
     чтобы в пул попал каждый k. */
  var perK = {};
  return shuffled(found, random).filter(function (cand) {
    perK[cand.slopeKey] = (perK[cand.slopeKey] || 0) + 1;
    return perK[cand.slopeKey] <= 16;
  }).slice(0, CANDIDATE_POOL);
}

function candidates(task, set, seed) {
  var form = task.form || set.form;
  if (!form) { throw new Error('generate-sqrt: у ' + task.id + ' не задана запись функции'); }
  return form === 'line' ? lineCandidates(task, set, seed) : singleCandidates(task, set, seed);
}

/* ══════════════════════════════════════════════════════════
   Сцена чертежа
   ══════════════════════════════════════════════════════════ */
function sceneOf(built, extra) {
  var c = built.curve;
  /* Как в ЕГЭ: кривые не подписаны, подписана только точка A. */
  var curves = [{ type: 'sqrt', a: c.kValue, c: c.x0, d: c.y0, color: 'lineA', label: null }];
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
    window: built.window,
    grid: { step: 1, show: true },
    axes: { labelX: 'x', labelY: 'y', origin: '0' },
    labelRules: 'strict',
    axisLabels: (extra && extra.axisLabels) || 'minimal',
    curves: curves,
    points: points,
    shapes: (extra && extra.shapes) || [],
    alt: built.kind === 'line' ? 'Графики корня и прямой' : 'График корня'
  };
}

function sceneFor(built, task, set) {
  return sceneOf(built, { axisLabels: task.axisLabels || set.axisLabels });
}

/* ══════════════════════════════════════════════════════════
   Итог задачи
   ══════════════════════════════════════════════════════════ */
function lineText(line) {
  var k = line.k, b = line.b;
  var slope = isInt(k) && k.p === 1 ? 'x' : (isInt(k) && k.p === -1 ? '−x' : valueText(k) + 'x');
  var tail = isZero(b) ? '' : (b.p > 0 ? ' + ' : ' − ') + valueText(frac(Math.abs(b.p), b.q));
  return 'g(x) = ' + slope + tail;
}

function exactMeta(f) { return { p: f.p, q: f.q }; }

function result(set, task, built, seed) {
  var c = built.curve;
  var query = built.query;
  var values = {
    x0: query && query.x0 ? valueText(query.x0) : '',
    y0: query && query.y0 ? valueText(query.y0) : ''
  };

  return {
    id: task.id,
    kind: set.kind,
    svg: renderer.renderGraph(sceneFor(built, task, set)),
    question: plainText(fillTemplate(task.question, values)),
    questionHtml: typesetText(fillTemplate(task.question, values)),
    hint: task.hint ? plainText(task.hint) : null,
    hintHtml: task.hint ? typesetText(task.hint) : null,
    answer: answerText(built.answer),
    answerHtml: math.html(answerText(built.answer)),
    options: null,
    answerType: 'number',
    level: task.level || null,
    levelReason: task.levelReason || null,
    meta: {
      family: 'sqrt',
      set: set.id,
      seed: seed,
      form: built.form,
      rule: task.answerRule,
      answer: exactMeta(built.answer),
      k: exactMeta(c.k),
      x0: c.x0,
      y0: c.y0,
      window: built.window,
      points: built.points.map(function (point) {
        return { x: point.x, y: point.y, role: point.role, n: point.n === undefined ? null : point.n,
                 label: point.label || null };
      }),
      query: query ? { type: query.type,
                       x0: query.x0 ? exactMeta(query.x0) : null,
                       y0: query.y0 ? exactMeta(query.y0) : null,
                       root: exactMeta(query.root),
                       answer: exactMeta(query.answer) } : null,
      line: built.line ? { k: exactMeta(built.line.k), b: exactMeta(built.line.b),
                           text: lineText(built.line) } : null,
      intersection: built.intersection ? {
        axis: built.intersection.axis,
        A: built.intersection.A,
        B: { x: exactMeta(built.intersection.B.x), y: exactMeta(built.intersection.B.y),
             t: exactMeta(built.intersection.B.t) }
      } : null,
      level: task.level || null
    }
  };
}

/** Кривая из meta задачи — для разбора, подсказки и чертежей шагов. */
function fromMeta(meta) {
  var c = curve(frac(meta.k.p, meta.k.q), meta.x0, meta.y0);
  var built = { kind: meta.form === 'line' ? 'line' : 'single', form: meta.form, curve: c,
                window: meta.window, points: meta.points,
                line: meta.line ? { k: frac(meta.line.k.p, meta.line.k.q),
                                    b: frac(meta.line.b.p, meta.line.b.q) } : null };
  return built;
}

/**
 * Чертёж задачи с дополнительными фигурами — треугольником наклона
 * прямой. Только для подсказки, разбора и листа учителя: у ученика
 * на листе чертёж задачи как есть.
 */
function sceneWith(meta, shapes) {
  return sceneOf(fromMeta(meta), { shapes: shapes });
}

const api = {
  candidates: candidates,
  result: result,
  valueText: valueText,
  valueAt: valueAt,
  sqrtExact: sqrtExact,
  curve: curve,
  sceneWith: sceneWith
};

export default api;
export { candidates, result, valueText, valueAt, sqrtExact, curve, sceneWith };
