/* graph/hints-logarithmic.js — подсказка тренажёра к задаче о
   логарифмической функции.

   Лестница вопросов с кнопками-ответами, шаги те же, что в полном
   решении (graph/solution-logarithmic.js): точки в узлах → система →
   a → b → что спрашивают → ответ с проверкой по графику. Параметры на
   глаз не угадываются: каждый вопрос ведёт к подстановке точек.

   В каждом вопросе верный вариант ровно один, у неверного — короткое
   пояснение. После верного ответа показываются формулы шага полного
   решения. Формулы — TeX в $…$; набирает их lib/trainer.ts. */

import Line from './families/line.js';
import P from './base-power.js';
import L from './generate-logarithmic.js';
import XS from './solution-exponential.js';
import Solution from './solution-logarithmic.js';

var frac = Line.frac, add = Line.add, sub = Line.sub, mul = Line.mul, div = Line.div;

var tex = P.tex;

function f0(v) { return Line.toFrac(v); }
function exact(o) { return o ? frac(o.p, o.q) : null; }
function point(x, y) { return '$(' + tex(f0(x)) + ';\\, ' + tex(f0(y)) + ')$'; }

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
function texOption(t, key, why) { return { text: '$' + t + '$', key: key, why: why }; }

function solutionTex(step) {
  return (step.blocks || []).filter(function (b) { return b.type === 'formula' && b.tex; })
    .map(function (b) { return b.tex; });
}

function base(sol) { return { number: sol.number, title: sol.title, id: sol.id, kind: 'questions' }; }

/** Текст проверки из полного решения — без HTML-разметки формул. */
function htmlToHint(html) {
  return String(html).replace(/<span class="math" data-tex="([^"]*)"><\/span>/g, function (_, t) {
    return '$' + t.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&amp;/g, '&') + '$';
  }).replace(/<[^>]+>/g, '');
}

/* ══════════════════════════════════════════════════════════
   Вопросы
   ══════════════════════════════════════════════════════════ */
function pointsQuestion(meta, cv, A, B, seedKey) {
  var right = { text: point(A.x, A.y) + ' и ' + point(B.x, B.y), key: 'pts' };
  var wrongs = [
    { text: 'Асимптоту и точку на ней', key: 'asym',
      why: 'Нет: асимптоту на глаз не берём — и на ней точек графика нет, кривая её не касается.' },
    { text: point(A.y, A.x) + ' и ' + point(B.y, B.x), key: A.x === A.y && B.x === B.y ? 'pts' : 'swap',
      why: 'Нет: координаты перепутаны местами — сначала $x$, потом $y$.' },
    { text: 'Любые две точки кривой «на глаз»', key: 'eye',
      why: 'Нет: между узлами сетки координаты точно не прочитать. Берём только отмеченные точки в узлах.' }
  ];
  return question('По каким точкам будем восстанавливать формулу?', right, wrongs,
    'Верно: ' + point(A.x, A.y) + ' и ' + point(B.x, B.y) + ' — отмечены и стоят в узлах сетки.', seedKey + ':pts');
}

function systemQuestion(meta, A, B, seedKey) {
  var form = meta.form;
  function eq(x, y, swap) {
    var X = tex(f0(swap ? y : x)), Y = tex(f0(swap ? x : y));
    if (form === 'shiftY') { return 'b + \\log_a ' + X + ' = ' + Y; }
    if (form === 'shiftX') { return '\\log_a(' + X + ' + b) = ' + Y; }
    return '\\log_a ' + X + ' = ' + Y;
  }
  var right = texOption(eq(A.x, A.y) + ', \\; ' + eq(B.x, B.y), 'sys');
  var wrongs = [
    texOption(eq(A.x, A.y, true) + ', \\; ' + eq(B.x, B.y, true), A.x === A.y && B.x === B.y ? 'sys' : 'sys-swap',
      'Нет: под логарифм ставим $x$ — абсциссу, а справа — $y$, ординату.'),
    texOption('a^{' + tex(f0(A.x)) + '} = ' + tex(f0(A.y)) + ', \\; a^{' + tex(f0(B.x)) + '} = ' + tex(f0(B.y)),
      'sys-exp', 'Нет: это показательная функция. У логарифма $\\log_a t = s \\iff a^s = t$ — в показатель идёт $y$.')
  ];
  return question('Подставь обе точки в формулу $' + Solution.formTex(form) + '$. Какая система получится?',
    right, wrongs, 'Верно: ' + '$' + eq(A.x, A.y) + '$ и $' + eq(B.x, B.y) + '$.', seedKey + ':sys');
}

