/* generate-trigonometric.js — сборка вариантов задач о тригонометрических
   функциях, как в открытом банке ФИПИ:

     f(x) = a cos x + b,   f(x) = a sin x + b,   f(x) = a tg x + b;
     спрашивают a или b.

   Чертёж — в клетках сетки: по оси x клетка равна π/4 (подписано π),
   по оси y — yu, 1 или 0,5 (подписана единица). Окно, точки и подписи
   задаются в клетках, параметры и ответ — настоящими числами.

   Правила чертежа:
     • отмечены ровно две опорные точки, обе в узлах сетки и не ближе
       клетки к рамке; абсциссы — 0, ±π/4, ±π/2, ±π и т. п., где
       значение функции −1, 0 или 1;
     • у косинуса и синуса вся волна (максимум и минимум) не ближе
       клетки к рамке;
     • у тангенса асимптоты x = π/2 + πk — тонкий пунктир; у верхней и
       нижней рамки ветвь отстоит от асимптоты не меньше чем на
       CLEARANCE клетки, иначе вариант отбрасывается;
     • окно задано набором и не двигается — перебираются параметры;
     • ОТВЕТ НЕ ЧИТАЕТСЯ С РИСУНКА: у аналогов ответ не совпадает ни с
       одной координатой отмеченных точек — его можно только вычислить
       из системы. Задачи банка (source: fipi) — исходные рисунки;
     • ответ — целое число или конечная десятичная дробь.

   Ограничения задачи (task.constraints):
     yUnits      — клетка по y: [1], [0.5] или [1, 0.5];
     marks       — 'zero' (одна точка со значением функции 0 — даёт b
                   сразу), 'sym' (значения 1 и −1 — система сложением),
                   'any';
     answerKind  — 'integer' | 'decimal';
     aSign       — 'positive' | 'negative';
     fixed       — задача банка: { fn, a, b, yu, marks: [X…], window }. */

'use strict';

import renderer from './renderer.js';
import './families/trig.js';
import math from './math.js';
import Line from './families/line.js';
import P from './base-power.js';
import { CLEARANCE } from './families/shared.js';
import { tanAsymptotes } from './families/trig.js';
import { rng, shuffled } from './random.js';
import { plainText, typesetText, fillTemplate, answerText } from './text.js';

var frac = Line.frac, add = Line.add, mul = Line.mul, num = Line.num, isInt = Line.isInt;

var XU = Math.PI / 4;
var CANDIDATE_POOL = 160;
var POINT_MARGIN = 1;
var A_MAX = 6;
var B_MAX = 5;

var WINDOWS = {
  cos: { xmin: -5, xmax: 6, ymin: -7, ymax: 7 },
  sin: { xmin: -5, xmax: 6, ymin: -7, ymax: 7 },
  tg: { xmin: -3, xmax: 7, ymin: -7, ymax: 7 }
};

/* ══════════════════════════════════════════════════════════
   Значения в узлах: X — абсцисса в клетках (x = X · π/4)
   ══════════════════════════════════════════════════════════ */
function mod(n, m) { return ((n % m) + m) % m; }

/** Значение функции при x = X · π/4, если оно −1, 0 или 1; иначе null. */
function unitValue(fn, X) {
  if (fn === 'cos') {
    if (mod(X, 8) === 0) { return 1; }
    if (mod(X, 8) === 4) { return -1; }
    return mod(X, 4) === 2 ? 0 : null;
  }
  if (fn === 'sin') {
    if (mod(X, 8) === 2) { return 1; }
    if (mod(X, 8) === 6) { return -1; }
    return mod(X, 4) === 0 ? 0 : null;
  }
  if (mod(X, 4) === 0) { return 0; }
  if (mod(X, 4) === 1) { return 1; }
  return mod(X, 4) === 3 ? -1 : null;
}

function curveOf(fn, a, b, yu) { return { fn: fn, a: a, b: b, yu: yu }; }

/** Значение в клетках по y при X клеток по x. */
function cellValue(cv, X) {
  var f = cv.fn === 'cos' ? Math.cos : cv.fn === 'sin' ? Math.sin : Math.tan;
  return (num(cv.a) * f(X * XU) + num(cv.b)) / num(cv.yu);
}

