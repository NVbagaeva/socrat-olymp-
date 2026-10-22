/* graph/solution-exponential.js — разбор задачи о показательной функции.

   Метод один на всю подтему, и он обязателен:
     • параметры НИКОГДА не угадываются по рисунку — даже асимптота.
       Берём две отмеченные точки в узлах сетки, подставляем в формулу
       и получаем систему уравнений;
     • у aˣ + b уравнения вычитаем (b уходит), у a^(x + b) — делим
       (уходит b в показателе);
     • после каждого найденного параметра заново выписываем формулу;
     • потом вычисляем f(x₀) или решаем f(x) = c;
     • в конце — проверка по графику: возрастает или убывает, где
       асимптота, какого знака ответ.

   Шаги (те же номера и названия у подсказки, graph/hints-exponential.js):
     1. Точки на графике
     2. Система уравнений
     3. Находим a
     4. Находим b              — у aˣ + b и a^(x + b)
     5. Что нужно найти
     6. Проверка по графику и ответ

   Модуль отдаёт ту же структуру, что разбор корня: шаги с id, внутри
   блоки text / formula / answer. Формулы — TeX для KaTeX. */

import Line from './families/line.js';
import P from './base-power.js';
import E from './generate-exponential.js';

var frac = Line.frac, add = Line.add, sub = Line.sub, mul = Line.mul, div = Line.div,
    num = Line.num, isInt = Line.isInt, isZero = Line.isZero;

var tex = P.tex;

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

/** Цепочка вычислений — одна формула в несколько строк, а не формулы подряд. */
function chain(lines) {
  var list = lines.filter(Boolean);
  return list.length === 1 ? list[0] : '\\begin{gathered}' + list.join(' \\\\ ') + '\\end{gathered}';
}
function f0(v) { return Line.toFrac(v); }

/** Отрицательное — в скобках. */
function tb(f) { return f.p < 0 ? '(' + tex(f) + ')' : tex(f); }

/** Слагаемое со знаком: « + 3», « - 2». */
function term(f) {
  if (isZero(f)) { return ''; }
  return (f.p > 0 ? ' + ' : ' - ') + tex(frac(Math.abs(f.p), f.q));
}

/** Показатель x + c: «x», «x + 3», «x - 2». */
function exponent(c, letter) { return (letter || 'x') + term(frac(c)); }

/** Общая запись формы — буквы, как в условии. */
function formTex(form) {
  if (form === 'shiftY') { return 'f(x) = a^x + b'; }
  if (form === 'shiftX') { return 'f(x) = a^{x+b}'; }
  return 'f(x) = a^x';
}

/** Формула с найденными числами. */
function equationTex(cv, form, known) {
  var a = known.a ? P.baseInPower(cv.base) : 'a';
  if (form === 'shiftY') {
    return 'f(x) = ' + a + '^x' + (known.b ? term(frac(cv.d)) : ' + b');
  }
  if (form === 'shiftX') {
    return 'f(x) = ' + a + '^{' + (known.b ? exponent(cv.c) : 'x+b') + '}';
  }
  return 'f(x) = ' + a + '^x';
}

/** Буква сдвига в условии — всегда b: у aˣ + b это d, у a^(x + b) — c. */
function shiftOf(cv, form) { return form === 'shiftX' ? cv.c : cv.d; }

/* ══════════════════════════════════════════════════════════
   Степени словами: умный счёт
   ══════════════════════════════════════════════════════════ */
/** Целое основание r в степени k ≥ 0 устно: 2⁸ = (2⁴)² = 16² = 256. */
function intPowerTex(r, k) {
  var value = Math.pow(r, k);
  if (k <= 1) { return r + '^' + k + ' = ' + value; }
  if (k === 2) { return r + '^2 = ' + r + ' \\cdot ' + r + ' = ' + value; }
  if (k % 2 === 0) {
    var half = Math.pow(r, k / 2);
    return r + '^{' + k + '} = \\left(' + r + '^{' + (k / 2) + '}\\right)^2 = ' + half + '^2 = ' + value;
  }
  var lower = Math.pow(r, k - 1);
  return r + '^{' + k + '} = ' + r + '^{' + (k - 1) + '} \\cdot ' + r + ' = ' + lower + ' \\cdot ' + r +
    ' = ' + value;
}

/**
 * aⁿ точно и с объяснением. Отрицательная степень — переворот дроби,
 * корень в основании — квадрат: (√2)⁶ = ((√2)²)³ = 2³.
 */
