/* generate-exponential.js — сборка вариантов задач о показательной функции.

   Внутри движка кривая одна: y = a^(x + c) + d. Три записи из условий
   (буквы — как в открытом банке ФИПИ):

     basic   f(x) = aˣ           c = 0, d = 0
     shiftY  f(x) = aˣ + b       c = 0, b = d — сдвиг вверх-вниз
     shiftX  f(x) = a^(x + b)    d = 0, b = c — сдвиг влево-вправо

   Основание a = r^(1/m) (graph/base-power.js): целое, 1/n или, у
   «неудачных» задач, √2, 1/√3 — как в банке ФИПИ.

   Правила чертежа:
     • асимптота y = d — тонкий пунктир (при d = 0 это ось Ox, её не
       дублируем); кривая её не пересекает и не касается: у края окна,
       к которому кривая прижимается, зазор до асимптоты не меньше
       CLEARANCE клетки, иначе вариант отбрасывается;
     • отмечены ровно две опорные точки, обе в узлах сетки и не ближе
       клетки к рамке: по ним ученик составляет систему уравнений;
     • окно считается только по кривой. Если ответ читается с рисунка,
       генератор берёт другие параметры, а не двигает окно;
     • ОТВЕТ НЕ ЧИТАЕТСЯ С РИСУНКА: спрошенная точка либо за рамкой с
       запасом не меньше клетки, либо её координаты не в узле сетки;
     • всё, что идёт в ответ, — целое или конечная десятичная дробь не
       длиннее трёх знаков.

   Правила ответа (task.answerRule): value-at, argument-for, coef-a,
   coef-b. В шаблон условия подставляются {x0} и {y0}.

   Ограничения задачи (task.constraints):
     bases     — список оснований [{ r: 2 }, { r: [1, 3] }, { r: 2, m: 2 }]
     direction — 'up' | 'down' (возрастает или убывает)
     shiftAbs  — насколько далеко сдвиг b (по умолчанию 4)
     shiftSign — 'positive' | 'negative'
     marks     — 'unit': одна из точек — та, где показатель равен нулю
                 (y = 1 + d); 'far': обе точки дальше; 'any'
     query     — { type: 'value-at' | 'argument-for', kind: 'integer' |
                   'decimal' | 'any', outside: true — точка за рамкой }
     answerKind — 'integer' | 'decimal'
     fixed     — задача из открытого банка ФИПИ: параметры, опорные
                 точки, запрос и окно как в банке. Правило «ответ не
                 читается» к ней не применяется: это исходный рисунок. */

'use strict';

import renderer from './renderer.js';
import './families/expo.js';
import math from './math.js';
import Line from './families/line.js';
import P from './base-power.js';
import { horizontalAsymptote, asymptotes, CLEARANCE } from './families/shared.js';
import { rng, shuffled } from './random.js';
import { plainText, typesetText, fillTemplate, answerText } from './text.js';

var frac = Line.frac, add = Line.add, num = Line.num, isInt = Line.isInt;

var CANDIDATE_POOL = 160;
var POINT_MARGIN = 1;
var ANSWER_MAX = 300;
var ANSWER_PLACES = 3;
var X0_RANGE = 10;
var N_RANGE = 12;
var HEIGHT = 12;

/* Основания до 5: у 6 и больше хвост уже в клетке левее оси ближе
   CLEARANCE к асимптоте — кривая легла бы на неё. */
var DEFAULT_UP = [2, 3, 4, 5].map(function (r) { return { r: r }; });
var DEFAULT_DOWN = [2, 3, 4, 5].map(function (r) { return { r: [1, r] }; });

/* ══════════════════════════════════════════════════════════
   Кривая y = a^(x + c) + d
   ══════════════════════════════════════════════════════════ */

function curveOf(b, c, d) { return { base: b, c: c, d: d }; }