function inside(X, Y, win, margin) {
  return X >= win.xmin + margin - 1e-9 && X <= win.xmax - margin + 1e-9 &&
         Y >= win.ymin + margin - 1e-9 && Y <= win.ymax - margin + 1e-9;
}

/** Зазор (в клетках по x) между ветвью тангенса и асимптотой у рамок. */
function tailGap(cv, win) {
  if (cv.fn !== 'tg') { return Infinity; }
  var gap = Infinity;
  [win.ymin, win.ymax].forEach(function (edge) {
    var t = (edge * num(cv.yu) - num(cv.b)) / num(cv.a);
    gap = Math.min(gap, (Math.PI / 2 - Math.abs(Math.atan(t))) / XU);
  });
  return gap;
}

/** Волна косинуса или синуса целиком в окне, с запасом в клетку. */
function waveFits(cv, win) {
  if (cv.fn === 'tg') { return true; }
  var top = (num(cv.b) + Math.abs(num(cv.a))) / num(cv.yu);
  var bottom = (num(cv.b) - Math.abs(num(cv.a))) / num(cv.yu);
  return top <= win.ymax - POINT_MARGIN + 1e-9 && bottom >= win.ymin + POINT_MARGIN - 1e-9;
}

/** Асимптоты тангенса в клетках — пунктиром. */
function asymptoteShapes(cv, win) {
  if (cv.fn !== 'tg') { return []; }
  return tanAsymptotes(XU, win.xmin, win.xmax).filter(function (X) {
    return X > win.xmin + 1e-9 && X < win.xmax - 1e-9;
  }).map(function (X) {
    return { type: 'segment', from: [X, win.ymin], to: [X, win.ymax], style: 'dashed', color: 'asymptote' };
  });
}

/** Узлы на кривой: абсциссы с значением −1, 0, 1. */
function gridNodes(cv, win) {
  var out = [];
  for (var X = Math.ceil(win.xmin); X <= win.xmax; X++) {
    var v = unitValue(cv.fn, X);
    if (v === null) { continue; }
    var y = add(mul(cv.a, frac(v)), cv.b);
    var Yf = Line.div(y, cv.yu);
    if (!isInt(Yf)) { continue; }
    if (!inside(X, num(Yf), win, POINT_MARGIN)) { continue; }
    /* Точка на подписи деления (π на оси x, единица на оси y) закрыла
       бы её — а без подписей клетку не прочитать. */
    if (Math.abs(X) === 4 && num(Yf) === 0) { continue; }
    if (X === 0 && Math.abs(num(Yf) - 1 / num(cv.yu)) < 1e-9) { continue; }
    out.push({ X: X, Y: num(Yf), v: v, y: y });
  }
  return out;
}

function markPairs(nodes, mode) {
  var pairs = [];
  for (var i = 0; i < nodes.length; i++) {
    for (var j = i + 1; j < nodes.length; j++) {
      var p = nodes[i], q = nodes[j];
      if (Math.abs(q.X - p.X) > 6 || p.v === q.v) { continue; }
      var zero = p.v === 0 || q.v === 0;
      if (mode === 'zero' && !zero) { continue; }
      if (mode === 'sym' && zero) { continue; }
      /* Первой — точка со значением 0 (или 1): с неё начинается разбор. */
      var first = p.v === 0 ? p : q.v === 0 ? q : p.v === 1 ? p : q;
      pairs.push(first === p ? [p, q] : [q, p]);
    }
  }
  return pairs;
}

/** Ответ совпадает с координатой отмеченной точки — читается с рисунка. */
function readable(answer, marks) {
  return marks.some(function (mk) { return P.key(mk.y) === P.key(answer); });
}

function answerOf(rule, cv) {
  if (rule === 'coef-a') { return cv.a; }
  if (rule === 'coef-b') { return cv.b; }
  throw new Error('generate-trigonometric: неизвестное правило «' + rule + '»');
}

function answerKindOk(value, kind) {
  if (P.places(value) > 2) { return false; }
  if (kind === 'integer') { return isInt(value); }
  if (kind === 'decimal') { return !isInt(value); }
  return true;
}

