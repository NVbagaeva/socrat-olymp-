/* generate-quadratic.js — сборка вариантов задач о параболе.

   Семейство «парабола» в генераторе: кандидаты одиночной параболы,
   пары «парабола и прямая» и «парабола и парабола», правила ответа,
   варианты формулы с пояснениями к неверным, сцена чертежа и итог
   задачи. Устройство то же, что у прямой в generate.js: кандидаты
   перебираются по seed, проходят правила читаемости, а набор целиком
   собирает общий перебор с возвратом под правила состава.

   Правила читаемости — в families/quadratic.js (RULES), здесь только
   перебор и тексты. Модуль не знает ни про DOM, ни про наборы прямой.

   Ограничения задачи (task.constraints) для параболы:

     aKind:      'integer' | 'fraction' | 'any'       — какие a перебираются
     direction:  'up' | 'down'                        — знак a
     absA:       число, [p, q] или список таких       — ровно эти |a|
     absAMin, absAMax, excludeAbsA
     vertex:     { x: 'integer'|'half'|'any', y: …, xSign, ySign,
                   xNonZero, yNonZero, xAbsMin, xAbsMax, yAbsMin, yAbsMax }
     cInteger (по умолчанию да), cNonZero, cSign, cAbsMax, cVisible
     bInteger, bNonZero, bSign
     roots:      'integer'                            — два целых нуля
     rootsVisible: true                               — нули внутри окна
     form:       'general' | 'vertex' | 'roots'       — запись формулы
     window, windowMin, windowMax, vertexMargin, sidePoints
     marks:      { vertex, intercept, points: n, labels, sides: 'both',
                   symmetric: true | false }  — пара точек симметрична
                   относительно оси параболы или нет; не задано — любая
     query:      { type: 'value-at' | 'argument-for', outside, xAbsMax,
                   yAbsMax, allowHalf, answerKind, side, pick, decimals }
     line:       { … ограничения наклона прямой: kKind, direction,
                   absKMin, absKMax }                 — парабола и прямая
     second:     { … ограничения a второй параболы }  — две параболы
     intersection: { visible: 'one' | 'both', which: 'hidden' | 'left' |
                   'right' | 'upper' | 'lower' | 'visible', axis: 'x' | 'y',
                   marks: 'visible' | 'both' | 'asked' | 'other' | 'none',
                   labels, avoidAxes, gapMax, margin, offscreenMin, angleMin }
                   При visible: 'one' видимая точка стоит в узле не ближе
                   margin клеток к рамке, скрытая вынесена за рамку не
                   меньше чем на offscreenMin, угол в видимой точке не
                   меньше angleMin, зазор между кривыми на видимой части
                   не убывает, а вопрос — всегда о скрытой точке.
     options:    число вариантов формулы (по умолчанию 6)
*/

'use strict';

import renderer from './renderer.js';
import math from './math.js';
import Line from './families/line.js';
import Q from './families/quadratic.js';
import { rng, shuffled, answerPlaces } from './random.js';
import { numberText, pointText, plainText, typesetText, fillTemplate, answerText,
         decimalFriendly } from './text.js';

var frac = Line.frac, add = Line.add, sub = Line.sub, mul = Line.mul, div = Line.div,
    num = Line.num, isInt = Line.isInt, isZero = Line.isZero;

/* Пулы шире, чем у прямой: у задачи о параболе a часто задан ровно
   один, и весь её выбор — это вершины. Перебор с возвратом должен
   иметь из чего выбирать, когда набор запрещает повторы вершин
   и ответов. */
var CANDIDATE_POOL = 120;     /* сколько лучших кандидатов держим на задачу        */
var POOL_PER_A = 40;          /* сколько вариантов с одним a держим в пуле          */
var FIRST_POOL = 40;          /* сколько первых парабол перебирается в задачах с двумя графиками */
var QUERY_POOL = 10;          /* из скольких запросов выбирается один по seed        */
var OPTIONS = 6;              /* вариантов формулы в задаче с выбором               */

/* Пул a: целые и дробные, каждый с обоими знаками. */
var A_INTEGER = [1, 2, 3];
var A_FRACTION = [[1, 2], [1, 4], [3, 2]];

function asNumber(value) {
  return Array.isArray(value) ? value[0] / value[1] : value;
}

function sameAbs(f, wanted) {
  return Math.abs(Math.abs(num(f)) - Math.abs(asNumber(wanted))) < 1e-9;
}

/* Подпись дроби для ключей: по значению, чтобы 1/2 и 2/4 совпали. */
function key(f) {
  return String(Math.round(num(f) * 1e6) / 1e6);
}

function signature(p) {
  return key(p.a) + '@' + key(p.m) + ';' + key(p.n);
}

/* Число в текст: запятая, типографский минус. */
function fmt(f) {
  return Q.numberText(f);
}

/* ══════════════════════════════════════════════════════════
   Кандидаты коэффициентов и вершины
   ══════════════════════════════════════════════════════════ */
function aCandidates(constraints) {
  var kind = constraints.aKind || 'any';
  var list = [];

  function push(value) {
    var f = Q.toExact(value);
    list.push(f);
    list.push(mul(frac(-1), f));
  }

  if (kind === 'integer' || kind === 'any') { A_INTEGER.forEach(push); }
  if (kind === 'fraction' || kind === 'any') { A_FRACTION.forEach(push); }

  var absA = constraints.absA === undefined ? null
    : (Array.isArray(constraints.absA) && Array.isArray(constraints.absA[0]) ? constraints.absA
       : (Array.isArray(constraints.absA) && constraints.absA.length === 2 &&
          typeof constraints.absA[0] === 'number' && typeof constraints.absA[1] === 'number' &&
          constraints.absAList !== true ? [constraints.absA]
          : (Array.isArray(constraints.absA) ? constraints.absA : [constraints.absA])));

  return list.filter(function (f) {
    var value = num(f);
    var abs = Math.abs(value);
    if (abs < Q.RULES.absAMin - 1e-9 || abs > Q.RULES.absAMax + 1e-9) { return false; }
    if (constraints.direction === 'up' && value <= 0) { return false; }
    if (constraints.direction === 'down' && value >= 0) { return false; }
    if (absA !== null && !absA.some(function (w) { return sameAbs(f, w); })) { return false; }
    if (constraints.absAMin !== undefined && abs < asNumber(constraints.absAMin) - 1e-9) { return false; }
    if (constraints.absAMax !== undefined && abs > asNumber(constraints.absAMax) + 1e-9) { return false; }
    if (constraints.excludeAbsA &&
        constraints.excludeAbsA.some(function (w) { return sameAbs(f, w); })) { return false; }
    return true;
  });
}

