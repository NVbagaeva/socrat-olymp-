/* graph/solution-sqrt.js — разбор задачи о графике корня по шагам.

   Порядок один на всю подтему:

     один график корня                   корень и прямая
     1. Начало графика                   1. Корень: k по точке A
     2. Целая точка графика              2. Прямая: a и b по двум точкам
     3. Находим k                        3. Приравниваем функции
     4. Что спрашивают — вычисление      4. ОДЗ
     5. Ответ и проверка по картинке     5. Замена t = √x
                                         6. Корни уравнения
                                         7. Отбор корней
                                         8. Ордината B — если спрашивают
                                         9. Ответ и проверка по картинке

   Номера и названия шагов те же, что у подсказки тренажёра
   (graph/hints-sqrt.js): ученик и учитель видят одну цепочку.

   Модуль отдаёт ту же структуру, что разбор гиперболы: шаги с id,
   внутри блоки text / formula / answer. Формулы — TeX для KaTeX.
   Числа — точные дроби (families/line.js).
*/

import Line from './families/line.js';
import hidden from './hidden.js';
import S from './generate-sqrt.js';

var frac = Line.frac, add = Line.add, sub = Line.sub, mul = Line.mul,
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

/** Отрицательное — в скобках: 2·(−3). */
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

/** Слагаемое с буквой со знаком: « + 2t», « - t». */
function termX(f, letter) {
  if (isZero(f)) { return ''; }
  var abs = frac(Math.abs(f.p), f.q);
  return (f.p > 0 ? ' + ' : ' - ') + (isInt(abs) && abs.p === 1 ? '' : tex(abs)) + letter;
}

/** « − 4ac» дискриминанта: при a = ±1 множитель не пишется —
 *  « − 4 · 16», « + 4 · 48». */
function fourAC(a, c) {
  if (isInt(a) && a.p === 1) { return ' - 4 \\cdot ' + tb(c); }
  if (isInt(a) && a.p === -1) { return ' + 4 \\cdot ' + tb(c); }
  return ' - 4 \\cdot ' + tb(a) + ' \\cdot ' + tb(c);
}

function f0(v) { return Line.toFrac(v); }
function exact(o) { return o ? frac(o.p, o.q) : null; }

/* ══════════════════════════════════════════════════════════
   Блоки
   ══════════════════════════════════════════════════════════ */
