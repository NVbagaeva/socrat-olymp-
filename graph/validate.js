#!/usr/bin/env node
/* graph/validate.js — проверка правил движка графиков.

   Печатает отчёт и валит сборку (код возврата 1) при любом нарушении.
   Сейчас реализован слой проверок чертежа: окно обязано быть симметричным
   и квадратным. По мере появления блоков подготовки и наборов прототипов
   сюда добавляются проверки состава — счётчики подготовки и прототипов
   ведутся раздельно и нигде не складываются.
*/

'use strict';

var fs = require('fs');
var path = require('path');
var renderer = require('./renderer.js');
var generator = require('./generate.js');

var ROOT = __dirname;

/* ══════════════════════════════════════════════════════════
   Проверки чертежа
   ══════════════════════════════════════════════════════════ */

/* Окно: одинаковое число клеток во все четыре стороны, поле — квадрат. */
function checkWindow(win, where) {
  return renderer.checkWindow(win).map(function (message) { return where + ': ' + message; });
}

function checkScene(scene, where) {
  var errors = checkWindow(scene.window, where);
  if (!scene.curves || !scene.curves.length) { errors.push(where + ': на чертеже нет ни одной кривой'); }
  return errors;
}

/* ══════════════════════════════════════════════════════════
   Самопроверка правила окна: набор заведомо годных и негодных окон.
   Нужна, чтобы проверка не могла тихо перестать работать.
   ══════════════════════════════════════════════════════════ */
var WINDOW_CASES = [
  { win: { xmin: -8, xmax: 8, ymin: -8, ymax: 8 }, valid: true,  note: 'стандартное окно −8…8' },
  { win: { xmin: -5, xmax: 5, ymin: -5, ymax: 5 }, valid: true,  note: 'суженное окно −5…5' },
  { win: { xmin: -8, xmax: 8, ymin: -6, ymax: 8 }, valid: false, note: '|ymin| != ymax' },
  { win: { xmin: -8, xmax: 8, ymin: -7, ymax: 7 }, valid: false, note: 'разное число клеток по осям' },
  { win: { xmin: -6, xmax: 8, ymin: -8, ymax: 8 }, valid: false, note: 'начало координат смещено по x' }
];

function selfTestWindow() {
  var errors = [];
  WINDOW_CASES.forEach(function (item) {
    var got = renderer.checkWindow(item.win).length === 0;
    if (got !== item.valid) {
      errors.push('самопроверка окна не сработала (' + item.note + '): ожидалось ' +
        (item.valid ? 'годное' : 'негодное') + ' окно');
    }
  });
  return errors;
}

/* ══════════════════════════════════════════════════════════
   Состав набора. Правила лежат в самом файле блока (ключ composition),
   проверка ничего не подгоняет: не сошлось — ошибка сборки.
   ══════════════════════════════════════════════════════════ */
