/* graph/solution-rational.js — разбор задачи о гиперболе по шагам.

   Порядок один на всю подтему, сколько бы действий ни требовалось:

     одна гипербола                    гипербола и прямая
     1. Горизонтальная асимптота —     1. Находим k по точке A
        сдвиг вверх-вниз               2. Прямая по двум точкам
     2. Вертикальная асимптота —       3. Приравниваем: k/x = ax + b
        сдвиг влево-вправо             4. Корни уравнения
     3. Находим k (или a) по точке     5. Выбираем корень (не абсцисса A!)
        и записываем формулу           6. Ордината точки B — если спрашивают
     4. Ответ на вопрос                7. Ответ

   Асимптоты, которой сдвиг не нужен (ось координат), своим шагом нет:
   об этом одна фраза в соседнем шаге. Номера и названия шагов те же,
   что у подсказки тренажёра (graph/hints-rational.js): ученик и
   учитель видят одну цепочку.

   Буквы a и b в разных записях значат разное: у k/x + a это сдвиг
   вверх-вниз, у k/(x + a) — влево-вправо, у прямой — наклон и
   свободный член. Поэтому в каждом шаге сказано, к какой функции
   относится коэффициент.

   Модуль отдаёт ту же структуру, что разбор параболы: шаги с id,
   внутри блоки text / formula / answer. Формулы — TeX для KaTeX.
   Числа — точные дроби (families/line.js).
*/

import Line from './families/line.js';
import R from './generate-rational.js';

var frac = Line.frac, add = Line.add, sub = Line.sub, mul = Line.mul, div = Line.div,
    num = Line.num, isInt = Line.isInt, isZero = Line.isZero;

/* ══════════════════════════════════════════════════════════
   Числа в формулу
   ══════════════════════════════════════════════════════════ */
function decimalFriendly(f) {
  var q = Math.abs(f.q);
  while (q % 2 === 0) { q /= 2; }
  while (q % 5 === 0) { q /= 5; }
  return q === 1;
}

function tex(f) {
  if (decimalFriendly(f)) {
    return String(Math.round(num(f) * 1e6) / 1e6).replace('.', '{,}');
  }
  return (f.p < 0 ? '-' : '') + '\\dfrac{' + Math.abs(f.p) + '}{' + f.q + '}';
}

/** Отрицательное — в скобках: 2·(−3), f(−4). */
function tb(f) {
  var body = tex(f);
  if (f.p >= 0) { return body; }
  return decimalFriendly(f) ? '(' + body + ')' : '\\left(' + body + '\\right)';
}

/** Слагаемое со знаком: « + 3», « - 0{,}5». */
function term(f) {
  if (isZero(f)) { return ''; }
  return (f.p > 0 ? ' + ' : ' - ') + tex(frac(Math.abs(f.p), f.q));
}

/** Коэффициент перед буквой: 1 и −1 не пишутся. */
function coef(f) {
  if (isInt(f) && f.p === 1) { return ''; }
  if (isInt(f) && f.p === -1) { return '-'; }
  return tex(f);
}

/** Коэффициент, умноженный на число при подстановке: 1 и −1 не
 *  пишутся. arg — готовая запись числа (tb). */
function times(f, arg) {
  var c = coef(f);
  if (c === '' || c === '-') { return c + arg; }
  return tb(f) + ' \\cdot ' + arg;
}

/** Вычитание произведения k · x: « − 3 · 2». При k = ±1 множитель не
 *  пишется, а знак сразу сводится: « − 2», « + 2». */
function minusTimes(f, x) {
  if (isInt(f) && (f.p === 1 || f.p === -1)) { return term(mul(mul(f, frac(-1)), x)) || ' - 0'; }
  return ' - ' + tb(f) + ' \\cdot ' + tb(x);
}

/** « − 4ac» дискриминанта: при a = ±1 множитель не пишется —
 *  « − 4 · 16», « + 4 · 48». */
function fourAC(a, c) {
  if (isInt(a) && a.p === 1) { return ' - 4 \\cdot ' + tb(c); }
  if (isInt(a) && a.p === -1) { return ' + 4 \\cdot ' + tb(c); }
  return ' - 4 \\cdot ' + tb(a) + ' \\cdot ' + tb(c);
}