function powerExplain(b, n) {
  var value = P.pow(b, n);
  var aT = P.baseInPower(b);
  var lines = [];
  var words = [];
  var k = n / b.m;           /* показатель для r = a^m */
  var r = b.r;
  if (n === 0) {
    return { value: value, words: 'Любое число (кроме нуля) в нулевой степени равно единице.',
             tex: [aT + '^0 = 1'] };
  }
  /* Дробь основания — всегда обыкновенной: 1/2, а не 0,5 — так видно,
     что дальше её переворачиваем. */
  var rTex = isInt(r) ? tex(r) : '\\dfrac{' + r.p + '}{' + r.q + '}';
  if (b.m === 2) {
    words.push('Основание — корень, поэтому собираем квадраты: ' + m(aT + '^2 = ' + rTex) + ', значит ' +
      m(aT + '^{' + n + '} = ' + (isInt(r) ? rTex : '\\left(' + rTex + '\\right)') + '^{' + k + '}') + '.');
  }
  /* Переворачиваем, чтобы в основании оказалось целое и показатель стал
     неотрицательным: (1/2)⁻³ = 2³, 2⁻³ = 1/2³. */
  var flip = (isInt(r) && k < 0) || (!isInt(r) && k > 0);
  var whole = isInt(r) ? r.p : r.q;
  var absK = Math.abs(k);
  if (k === 0) {
    lines.push(aT + '^0 = 1');
    words.push('Любое число (кроме нуля) в нулевой степени равно единице.');
  } else if (!flip) {
    if (!isInt(r)) {
      words.push('Отрицательная степень дроби — это та же дробь, перевёрнутая, в положительной степени: ' +
        m('\\left(\\dfrac{1}{' + whole + '}\\right)^{' + k + '} = ' + whole + '^{' + absK + '}') + '.');
      lines.push('\\left(\\dfrac{1}{' + whole + '}\\right)^{' + k + '} = ' + whole + '^{' + absK + '}');
    }
    lines.push(intPowerTex(whole, absK));
  } else {
    var denom = Math.pow(whole, absK);
    words.push(isInt(r)
      ? 'Отрицательная степень — это единица, делённая на ту же степень с плюсом: ' +
        m(whole + '^{' + k + '} = \\dfrac{1}{' + whole + '^{' + absK + '}}') + '.'
      : 'Дробь в степени: числитель и знаменатель возводятся отдельно.');
    lines.push((isInt(r) ? whole + '^{' + k + '}' : '\\left(\\dfrac{1}{' + whole + '}\\right)^{' + k + '}') +
      ' = \\dfrac{1}{' + whole + '^{' + absK + '}} = \\dfrac{1}{' + denom + '}' +
      (P.places(value) < Infinity ? ' = ' + tex(value) : ''));
    if (P.places(value) < Infinity && !isInt(value)) {
      words.push('Дробь со знаменателем из двоек и пятёрок записывается конечной десятичной: домножаем ' +
        'числитель и знаменатель так, чтобы внизу получилось ' + m('10') + ', ' + m('100') + ' или ' + m('1000') + '.');
    }
  }
  return { value: value, words: words.join(' ') || 'Считаем степень устно.', tex: lines };
}

/** Какой степенью основания записывается число v: aᵏ = v. */
function powerIndex(b, v) {
  for (var n = -24; n <= 24; n++) {
    var p = P.pow(b, n);
    if (p !== null && P.key(p) === P.key(v)) { return n; }
  }
  return null;
}

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

function systemLines(form, A, B) {
  function one(Pt) {
    var x = tex(f0(Pt.x)), y = tex(f0(Pt.y));
    if (form === 'shiftY') { return 'a^{' + x + '} + b = ' + y; }
    if (form === 'shiftX') { return 'a^{' + x + ' + b} = ' + y; }
    return 'a^{' + x + '} = ' + y;
  }
  return '\\begin{cases} ' + one(A) + ' \\\\ ' + one(B) + ' \\end{cases}';
}

