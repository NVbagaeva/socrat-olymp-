/* generate-logarithmic.js — сборка вариантов задач о логарифмической функции.

   Внутри движка кривая одна: y = logₐ(x + c) + d. Три записи из условий
   (буквы — как в открытом банке ФИПИ):

     basic   f(x) = logₐ x            c = 0, d = 0
     shiftY  f(x) = b + logₐ x        c = 0, b = d — сдвиг вверх-вниз
     shiftX  f(x) = logₐ(x + b)       d = 0, b = c — сдвиг влево-вправо

   Это зеркало показательной подтемы (generate-exponential.js): узлы
   сетки на кривой — точки x = aⁿ − c, y = n + d, где aⁿ целое.

   Правила чертежа:
     • асимптота x = −c — тонкий пунктир (при c = 0 это ось Oy, её не
       дублируем); кривая её не пересекает и не касается: у верхней
       или нижней рамки зазор до асимптоты не меньше CLEARANCE клетки,
       иначе вариант отбрасывается; левее асимптоты кривой нет;
     • отмечены ровно две опорные точки, обе в узлах сетки и не ближе
       клетки к рамке;
     • окно считается только по кривой; если ответ читается с рисунка,
       генератор берёт другие параметры, а не двигает окно;
     • ОТВЕТ НЕ ЧИТАЕТСЯ С РИСУНКА: спрошенная точка за рамкой с запасом
       не меньше клетки или её координаты не в узле сетки;
     • всё, что идёт в ответ и в условие, — целое или конечная
       десятичная дробь не длиннее трёх знаков.

   Правила ответа (task.answerRule): value-at, argument-for, coef-a,
   coef-b. В шаблон условия подставляются {x0} и {y0}.

   Ограничения задачи (task.constraints): как у показательной —
   bases, direction, shiftAbs, shiftSign, marks ('unit' | 'far' |
   'any'), query { type, kind, outside }, answerKind, fixed. Для
   value-at kind относится к аргументу x₀ (целый или дробный), для
   argument-for — к ответу x. */

'use strict';

import renderer from './renderer.js';
import './families/loga.js';
import math from './math.js';
import Line from './families/line.js';
import P from './base-power.js';
import { verticalAsymptote, asymptotes, CLEARANCE } from './families/shared.js';
import { rng, shuffled } from './random.js';
import { plainText, typesetText, fillTemplate, answerText } from './text.js';

var frac = Line.frac, add = Line.add, sub = Line.sub, num = Line.num, isInt = Line.isInt;

var CANDIDATE_POOL = 160;
var POINT_MARGIN = 1;
var ANSWER_MAX = 300;
var ANSWER_PLACES = 3;
var N_RANGE = 10;
var WIDTH = 12;

/* Основания до 5 — по той же причине, что у показательной: у больших
   оснований кривая у асимптоты сливается с ней уже в клетке от оси. */
var DEFAULT_UP = [2, 3, 4, 5].map(function (r) { return { r: r }; });
var DEFAULT_DOWN = [2, 3, 4, 5].map(function (r) { return { r: [1, r] }; });

/* ══════════════════════════════════════════════════════════
   Кривая y = logₐ(x + c) + d
   ══════════════════════════════════════════════════════════ */
function curveOf(b, c, d) { return { base: b, c: c, d: d }; }

/** Показатель n, при котором aⁿ = v, или null. */
function logExact(b, v) {
  for (var n = -2 * N_RANGE; n <= 2 * N_RANGE; n++) {
    var p = P.pow(b, n);
    if (p !== null && P.key(p) === P.key(v)) { return n; }
  }
  return null;
}

