/* graph/hints-sqrt.js — подсказка тренажёра к задаче о графике корня.

   Подсказка ведёт ученика лестницей вопросов с кнопками-ответами, а
   не выдаёт коэффициенты. Шаги те же, что в полном решении
   (graph/solution-sqrt.js): тот же номер, то же название.

   Один график корня:
     где начало графика → через какую целую точку проходит график →
     чему равно k → что спрашивают в задаче → ответ и проверка по
     картинке.

   Корень и прямая — та же лестница для корня, потом прямая через
   треугольник (a и b), уравнение, ОДЗ, замена t = √x, корни, отбор
   корня, ордината B, если спрашивают, и ответ с проверкой.

   В каждом вопросе верный вариант ровно один. За неверный — короткое
   пояснение, почему нет, и можно выбрать ещё раз; за верный — вывод.
   После шага показываются формулы полного решения. Формулы — TeX в
   $…$; набирает их тот, кто показывает подсказку (lib/trainer.ts).
   Модуль без DOM и без TypeScript: его читает и автопроверка
   scripts/check-sqrt-hints.mjs. */

import Line from './families/line.js';
import S from './generate-sqrt.js';
import Solution from './solution-sqrt.js';

var frac = Line.frac, add = Line.add, sub = Line.sub, mul = Line.mul, div = Line.div,
    num = Line.num, isInt = Line.isInt, isZero = Line.isZero;

/* ══════════════════════════════════════════════════════════
   Числа
   ══════════════════════════════════════════════════════════ */
function decimalFriendly(f) {
  var q = Math.abs(f.q);
  while (q % 2 === 0) { q /= 2; }
  while (q % 5 === 0) { q /= 5; }
  return q === 1;
}

/* Число для формулы: десятичная запятая, неконечные дроби — дробью. */
function tex(f) {
  if (decimalFriendly(f)) { return String(Math.round(num(f) * 1e6) / 1e6).replace('.', '{,}'); }
  return (f.p < 0 ? '-' : '') + '\\dfrac{' + Math.abs(f.p) + '}{' + f.q + '}';
}

function term(f) {
  if (isZero(f)) { return ''; }
  return (f.p > 0 ? ' + ' : ' - ') + tex(frac(Math.abs(f.p), f.q));
}

function coef(f) {
  if (isInt(f) && f.p === 1) { return ''; }
  if (isInt(f) && f.p === -1) { return '-'; }
  return tex(f);
}

function f0(v) { return Line.toFrac(v); }
function exact(o) { return o ? frac(o.p, o.q) : null; }
function key(f) { return String(Math.round(num(f) * 1e6) / 1e6); }
function point(x, y) { return '$(' + tex(x) + ';\\, ' + tex(y) + ')$'; }
function radicand(x0) { return 'x' + term(frac(-x0)); }
function formulaTex(c) {
  return 'f(x) = ' + coef(c.k) + '\\sqrt{' + radicand(c.x0) + '}' + term(frac(c.y0));
}

/* Варианты кнопками стоят не по порядку: иначе верный всегда был бы
   первым. Перемешивание детерминированное — по номеру задачи. */
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

/* Верный вариант первым, неверные — без повторов и без совпадений
   с верным. Каждый неверный несёт пояснение. */
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

function numOption(f, why) { return { text: '$' + tex(f) + '$', key: 'n=' + key(f), why: why }; }
function pointOption(x, y, why) { return { text: point(x, y), key: 'p=' + key(x) + ';' + key(y), why: why }; }

/* Формулы шага полного решения — их подсказка показывает после
   верного ответа. */
function solutionTex(step) {
  return (step.blocks || []).filter(function (b) { return b.type === 'formula' && b.tex; })
    .map(function (b) { return b.tex; });
}

function base(sol) { return { number: sol.number, title: sol.title, id: sol.id, kind: 'questions' }; }

/* ══════════════════════════════════════════════════════════
   Вопросы о корне
   ══════════════════════════════════════════════════════════ */