/* Координата вершины: целые и (или) полуцелые в пределах limit. */
function vertexValues(spec, limit) {
  var kind = spec.kind || 'integer';
  var list = [];
  var value;
  if (kind === 'integer' || kind === 'any') {
    for (value = -limit; value <= limit; value++) { list.push(frac(value)); }
  }
  if (kind === 'half' || kind === 'any') {
    for (value = -limit; value < limit; value++) { list.push(frac(2 * value + 1, 2)); }
  }
  return list.filter(function (f) {
    var v = num(f);
    if (spec.nonZero && Math.abs(v) < 1e-9) { return false; }
    if (spec.sign === 'positive' && v <= 0) { return false; }
    if (spec.sign === 'negative' && v >= 0) { return false; }
    if (spec.absMin !== undefined && Math.abs(v) < spec.absMin - 1e-9) { return false; }
    if (spec.absMax !== undefined && Math.abs(v) > spec.absMax + 1e-9) { return false; }
    return true;
  });
}

function vertexSpec(constraints, axis) {
  var v = constraints.vertex || {};
  return {
    kind: v[axis] || 'integer',
    sign: v[axis + 'Sign'],
    nonZero: v[axis + 'NonZero'],
    absMin: v[axis + 'AbsMin'],
    absMax: v[axis + 'AbsMax']
  };
}

/* Коэффициенты b и c под ограничениями задачи. */
function coefficientsOk(p, constraints) {
  if (constraints.cInteger !== false && !isInt(p.c)) { return false; }
  if (constraints.cNonZero && isZero(p.c)) { return false; }
  if (constraints.cSign === 'positive' && num(p.c) <= 0) { return false; }
  if (constraints.cSign === 'negative' && num(p.c) >= 0) { return false; }
  if (constraints.cAbsMax !== undefined && Math.abs(num(p.c)) > constraints.cAbsMax + 1e-9) { return false; }
  if (constraints.bInteger && !isInt(p.b)) { return false; }
  if (constraints.bNonZero && isZero(p.b)) { return false; }
  if (constraints.bSign === 'positive' && num(p.b) <= 0) { return false; }
  if (constraints.bSign === 'negative' && num(p.b) >= 0) { return false; }
  /* Всё, что ученик прочитает с чертежа или получит в ответе,
     должно записываться конечной десятичной дробью. */
  if (!decimalFriendly(p.b) || !decimalFriendly(p.c)) { return false; }
  return true;
}

/* Нули функции под ограничениями: два целых, при rootsVisible — в окне. */
function rootsOk(p, win, constraints) {
  if (constraints.roots !== 'integer' && !constraints.rootsVisible) { return true; }
  var xs = Q.rootsOf(p);
  if (xs === null || xs.length !== 2) { return false; }
  if (constraints.roots === 'integer' && !(isInt(xs[0]) && isInt(xs[1]))) { return false; }
  if (constraints.rootsVisible && win) {
    return xs.every(function (x) { return Math.abs(num(x)) <= win.xmax - 1 + 1e-9; });
  }
  return true;
}

/* ══════════════════════════════════════════════════════════
   Отмеченные точки
   constraints.marks = { vertex, intercept, points, labels, sides }
   ══════════════════════════════════════════════════════════ */
function markLabel(spec, x, y) {
  return spec.labels ? pointText('', x, y) : null;
}

function chooseMarks(p, win, spec, random) {
  if (!spec) { return []; }
  var marks = [];
  var taken = {};

  function take(x, y, role) {
    var id = x + ';' + y;
    if (taken[id]) { return; }
    taken[id] = true;
    marks.push({ x: x, y: y, role: role, label: markLabel(spec, x, y) });
  }

  if (spec.vertex) {
    /* Вершина отмечается и на полуцелых координатах: она читается
       по симметрии, а не по узлу сетки. */
    take(p.mValue, p.nValue, 'vertex');
  }
  if (spec.intercept) {
    if (!isInt(p.c) || Math.abs(p.cValue) > win.ymax - 1) { return null; }
    take(0, p.cValue, 'intercept');
  }

  var want = spec.points || 0;
  if (want > 0) {
    var all = Q.integerPoints(p, win).filter(function (point) {
      return !taken[point.x + ';' + point.y];
    });
    /* Точки на осях путаются с осями и подписями чисел: берутся
       только тогда, когда других не хватает. */
    var clean = all.filter(function (point) { return point.x !== 0 && point.y !== 0; });
    var pool = clean.length >= want ? clean : all;
    if (pool.length < want) { return null; }

    var picked = [];
    if (spec.sides === 'both' && want >= 2) {
      var left = shuffled(pool.filter(function (pt) { return pt.x < p.mValue; }), random);
      var right = shuffled(pool.filter(function (pt) { return pt.x > p.mValue; }), random);
      if (!left.length || !right.length) { return null; }
      /* Пара по обе стороны от вершины: симметричная — если задача
         просит симметрию, несимметричная — если запрещает. */
      var pair = null;
      for (var i = 0; i < left.length && !pair; i++) {
        for (var j = 0; j < right.length && !pair; j++) {
          var mirror = symmetricPair(p, left[i], right[j]);
          if (spec.symmetric === true && !mirror) { continue; }
          if (spec.symmetric === false && mirror) { continue; }
          pair = [left[i], right[j]];
        }
      }
      if (!pair) { return null; }
      picked.push(pair[0], pair[1]);
      var rest = shuffled(pool.filter(function (pt) {
        return pt !== pair[0] && pt !== pair[1];
      }), random);
      while (picked.length < want && rest.length) { picked.push(rest.shift()); }
    } else {
      picked = shuffled(pool, random).slice(0, want);
    }
    if (picked.length < want) { return null; }
    picked.forEach(function (point) { take(point.x, point.y, 'point'); });
  }
  return marks;
}

