/* graph/hints-trigonometric.js — подсказка тренажёра к задаче о
   тригонометрической функции f(x) = a cos x + b, a sin x + b, a tg x + b.

   Лестница вопросов с кнопками-ответами, шаги те же, что в полном
   решении (graph/solution-trigonometric.js): точки в узлах → значения
   функции и система → b → a → ответ с проверкой по графику. Параметры
   на глаз не угадываются: каждый вопрос ведёт к подстановке точек.

   В каждом вопросе верный вариант ровно один, у неверного — короткое
   пояснение. После верного ответа показываются формулы шага полного
   решения. Формулы — TeX в $…$; набирает их lib/trainer.ts. */

import Line from './families/line.js';
import P from './base-power.js';
import T from './generate-trigonometric.js';
import Solution from './solution-trigonometric.js';

var frac = Line.frac, add = Line.add, mul = Line.mul;

var tex = P.tex;

/* Перемешивание детерминированное — по номеру задачи. */
function shuffle(list, seedKey) {
  var h = 2166136261;
  for (var i = 0; i < seedKey.length; i++) { h = Math.imul(h ^ seedKey.charCodeAt(i), 16777619) >>> 0; }
  var out = list.slice();
  for (var j = out.length - 1; j > 0; j--) {
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
    var r = h % (j + 1);
    var tmp = out[j]; out[j] = out[r]; out[r] = tmp;
  }
  return out;
}

function choice(right, wrongs, seedKey) {
  var seen = {};
  var options = [];
  [{ text: right.text, key: right.key, why: null }].concat(wrongs).forEach(function (o, i) {
    if (seen[o.key]) { return; }
    seen[o.key] = true;
    options.push({ text: o.text, right: i === 0, why: i === 0 ? null : o.why, key: o.key });
  });
  return shuffle(options.slice(0, 4), seedKey);
}

function question(prompt, right, wrongs, rightText, seedKey) {
  return { prompt: prompt, options: choice(right, wrongs, seedKey), right: rightText, answer: right.key };
}

function numOption(f, why) { return { text: '$' + tex(f) + '$', key: 'n=' + P.key(f), why: why }; }

function solutionTex(step) {
  return (step.blocks || []).filter(function (b) { return b.type === 'formula' && b.tex; })
    .map(function (b) { return b.tex; });
}

function base(sol) { return { number: sol.number, title: sol.title, id: sol.id, kind: 'questions' }; }

function htmlToHint(html) {
  return String(html).replace(/<span class="math" data-tex="([^"]*)"><\/span>/g, function (_, t) {
    return '$' + t.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&amp;/g, '&') + '$';
  }).replace(/<[^>]+>/g, '');
}

function point(pt) { return '$\\left(' + Solution.xTex(pt.X) + ';\\, ' + tex(pt.y) + '\\right)$'; }

/* ══════════════════════════════════════════════════════════
   Вопросы
   ══════════════════════════════════════════════════════════ */
function pointsQuestion(A, B, seedKey) {
  var right = { text: point(A) + ' и ' + point(B), key: 'pts' };
  var wrongs = [
    { text: 'Самую высокую и самую низкую точки «на глаз»', key: 'eye',
      why: 'Нет: между узлами сетки координаты точно не прочитать. Берём только отмеченные точки в узлах.' },
    { text: 'Середину волны по рисунку', key: 'mid',
      why: 'Нет: середина волны — это $b$, его нужно найти из уравнений, а не угадать.' }
  ];
  return question('По каким точкам будем восстанавливать формулу?', right, wrongs,
    'Верно: ' + point(A) + ' и ' + point(B) + ' — отмечены и стоят в узлах сетки.', seedKey + ':pts');
}

function valueQuestion(fn, pt, seedKey) {
  var right = numOption(frac(pt.v), null);
  var wrongs = [-1, 0, 1].filter(function (v) { return v !== pt.v; }).map(function (v) {
    return numOption(frac(v), 'Нет: вспомни ' + (fn === 'tg' ? 'значения тангенса' : 'единичную окружность') +
      ' — угол $' + Solution.xTex(pt.X) + '$.');
  });
  if (pt.X !== 0) {
  wrongs.push({ text: '$' + Solution.xTex(pt.X) + '$', key: 'x', why: 'Нет: это сам угол, а нужно значение функции.' });
  }
  return question('Чему равно $' + Solution.fnAt(fn, pt.X) + '$?', right, wrongs,
    'Верно: $' + Solution.fnAt(fn, pt.X) + ' = ' + pt.v + '$.', seedKey + ':val');
}