function stepSystem(meta, A, B) {
  var blocks = [
    text('Подставляем координаты каждой точки в формулу: вместо ' + m('x') + ' — абсциссу, вместо ' +
      m('f(x)') + ' — ординату. Получаем систему из двух уравнений:'),
    formula(systemLines(meta.form, A, B))
  ];
  if (meta.form === 'shiftY') {
    blocks.push(text('В обоих уравнениях есть одно и то же ' + m('b') + '. Если из второго уравнения вычесть ' +
      'первое, ' + m('b') + ' уйдёт, и останется уравнение только с ' + m('a') + '.'));
  } else if (meta.form === 'shiftX') {
    blocks.push(text('В обоих показателях стоит одно и то же ' + m('b') + '. Если второе уравнение разделить на ' +
      'первое, степени с одинаковым основанием делятся вычитанием показателей — и ' + m('b') + ' уйдёт.'));
  }
  return step('system', 'Составляем систему уравнений', blocks);
}

/** a из уравнения aᵏ = v: k — разность показателей, v — число. */
function solveA(b, k, v) {
  var aT = P.baseTex(b);
  var lines = [];
  var words;
  if (k === 1) {
    lines.push('a = ' + tex(v));
    words = 'Степень первая — значит, ' + m('a') + ' равно этому числу сразу.';
  } else if (k === -1) {
    lines.push('a^{-1} = \\dfrac{1}{a} = ' + tex(v) + ' \\;\\Rightarrow\\; a = \\dfrac{1}{' + tex(v) + '}' +
      (P.places(b.r) < Infinity && b.m === 1 ? ' = ' + tex(b.r) : ''));
    words = 'Степень минус первая — это единица, делённая на число: ' + m('a^{-1} = \\dfrac{1}{a}') +
      '. Переворачиваем обе части.';
  } else {
    var abs = Math.abs(k);
    var rhs = k > 0 ? v : div(frac(1), v);
    lines.push((k > 0 ? 'a^{' + k + '}' : 'a^{' + k + '} = \\dfrac{1}{a^{' + abs + '}}') + ' = ' + tex(v) +
      (k > 0 ? '' : ' \\;\\Rightarrow\\; a^{' + abs + '} = ' + tex(rhs)));
    lines.push('a = ' + (abs === 2 ? '\\sqrt{' + tex(rhs) + '}' : '\\sqrt[' + abs + ']{' + tex(rhs) + '}') +
      ' = ' + aT);
    words = 'Ищем положительное число, которое в степени ' + m(String(abs)) + ' даёт ' + m(tex(rhs)) +
      '. Основание показательной функции всегда положительно, поэтому берём положительный корень.';
  }
  return { words: words, lines: lines };
}