/* Две точки симметричны относительно оси параболы: одна высота,
   абсциссы равноудалены от вершины. По такой паре вершина находится
   без счёта — это законный метод, но набор ограничивает число таких
   задач и помечает их. */
function symmetricPair(p, a, b) {
  return Math.abs(a.y - b.y) < 1e-9 && Math.abs(a.x + b.x - 2 * p.mValue) < 1e-9;
}

/* Симметрична ли пара отмеченных узлов задачи. */
function marksSymmetric(p, marks) {
  var points = marks.filter(function (mark) { return mark.role === 'point'; });
  return points.length === 2 && symmetricPair(p, points[0], points[1]);
}

/* ══════════════════════════════════════════════════════════
   Запрос: значение по аргументу и аргумент по значению
   ══════════════════════════════════════════════════════════ */
function decimalsOk(f, decimals) {
  var scale = Math.pow(10, decimals === undefined ? 1 : decimals);
  return (scale % f.q) === 0;
}

function outsideWindow(x, y, win) {
  return Math.abs(x) > win.xmax + 1e-9 || Math.abs(y) > win.ymax + 1e-9;
}

function queryCandidates(p, win, spec) {
  var xAbsMax = spec.xAbsMax === undefined ? 10 : spec.xAbsMax;
  var yAbsMax = spec.yAbsMax === undefined ? 60 : spec.yAbsMax;
  var step = spec.allowHalf ? 0.5 : 1;
  var found = [];

  for (var x = -xAbsMax; x <= xAbsMax + 1e-9; x += step) {
    if (Math.abs(x) < 1e-9) { continue; }
    if (spec.side === 'right' && x < 0) { continue; }
    if (spec.side === 'left' && x > 0) { continue; }
    var X = Q.toExact(x);
    var Y = Q.yAt(p, X);
    if (!decimalsOk(X, spec.decimals) || !decimalsOk(Y, spec.decimals)) { continue; }
    if (Math.abs(num(Y)) > yAbsMax) { continue; }
    /* Суть задачи: точку нельзя снять с чертежа. */
    if (spec.outside !== false && !outsideWindow(num(X), num(Y), win)) { continue; }

    if (spec.type === 'argument-for') {
      /* Второй корень — симметричный: 2m − x. Он тоже должен
         записываться как в бланке, иначе условие «какой из двух»
         теряет смысл. */
      var other = sub(mul(frac(2), p.m), X);
      if (isZero(sub(other, X))) { continue; }
      if (!decimalsOk(other, spec.decimals)) { continue; }
      if (Math.abs(num(other)) > xAbsMax) { continue; }
      var picked = pickRoot(X, other, spec.pick || 'larger');
      if (picked === null) { continue; }
      if (spec.answerKind === 'half' && isInt(picked)) { continue; }
      if (spec.answerKind === 'integer' && !isInt(picked)) { continue; }
      found.push({ type: 'argument-for', y0: num(Y), y0Frac: Y, x0: num(picked),
                   other: num(sub(add(X, other), picked)), pick: spec.pick || 'larger',
                   answerFrac: picked, answer: num(picked) });
    } else {
      if (spec.answerKind === 'half' && isInt(Y)) { continue; }
      if (spec.answerKind === 'integer' && !isInt(Y)) { continue; }
      found.push({ type: 'value-at', x0: num(X), x0Frac: X, y0: num(Y),
                   answerFrac: Y, answer: num(Y) });
    }
  }

  /* Ближе к окну — понятнее; порядок детерминирован. */
  found.sort(function (u, v) {
    return Math.abs(u.x0) - Math.abs(v.x0) || Math.abs(u.answer) - Math.abs(v.answer) || u.x0 - v.x0;
  });
  return found;
}

/* Какой из двух корней спрашивается. null — условие не выполнить. */
function pickRoot(a, b, pick) {
  var lo = num(a) < num(b) ? a : b;
  var hi = num(a) < num(b) ? b : a;
  if (pick === 'larger') { return hi; }
  if (pick === 'smaller') { return lo; }
  if (pick === 'positive') { return num(lo) < 0 && num(hi) > 0 ? hi : null; }
  if (pick === 'negative') { return num(lo) < 0 && num(hi) > 0 ? lo : null; }
  throw new Error('generate-quadratic: неизвестный выбор корня «' + pick + '»');
}

function chooseQuery(p, win, spec, random) {
  var found = queryCandidates(p, win, spec);
  if (!found.length) { return null; }
  return shuffled(found.slice(0, QUERY_POOL), random)[0];
}

/* ══════════════════════════════════════════════════════════
   Одиночная парабола
   ══════════════════════════════════════════════════════════ */
function readabilityOptions(constraints) {
  return {
    window: constraints.window,
    windowMin: constraints.windowMin,
    windowMax: constraints.windowMax,
    vertexMargin: constraints.vertexMargin,
    sidePoints: constraints.sidePoints
  };
}

/* Чертёж читается лучше, когда окно теснее (клетка крупнее), вершина
   не жмётся к рамке и узлов сетки на ветвях больше. Отбраковку это
   не подменяет — оценивается только то, что прошло правила. */
function balanceScore(p, win, points) {
  var half = win.xmax;
  var spread = (Math.abs(p.mValue) + Math.abs(p.nValue)) / (2 * half);
  var nodes = Math.min(Q.integerPoints(p, win).length, 8) / 8;
  var marked = points.length >= 2 && Math.abs(points[1].x - points[0].x) >= 2 ? 0.1 : 0;
  return (8 - half) * 0.15 - spread * 0.4 + nodes * 0.3 + marked;
}