function checkComposition(set, tasks) {
  var rules = set.composition;
  var where = set.id;
  if (!rules) { return []; }
  var errors = [];

  function need(actual, minimum, what) {
    if (actual < minimum) {
      errors.push(where + ': ' + what + ' — ' + actual + ', нужно не меньше ' + minimum);
    }
  }

  if (rules.count !== undefined && tasks.length !== rules.count) {
    errors.push(where + ': задач ' + tasks.length + ', по составу нужно ' + rules.count);
  }

  var ks = tasks.map(function (task) { return task.meta.k; });
  need(ks.filter(function (k) { return k > 0; }).length, rules.minIncreasing || 0, 'возрастающих');
  need(ks.filter(function (k) { return k < 0; }).length, rules.minDecreasing || 0, 'убывающих');
  need(ks.filter(function (k) { return k !== 0 && Number.isInteger(k); }).length,
       rules.minIntegerK || 0, 'с целым k');
  need(ks.filter(function (k) { return k !== 0 && !Number.isInteger(k); }).length,
       rules.minFractionK || 0, 'с дробным k');

  if (rules.zeroSlope) {
    var zeros = [];
    ks.forEach(function (k, i) { if (k === 0) { zeros.push(i + 1); } });
    if (rules.zeroSlope.exactly !== undefined && zeros.length !== rules.zeroSlope.exactly) {
      errors.push(where + ': задач с k = 0 — ' + zeros.length + ', нужно ровно ' + rules.zeroSlope.exactly);
    }
    if (rules.zeroSlope.position !== undefined && zeros.indexOf(rules.zeroSlope.position) === -1) {
      errors.push(where + ': задача с k = 0 должна стоять на месте ' + rules.zeroSlope.position +
        ', а стоит на ' + (zeros.length ? zeros.join(', ') : '—'));
    }
  }

  var bs = tasks.map(function (task) { return task.meta.b; });
  need(bs.filter(function (b) { return b > 0; }).length, rules.minPositiveB || 0, 'с b > 0');
  need(bs.filter(function (b) { return b < 0; }).length, rules.minNegativeB || 0, 'с b < 0');

  if (rules.zeroIntercept && rules.zeroIntercept.exactly !== undefined) {
    var zeroB = bs.filter(function (b) { return b === 0; }).length;
    if (zeroB !== rules.zeroIntercept.exactly) {
      errors.push(where + ': задач с b = 0 — ' + zeroB + ', нужно ровно ' + rules.zeroIntercept.exactly);
    }
  }

  if (rules.allIntegerK) {
    tasks.forEach(function (task) {
      if (!Number.isInteger(task.meta.k)) {
        errors.push(where + '/' + task.id + ': k должен быть целым, а он ' + task.meta.k);
      }
    });
  }
  if (rules.allIntegerB) {
    tasks.forEach(function (task) {
      if (!Number.isInteger(task.meta.b)) {
        errors.push(where + '/' + task.id + ': b должен быть целым, а он ' + task.meta.b);
      }
    });
  }

  /* Точка (0, b) внутри окна и не ближе interceptMargin клеток к границе. */
  if (rules.interceptMargin !== undefined) {
    tasks.forEach(function (task) {
      var limit = task.meta.window.ymax - rules.interceptMargin;
      if (Math.abs(task.meta.b) > limit) {
        errors.push(where + '/' + task.id + ': точка (0, ' + task.meta.b + ') ближе ' +
          rules.interceptMargin + ' клеток к границе окна ±' + task.meta.window.ymax);
      }
    });
  }

  if (rules.minDistinctAbsK !== undefined) {
    var absK = {};
    ks.forEach(function (k) { absK[Math.abs(k)] = true; });
    need(Object.keys(absK).length, rules.minDistinctAbsK, 'различных |k|');
  }

  /* Блок 3: варианты ответа. */
  if (rules.allChoice !== undefined) {
    tasks.forEach(function (task) {
      var at = where + '/' + task.id;
      if (task.answerType !== 'choice') {
        errors.push(at + ': ожидался answerType choice, а он ' + task.answerType);
        return;
      }
      if (!task.options || task.options.length !== rules.allChoice) {
        errors.push(at + ': вариантов ' + (task.options ? task.options.length : 0) +
          ', нужно ' + rules.allChoice);
        return;
      }

      /* Верный вариант существует; если варианты — формулы, он ещё и
         совпадает с уравнением, восстановленным из чертежа независимо
         от генератора. У вариантов «да / нет» сверять нечего: их
         согласованность с чертежом проверяет probeOffsetMax. */
      var picked = task.options.filter(function (o) { return o.number === task.answer; })[0];
      if (!picked) {
        errors.push(at + ': ответ «' + task.answer + '» не указывает ни на один вариант');
      } else if (rules.optionsAre === 'equation') {
        var expected = generator.equationText(task.meta.k, task.meta.b);
        if (picked.text !== expected) {
          errors.push(at + ': верным помечен «' + picked.text + '», а на чертеже ' + expected);
        }
      }

      if (rules.optionsDistinct) {
        var seen = {};
        task.options.forEach(function (option) {
          if (seen[option.text]) { errors.push(at + ': вариант «' + option.text + '» повторяется'); }
          seen[option.text] = true;
        });
      }
    });

    /* Место верного ответа распределено по набору, а не скоплено. */
    if (rules.balancedAnswerPlaces) {
      var places = {};
      tasks.forEach(function (task) { places[task.answer] = (places[task.answer] || 0) + 1; });
      var low = Math.floor(tasks.length / rules.allChoice);
      var high = Math.ceil(tasks.length / rules.allChoice);
      for (var n = 1; n <= rules.allChoice; n++) {
        var got = places[String(n)] || 0;
        if (got < low || got > high) {
          errors.push(where + ': верный ответ стоит на месте ' + n + ' ' + got + ' раз, нужно ' +
            (low === high ? low : low + '–' + high));
        }
      }
    }
  }

  /* Блоки 4 и 5: состав «да / нет» и поведение проверяемой точки. */
  if (rules.yesCount !== undefined) {
    var yes = tasks.filter(function (task) { return task.answer === '1'; }).length;
    if (yes !== rules.yesCount) {
      errors.push(where + ': ответов «да» — ' + yes + ', нужно ровно ' + rules.yesCount);
    }
  }

  /* Ответы не должны идти строгим чередованием: такую последовательность
     ученик замечает раньше, чем успевает решить задачу. */
  if (rules.noAlternatingAnswers) {
    var alternating = tasks.length > 2;
    for (var t = 1; t < tasks.length; t++) {
      if (tasks[t].answer === tasks[t - 1].answer) { alternating = false; break; }
    }
    if (alternating) { errors.push(where + ': ответы идут строгим чередованием'); }
  }

  if (rules.probeOffsetMax !== undefined) {
    tasks.forEach(function (task) {
      var probe = task.meta.probe;
      var at = where + '/' + task.id;
      if (!probe) { errors.push(at + ': не задана проверяемая точка'); return; }
      if (Math.abs(probe.delta) > rules.probeOffsetMax + 1e-9) {
        errors.push(at + ': точка отстоит от прямой на ' + Math.abs(probe.delta) +
          ', допустимо не больше ' + rules.probeOffsetMax);
      }
      /* «Да» — точка ровно на прямой, «нет» — обязательно мимо. */
      var onLine = Math.abs(probe.delta) < 1e-9;
      if (onLine !== (task.answer === '1')) {
        errors.push(at + ': ответ и положение точки не согласованы');
      }
    });
  }

  if (rules.probeInsideWindow) {
    tasks.forEach(function (task) {
      var probe = task.meta.probe;
      var win = task.meta.window;
      if (!probe || !win) { return; }
      if (Math.abs(probe.x) > win.xmax - 1 || Math.abs(probe.y) > win.ymax - 1) {
        errors.push(where + '/' + task.id + ': проверяемая точка (' + probe.x + '; ' + probe.y +
          ') вышла за окно ±' + win.xmax);
      }
    });
  }

  if (rules.noChart) {
    tasks.forEach(function (task) {
      if (task.svg) { errors.push(where + '/' + task.id + ': у задачи без чертежа появился чертёж'); }
    });
  }

  if (rules.minDistinctIntercepts !== undefined) {
    var distinctB = {};
    tasks.forEach(function (task) { distinctB[task.meta.b] = true; });
    need(Object.keys(distinctB).length, rules.minDistinctIntercepts, 'различных b');
  }

  if (rules.noZeroIntercept) {
    tasks.forEach(function (task) {
      if (task.meta.b === 0) { errors.push(where + '/' + task.id + ': b = 0 в блоке запрещён'); }
    });
  }

  if (rules.forbidAbsK) {
    tasks.forEach(function (task) {
      rules.forbidAbsK.forEach(function (value) {
        if (Math.abs(Math.abs(task.meta.k) - value) < 1e-9) {
          errors.push(where + '/' + task.id + ': |k| = ' + value + ' в блоке запрещён');
        }
      });
    });
  }

  if (rules.uniquePairs) {
    var pairs = {};
    tasks.forEach(function (task) {
      var key = task.meta.k + '@' + task.meta.b;
      if (pairs[key]) { errors.push(where + ': пара (k, b) = (' + key.replace('@', ', ') + ') повторяется'); }
      pairs[key] = true;
    });
  }

  if (rules.uniqueSlopes) {
    var slopes = {};
    ks.forEach(function (k) {
      if (slopes[k]) { errors.push(where + ': наклон k = ' + k + ' повторяется'); }
      slopes[k] = true;
    });
  }

  return errors;
}

