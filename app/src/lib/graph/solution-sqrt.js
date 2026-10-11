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

/* ── Слова и вычисления для подробного разбора ─────────────── */

/** Число знаков после запятой у десятичной дроби (0 у целого). */
function decimals(f) {
  var text = String(Math.round(num(f) * 1e8) / 1e8);
  var dot = text.indexOf('.');
  return dot < 0 ? 0 : text.length - dot - 1;
}

/** Целое число из десятичной записи: 2,6 → 26 (знаков d). */
function scaled(f, d) { return Math.round(Math.abs(num(f)) * Math.pow(10, d)); }

function digitsWord(d) { return d === 1 ? 'один знак' : d === 2 ? 'два знака' : d + ' знака'; }

/** Квадрат целого устным способом: 26·26 = 26·20 + 26·6 = 520 + 156 = 676. */
function squareByParts(n) {
  if (n < 10) { return n + ' \\cdot ' + n + ' = ' + n * n; }
  var tens = Math.floor(n / 10) * 10, ones = n % 10;
  if (ones === 0) { return n + ' \\cdot ' + n + ' = ' + n * n; }
  return n + ' \\cdot ' + n + ' = ' + n + ' \\cdot ' + tens + ' + ' + n + ' \\cdot ' + ones + ' = ' +
    n * tens + ' + ' + n * ones + ' = ' + n * n;
}

/** Корень из квадрата рационального числа: что написать и как объяснить. */
function sqrtExplain(under, s) {
  var d = decimals(s);
  if (isInt(s)) {
    return {
      tex: '\\sqrt{' + tex(under) + '} = ' + tex(s),
      words: 'Ищем число, которое при умножении само на себя даёт ' + m(tex(under)) + '. Это ' +
        m(tex(s)) + ': ' + m(tex(s) + ' \\cdot ' + tex(s) + ' = ' + tex(under)) + '. Значит, корень извлекается нацело.',
      proof: null
    };
  }
  if (decimalFriendly(s)) {
    var n = scaled(s, d), den = Math.pow(10, d);
    return {
      tex: '\\sqrt{' + tex(under) + '} = \\sqrt{\\dfrac{' + n * n + '}{' + den * den + '}} = \\dfrac{' + n + '}{' + den +
        '} = ' + tex(s),
      words: 'Чтобы взять корень из десятичной дроби, запишем её обычной дробью: ' + m(tex(under)) + ' — это ' +
        m(String(n * n)) + ' ' + (d === 1 ? 'сотых' : d === 2 ? 'десятитысячных' : 'миллионных') + ', то есть ' +
        m('\\dfrac{' + n * n + '}{' + den * den + '}') + '. Знаменатель — полный квадрат: ' + m(den * den + ' = ' + den + '^2') +
        '. Числитель тоже: ' + m(n * n + ' = ' + n + '^2') + ' (проверим умножением: ' + m(squareByParts(n)) +
        '). Корень из дроби равен корню из числителя, делённому на корень из знаменателя.',
      proof: null
    };
  }
  return {
    tex: '\\sqrt{' + tex(under) + '} = \\sqrt{\\dfrac{' + s.p * s.p + '}{' + s.q * s.q + '}} = \\dfrac{' +
      Math.abs(s.p) + '}{' + s.q + '}',
    words: 'Запишем подкоренное число дробью ' + m('\\dfrac{' + s.p * s.p + '}{' + s.q * s.q + '}') +
      ' = ' + m('\\dfrac{' + Math.abs(s.p) + '^2}{' + s.q + '^2}') + ' — корень из дроби равен корню из ' +
      'числителя, делённому на корень из знаменателя.',
    proof: null
  };
}

