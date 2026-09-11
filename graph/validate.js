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
var Line = require('./families/line.js');
var Triangle = require('./triangle.js');

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

  /* ── Прототипы: уровни, разнообразие и запрос за окном (§9, §10) ── */
  if (rules.levels) {
    Object.keys(rules.levels).forEach(function (level) {
      var got = tasks.filter(function (task) { return task.level === level; }).length;
      if (got !== rules.levels[level]) {
        errors.push(where + ': вариантов уровня «' + level + '» — ' + got +
          ', нужно ровно ' + rules.levels[level]);
      }
    });
  }

  if (rules.levelOrder) {
    var seenUnlucky = false;
    tasks.forEach(function (task) {
      if (task.level === 'unlucky') { seenUnlucky = true; }
      else if (seenUnlucky) {
        errors.push(where + '/' + task.id + ': «повезло» стоит после «не повезло», ' +
          'порядок набора идёт по возрастанию сложности');
      }
    });
  }

  if (rules.unluckyReasons) {
    Object.keys(rules.unluckyReasons).forEach(function (reason) {
      var got = tasks.filter(function (task) { return task.levelReason === reason; }).length;
      need(got, rules.unluckyReasons[reason], 'вариантов «не повезло» с причиной «' + reason + '»');
    });
  }

  /* В наборах с двумя прямыми дробным считается вариант, где дробна
     хотя бы одна из них. */
  function linesOf(task) {
    return task.meta.lines && task.meta.lines.length ? task.meta.lines
                                                     : [{ k: task.meta.k, b: task.meta.b }];
  }

  var fractionTasks = tasks.filter(function (task) {
    return linesOf(task).some(function (line) {
      return !Number.isInteger(line.k) || !Number.isInteger(line.b);
    });
  });
  if (rules.minFractionVariants !== undefined) {
    need(fractionTasks.length, rules.minFractionVariants, 'вариантов с дробной прямой');
  }
  if (rules.maxFractionVariants !== undefined && fractionTasks.length > rules.maxFractionVariants) {
    errors.push(where + ': вариантов с дробным коэффициентом — ' + fractionTasks.length +
      ', допустимо не больше ' + rules.maxFractionVariants);
  }

  if (rules.minDistinctK !== undefined) {
    var distinctK = {};
    ks.forEach(function (k) { distinctK[k] = true; });
    need(Object.keys(distinctK).length, rules.minDistinctK, 'различных k');
  }

  function repeats(values, limit, what) {
    var counts = {};
    values.forEach(function (value) { counts[value] = (counts[value] || 0) + 1; });
    Object.keys(counts).forEach(function (value) {
      if (counts[value] > limit) {
        errors.push(where + ': ' + what + ' ' + value + ' повторяется ' + counts[value] +
          ' раз, допустимо не больше ' + limit);
      }
    });
  }
  if (rules.maxSlopeRepeat !== undefined) { repeats(ks, rules.maxSlopeRepeat, 'наклон'); }
  if (rules.maxInterceptRepeat !== undefined) { repeats(bs, rules.maxInterceptRepeat, 'свободный член'); }

  if (rules.fractionDenominators) {
    var denominators = {};
    tasks.forEach(function (task) {
      if (task.meta.kFraction && task.meta.kFraction.q > 1) { denominators[task.meta.kFraction.q] = true; }
    });
    rules.fractionDenominators.forEach(function (q) {
      if (!denominators[q]) {
        errors.push(where + ': среди дробных наклонов нет знаменателя ' + q);
      }
    });
  }

  if (rules.maxZeroIntercept !== undefined) {
    var zeroB = bs.filter(function (b) { return b === 0; }).length;
    if (zeroB > rules.maxZeroIntercept) {
      errors.push(where + ': b = 0 встречается ' + zeroB + ' раз, допустимо не больше ' +
        rules.maxZeroIntercept);
    }
  }

  if (rules.uniqueAnswers) {
    var answers = {};
    tasks.forEach(function (task) {
      if (answers[task.answer]) { errors.push(where + ': ответ ' + task.answer + ' повторяется'); }
      answers[task.answer] = true;
    });
  }

  if (rules.minNonIntegerAnswers !== undefined) {
    var nonInteger = tasks.filter(function (task) { return /[,\/]/.test(task.answer); }).length;
    need(nonInteger, rules.minNonIntegerAnswers, 'нецелых ответов');
  }

  /* §8 — суть прототипа: спрашиваемая точка лежит строго вне окна,
     иначе ответ снимается с рисунка и уравнение не нужно.
     Заодно ответ пересчитывается независимо от генератора: по k и b
     с чертежа, а не по тому, что сказала сборка. */
  if (rules.queryOutsideWindow) {
    tasks.forEach(function (task) {
      var query = task.meta.query;
      var at = where + '/' + task.id;
      if (!query) { errors.push(at + ': не задан запрос за пределами окна'); return; }
      if (Math.abs(query.x0) <= task.meta.window.xmax) {
        errors.push(at + ': запрошенная абсцисса ' + query.x0 + ' попала внутрь окна ±' +
          task.meta.window.xmax);
      }

      var source = (set.tasks || []).filter(function (item) { return item.id === task.id; })[0];
      var rule = source && source.answerRule;
      var answer = Number(String(task.answer).replace(',', '.'));
      var expected = null;

      if (rule === 'value-at') { expected = task.meta.k * query.x0 + task.meta.b; }
      else if (rule === 'argument-for') { expected = (query.y0 - task.meta.b) / task.meta.k; }

      if (expected !== null && Math.abs(expected - answer) > 1e-9) {
        errors.push(at + ': ответ ' + task.answer + ' не сходится с пересчётом по чертежу (' +
          Math.round(expected * 100) / 100 + ')');
      }

      /* И показанное в условии число, и ответ пишутся как в бланке. */
      [query.x0, query.y0, answer].forEach(function (value) {
        if (Math.abs(value * 10 - Math.round(value * 10)) > 1e-9) {
          errors.push(at + ': число ' + value + ' не записывается одним знаком после запятой');
        }
      });
    });
  }

  if (rules.minPerSide !== undefined) {
    var left = tasks.filter(function (task) { return task.meta.query && task.meta.query.x0 < 0; }).length;
    var right = tasks.filter(function (task) { return task.meta.query && task.meta.query.x0 > 0; }).length;
    need(left, rules.minPerSide, 'запросов слева от окна');
    need(right, rules.minPerSide, 'запросов справа от окна');
  }

  /* ── 12.C и 12.D: две прямые, точка пересечения (§8, §10) ── */
  if (rules.intersectionInside !== undefined || rules.intersectionOffscreen !== undefined) {
    var inside = tasks.filter(function (task) {
      return task.meta.intersection && task.meta.intersection.inside;
    });
    var offscreen = tasks.filter(function (task) {
      return task.meta.intersection && !task.meta.intersection.inside;
    });

    if (rules.intersectionInside !== undefined && inside.length !== rules.intersectionInside) {
      errors.push(where + ': пересечений внутри окна — ' + inside.length +
        ', нужно ровно ' + rules.intersectionInside);
    }
    if (rules.intersectionOffscreen !== undefined && offscreen.length !== rules.intersectionOffscreen) {
      errors.push(where + ': пересечений за кадром — ' + offscreen.length +
        ', нужно ровно ' + rules.intersectionOffscreen);
    }

    var margin = rules.intersectionMargin === undefined ? 1 : rules.intersectionMargin;
    inside.forEach(function (task) {
      var point = task.meta.intersection;
      var limit = task.meta.window.xmax - margin;
      if (Math.abs(point.x) > limit || Math.abs(point.y) > limit) {
        errors.push(where + '/' + task.id + ': точка пересечения (' + point.x + '; ' + point.y +
          ') ближе ' + margin + ' клетки к границе окна ±' + task.meta.window.xmax);
      }
    });

    /* §8 — у варианта с пересечением за кадром обе прямые обязаны
       иметь по две целые опорные точки внутри окна. */
    offscreen.forEach(function (task) {
      var pointsPerLine = (task.meta.points || []).length;
      if (pointsPerLine < 2) {
        errors.push(where + '/' + task.id + ': у прямой меньше двух опорных точек');
      }
      var win = task.meta.window;
      if (Math.abs(task.meta.intersection.x) <= win.xmax &&
          Math.abs(task.meta.intersection.y) <= win.ymax) {
        errors.push(where + '/' + task.id + ': пересечение помечено «за кадром», но попадает в окно');
      }
    });

    /* Ответ пересчитывается независимо: по двум уравнениям с чертежа. */
    tasks.forEach(function (task) {
      var lines = linesOf(task);
      if (lines.length < 2) { return; }
      var source = (set.tasks || []).filter(function (item) { return item.id === task.id; })[0];
      var rule = source && source.answerRule;
      var x = (lines[1].b - lines[0].b) / (lines[0].k - lines[1].k);
      var y = lines[0].k * x + lines[0].b;
      var expected = rule === 'intersection-y' ? y : x;
      var answer = Number(String(task.answer).replace(',', '.'));
      if (Math.abs(expected - answer) > 1e-9) {
        errors.push(where + '/' + task.id + ': ответ ' + task.answer +
          ' не сходится с решением системы (' + Math.round(expected * 100) / 100 + ')');
      }
    });
  }

  if (rules.minBothIncreasing !== undefined || rules.minMixedDirections !== undefined) {
    var bothUp = 0, bothDown = 0, mixed = 0;
    tasks.forEach(function (task) {
      var lines = linesOf(task);
      if (lines.length < 2) { return; }
      if (lines[0].k > 0 && lines[1].k > 0) { bothUp++; }
      else if (lines[0].k < 0 && lines[1].k < 0) { bothDown++; }
      else { mixed++; }
    });
    need(bothUp, rules.minBothIncreasing || 0, 'вариантов, где обе прямые возрастают');
    need(bothDown, rules.minBothDecreasing || 0, 'вариантов, где обе убывают');
    need(mixed, rules.minMixedDirections || 0, 'вариантов с разнонаправленными прямыми');
  }

  if (rules.minNearRightAngle !== undefined || rules.minShallowAngle !== undefined) {
    var nearRight = 0, shallow = 0;
    tasks.forEach(function (task) {
      var angle = task.meta.intersection && task.meta.intersection.angle;
      if (angle === undefined || angle === null) { return; }
      if (Math.abs(angle - 90) <= 20) { nearRight++; }
      if (angle <= 30) { shallow++; }
    });
    need(nearRight, rules.minNearRightAngle || 0, 'пересечений под углом, близким к прямому');
    need(shallow, rules.minShallowAngle || 0, 'пологих, но различимых пересечений');
  }

  if (rules.uniqueSlopePairs) {
    var seenPairs = {};
    tasks.forEach(function (task) {
      var lines = linesOf(task);
      if (lines.length < 2) { return; }
      var key = lines[0].k + '|' + lines[1].k;
      if (seenPairs[key]) { errors.push(where + ': пара наклонов (' + key.replace('|', '; ') + ') повторяется'); }
      seenPairs[key] = true;
    });
  }

  /* Пара (k, b) не повторяется. В наборах с двумя прямыми
     сравнивается весь чертёж: обе прямые целиком. */
  if (rules.uniquePairs) {
    var pairs = {};
    tasks.forEach(function (task) {
      var key = linesOf(task).map(function (line) { return line.k + '@' + line.b; }).join(' и ');
      if (pairs[key]) { errors.push(where + '/' + task.id + ': чертёж (' + key + ') повторяется'); }
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

  /* Разбор строится на треугольнике наклона: он обязан существовать
     и целиком помещаться в окне у каждого варианта с чертежом. */
  if (hasChart) {
    var lines = meta.lines && meta.lines.length
      ? meta.lines
      : [{ k: meta.k, b: meta.b, kFraction: meta.kFraction, bFraction: meta.bFraction }];

    lines.forEach(function (item, index) {
      if (item.k === 0) { return; }     /* у горизонтали наклон не строится */
      /* Коэффициенты берём точными дробями: у −1/3 запись double
         не восстанавливается обратно в дробь. */
      var line = Line.create(item.kFraction || item.k, item.bFraction || item.b);
      var triangle = Triangle.build(line, meta.window, index === 0 ? meta.points : null);
      if (!triangle) {
        errors.push(where + ': треугольник наклона не помещается в окне для прямой ' +
          (index + 1) + ' (k = ' + item.k + ', b = ' + item.b + ')');
      } else if (triangle.dx <= 0) {
        errors.push(where + ': вырожденный треугольник наклона у прямой ' + (index + 1));
      }
    });
  }

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