function singleCandidates(task, set, seed, opts) {
  var constraints = task.constraints || {};
  var random = rng(set.id + ':' + task.id + ':' + seed);
  var as = shuffled(aCandidates(constraints), random);
  var limit = (constraints.windowMax || Q.RULES.windowMax) -
              (constraints.vertexMargin === undefined ? Q.RULES.vertexMargin : constraints.vertexMargin);
  var ms = shuffled(vertexValues(vertexSpec(constraints, 'x'), limit), random);
  var ns = shuffled(vertexValues(vertexSpec(constraints, 'y'), limit), random);
  var readability = readabilityOptions(constraints);
  var form = task.form || set.form || 'general';
  var wantOptions = task.answerRule === 'equation-choice';
  var found = [];

  as.forEach(function (a) {
    ms.forEach(function (m) {
      ns.forEach(function (n) {
        var p = Q.fromVertex(a, m, n);
        if (!coefficientsOk(p, constraints)) { return; }
        if (form === 'roots' && !rootsOk(p, null, { roots: 'integer' })) { return; }

        var win = Q.windowForExact(p, readability);
        if (!win) { return; }
        if (!rootsOk(p, win, constraints)) { return; }
        if (constraints.cVisible && Math.abs(p.cValue) > win.ymax - 1) { return; }

        var sig = signature(p);
        var marks = chooseMarks(p, win, constraints.marks,
          rng(set.id + ':' + task.id + ':' + seed + ':marks:' + sig));
        if (marks === null) { return; }

        var query = null;
        if (constraints.query) {
          query = chooseQuery(p, win, constraints.query,
            rng(set.id + ':' + task.id + ':' + seed + ':query:' + sig));
          if (!query) { return; }
        }

        /* Вариантов формулы должно набраться сколько просят: иначе
           задача с выбором не соберётся, и лучше отбраковать сейчас. */
        if (wantOptions && !equationOptionsFit(p, form, task.options || set.options || OPTIONS)) {
          return;
        }

        found.push({
          parts: [{ kind: 'quadratic', curve: p, color: 'lineA', points: marks, label: true }],
          curve: p, window: win, points: marks, query: query, form: form,
          symmetricPair: marksSymmetric(p, marks),
          answerKey: answerKeyOf(task, p, query),
          score: balanceScore(p, win, marks),
          pairKey: 'q:' + sig,
          slopeKey: 'a:' + key(p.a),
          interceptKey: 'c:' + key(p.c),
          vertexKey: 'v:' + key(p.m) + ';' + key(p.n),
          zeroIntercept: isZero(p.c)
        });
      });
    });
  });

  found.sort(function (u, v) { return v.score - u.score || u.pairKey.localeCompare(v.pairKey); });
  return trimPool(found, opts && opts.limit);
}

/* Ключ ответа для запрета повторов в наборе: коэффициент, который
   спрашивают, или ответ запроса. У задач с выбором ответа ключа нет. */
function answerKeyOf(task, p, query) {
  var rule = task.answerRule;
  if (rule === 'a') { return 'ans:' + key(p.a); }
  if (rule === 'b') { return 'ans:' + key(p.b); }
  if (rule === 'c') { return 'ans:' + key(p.c); }
  return query ? 'ans:' + query.answer : null;
}

/* Пул кандидатов не должен состоять из одного a с разными вершинами:
   соседняя задача с теми же условиями упирается в запрет повторов. */
function trimPool(found, limit) {
  var perA = {};
  var pool = [];
  var cap = limit || CANDIDATE_POOL;
  found.forEach(function (candidate) {
    if (pool.length >= cap) { return; }
    var used = perA[candidate.slopeKey] || 0;
    if (used >= POOL_PER_A) { return; }
    perA[candidate.slopeKey] = used + 1;
    pool.push(candidate);
  });
  return pool;
}

/* ══════════════════════════════════════════════════════════
   Пара: парабола и прямая, парабола и парабола

   Вторая кривая проводится через две точки первой параболы с целыми
   координатами — тогда точки пересечения заведомо целые. Обе видны
   на сетке или, по просьбе задачи, одна видна, а вторая за кадром:
   тогда ответ получается решением уравнения, а не чтением.
   ══════════════════════════════════════════════════════════ */
function askedPoint(points, which) {
  var left = points[0].x < points[1].x ? points[0] : points[1];
  var right = points[0].x < points[1].x ? points[1] : points[0];
  var lower = points[0].y < points[1].y ? points[0] : points[1];
  var upper = points[0].y < points[1].y ? points[1] : points[0];
  if (which === 'left') { return left; }
  if (which === 'right') { return right; }
  if (which === 'upper') { return upper; }
  if (which === 'lower') { return lower; }
  if (which === 'visible') { return points[0].visible ? points[0] : points[1]; }
  if (which === 'hidden') { return points[0].visible ? points[1] : points[0]; }
  throw new Error('generate-quadratic: неизвестная точка пересечения «' + which + '»');
}

/* Пары точек первой параболы, через которые пойдёт вторая кривая.
   Точки на осях с подписью координат путаются с подписями осей,
   поэтому при подписанных точках они не берутся, если задача
   не попросила иного (avoidAxes: false). */
function pointPairs(p, win, spec) {
  var avoidAxes = spec.avoidAxes === undefined ? !!spec.labels : spec.avoidAxes;
  var inside = Q.integerPoints(p, win).filter(function (point) {
    return !avoidAxes || (point.x !== 0 && point.y !== 0);
  }).map(function (point) {
    return { x: point.x, y: point.y, visible: true };
  });
  var pairs = [];
  var i, j;

  if ((spec.visible || 'both') === 'both') {
    for (i = 0; i < inside.length; i++) {
      for (j = i + 1; j < inside.length; j++) {
        if (inside[j].x - inside[i].x < 2) { continue; }   /* слишком близкие точки сливаются */
        pairs.push([inside[i], inside[j]]);
      }
    }
    return pairs;
  }

  /* Одна точка внутри окна, вторая — за его рамкой: по x или по y.
     Видимая стоит не ближе margin клеток к рамке, скрытая вынесена
     за рамку не меньше чем на offscreenMin клеток. */
  var margin = spec.margin === undefined ? Q.RULES.crossMargin : spec.margin;
  var least = spec.offscreenMin === undefined ? Q.RULES.crossOffscreenMin : spec.offscreenMin;
  inside = inside.filter(function (point) {
    return Math.abs(point.x) <= win.xmax - margin + 1e-9 && Math.abs(point.y) <= win.ymax - margin + 1e-9;
  });
  var gap = spec.gapMax === undefined ? 6 : spec.gapMax;
  var outside = [];
  for (var x = -(win.xmax + gap); x <= win.xmax + gap; x++) {
    var y = Q.yAt(p, x);
    if (!isInt(y)) { continue; }
    var value = num(y);
    if (Q.offscreenBy({ x: x, y: value }, win) < least - 1e-9) { continue; }
    if (Math.abs(value) > win.ymax + gap * 3) { continue; }
    outside.push({ x: x, y: value, visible: false });
  }
  inside.forEach(function (a) {
    outside.forEach(function (b) {
      if (Math.abs(b.x - a.x) < 2) { return; }
      pairs.push(a.x < b.x ? [a, b] : [b, a]);
    });
  });
  return pairs;
}