function text(html) { return { type: 'text', html: html }; }
function formula(tx) { return { type: 'formula', tex: tx }; }
function answerBlock(value) {
  var shown = S.valueText(value);
  return { type: 'answer', html: 'Ответ: <b class="key">' + shown + '</b>', tex: tex(value), text: shown };
}
function escapeAttr(value) {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
function m(tx) { return '<span class="math" data-tex="' + escapeAttr(tx) + '"></span>'; }
function step(id, title, blocks) { return { id: id, title: title, blocks: blocks }; }

/* ══════════════════════════════════════════════════════════
   Записи формулы
   ══════════════════════════════════════════════════════════ */
/** Подкоренное выражение: x, x − 3, x + 2. */
function radicand(x0) { return 'x' + term(frac(-x0)); }

/** Формула с буквой k и найденным началом: y = k√(x − 3) + 1. */
function letterTex(c, name) {
  return (name || 'f(x)') + ' = k\\sqrt{' + radicand(c.x0) + '}' + term(frac(c.y0));
}

/** Формула с числами: f(x) = 1{,}5\sqrt{x - 3} + 1. */
function equationTex(c, name) {
  return (name || 'f(x)') + ' = ' + coef(c.k) + '\\sqrt{' + radicand(c.x0) + '}' + term(frac(c.y0));
}

/** Общая запись: k√x или k√(x − x₀) + y₀. */
function formTex(form) {
  return form === 'shift' ? 'f(x) = k\\sqrt{x - x_0} + y_0' : 'f(x) = k\\sqrt{x}';
}

function lineTex(line) {
  return 'g(x) = ' + coef(line.k) + 'x' + term(line.b);
}

function pointTex(name, x, y) {
  return name + '(' + tex(x) + ';\\, ' + tex(y) + ')';
}

/* ══════════════════════════════════════════════════════════
   Один график корня
   ══════════════════════════════════════════════════════════ */
/** Опорная целая точка: та, что дальше от начала, — по ней k точнее. */
function mainMark(points) {
  var marks = points.filter(function (p) { return p.role === 'mark' || p.role === 'cross'; });
  return marks.reduce(function (best, p) { return best === null || p.n > best.n ? p : best; }, null);
}

function stepStart(c, form) {
  if (form !== 'shift') {
    return step('start', 'Начало графика', [
      text('График корня начинается в точке, где подкоренное выражение равно нулю. Здесь это ' +
        'начало координат ' + m('(0;\\, 0)') + ' — график не сдвинут:'),
      formula(formTex(form))
    ]);
  }
  return step('start', 'Начало графика', [
    text('График начинается в отмеченной точке ' + m(pointTex('', frac(c.x0), frac(c.y0))) +
      ' — левее неё функции нет: под корнем было бы отрицательное число. Начало графика — это ' +
      m('(x_0;\\, y_0)') + ':'),
    formula('x_0 = ' + tex(frac(c.x0)) + ', \\quad y_0 = ' + tex(frac(c.y0))),
    formula(letterTex(c))
  ]);
}

function stepPoint(c, P) {
  var dx = P.x - c.x0;
  var dy = sub(f0(P.y), frac(c.y0));
  return step('point', 'Целая точка графика', [
    text('Ищем на графике точку в узле сетки — она отмечена: ' + m(pointTex('', f0(P.x), f0(P.y))) +
      '. От начала графика она сдвинута на ' + m(String(dx)) + ' вправо — это точный квадрат, ' +
      m(dx + ' = ' + P.n + '^2') + ', поэтому корень из него извлекается нацело:'),
    formula((c.x0 === 0 ? '' : '\\sqrt{' + tex(f0(P.x)) + term(frac(-c.x0)) + '} = ') +
      '\\sqrt{' + dx + '} = ' + P.n),
    text('По вертикали точка отстоит от начала на ' + m(tex(frac(Math.abs(dy.p), dy.q))) + ' ' +
      (num(dy) > 0 ? 'вверх' : 'вниз') + '.')
  ]);
}

function stepK(c, P) {
  var y = f0(P.y);
  var dy = sub(y, frac(c.y0));
  var blocks = [
    text('Подставляем координаты точки в формулу ' + m(letterTex(c, 'y')) + ':'),
    formula(tex(y) + ' = k\\sqrt{' + tex(f0(P.x)) + term(frac(-c.x0)) + '}' + term(frac(c.y0)) +
      ' \\;\\Rightarrow\\; ' + tex(dy) + ' = ' + (P.n === 1 ? '' : P.n) + 'k' +
      (P.n === 1 ? ' \\;\\Rightarrow\\; k = ' + tex(c.k)
        : ' \\;\\Rightarrow\\; k = \\dfrac{' + tex(dy) + '}{' + P.n + '} = ' + tex(c.k))),
    text('Знак ' + m('k') + ' видно и по рисунку: график идёт ' +
      (num(c.k) > 0 ? 'вверх — ' + m('k > 0') : 'вниз — ' + m('k < 0')) + '. Формула функции:'),
    formula(equationTex(c))
  ];
  return step('k', 'Находим $k$ по целой точке', blocks);
}

/* Проверка на адекватность: где по картинке должен оказаться ответ. */
function sanityValue(c, s, x, y) {
  var n = Math.floor(num(s));
  if (isInt(s)) {
    return 'Проверка по картинке: ' + m('k ' + (num(c.k) > 0 ? '> 0' : '< 0')) + ', график идёт ' +
      (num(c.k) > 0 ? 'вверх' : 'вниз') + ' от начала, поэтому при ' + m('x = ' + tex(x)) +
      ' значение ' + (num(c.k) > 0 ? 'больше' : 'меньше') + ' ' + m('y_0 = ' + tex(frac(c.y0))) +
      ': ' + m(tex(y) + (num(c.k) > 0 ? ' > ' : ' < ') + tex(frac(c.y0))) + ' — похоже на правду.';
  }
  var xa = frac(c.x0 + n * n), xb = frac(c.x0 + (n + 1) * (n + 1));
  var ya = add(mul(c.k, frac(n)), frac(c.y0)), yb = add(mul(c.k, frac(n + 1)), frac(c.y0));
  var lo = num(ya) < num(yb) ? ya : yb, hi = num(ya) < num(yb) ? yb : ya;
  return 'Проверка по картинке: ' + m('x = ' + tex(x)) + ' лежит между ' + m(tex(xa)) + ' и ' +
    m(tex(xb)) + ', значит и значение функции — между ' + m('f(' + tex(xa) + ') = ' + tex(ya)) +
    ' и ' + m('f(' + tex(xb) + ') = ' + tex(yb)) + ': ' + m(tex(lo) + ' < ' + tex(y) + ' < ' + tex(hi)) +
    ' — похоже на правду.';
}

function stepAsked(c, rule, query, answer) {
  if (rule === 'coef-k') {
    return step('asked', 'Что спрашивают', [
      text('Спрашивают коэффициент ' + m('k') + ' — он уже найден:'),
      formula('k = ' + tex(c.k))
    ]);
  }
  var s = exact(query.root);
  if (rule === 'value-at') {
    var x = exact(query.x0);
    var under = sub(x, frac(c.x0));
    return step('asked', 'Считаем значение функции', [
      text('Подставляем ' + m('x = ' + tex(x)) + ' в формулу ' + m(equationTex(c)) + '. ' +
        'Корень извлекается нацело: ' + m(tex(under) + ' = ' + tex(s) + '^2') + '.'),
      formula('f(' + tex(x) + ') = ' + coef(c.k) + (coef(c.k) === '' || coef(c.k) === '-' ? '' : ' \\cdot ') +
        '\\sqrt{' + tex(under) + '}' + term(frac(c.y0)) + ' = ' +
        (coef(c.k) === '' ? '' : coef(c.k) === '-' ? '-' : tex(c.k) + ' \\cdot ') + tex(s) +
        term(frac(c.y0)) + ' = ' + tex(answer))
    ]);
  }
  var y = exact(query.y0);
  var right = sub(y, frac(c.y0));
  var blocks = [
    text('Решаем уравнение ' + m('f(x) = ' + tex(y)) + ':'),
    formula(coef(c.k) + '\\sqrt{' + radicand(c.x0) + '}' + term(frac(c.y0)) + ' = ' + tex(y))
  ];
  if (c.y0 !== 0) {
    blocks.push(formula(coef(c.k) + '\\sqrt{' + radicand(c.x0) + '} = ' + tex(y) + term(frac(-c.y0)) +
      ' = ' + tex(right)));
  }
  blocks.push(formula('\\sqrt{' + radicand(c.x0) + '} = \\dfrac{' + tex(right) + '}{' + tex(c.k) +
    '} = ' + tex(s)));
  blocks.push(text('Корень не бывает отрицательным, поэтому решение есть только при ' +
    m('\\dfrac{y - y_0}{k} \\ge 0') + '. Здесь ' + m(tex(s) + ' \\ge 0') +
    ' — решение есть. Возводим обе части в квадрат:'));
  blocks.push(formula(radicand(c.x0) + ' = ' + tex(s) + '^2 = ' + tex(mul(s, s)) +
    (c.x0 === 0 ? '' : ' \\;\\Rightarrow\\; x = ' + tex(mul(s, s)) + term(frac(c.x0)) + ' = ' + tex(answer))));
  return step('asked', 'Решаем уравнение', blocks);
}

function stepAnswerSingle(c, rule, query, answer) {
  var blocks = [];
  if (rule === 'value-at') {
    blocks.push(text(sanityValue(c, exact(query.root), exact(query.x0), answer)));
  } else if (rule === 'argument-for') {
    var s = exact(query.root);
    var y = exact(query.y0);
    if (isInt(s)) {
      blocks.push(text('Проверка подстановкой: ' + m('f(' + tex(answer) + ') = ' + tex(c.k) + ' \\cdot ' +
        tex(s) + term(frac(c.y0)) + ' = ' + tex(y)) + ' — верно.'));
    } else {
      var n = Math.floor(num(s));
      blocks.push(text('Проверка по картинке: значение ' + m(tex(y)) + ' лежит между ' +
        m(tex(add(mul(c.k, frac(n)), frac(c.y0)))) + ' и ' + m(tex(add(mul(c.k, frac(n + 1)), frac(c.y0)))) +
        ' — значениями в точках ' + m('x = ' + (c.x0 + n * n)) + ' и ' + m('x = ' + (c.x0 + (n + 1) * (n + 1))) +
        '. Ответ ' + m(tex(answer)) + ' тоже лежит между ними — похоже на правду.'));
    }
  } else {
    blocks.push(text('Проверка по картинке: график идёт ' + (num(c.k) > 0 ? 'вверх' : 'вниз') +
      ', знак ' + m('k') + ' ' + (num(c.k) > 0 ? 'плюс' : 'минус') + ' — сходится.'));
  }
  blocks.push(answerBlock(answer));
  return step('answer', 'Ответ и проверка', blocks);
}

/* ══════════════════════════════════════════════════════════
   Корень и прямая
   ══════════════════════════════════════════════════════════ */
function lcm(a, b) {
  var x = a, y = b;
  while (y) { var t = x % y; x = y; y = t; }
  return a / x * b;
}

/* a = tg α у возрастающей, a = −tg(180° − α) у убывающей — запись та
   же, что k в теории линейной функции. Катеты — длины, без знаков. */
function slopeByTriangle(dy, dx, k) {
  var ratio = '\\dfrac{' + tex(frac(Math.abs(dy.p), dy.q)) + '}{' + tex(frac(Math.abs(dx.p), dx.q)) + '}';
  var rising = num(k) > 0;
  var lead = rising ? 'a = \\operatorname{tg} \\alpha = ' : 'a = -\\operatorname{tg}(180^\\circ - \\alpha) = -';
  return lead + ratio + ' = ' + tex(k);
}

function lineStep(task) {
  var meta = task.meta;
  var A = meta.points.filter(function (p) { return p.role === 'cross'; })[0];
  var P = meta.points.filter(function (p) { return p.role === 'line'; })[0];
  var xA = f0(A.x), yA = f0(A.y), xP = f0(P.x), yP = f0(P.y);
  var line = { k: exact(meta.line.k), b: exact(meta.line.b) };
  var dy = sub(yP, yA), dx = sub(xP, xA);
  var readB = isInt(line.b) && Math.abs(num(line.b)) <= meta.window.ymax - 1;
  var blocks = [
    text('Прямая ' + m('g(x) = ax + b') + ' проходит через точки ' + m(pointTex('A', xA, yA)) + ' и ' +
      m(pointTex('', xP, yP)) + '. Строим прямоугольный треугольник под прямой: катеты по ' +
      'клеткам — ' + m(tex(frac(Math.abs(dx.p), dx.q))) + ' по горизонтали и ' +
      m(tex(frac(Math.abs(dy.p), dy.q))) + ' по вертикали. ' +
      (num(line.k) > 0 ? 'Прямая возрастает:' : 'Прямая убывает, поэтому со знаком минус:')),
    formula(slopeByTriangle(dy, dx, line.k))
  ];
  if (readB) {
    blocks.push(text('Прямая пересекает ось ' + m('Oy') + ' в узле сетки — ' + m('b') +
      ' читаем с графика:'));
    blocks.push(formula('b = ' + tex(line.b)));
  } else {
    blocks.push(text('Прямая пересекает ось ' + m('Oy') + ' не в узле сетки — на глаз ' + m('b') +
      ' не определяем. Подставляем точку ' + m('A') + ' в ' + m('y = ' + coef(line.k) + 'x + b') + ':'));
    blocks.push(formula(tex(yA) + ' = ' + (coef(line.k) === '' ? '' : coef(line.k) === '-' ? '-' : tb(line.k) + ' \\cdot ') +
      tb(xA) + ' + b \\;\\Rightarrow\\; b = ' + tex(line.b)));
  }
  blocks.push(formula(lineTex(line)));
  return step('line', 'Прямая: $a$ и $b$ по двум точкам', blocks);
}

function lineSteps(c, task) {
  var meta = task.meta;
  var A = meta.points.filter(function (p) { return p.role === 'cross'; })[0];
  var xA = f0(A.x), yA = f0(A.y);
  var line = { k: exact(meta.line.k), b: exact(meta.line.b) };
  var xB = exact(meta.intersection.B.x), yB = exact(meta.intersection.B.y);
  var tA = frac(A.n), tB = exact(meta.intersection.B.t);
  var asksY = meta.intersection.axis === 'y';
  var steps = [];

  var lineOnly = meta.rule === 'line-a' || meta.rule === 'line-b';
  if (lineOnly) {
    steps.push(lineStep(task));
    var asksA = meta.rule === 'line-a';
    steps.push(step('answer', 'Ответ и проверка', [
      text((asksA ? 'Угловой коэффициент ' + m('a') : 'Свободный член ' + m('b')) + ' прямой ' + m('g(x)') +
        '. Проверка по картинке: ' + (asksA
        ? 'прямая ' + (num(line.k) > 0 ? 'возрастает — ' + m('a > 0') : 'убывает — ' + m('a < 0')) + '.'
        : 'прямая пересекает ось ' + m('Oy') + (num(line.b) > 0 ? ' выше' : ' ниже') + ' нуля — знак ' +
          m('b') + ' сходится.')),
      answerBlock(asksA ? line.k : line.b)
    ]));
    return steps;
  }

  steps.push(step('k', 'Корень: находим $k$ по точке $A$', [
    text('Точка ' + m(pointTex('A', xA, yA)) + ' лежит на графике ' + m('f(x) = k\\sqrt{x}') +
      '. Подставляем её координаты:'),
    formula(tex(yA) + ' = k\\sqrt{' + tex(xA) + '}' + (A.n === 1 ? ' \\;\\Rightarrow\\; k'
      : ' = ' + A.n + 'k \\;\\Rightarrow\\; k = \\dfrac{' + tex(yA) + '}{' + A.n + '}') + ' = ' + tex(c.k)),
    formula(equationTex(c))
  ]));

  steps.push(lineStep(task));

  steps.push(step('equation', 'Приравниваем функции', [
    text('В точке пересечения у графиков одинаковые ' + m('x') + ' и ' + m('y') + ':'),
    formula(coef(c.k) + '\\sqrt{x} = ' + coef(line.k) + 'x' + term(line.b))
  ]));

  steps.push(step('odz', 'ОДЗ', [
    text('ОДЗ — область допустимых значений. Под корнем не может стоять отрицательное число:'),
    formula('x \\ge 0')
  ]));

  /* a·t² − k·t + b = 0, домноженное до целых коэффициентов. */
  var L = lcm(lcm(line.k.q, line.b.q), c.k.q);
  var qa = mul(line.k, frac(L)), qb = mul(mul(c.k, frac(-1)), frac(L)), qc = mul(line.b, frac(L));
  var subBlocks = [
    text('Сделаем замену ' + m('t = \\sqrt{x}') + ', ' + m('t \\ge 0') + '. Тогда ' + m('x = t^2') + ':'),
    formula(coef(line.k) + 't^2' + termX(mul(c.k, frac(-1)), 't') + term(line.b) + ' = 0')
  ];
  if (L !== 1) {
    subBlocks.push(text('Умножим на ' + m(String(L)) + ', чтобы избавиться от дробей:'));
    subBlocks.push(formula(coef(qa) + 't^2' + termX(qb, 't') + term(qc) + ' = 0'));
  }
  steps.push(step('substitution', 'Замена $t = \\sqrt{x}$', subBlocks));

  var D = sub(mul(qb, qb), mul(frac(4), mul(qa, qc)));
  var sqrtD = frac(Math.round(Math.sqrt(num(D))));
  steps.push(step('roots', 'Корни уравнения', [
    text('Один корень известен заранее — точка ' + m('A') + ': ' + m('t_A = \\sqrt{' + tex(xA) + '} = ' + A.n) +
      '. По теореме Виета сумма корней равна ' + m('\\dfrac{k}{a}') + ':'),
    formula(A.n + ' + t_B = \\dfrac{' + tex(c.k) + '}{' + tex(line.k) + '} \\;\\Rightarrow\\; t_B = ' + tex(tB)),
    text('Проверка через дискриминант:'),
    formula('D = ' + tb(qb) + '^2' + fourAC(qa, qc) + ' = ' + tex(D) +
      ', \\quad \\sqrt{D} = ' + tex(sqrtD)),
    formula('t_{1,2} = \\dfrac{' + tex(mul(qb, frac(-1))) + ' \\pm ' + tex(sqrtD) + '}{' + tex(mul(qa, frac(2))) +
      '}: \\quad t_1 = ' + tex(num(tA) < num(tB) ? tA : tB) + ', \\; t_2 = ' + tex(num(tA) < num(tB) ? tB : tA))
  ]));

  steps.push(step('choose', 'Отбор корней', [
    text('Оба корня неотрицательны — подходят под условие ' + m('t \\ge 0') + '. Корень ' +
      m('t = ' + A.n) + ' — это точка ' + m('A') + ', она отмечена на рисунке. Точке ' + m('B') +
      ' соответствует другой корень. Возвращаемся к ' + m('x') + ':'),
    formula('x_B = t_B^2 = ' + tb(tB) + '^2 = ' + tex(xB)),
    text(m('x_B = ' + tex(xB) + ' \\ge 0') + ' — входит в ОДЗ.')
  ]));

  if (asksY) {
    steps.push(step('ordinate', 'Ордината точки $B$', [
      text('Подставляем ' + m('x_B') + ' в ту формулу, которая проще. Здесь проще корень: ' +
        m('\\sqrt{x_B} = t_B') + ' уже известен.'),
      formula('y_B = ' + coef(c.k) + (coef(c.k) === '' || coef(c.k) === '-' ? '' : ' \\cdot ') +
        '\\sqrt{' + tex(xB) + '} = ' + (coef(c.k) === '' ? '' : coef(c.k) === '-' ? '-' : tex(c.k) + ' \\cdot ') +
        tb(tB) + ' = ' + tex(yB)),
      text('Проверка по прямой: ' + m('g(' + tex(xB) + ') = ' +
        (coef(line.k) === '' ? '' : coef(line.k) === '-' ? '-' : tb(line.k) + ' \\cdot ') + tb(xB) +
        term(line.b) + ' = ' + tex(add(mul(line.k, xB), line.b))) + ' — совпало.')
    ]));
  }

  var right = num(xB) > num(xA);
  /* B за рамкой — по общему правилу «невидимой» точки (hidden.js). */
  var far = hidden.isPointHidden({ x: num(xB), y: num(yB) }, meta.window);
  var where = num(xB) > meta.window.xmax ? 'справа, за рамкой рисунка'
    : num(yB) > meta.window.ymax ? 'выше рамки рисунка' : 'ниже рамки рисунка';
  steps.push(step('answer', 'Ответ и проверка', [
    text('Проверка по картинке: ' + (far
      ? 'прямая и график корня после точки ' + m('A') + ' расходятся и снова сходятся ' + where + ', — '
      : 'вторая точка пересечения видна на рисунке ' + (right ? 'правее' : 'левее') + ' точки ' + m('A') + ', не в узле сетки, — ') +
      m('x_B = ' + tex(xB)) + (right ? ' больше ' : ' меньше ') + m('x_A = ' + tex(xA)) + '. Похоже на правду.'),
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
  var c = S.curve(frac(meta.k.p, meta.k.q), meta.x0, meta.y0);
  var steps;
  if (meta.form === 'line') {
    steps = lineSteps(c, task);
  } else {
    var P = mainMark(meta.points);
    var answer = exact(meta.answer);
    steps = [stepStart(c, meta.form), stepPoint(c, P), stepK(c, P),
      stepAsked(c, meta.rule, meta.query, answer),
      stepAnswerSingle(c, meta.rule, meta.query, answer)];
  }
  return steps.map(function (item, index) {
    return { number: index + 1, id: item.id, title: item.title, arrow: null, blocks: item.blocks };
  });
}

const api = { fromTask: fromTask, equationTex: equationTex, formTex: formTex, mainMark: mainMark };

export default api;
export { fromTask, equationTex, formTex, mainMark };
