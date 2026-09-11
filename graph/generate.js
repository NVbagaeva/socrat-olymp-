#!/usr/bin/env node
/* graph/generate.js — сборка варианта задачи.

   generate(id, seed) -> { svg, question, answer, answerType, level, meta }

   Детерминировано по seed: один seed всегда даёт один вариант. Тексты
   условий, подсказки и правила вычисления ответа лежат в данных
   (graph/prep/12/*.json и graph/prototypes/12/*.json), а не в коде.

   Подготовка и прототипы загружаются из разных папок и нигде
   не смешиваются: у них разные идентификаторы и разные счётчики.
*/

'use strict';

var fs = require('fs');
var path = require('path');
var renderer = require('./renderer.js');
var math = require('./math.js');
var Line = require('./families/line.js');

var ROOT = __dirname;
var FAMILIES = { line: Line };

/* ══════════════════════════════════════════════════════════
   Детерминированный генератор псевдослучайных чисел
   ══════════════════════════════════════════════════════════ */
function hash(text) {
  var h = 2166136261;
  for (var i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seedText) {
  var state = hash(String(seedText)) || 1;
  return function () {
    state |= 0; state = (state + 0x6D2B79F5) | 0;
    var t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Перестановка списка по seed: порядок перебора кандидатов. */
function shuffled(list, random) {
  var copy = list.slice();
  for (var i = copy.length - 1; i > 0; i--) {
    var j = Math.floor(random() * (i + 1));
    var t = copy[i]; copy[i] = copy[j]; copy[j] = t;
  }
  return copy;
}

/* ══════════════════════════════════════════════════════════
   Загрузка наборов. prep и prototypes — раздельно, всегда.
   ══════════════════════════════════════════════════════════ */
var cache = null;

function loadSets() {
  if (cache) { return cache; }
  cache = { prep: [], prototypes: [] };

  [['prep', 'prep/12'], ['prototypes', 'prototypes/12']].forEach(function (pair) {
    var dir = path.join(ROOT, pair[1]);
    if (!fs.existsSync(dir)) { return; }
    fs.readdirSync(dir).filter(function (name) { return /\.json$/.test(name); }).sort()
      .forEach(function (name) {
        var data = JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'));
        data.file = pair[1] + '/' + name;
        cache[pair[0]].push(data);
      });
  });
  return cache;
}

function allSets() {
  var sets = loadSets();
  return sets.prep.concat(sets.prototypes);
}

function findSet(taskId) {
  var found = null;
  allSets().forEach(function (set) {
    (set.tasks || []).forEach(function (task) { if (task.id === taskId) { found = set; } });
  });
  if (!found) { throw new Error('generate: задача «' + taskId + '» не найдена'); }
  return found;
}

/* ══════════════════════════════════════════════════════════
   Кандидаты коэффициентов
   ══════════════════════════════════════════════════════════ */
var MINUS = '\u2212';         /* типографский минус в формулах вариантов        */
var CANDIDATE_POOL = 72;
var LINE_POOL = 40;           /* сколько прямых перебирается на каждую сторону пары */
var POOL_PER_SLOPE = 12;       /* сколько вариантов с одним наклоном держим в пуле      */
var PROBE_POOL = 10;          /* из скольких читаемых точек выбирается проверяемая */      /* сколько лучших кандидатов держим на задачу      */
var SEARCH_BUDGET = 4000000;  /* потолок перебора с возвратом                    */
var INTEGER_K = [1, 2, 3];
var FRACTION_K = [[1, 2], [1, 3], [2, 3], [3, 2], [1, 4], [3, 4], [5, 2]];

function slopeCandidates(constraints) {
  var kind = constraints.slope || 'any';
  var list = [];

  function push(p, q) {
    var value = p / q;
    if (Math.abs(value) < Line.RULES.minAbsK - 1e-9 && value !== 0) { return; }
    if (Math.abs(value) > Line.RULES.maxAbsK + 1e-9) { return; }
    list.push({ p: p, q: q });
  }

  if (kind === 'zero') { return [{ p: 0, q: 1 }]; }
  if (kind === 'integer' || kind === 'any') {
    INTEGER_K.forEach(function (k) { push(k, 1); push(-k, 1); });
  }
  if (kind === 'fraction' || kind === 'any') {
    FRACTION_K.forEach(function (pair) { push(pair[0], pair[1]); push(-pair[0], pair[1]); });
  }

  /* absK и absKMin задаются числом или точной дробью [p, q]. */
  function asNumber(value) {
    return Array.isArray(value) ? value[0] / value[1] : value;
  }

  return list.filter(function (k) {
    var value = k.p / k.q;
    var abs = Math.abs(value);
    if (constraints.direction === 'up' && value <= 0) { return false; }
    if (constraints.direction === 'down' && value >= 0) { return false; }
    if (constraints.absK !== undefined && Math.abs(abs - asNumber(constraints.absK)) > 1e-9) { return false; }
    if (constraints.absKMin !== undefined && abs < asNumber(constraints.absKMin) - 1e-9) { return false; }
    if (constraints.absKMax !== undefined && abs > asNumber(constraints.absKMax) + 1e-9) { return false; }
    if (constraints.denominators && constraints.denominators.indexOf(k.q) === -1) { return false; }
    if (constraints.excludeAbsK &&
        constraints.excludeAbsK.some(function (v) { return Math.abs(abs - asNumber(v)) < 1e-9; })) {
      return false;
    }
    return true;
  });
}

function interceptCandidates(constraints) {
  var list = [];
  var limit = constraints.bMax === undefined ? 6 : constraints.bMax;
  var step = constraints.bKind === 'half' ? 0.5 : 1;

  for (var b = -limit; b <= limit + 1e-9; b += step) {
    if (constraints.bKind === 'half' && Number.isInteger(b)) { continue; }
    if (constraints.bNonZero && b === 0) { continue; }
    if (constraints.bSign === 'positive' && b <= 0) { continue; }
    if (constraints.bSign === 'negative' && b >= 0) { continue; }
    if (constraints.b !== undefined && b !== constraints.b) { continue; }
    list.push(Math.round(b * 10) / 10);
  }
  return list;
}

/* ══════════════════════════════════════════════════════════
   Проверяемая точка (блоки 4 и 5)
   constraints.probe = {
     onLine:   true | false,        // принадлежит прямой или нет
     offsets:  [1],                 // на сколько мимо, если не принадлежит
     xRange:   6,                   // откуда берутся абсциссы без чертежа
     integerY: true                 // ордината обязана быть целой
   }
   ══════════════════════════════════════════════════════════ */
function probeCandidates(line, win, probe) {
  var offsets = probe.offsets || [1];
  var limit = win ? win.xmax - 1 : (probe.xRange || 6);
  /* x = 0 превращает задачу в чтение свободного члена — это уже блок 2. */
  var minAbsX = probe.minAbsX === undefined ? 1 : probe.minAbsX;
  var found = [];

  for (var x = -limit; x <= limit; x++) {
    if (Math.abs(x) < minAbsX) { continue; }
    var exact = Line.yAt(line, x);
    if (probe.integerY !== false && !Line.isInt(exact)) { continue; }
    var base = Line.num(exact);

    var deltas = probe.onLine ? [0] : offsets.concat(offsets.map(function (d) { return -d; }));
    deltas.forEach(function (delta) {
      var y = Math.round((base + delta) * 100) / 100;
      if (win && (Math.abs(x) > win.xmax - 1 || Math.abs(y) > win.ymax - 1)) { return; }
      found.push({ x: x, y: y, delta: delta });
    });
  }

  /* Ближе к центру — читаемее; порядок детерминирован. */
  found.sort(function (a, b) {
    return (Math.abs(a.x) + Math.abs(a.y)) - (Math.abs(b.x) + Math.abs(b.y)) ||
           a.x - b.x || a.y - b.y;
  });
  return found;
}

/* Из читаемых кандидатов точка выбирается по seed: иначе во всех
   десяти задачах блока она садится в одно и то же место. */
function chooseProbe(line, win, probe, random) {
  var found = probeCandidates(line, win, probe);
  if (!found.length) { return null; }
  return shuffled(found.slice(0, PROBE_POOL), random)[0];
}

/* ══════════════════════════════════════════════════════════
   Пара прямых (§8, прототипы 12.C и 12.D)

   Две прямые живут в одном окне, поэтому окно подбирается сразу
   под обе: каждая обязана проходить его насквозь и иметь внутри
   две целые опорные точки. Точка пересечения либо внутри окна
   и не ближе клетки к границе, либо заведомо за кадром —
   тогда ответ получается только решением системы.
   ══════════════════════════════════════════════════════════ */
function lineCandidates(constraints, random) {
  var slopes = shuffled(slopeCandidates(constraints), random);
  var intercepts = shuffled(interceptCandidates(constraints), random);
  var out = [];

  slopes.forEach(function (k) {
    intercepts.forEach(function (b) {
      var line = Line.create(k, b);
      if (!Line.slopeReadable(line, constraints)) { return; }
      if (Line.isZero(line.k) && Line.isZero(line.b)) { return; }
      out.push(line);
    });
  });
  return out.slice(0, LINE_POOL);
}

/* Окно, годное сразу для обеих прямых. */
function sharedWindow(lines, constraints) {
  var start = Line.RULES.windowDefault;
  lines.forEach(function (line) {
    if (Math.abs(line.kValue) >= Line.RULES.steepK) { start = Math.min(start, Line.RULES.windowSteep); }
  });
  if (constraints && constraints.window) { start = constraints.window; }

  for (var n = start; n >= Line.RULES.windowMin; n--) {
    var win = { xmin: -n, xmax: n, ymin: -n, ymax: n };
    var ok = lines.every(function (line) {
      return Line.crossesWindow(line, win) &&
             Line.integerPoints(line, win).length >= Line.RULES.minIntPoints;
    });
    if (ok) { return win; }
  }
  return null;
}

/* Угол между прямыми в градусах — по нему проверяется различимость
   и состав набора: близкие к прямому и пологие пересечения. */
function angleBetween(a, b) {
  return Math.abs(Math.atan(a.kValue) - Math.atan(b.kValue)) * 180 / Math.PI;
}

function pairCandidates(task, set, seed) {
  var constraints = task.constraints || {};
  var spec = constraints.lines || [];
  var random = rng(set.id + ':' + task.id + ':' + seed + ':pair');
  var first = lineCandidates(spec[0] || {}, random);
  var second = lineCandidates(spec[1] || {}, random);
  var wanted = constraints.intersection || {};
  var found = [];

  for (var i = 0; i < first.length; i++) {
    for (var j = 0; j < second.length; j++) {
      var a = first[i];
      var b = second[j];

      /* §4.4 — угол между прямыми должен быть различим на глаз. */
      if (!Line.distinguishable(a, b)) { continue; }

      var win = sharedWindow([a, b], constraints);
      if (!win) { continue; }

      var cross = Line.intersect(a, b);
      if (!cross) { continue; }
      var cx = Line.num(cross.x);
      var cy = Line.num(cross.y);

      /* Состав набора требует и пересечений, близких к прямому углу,
         и пологих, но различимых. Угол — часть условия варианта. */
      var angle = angleBetween(a, b);
      if (wanted.angle === 'right' && Math.abs(angle - 90) > (wanted.angleTolerance || 20)) { continue; }
      if (wanted.angle === 'shallow' && angle > (wanted.shallowMax || 30)) { continue; }

      var margin = wanted.marginCells === undefined ? 1 : wanted.marginCells;
      var inside = Math.abs(cx) <= win.xmax - margin && Math.abs(cy) <= win.ymax - margin;
      var outside = Math.abs(cx) > win.xmax || Math.abs(cy) > win.ymax;

      if (wanted.inside === true && !inside) { continue; }
      if (wanted.inside === false && !outside) { continue; }

      /* Ответ пишется как в бланке: целое или один знак после запятой. */
      if (!decimalsOk(cross.x, wanted.decimals) || !decimalsOk(cross.y, wanted.decimals)) { continue; }
      if (wanted.answerKind === 'half' &&
          Line.isInt(wanted.axis === 'y' ? cross.y : cross.x)) { continue; }

      var pointsA = Line.referencePoints(a, win);
      var pointsB = Line.referencePoints(b, win);
      if (!pointsA || !pointsB) { continue; }

      var answer = wanted.axis === 'y' ? cy : cx;
      found.push({
        parts: [ { line: a, color: 'lineA', points: pointsA },
                 { line: b, color: 'lineB', points: pointsB } ],
        line: a, window: win, points: pointsA,
        intersection: { x: cx, y: cy, inside: inside, angle: angle },
        score: (balanceScore(a, win, pointsA) + balanceScore(b, win, pointsB)) / 2,
        pairKey: 'kb2:' + a.kValue + '@' + a.bValue + '|' + b.kValue + '@' + b.bValue,
        slopeKey: 'kk:' + a.kValue + '|' + b.kValue,
        interceptKey: 'bb:' + a.bValue + '|' + b.bValue,
        answerKey: 'ans:' + answer,
        zeroIntercept: Line.isZero(a.b) && Line.isZero(b.b)
      });
    }
  }

  found.sort(function (x, y) { return y.score - x.score || x.pairKey.localeCompare(y.pairKey); });
  return trimPool(found);
}

/* ══════════════════════════════════════════════════════════
   Запрос за пределами окна (§8, прототипы 12.A и 12.B)
   constraints.query = {
     type:     'value-at' | 'argument-for',
     gapMin:   2,           // не ближе этого к границе окна
     gapMax:   12,
     allowHalf: true,       // абсцисса может быть с половиной
     decimals: 1,           // ответ — целое или один знак после запятой
     side:     'left' | 'right'
   }
   Суть прототипа: ответ нельзя снять с рисунка, он получается
   из уравнения прямой. Попал внутрь окна — вариант бракуется.
   ══════════════════════════════════════════════════════════ */
function decimalsOk(value, decimals) {
  var scale = Math.pow(10, decimals === undefined ? 1 : decimals);
  return (scale % value.q) === 0;
}

function queryCandidates(line, win, query) {
  var gapMin = query.gapMin === undefined ? 2 : query.gapMin;
  var gapMax = query.gapMax === undefined ? 12 : query.gapMax;
  var step = query.allowHalf ? 0.5 : 1;
  var found = [];

  for (var mag = win.xmax + gapMin; mag <= win.xmax + gapMax + 1e-9; mag += step) {
    [mag, -mag].forEach(function (value) {
      if (query.side === 'right' && value < 0) { return; }
      if (query.side === 'left' && value > 0) { return; }

      var x0 = Line.toFrac(value);
      var y0 = Line.yAt(line, value);

      /* И показанное в условии число, и ответ должны быть записаны
         так, как их пишут в бланке: целое или один знак после запятой. */
      if (!decimalsOk(x0, query.decimals) || !decimalsOk(y0, query.decimals)) { return; }
      if (Math.abs(Line.num(x0)) <= win.xmax) { return; }

      /* Набор из двадцати вариантов обязан содержать нецелые ответы,
         поэтому часть вариантов просит их явно. */
      var answerFrac = query.type === 'argument-for' ? x0 : y0;
      if (query.answerKind === 'half' && Line.isInt(answerFrac)) { return; }
      if (query.answerKind === 'integer' && !Line.isInt(answerFrac)) { return; }

      /* Ответ — то, что спрашивают: в 12.A это f(x₀), в 12.B — сам x. */
      found.push({ x0: Line.num(x0), y0: Line.num(y0),
                   answer: query.type === 'argument-for' ? Line.num(x0) : Line.num(y0) });
    });
  }
  return found;
}

/* ══════════════════════════════════════════════════════════
   Правила вычисления ответа. Реестр расширяется под новые
   формулировки без правок остального кода.
   ══════════════════════════════════════════════════════════ */
var ANSWER_RULES = {
  k: function (ctx) { return ctx.line.k; },
  b: function (ctx) { return ctx.line.b; },
  'equation-choice': function (ctx) { return equationChoice(ctx); },
  'point-choice': function (ctx) { return pointChoice(ctx); },

  /* 12.A — дан график, найдите f(x₀). */
  'value-at': function (ctx) {
    if (!ctx.query) { throw new Error('generate: у ' + ctx.task.id + ' не выбран запрос'); }
    return Line.toFrac(ctx.query.y0);
  },

  /* 12.C — даны два графика, найдите абсциссу точки пересечения. */
  'intersection-x': function (ctx) {
    if (!ctx.intersection) { throw new Error('generate: у ' + ctx.task.id + ' нет точки пересечения'); }
    return Line.toFrac(ctx.intersection.x);
  },

  /* 12.D — то же, но ордината. */
  'intersection-y': function (ctx) {
    if (!ctx.intersection) { throw new Error('generate: у ' + ctx.task.id + ' нет точки пересечения'); }
    return Line.toFrac(ctx.intersection.y);
  },

  /* 12.B — дан график, найдите x, при котором f(x) = y₀. */
  'argument-for': function (ctx) {
    if (!ctx.query) { throw new Error('generate: у ' + ctx.task.id + ' не выбран запрос'); }
    return Line.toFrac(ctx.query.x0);
  }
};

/* Да / нет: принадлежит ли точка графику. Порядок вариантов
   постоянный — «да» первым: это привычная пара, а баланс набора
   держится составом 5/5, а не перемешиванием. */
var YES_NO = ['Да', 'Нет'];

function pointChoice(ctx) {
  var probe = ctx.probe;
  if (!probe) { throw new Error('generate: у ' + ctx.task.id + ' не выбрана проверяемая точка'); }

  var onLine = Line.contains(ctx.line, probe.x, probe.y);
  var options = YES_NO.map(function (text, i) {
    return { number: String(i + 1), text: text, error: null, math: false };
  });
  return { type: 'choice', options: options, answer: onLine ? '1' : '2' };
}

/* Типичные ошибки, по которым строятся неверные варианты (§7, блок 3).
   Ровно по одному варианту каждого вида. */
var EQUATION_DISTRACTORS = [
  { id: 'A', note: 'перепутаны k и b',              make: function (k, b) { return { k: b, b: k }; } },
  { id: 'B', note: 'потерян знак углового коэф-та', make: function (k, b) { return { k: -k, b: b }; } },
  { id: 'C', note: 'потерян знак свободного члена', make: function (k, b) { return { k: k, b: -b }; } }
];

/* Запись коэффициента в формуле: 1x и −1x не пишутся, разделитель — запятая. */
function coefficientText(value) {
  if (Math.abs(value - 1) < 1e-9) { return ''; }
  if (Math.abs(value + 1) < 1e-9) { return MINUS; }
  return String(value).replace('.', ',').replace('-', MINUS);
}

function equationText(k, b) {
  var left = 'y = ';
  var slope = Math.abs(k) < 1e-9 ? '' : coefficientText(k) + 'x';
  if (Math.abs(b) < 1e-9) { return left + (slope || '0'); }
  var sign = b > 0 ? (slope ? ' + ' : '') : (slope ? ' ' + MINUS + ' ' : MINUS);
  var value = String(Math.abs(b)).replace('.', ',');
  return left + slope + sign + value;
}

/* Четыре варианта: верный плюс три типичные ошибки.
   Порядок перемешивается по seed детерминированно; совпадение
   двух вариантов — ошибка сборки, а не тихо принятый набор. */
function equationChoice(ctx) {
  var k = ctx.line.kValue;
  var b = ctx.line.bValue;

  var variants = [{ id: 'верный', k: k, b: b, correct: true }].concat(
    EQUATION_DISTRACTORS.map(function (item) {
      var made = item.make(k, b);
      return { id: item.id, note: item.note, k: made.k, b: made.b, correct: false };
    })
  );

  var texts = {};
  variants.forEach(function (variant) {
    variant.text = equationText(variant.k, variant.b);
    if (texts[variant.text]) {
      throw new Error('generate: у ' + ctx.task.id + ' совпали варианты «' + variant.text +
        '» — набор бракуется (запрещены b = 0, k = ±1 и k = b)');
    }
    texts[variant.text] = true;
  });

  /* Место верного варианта задаётся на уровне набора: иначе по десяти
     задачам оно скапливается на двух позициях и ответ угадывается. */
  var correct = variants.filter(function (variant) { return variant.correct; })[0];
  var wrong = shuffled(variants.filter(function (variant) { return !variant.correct; }),
    rng(ctx.set.id + ':' + ctx.task.id + ':' + ctx.seed + ':choice'));

  var place = answerPlaces(ctx.set, ctx.seed, variants.length)[ctx.index];
  var order = [];
  wrong.forEach(function (variant) { order.push(variant); });
  order.splice(place - 1, 0, correct);

  var answer = null;
  var options = order.map(function (variant, i) {
    var number = String(i + 1);
    if (variant.correct) { answer = number; }
    return { number: number, text: variant.text, error: variant.note || null };
  });

  return { type: 'choice', options: options, answer: answer };
}

/* Позиции верного ответа по набору: поровну между вариантами,
   порядок перемешан по seed и одинаков при одном и том же seed. */
var placesCache = {};

function answerPlaces(set, seed, optionCount) {
  var key = set.id + ':' + seed + ':' + optionCount;
  if (placesCache[key]) { return placesCache[key]; }

  var count = (set.tasks || []).length;
  var list = [];
  for (var i = 0; i < count; i++) { list.push((i % optionCount) + 1); }
  placesCache[key] = shuffled(list, rng(key + ':places'));
  return placesCache[key];
}

/* Точная дробь -> строка ответа. Конечная десятичная — с запятой,
   как в бланке ЕГЭ; несократимая треть остаётся дробью. */
function answerText(value) {
  if (typeof value === 'string') { return value; }
  var f = Line.toFrac(value);
  var q = f.q;
  while (q % 2 === 0) { q /= 2; }
  while (q % 5 === 0) { q /= 5; }
  if (q === 1) {
    /* Разделитель — запятая, как в бланке ЕГЭ; минус обычный, чтобы
       ответ можно было сравнивать с тем, что вводит ученик. */
    return String(Line.num(f)).replace('.', ',');
  }
  return (f.p < 0 ? '-' : '') + Math.abs(f.p) + '/' + f.q;
}

/* ══════════════════════════════════════════════════════════
   Сборка одного варианта
   ══════════════════════════════════════════════════════════ */
function taskCandidates(task, set, seed) {
  var constraints = task.constraints || {};
  if (constraints.lines) { return pairCandidates(task, set, seed); }
  var random = rng(set.id + ':' + task.id + ':' + seed);
  var slopes = shuffled(slopeCandidates(constraints), random);
  var intercepts = shuffled(interceptCandidates(constraints), random);
  var found = [];

  for (var i = 0; i < slopes.length; i++) {
    for (var j = 0; j < intercepts.length; j++) {
      var line = Line.create(slopes[i], intercepts[j]);

      /* §4.3 — наклон читаем; горизонталь только по флагу. */
      if (!Line.slopeReadable(line, constraints)) { continue; }

      /* Прямая не должна ложиться на ось: график сливается с каркасом. */
      if (Line.isZero(line.k) && Line.isZero(line.b)) { continue; }

      /* Блок 3: при k = b верный ответ совпал бы с вариантом «перепутаны k и b». */
      if (constraints.distinctKB && Math.abs(line.kValue - line.bValue) < 1e-9) { continue; }

      /* Блок 5 идёт без чертежа: окно и опорные точки не нужны. */
      var win = null;
      var points = [];

      if (!task.noChart) {
        /* §3 — окно; §4.2 — прямая проходит окно насквозь. */
        win = Line.windowFor(line, constraints);
        if (!win) { continue; }

        /* §4.1 — две целые опорные точки внутри окна.
           markIntercept — одной из них обязана быть точка (0, b). */
        points = Line.referencePoints(line, win,
          constraints.markIntercept ? { include: 0 } : null);
        if (!points) { continue; }
      }

      /* 12.A и 12.B — запрос за пределами окна. */
      var query = null;
      if (constraints.query) {
        var queries = queryCandidates(line, win, constraints.query);
        if (!queries.length) { continue; }
        query = shuffled(queries, rng(set.id + ':' + task.id + ':' + seed + ':query:' +
          line.kValue + ':' + line.bValue))[0];
      }

      /* Блоки 4 и 5 — проверяемая точка. */
      var probe = null;
      if (constraints.probe) {
        probe = chooseProbe(line, win, constraints.probe,
          rng(set.id + ':' + task.id + ':' + seed + ':probe:' + line.kValue + ':' + line.bValue));
        if (!probe) { continue; }
      }

      /* Уровень «повезло»: точка (0, b) видна на чертеже.
         Уровень «не повезло», причина «b за кадром»: наоборот, не видна. */
      if (constraints.bInside && win && Math.abs(line.bValue) > win.ymax - 1) { continue; }
      if (constraints.bOffscreen && win && Math.abs(line.bValue) <= win.ymax) { continue; }

      /* Блок 2: точка (0, b) видна и не жмётся к границе. */
      if (constraints.bVisible && win &&
          Math.abs(line.bValue) > win.ymax - Line.RULES.bEdgeGap) { continue; }

      found.push({
        parts: [ { line: line, color: 'lineA', points: points, label: true } ],
        line: line, window: win, points: points, probe: probe, query: query,
        answerKey: query ? 'ans:' + query.answer : null,
        /* Без чертежа читаемость оценивать не по чему: порядок кандидатов
           задаётся seed, иначе во всём блоке окажется один и тот же b. */
        score: win ? balanceScore(line, win, points)
                   : rng(set.id + ':' + task.id + ':' + seed + ':pick:' +
                         line.kValue + ':' + line.bValue)(),
        pairKey: 'kb:' + line.k.p + '/' + line.k.q + '@' + line.b.p + '/' + line.b.q,
        slopeKey: 'k:' + line.k.p + '/' + line.k.q,
        interceptKey: 'b:' + line.b.p + '/' + line.b.q,
        zeroIntercept: Line.isZero(line.b)
      });
    }
  }

  /* Сначала самые читаемые чертежи; порядок детерминирован. */
  found.sort(function (a, b) { return b.score - a.score || a.pairKey.localeCompare(b.pairKey); });
  return trimPool(found);
}

/* Из годных кандидатов выбираем самый читаемый чертёж: прямая идёт
   через середину поля, видна на всю длину, опорные точки разнесены.
   Отбраковку это не подменяет — оценивается только то, что прошло правила. */
function balanceScore(line, win, points) {
  var part = Line.visiblePart(line, win);
  var midX = (part.x1 + part.x2) / 2;
  var midY = line.kValue * midX + line.bValue;
  var n = win.xmax;

  var balance = Math.sqrt(midX * midX + midY * midY) / n;
  var length = part.length / (2 * n * Math.SQRT2);
  var spread = Math.abs(points[1].x - points[0].x) >= 2 ? 0.3 : 0;

  /* Прямая через начало координат допустима, но не должна становиться
     нормой: в наборе такие чертежи выглядят одинаково. */
  var throughOrigin = Line.isZero(line.b) ? 0.35 : 0;

  return length - balance * 0.5 + spread - throughOrigin;
}

/* Пул кандидатов не должен состоять из одного наклона с разными b:
   тогда соседняя задача с теми же условиями упирается в запрет
   повторов, и перебор с возвратом разбирает тупик вслепую. */
function trimPool(found) {
  var perSlope = {};
  var pool = [];

  found.forEach(function (candidate) {
    if (pool.length >= CANDIDATE_POOL) { return; }
    var used = perSlope[candidate.slopeKey] || 0;
    if (used >= POOL_PER_SLOPE) { return; }
    perSlope[candidate.slopeKey] = used + 1;
    pool.push(candidate);
  });
  return pool;
}

/* ══════════════════════════════════════════════════════════
   Сборка набора целиком — перебор с возвратом.
   Жадный выбор по одной задаче упирается в тупик: ранняя задача
   забирает значение, которое нужно более стеснённой поздней.
   Поэтому кандидаты перебираются дальше, а не подгоняются правила.
   ══════════════════════════════════════════════════════════ */
function dedupeIntercept(set, candidate) {
  return set.uniqueIntercepts === true ||
    (set.uniqueIntercepts === 'nonzero' && !candidate.zeroIntercept);
}

function assemble(set, seed) {
  var tasks = set.tasks || [];
  var pools = tasks.map(function (task) { return taskCandidates(task, set, seed); });

  tasks.forEach(function (task, i) {
    if (!pools[i].length) {
      throw new Error('generate: для ' + task.id + ' (seed ' + seed +
        ') нет ни одного варианта, проходящего правила; ограничения слишком узкие');
    }
  });

  var used = {};
  var chosen = new Array(tasks.length);
  var budget = SEARCH_BUDGET;

  /* Задачи разбираются в своём порядке: он же порядок возрастания
     сложности, и решение находится рядом с задуманным составом. */
  var order = tasks.map(function (task, i) { return i; });

  function count(key) { return used[key] || 0; }

  function conflicts(candidate) {
    if (count(candidate.pairKey)) { return true; }                      /* §4.6 */
    if (set.uniqueSlopes && count(candidate.slopeKey)) { return true; }
    if (dedupeIntercept(set, candidate) && count(candidate.interceptKey)) { return true; }

    /* В наборе из двадцати вариантов один и тот же наклон не должен
       становиться фоном: целых наклонов в диапазоне |k| ≤ 3 всего шесть. */
    if (set.maxSlopeRepeat && count(candidate.slopeKey) >= set.maxSlopeRepeat) { return true; }
    if (set.maxInterceptRepeat && count(candidate.interceptKey) >= set.maxInterceptRepeat) { return true; }
    if (set.uniqueAnswers && candidate.answerKey && count(candidate.answerKey)) { return true; }
    return false;
  }

  function mark(candidate, delta) {
    used[candidate.pairKey] = count(candidate.pairKey) + delta;
    used[candidate.slopeKey] = count(candidate.slopeKey) + delta;
    used[candidate.interceptKey] = count(candidate.interceptKey) + delta;
    if (candidate.answerKey) { used[candidate.answerKey] = count(candidate.answerKey) + delta; }
  }

  function step(depth) {
    if (depth === order.length) { return true; }
    var i = order[depth];
    var pool = pools[i];
    for (var c = 0; c < pool.length; c++) {
      if (--budget < 0) {
        throw new Error('generate: набор ' + set.id + ' (seed ' + seed +
          ') не собрался за отведённый перебор');
      }
      if (conflicts(pool[c])) { continue; }
      mark(pool[c], 1);
      chosen[i] = pool[c];
      if (step(depth + 1)) { return true; }
      mark(pool[c], -1);
    }
    return false;
  }

  if (!step(0)) {
    throw new Error('generate: набор ' + set.id + ' (seed ' + seed +
      ') не собрался: условия задач несовместимы между собой');
  }
  return chosen;
}

/* Формулы внутри текста размечаются долларами, как в наборе:
   «График функции $y = kx + b$ …». В обычном тексте доллары снимаются,
   в разметке — заменяются набранной формулой. */
function typesetText(text) {
  return String(text).replace(/\$([^$]+)\$/g, function (match, formula) {
    return math.html(formula);
  });
}

function plainText(text) {
  return String(text).replace(/\$([^$]+)\$/g, function (match, formula) {
    return math.plain(formula);
  });
}

/* Подстановка значений в шаблон условия: {x}, {y}, {equation}. */
function fillTemplate(text, values) {
  return String(text).replace(/\{(\w+)\}/g, function (match, key) {
    return values[key] === undefined ? match : values[key];
  });
}

/* Числа в условии и на чертеже: запятая и типографский минус. */
function numberText(value) {
  return String(Math.round(value * 100) / 100).replace('.', ',').replace('-', MINUS);
}

function pointText(name, x, y) {
  return name + '(' + numberText(x) + '; ' + numberText(y) + ')';
}

function sceneFor(built, task, set) {
  var single = built.parts.length === 1;

  return {
    window: built.window,
    grid: { step: 1, show: true },
    axes: { labelX: 'x', labelY: 'y', origin: '0' },
    axisLabels: task.axisLabels || set.axisLabels || 'minimal',

    curves: built.parts.map(function (part) {
      /* §5 — одиночная прямая подписывается, две различаются цветом. */
      var label = single ? (task.curveLabel === null ? null
                                                     : (task.curveLabel || set.curveLabel || 'y = f(x)'))
                         : null;
      return { type: 'line', k: part.line.kValue, b: part.line.bValue, color: part.color, label: label };
    }),

    points: built.parts.reduce(function (all, part) {
      /* Каждая прямая несёт собственные опорные точки своего цвета. */
      return all.concat(part.points.map(function (point) {
        return { x: point.x, y: point.y, style: 'solid', color: part.color };
      }));
    }, []).concat(built.probe ? [ {
      /* Проверяемая точка — терракотовая и подписана координатами:
         её нельзя спутать с опорными точками самой прямой. */
      x: built.probe.x, y: built.probe.y, style: 'solid', color: 'lineB',
      label: pointText(task.pointName || 'A', built.probe.x, built.probe.y)
    } ] : []),

    alt: single ? 'График линейной функции' : 'Графики двух линейных функций'
  };
}

function taskResult(set, task, built, seed, index) {
  var rule = ANSWER_RULES[task.answerRule];
  if (!rule) { throw new Error('generate: неизвестное правило ответа «' + task.answerRule + '»'); }

  var family = FAMILIES[task.family || set.family || 'line'];
  if (!family) { throw new Error('generate: неизвестное семейство у ' + task.id); }

  var value = rule({ line: built.line, window: built.window, points: built.points,
                     probe: built.probe, query: built.query, intersection: built.intersection,
                     parts: built.parts, task: task, set: set, seed: seed, index: index });
  var choice = value && value.type === 'choice' ? value : null;

  var values = {
    equation: equationText(built.line.kValue, built.line.bValue),
    k: numberText(built.line.kValue),
    b: numberText(built.line.bValue),
    point: built.probe ? pointText(task.pointName || 'A', built.probe.x, built.probe.y) : '',
    x0: built.query ? numberText(built.query.x0) : '',
    y0: built.query ? numberText(built.query.y0) : '',
    x: built.probe ? numberText(built.probe.x) : '',
    y: built.probe ? numberText(built.probe.y) : ''
  };

  return {
    id: task.id,
    kind: set.kind,                    /* 'prep' или 'prototype' — не смешиваются */
    svg: task.noChart ? null : renderer.renderGraph(sceneFor(built, task, set)),
    /* Значения подставляются обычным текстом, и только потом
       размеченные долларами куски набираются как формулы. */
    question: plainText(fillTemplate(task.question, values)),
    questionHtml: typesetText(fillTemplate(task.question, values)),
    hint: task.hint ? plainText(task.hint) : null,
    hintHtml: task.hint ? typesetText(task.hint) : null,
    answer: choice ? choice.answer : answerText(value),
    answerHtml: choice ? null : math.html(answerText(value)),
    options: choice ? choice.options.map(function (option) {
      /* «Да» и «нет» — обычные слова, их набирать антиквой не нужно. */
      return { number: option.number, text: option.text, error: option.error,
               html: option.math === false ? option.text : math.html(option.text) };
    }) : null,
    answerType: task.answerType || 'number',
    level: task.level || null,
    levelReason: task.levelReason || null,
    meta: {
      set: set.id,
      seed: seed,
      k: built.line.kValue,
      b: built.line.bValue,
      kFraction: built.line.k,
      bFraction: built.line.b,
      window: built.window,
      points: built.points,
      probe: built.probe || null,
      query: built.query || null,
      intersection: built.intersection || null,
      lines: built.parts.map(function (part) {
        return { k: part.line.kValue, b: part.line.bValue, kFraction: part.line.k };
      }),
      level: task.level || null
    }
  };
}

function generate(id, seed) {
  var set = findSet(id);
  return generateSet(set.id, seed).filter(function (task) { return task.id === id; })[0];
}

/* Весь набор разом — для preview.html, validate.js и сборки ответов. */
function generateSet(setId, seed) {
  var set = null;
  allSets().forEach(function (item) { if (item.id === setId) { set = item; } });
  if (!set) { throw new Error('generate: набор «' + setId + '» не найден'); }

  var effectiveSeed = seed === undefined || seed === null ? set.seed : seed;
  var built = assemble(set, effectiveSeed);

  return (set.tasks || []).map(function (task, i) {
    return taskResult(set, task, built[i], effectiveSeed, i);
  });
}

/* ══════════════════════════════════════════════════════════
   Ответы: отдельный файл, не вперемешку с условиями.
   Подготовка и прототипы — разными разделами.
   ══════════════════════════════════════════════════════════ */
function buildAnswers() {
  var sets = loadSets();
  var out = { prep: {}, prototypes: {} };

  sets.prep.forEach(function (set) {
    generateSet(set.id).forEach(function (task) {
      var record = { answer: task.answer, answerType: task.answerType, seed: task.meta.seed };
      if (task.options) { record.options = task.options.map(function (o) { return o.text; }); }
      out.prep[task.id] = record;
    });
  });
  sets.prototypes.forEach(function (set) {
    generateSet(set.id).forEach(function (task) {
      var record = { answer: task.answer, answerType: task.answerType,
                     level: task.level, seed: task.meta.seed };
      if (task.options) { record.options = task.options.map(function (o) { return o.text; }); }
      out.prototypes[task.id] = record;
    });
  });
  return out;
}

function writeAnswers() {
  var answers = buildAnswers();
  var file = path.join(ROOT, 'answers.json');
  fs.writeFileSync(file, JSON.stringify(answers, null, 2) + '\n');
  return { file: file, prep: Object.keys(answers.prep).length,
           prototypes: Object.keys(answers.prototypes).length };
}

module.exports = {
  taskCandidates: taskCandidates,
  equationText: equationText,
  generate: generate,
  generateSet: generateSet,
  loadSets: loadSets,
  buildAnswers: buildAnswers,
  writeAnswers: writeAnswers,
  answerText: answerText
};

if (require.main === module) {
  var args = process.argv.slice(2);
  if (args[0] === 'build') {
    var info = writeAnswers();
    console.log('answers.json обновлён: подготовка ' + info.prep + ', прототипы ' + info.prototypes);
  } else if (args[0]) {
    var task = generate(args[0], args[1]);
    console.log(task.id + '  [' + task.kind + ']  seed ' + task.meta.seed);
    console.log(task.question);
    console.log('ответ: ' + task.answer + '  (' + task.answerType + ')');
    console.log('k = ' + task.meta.k + ', b = ' + task.meta.b + ', окно ±' + task.meta.window.xmax);
  } else {
    console.log('использование: node graph/generate.js <id задачи> [seed] | build');
  }
}