function build(task, set, cv, win, marks, answer, random) {
  var sig = cv.fn + ':' + P.key(cv.a) + ';' + P.key(cv.b) + '@' + P.key(cv.yu);
  var marksKey = marks.map(function (mk) { return mk.X; }).join(',');
  return {
    kind: 'single', curve: cv, window: win,
    points: marks.map(function (mk) { return { X: mk.X, Y: mk.Y, v: mk.v, role: 'mark' }; }),
    answer: answer,
    answerKey: 'ans:' + P.key(answer),
    pairKey: 't:' + sig + ':' + marksKey,
    vertexKey: 'pic:' + sig,
    slopeKey: 'a:' + P.key(cv.a),
    interceptKey: 'b:' + P.key(cv.b),
    score: random()
  };
}

function windowOf(task, set) {
  var fn = task.fn || set.fn;
  return (task.constraints && task.constraints.window) || set.window || WINDOWS[fn];
}

/** Задача открытого банка: всё как в банке, кандидат один. */
function fixedCandidate(task, set, seed) {
  var fx = task.constraints.fixed;
  var fn = fx.fn || task.fn || set.fn;
  var cv = curveOf(fn, Line.toFrac(fx.a), Line.toFrac(fx.b), Line.toFrac(fx.yu || 1));
  var win = fx.window || windowOf(task, set);
  var marks = fx.marks.map(function (X) {
    var v = unitValue(fn, X);
    if (v === null) { throw new Error('generate-trigonometric: у ' + task.id + ' точка не в узле'); }
    var y = add(mul(cv.a, frac(v)), cv.b);
    return { X: X, Y: num(Line.div(y, cv.yu)), v: v, y: y };
  });
  var built = build(task, set, cv, win, marks, answerOf(task.answerRule, cv), rng(set.id + task.id + seed));
  ['answerKey', 'pairKey', 'vertexKey', 'slopeKey', 'interceptKey'].forEach(function (name) {
    built[name] = 'fipi-' + name + ':' + task.id;
  });
  return [built];
}

function steps(unit, max) {
  var out = [];
  for (var k = 1; num(mul(unit, frac(k))) <= max + 1e-9; k++) { out.push(mul(unit, frac(k))); }
  return out;
}

function candidates(task, set, seed) {
  var constraints = task.constraints || {};
  if (constraints.fixed) { return fixedCandidate(task, set, seed); }
  var fn = task.fn || set.fn;
  if (!fn) { throw new Error('generate-trigonometric: у ' + task.id + ' не задана функция'); }
  var win = windowOf(task, set);
  var random = rng(set.id + ':' + task.id + ':' + seed);
  var units = (constraints.yUnits || [1, 0.5]).map(Line.toFrac);
  var found = [];

  shuffled(units, random).forEach(function (yu) {
    var as = [];
    steps(yu, A_MAX).forEach(function (v) {
      if (constraints.aSign !== 'negative') { as.push(v); }
      if (constraints.aSign !== 'positive') { as.push(mul(v, frac(-1))); }
    });
    var bs = [frac(0)];
    steps(yu, B_MAX).forEach(function (v) { bs.push(v); bs.push(mul(v, frac(-1))); });
    shuffled(as, random).forEach(function (a) {
      shuffled(bs, random).forEach(function (b) {
        var cv = curveOf(fn, a, b, yu);
        if (!waveFits(cv, win)) { return; }
        if (tailGap(cv, win) < CLEARANCE - 1e-9) { return; }
        var answer = answerOf(task.answerRule, cv);
        if (answer.p === 0) { return; }
        if (!answerKindOk(answer, constraints.answerKind)) { return; }
        var pairs = markPairs(gridNodes(cv, win), constraints.marks || 'any');
        shuffled(pairs, random).slice(0, 3).forEach(function (marks) {
          if (readable(answer, marks)) { return; }
          found.push(build(task, set, cv, win, marks, answer, random));
        });
      });
    });
  });

  return shuffled(found, random).slice(0, CANDIDATE_POOL);
}

/* ══════════════════════════════════════════════════════════
   Сцена и итог задачи
   ══════════════════════════════════════════════════════════ */
