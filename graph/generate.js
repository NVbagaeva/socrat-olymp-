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
var LOOK_AHEAD = 60;          /* сколько годных кандидатов сравнить между собой */
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
    return true;
  });
}

function interceptCandidates(constraints) {
  var list = [];
  var limit = constraints.bMax === undefined ? 6 : constraints.bMax;
  for (var b = -limit; b <= limit; b++) {
    if (constraints.bNonZero && b === 0) { continue; }
    if (constraints.bSign === 'positive' && b <= 0) { continue; }
    if (constraints.bSign === 'negative' && b >= 0) { continue; }
    if (constraints.b !== undefined && b !== constraints.b) { continue; }
    list.push(b);
  }
  return list;
}

/* ══════════════════════════════════════════════════════════
   Правила вычисления ответа. Реестр расширяется под новые
   формулировки без правок остального кода.
   ══════════════════════════════════════════════════════════ */
var ANSWER_RULES = {
  k: function (ctx) { return ctx.line.k; },
  b: function (ctx) { return ctx.line.b; }
};

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
function buildLineTask(task, set, seed, used) {
  var constraints = task.constraints || {};
  var random = rng(set.id + ':' + task.id + ':' + seed);
  var slopes = shuffled(slopeCandidates(constraints), random);
  var intercepts = shuffled(interceptCandidates(constraints), random);

  var best = null;
  var seen = 0;

  for (var i = 0; i < slopes.length && seen < LOOK_AHEAD; i++) {
    for (var j = 0; j < intercepts.length && seen < LOOK_AHEAD; j++) {
      var line = Line.create(slopes[i], intercepts[j]);

      /* §4.3 — наклон читаем; горизонталь только по флагу. */
      if (!Line.slopeReadable(line, constraints)) { continue; }

      /* Прямая не должна ложиться на ось: график сливается с каркасом. */
      if (Line.isZero(line.k) && Line.isZero(line.b)) { continue; }

      /* §4.6 — внутри набора нет двух задач с одинаковой парой (k, b). */
      var key = line.k.p + '/' + line.k.q + '@' + line.b.p + '/' + line.b.q;
      if (used[key]) { continue; }

      /* Набор может требовать, чтобы все наклоны были попарно различны. */
      var slopeKey = 'k:' + line.k.p + '/' + line.k.q;
      if (set.uniqueSlopes && used[slopeKey]) { continue; }

      var interceptKey = 'b:' + line.b.p + '/' + line.b.q;
      if (set.uniqueIntercepts && used[interceptKey]) { continue; }

      /* §3 — окно; §4.2 — прямая проходит окно насквозь. */
      var win = Line.windowFor(line, constraints);
      if (!win) { continue; }

      /* §4.1 — две целые опорные точки внутри окна. */
      var points = Line.referencePoints(line, win);
      if (!points) { continue; }

      /* Блок 2: точка (0, b) видна и не жмётся к границе. */
      if (constraints.bVisible && Math.abs(line.bValue) > win.ymax - Line.RULES.bEdgeGap) { continue; }

      seen++;
      var score = balanceScore(line, win, points);
      if (!best || score > best.score + 1e-9) {
        best = { line: line, window: win, points: points, score: score,
                 key: key, slopeKey: slopeKey, interceptKey: interceptKey };
      }
    }
  }

  if (!best) {
    throw new Error('generate: не удалось собрать корректный вариант для ' + task.id +
      ' (seed ' + seed + '); ограничения слишком узкие');
  }
  used[best.key] = true;
  used[best.slopeKey] = true;
  used[best.interceptKey] = true;
  return { line: best.line, window: best.window, points: best.points };
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

function sceneFor(built, task, set) {
  return {
    window: built.window,
    grid: { step: 1, show: true },
    axes: { labelX: 'x', labelY: 'y', origin: '0' },
    axisLabels: task.axisLabels || set.axisLabels || 'minimal',
    curves: [ {
      type: 'line',
      k: built.line.kValue,
      b: built.line.bValue,
      color: 'lineA',
      label: task.curveLabel === null ? null : (task.curveLabel || set.curveLabel || 'y = f(x)')
    } ],
    points: built.points.map(function (point) {
      return { x: point.x, y: point.y, style: 'solid', color: 'lineA' };
    }),
    alt: 'График линейной функции'
  };
}

function generate(id, seed) {
  var set = findSet(id);
  var effectiveSeed = seed === undefined || seed === null ? set.seed : seed;

  /* Набор собирается целиком: только так соблюдается запрет
     на повторяющиеся пары (k, b) внутри блока или набора. */
  var used = {};
  var result = null;

  (set.tasks || []).forEach(function (task) {
    var family = FAMILIES[task.family || set.family || 'line'];
    if (!family) { throw new Error('generate: неизвестное семейство у ' + task.id); }

    var built = buildLineTask(task, set, effectiveSeed, used);
    if (task.id !== id) { return; }

    var scene = sceneFor(built, task, set);
    var rule = ANSWER_RULES[task.answerRule];
    if (!rule) { throw new Error('generate: неизвестное правило ответа «' + task.answerRule + '»'); }

    var answer = rule({ line: built.line, window: built.window, points: built.points, task: task });

    result = {
      id: task.id,
      kind: set.kind,                    /* 'prep' или 'prototype' — не смешиваются */
      svg: renderer.renderGraph(scene),
      question: task.question,
      hint: task.hint || null,
      answer: answerText(answer),
      answerType: task.answerType || 'number',
      level: task.level || null,
      meta: {
        set: set.id,
        seed: effectiveSeed,
        k: built.line.kValue,
        b: built.line.bValue,
        kFraction: built.line.k,
        bFraction: built.line.b,
        window: built.window,
        points: built.points
      }
    };
  });

  if (!result) { throw new Error('generate: задача «' + id + '» не собралась'); }
  return result;
}

/* Весь набор разом — для preview.html, validate.js и сборки ответов. */
function generateSet(setId, seed) {
  var set = null;
  allSets().forEach(function (item) { if (item.id === setId) { set = item; } });
  if (!set) { throw new Error('generate: набор «' + setId + '» не найден'); }

  var effectiveSeed = seed === undefined || seed === null ? set.seed : seed;
  var used = {};

  return (set.tasks || []).map(function (task) {
    var built = buildLineTask(task, set, effectiveSeed, used);
    var scene = sceneFor(built, task, set);
    var rule = ANSWER_RULES[task.answerRule];
    if (!rule) { throw new Error('generate: неизвестное правило ответа «' + task.answerRule + '»'); }

    return {
      id: task.id,
      kind: set.kind,
      svg: renderer.renderGraph(scene),
      question: task.question,
      hint: task.hint || null,
      answer: answerText(rule({ line: built.line, window: built.window, points: built.points, task: task })),
      answerType: task.answerType || 'number',
      level: task.level || null,
      meta: {
        set: set.id, seed: effectiveSeed,
        k: built.line.kValue, b: built.line.bValue,
        kFraction: built.line.k, bFraction: built.line.b,
        window: built.window, points: built.points
      }
    };
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
      out.prep[task.id] = { answer: task.answer, answerType: task.answerType, seed: task.meta.seed };
    });
  });
  sets.prototypes.forEach(function (set) {
    generateSet(set.id).forEach(function (task) {
      out.prototypes[task.id] = { answer: task.answer, answerType: task.answerType,
                                  level: task.level, seed: task.meta.seed };
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