function aQuestion(meta, cv, seedKey) {
  var b = cv.base;
  var aVal = b.m === 1 ? b.r : null;
  var right = aVal ? numOption(aVal, null) : texOption(P.baseTex(b), 'a=' + P.baseKey(b));
  var wrongs = [];
  if (aVal) {
    wrongs.push(numOption(div(frac(1), aVal), 'Нет: функция ' + (P.growing(b) ? 'возрастает — основание больше единицы.'
      : 'убывает — основание меньше единицы.')));
    wrongs.push(numOption(add(aVal, frac(1)), 'Нет: подставь найденное $a$ в уравнение и проверь.'));
    wrongs.push(numOption(mul(aVal, aVal), 'Нет: это $a^2$, а нужно само основание.'));
  } else {
    wrongs.push(numOption(b.r, 'Нет: это $a^2$. Само основание — корень из него.'));
    wrongs.push(numOption(div(frac(1), b.r), 'Нет: переверни дробь ещё раз — функция ' + (P.growing(b) ? 'возрастает.' : 'убывает.')));
  }
  var hint = meta.form === 'shiftY' ? 'Вычти из второго уравнения первое — $b$ уйдёт, останется логарифм частного.'
    : meta.form === 'shiftX' ? 'Переведи уравнения в показательную запись $x + b = a^y$ и вычти — $b$ уйдёт.'
    : 'Переведи уравнение в показательную запись: $\\log_a t = s \\iff a^s = t$.';
  return question(hint + ' Чему равно $a$?', right, wrongs,
    'Верно: $a = ' + P.baseTex(b) + '$, формула $' + Solution.equationTex(cv, meta.form, { a: true, b: false }) + '$.',
    seedKey + ':a');
}

function bQuestion(meta, cv, seedKey) {
  var shift = frac(meta.form === 'shiftX' ? cv.c : cv.d);
  var wrongs = [
    numOption(mul(frac(-1), shift), meta.form === 'shiftX'
      ? 'Нет: знак перепутан. Асимптота $x = ' + tex(frac(-cv.c)) + '$ — там аргумент $x + b$ равен нулю, значит, $b = ' +
        tex(frac(cv.c)) + '$.'
      : 'Нет: перенеси логарифм в другую часть, поменяв знак, и пересчитай.'),
    numOption(add(shift, frac(1)), 'Нет: подставь найденное $a$ в первое уравнение и пересчитай.'),
    numOption(sub(shift, frac(1)), meta.form === 'shiftX'
      ? 'Нет: асимптоту на глаз не берём — $b$ получается из уравнения.'
      : 'Нет: посчитай логарифм в первом уравнении ещё раз.')
  ];
  return question('Подставь найденное $a$ в первое уравнение. Чему равно $b$?', numOption(shift, null), wrongs,
    'Верно: $b = ' + tex(shift) + '$, формула $' + Solution.equationTex(cv, meta.form, { a: true, b: true }) + '$.',
    seedKey + ':b');
}

var ASKED = {
  'value-at': 'значение функции при данном $x$',
  'argument-for': '$x$, при котором функция принимает данное значение',
  'coef-a': 'основание $a$',
  'coef-b': 'число $b$'
};

function askedQuestion(rule, seedKey) {
  var wrongs = Object.keys(ASKED).filter(function (r) { return r !== rule; }).map(function (r) {
    return { text: ASKED[r], key: 'ask=' + r, why: 'Нет: перечитай последнее предложение условия.' };
  });
  return question('Что спрашивают в задаче?', { text: ASKED[rule], key: 'ask=' + rule }, wrongs,
    'Верно: нужно найти ' + ASKED[rule] + '.', seedKey + ':asked');
}