/** Произведение k · s: «умный» способ, названный словами. */
function multiplyBy(k, s) {
  var result = mul(k, s);
  var sign = k.p < 0 ? '-' : '';
  var kp = Math.abs(k.p), kq = k.q;
  if (isInt(k) && kp === 1) {
    return { words: 'Множитель ' + m(tex(k)) + (k.p < 0 ? ' только меняет знак' : ' ничего не меняет') + ':',
      tex: tex(k) + ' \\cdot ' + tb(s) + ' = ' + tex(result), result: result };
  }
  if (isInt(s)) {
    return { words: 'Умножаем коэффициент на корень:',
      tex: tb(k) + ' \\cdot ' + tex(s) + ' = ' + tex(result), result: result };
  }
  if (!isInt(k)) {
    /* k = p/q: сначала делим s на q, потом умножаем на p. */
    var part = div(s, frac(kq));
    if (decimalFriendly(part)) {
      var tail = kp === 1 ? '' : sign + kp + ' \\cdot ' + tex(part) + ' = ';
      return {
        words: 'Число ' + m(tex(k)) + ' — это ' + m(sign + '\\dfrac{' + kp + '}{' + kq + '}') +
          '. Умножать на дробь удобно так: сначала делим на знаменатель ' + m(String(kq)) +
          (kp === 1 ? '.' : ', потом умножаем на числитель ' + m(String(kp)) + '.'),
        tex: tb(k) + ' \\cdot ' + tex(s) + ' = ' + sign + '\\dfrac{' + kp + '}{' + kq + '} \\cdot ' + tex(s) + ' = ' +
          tail + tex(result), result: result };
    }
  }
  /* k — целое, s — десятичная дробь: разбиваем s на целую и дробную части. */
  var whole = Math.floor(Math.abs(num(s))), rest = sub(frac(Math.abs(s.p), s.q), frac(whole));
  if (isInt(k) && whole > 0 && decimalFriendly(s)) {
    var a = mul(frac(Math.abs(k.p)), frac(whole)), b = mul(frac(Math.abs(k.p)), rest);
    var open = sign ? '-(' : '', close = sign ? ')' : '';
    return {
      words: 'Умножаем по частям: отдельно на целую часть ' + m(String(whole)) + ' и на дробную ' + m(tex(rest)) +
        ', потом складываем.',
      tex: tb(k) + ' \\cdot ' + tex(s) + ' = ' + open + Math.abs(k.p) + ' \\cdot ' + whole + ' + ' + Math.abs(k.p) +
        ' \\cdot ' + tex(rest) + close + ' = ' + open + tex(a) + ' + ' + tex(b) + close + ' = ' + tex(result),
      result: result };
  }
  return { words: 'Умножаем коэффициент на корень:', tex: tb(k) + ' \\cdot ' + tb(s) + ' = ' + tex(result), result: result };
}

/** Деление right : k — «умный» способ для дробного k. */
function divideBy(right, k, s) {
  if (!isInt(k) && k.p > 0) {
    var part = div(right, frac(k.p));
    if (decimalFriendly(part)) {
      return {
        words: 'Делить на ' + m(tex(k)) + ' = ' + m('\\dfrac{' + k.p + '}{' + k.q + '}') +
          ' — то же, что умножать на перевёрнутую дробь ' + m('\\dfrac{' + k.q + '}{' + k.p + '}') + ': сначала делим ' +
          'на ' + m(String(k.p)) + (k.q === 1 ? '' : ', потом умножаем на ' + m(String(k.q))) + '.',
        tex: '\\dfrac{' + tex(right) + '}{' + tex(k) + '} = ' + tex(right) + ' \\cdot \\dfrac{' + k.q + '}{' + k.p + '} = ' +
          tex(part) + ' \\cdot ' + k.q + ' = ' + tex(s) };
    }
  }
  return { words: 'Делим обе части на ' + m(tex(k)) + ':', tex: '\\dfrac{' + tex(right) + '}{' + tex(k) + '} = ' + tex(s) };
}

function pointCoords(P) { return m(pointTex('', f0(P.x), f0(P.y))); }