function intersectionMarks(points, asked, spec) {
  var mode = spec.marks || (points.every(function (pt) { return pt.visible; }) ? 'both' : 'visible');
  return points.filter(function (point) {
    if (!point.visible) { return false; }
    if (mode === 'none') { return false; }
    if (mode === 'both' || mode === 'visible') { return true; }
    if (mode === 'asked') { return point === asked; }
    if (mode === 'other') { return point !== asked; }
    throw new Error('generate-quadratic: неизвестный режим отметки «' + mode + '»');
  }).map(function (point) {
    return { x: point.x, y: point.y, role: 'cross',
             label: spec.labels ? pointText('', point.x, point.y) : null };
  });
}

function lineFor(a, b, points) {
  var x1 = frac(points[0].x), x2 = frac(points[1].x);
  var y1 = frac(points[0].y);
  var k = add(mul(a, add(x1, x2)), b);              /* a(x₁ + x₂) + b */
  var intercept = sub(y1, mul(k, x1));
  return Line.create(k, intercept);
}

function lineOk(line, win, spec) {
  if (!Line.slopeReadable(line, { allowZeroSlope: false })) { return false; }
  var k = line.kValue;
  if (spec.direction === 'up' && k <= 0) { return false; }
  if (spec.direction === 'down' && k >= 0) { return false; }
  if (spec.kKind === 'integer' && !isInt(line.k)) { return false; }
  if (spec.kKind === 'fraction' && isInt(line.k)) { return false; }
  if (spec.absKMin !== undefined && Math.abs(k) < asNumber(spec.absKMin) - 1e-9) { return false; }
  if (spec.absKMax !== undefined && Math.abs(k) > asNumber(spec.absKMax) + 1e-9) { return false; }
  if (spec.bInteger && !isInt(line.b)) { return false; }
  if (!decimalFriendly(line.b)) { return false; }
  if (!Line.crossesWindow(line, win)) { return false; }
  return Line.integerPoints(line, win).length >= Line.RULES.minIntPoints;
}

function secondParabola(p, a2, points) {
  var x1 = frac(points[0].x), x2 = frac(points[1].x);
  var y1 = frac(points[0].y), y2 = frac(points[1].y);
  var slope = div(sub(y2, y1), sub(x2, x1));
  var b2 = sub(slope, mul(a2, add(x1, x2)));
  var c2 = sub(sub(y1, mul(a2, mul(x1, x1))), mul(b2, x1));
  return Q.exact(a2, b2, c2);
}

function halfInteger(f) {
  return isInt(mul(frac(2), f));
}

function secondOk(q, p, win, spec, readability) {
  if (isZero(sub(q.a, p.a))) { return false; }
  var vx = spec.vertex && spec.vertex.x === 'integer';
  var vy = spec.vertex && spec.vertex.y === 'integer';
  if (!(vx ? isInt(q.m) : halfInteger(q.m))) { return false; }
  if (!(vy ? isInt(q.n) : halfInteger(q.n))) { return false; }
  if (spec.cInteger !== false && !isInt(q.c)) { return false; }
  if (!decimalFriendly(q.b) || !decimalFriendly(q.c)) { return false; }
  return Q.readable(q, win, readability);
}