function stepA(meta, cv, A, B) {
  var form = meta.form;
  var b = cv.base;
  var blocks = [];
  var aKnown = equationTex(cv, form, { a: true, b: false });
  if (form === 'basic') {
    /* Точка (0; 1) есть у любой aˣ и об a ничего не говорит. */
    var useB = A.x === 0 ? B : (B.x === 0 ? A : B);
    if (A.x === 0 || B.x === 0) {
      blocks.push(text('Первое уравнение — ' + m('a^0 = 1') + ' — верно при любом ' + m('a') +
        ': график любой функции ' + m('a^x') + ' проходит через ' + m('(0;\\, 1)') +
        '. Значит, ' + m('a') + ' находим из второго уравнения.'));
    }
    var s = solveA(b, useB.x, f0(useB.y));
    blocks.push(text(s.words));
    blocks.push(formula(chain(s.lines)));
  } else if (form === 'shiftY') {
    var dy = sub(f0(B.y), f0(A.y));
    blocks.push(text('Вычитаем из второго уравнения первое — ' + m('b') + ' сокращается:'));
    blocks.push(formula('a^{' + B.x + '} - a^{' + A.x + '} = ' + tex(f0(B.y)) + ' - ' + tb(f0(A.y)) + ' = ' + tex(dy)));
    if (A.x === 0 || B.x === 0) {
      var other = A.x === 0 ? B : A;
      var sign = A.x === 0 ? 1 : -1;
      var rhs = add(mul(frac(sign), dy), frac(1));
      blocks.push(text('Здесь ' + m('a^0 = 1') + '. Переносим единицу вправо:'));
      blocks.push(formula('a^{' + other.x + '} = ' + tex(rhs)));
      var s2 = solveA(b, other.x, rhs);
      blocks.push(text(s2.words));
      blocks.push(formula(chain(s2.lines)));
    } else {
      /* Две «дальние» точки: aⁿ(aᵐ − 1) = Δ. При n = m это квадратное
         уравнение относительно t = aᵐ; иначе — подбор с проверкой и
         объяснением, почему корень один. */
      var low = Math.abs(A.n) < Math.abs(B.n) ? A : B, high = low === A ? B : A;
      var t = P.pow(b, low.n);
      var tT = 'a^{' + low.x + '}';
      if (Math.abs(high.n) === 2 * Math.abs(low.n)) {
        blocks.push(text('Обозначим ' + m('t = ' + tT) + ', тогда ' + m('a^{' + high.x + '} = t^2') +
          ' и уравнение становится квадратным:'));
        var D = add(frac(1), mul(frac(4), dy));
        var sq = Math.round(Math.sqrt(num(D)));
        blocks.push(formula(chain(['t^2 - t - ' + tb(dy) + ' = 0, \\quad D = 1 + 4 \\cdot ' + tb(dy) + ' = ' + tex(D) +
          ' = ' + sq + '^2', 't = \\dfrac{1 \\pm ' + sq + '}{2}: \\quad t_1 = ' + (1 + sq) / 2 + ', \\quad t_2 = ' + (1 - sq) / 2])));
        blocks.push(text('Степень положительного числа всегда положительна, поэтому ' + m('t = ' + tex(t)) +
          ', то есть ' + m(tT + ' = ' + tex(t)) + '.'));
        var s3 = solveA(b, low.x, t);
        blocks.push(formula(chain(s3.lines)));
      } else {
        blocks.push(text('Вынесем общий множитель и подберём основание: точки в узлах сетки, значит, ' +
          m('a^{' + low.x + '}') + ' — число, удобное для счёта.'));
        blocks.push(formula(tT + ' \\cdot \\left(a^{' + (high.x - low.x) + '} - 1\\right) = ' + tex(dy)));
        blocks.push(text('Проверяем ' + m('a = ' + P.baseTex(b)) + ': ' + m(tex(P.pow(b, low.n)) + ' \\cdot (' +
          tex(P.pow(b, high.n - low.n)) + ' - 1) = ' + tex(dy)) + ' — подходит. Другого положительного ' +
          'основания нет: левая часть при росте основания только растёт.'));
        blocks.push(formula('a = ' + P.baseTex(b)));
      }
    }
  } else {
    /* a^(x + b): делим второе уравнение на первое. */
    var k = B.x - A.x;
    var ratio = div(f0(B.y), f0(A.y));
    blocks.push(text('Делим второе уравнение на первое. При делении степеней с одинаковым основанием ' +
      'показатели вычитаются: ' + m('(' + B.x + ' + b) - (' + tex(f0(A.x)) + ' + b) = ' + k) + ' — ' + m('b') + ' ушло.'));
    blocks.push(formula('\\dfrac{a^{' + B.x + ' + b}}{a^{' + A.x + ' + b}} = a^{' + k + '} = \\dfrac{' +
      tex(f0(B.y)) + '}{' + tex(f0(A.y)) + '} = ' + tex(ratio)));
    var s4 = solveA(b, k, ratio);
    blocks.push(text(s4.words));
    blocks.push(formula(chain(s4.lines)));
  }
  blocks.push(text('Мы нашли ' + m('a') + '. Записываем, как теперь выглядит формула:'));
  blocks.push(formula(aKnown));
  blocks.push(text(P.growing(b)
    ? 'Основание больше единицы — функция возрастает, как и на рисунке.'
    : 'Основание меньше единицы — функция убывает, как и на рисунке.'));
  return step('a', 'Находим $a$', blocks);
}

function stepB(meta, cv, A) {
  var form = meta.form;
  if (form === 'basic') { return null; }
  var b = cv.base;
  var aT = P.baseInPower(b);
  var blocks = [];
  var shift = frac(shiftOf(cv, form));
  if (form === 'shiftY') {
    var pw = powerExplain(b, A.n);
    blocks.push(text('Подставляем найденное ' + m('a') + ' в первое уравнение системы и находим ' + m('b') + ':'));
    blocks.push(formula(aT + '^{' + A.x + '} + b = ' + tex(f0(A.y))));
    blocks.push(text(A.x === 0 ? 'Здесь ' + m(P.baseInPower(b) + '^0 = 1') + ', и ' + m('b') + ' находится сразу:'
      : pw.words + ' Затем выражаем ' + m('b') + ':'));
    blocks.push(formula(chain((A.x === 0 ? [] : pw.tex).concat([tex(pw.value) + ' + b = ' + tex(f0(A.y)) + ' \\;\\Rightarrow\\; b = ' +
      tex(f0(A.y)) + ' - ' + tb(pw.value) + ' = ' + tex(shift)]))));
    blocks.push(text('Так же, без угадывания, получилась и асимптота: это прямая ' + m('y = ' + tex(shift)) +
      ' — к ней график приближается, но никогда её не касается.'));
  } else {
    var n = powerIndex(b, f0(A.y));
    blocks.push(text('Подставляем найденное ' + m('a') + ' в первое уравнение:'));
    blocks.push(formula(aT + '^{' + tex(f0(A.x)) + ' + b} = ' + tex(f0(A.y))));
    if (n === 0) {
      blocks.push(text('Степень равна единице, только когда показатель равен нулю:'));
    } else {
      blocks.push(text('Запишем правую часть степенью того же основания: ' + m(tex(f0(A.y)) + ' = ' + aT + '^{' + n + '}') +
        '. Степени с одинаковым основанием равны, когда равны показатели:'));
    }
    blocks.push(formula(tex(f0(A.x)) + ' + b = ' + n + ' \\;\\Rightarrow\\; b = ' + n + ' - ' + tb(f0(A.x)) + ' = ' + tex(shift)));
  }
  blocks.push(text('Мы нашли ' + m('b') + '. Формула теперь полностью известна:'));
  blocks.push(formula(equationTex(cv, form, { a: true, b: true })));
  return step('b', 'Находим $b$', blocks);
}