function startQuestion(c, form, P, seedKey) {
  var x0 = frac(c.x0), y0 = frac(c.y0);
  var wrongs = [
    pointOption(f0(P.x), f0(P.y), 'Нет: это целая точка на графике, а начало — самая левая точка, ' +
      'откуда кривая выходит.'),
    pointOption(frac(-c.x0), y0, 'Нет: проверь знак абсциссы — посчитай клетки от оси $Oy$ до ' +
      'левого конца графика.'),
    pointOption(x0, frac(-c.y0), 'Нет: проверь знак ординаты — левый конец графика ' +
      (c.y0 > 0 ? 'выше' : 'ниже') + ' оси $Ox$.'),
    pointOption(frac(0), frac(0), 'Нет: график сдвинут, его левый конец не в начале координат.'),
    pointOption(y0, x0, 'Нет: координаты перепутаны местами — сначала $x$, потом $y$.'),
    pointOption(frac(1), frac(0), 'Нет: левый конец графика — начало координат.'),
    pointOption(frac(0), f0(P.y), 'Нет: у начала графика $x = 0$ и $y = 0$.')
  ].filter(function (o) { return o.key !== 'p=' + key(x0) + ';' + key(y0); });
  var said = form === 'shift'
    ? 'Верно: график начинается в точке ' + point(x0, y0) + ', значит $f(x) = k\\sqrt{' + radicand(c.x0) + '}' +
      term(y0) + '$.'
    : 'Верно: график начинается в начале координат, $f(x) = k\\sqrt{x}$.';
  return question('Где начинается график — в какой точке?', pointOption(x0, y0, null), wrongs, said,
    seedKey + ':start');
}

function onCurve(c, x, y) {
  var v = S.valueAt(c, x);
  return v !== null && key(v) === key(y);
}

function pointQuestion(c, P, seedKey) {
  var x = f0(P.x), y = f0(P.y);
  var raw = [
    [x, add(y, frac(1))], [x, sub(y, frac(1))], [add(x, frac(1)), y], [sub(x, frac(1)), y],
    [frac(c.x0 + P.n), y]
  ];
  var wrongs = raw.filter(function (p) { return !onCurve(c, p[0], p[1]); }).map(function (p) {
    return pointOption(p[0], p[1], 'Нет: в этой точке узел сетки, но график через неё не проходит. ' +
      'Ищи узел прямо на кривой — он отмечен жирной точкой.');
  });
  return question('Через какую целую точку проходит график? Нужна точка в узле сетки — от начала ' +
    'графика она сдвинута вправо на $1$, $4$ или $9$ клеток.', pointOption(x, y, null), wrongs,
    'Верно: ' + point(x, y) + ' — сдвиг вправо на $' + (P.x - c.x0) + ' = ' + P.n + '^2$, поэтому ' +
    '$\\sqrt{' + (P.x - c.x0) + '} = ' + P.n + '$.', seedKey + ':point');
}

function kQuestion(c, P, seedKey) {
  var dy = sub(f0(P.y), frac(c.y0));
  var dx = frac(P.x - c.x0);
  var wrongs = [
    numOption(div(dy, dx), 'Нет: так считают наклон прямой. У корня при сдвиге вправо на $n^2$ ' +
      'график поднимается на $k \\cdot n$, поэтому делим на $\\sqrt{' + (P.x - c.x0) + '} = ' + P.n + '$.'),
    numOption(dy, 'Нет: это подъём от начала графика, его ещё надо разделить на $\\sqrt{' + (P.x - c.x0) +
      '} = ' + P.n + '$.'),
    numOption(mul(frac(-1), c.k), 'Нет: проверь знак — график идёт ' + (num(c.k) > 0 ? 'вверх' : 'вниз') +
      ', значит $k ' + (num(c.k) > 0 ? '> 0' : '< 0') + '$.'),
    numOption(mul(c.k, frac(2)), 'Нет: подставь точку в формулу и вырази $k$ ещё раз.'),
    numOption(div(c.k, frac(2)), 'Нет: подставь точку в формулу и вырази $k$ ещё раз.')
  ];
  return question('Подставь точку в формулу. Чему равно $k$?', numOption(c.k, null), wrongs,
    'Верно: $' + tex(dy) + ' = ' + (P.n === 1 ? '' : P.n) + 'k$, $k = ' + tex(c.k) + '$, формула $' +
    formulaTex(c) + '$.', seedKey + ':k');
}

