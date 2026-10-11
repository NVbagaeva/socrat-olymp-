/* graph/solution-trigonometric.js — разбор задачи о тригонометрической
   функции f(x) = a cos x + b, a sin x + b или a tg x + b.

   Метод один на всю подтему, и он обязателен:
     • параметры НИКОГДА не угадываются по рисунку — ни амплитуда, ни
       «средняя линия». Берём две отмеченные точки в узлах сетки;
     • сначала читаем координаты: клетка по оси x — π/4 (до π четыре
       клетки), по оси y — сколько клеток в единице;
     • в отмеченных точках значение функции известно: −1, 0 или 1 —
       подставляем и получаем систему;
     • точка, где функция равна нулю, даёт b сразу; точки со значениями
       1 и −1 — система: сложением уходит a, вычитанием уходит b;
     • после каждого найденного параметра заново выписываем формулу;
     • в конце — проверка по графику.

   Шаги (те же у подсказки, graph/hints-trigonometric.js):
     1. Берём отмеченные точки
     2. Значения функции и система
     3. Находим b
     4. Находим a
     5. Проверка по графику и ответ */

import Line from './families/line.js';
import P from './base-power.js';
import T from './generate-trigonometric.js';
import XS from './solution-exponential.js';

var frac = Line.frac, add = Line.add, sub = Line.sub, mul = Line.mul, div = Line.div;

var tex = P.tex;
var chain = XS.chain;

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
function tb(f) { return f.p < 0 ? '(' + tex(f) + ')' : tex(f); }
function term(f) {
  if (f.p === 0) { return ''; }
  return (f.p > 0 ? ' + ' : ' - ') + tex(frac(Math.abs(f.p), f.q));
}

var FN_TEX = { cos: '\\cos', sin: '\\sin', tg: '\\operatorname{tg}' };

/** Абсцисса X клеток → x = X · π/4 в TeX: 0, \dfrac{\pi}{4}, -\pi, \dfrac{3\pi}{2}. */
function xTex(X) {
  if (X === 0) { return '0'; }
  var f = frac(X, 4);
  var sign = f.p < 0 ? '-' : '';
  var p = Math.abs(f.p);
  var top = p === 1 ? '\\pi' : p + '\\pi';
  return sign + (f.q === 1 ? top : '\\dfrac{' + top + '}{' + f.q + '}');
}

/** Аргумент функции: \cos 0, \cos\left(-\dfrac{\pi}{2}\right), \sin \pi. */
function fnAt(fn, X) {
  var x = xTex(X);
  return FN_TEX[fn] + (X < 0 ? '\\left(' + x + '\\right)' : ' ' + x);
}

function formTex(fn) { return 'f(x) = a' + FN_TEX[fn] + ' x + b'; }

function equationTex(cv, known) {
  var lead = known.a ? coefTex(cv.a) : 'a';
  return 'f(x) = ' + lead + FN_TEX[cv.fn] + ' x' + (known.b ? term(cv.b) : ' + b');
}

/** Коэффициент перед функцией: 2, −1,5, «−» вместо −1, пусто вместо 1. */
function coefTex(a) {
  if (a.p === a.q) { return ''; }
  if (a.p === -a.q) { return '-'; }
  return tex(a) + ' ';
}

function pointTex(name, pt) { return name + '\\left(' + xTex(pt.X) + ';\\, ' + tex(pt.y) + '\\right)'; }

/** Значение a · v + b в виде слагаемых: a + b, −a + b, b. */
function lhs(v) {
  if (v === 0) { return 'b'; }
  return (v === 1 ? 'a' : '-a') + ' + b';
}

function ordered(points, cv) {
  var pts = points.map(function (p) {
    return { X: p.X, Y: p.Y, v: p.v, y: mul(frac(p.Y), cv.yu) };
  });
  /* Первой — точка со значением 0, затем со значением 1. */
  pts.sort(function (p, q) {
    var rank = function (pt) { return pt.v === 0 ? 0 : pt.v === 1 ? 1 : 2; };
    return rank(p) - rank(q);
  });
  return pts;
}

/* ══════════════════════════════════════════════════════════
   Шаги
   ══════════════════════════════════════════════════════════ */
function stepPoints(meta, cv, A, B) {
  var yu = cv.yu;
  var cells = Line.num(div(frac(1), yu));
  return step('points', 'Берём отмеченные точки', [
    text('Параметры по рисунку на глаз не угадываем — ни размах волны, ни её середину: ошибиться на полклетки ' +
      'легко. Работаем только с точками, которые отмечены на графике и стоят ровно в узлах сетки.'),
    text('Сначала разбираемся с клетками. По оси ' + m('x') + ' от нуля до ' + m('\\pi') + ' четыре клетки, значит, ' +
      'одна клетка — ' + m('\\dfrac{\\pi}{4}') + '. По оси ' + m('y') + ' ' + (cells === 1
        ? 'единица — одна клетка.'
        : 'единица — ' + (cells === 2 ? 'две' : cells) + ' клетки, значит, одна клетка — ' + m(tex(yu)) + '.')),
    text('Отмечены точки ' + m(pointTex('A', A)) + ' и ' + m(pointTex('B', B)) + '. Обе лежат на графике, значит, их ' +
      'координаты обращают формулу ' + m(formTex(cv.fn)) + ' в верное равенство.')
  ]);
}

