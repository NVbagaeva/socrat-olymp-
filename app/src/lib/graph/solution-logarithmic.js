/* graph/solution-logarithmic.js — разбор задачи о логарифмической функции.

   Метод один на всю подтему, и он обязателен:
     • параметры НИКОГДА не угадываются по рисунку — даже асимптота.
       Берём две отмеченные точки в узлах сетки и составляем систему;
     • логарифм переводим в показательную запись: logₐ t = s ⇔ aˢ = t;
     • у b + logₐ x уравнения вычитаем (b уходит, разность логарифмов —
       логарифм частного), у logₐ(x + b) — вычитаем показательные записи;
     • после каждого найденного параметра заново выписываем формулу;
     • потом вычисляем f(x₀) или решаем f(x) = c;
     • в конце — проверка по графику: возрастает или убывает, где
       асимптота, ответ в области определения.

   Шаги (те же номера и названия у подсказки, graph/hints-logarithmic.js):
     1. Точки на графике
     2. Система уравнений
     3. Находим a
     4. Находим b              — у b + logₐ x и logₐ(x + b)
     5. Что нужно найти
     6. Проверка по графику и ответ */

import Line from './families/line.js';
import P from './base-power.js';
import L from './generate-logarithmic.js';
import XS from './solution-exponential.js';

var frac = Line.frac, add = Line.add, sub = Line.sub, mul = Line.mul, div = Line.div,
    num = Line.num, isZero = Line.isZero;

var tex = P.tex;
var chain = XS.chain;

/* ══════════════════════════════════════════════════════════
   Блоки и записи
   ══════════════════════════════════════════════════════════ */