function stepAsked(meta, cv, answer) {
  var b = cv.base, aT = P.baseInPower(b);
  var rule = meta.rule, q = meta.query;
  if (rule === 'coef-a') {
    return step('asked', 'Что нужно найти', [
      text('В задании нужно найти основание ' + m('a') + '. Мы его уже нашли:'),
      formula('a = ' + tex(answer))
    ]);
  }
  if (rule === 'coef-b') {
    return step('asked', 'Что нужно найти', [
      text('В задании нужно найти ' + m('b') + '. Мы его уже нашли:'),
      formula('b = ' + tex(answer))
    ]);
  }
  if (rule === 'value-at') {
    var x0 = exact(q.x0);
    var n = q.n;
    var pw = powerExplain(b, n);
    var blocks = [
      text('Нужно найти ' + m('f(' + tex(x0) + ')') + '. Подставляем ' + m('x = ' + tex(x0)) + ' в формулу:'),
      formula('f(' + tex(x0) + ') = ' + aT + '^{' + tex(x0) + term(frac(cv.c)) + '}' +
        (cv.c === 0 ? '' : ' = ' + aT + '^{' + n + '}') + term(frac(cv.d)))
    ];
    if (pw.words) { blocks.push(text(pw.words)); }
    blocks.push(formula(chain(pw.tex)));
    if (cv.d !== 0) {
      blocks.push(text('Остаётся прибавить ' + m('b = ' + tex(frac(cv.d))) + ':'));
      blocks.push(formula('f(' + tex(x0) + ') = ' + tex(pw.value) + term(frac(cv.d)) + ' = ' + tex(answer)));
    }
    return step('asked', 'Что нужно найти', blocks);
  }
  var y0 = exact(q.y0);
  var rhs = sub(y0, frac(cv.d));
  var k = q.n;
  var blocks2 = [
    text('Нужно найти ' + m('x') + ', при котором ' + m('f(x) = ' + tex(y0)) + '. Записываем уравнение:'),
    formula(aT + '^{' + exponent(cv.c) + '}' + term(frac(cv.d)) + ' = ' + tex(y0))
  ];
  if (cv.d !== 0) {
    blocks2.push(text('Переносим ' + m('b') + ' вправо, поменяв знак:'));
    blocks2.push(formula(aT + '^{' + exponent(cv.c) + '} = ' + tex(y0) + term(frac(-cv.d)) + ' = ' + tex(rhs)));
  }
  var pw2 = powerExplain(b, k);
  blocks2.push(text('Запишем правую часть степенью того же основания ' + m(P.baseTex(b)) + ':'));
  blocks2.push(formula(chain(pw2.tex)));
  blocks2.push(text('Значит, ' + m(tex(rhs) + ' = ' + aT + '^{' + k + '}') + '. Степени с одинаковым основанием ' +
    'равны, только когда равны показатели:'));
  blocks2.push(formula(exponent(cv.c) + ' = ' + k + (cv.c === 0 ? '' : ' \\;\\Rightarrow\\; x = ' + k + term(frac(-cv.c)) +
    ' = ' + tex(answer))));
  return step('asked', 'Что нужно найти', blocks2);
}