function bQuestion(cv, A, B, seedKey) {
  var prompt = A.v === 0
    ? 'В первом уравнении $a$ умножается на ноль. Чему равно $b$?'
    : 'Сложи уравнения — $a$ уйдёт. Чему равно $b$?';
  var wrongs = [
    numOption(mul(cv.b, frac(-1)), 'Нет: проверь знак.'),
    numOption(add(A.y, B.y), 'Нет: после сложения получилось $2b$ — раздели на два.'),
    numOption(B.y, 'Нет: это ордината второй точки, а не $b$.')
  ];
  return question(prompt, numOption(cv.b, null), wrongs,
    'Верно: $b = ' + tex(cv.b) + '$.', seedKey + ':b');
}

function aQuestion(cv, A, B, seedKey) {
  var prompt = A.v === 0
    ? 'Подставь $b$ во второе уравнение. Чему равно $a$?'
    : 'Вычти из первого уравнения второе — $b$ уйдёт. Чему равно $a$?';
  var wrongs = [
    numOption(mul(cv.a, frac(-1)), 'Нет: проверь знак — посмотри, где у графика максимум.'),
    numOption(B.y, 'Нет: это ордината точки. Не забудь про $b$.'),
    numOption(mul(cv.a, frac(2)), 'Нет: в уравнении $2a$ — раздели на два.')
  ];
  return question(prompt, numOption(cv.a, null), wrongs,
    'Верно: $a = ' + tex(cv.a) + '$, формула $' + Solution.equationTex(cv, { a: true, b: true }) + '$.',
    seedKey + ':a');
}

function answerQuestion(meta, cv, sanity, seedKey) {
  var asked = meta.rule === 'coef-a' ? cv.a : cv.b;
  var otherParam = meta.rule === 'coef-a' ? cv.b : cv.a;
  var wrongs = [numOption(mul(asked, frac(-1)), 'Нет: проверь знак.')];
  if (P.key(otherParam) !== P.key(asked)) {
    wrongs.push(numOption(otherParam, 'Нет: это ' + (meta.rule === 'coef-a' ? '$b$' : '$a$') +
      ', а спрашивают ' + (meta.rule === 'coef-a' ? '$a$' : '$b$') + '.'));
  }
  return question('Что записать в бланк?', numOption(asked, null), wrongs,
    'Верно: ответ $' + tex(asked) + '$. ' + sanity, seedKey + ':answer');
}

function fromTask(task) {
  var meta = task.meta;
  var cv = T.fromMeta(meta).curve;
  var pts = Solution.ordered(meta.points, cv);
  var A = pts[0], B = pts[1];
  var seedKey = task.id + ':' + meta.seed;
  var solution = Solution.fromTask(task);
  return solution.map(function (sol) {
    if (sol.id === 'points') {
      return Object.assign(base(sol), { questions: [pointsQuestion(A, B, seedKey)], after: [] });
    }
    if (sol.id === 'system') {
      return Object.assign(base(sol), {
        questions: [valueQuestion(cv.fn, A, seedKey + 'A'), valueQuestion(cv.fn, B, seedKey + 'B')],
        after: solutionTex(sol)
      });
    }
    if (sol.id === 'b') {
      return Object.assign(base(sol), { questions: [bQuestion(cv, A, B, seedKey)], after: solutionTex(sol) });
    }
    if (sol.id === 'a') {
      return Object.assign(base(sol), { questions: [aQuestion(cv, A, B, seedKey)], after: solutionTex(sol) });
    }
    var sanity = (sol.blocks.filter(function (b) { return b.type === 'text'; })[0] || {}).html || '';
    return Object.assign(base(sol), { questions: [answerQuestion(meta, cv, htmlToHint(sanity), seedKey)], after: [] });
  });
}

const api = { fromTask: fromTask };

export default api;
export { fromTask };