/* Правила генерации (§4) на каждом собранном варианте. */
function checkTask(set, task) {
  var errors = [];
  var where = set.id + '/' + task.id;
  var meta = task.meta;

  /* Блок 5 идёт без чертежа: окна и опорных точек у него нет. */
  var hasChart = !!task.svg;
  if (hasChart) { errors = errors.concat(checkWindow(meta.window, where)); }
  else if (meta.window) { errors.push(where + ': задача без чертежа, но окно задано'); }

  var abs = Math.abs(meta.k);
  if (abs === 0) {
    var allowed = (set.tasks || []).some(function (item) {
      return item.id === task.id && item.constraints && item.constraints.allowZeroSlope;
    });
    if (!allowed) { errors.push(where + ': горизонтальная прямая без флага allowZeroSlope'); }
  } else if (abs < 1 / 3 - 1e-9 || abs > 3 + 1e-9) {
    errors.push(where + ': наклон вне диапазона 1/3…3 (k = ' + meta.k + ')');
  }

  if (hasChart && (!meta.points || meta.points.length < 2)) {
    errors.push(where + ': меньше двух опорных точек с целыми координатами');
  }
  if (!task.answer) { errors.push(where + ': пустой ответ'); }
  return errors;
}

/* ══════════════════════════════════════════════════════════
   Обход наборов задач. Подготовка и прототипы считаются отдельно
   и ни в каком месте не складываются в одно число.
   ══════════════════════════════════════════════════════════ */