function pairCandidates(task, set, seed) {
  var constraints = task.constraints || {};
  var spec = constraints.intersection || {};
  var oneVisible = (spec.visible || 'both') === 'one';
  /* При одной видимой точке вопрос всегда о скрытой: видимая — опора
     для решения, ответом она не бывает. */
  var which = oneVisible ? 'hidden' : (spec.which || 'left');
  var axis = spec.axis || 'x';
  var angleMin = spec.angleMin === undefined ? Q.RULES.crossAngleMin : spec.angleMin;
  var withLine = !!constraints.line;
  var random = rng(set.id + ':' + task.id + ':' + seed + ':pair');
  var firsts = singleCandidates(task, set, seed, { limit: FIRST_POOL });
  var seconds = withLine ? null : shuffled(aCandidates(constraints.second || {}), random);
  var readability = readabilityOptions(constraints);
  var found = [];

  firsts.forEach(function (first) {
    var p = first.curve;
    var win = first.window;

    pointPairs(p, win, spec).forEach(function (points) {
      var candidates = withLine ? [null] : seconds;
      candidates.forEach(function (a2) {
        var other = null;
        var cross = null;
        if (withLine) {
          var line = lineFor(p.a, p.b, points);
          if (!lineOk(line, win, constraints.line)) { return; }
          other = { kind: 'line', line: line, color: 'lineB' };
          cross = Q.intersectLine(p, line);
        } else {
          var q = secondParabola(p, a2, points);
          if (!secondOk(q, p, win, constraints.second || {}, readability)) { return; }
          /* Отметки на второй параболе — по её собственному описанию. */
          var secondMarks = chooseMarks(q, win, (constraints.second || {}).marks,
            rng(set.id + ':' + task.id + ':' + seed + ':marks2:' + signature(q)));
          if (secondMarks === null) { return; }
          other = { kind: 'quadratic', curve: q, color: 'lineB', points: secondMarks };
          cross = Q.intersectParabola(p, q);
        }
        if (!cross || cross.length !== 2) { return; }

        /* Пересечения — ровно те две точки, через которые провели
           вторую кривую: иначе где-то потерялась точность. */
        var match = cross.every(function (pt, i) {
          return Math.abs(num(pt.x) - points[i].x) < 1e-9 && Math.abs(num(pt.y) - points[i].y) < 1e-9;
        });
        if (!match) { return; }

        var asked = askedPoint(points, which);
        var answer = axis === 'y' ? asked.y : asked.x;
        var firstPart = { kind: 'quadratic', curve: p };
        if (oneVisible) {
          var visible = points[0].visible ? points[0] : points[1];
          var hidden = points[0].visible ? points[1] : points[0];
          /* Видимая точка очевидна: кривые пересекаются под заметным
             углом, а не касаются и не идут рядом. */
          if (Q.crossAngle(firstPart, other, visible.x) < angleMin - 1e-9) { return; }
          /* Скрытая не угадывается: на видимой части кривые не сходятся. */
          if (!Q.gapGrows(firstPart, other, win, visible, hidden)) { return; }
          /* Ответ не читается с видимой точки. */
          if (answer === visible.x || answer === visible.y) { return; }
        }
        var marks = intersectionMarks(points, asked, spec);
        var sig = withLine
          ? 'ql:' + signature(p) + '|' + key(other.line.k) + '@' + key(other.line.b)
          : 'qq:' + signature(p) + '|' + signature(other.curve);

        found.push({
          parts: [
            { kind: 'quadratic', curve: p, color: 'lineA', points: first.points, label: true },
            other
          ],
          curve: p, window: win, points: first.points.concat(marks), form: first.form,
          intersection: {
            points: points.map(function (pt) { return { x: pt.x, y: pt.y, visible: pt.visible }; }),
            asked: { x: asked.x, y: asked.y, visible: asked.visible },
            other: { x: asked === points[0] ? points[1].x : points[0].x,
                     y: asked === points[0] ? points[1].y : points[0].y },
            which: which, axis: axis, x: asked.x, y: asked.y,
            oneVisible: oneVisible
          },
          answerKey: 'ans:' + answer,
          score: first.score + (marks.length ? 0.05 : 0) -
                 Math.abs(points[1].x - points[0].x) * 0.02,
          pairKey: sig,
          /* В паре ключ наклона — обе кривые: пул не должен состоять
             из одной параболы с разными прямыми. */
          slopeKey: first.slopeKey + '|' + (withLine ? 'k:' + key(other.line.k) : 'a:' + key(other.curve.a)),
          interceptKey: first.interceptKey,
          vertexKey: first.vertexKey,
          zeroIntercept: first.zeroIntercept
        });
      });
    });
  });

  found.sort(function (u, v) { return v.score - u.score || u.pairKey.localeCompare(v.pairKey); });
  return trimPool(found);
}

/* Точка входа для generate.js. */
function candidates(task, set, seed) {
  var constraints = task.constraints || {};
  if (constraints.line || constraints.second) { return pairCandidates(task, set, seed); }
  return singleCandidates(task, set, seed);
}

/* ══════════════════════════════════════════════════════════
   Варианты формулы: верный плюс типичные ошибки
   Каждый неверный вариант несёт пояснение, привязанное к тому, что
   в нём не так и что видно на чертеже.
   ══════════════════════════════════════════════════════════ */
function cellsWord(n) {
  return n === 1 ? 'одну клетку' : (n === 2 ? 'две клетки' : n + ' клетки');
}

function distractorKinds(p) {
  var a = p.a, m = p.m, n = p.n;
  var up = num(a) > 0;
  var step = Math.abs(num(a)) < 1 ? 2 : 1;
  var rise = mul(a, frac(step * step));
  var aOther = Math.abs(num(a)) >= 1.5 ? div(a, frac(2)) : mul(a, frac(2));
  var mirrorM = mul(frac(-1), m);
  var shiftM = add(m, frac(num(m) >= 0 ? 1 : -1));
  var mirrorN = mul(frac(-1), n);
  var shiftN = add(n, frac(num(n) >= 0 ? 1 : -1));
  var cOther = isZero(p.c) ? frac(up ? 2 : -2) : mul(frac(-1), p.c);

  function vertexNote(wrongM) {
    return 'Вершина стоит в x = ' + fmt(m) + ', а у этой формулы абсцисса вершины ' + fmt(wrongM) + '.';
  }
  function heightNote(wrongN) {
    return 'Вершина стоит на высоте y = ' + fmt(n) + ', а у этой формулы ' + fmt(wrongN) + '.';
  }

  var kinds = {
    signA: {
      make: function () { return Q.fromVertex(mul(frac(-1), a), m, n); },
      note: up ? 'Ветви направлены вверх, значит a > 0.' : 'Ветви направлены вниз, значит a < 0.'
    },
    valueA: {
      make: function () { return Q.fromVertex(aOther, m, n); },
      note: 'От вершины на ' + cellsWord(step) + ' вправо график уходит на ' +
            fmt(frac(Math.abs(rise.p), rise.q)) + ' по вертикали: a = ' + fmt(a) +
            ', а не ' + fmt(aOther) + '.'
    },
    valueC: {
      make: function () { return Q.exact(a, p.b, cOther); },
      note: 'График пересекает ось Oy в точке (0; ' + fmt(p.c) + '), значит c = ' + fmt(p.c) + '.'
    },
    mirrorM: {
      make: function () { return isZero(m) ? null : Q.fromVertex(a, mirrorM, n); },
      note: vertexNote(mirrorM)
    },
    shiftM: {
      make: function () { return Q.fromVertex(a, shiftM, n); },
      note: vertexNote(shiftM)
    },
    mirrorN: {
      make: function () { return isZero(n) ? null : Q.fromVertex(a, m, mirrorN); },
      note: heightNote(mirrorN)
    },
    shiftN: {
      make: function () { return Q.fromVertex(a, m, shiftN); },
      note: heightNote(shiftN)
    }
  };

  /* Форма через нули: ошибки в самих нулях. */
  var xs = Q.rootsOf(p);
  if (xs && xs.length === 2) {
    var x1 = xs[0], x2 = xs[1];
    function rootsNote(w1, w2) {
      return 'График пересекает ось Ox в точках ' + fmt(x1) + ' и ' + fmt(x2) +
             ', а у этой формулы нули ' + fmt(w1) + ' и ' + fmt(w2) + '.';
    }
    var n1 = mul(frac(-1), x1), n2 = mul(frac(-1), x2);
    var s2 = add(x2, frac(1)), s1 = sub(x1, frac(1));
    /* Ошибки в a при верных нулях: знак и величина. Вершинные варианты
       здесь не годятся — они меняют нули, и запись через нули не строится. */
    kinds.rootsSignA = {
      make: function () { return Q.fromRoots(mul(frac(-1), a), x1, x2); },
      note: kinds.signA.note
    };
    kinds.rootsValueA = {
      make: function () { return Q.fromRoots(aOther, x1, x2); },
      note: kinds.valueA.note
    };
    kinds.rootsMirror = {
      make: function () {
        return isZero(add(x1, x2)) ? null : Q.fromRoots(a, n1, n2);
      },
      note: rootsNote(n2, n1)
    };
    kinds.rootsShiftRight = {
      make: function () { return Q.fromRoots(a, x1, s2); },
      note: rootsNote(x1, s2)
    };
    kinds.rootsShiftLeft = {
      make: function () { return Q.fromRoots(a, s1, x2); },
      note: rootsNote(s1, x2)
    };
    kinds.rootsOneSign = {
      make: function () {
        return isZero(x1) || isZero(sub(n1, x2)) ? null : Q.fromRoots(a, n1, x2);
      },
      note: rootsNote(num(n1) < num(x2) ? n1 : x2, num(n1) < num(x2) ? x2 : n1)
    };
  }
  return kinds;
}