function stepAnswer(meta, cv, A, B, answer) {
  var b = cv.base;
  var up = P.growing(b);
  var blocks = [];
  var asym = 'y = ' + tex(frac(cv.d));
  if (meta.rule === 'value-at') {
    var x0 = num(exact(meta.query.x0));
    var right = A.x > B.x ? A : B, left = A.x > B.x ? B : A;
    var cmp = x0 > right.x ? (up ? 'больше ' + m(tex(f0(right.y))) : 'меньше ' + m(tex(f0(right.y))) + ', но выше асимптоты')
      : x0 < left.x ? (up ? 'меньше ' + m(tex(f0(left.y))) + ', но выше асимптоты' : 'больше ' + m(tex(f0(left.y))))
      : 'между ординатами отмеченных точек';
    blocks.push(text('Проверка по графику: функция ' + (up ? 'возрастает' : 'убывает') + ', асимптота ' + m(asym) +
      ', весь график выше неё. Точка ' + m('x = ' + tex(frac(x0))) + ' лежит ' +
      (x0 > right.x ? 'правее' : x0 < left.x ? 'левее' : 'между') + ' отмеченных точек, поэтому значение ' +
      cmp + '. Ответ ' + m(tex(answer)) + (num(answer) > cv.d ? ' больше ' + m(tex(frac(cv.d))) : '') +
      ' — похоже на правду.'));
  } else if (meta.rule === 'argument-for') {
    var y0 = num(exact(meta.query.y0));
    blocks.push(text('Проверка по графику: значение ' + m(tex(exact(meta.query.y0))) + ' выше асимптоты ' + m(asym) +
      ' — решение есть, и оно одно: функция ' + (up ? 'возрастает' : 'убывает') + '. ' +
      (y0 > Math.max(A.y, B.y)
        ? 'Значение больше ординат отмеченных точек, значит, ' + m('x') + ' лежит ' + (up ? 'правее' : 'левее') + ' них'
        : 'Значение меньше ординат отмеченных точек, значит, ' + m('x') + ' лежит ' + (up ? 'левее' : 'правее') + ' них') +
      ': ' + m('x = ' + tex(answer)) + ' — похоже на правду.'));
    blocks.push(text('Проверка подстановкой: ' + m('f(' + tex(answer) + ') = ' + tex(exact(meta.query.y0))) + ' — верно.'));
  } else if (meta.rule === 'coef-a') {
    blocks.push(text('Проверка по графику: функция ' + (up ? 'возрастает — основание больше единицы' :
      'убывает — основание меньше единицы') + ', ' + m('a = ' + tex(answer)) + ' — сходится.'));
  } else {
    blocks.push(text(meta.form === 'shiftY'
      ? 'Проверка по графику: асимптота — прямая ' + m(asym) + ', график целиком по одну сторону от неё — сходится.'
      : 'Проверка по графику: при ' + m('x = ' + tex(frac(-cv.c))) + ' показатель равен нулю и ' +
        m('f(x) = 1') + ' — график проходит через ' + m('(' + tex(frac(-cv.c)) + ';\\, 1)') + '.'));
  }
  blocks.push(answerBlock(answer));
  return step('answer', 'Проверка по графику и ответ', blocks);
}

/** Точки разбора: первая — ближе к началу показателя (с ней проще). */
function orderedMarks(points) {
  var marks = points.filter(function (p) { return p.role === 'mark'; });
  return marks.slice().sort(function (a, b) { return Math.abs(a.n) - Math.abs(b.n) || a.x - b.x; });
}

function fromTask(task) {
  var meta = task.meta;
  var built = E.fromMeta(meta);
  var cv = built.curve;
  var marks = orderedMarks(meta.points);
  var A = marks[0], B = marks[1];
  var answer = exact(meta.answer);
  var steps = [stepPoints(meta, A, B), stepSystem(meta, A, B), stepA(meta, cv, A, B), stepB(meta, cv, A)];
  if (!(meta.rule === 'coef-a' && meta.form === 'basic')) { steps.push(stepAsked(meta, cv, answer)); }
  steps.push(stepAnswer(meta, cv, A, B, answer));
  return steps.filter(Boolean).map(function (item, index) {
    return { number: index + 1, id: item.id, title: item.title, arrow: null, blocks: item.blocks };
  });
}

const api = { fromTask: fromTask, equationTex: equationTex, formTex: formTex, orderedMarks: orderedMarks,
              powerExplain: powerExplain, solveA: solveA, chain: chain };

export default api;
export { fromTask, equationTex, formTex, orderedMarks, powerExplain, solveA, chain };