function stepSystem(meta, cv, A, B) {
  var fn = cv.fn;
  var values = [A, B].map(function (pt) { return fnAt(fn, pt.X) + ' = ' + pt.v; }).join(', \\quad ');
  return step('system', 'Значения функции и система', [
    text('В отмеченных точках значение ' + m(FN_TEX[fn]) + ' известно точно:'),
    formula(values),
    text('Подставляем координаты точек в формулу: вместо ' + m('x') + ' — абсциссу, вместо ' + m('f(x)') +
      ' — ординату. Получаем систему:'),
    formula('\\begin{cases} a \\cdot ' + tb(frac(A.v)) + ' + b = ' + tex(A.y) + ' \\\\ a \\cdot ' + tb(frac(B.v)) +
      ' + b = ' + tex(B.y) + ' \\end{cases} \\iff \\begin{cases} ' + lhs(A.v) + ' = ' + tex(A.y) + ' \\\\ ' + lhs(B.v) +
      ' = ' + tex(B.y) + ' \\end{cases}')
  ]);
}

function stepB(meta, cv, A, B) {
  var blocks = [];
  if (A.v === 0) {
    blocks.push(text('В первом уравнении ' + m('a') + ' умножается на ноль и пропадает — ' + m('b') + ' находится сразу:'));
    blocks.push(formula('b = ' + tex(A.y)));
  } else {
    blocks.push(text('Значения ' + m('1') + ' и ' + m('-1') + ' — противоположные. Сложим уравнения: ' + m('a') +
      ' и ' + m('-a') + ' сократятся.'));
    blocks.push(formula(chain(['(a + b) + (-a + b) = ' + tex(A.y) + term(B.y) + ' = ' + tex(add(A.y, B.y)),
      '2b = ' + tex(add(A.y, B.y)) + ' \\;\\Rightarrow\\; b = ' + tex(cv.b)])));
  }
  blocks.push(text('Мы нашли ' + m('b') + '. Записываем, как теперь выглядит формула:'));
  blocks.push(formula('f(x) = a' + FN_TEX[cv.fn] + ' x' + term(cv.b)));
  return step('b', 'Находим $b$', blocks);
}

function stepA(meta, cv, A, B) {
  var blocks = [];
  var other = B;
  if (A.v === 0) {
    blocks.push(text('Подставляем ' + m('b = ' + tex(cv.b)) + ' во второе уравнение:'));
    var rhs = sub(other.y, cv.b);
    blocks.push(formula(chain([(other.v === 1 ? 'a' : '-a') + term(cv.b) + ' = ' + tex(other.y),
      (other.v === 1 ? 'a' : '-a') + ' = ' + tex(other.y) + term(mul(cv.b, frac(-1))) + ' = ' + tex(rhs) +
        (other.v === 1 ? '' : ' \\;\\Rightarrow\\; a = ' + tex(cv.a))])));
  } else {
    blocks.push(text('Теперь вычтем из первого уравнения второе — ' + m('b') + ' сократится:'));
    blocks.push(formula(chain(['(a + b) - (-a + b) = ' + tex(A.y) + ' - ' + tb(B.y) + ' = ' + tex(sub(A.y, B.y)),
      '2a = ' + tex(sub(A.y, B.y)) + ' \\;\\Rightarrow\\; a = ' + tex(cv.a)])));
  }
  blocks.push(text('Мы нашли ' + m('a') + '. Формула теперь полностью известна:'));
  blocks.push(formula(equationTex(cv, { a: true, b: true })));
  return step('a', 'Находим $a$', blocks);
}

function stepAnswer(meta, cv) {
  var a = cv.a, b = cv.b;
  var blocks = [];
  if (cv.fn === 'tg') {
    blocks.push(text('Проверка по графику: при ' + m('x = 0') + ' тангенс равен нулю, значит, график пересекает ось ' +
      m('Oy') + ' в точке ' + m('(0;\\, ' + tex(b) + ')') + '. ' + (a.p > 0
        ? 'Коэффициент ' + m('a') + ' положителен — на каждой ветви функция возрастает, как и на рисунке.'
        : 'Коэффициент ' + m('a') + ' отрицателен — на каждой ветви функция убывает, как и на рисунке.')));
  } else {
    var top = add(b, frac(Math.abs(a.p), a.q));
    var bottom = sub(b, frac(Math.abs(a.p), a.q));
    var peak = cv.fn === 'cos' ? (a.p > 0 ? '0' : '\\pi') : (a.p > 0 ? '\\dfrac{\\pi}{2}' : '-\\dfrac{\\pi}{2}');
    blocks.push(text('Проверка по графику: наибольшее значение ' + m('b + |a| = ' + tex(top)) + ', наименьшее — ' +
      m('b - |a| = ' + tex(bottom)) + '. Наибольшее достигается при ' + m('x = ' + peak) +
      (a.p > 0 ? ', потому что ' + m('a > 0') : ', потому что ' + m('a < 0') + ' — волна перевёрнута') +
      '. Сверяем с рисунком — сходится.'));
  }
  blocks.push(answerBlock(meta.rule === 'coef-a' ? a : b));
  return step('answer', 'Проверка по графику и ответ', blocks);
}

function fromTask(task) {
  var meta = task.meta;
  var cv = T.fromMeta(meta).curve;
  var pts = ordered(meta.points, cv);
  var A = pts[0], B = pts[1];
  var steps = [stepPoints(meta, cv, A, B), stepSystem(meta, cv, A, B), stepB(meta, cv, A, B), stepA(meta, cv, A, B),
    stepAnswer(meta, cv)];
  return steps.map(function (item, index) {
    return { number: index + 1, id: item.id, title: item.title, arrow: null, blocks: item.blocks };
  });
}

const api = { fromTask: fromTask, equationTex: equationTex, formTex: formTex, xTex: xTex, fnAt: fnAt, ordered: ordered,
              FN_TEX: FN_TEX };

export default api;
export { fromTask, equationTex, formTex, xTex, fnAt, ordered, FN_TEX };