/** Слагаемое из суммы чисел: как term, но нуль пишется — в строке
 *  «k + a + b = …» видно, какое из слагаемых нулевое. */
function termZero(f) { return isZero(f) ? ' + 0' : term(f); }

/** Слагаемое с буквой со знаком: « + 2x», « - x». */
function termX(f, letter) {
  if (isZero(f)) { return ''; }
  var abs = frac(Math.abs(f.p), f.q);
  return (f.p > 0 ? ' + ' : ' - ') + (isInt(abs) && abs.p === 1 ? '' : tex(abs)) + letter;
}

function f0(v) { return Line.toFrac(v); }
function exact(o) { return o ? frac(o.p, o.q) : null; }

/* ══════════════════════════════════════════════════════════
   Блоки
   ══════════════════════════════════════════════════════════ */
function text(html) { return { type: 'text', html: html }; }
function formula(tx) { return { type: 'formula', tex: tx }; }
/* Ответ в тексте — типографским минусом, как в разборе параболы;
   text — тот же ответ строкой, по нему проверка сверяет ключ. */
function answerBlock(value) {
  var shown = R.valueText(value);
  return { type: 'answer', html: 'Ответ: <b class="key">' + shown + '</b>', tex: tex(value), text: shown };
}

function escapeAttr(value) {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
function m(tx) { return '<span class="math" data-tex="' + escapeAttr(tx) + '"></span>'; }

function step(id, title, blocks) { return { id: id, title: title, blocks: blocks }; }

/* Формула записи в TeX: буквами и с числами. */
var FORM_TEX = {
  basic: 'f(x) = \\dfrac{k}{x}',
  'shift-y': 'f(x) = \\dfrac{k}{x} + a',
  'shift-x': 'f(x) = \\dfrac{k}{x + a}',
  'shift-xy': 'f(x) = \\dfrac{k}{x + a} + b',
  linear: 'f(x) = \\dfrac{kx + a}{x + b}',
  line: 'f(x) = \\dfrac{k}{x}'
};

function equationTex(c, form) {
  var co = R.coefficients(c, form);
  if (form === 'basic' || form === 'line') { return 'f(x) = \\dfrac{' + tex(co.k) + '}{x}'; }
  if (form === 'shift-y') { return 'f(x) = \\dfrac{' + tex(co.k) + '}{x}' + term(co.a); }
  if (form === 'shift-x') { return 'f(x) = \\dfrac{' + tex(co.k) + '}{x' + term(co.a) + '}'; }
  if (form === 'shift-xy') {
    return 'f(x) = \\dfrac{' + tex(co.k) + '}{x' + term(co.a) + '}' + term(co.b);
  }
  return 'f(x) = \\dfrac{' + coef(co.k) + 'x' + term(co.a) + '}{x' + term(co.b) + '}';
}

function lineTex(line) {
  return 'g(x) = ' + coef(line.k) + 'x' + term(line.b);
}

/* ══════════════════════════════════════════════════════════
   Одна гипербола
   ══════════════════════════════════════════════════════════ */
function shiftWords(v, plus, minus) {
  var n = Math.abs(num(v));
  return (num(v) > 0 ? plus : minus) + ' на ' + R.valueText(frac(Math.abs(v.p), v.q)) +
    (n === 1 ? ' единицу' : (n < 5 && isInt(v) ? ' единицы' : ' единиц'));
}

function stepVertical(c, form) {
  var s = c.s;
  if (form === 'basic' || form === 'shift-y') { return null; }
  if (form === 'linear') {
    var b = mul(frac(-1), s);
    return step('vertical', 'Вертикальная асимптота → $b$', [
      text('Вертикальная пунктирная прямая — асимптота ' + m('x = ' + tex(s)) +
        '. В этой точке знаменатель дроби обращается в ноль: ' + m('x + b = 0') +
        ' при ' + m('x = -b') + '.'),
      formula('-b = ' + tex(s) + ' \\;\\Rightarrow\\; b = ' + tex(b)),
      text('Это коэффициент ' + m('b') + ' в знаменателе функции ' + m('f') +
        '. Проверим знак: при ' + m('x = ' + tex(s)) + ' знаменатель ' +
        m('x' + term(b)) + ' равен нулю.')
    ]);
  }
  var a = mul(frac(-1), s);
  var blocks = [
    text('Вертикальная пунктирная прямая — асимптота ' + m('x = ' + tex(s)) +
      '. Знаменатель ' + m('x + a') + ' равен нулю при ' + m('x = -a') + '.'),
    formula('-a = ' + tex(s) + ' \\;\\Rightarrow\\; a = ' + tex(a)),
    text('Внимание на знак: график сдвинут ' + shiftWords(s, 'вправо', 'влево') +
      ', а в знаменателе стоит ' + m('x' + term(a)) + '. При ' + m('a > 0') +
      ' сдвиг влево, при ' + m('a < 0') + ' — вправо.')
  ];
  if (form === 'shift-x') {
    blocks.push(text('Горизонтальная асимптота — ось ' + m('Ox') + ', ' + m('y = 0') +
      ': вверх-вниз график не сдвинут.'));
  }
  return step('vertical', 'Вертикальная асимптота → сдвиг влево-вправо', blocks);
}

function stepHorizontal(c, form) {
  var t = c.t;
  if (form === 'basic' || form === 'shift-x') { return null; }
  if (form === 'linear') {
    return step('horizontal', 'Целая часть и горизонтальная асимптота → $k$', [
      text('Выделим целую часть:'),
      formula('\\dfrac{kx + a}{x + b} = \\dfrac{k(x + b) + a - kb}{x + b} = k + \\dfrac{a - kb}{x + b}'),
      text('Дробь ' + m('\\dfrac{a - kb}{x + b}') + ' при больших ' + m('|x|') +
        ' стремится к нулю, поэтому горизонтальная асимптота — ' + m('y = k') +
        '. На чертеже она ' + m('y = ' + tex(t)) + ':'),
      formula('k = ' + tex(t))
    ]);
  }
  var name = form === 'shift-y' ? 'a' : 'b';
  return step('horizontal', 'Горизонтальная асимптота → сдвиг вверх-вниз', [
    text('Горизонтальная пунктирная прямая — асимптота ' + m('y = ' + tex(t)) +
      '. Слагаемое ' + m(name) + ' в формуле ' + m(FORM_TEX[form]) +
      ' поднимает или опускает весь график, вместе с асимптотой:'),
    formula(name + ' = ' + tex(t)),
    text('График сдвинут ' + shiftWords(t, 'вверх', 'вниз') + '.' +
      (form === 'shift-y' ? ' Вертикальная асимптота — ось ' + m('Oy') + ', ' + m('x = 0') +
        ': влево-вправо сдвига нет.' : ''))
  ]);
}

function stepK(c, form, points) {
  var P = points[0];
  var x = f0(P.x), y = f0(P.y);
  var co = R.coefficients(c, form);
  var lead = 'Отмеченная точка ' + m('(' + tex(x) + ';\\, ' + tex(y) + ')') +
    ' лежит на графике — подставим её координаты в формулу.';
  if (form === 'basic') {
    return step('k', 'Находим $k$ по точке', [
      text('Асимптоты — оси координат: график не сдвинут ни вверх-вниз, ни влево-вправо. ' +
        lead + ' Для ' + m('y = \\dfrac{k}{x}') + ' это значит ' + m('k = x \\cdot y') + ':'),
      formula('k = ' + tb(x) + ' \\cdot ' + tb(y) + ' = ' + tex(co.k))
    ]);
  }
  if (form === 'shift-y') {
    return step('k', 'Находим $k$ по точке', [
      text(lead),
      formula(tex(y) + ' = \\dfrac{k}{' + tex(x) + '}' + term(co.a) +
        ' \\;\\Rightarrow\\; k = (' + tex(y) + term(mul(frac(-1), co.a)) + ') \\cdot ' + tb(x) +
        ' = ' + tex(co.k))
    ]);
  }
  if (form === 'shift-x') {
    return step('k', 'Находим $k$ по точке', [
      text(lead),
      formula(tex(y) + ' = \\dfrac{k}{' + tex(x) + term(co.a) + '} \\;\\Rightarrow\\; k = ' +
        tb(y) + ' \\cdot (' + tex(x) + term(co.a) + ') = ' + tex(co.k))
    ]);
  }
  if (form === 'shift-xy') {
    return step('k', 'Находим $k$ по точке', [
      text(lead),
      formula(tex(y) + ' = \\dfrac{k}{' + tex(x) + term(co.a) + '}' + term(co.b) +
        ' \\;\\Rightarrow\\; k = (' + tex(y) + term(mul(frac(-1), co.b)) + ') \\cdot (' +
        tex(x) + term(co.a) + ') = ' + tex(co.k))
    ]);
  }
  /* (kx + a)/(x + b): k и b уже известны, a — из точки. */
  var blocks = [
    text(lead + ' Из ' + m('y_0 = \\dfrac{kx_0 + a}{x_0 + b}') + ' получаем ' +
      m('a = y_0(x_0 + b) - k x_0') + ':'),
    formula('a = ' + times(y, '(' + tex(x) + term(co.b) + ')') + minusTimes(co.k, x) +
      ' = ' + tex(co.a))
  ];
  if (points[1]) {
    var Q = points[1];
    var qx = f0(Q.x), qy = f0(Q.y);
    blocks.push(text('Проверим по второй точке ' + m('(' + tex(qx) + ';\\, ' + tex(qy) + ')') + ':'));
    blocks.push(formula('\\dfrac{' + times(co.k, tb(qx)) + term(co.a) + '}{' + tex(qx) +
      term(co.b) + '} = ' + tex(qy) + ' \\;\\checkmark'));
  }
  return step('k', 'Находим $a$ по точке', blocks);
}

/* Формула функции — итог шага с k (у (kx + a)/(x + b) — с a): все
   коэффициенты найдены, и подсказка тренажёра показывает её там же. */
function formulaBlocks(c, form) {
  var blocks = [formula(equationTex(c, form))];
  if (form === 'linear') {
    var co = R.coefficients(c, form);
    blocks.unshift(text('Формула функции: подставляем ' + m('k = ' + tex(co.k)) + ', ' +
      m('a = ' + tex(co.a)) + ', ' + m('b = ' + tex(co.b)) + ':'));
    blocks.push(text('Та же функция с выделенной целой частью: ' +
      m('f(x) = ' + tex(c.t) + ' + \\dfrac{' + tex(c.m) + '}{x' + term(mul(frac(-1), c.s)) + '}') + '.'));
  } else {
    blocks.unshift(text('Все коэффициенты найдены, формула функции:'));
  }
  return blocks;
}

function stepKWithFormula(c, form, points) {
  var item = stepK(c, form, points);
  item.blocks = item.blocks.concat(formulaBlocks(c, form));
  return item;
}

/** Значение функции в точке — в записи условия. */
function valueBlocks(c, form, x0, value) {
  var co = R.coefficients(c, form);
  var blocks = [];
  if (!isInt(x0) && !decimalFriendly(x0)) {
    blocks.push(text('Смешанную дробь удобнее записать неправильной: ' +
      m(R.valueText(x0).replace('⅓', '\\tfrac{1}{3}').replace('⅔', '\\tfrac{2}{3}')
        .replace('−', '-') + ' = ' + tex(x0)) + '.'));
  }
  var arg = tb(x0);
  var expr;
  if (form === 'basic' || form === 'line') {
    expr = '\\dfrac{' + tex(co.k) + '}{' + arg + '}';
  } else if (form === 'shift-y') {
    expr = '\\dfrac{' + tex(co.k) + '}{' + arg + '}' + term(co.a);
  } else if (form === 'shift-x') {
    expr = '\\dfrac{' + tex(co.k) + '}{' + tex(x0) + term(co.a) + '}';
  } else if (form === 'shift-xy') {
    expr = '\\dfrac{' + tex(co.k) + '}{' + tex(x0) + term(co.a) + '}' + term(co.b);
  } else {
    expr = '\\dfrac{' + times(co.k, arg) + term(co.a) + '}{' + tex(x0) + term(co.b) + '}';
  }
  /* Растянутые скобки — только вокруг дроби: у числа \\left( даёт
     лишний зазор, f (−8). */
  var call = decimalFriendly(x0) ? 'f(' + tex(x0) + ')' : 'f\\left(' + tex(x0) + '\\right)';
  blocks.push(formula(call + ' = ' + expr + ' = ' + tex(value)));
  return blocks;
}

function argumentBlocks(c, form, y0, x) {
  var co = R.coefficients(c, form);
  var d = sub(y0, c.t);          /* m/(x − s) = d */
  var shifted = div(c.m, d);     /* x − s */
  var lhs = form === 'basic' ? '\\dfrac{' + tex(co.k) + '}{x}'
    : form === 'shift-y' ? '\\dfrac{' + tex(co.k) + '}{x}' + term(co.a)
    : form === 'shift-x' ? '\\dfrac{' + tex(co.k) + '}{x' + term(co.a) + '}'
    : form === 'shift-xy' ? '\\dfrac{' + tex(co.k) + '}{x' + term(co.a) + '}' + term(co.b)
    : tex(c.t) + ' + \\dfrac{' + tex(c.m) + '}{x' + term(mul(frac(-1), c.s)) + '}';
  var den = isZero(c.s) ? 'x' : 'x' + term(mul(frac(-1), c.s));
  var blocks = [text('Решаем уравнение ' + m('f(x) = ' + tex(y0)) + ':'),
    formula(lhs + ' = ' + tex(y0))];
  if (!isZero(c.t)) {
    blocks.push(formula('\\dfrac{' + tex(c.m) + '}{' + den + '} = ' + tex(y0) + term(mul(frac(-1), c.t)) +
      ' = ' + tex(d)));
  }
  blocks.push(formula(den + ' = \\dfrac{' + tex(c.m) + '}{' + tex(d) + '} = ' + tex(shifted)));
  if (!isZero(c.s)) {
    blocks.push(formula('x = ' + tex(shifted) + term(c.s) + ' = ' + tex(x)));
  }
  return blocks;
}

function stepAnswerSingle(c, form, rule, query, answer) {
  var blocks;
  var co = R.coefficients(c, form);
  if (rule === 'value-at') {
    blocks = valueBlocks(c, form, exact(query.x0), answer);
    blocks.splice(blocks.length - 1, 0, text('Подставляем ' + m('x = ' + tex(exact(query.x0))) + ':'));
  } else if (rule === 'argument-for') {
    blocks = argumentBlocks(c, form, exact(query.y0), answer);
  } else if (rule === 'coef-sum') {
    blocks = [text('Складываем найденные коэффициенты функции ' + m('f') + ':'),
      formula('k + a + b = ' + tex(co.k) + termZero(co.a) + termZero(co.b) + ' = ' + tex(answer))];
  } else {
    var name = rule === 'coef-k' ? 'k' : (rule === 'coef-a' ? 'a' : 'b');
    blocks = [text('Спрашивают коэффициент ' + m(name) + ' функции ' + m('f') + ':'),
      formula(name + ' = ' + tex(co[name]))];
  }
  blocks.push(answerBlock(answer));
  return step('answer', 'Ответ', blocks);
}

/* ══════════════════════════════════════════════════════════
   Гипербола и прямая
   ══════════════════════════════════════════════════════════ */
function lcm(a, b) {
  var x = a, y = b;
  while (y) { var t = x % y; x = y; y = t; }
  return a / x * b;
}

/* a = tg α = |Δy|/|Δx| у возрастающей, a = −tg(180° − α) = −|Δy|/|Δx|
   у убывающей — запись та же, что k в разборе линейной функции. */
function slopeByTriangle(dy, dx, k) {
  var ratio = '\\dfrac{' + tex(frac(Math.abs(dy.p), dy.q)) + '}{' + tex(frac(Math.abs(dx.p), dx.q)) + '}';
  var rising = num(k) > 0;
  var lead = rising ? 'a = \\operatorname{tg} \\alpha = ' : 'a = -\\operatorname{tg}(180^\\circ - \\alpha) = -';
  return lead + ratio + ' = ' + tex(k);
}

function lineSteps(c, task) {
  var meta = task.meta;
  var A = meta.points.filter(function (p) { return p.role === 'cross'; })[0];
  var P = meta.points.filter(function (p) { return p.role === 'line'; })[0];
  var xA = f0(A.x), yA = f0(A.y), xP = f0(P.x), yP = f0(P.y);
  var k = c.m;
  var line = { k: exact(meta.line.k), b: exact(meta.line.b) };
  var xB = exact(meta.intersection.B.x), yB = exact(meta.intersection.B.y);
  var asksY = meta.intersection.axis === 'y';
  var steps = [];

  var lineOnly = meta.rule === 'line-a' || meta.rule === 'line-b';
  if (!lineOnly) steps.push(step('k', 'Гипербола: находим $k$ по точке $A$', [
    text('Точка ' + m('A(' + tex(xA) + ';\\, ' + tex(yA) + ')') + ' лежит на графике ' +
      m('f(x) = \\dfrac{k}{x}') + ', значит ' + m('k = x \\cdot y') + ' (' + m('k') +
      ' — коэффициент гиперболы ' + m('f(x)') + '):'),
    formula('k = ' + tb(xA) + ' \\cdot ' + tb(yA) + ' = ' + tex(k)),
    formula('f(x) = \\dfrac{' + tex(k) + '}{x}')
  ]));

  var dy = sub(yP, yA), dx = sub(xP, xA);
  steps.push(step('line', 'Прямая: коэффициенты $a$ и $b$ функции $g$ по двум точкам', [
    text(m('a') + ' и ' + m('b') + ' — коэффициенты прямой ' + m('g(x)') + '. Прямая ' + m('g(x) = ax + b') + ' проходит через ' + m('A(' + tex(xA) + ';\\, ' + tex(yA) + ')') +
      ' и ' + m('(' + tex(xP) + ';\\, ' + tex(yP) + ')') + '. Угловой коэффициент — через ' +
      'треугольник наклона, как у линейной функции: катеты по клеткам, ' +
      (num(line.k) > 0 ? 'прямая возрастает:' : 'прямая убывает, поэтому со знаком минус:')),
    formula(slopeByTriangle(dy, dx, line.k)),
    text('Свободный член прямой — из точки ' + m('A') + ': ' + m('b = y_A - a\\,x_A') + ':'),
    formula('b = ' + tex(yA) + minusTimes(line.k, xA) + ' = ' + tex(line.b)),
    formula(lineTex(line))
  ]));

  if (lineOnly) {
    var asksA = meta.rule === 'line-a';
    steps.push(step('answer', 'Ответ', [
      text((asksA ? 'Угловой коэффициент ' + m('a') : 'Свободный член ' + m('b')) + ' прямой ' + m('g(x)') + ':'),
      answerBlock(asksA ? line.k : line.b)
    ]));
    return steps;
  }

  /* ax² + bx − k = 0, домноженное до целых коэффициентов. */
  var L = lcm(line.k.q, line.b.q);
  var qa = mul(line.k, frac(L)), qb = mul(line.b, frac(L)), qc = mul(mul(k, frac(-1)), frac(L));
  var quad = coef(qa) + 'x^2' + termX(qb, 'x') + term(qc) + ' = 0';
  var eqBlocks = [
    text('В точках пересечения значения функций равны:'),
    formula('\\dfrac{' + tex(k) + '}{x} = ' + coef(line.k) + 'x' + term(line.b)),
    text('Домножаем на ' + m('x \\ne 0') + ' и переносим всё в одну часть — получаем ' +
      m('ax^2 + bx - k = 0') + ' (здесь ' + m('a') + ' и ' + m('b') + ' — коэффициенты прямой ' +
      m('g(x)') + ', ' + m('k') + ' — коэффициент гиперболы ' + m('f(x)') + '):'),
    formula(coef(line.k) + 'x^2' + termX(line.b, 'x') + term(mul(k, frac(-1))) + ' = 0')
  ];
  if (L !== 1) {
    eqBlocks.push(text('Умножим на ' + m(String(L)) + ', чтобы избавиться от дробей:'));
    eqBlocks.push(formula(quad));
  }
  steps.push(step('equation', 'Приравниваем функции', eqBlocks));

  /* Дискриминант целого уравнения: корни рациональны, корень из D целый. */
  var D = sub(mul(qb, qb), mul(frac(4), mul(qa, qc)));
  var sqrtD = frac(Math.round(Math.sqrt(num(D))));
  steps.push(step('roots', 'Корни уравнения', [
    text('Один корень известен заранее — это абсцисса точки ' + m('A') + ': ' + m('x_A = ' + tex(xA)) +
      '. По теореме Виета произведение корней уравнения ' + m('ax^2 + bx - k = 0') + ' равно ' +
      m('\\dfrac{-k}{a}') + ':'),
    formula(times(xA, 'x_B') + ' = \\dfrac{' + tex(mul(k, frac(-1))) + '}{' + tex(line.k) +
      '} \\;\\Rightarrow\\; x_B = ' + tex(xB)),
    text('Проверка через дискриминант:'),
    formula('D = ' + tb(qb) + '^2' + fourAC(qa, qc) + ' = ' + tex(D) +
      ', \\quad \\sqrt{D} = ' + tex(sqrtD)),
    formula('x_{1,2} = \\dfrac{' + tex(mul(qb, frac(-1))) + ' \\pm ' + tex(sqrtD) + '}{' + tex(mul(qa, frac(2))) +
      '}: \\quad x_1 = ' + tex(xA) + ', \\; x_2 = ' + tex(xB))
  ]));

  steps.push(step('choose', 'Выбираем нужный корень', [
    text('Корень ' + m('x = ' + tex(xA)) + ' — это абсцисса точки ' + m('A') + ', она отмечена на рисунке. ' +
      'Точке ' + m('B') + ' соответствует другой корень:'),
    formula('x_B = ' + tex(xB))
  ]));

  if (asksY) {
    steps.push(step('ordinate', 'Ордината точки $B$', [
      text('Подставляем ' + m('x_B') + ' в формулу гиперболы:'),
      formula('y_B = f(x_B) = \\dfrac{' + tex(k) + '}{' + tb(xB) + '} = ' + tex(yB)),
      text('Проверка по прямой: ' + m('g(' + tex(xB) + ') = ' + times(line.k, tb(xB)) +
        term(line.b) + ' = ' + tex(add(mul(line.k, xB), line.b))) + '.')
    ]));
  }

  steps.push(step('answer', 'Ответ', [
    text(asksY ? 'Ордината точки ' + m('B') + ':' : 'Абсцисса точки ' + m('B') + ':'),
    answerBlock(asksY ? yB : xB)
  ]));
  return steps;
}

/* ══════════════════════════════════════════════════════════
   Сборка
   ══════════════════════════════════════════════════════════ */
function fromTask(task) {
  var meta = task.meta;
  var c = R.curve(exact(meta.m), exact(meta.s), exact(meta.t));
  var steps;
  if (meta.form === 'line') {
    steps = lineSteps(c, task);
  } else {
    var marks = meta.points.filter(function (p) { return p.role === 'mark'; });
    var answer = exact(meta.answer);
    steps = [stepHorizontal(c, meta.form), stepVertical(c, meta.form),
      stepKWithFormula(c, meta.form, marks),
      stepAnswerSingle(c, meta.form, meta.rule, meta.query, answer)]
      .filter(function (item) { return item !== null; });
  }
  return steps.map(function (item, index) {
    return { number: index + 1, id: item.id, title: item.title, arrow: null, blocks: item.blocks };
  });
}

const api = { fromTask: fromTask, equationTex: equationTex, FORM_TEX: FORM_TEX };

export default api;
export { fromTask, equationTex, FORM_TEX };