function text(html) { return { type: 'text', html: html }; }
function formula(tx) { return { type: 'formula', tex: tx }; }
function escapeAttr(value) {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
function m(tx) { return '<span class="math" data-tex="' + escapeAttr(tx) + '"></span>'; }
function step(id, title, blocks) { return { id: id, title: title, blocks: blocks }; }
function answerBlock(value) {
  var shown = P.valueText(value);
  return { type: 'answer', html: 'Ответ: <b class="key">' + shown + '</b>', tex: tex(value), text: shown };
}
function exact(o) { return o ? frac(o.p, o.q) : null; }
function f0(v) { return Line.toFrac(v); }
function tb(f) { return f.p < 0 ? '(' + tex(f) + ')' : tex(f); }
function term(f) {
  if (isZero(f)) { return ''; }
  return (f.p > 0 ? ' + ' : ' - ') + tex(frac(Math.abs(f.p), f.q));
}

/** Аргумент логарифма: x, x + 5, x − 2. */
function argument(c, letter) { return (letter || 'x') + term(frac(c)); }

function formTex(form) {
  if (form === 'shiftY') { return 'f(x) = b + \\log_a x'; }
  if (form === 'shiftX') { return 'f(x) = \\log_a(x + b)'; }
  return 'f(x) = \\log_a x';
}

/** Основание в индексе логарифма: \log_{2}, \log_{\frac{1}{2}}. */
function logOf(b) {
  var t = P.baseTex(b).replace(/\\dfrac/g, '\\frac');
  return '\\log_{' + t + '}';
}

function equationTex(cv, form, known) {
  var lg = known.a ? logOf(cv.base) : '\\log_a';
  if (form === 'shiftY') {
    return 'f(x) = ' + (known.b ? tex(frac(cv.d)) + ' + ' : 'b + ') + lg + ' x';
  }
  if (form === 'shiftX') {
    return 'f(x) = ' + lg + '(' + (known.b ? argument(cv.c) : 'x + b') + ')';
  }
  return 'f(x) = ' + lg + ' x';
}

function shiftOf(cv, form) { return form === 'shiftX' ? cv.c : cv.d; }

function words(s) { return s.replace('Основание показательной функции всегда положительно', 'Основание логарифма всегда положительно'); }

/* ══════════════════════════════════════════════════════════
   Шаги
   ══════════════════════════════════════════════════════════ */
function pointTex(name, x, y) { return name + '(' + tex(f0(x)) + ';\\, ' + tex(f0(y)) + ')'; }

function stepPoints(meta, A, B) {
  return step('points', 'Берём отмеченные точки', [
    text('Параметры функции по рисунку на глаз не угадываем — даже асимптоту: ошибиться на полклетки ' +
      'легко, а ответ от этого изменится. Работаем только с точками, которые отмечены на графике и стоят ' +
      'ровно в узлах клетчатой сетки — их координаты целые и читаются точно.'),
    text('Отмечены точки ' + m(pointTex('A', A.x, A.y)) + ' и ' + m(pointTex('B', B.x, B.y)) +
      '. Обе лежат на графике, значит, их координаты обращают формулу ' + m(formTex(meta.form)) +
      ' в верное равенство.')
  ]);
}

function one(form, Pt) {
  var x = tex(f0(Pt.x)), y = tex(f0(Pt.y));
  if (form === 'shiftY') { return 'b + \\log_a ' + x + ' = ' + y; }
  if (form === 'shiftX') { return '\\log_a(' + x + ' + b) = ' + y; }
  return '\\log_a ' + x + ' = ' + y;
}

function stepSystem(meta, A, B) {
  var blocks = [
    text('Подставляем координаты каждой точки в формулу: вместо ' + m('x') + ' — абсциссу, вместо ' +
      m('f(x)') + ' — ординату. Получаем систему из двух уравнений:'),
    formula('\\begin{cases} ' + one(meta.form, A) + ' \\\\ ' + one(meta.form, B) + ' \\end{cases}'),
    text('Логарифм удобно переводить в показательную запись: ' + m('\\log_a t = s \\iff a^s = t') +
      ' — логарифм равен тому показателю, в который нужно возвести основание, чтобы получить ' + m('t') + '.')
  ];
  if (meta.form === 'shiftY') {
    blocks.push(text('В обоих уравнениях одно и то же ' + m('b') + '. Вычтем из второго уравнения первое — ' +
      m('b') + ' уйдёт.'));
  } else if (meta.form === 'shiftX') {
    blocks.push(text('Переведём оба уравнения в показательную запись — ' + m('b') + ' окажется слагаемым, и его ' +
      'уберёт вычитание:'));
    blocks.push(formula('\\begin{cases} ' + tex(f0(A.x)) + ' + b = a^{' + tex(f0(A.y)) + '} \\\\ ' + tex(f0(B.x)) +
      ' + b = a^{' + tex(f0(B.y)) + '} \\end{cases}'));
  }
  return step('system', 'Составляем систему уравнений', blocks);
}

function stepA(meta, cv, A, B) {
  var form = meta.form;
  var b = cv.base;
  var blocks = [];
  if (form === 'basic') {
    var useB = A.x === 1 ? B : (B.x === 1 ? A : B);
    if (A.x === 1 || B.x === 1) {
      blocks.push(text('Уравнение с ' + m('x = 1') + ' — ' + m('\\log_a 1 = 0') + ' — верно при любом ' + m('a') +
        ': график любого логарифма проходит через ' + m('(1;\\, 0)') + '. Значит, ' + m('a') +
        ' находим из второго уравнения, переведя его в показательную запись:'));
    } else {
      blocks.push(text('Переводим уравнение в показательную запись:'));
    }
    blocks.push(formula('\\log_a ' + tex(f0(useB.x)) + ' = ' + tex(f0(useB.y)) + ' \\iff a^{' + tex(f0(useB.y)) +
      '} = ' + tex(f0(useB.x))));
    var s = XS.solveA(b, useB.y, f0(useB.x));
    blocks.push(text(words(s.words)));
    blocks.push(formula(chain(s.lines)));
  } else if (form === 'shiftY') {
    var dy = deltaY(A, B);
    var ratio = div(f0(B.x), f0(A.x));
    blocks.push(text('Вычитаем из второго уравнения первое — ' + m('b') + ' сокращается. Разность логарифмов с ' +
      'одним основанием — логарифм частного: ' + m('\\log_a u - \\log_a v = \\log_a \\dfrac{u}{v}') + '.'));
    blocks.push(formula(chain(['\\log_a ' + tex(f0(B.x)) + ' - \\log_a ' + tex(f0(A.x)) + ' = ' + tex(f0(B.y)) + ' - ' +
      tb(f0(A.y)) + ' = ' + tex(dy), '\\log_a ' + (A.x === 1 ? tex(f0(B.x)) : '\\dfrac{' + tex(f0(B.x)) + '}{' +
      tex(f0(A.x)) + '} = \\log_a ' + tex(ratio)) + ' = ' + tex(dy) + ' \\iff a^{' + tex(dy) + '} = ' + tex(ratio)])));
    var s2 = XS.solveA(b, num(dy), ratio);
    blocks.push(text(words(s2.words)));
    blocks.push(formula(chain(s2.lines)));
  } else {
    /* logₐ(x + b): x₁ + b = a^{y₁}, x₂ + b = a^{y₂}; вычитаем. */
    var dx = sub(f0(B.x), f0(A.x));
    blocks.push(text('Вычитаем из второго уравнения первое — ' + m('b') + ' сокращается:'));
    blocks.push(formula('a^{' + tex(f0(B.y)) + '} - a^{' + tex(f0(A.y)) + '} = ' + tex(f0(B.x)) + ' - ' + tb(f0(A.x)) +
      ' = ' + tex(dx)));
    if (A.y === 0 || B.y === 0) {
      var other = A.y === 0 ? B : A;
      var sign = A.y === 0 ? 1 : -1;
      var rhs = add(mul(frac(sign), dx), frac(1));
      blocks.push(text('Здесь ' + m('a^0 = 1') + '. Переносим единицу вправо:'));
      blocks.push(formula('a^{' + tex(f0(other.y)) + '} = ' + tex(rhs)));
      var s3 = XS.solveA(b, other.y, rhs);
      blocks.push(text(words(s3.words)));
      blocks.push(formula(chain(s3.lines)));
    } else {
      var low = Math.abs(A.y) < Math.abs(B.y) ? A : B, high = low === A ? B : A;
      var t = P.pow(b, low.n);
      var tT = 'a^{' + tex(f0(low.y)) + '}';
      if (Math.abs(high.n) === 2 * Math.abs(low.n)) {
        var D = add(frac(1), mul(frac(4), dx));
        var sq = Math.round(Math.sqrt(num(D)));
        blocks.push(text('Обозначим ' + m('t = ' + tT) + ', тогда ' + m('a^{' + tex(f0(high.y)) + '} = t^2') +
          ' и уравнение становится квадратным:'));
        blocks.push(formula(chain(['t^2 - t - ' + tb(dx) + ' = 0, \\quad D = 1 + 4 \\cdot ' + tb(dx) + ' = ' + tex(D) +
          ' = ' + sq + '^2', 't = \\dfrac{1 \\pm ' + sq + '}{2}: \\quad t_1 = ' + (1 + sq) / 2 + ', \\quad t_2 = ' +
          (1 - sq) / 2])));
        blocks.push(text('Степень положительного числа всегда положительна, поэтому ' + m('t = ' + tex(t)) +
          ', то есть ' + m(tT + ' = ' + tex(t)) + '.'));
        var s4 = XS.solveA(b, low.y, t);
        blocks.push(formula(chain(s4.lines)));
      } else {
        blocks.push(text('Подберём основание: точки в узлах сетки, значит, степени основания — числа, удобные для ' +
          'счёта. Проверяем ' + m('a = ' + P.baseTex(b)) + ': ' + m(tex(P.pow(b, high.n)) + ' - ' + tb(P.pow(b, low.n)) +
          ' = ' + tex(dx)) + ' — подходит. Другого основания с такой разностью степеней нет: при росте ' +
          'основания разность только растёт.'));
        blocks.push(formula('a = ' + P.baseTex(b)));
      }
    }
  }
  blocks.push(text('Мы нашли ' + m('a') + '. Записываем, как теперь выглядит формула:'));
  blocks.push(formula(equationTex(cv, form, { a: true, b: false })));
  blocks.push(text(P.growing(b)
    ? 'Основание больше единицы — функция возрастает, как и на рисунке.'
    : 'Основание меньше единицы — функция убывает, как и на рисунке.'));
  return step('a', 'Находим $a$', blocks);
}

function deltaY(A, B) { return sub(f0(B.y), f0(A.y)); }

function stepB(meta, cv, A) {
  var form = meta.form;
  if (form === 'basic') { return null; }
  var b = cv.base;
  var shift = frac(shiftOf(cv, form));
  var blocks = [];
  if (form === 'shiftY') {
    var n = A.n;
    blocks.push(text('Подставляем найденное ' + m('a') + ' в первое уравнение системы:'));
    blocks.push(formula('b + ' + logOf(b) + ' ' + tex(f0(A.x)) + ' = ' + tex(f0(A.y))));
    blocks.push(text(A.x === 1
      ? 'Логарифм единицы равен нулю, поэтому ' + m('b') + ' находится сразу:'
      : 'Логарифм — это показатель: ' + m(tex(f0(A.x)) + ' = ' + P.baseInPower(b) + '^{' + n + '}') +
        ', значит, ' + m(logOf(b) + ' ' + tex(f0(A.x)) + ' = ' + n) + '. Выражаем ' + m('b') + ':'));
    blocks.push(formula('b' + (n === 0 ? ' + 0' : term(frac(n))) + ' = ' + tex(f0(A.y)) + ' \\;\\Rightarrow\\; b = ' +
      tex(f0(A.y)) + (n === 0 ? '' : term(frac(-n))) + ' = ' + tex(shift)));
  } else {
    var pw = XS.powerExplain(b, A.y);
    blocks.push(text('Подставляем найденное ' + m('a') + ' в первое уравнение в показательной записи:'));
    blocks.push(formula(tex(f0(A.x)) + ' + b = ' + P.baseInPower(b) + '^{' + tex(f0(A.y)) + '}'));
    blocks.push(text(pw.words + ' Затем выражаем ' + m('b') + ':'));
    blocks.push(formula(chain(pw.tex.concat([tex(f0(A.x)) + ' + b = ' + tex(pw.value) + ' \\;\\Rightarrow\\; b = ' +
      tex(pw.value) + ' - ' + tb(f0(A.x)) + ' = ' + tex(shift)]))));
    blocks.push(text('Так же, без угадывания, получилась и асимптота: это прямая ' + m('x = ' + tex(frac(-cv.c))) +
      ' — там аргумент логарифма обращается в ноль, и график к ней приближается, но никогда её не касается.'));
  }
  blocks.push(text('Мы нашли ' + m('b') + '. Формула теперь полностью известна:'));
  blocks.push(formula(equationTex(cv, form, { a: true, b: true })));
  return step('b', 'Находим $b$', blocks);
}

function stepAsked(meta, cv, answer) {
  var b = cv.base, lg = logOf(b);
  var rule = meta.rule, q = meta.query;
  if (rule === 'coef-a') {
    return step('asked', 'Что нужно найти', [
      text('В задании нужно найти основание ' + m('a') + '. Мы его уже нашли:'), formula('a = ' + tex(answer))
    ]);
  }
  if (rule === 'coef-b') {
    return step('asked', 'Что нужно найти', [
      text('В задании нужно найти ' + m('b') + '. Мы его уже нашли:'), formula('b = ' + tex(answer))
    ]);
  }
  if (rule === 'value-at') {
    var x0 = exact(q.x0);
    var arg = add(x0, frac(cv.c));
    var k = q.n;
    var pw = XS.powerExplain(b, k);
    var blocks = [
      text('Нужно найти ' + m('f(' + tex(x0) + ')') + '. Подставляем ' + m('x = ' + tex(x0)) + ' в формулу:'),
      formula('f(' + tex(x0) + ') = ' + (meta.form === 'shiftY' ? tex(frac(cv.d)) + ' + ' : '') + lg +
        (cv.c === 0 ? ' ' + tex(x0) : '(' + tex(x0) + term(frac(cv.c)) + ') = ' + (meta.form === 'shiftY' ? '' : '') +
          lg + ' ' + tex(arg))),
      text('Логарифм — это показатель степени. Запишем ' + m(tex(arg)) + ' степенью основания ' + m(P.baseTex(b)) + ':'),
      formula(chain(pw.tex)),
      text('Значит, ' + m(tex(arg) + ' = ' + P.baseInPower(b) + '^{' + k + '}') + ' и ' + m(lg + ' ' + tex(arg) + ' = ' + k) +
        (cv.d !== 0 ? '. Остаётся прибавить ' + m('b = ' + tex(frac(cv.d))) + ':' : ':'))
    ];
    blocks.push(formula('f(' + tex(x0) + ') = ' + (cv.d !== 0 ? tb(frac(k)) + term(frac(cv.d)) + ' = ' : '') + tex(answer)));
    return step('asked', 'Что нужно найти', blocks);
  }
  var y0 = exact(q.y0);
  var s = sub(y0, frac(cv.d));
  var pw2 = XS.powerExplain(b, num(s));
  var blocks2 = [
    text('Нужно найти ' + m('x') + ', при котором ' + m('f(x) = ' + tex(y0)) + '. Записываем уравнение:'),
    formula((meta.form === 'shiftY' ? tex(frac(cv.d)) + ' + ' : '') + lg + (cv.c === 0 ? ' x' : '(' + argument(cv.c) + ')') +
      ' = ' + tex(y0))
  ];
  if (cv.d !== 0) {
    blocks2.push(text('Переносим ' + m('b') + ' вправо, поменяв знак:'));
    blocks2.push(formula(lg + ' x = ' + tex(y0) + term(frac(-cv.d)) + ' = ' + tex(s)));
  }
  blocks2.push(text('Переходим к показательной записи: аргумент логарифма равен основанию в степени ' + m(tex(s)) + '.'));
  blocks2.push(formula(argument(cv.c) + ' = ' + P.baseInPower(b) + '^{' + tex(s) + '}'));
  blocks2.push(text(pw2.words));
  blocks2.push(formula(chain(pw2.tex.concat(cv.c === 0 ? ['x = ' + tex(answer)]
    : [argument(cv.c) + ' = ' + tex(pw2.value) + ' \\;\\Rightarrow\\; x = ' + tex(pw2.value) + term(frac(-cv.c)) + ' = ' +
       tex(answer)]))));
  return step('asked', 'Что нужно найти', blocks2);
}

function stepAnswer(meta, cv, A, B, answer) {
  var up = P.growing(cv.base);
  var blocks = [];
  var asym = 'x = ' + tex(frac(-cv.c));
  var domain = 'x > ' + tex(frac(-cv.c));
  if (meta.rule === 'value-at') {
    var x0 = exact(meta.query.x0);
    var right = A.x > B.x ? A : B, left = A.x > B.x ? B : A;
    var where = num(x0) > right.x ? 'правее' : num(x0) < left.x ? 'левее' : 'между';
    blocks.push(text('Проверка по графику: функция ' + (up ? 'возрастает' : 'убывает') + ', асимптота ' + m(asym) +
      ', область определения ' + m(domain) + ' — точка ' + m('x = ' + tex(x0)) + ' в неё входит. Она ' + where +
      ' отмеченных точек, поэтому значение ' +
      (where === 'правее' ? (up ? 'больше ' : 'меньше ') + m(tex(f0(right.y)))
        : where === 'левее' ? (up ? 'меньше ' : 'больше ') + m(tex(f0(left.y))) : 'между их ординатами') +
      ': ' + m(tex(answer)) + ' — похоже на правду.'));
  } else if (meta.rule === 'argument-for') {
    var y0 = num(exact(meta.query.y0));
    blocks.push(text('Проверка по графику: ответ ' + m('x = ' + tex(answer)) + ' входит в область определения ' +
      m(domain) + '. Функция ' + (up ? 'возрастает' : 'убывает') + ', значение ' + m(tex(exact(meta.query.y0))) + ' ' +
      (y0 > Math.max(A.y, B.y) ? 'больше' : 'меньше') + ' ординат отмеченных точек, значит, ' + m('x') + ' лежит ' +
      ((y0 > Math.max(A.y, B.y)) === up ? 'правее' : 'левее') + ' них — сходится.'));
    blocks.push(text('Проверка подстановкой: ' + m('f(' + tex(answer) + ') = ' + tex(exact(meta.query.y0))) + ' — верно.'));
  } else if (meta.rule === 'coef-a') {
    blocks.push(text('Проверка по графику: функция ' + (up ? 'возрастает — основание больше единицы'
      : 'убывает — основание меньше единицы') + ', ' + m('a = ' + tex(answer)) + ' — сходится.'));
  } else {
    blocks.push(text(meta.form === 'shiftX'
      ? 'Проверка по графику: асимптота — прямая ' + m(asym) + ', левее неё графика нет — сходится.'
      : 'Проверка по графику: при ' + m('x = 1') + ' логарифм равен нулю, и ' + m('f(1) = b = ' + tex(answer)) +
        ' — график проходит через ' + m('(1;\\, ' + tex(answer) + ')') + '.'));
  }
  blocks.push(answerBlock(answer));
  return step('answer', 'Проверка по графику и ответ', blocks);
}

function fromTask(task) {
  var meta = task.meta;
  var cv = L.fromMeta(meta).curve;
  var marks = XS.orderedMarks(meta.points);
  var A = marks[0], B = marks[1];
  var answer = exact(meta.answer);
  var steps = [stepPoints(meta, A, B), stepSystem(meta, A, B), stepA(meta, cv, A, B), stepB(meta, cv, A)];
  if (!(meta.rule === 'coef-a' && meta.form === 'basic')) { steps.push(stepAsked(meta, cv, answer)); }
  steps.push(stepAnswer(meta, cv, A, B, answer));
  return steps.filter(Boolean).map(function (item, index) {
    return { number: index + 1, id: item.id, title: item.title, arrow: null, blocks: item.blocks };
  });
}

const api = { fromTask: fromTask, equationTex: equationTex, formTex: formTex };

export default api;
export { fromTask, equationTex, formTex };