var ASKED_TEXT = {
  'value-at': 'значение функции при данном $x$',
  'argument-for': '$x$, при котором функция принимает данное значение',
  'coef-k': 'коэффициент $k$',
  'cross-x': 'абсциссу второй точки пересечения $B$',
  'cross-y': 'ординату второй точки пересечения $B$',
  'line-a': 'угловой коэффициент прямой $a$',
  'line-b': 'свободный член прямой $b$'
};

function askedQuestion(rule, rules, seedKey) {
  var wrongs = rules.filter(function (r) { return r !== rule; }).map(function (r) {
    return { text: ASKED_TEXT[r], key: 'ask=' + r, why: 'Нет: перечитай последнее предложение условия.' };
  });
  return question('Что спрашивают в задаче?', { text: ASKED_TEXT[rule], key: 'ask=' + rule }, wrongs,
    'Верно: нужно найти ' + ASKED_TEXT[rule] + '.', seedKey + ':asked');
}

/* ══════════════════════════════════════════════════════════
   Один график корня
   ══════════════════════════════════════════════════════════ */
function answerQuestion(c, meta, sanity, seedKey) {
  var answer = exact(meta.answer);
  var q = meta.query;
  var wrongs = [];
  var prompt;
  if (meta.rule === 'coef-k') {
    prompt = 'Какой ответ записать в бланк?';
    wrongs = [numOption(mul(frac(-1), answer), 'Нет: знак $k$ — по направлению графика.'),
      numOption(add(answer, frac(1)), 'Нет: в ответ идёт найденное $k$.')];
  } else if (meta.rule === 'value-at') {
    var x = exact(q.x0), s = exact(q.root);
    prompt = 'Подставь $x = ' + tex(x) + '$ в формулу $' + formulaTex(c) + '$. Чему равно значение функции?';
    wrongs = [
      numOption(add(mul(c.k, sub(x, frac(c.x0))), frac(c.y0)), 'Нет: корень забыт — под корнем $' +
        tex(sub(x, frac(c.x0))) + '$, а $\\sqrt{' + tex(sub(x, frac(c.x0))) + '} = ' + tex(s) + '$.'),
      numOption(mul(c.k, s), c.y0 === 0 ? 'Нет: проверь умножение на $k$.'
        : 'Нет: не прибавлено $y_0 = ' + tex(frac(c.y0)) + '$.'),
      numOption(mul(frac(-1), answer), 'Нет: проверь знак — на рисунке около этого $x$ график ' +
        (num(answer) > 0 ? 'выше' : 'ниже') + ' оси $Ox$.'),
      numOption(add(answer, frac(1)), 'Нет: пересчитай $k \\cdot \\sqrt{x - x_0}$.')
    ];
  } else {
    var y = exact(q.y0), r = exact(q.root);
    prompt = 'Реши уравнение $' + formulaTex(c).replace('f(x) = ', '') + ' = ' + tex(y) +
      '$: перенеси $y_0$, раздели на $k$ и возведи в квадрат. Чему равен $x$?';
    wrongs = [
      numOption(add(r, frac(c.x0)), 'Нет: $\\sqrt{' + radicand(c.x0) + '} = ' + tex(r) + '$ — ещё нужно ' +
        'возвести в квадрат.'),
      numOption(mul(r, r), c.x0 === 0 ? 'Нет: проверь, что $y_0$ перенесён до деления на $k$.'
        : 'Нет: это $x - x_0$, осталось прибавить $x_0 = ' + tex(frac(c.x0)) + '$.'),
      numOption(add(mul(div(y, c.k), div(y, c.k)), frac(c.x0)), 'Нет: сначала перенеси $y_0 = ' +
        tex(frac(c.y0)) + '$, потом дели на $k$.'),
      numOption(add(answer, frac(1)), 'Нет: возведи в квадрат ещё раз.')
    ];
  }
  return question(prompt, numOption(answer, null), wrongs,
    'Верно: ответ $' + tex(answer) + '$. ' + sanity, seedKey + ':answer');
}