var KIND_ORDER = {
  general: ['signA', 'valueC', 'mirrorM', 'valueA', 'shiftM', 'mirrorN', 'shiftN'],
  vertex: ['signA', 'mirrorM', 'valueA', 'mirrorN', 'shiftM', 'shiftN'],
  roots: ['rootsSignA', 'rootsMirror', 'rootsValueA', 'rootsShiftRight', 'rootsShiftLeft',
          'rootsOneSign']
};

/* Неверные варианты в записи form: разные по виду ошибки, все с текстом,
   отличным от верного и друг от друга. */
function distractors(p, form) {
  var kinds = distractorKinds(p);
  var correct = Q.equationText(p, form);
  var seen = {};
  seen[correct] = true;
  var out = [];

  (KIND_ORDER[form] || KIND_ORDER.general).forEach(function (id) {
    var kind = kinds[id];
    if (!kind) { return; }
    var variant;
    try { variant = kind.make(); } catch { variant = null; }
    if (!variant) { return; }
    var text;
    try { text = Q.equationText(variant, form); } catch { return; }
    if (seen[text]) { return; }
    seen[text] = true;
    out.push({ id: id, text: text, note: kind.note });
  });
  return out;
}

function equationOptionsFit(p, form, count) {
  return distractors(p, form).length >= count - 1;
}

function equationChoice(ctx) {
  var count = ctx.task.options || ctx.set.options || OPTIONS;
  var form = ctx.form;
  var p = ctx.curve;
  var wrong = distractors(p, form).slice(0, count - 1);
  if (wrong.length < count - 1) {
    throw new Error('generate-quadratic: у ' + ctx.task.id + ' не набралось вариантов формулы');
  }

  var correct = { text: Q.equationText(p, form), correct: true, note: null };
  wrong = shuffled(wrong, rng(ctx.set.id + ':' + ctx.task.id + ':' + ctx.seed + ':choice'));
  var place = answerPlaces(ctx.set, ctx.seed, count)[ctx.index];
  var order = wrong.slice();
  order.splice(place - 1, 0, correct);

  var answer = null;
  var options = order.map(function (variant, i) {
    var number = String(i + 1);
    if (variant.correct) { answer = number; }
    return { number: number, text: variant.text, error: variant.note || null };
  });
  return { type: 'choice', options: options, answer: answer };
}

/* Знак a: два варианта, порядок постоянный. */
function signChoice(ctx) {
  var options = ['a > 0', 'a < 0'].map(function (text, i) {
    return { number: String(i + 1), text: text, error: null };
  });
  return { type: 'choice', options: options, answer: num(ctx.curve.a) > 0 ? '1' : '2' };
}

/* ══════════════════════════════════════════════════════════
   Правила вычисления ответа
   ══════════════════════════════════════════════════════════ */
var ANSWER_RULES = {
  'sign-a': signChoice,
  a: function (ctx) { return ctx.curve.a; },
  b: function (ctx) { return ctx.curve.b; },
  c: function (ctx) { return ctx.curve.c; },
  'value-at': function (ctx) {
    if (!ctx.query) { throw new Error('generate-quadratic: у ' + ctx.task.id + ' не выбран запрос'); }
    return ctx.query.answerFrac;
  },
  'argument-for': function (ctx) {
    if (!ctx.query) { throw new Error('generate-quadratic: у ' + ctx.task.id + ' не выбран запрос'); }
    return ctx.query.answerFrac;
  },
  'equation-choice': equationChoice,
  'intersection-x': function (ctx) {
    if (!ctx.intersection) { throw new Error('generate-quadratic: у ' + ctx.task.id + ' нет точки пересечения'); }
    return frac(ctx.intersection.asked.x);
  },
  'intersection-y': function (ctx) {
    if (!ctx.intersection) { throw new Error('generate-quadratic: у ' + ctx.task.id + ' нет точки пересечения'); }
    return frac(ctx.intersection.asked.y);
  }
};

/* ══════════════════════════════════════════════════════════
   Сцена чертежа
   ══════════════════════════════════════════════════════════ */
function curveOf(part, label) {
  if (part.kind === 'line') {
    return { type: 'line', k: part.line.kValue, b: part.line.bValue, color: part.color, label: label };
  }
  var p = part.curve;
  return { type: 'quadratic', a: p.aValue, b: p.bValue, c: p.cValue, color: part.color, label: label };
}