function answerQuestion(meta, cv, sanity, seedKey) {
  var answer = exact(meta.answer);
  var q = meta.query;
  var wrongs = [];
  var prompt;
  if (meta.rule === 'value-at') {
    var x0 = exact(q.x0);
    prompt = 'Подставь $x = ' + tex(x0) + '$ в формулу $' + Solution.equationTex(cv, meta.form, { a: true, b: true }) +
      '$ и запиши аргумент логарифма степенью основания. Чему равно значение?';
    wrongs = [
      numOption(add(frac(-q.n), frac(cv.d)), 'Нет: знак показателя потерян. Проверь подстановкой: основание в этой степени должно дать число под логарифмом.'),
      numOption(add(P.pow(cv.base, q.n), frac(cv.d)), 'Нет: это число под логарифмом, а логарифм — показатель степени.')
    ];
    if (cv.d !== 0) { wrongs.push(numOption(frac(q.n), 'Нет: не прибавлено $b = ' + tex(frac(cv.d)) + '$.')); }
  } else if (meta.rule === 'argument-for') {
    var y0 = exact(q.y0);
    prompt = 'Реши уравнение $f(x) = ' + tex(y0) + '$: ' + (cv.d !== 0 ? 'перенеси $b$, ' : '') +
      'перейди к показательной записи. Чему равен $x$?';
    wrongs = [
      numOption(frac(q.n), 'Нет: это показатель степени. Под логарифмом стоит основание в этой степени.'),
      numOption(add(answer, frac(1)), 'Нет: ещё раз посчитай степень основания.')
    ];
    if (cv.c !== 0) {
      wrongs.unshift(numOption(P.pow(cv.base, q.n), 'Нет: это значение $x + b$. Осталось вычесть $b = ' +
        tex(frac(cv.c)) + '$.'));
    }
  } else {
    prompt = 'Какой ответ записать в бланк?';
    wrongs = [numOption(mul(frac(-1), answer), 'Нет: проверь знак.'),
      numOption(add(answer, frac(1)), 'Нет: в ответ идёт найденное число.')];
  }
  return question(prompt, numOption(answer, null), wrongs, 'Верно: ответ $' + tex(answer) + '$. ' + sanity,
    seedKey + ':answer');
}

function fromTask(task) {
  var meta = task.meta;
  var cv = L.fromMeta(meta).curve;
  var marks = XS.orderedMarks(meta.points);
  var A = marks[0], B = marks[1];
  var seedKey = task.id + ':' + meta.seed;
  var solution = Solution.fromTask(task);
  var steps = [];
  solution.forEach(function (sol) {
    if (sol.id === 'points') {
      steps.push(Object.assign(base(sol), { questions: [pointsQuestion(meta, cv, A, B, seedKey)], after: [] }));
    } else if (sol.id === 'system') {
      steps.push(Object.assign(base(sol), { questions: [systemQuestion(meta, A, B, seedKey)], after: solutionTex(sol) }));
    } else if (sol.id === 'a') {
      steps.push(Object.assign(base(sol), { questions: [aQuestion(meta, cv, seedKey)], after: solutionTex(sol) }));
    } else if (sol.id === 'b') {
      steps.push(Object.assign(base(sol), { questions: [bQuestion(meta, cv, seedKey)], after: solutionTex(sol) }));
    } else if (sol.id === 'asked') {
      steps.push(Object.assign(base(sol), { questions: [askedQuestion(meta.rule, seedKey)], after: [] }));
    } else if (sol.id === 'answer') {
      var sanity = (sol.blocks.filter(function (b) { return b.type === 'text'; })[0] || {}).html || '';
      var asked = solution.filter(function (s) { return s.id === 'asked'; })[0];
      steps.push(Object.assign(base(sol), {
        questions: [answerQuestion(meta, cv, htmlToHint(sanity), seedKey)],
        after: asked ? solutionTex(asked) : []
      }));
    }
  });
  return steps;
}

const api = { fromTask: fromTask };

export default api;
export { fromTask };