function singleHints(task, solution) {
  var meta = task.meta;
  var c = S.curve(exact(meta.k), meta.x0, meta.y0);
  var P = Solution.mainMark(meta.points);
  var seedKey = task.id + ':' + meta.seed;
  var steps = [];
  var rules = ['value-at', 'argument-for', 'coef-k'];

  solution.forEach(function (sol) {
    if (sol.id === 'start') {
      steps.push(Object.assign(base(sol), { questions: [startQuestion(c, meta.form, P, seedKey)],
        after: solutionTex(sol) }));
    } else if (sol.id === 'point') {
      steps.push(Object.assign(base(sol), { questions: [pointQuestion(c, P, seedKey)], after: solutionTex(sol) }));
    } else if (sol.id === 'k') {
      steps.push(Object.assign(base(sol), { questions: [kQuestion(c, P, seedKey)], after: solutionTex(sol) }));
    } else if (sol.id === 'asked') {
      steps.push(Object.assign(base(sol), { questions: [askedQuestion(meta.rule, rules, seedKey)], after: [] }));
    } else if (sol.id === 'answer') {
      var sanity = (sol.blocks.filter(function (b) { return b.type === 'text'; })[0] || {}).html || '';
      steps.push(Object.assign(base(sol), {
        questions: [answerQuestion(c, meta, htmlToHint(sanity), seedKey)],
        after: solutionTex(solution.filter(function (s) { return s.id === 'asked'; })[0] || { blocks: [] })
      }));
    }
  });
  return steps;
}

/* Текст разбора хранит формулы заглушками KaTeX; подсказке они нужны
   в долларах, как всё остальное. */
function htmlToHint(html) {
  return String(html).replace(/<span class="math" data-tex="([^"]*)"><\/span>/g, function (m, t) {
    return '$' + t.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&amp;/g, '&') + '$';
  });
}

/* ══════════════════════════════════════════════════════════
   Корень и прямая
   ══════════════════════════════════════════════════════════ */
function lineQuestions(meta, seedKey) {
  var A = meta.points.filter(function (p) { return p.role === 'cross'; })[0];
  var P = meta.points.filter(function (p) { return p.role === 'line'; })[0];
  var a = exact(meta.line.k), b = exact(meta.line.b);
  var dx = Math.abs(P.x - A.x), dy = Math.abs(P.y - A.y);
  var ratio = frac(dy, dx);
  var qs = [];
  qs.push(question('Построй треугольник под прямой между точками ' + point(f0(A.x), f0(A.y)) + ' и ' +
    point(f0(P.x), f0(P.y)) + '. Какие у него катеты?',
    { text: 'по горизонтали $' + dx + '$, по вертикали $' + dy + '$', key: 'legs=' + dx + ';' + dy },
    [{ text: 'по горизонтали $' + dy + '$, по вертикали $' + dx + '$', key: 'legs=' + dy + ';' + dx,
       why: 'Нет: катеты перепутаны — посчитай клетки вправо и вверх отдельно.' },
     { text: 'по горизонтали $' + (dx + 1) + '$, по вертикали $' + dy + '$', key: 'legs=' + (dx + 1) + ';' + dy,
       why: 'Нет: считай клетки между точками, а не линии сетки.' }],
    'Верно: катеты $' + dx + '$ и $' + dy + '$ — длины, без знаков.', seedKey + ':legs'));
  var rising = num(a) > 0;
  qs.push(question('Чему равен угловой коэффициент $a$ прямой?', numOption(a, null),
    [numOption(mul(frac(-1), a), rising ? 'Нет: прямая возрастает — $a > 0$.'
      : 'Нет: прямая убывает, угол $\\alpha$ тупой — $a = -\\operatorname{tg}(180^\\circ - \\alpha)$, со знаком минус.'),
     numOption(rising ? frac(dx, dy) : frac(-dx, dy), 'Нет: тангенс — противолежащий катет к прилежащему: ' +
       'вертикальный делить на горизонтальный.')],
    'Верно: ' + (rising ? '$a = \\operatorname{tg} \\alpha = \\dfrac{' + dy + '}{' + dx + '} = ' + tex(a) + '$.'
      : '$a = -\\operatorname{tg}(180^\\circ - \\alpha) = -\\dfrac{' + dy + '}{' + dx + '} = ' + tex(a) + '$.'),
    seedKey + ':a'));
  var readB = isInt(b) && Math.abs(num(b)) <= meta.window.ymax - 1;
  qs.push(question(readB ? 'Прямая пересекает ось $Oy$ в узле сетки. Чему равно $b$?'
    : 'Прямая пересекает ось $Oy$ не в узле — подставь точку $A$ в $y = ' + coef(a) + 'x + b$. Чему равно $b$?',
    numOption(b, null),
    [numOption(mul(frac(-1), b), 'Нет: проверь знак — прямая пересекает $Oy$ ' +
      (num(b) > 0 ? 'выше' : 'ниже') + ' нуля.'),
     numOption(add(b, ratio), 'Нет: подставь координаты точки ещё раз.'),
     numOption(f0(A.y), 'Нет: это ордината точки $A$, а $b$ — ордината точки на оси $Oy$.')],
    'Верно: $b = ' + tex(b) + '$, прямая $g(x) = ' + coef(a) + 'x' + term(b) + '$.', seedKey + ':b'));
  return qs;
}

