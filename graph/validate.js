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

  prep.concat(prototypes).forEach(function (set) {
    (set.data.tasks || []).forEach(function (task) {
      if (task.window) { errors = errors.concat(checkWindow(task.window, set.name + '/' + task.id)); }
    });
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