/** Деления: на оси x — π (и −π), на оси y — единица. */
function ticksOf(cv, win) {
  var yOne = 1 / num(cv.yu);
  var x = [];
  for (var X = Math.ceil(win.xmin); X <= win.xmax; X++) {
    if (X === 0) { continue; }
    var item = { at: X };
    if (X === 4) { item.label = 'π'; }
    if (X === -4) { item.label = '−π'; }
    x.push(item);
  }
  var y = [];
  for (var Y = Math.ceil(win.ymin); Y <= win.ymax; Y++) {
    if (Y === 0) { continue; }
    var t = { at: Y };
    if (Math.abs(Y - yOne) < 1e-9) { t.label = '1'; }
    y.push(t);
  }
  return { x: x, y: y };
}

function sceneOf(built, extra) {
  var cv = built.curve;
  var win = built.window;
  return {
    window: win,
    grid: { step: 1, show: true },
    axes: { labelX: 'x', labelY: 'y', origin: '0', ticks: ticksOf(cv, win) },
    labelRules: 'strict',
    axisLabels: 'minimal',
    curves: [{ type: 'trig', fn: cv.fn, a: num(cv.a), b: num(cv.b), yu: num(cv.yu), color: 'lineA', label: null }],
    points: built.points.map(function (point) {
      return { x: point.X, y: point.Y, style: 'solid', color: 'lineA', label: point.label || null };
    }),
    shapes: asymptoteShapes(cv, win).concat((extra && extra.shapes) || []),
    alt: 'График тригонометрической функции'
  };
}

function exactMeta(f) { return f ? { p: f.p, q: f.q } : null; }

function result(set, task, built, seed) {
  var cv = built.curve;
  var scene = sceneOf(built);
  return {
    id: task.id,
    kind: set.kind,
    svg: renderer.renderGraph(scene),
    scene: scene,
    question: plainText(fillTemplate(task.question, {})),
    questionHtml: typesetText(fillTemplate(task.question, {})),
    hint: task.hint ? plainText(task.hint) : null,
    hintHtml: task.hint ? typesetText(task.hint) : null,
    answer: answerText(built.answer),
    answerHtml: math.html(answerText(built.answer)),
    options: null,
    answerType: 'number',
    level: task.level || null,
    levelReason: task.levelReason || null,
    source: task.source || null,
    meta: {
      family: 'trigonometric',
      set: set.id,
      seed: seed,
      fn: cv.fn,
      rule: task.answerRule,
      source: task.source || null,
      answer: exactMeta(built.answer),
      a: exactMeta(cv.a),
      b: exactMeta(cv.b),
      yu: exactMeta(cv.yu),
      window: built.window,
      points: built.points.map(function (point) {
        return { X: point.X, Y: point.Y, v: point.v, role: point.role, label: point.label || null };
      }),
      level: task.level || null
    }
  };
}

function fromMeta(meta) {
  return { kind: 'single', window: meta.window, points: meta.points,
           curve: curveOf(meta.fn, Line.toFrac(meta.a), Line.toFrac(meta.b), Line.toFrac(meta.yu)) };
}

/** Чертёж с построениями — только подсказка, разбор и лист учителя. */
function sceneWith(meta, shapes) {
  return sceneOf(fromMeta(meta), { shapes: shapes });
}

/** Пунктиры от опорных точек к осям — вспомогательное построение. */
function guideShapes(meta) {
  var out = [];
  meta.points.forEach(function (point) {
    if (point.Y !== 0) { out.push({ type: 'segment', from: [point.X, 0], to: [point.X, point.Y],
                                    style: 'dashed', color: 'accent' }); }
    if (point.X !== 0) { out.push({ type: 'segment', from: [0, point.Y], to: [point.X, point.Y],
                                    style: 'dashed', color: 'accent' }); }
  });
  return out;
}

const api = {
  candidates: candidates,
  result: result,
  unitValue: unitValue,
  cellValue: cellValue,
  tailGap: tailGap,
  waveFits: waveFits,
  readable: readable,
  curveOf: curveOf,
  fromMeta: fromMeta,
  sceneWith: sceneWith,
  guideShapes: guideShapes,
  WINDOWS: WINDOWS,
  XU: XU,
  CLEARANCE: CLEARANCE
};

export default api;
export { candidates, result, unitValue, cellValue, tailGap, waveFits, readable, curveOf, fromMeta, sceneWith,
         guideShapes, WINDOWS, XU };