function lineHints(task, solution) {
  var meta = task.meta;
  var c = S.curve(exact(meta.k), 0, 0);
  var A = meta.points.filter(function (p) { return p.role === 'cross'; })[0];
  var a = exact(meta.line.k), b = exact(meta.line.b);
  var seedKey = task.id + ':' + meta.seed;
  var cross = meta.intersection;
  var tA = frac(A.n), tB = exact(cross.B.t), xB = exact(cross.B.x), yB = exact(cross.B.y);
  var lineOnly = meta.rule === 'line-a' || meta.rule === 'line-b';
  var rules = lineOnly ? ['line-a', 'line-b', 'cross-x'] : ['cross-x', 'cross-y', 'line-a'];
  var steps = [];

  solution.forEach(function (sol) {
    var step = Object.assign(base(sol), { after: solutionTex(sol) });
    if (sol.id === 'k') {
      step.questions = [startQuestion(c, 'basic', A, seedKey), pointQuestion(c, A, seedKey),
        kQuestion(c, A, seedKey)];
    } else if (sol.id === 'line') {
      step.questions = lineQuestions(meta, seedKey);
      step.chart = 'triangle';
    } else if (sol.id === 'equation') {
      step.questions = [question('Какое уравнение задаёт точки пересечения графиков?',
        { text: '$' + coef(c.k) + '\\sqrt{x} = ' + coef(a) + 'x' + term(b) + '$', key: 'eq' },
        [{ text: '$' + coef(c.k) + 'x = ' + coef(a) + 'x' + term(b) + '$', key: 'eq-x',
           why: 'Нет: у корня $f(x) = k\\sqrt{x}$, а не $kx$.' },
         { text: '$' + coef(c.k) + '\\sqrt{x} = 0$', key: 'eq-0',
           why: 'Нет: в точке пересечения равны значения двух функций — корня и прямой.' }],
        'Верно: в точке пересечения у графиков одинаковые $x$ и $y$.', seedKey + ':eq')];
    } else if (sol.id === 'odz') {
      step.questions = [question('Какие $x$ допустимы?', { text: '$x \\ge 0$', key: 'x>=0' },
        [{ text: '$x > 0$', key: 'x>0', why: 'Нет: корень из нуля существует, $\\sqrt{0} = 0$.' },
         { text: 'любые $x$', key: 'any', why: 'Нет: под корнем не может стоять отрицательное число.' },
         { text: '$x \\ne 0$', key: 'x!=0', why: 'Нет: это ОДЗ дроби, а здесь корень.' }],
        'Верно: ОДЗ — $x \\ge 0$.', seedKey + ':odz')];
    } else if (sol.id === 'substitution') {
      var right = '$' + coef(a) + 't^2' + (num(c.k) > 0 ? ' - ' : ' + ') + (Math.abs(num(c.k)) === 1 ? '' : tex(frac(Math.abs(c.k.p), c.k.q))) + 't' + term(b) + ' = 0$';
      var wrongSign = '$' + coef(a) + 't^2' + (num(c.k) > 0 ? ' + ' : ' - ') + (Math.abs(num(c.k)) === 1 ? '' : tex(frac(Math.abs(c.k.p), c.k.q))) + 't' + term(b) + ' = 0$';
      step.questions = [question('Сделай замену $t = \\sqrt{x}$, $t \\ge 0$, тогда $x = t^2$. Какое уравнение получится?',
        { text: right, key: 'sub' },
        [{ text: wrongSign, key: 'sub-sign', why: 'Нет: при переносе $k\\sqrt{x} = kt$ в правую часть знак меняется.' },
         { text: '$' + coef(a) + 't' + (num(c.k) > 0 ? ' - ' : ' + ') + (Math.abs(num(c.k)) === 1 ? '' : tex(frac(Math.abs(c.k.p), c.k.q))) + 't^2' + term(b) + ' = 0$',
           key: 'sub-swap', why: 'Нет: $x = t^2$, поэтому квадрат стоит при $a$, а не при $k$.' }],
        'Верно: квадратное уравнение относительно $t$.', seedKey + ':sub')];
    } else if (sol.id === 'roots') {
      step.questions = [question('Один корень известен — у точки $A$: $t_A = \\sqrt{' + A.x + '} = ' + A.n +
        '$. Какой второй корень? (По Виету $t_A + t_B = \\dfrac{k}{a}$.)', numOption(tB, null),
        [numOption(mul(frac(-1), tB), 'Нет: $t_B = \\dfrac{k}{a} - t_A$, проверь знаки.'),
         numOption(add(tB, mul(tA, frac(2))), 'Нет: из суммы корней нужно вычесть $t_A$, а не прибавить.'),
         numOption(div(c.k, a), 'Нет: это сумма корней $t_A + t_B$, осталось вычесть $t_A$.')],
        'Верно: $t_B = ' + tex(tB) + '$.', seedKey + ':roots')];
    } else if (sol.id === 'choose') {
      step.questions = [question('Корень $t_B = ' + tex(tB) + '$ подходит ($t \\ge 0$). Чему равна абсцисса точки $B$?',
        numOption(xB, null),
        [numOption(tB, 'Нет: $t = \\sqrt{x}$, поэтому $x = t^2$.'),
         numOption(f0(A.x), 'Нет: это абсцисса точки $A$ — она отмечена на рисунке.'),
         numOption(mul(xB, frac(2)), 'Нет: $x_B = t_B^2$, а не $2t_B$.')],
        'Верно: $x_B = t_B^2 = ' + tex(xB) + '$.', seedKey + ':choose')];
    } else if (sol.id === 'ordinate') {
      step.questions = [question('Подставь $x_B$ в формулу попроще — в корень: $\\sqrt{x_B} = t_B$ уже известен. ' +
        'Чему равна ордината $B$?', numOption(yB, null),
        [numOption(mul(frac(-1), yB), 'Нет: проверь знак $k$.'),
         numOption(mul(c.k, xB), 'Нет: под корнем $x_B$, а $\\sqrt{x_B} = ' + tex(tB) + '$.'),
         numOption(f0(A.y), 'Нет: это ордината точки $A$.')],
        'Верно: $y_B = ' + tex(yB) + '$.', seedKey + ':y')];
    } else if (sol.id === 'answer') {
      var answer = exact(meta.answer);
      var sanity = htmlToHint((sol.blocks.filter(function (bl) { return bl.type === 'text'; })[0] || {}).html || '');
      step.after = [];
      step.questions = [askedQuestion(meta.rule, rules, seedKey),
        question('Какой ответ записать в бланк?', numOption(answer, null),
          lineOnly ? [numOption(mul(frac(-1), answer), 'Нет: проверь знак по рисунку.'),
            numOption(meta.rule === 'line-a' ? b : a, 'Нет: спрашивают другой коэффициент прямой.')]
            : [numOption(meta.rule === 'cross-x' ? yB : xB, 'Нет: спрашивают другую координату точки $B$.'),
              numOption(meta.rule === 'cross-x' ? f0(A.x) : f0(A.y), 'Нет: это координата точки $A$.'),
              numOption(meta.rule === 'cross-x' ? tB : mul(frac(-1), yB), 'Нет: перечитай вопрос и проверь вычисление.')],
          'Верно: ответ $' + tex(answer) + '$. ' + sanity, seedKey + ':final')];
    } else {
      return;
    }
    steps.push(step);
  });
  return steps;
}

/**
 * Шаги подсказки к задаче о корне из движка (meta.family === 'sqrt').
 * Каждый шаг: { number, title, id, kind: 'questions', questions, after,
 * chart? } — номер и название из полного решения.
 */
function fromTask(task) {
  var solution = Solution.fromTask(task);
  return task.meta.form === 'line' ? lineHints(task, solution) : singleHints(task, solution);
}

const api = { fromTask: fromTask };

export default api;
export { fromTask };