/** Значение в точке x точно; null — вне области или логарифм нерационален. */
function valueAt(cv, x) {
  var arg = add(Line.toFrac(x), frac(cv.c));
  if (arg.p <= 0) { return null; }
  var n = logExact(cv.base, arg);
  return n === null ? null : frac(n + cv.d);
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

/**
 * Окно только по кривой. Ширина — WIDTH клеток, асимптота — две клетки
 * правее левой рамки (или ось Oy, если асимптота правее неё).
 * По вертикали: со стороны хвоста окно кончается там, где кривая ещё
 * отстоит от асимптоты на CLEARANCE; с другой стороны — через две
 * клетки после того, как кривая выходит за правую рамку.
 */
function windowFor(cv) {
  var a = P.value(cv.base);
  var xmin = Math.min(0, -cv.c) - 2;
  var xmax = xmin + WIDTH;
  var tail = cv.d + Math.log(CLEARANCE) / Math.log(a);
  var exit = cv.d + Math.log(xmax + cv.c) / Math.log(a);
  var ymin, ymax;
  if (a > 1) {
    ymin = clamp(Math.ceil(tail - 1e-9), -8, -1);
    ymax = clamp(Math.ceil(exit) + 2, 3, 8);
  } else {
    ymax = clamp(Math.floor(tail + 1e-9), 1, 8);
    ymin = clamp(Math.floor(exit) - 2, -8, -3);
  }
  return { xmin: xmin, xmax: xmax, ymin: ymin, ymax: ymax };
}

/** Зазор между кривой и асимптотой у рамки со стороны хвоста. */
function tailGap(cv, win) {
  var a = P.value(cv.base);
  var edge = a > 1 ? win.ymin : win.ymax;
  return Math.pow(a, edge - cv.d);
}

function inside(x, y, win, margin) {
  return x >= win.xmin + margin - 1e-9 && x <= win.xmax - margin + 1e-9 &&
         y >= win.ymin + margin - 1e-9 && y <= win.ymax - margin + 1e-9;
}

function readable(x, y, win) {
  return isInt(x) && isInt(y) && inside(num(x), num(y), win, -1);
}

/** Узлы сетки на кривой: x = aⁿ − c целое, y = n + d. */
function gridNodes(cv, win) {
  var out = [];
  for (var n = -N_RANGE; n <= N_RANGE; n++) {
    var p = P.pow(cv.base, n);
    if (p === null || !isInt(p)) { continue; }
    var x = num(p) - cv.c;
    var y = n + cv.d;
    if (!inside(x, y, win, POINT_MARGIN)) { continue; }
    out.push({ x: x, y: y, n: n });
  }
  return out;
}

function markPairs(nodes, mode, b) {
  var pairs = [];
  for (var i = 0; i < nodes.length; i++) {
    for (var j = i + 1; j < nodes.length; j++) {
      var p = nodes[i], q = nodes[j];
      if (Math.abs(q.n - p.n) > 3 * b.m) { continue; }
      var unit = p.n === 0 || q.n === 0;
      if (mode === 'unit' && !unit) { continue; }
      if (mode === 'far' && unit) { continue; }
      pairs.push(Math.abs(p.n) <= Math.abs(q.n) ? [p, q] : [q, p]);
    }
  }
  return pairs;
}

/* ══════════════════════════════════════════════════════════
   Запросы
   ══════════════════════════════════════════════════════════ */
function goodNumber(f) {
  return P.places(f) <= ANSWER_PLACES && Math.abs(num(f)) <= ANSWER_MAX;
}

function queryCandidates(cv, win, spec, marks) {
  var out = [];
  var kind = spec.kind || 'any';
  var taken = {};
  marks.forEach(function (mk) { taken[mk.n] = true; });
  function kindOk(f) {
    if (kind === 'integer') { return isInt(f); }
    if (kind === 'decimal') { return !isInt(f); }
    return true;
  }
  function outsideOk(x, y) {
    var need = spec.outside === undefined ? isInt(x) && isInt(y) : spec.outside;
    return !need || !inside(num(x), num(y), win, -1);
  }
  for (var n = -N_RANGE; n <= N_RANGE; n++) {
    if (taken[n]) { continue; }
    var p = P.pow(cv.base, n);
    if (p === null) { continue; }
    var x = sub(p, frac(cv.c));
    var y = frac(n + cv.d);
    if (!goodNumber(x) || !goodNumber(y)) { continue; }
    if (readable(x, y, win) || !outsideOk(x, y)) { continue; }
    if (spec.type === 'value-at') {
      if (!kindOk(x)) { continue; }
      out.push({ type: 'value-at', x0: x, answer: y, n: n });
    } else if (spec.type === 'argument-for') {
      if (!kindOk(x)) { continue; }
      out.push({ type: 'argument-for', y0: y, answer: x, n: n });
    } else {
      throw new Error('generate-logarithmic: неизвестный запрос «' + spec.type + '»');
    }
  }
  return out;
}

/* ══════════════════════════════════════════════════════════
   Кандидаты
   ══════════════════════════════════════════════════════════ */
function baseCandidates(constraints) {
  var list = constraints.bases ||
    (constraints.direction === 'down' ? DEFAULT_DOWN
      : constraints.direction === 'up' ? DEFAULT_UP : DEFAULT_UP.concat(DEFAULT_DOWN));
  return list.map(P.base).filter(function (b) {
    if (constraints.direction === 'up' && !P.growing(b)) { return false; }
    if (constraints.direction === 'down' && P.growing(b)) { return false; }
    return true;
  });
}

function shifts(constraints) {
  var abs = constraints.shiftAbs === undefined ? 4 : constraints.shiftAbs;
  var out = [];
  for (var v = -abs; v <= abs; v++) {
    if (v === 0) { continue; }
    if (constraints.shiftSign === 'positive' && v < 0) { continue; }
    if (constraints.shiftSign === 'negative' && v > 0) { continue; }
    out.push(v);
  }
  return out;
}

function answerOf(rule, cv, form, query) {
  if (rule === 'coef-a') { return cv.base.m === 1 ? cv.base.r : null; }
  if (rule === 'coef-b') { return frac(form === 'shiftX' ? cv.c : cv.d); }
  return query ? query.answer : null;
}

function answerKindOk(value, kind) {
  if (!goodNumber(value)) { return false; }
  if (kind === 'integer') { return isInt(value); }
  if (kind === 'decimal') { return !isInt(value); }
  return true;
}

function build(task, set, cv, form, win, marks, query, answer, random) {
  var sig = P.baseKey(cv.base) + '@' + cv.c + ';' + cv.d;
  var marksKey = marks.map(function (mk) { return mk.n; }).join(',');
  return {
    kind: 'single', form: form, curve: cv, window: win, query: query,
    points: marks.map(function (mk) { return { x: mk.x, y: mk.y, n: mk.n, role: 'mark' }; }),
    answer: answer,
    answerKey: 'ans:' + P.key(answer),
    pairKey: 'l:' + sig + ':' + marksKey + (query ? ':' + query.type + P.key(query.answer) : ''),
    vertexKey: 'pic:' + sig + ':' + marksKey,
    slopeKey: 'a:' + P.baseKey(cv.base),
    interceptKey: 'shift:' + cv.c + ';' + cv.d,
    score: random()
  };
}

/** Задача открытого банка: всё как в банке, кандидат один. */
function fixedCandidate(task, set, seed) {
  var fx = task.constraints.fixed;
  var form = task.form || set.form;
  var b = P.base(fx.base);
  var cv = curveOf(b, fx.c || 0, fx.d || 0);
  var win = fx.window || windowFor(cv);
  var marks = fx.marks.map(function (n) {
    return { x: num(P.pow(b, n)) - cv.c, y: n + cv.d, n: n };
  });
  var query = null;
  if (fx.x0 !== undefined) {
    var x0 = Line.toFrac(fx.x0);
    var n0 = logExact(b, add(x0, frac(cv.c)));
    if (n0 === null) { throw new Error('generate-logarithmic: у ' + task.id + ' аргумент не степень основания'); }
    query = { type: 'value-at', x0: x0, answer: frac(n0 + cv.d), n: n0 };
  } else if (fx.y0 !== undefined) {
    var n1 = fx.y0 - cv.d;
    query = { type: 'argument-for', y0: frac(fx.y0), answer: sub(P.pow(b, n1), frac(cv.c)), n: n1 };
  }
  var answer = answerOf(task.answerRule, cv, form, query);
  var built = build(task, set, cv, form, win, marks, query, answer, rng(set.id + task.id + seed));
  ['answerKey', 'pairKey', 'vertexKey', 'slopeKey', 'interceptKey'].forEach(function (name) {
    built[name] = 'fipi-' + name + ':' + task.id;
  });
  return [built];
}

function candidates(task, set, seed) {
  var constraints = task.constraints || {};
  var form = task.form || set.form;
  if (!form) { throw new Error('generate-logarithmic: у ' + task.id + ' не задана запись функции'); }
  if (constraints.fixed) { return fixedCandidate(task, set, seed); }

  var random = rng(set.id + ':' + task.id + ':' + seed);
  var cs = form === 'shiftX' ? shifts(constraints) : [0];
  var ds = form === 'shiftY' ? shifts(constraints) : [0];
  var found = [];

  shuffled(baseCandidates(constraints), random).forEach(function (b) {
    shuffled(cs, random).forEach(function (c) {
      shuffled(ds, random).forEach(function (d) {
        var cv = curveOf(b, c, d);
        var win = windowFor(cv);
        if (tailGap(cv, win) < CLEARANCE - 1e-9) { return; }
        var pairs = markPairs(gridNodes(cv, win), constraints.marks || 'any', b);
        shuffled(pairs, random).slice(0, 3).forEach(function (marks) {
          var queries = [null];
          if (constraints.query) {
            queries = queryCandidates(cv, win, constraints.query, marks);
            if (!queries.length) { return; }
          }
          shuffled(queries, random).slice(0, 8).forEach(function (query) {
            var answer = answerOf(task.answerRule, cv, form, query);
            if (answer === null || !answerKindOk(answer, constraints.answerKind)) { return; }
            found.push(build(task, set, cv, form, win, marks, query, answer, random));
          });
        });
      });
    });
  });

  return shuffled(found, random).slice(0, CANDIDATE_POOL);
}

/* ══════════════════════════════════════════════════════════
   Сцена и итог задачи
   ══════════════════════════════════════════════════════════ */
function sceneOf(built, extra) {
  var cv = built.curve;
  var win = built.window;
  return {
    window: win,
    grid: { step: 1, show: true },
    axes: { labelX: 'x', labelY: 'y', origin: '0' },
    labelRules: 'strict',
    axisLabels: (extra && extra.axisLabels) || 'minimal',
    curves: [{ type: 'loga', a: P.value(cv.base), c: cv.c, d: cv.d, color: 'lineA', label: null }],
    points: built.points.map(function (point) {
      return { x: point.x, y: point.y, style: 'solid', color: 'lineA', label: point.label || null };
    }),
    /* Асимптота x = −c — тонкий пунктир; при c = 0 это сама ось Oy. */
    shapes: asymptotes([verticalAsymptote(-cv.c, win)]).concat((extra && extra.shapes) || []),
    alt: 'График логарифмической функции'
  };
}

function exactMeta(f) { return f ? { p: f.p, q: f.q } : null; }

function result(set, task, built, seed) {
  var cv = built.curve;
  var query = built.query;
  var values = {
    x0: query && query.x0 ? P.valueText(query.x0) : '',
    y0: query && query.y0 ? P.valueText(query.y0) : ''
  };
  var scene = sceneOf(built, { axisLabels: task.axisLabels || set.axisLabels });
  return {
    id: task.id,
    kind: set.kind,
    svg: renderer.renderGraph(scene),
    scene: scene,
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
    source: task.source || null,
    meta: {
      family: 'logarithmic',
      set: set.id,
      seed: seed,
      form: built.form,
      rule: task.answerRule,
      source: task.source || null,
      answer: exactMeta(built.answer),
      base: P.baseMeta(cv.base),
      c: cv.c,
      d: cv.d,
      window: built.window,
      points: built.points.map(function (point) {
        return { x: point.x, y: point.y, n: point.n, role: point.role, label: point.label || null };
      }),
      query: query ? { type: query.type, n: query.n,
                       x0: exactMeta(query.x0), y0: exactMeta(query.y0),
                       answer: exactMeta(query.answer) } : null,
      level: task.level || null
    }
  };
}

function fromMeta(meta) {
  return { kind: 'single', form: meta.form, window: meta.window, points: meta.points,
           curve: curveOf(P.fromMeta(meta.base), meta.c, meta.d) };
}

/** Чертёж с построениями — только подсказка, разбор и лист учителя. */
function sceneWith(meta, shapes) {
  return sceneOf(fromMeta(meta), { shapes: shapes });
}

/** Пунктиры от опорных точек к осям — вспомогательное построение. */
function guideShapes(meta) {
  var out = [];
  meta.points.forEach(function (point) {
    if (point.y !== 0) { out.push({ type: 'segment', from: [point.x, 0], to: [point.x, point.y],
                                    style: 'dashed', color: 'accent' }); }
    if (point.x !== 0) { out.push({ type: 'segment', from: [0, point.y], to: [point.x, point.y],
                                    style: 'dashed', color: 'accent' }); }
  });
  return out;
}

const api = {
  candidates: candidates,
  result: result,
  valueAt: valueAt,
  windowFor: windowFor,
  tailGap: tailGap,
  readable: readable,
  curveOf: curveOf,
  fromMeta: fromMeta,
  sceneWith: sceneWith,
  guideShapes: guideShapes,
  logExact: logExact,
  CLEARANCE: CLEARANCE
};

export default api;
export { candidates, result, valueAt, windowFor, tailGap, readable, curveOf, fromMeta, sceneWith,
         guideShapes, logExact };