function readSets(dir) {
  var full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) { return []; }
  return fs.readdirSync(full).filter(function (name) { return /\.json$/.test(name); })
    .sort().map(function (name) {
      return { name: name, path: path.join(full, name),
               data: JSON.parse(fs.readFileSync(path.join(full, name), 'utf8')) };
    });
}

function run() {
  var errors = [];
  var report = [];

  errors = errors.concat(selfTestWindow());
  report.push('окно: самопроверка на ' + WINDOW_CASES.length + ' случаях');

  var prep = readSets('prep/12');
  var prototypes = readSets('prototypes/12');

  report.push('подготовка:  блоков ' + prep.length + ', задач ' +
    prep.reduce(function (sum, set) { return sum + (set.data.tasks || []).length; }, 0) +
    ' (в покрытие банка ФИПИ не входят)');
  report.push('прототипы:   наборов ' + prototypes.length + ', задач ' +
    prototypes.reduce(function (sum, set) { return sum + (set.data.tasks || []).length; }, 0) +
    ' (только это число — покрытие банка)');

  prep.concat(prototypes).forEach(function (entry) {
    var set = entry.data;
    var tasks;
    try {
      tasks = generator.generateSet(set.id);
    } catch (error) {
      errors.push(set.id + ': ' + error.message);
      return;
    }
    tasks.forEach(function (task) { errors = errors.concat(checkTask(set, task)); });
    errors = errors.concat(checkComposition(set, tasks));
    report.push('  ' + set.id + ' «' + set.title + '»: собрано ' + tasks.length +
      ', ответы: ' + tasks.map(function (t) { return t.answer; }).join(', '));
  });

  return { errors: errors, report: report };
}

function main() {
  var result = run();
  console.log('graph/validate.js');
  result.report.forEach(function (line) { console.log('  ' + line); });

  if (result.errors.length) {
    console.error('\nОШИБКИ (' + result.errors.length + '):');
    result.errors.forEach(function (line) { console.error('  • ' + line); });
    process.exit(1);
  }
  console.log('\nвсё чисто');
}

module.exports = { checkWindow: checkWindow, checkScene: checkScene, run: run };

if (require.main === module) { main(); }