/** Значение в точке x точно; null — степень иррациональна. */
function valueAt(cv, x) {
  var p = P.pow(cv.base, x + cv.c);
  return p === null ? null : add(p, frac(cv.d));
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

/**
 * Окно только по кривой. Высота — HEIGHT клеток, асимптота — две
 * клетки над нижней рамкой (или ось Ox, если асимптота выше неё).
 * По горизонтали: со стороны хвоста окно кончается там, где кривая
 * ещё отстоит от асимптоты на CLEARANCE; со стороны роста — через две
 * клетки после выхода кривой за верхнюю рамку.
 */
function windowFor(cv) {
  var a = P.value(cv.base);
  var ymin = Math.min(0, cv.d) - 2;
  var ymax = ymin + HEIGHT;
  var tail = -cv.c + Math.log(CLEARANCE) / Math.log(a);
  var exit = -cv.c + Math.log(ymax - cv.d) / Math.log(a);
  var xmin, xmax;
  if (a > 1) {
    xmin = clamp(Math.ceil(tail - 1e-9), -8, -1);
    xmax = clamp(Math.ceil(exit) + 2, 3, 8);
  } else {
    xmax = clamp(Math.floor(tail + 1e-9), 1, 8);
    xmin = clamp(Math.floor(exit) - 2, -8, -3);
  }
  return { xmin: xmin, xmax: xmax, ymin: ymin, ymax: ymax };
}

/** Зазор между кривой и асимптотой у края окна со стороны хвоста. */
function tailGap(cv, win) {
  var a = P.value(cv.base);
  var edge = a > 1 ? win.xmin : win.xmax;
  return Math.pow(a, edge + cv.c);
}

function inside(x, y, win, margin) {
  return x >= win.xmin + margin - 1e-9 && x <= win.xmax - margin + 1e-9 &&
         y >= win.ymin + margin - 1e-9 && y <= win.ymax - margin + 1e-9;
}

/**
 * Ответ читается с рисунка: точка в узле сетки и в окне или в клетке
 * от рамки. Такой вариант не годится — его отбрасывают.
 */
function readable(x, y, win) {
  return isInt(x) && isInt(y) && inside(num(x), num(y), win, -1);
}

/** Узлы сетки на кривой: показатель n кратен m, aⁿ — целое. */
function gridNodes(cv, win) {
  var out = [];
  for (var n = -N_RANGE; n <= N_RANGE; n++) {
    var p = P.pow(cv.base, n);
    if (p === null || !isInt(p)) { continue; }
    var x = n - cv.c;
    var y = num(p) + cv.d;
    if (!inside(x, y, win, POINT_MARGIN)) { continue; }
    out.push({ x: x, y: y, n: n });
  }
  return out;
}

/**
 * Пары опорных точек. 'unit' — одна из точек та, где показатель равен
 * нулю (там aⁿ = 1); 'far' — обе дальше, система решается труднее;
 * 'any' — любые. Точки не дальше трёх шагов друг от друга: иначе
 * второе уравнение даёт степень, которую в уме не извлечь.
 */
function markPairs(nodes, mode, b) {
  var pairs = [];
  for (var i = 0; i < nodes.length; i++) {
    for (var j = i + 1; j < nodes.length; j++) {
      var p = nodes[i], q = nodes[j];
      if (Math.abs(q.n - p.n) > 3 * b.m) { continue; }
      var unit = p.n === 0 || q.n === 0;
      if (mode === 'unit' && !unit) { continue; }
      if (mode === 'far' && unit) { continue; }
      /* Ближняя к началу точка — первой: с неё начинается система. */
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
  marks.forEach(function (mk) { taken[mk.x] = true; });
  function kindOk(f) {
    if (kind === 'integer') { return isInt(f); }
    if (kind === 'decimal') { return !isInt(f); }
    return true;
  }
  /* «За рамкой» нужно только целому ответу: точку с дробной
     координатой с сетки не прочитать и в окне. */
  function outsideOk(x, y) {
    var need = spec.outside === undefined ? kind === 'integer' : spec.outside;
    return !need || !inside(num(x), num(y), win, -1);
  }
  if (spec.type === 'value-at') {
    for (var x0 = -X0_RANGE; x0 <= X0_RANGE; x0++) {
      if (taken[x0]) { continue; }
      var y = valueAt(cv, x0);
      if (y === null || !goodNumber(y) || !kindOk(y)) { continue; }
      if (readable(frac(x0), y, win) || !outsideOk(frac(x0), y)) { continue; }
      out.push({ type: 'value-at', x0: frac(x0), answer: y, n: x0 + cv.c });
    }
  } else if (spec.type === 'argument-for') {
    for (var n = -N_RANGE; n <= N_RANGE; n++) {
      var p = P.pow(cv.base, n);
      if (p === null) { continue; }
      var y0 = add(p, frac(cv.d));
      var x = frac(n - cv.c);
      if (Math.abs(num(x)) > X0_RANGE || taken[num(x)]) { continue; }
      if (!goodNumber(y0) || !kindOk(y0)) { continue; }
      if (readable(x, y0, win) || !outsideOk(x, y0)) { continue; }
      out.push({ type: 'argument-for', y0: y0, answer: x, n: n });
    }
  } else {
    throw new Error('generate-exponential: неизвестный запрос «' + spec.type + '»');
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
  return {
    kind: 'single', form: form, curve: cv, window: win, query: query,
    points: marks.map(function (mk) { return { x: mk.x, y: mk.y, n: mk.n, role: 'mark' }; }),
    answer: answer,
    answerKey: 'ans:' + P.key(answer),
    pairKey: 'e:' + sig + ':' + marks.map(function (mk) { return mk.n; }).join(',') +
      (query ? ':' + query.type + P.key(query.answer) : ''),
    /* Рисунок: кривая и опорные точки. Набор с uniqueVertices не
       повторяет рисунок — при одной кривой отличаются точки. */
    vertexKey: 'pic:' + sig + ':' + marks.map(function (mk) { return mk.n; }).join(','),
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
    var p = P.pow(b, n);
    return { x: n - cv.c, y: num(p) + cv.d, n: n };
  });
  var query = null;
  if (fx.x0 !== undefined) {
    query = { type: 'value-at', x0: frac(fx.x0), answer: valueAt(cv, fx.x0), n: fx.x0 + cv.c };
  } else if (fx.y0 !== undefined) {
    var y0 = Line.toFrac(fx.y0);
    var n = null;
    for (var k = -N_RANGE; k <= N_RANGE && n === null; k++) {
      var p = P.pow(b, k);
      if (p !== null && P.key(add(p, frac(cv.d))) === P.key(y0)) { n = k; }
    }
    if (n === null) { throw new Error('generate-exponential: у ' + task.id + ' значение не степень основания'); }
    query = { type: 'argument-for', y0: y0, answer: frac(n - cv.c), n: n };
  }
  var answer = answerOf(task.answerRule, cv, form, query);
  var built = build(task, set, cv, form, win, marks, query, answer, rng(set.id + task.id + seed));
  /* Задача банка — сама по себе: её ответ и рисунок не мешают аналогам. */
  ['answerKey', 'pairKey', 'vertexKey', 'slopeKey', 'interceptKey'].forEach(function (name) {
    built[name] = 'fipi-' + name + ':' + task.id;
  });
  return [built];
}

function candidates(task, set, seed) {
  var constraints = task.constraints || {};
  var form = task.form || set.form;
  if (!form) { throw new Error('generate-exponential: у ' + task.id + ' не задана запись функции'); }
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
        /* Хвост сливается с асимптотой — окно не двигаем, вариант не годится. */
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
    curves: [{ type: 'expo', a: P.value(cv.base), c: cv.c, d: cv.d, color: 'lineA', label: null }],
    points: built.points.map(function (point) {
      return { x: point.x, y: point.y, style: 'solid', color: 'lineA', label: point.label || null };
    }),
    /* Асимптота — под кривой: тонкий пунктир, при d = 0 это сама ось. */
    shapes: asymptotes([horizontalAsymptote(cv.d, win)]).concat((extra && extra.shapes) || []),
    alt: 'График показательной функции'
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
      family: 'exponential',
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

/** Кривая из meta задачи — для разбора, подсказки и листа учителя. */
function fromMeta(meta) {
  return { kind: 'single', form: meta.form, window: meta.window, points: meta.points,
           curve: curveOf(P.fromMeta(meta.base), meta.c, meta.d) };
}

/**
 * Чертёж задачи с дополнительными построениями (пунктиры от опорных
 * точек к осям). Только для подсказки, разбора и листа учителя: у
 * ученика на листе и в тренажёре чертёж задачи как есть.
 */
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
  CLEARANCE: CLEARANCE
};

export default api;
export { candidates, result, valueAt, windowFor, tailGap, readable, curveOf, fromMeta, sceneWith,
         guideShapes };