function sceneFor(built, task, set) {
  var single = built.parts.length === 1;
  var pair = task.curveLabels || set.curveLabels || ['y = f(x)', 'y = g(x)'];

  var points = [];
  built.parts.forEach(function (part) {
    (part.points || []).forEach(function (point) {
      points.push({ x: point.x, y: point.y, style: 'solid', color: part.color, label: point.label });
    });
  });
  /* Точки пересечения — терракотовые, как проверяемая точка у прямой:
     их нельзя спутать с опорными точками самой параболы. */
  built.points.filter(function (point) { return point.role === 'cross'; }).forEach(function (point) {
    points.push({ x: point.x, y: point.y, style: 'solid', color: 'lineB', label: point.label });
  });

  var second = built.parts[1];
  return {
    window: built.window,
    grid: { step: 1, show: true },
    axes: { labelX: 'x', labelY: 'y', origin: '0' },
    axisLabels: task.axisLabels || set.axisLabels || 'minimal',
    curves: built.parts.map(function (part, index) {
      var label = single
        ? (task.curveLabel === null ? null : (task.curveLabel || set.curveLabel || 'y = f(x)'))
        : (pair[index] || null);
      return curveOf(part, label);
    }),
    points: points,
    alt: single ? 'График квадратичной функции'
        : (second.kind === 'line' ? 'Графики квадратичной и линейной функций'
                                  : 'Графики двух квадратичных функций')
  };
}

/* ══════════════════════════════════════════════════════════
   Итог задачи: то же, что taskResult у прямой
   ══════════════════════════════════════════════════════════ */
function partMeta(part) {
  if (part.kind === 'line') {
    return { kind: 'line', k: part.line.kValue, b: part.line.bValue,
             kFraction: part.line.k, bFraction: part.line.b };
  }
  var p = part.curve;
  return { kind: 'quadratic', a: p.aValue, b: p.bValue, c: p.cValue, m: p.mValue, n: p.nValue,
           aFraction: p.a, bFraction: p.b, cFraction: p.c, mFraction: p.m, nFraction: p.n,
           points: part.points || null };
}

function result(set, task, built, seed, index) {
  var rule = ANSWER_RULES[task.answerRule];
  if (!rule) { throw new Error('generate-quadratic: неизвестное правило ответа «' + task.answerRule + '»'); }

  var p = built.curve;
  var form = built.form || task.form || set.form || 'general';
  var value = rule({ curve: p, window: built.window, points: built.points, query: built.query,
                     intersection: built.intersection, parts: built.parts, form: form,
                     task: task, set: set, seed: seed, index: index });
  var choice = value && value.type === 'choice' ? value : null;

  var query = built.query;
  var second = built.parts[1];
  var labelled = built.points.filter(function (point) { return point.label; });
  var values = {
    equation: Q.equationText(p, form),
    a: fmt(p.a), b: fmt(p.b), c: fmt(p.c), m: fmt(p.m), n: fmt(p.n),
    /* Для условий вида «y = 2x² + bx + 1»: слагаемое с a и слагаемое с c
       уже со знаками, поэтому шаблон пишет «y = {aTerm} + bx{cTerm}». */
    aTerm: Q.coefficientText(p.a) + 'x²',
    cTerm: Q.signedTerm(p.c),
    x0: query ? numberText(query.x0) : '',
    y0: query ? numberText(query.y0) : '',
    point: labelled.length ? labelled[0].label : '',
    second: second ? (second.kind === 'line'
      ? 'y = ' + lineText(second.line)
      : Q.equationText(second.curve, task.secondForm || set.secondForm || 'general')) : ''
  };

  return {
    id: task.id,
    kind: set.kind,
    svg: task.noChart ? null : renderer.renderGraph(sceneFor(built, task, set)),
    question: plainText(fillTemplate(task.question, values)),
    questionHtml: typesetText(fillTemplate(task.question, values)),
    hint: task.hint ? plainText(fillTemplate(task.hint, values)) : null,
    hintHtml: task.hint ? typesetText(fillTemplate(task.hint, values)) : null,
    answer: choice ? choice.answer : answerText(value),
    answerHtml: choice ? null : math.html(answerText(value)),
    options: choice ? choice.options.map(function (option) {
      return { number: option.number, text: option.text, error: option.error,
               html: math.html(option.text) };
    }) : null,
    answerType: task.answerType || 'number',
    level: task.level || null,
    levelReason: task.levelReason || null,
    meta: {
      family: 'quadratic',
      set: set.id,
      seed: seed,
      form: form,
      a: p.aValue, b: p.bValue, c: p.cValue, m: p.mValue, n: p.nValue,
      aFraction: p.a, bFraction: p.b, cFraction: p.c, mFraction: p.m, nFraction: p.n,
      window: built.window,
      points: built.points.map(function (point) {
        return { x: point.x, y: point.y, role: point.role };
      }),
      query: query ? { type: query.type, x0: query.x0, y0: query.y0, answer: query.answer,
                       other: query.other === undefined ? null : query.other,
                       pick: query.pick || null } : null,
      intersection: built.intersection || null,
      /* Пара отмеченных узлов симметрична относительно оси параболы:
         вершина по ней находится без счёта. Набор такие задачи считает. */
      symmetricPair: built.symmetricPair === true,
      curves: built.parts.map(partMeta),
      level: task.level || null
    }
  };
}

/* Прямая в записи условия: та же, что у семейства прямой. */
function lineText(line) {
  var k = line.k, b = line.b;
  var slope = isZero(k) ? '' : Q.coefficientText(k) + 'x';
  if (isZero(b)) { return slope || '0'; }
  if (!slope) { return fmt(b); }
  return slope + Q.signedTerm(b);
}

const api = {
  candidates: candidates,
  result: result,
  distractors: distractors,
  equationChoice: equationChoice,
  ANSWER_RULES: ANSWER_RULES,
  OPTIONS: OPTIONS
};

export default api;
export { candidates, result, distractors, equationChoice, ANSWER_RULES, OPTIONS };