function stepStart(c, form) {
  /* Без сдвига отдельного шага нет: график начинается в (0; 0). */
  if (form !== 'shift') { return null; }
  return step('start', 'Находим начало графика $(x_0;\\, y_0)$', [
    text('График корня начинается в самой левой своей точке — левее неё функции нет, потому что под ' +
      'корнем было бы отрицательное число. Эта точка отмечена на рисунке: ' + m(pointTex('', frac(c.x0), frac(c.y0))) +
      '. Её координаты и есть числа ' + m('x_0') + ' и ' + m('y_0') + ':'),
    formula('x_0 = ' + tex(frac(c.x0)) + ', \\quad y_0 = ' + tex(frac(c.y0))),
    text('Сдвинутый график записывается формулой ' + m(formTex('shift')) + '. Подставим в неё найденные ' +
      m('x_0') + ' и ' + m('y_0') + ' — формула теперь выглядит так:'),
    formula(letterTex(c, 'y'))
  ]);
}

function stepPoint(c, P, form) {
  var dx = P.x - c.x0;
  var shifted = form === 'shift';
  var blocks = [
    text('Найдём на графике точку, которая лежит ровно в узле клетчатой сетки, то есть обе её координаты — ' +
      'целые числа. Берём точку ' + pointCoords(P) + '.')
  ];
  if (shifted && c.x0 !== 0) {
    blocks.push(text('Под корнем стоит ' + m(radicand(c.x0)) + ' — расстояние от точки до начала графика по горизонтали. ' +
      'Для нашей точки оно равно ' + m(P.x + term(frac(-c.x0)) + ' = ' + dx) + ' — это точный квадрат, ' +
      m(dx + ' = ' + P.n + '^2') + ', поэтому корень извлекается нацело:'));
    blocks.push(formula('\\sqrt{' + P.x + term(frac(-c.x0)) + '} = \\sqrt{' + dx + '} = ' + P.n));
  } else {
    blocks.push(text('Её абсцисса ' + m(String(P.x)) + ' — точный квадрат, ' + m(P.x + ' = ' + P.n + '^2') +
      ', поэтому корень из неё извлекается нацело (так специально выбирают точку: считать будет легко):'));
    blocks.push(formula('\\sqrt{' + P.x + '} = ' + P.n));
  }
  return step('point', 'Берём точку в узле сетки', blocks);
}

function stepK(c, P, form) {
  var y = f0(P.y), x = f0(P.x);
  var dy = sub(y, frac(c.y0));
  var shifted = form === 'shift';
  var sq = shifted ? '\\sqrt{' + tex(x) + term(frac(-c.x0)) + '}' : '\\sqrt{' + tex(x) + '}';
  var blocks = [
    text('Чтобы найти ' + m('k') + ', подставим координаты этой точки в формулу ' + m(letterTex(c, 'y')) +
      ': вместо ' + m('x') + ' ставим ' + m(tex(x)) + ', вместо ' + m('y') + ' ставим ' + m(tex(y)) + '.'),
    formula(tex(y) + ' = k \\cdot ' + sq + term(frac(c.y0)) + ' = ' + (P.n === 1 ? '' : P.n) + 'k' + term(frac(c.y0)))
  ];
  if (c.y0 !== 0) {
    blocks.push(text('Число ' + m(tex(frac(c.y0))) + ' переносим в левую часть, поменяв знак — так слагаемое ' +
      'с ' + m('k') + ' остаётся одно:'));
    blocks.push(formula(tex(y) + term(frac(-c.y0)) + ' = ' + (P.n === 1 ? '' : P.n) + 'k \\;\\Rightarrow\\; ' +
      tex(dy) + ' = ' + (P.n === 1 ? '' : P.n) + 'k'));
  }
  if (P.n !== 1) {
    blocks.push(text('Теперь ' + m('k') + ' умножено на ' + m(String(P.n)) + '. Чтобы найти ' + m('k') +
      ', делим обе части уравнения на ' + m(String(P.n)) + ':'));
    blocks.push(formula('k = \\dfrac{' + tex(dy) + '}{' + P.n + '} = ' + tex(c.k)));
  } else {
    blocks.push(text('Корень из единицы равен единице, поэтому ' + m('k') + ' получается сразу:'));
    blocks.push(formula('k = ' + tex(c.k)));
  }
  blocks.push(text('Знак ' + m('k') + ' видно и по рисунку: график идёт ' +
    (num(c.k) > 0 ? 'вверх — ' + m('k > 0') : 'вниз — ' + m('k < 0')) + '.'));
  blocks.push(text('Мы нашли ' + m('k') + '. Каждый раз, когда находим очередной коэффициент, записываем, ' +
    'какой вид теперь принимает формула — формула теперь выглядит так:'));
  blocks.push(formula(equationTex(c, 'y')));
  return step('k', 'Находим $k$ по точке', blocks);
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
    return step('asked', 'Что нужно найти', [
      text('В задании нужно найти коэффициент ' + m('k') + '. Мы уже нашли его во втором шаге — просто записываем:'),
      formula('k = ' + tex(c.k))
    ]);
  }
  var s = exact(query.root);
  if (rule === 'value-at') {
    var x = exact(query.x0);
    var under = sub(x, frac(c.x0));
    var root = sqrtExplain(under, s);
    var prod = multiplyBy(c.k, s);
    var blocks = [
      text('В задании нужно найти значение функции в точке ' + m('x = ' + tex(x)) + ', то есть ' + m('f(' + tex(x) + ')') +
        '. Мы знаем формулу, поэтому подставляем в неё ' + m('x = ' + tex(x)) + ' вместо ' + m('x') + ':'),
      formula('f(' + tex(x) + ') = ' + coef(c.k) + (coef(c.k) === '' || coef(c.k) === '-' ? '' : ' \\cdot ') +
        '\\sqrt{' + tex(x) + term(frac(-c.x0)) + '}' + term(frac(c.y0)) +
        (c.x0 === 0 ? '' : ' = ' + coef(c.k) + (coef(c.k) === '' || coef(c.k) === '-' ? '' : ' \\cdot ') +
          '\\sqrt{' + tex(under) + '}' + term(frac(c.y0)))),
      text('Сначала найдём корень. ' + root.words),
      formula(root.tex)
    ];
    if (!(isInt(c.k) && Math.abs(c.k.p) === 1)) {
      blocks.push(text(prod.words));
      blocks.push(formula(prod.tex));
    }
    var value = prod.result;
    if (c.y0 !== 0) {
      blocks.push(text('Остаётся прибавить ' + m('y_0 = ' + tex(frac(c.y0))) + ' — график сдвинут по вертикали:'));
      blocks.push(formula('f(' + tex(x) + ') = ' + tex(value) + term(frac(c.y0)) + ' = ' + tex(answer)));
    } else {
      blocks.push(text(isInt(c.k) && c.k.p === -1 ? 'Минус перед корнем остаётся — значение функции:' : 'Значение функции:'));
      blocks.push(formula('f(' + tex(x) + ') = ' + tex(answer)));
    }
    return step('asked', 'Что нужно найти', blocks);
  }
  var y = exact(query.y0);
  var right = sub(y, frac(c.y0));
  var blocks2 = [
    text('В задании известно значение функции ' + m('y = ' + tex(y)) + ', нужно найти ' + m('x') + '. Мы знаем формулу, ' +
      'поэтому подставляем известное ' + m('y') + ' и решаем уравнение относительно ' + m('x') + ':'),
    formula(coef(c.k) + '\\sqrt{' + radicand(c.x0) + '}' + term(frac(c.y0)) + ' = ' + tex(y))
  ];
  if (c.y0 !== 0) {
    blocks2.push(text('Число ' + m(tex(frac(c.y0))) + ' переносим в правую часть, поменяв знак:'));
    blocks2.push(formula(coef(c.k) + '\\sqrt{' + radicand(c.x0) + '} = ' + tex(y) + term(frac(-c.y0)) + ' = ' + tex(right)));
  }
  var dv = divideBy(right, c.k, s);
  var unit = isInt(c.k) && Math.abs(c.k.p) === 1;
  if (unit && c.k.p < 0) {
    blocks2.push(text('Перед корнем стоит минус. Умножим обе части уравнения на ' + m('-1') + ' — знаки поменяются:'));
    blocks2.push(formula('\\sqrt{' + radicand(c.x0) + '} = ' + tex(s)));
  } else if (!unit) {
    blocks2.push(text(dv.words));
    blocks2.push(formula('\\sqrt{' + radicand(c.x0) + '} = ' + dv.tex));
  }
  blocks2.push(text('Квадратный корень не бывает отрицательным, поэтому решение есть, только если справа не ' +
    'отрицательное число. Здесь ' + m(tex(s) + ' \\ge 0') + ' — решение есть. Чтобы избавиться от корня, ' +
    'возводим обе части уравнения в квадрат' + (decimalFriendly(s) && !isInt(s)
      ? ' (у числа ' + m(tex(s)) + ' ' + digitsWord(decimals(s)) + ' после запятой, у его квадрата — вдвое больше)' : '') + ':'));
  if (c.x0 !== 0) {
    blocks2.push(formula(radicand(c.x0) + ' = ' + tex(s) + '^2 = ' + tex(mul(s, s))));
    blocks2.push(text('Число ' + m(tex(frac(-c.x0))) + ' переносим в правую часть, поменяв знак:'));
    blocks2.push(formula('x = ' + tex(mul(s, s)) + term(frac(c.x0)) + ' = ' + tex(answer)));
  } else {
    blocks2.push(formula('x = ' + tex(s) + '^2 = ' + tex(answer)));
  }
  return step('asked', 'Что нужно найти', blocks2);
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
  return step('answer', 'Проверка на адекватность и ответ', blocks);
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
  blocks.push(text('Мы нашли ' + m('a') + ' и ' + m('b') + ' — формула прямой теперь выглядит так:'));
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
    text('Точка ' + m(pointTex('A', xA, yA)) + ' лежит в узле сетки и на графике ' + m('f(x) = k\\sqrt{x}') +
      ', поэтому её координаты подходят к формуле. Подставляем: вместо ' + m('x') + ' ставим ' + m(tex(xA)) +
      ', вместо ' + m('f(x)') + ' — ' + m(tex(yA)) + ':'),
    formula(tex(yA) + ' = k\\sqrt{' + tex(xA) + '}' + (A.n === 1 ? '' : ' = ' + A.n + 'k')),
    text(A.n === 1 ? 'Корень из единицы равен единице, поэтому ' + m('k') + ' получается сразу:'
      : 'Число ' + m(String(A.n)) + ' стоит множителем при ' + m('k') + '. Делим обе части на ' + m(String(A.n)) + ':'),
    formula('k = ' + (A.n === 1 ? '' : '\\dfrac{' + tex(yA) + '}{' + A.n + '} = ') + tex(c.k)),
    text('Мы нашли ' + m('k') + ' — формула корня теперь выглядит так:'),
    formula(equationTex(c, 'f(x)'))
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
    steps = [stepStart(c, meta.form), stepPoint(c, P, meta.form), stepK(c, P, meta.form),
      stepAsked(c, meta.rule, meta.query, answer),
      stepAnswerSingle(c, meta.rule, meta.query, answer)].filter(Boolean);
  }
  return steps.map(function (item, index) {
    return { number: index + 1, id: item.id, title: item.title, arrow: null, blocks: item.blocks };
  });
}

const api = { fromTask: fromTask, equationTex: equationTex, formTex: formTex, mainMark: mainMark };

export default api;
export { fromTask, equationTex, formTex, mainMark };
