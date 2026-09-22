/* graph/solution-quadratic.js — разбор задачи о параболе: семь шагов.

   Схема одна и та же для всех задач подтемы, сколько бы действий ни
   требовалось:

     1. Куда направлены ветви?
     2. Находим c по оси Oy
     3. Вершина и ось симметрии
     4. Находим a шагом от вершины
     5. Находим b
     6. Записываем формулу целиком
     7. Отвечаем на вопрос задачи

   Ученик привыкает к порядку и не разгадывает каждый раз заново.
   Там, где шаг сделать нечем — точка (0; c) за кадром, вершина не
   отмечена, — разбор так и говорит и переносит действие в тот шаг,
   где оно выполнимо. Выдуманных шагов здесь нет.

   Модуль отдаёт структуру: шаги, внутри — блоки (текст, формула,
   врезка, ответ). Разметку и анимацию делает страница, набор формул —
   KaTeX через data-tex. Здесь нет ни DOM, ни стилей.

   Все числа считаются точными дробями (families/line.js): при a = 0,25
   округление увело бы и вершину, и ответ.

   Тон: обращаемся на «мы», объясняем «почему», а не только «что
   сделать». Слова «просто», «очевидно», «легко», «всего лишь»
   не употребляются: тому, кто не понял, они звучат как упрёк.
*/

import Line from './families/line.js';
import Q from './families/quadratic.js';

var MINUS = '−';

var frac = Line.frac;
var add = Line.add;
var sub = Line.sub;
var mul = Line.mul;
var div = Line.div;
var num = Line.num;
var isInt = Line.isInt;
var isZero = Line.isZero;

/* ══════════════════════════════════════════════════════════
   Числа: текстом и в формулу
   ══════════════════════════════════════════════════════════ */

/** Конечная десятичная запись есть, если знаменатель — только 2 и 5. */
function decimalFriendly(f) {
  var q = Math.abs(f.q);
  while (q % 2 === 0) { q /= 2; }
  while (q % 5 === 0) { q /= 5; }
  return q === 1;
}

/** Число в текст: запятая и типографский минус. */
function plain(f) {
  return String(Math.round(num(f) * 1e6) / 1e6).replace('.', ',').replace('-', MINUS);
}

/** Число в формулу: десятичная, где она конечна, иначе обыкновенная дробь. */
function tex(f) {
  if (decimalFriendly(f)) {
    return String(Math.round(num(f) * 1e6) / 1e6).replace('.', '{,}');
  }
  return (f.p < 0 ? '-' : '') + '\\dfrac{' + Math.abs(f.p) + '}{' + f.q + '}';
}

/** Число в формулу со скобками у отрицательного: f(−4) читается только так. */
function texBracket(f) {
  var body = tex(f);
  if (f.p >= 0) { return body; }
  return decimalFriendly(f) ? '(' + body + ')' : '\\left(' + body + '\\right)';
}

/** Коэффициент перед буквой: 1 и −1 не пишутся. */
function coef(f) {
  if (isInt(f) && f.p === 1) { return ''; }
  if (isInt(f) && f.p === -1) { return '-'; }
  return tex(f);
}

/** Слагаемое со знаком: « + 3», « − 0,5». Ноль не пишется вовсе. */
function term(f, tail) {
  if (isZero(f)) { return ''; }
  var body = tail === undefined ? '' : tail;
  var sign = f.p > 0 ? ' + ' : ' - ';
  var abs = frac(Math.abs(f.p), f.q);
  return sign + (body === '' ? tex(abs) : (isInt(abs) && abs.p === 1 ? '' : tex(abs)) + body);
}

/** Точка координатами: «(2; −3)». */
function pointText(x, y) {
  return '(' + plain(x) + ';\\, ' + plain(y) + ')';
}

function pointTex(x, y) {
  return '(' + tex(x) + ';\\, ' + tex(y) + ')';
}

/* ══════════════════════════════════════════════════════════
   Блоки разбора
   ══════════════════════════════════════════════════════════ */

function text(html) { return { type: 'text', html: html }; }
function formula(tx) { return { type: 'formula', tex: tx }; }

/* Формула внутри текста — той же разметкой, что и отдельная:
   KaTeX заменит её вёрсткой. Внутри лежит запасная запись —
   она видна, только пока KaTeX не отработал. */
function math(tx, fallback) {
  return '<span class="math" data-tex="' + escapeAttr(tx) + '">' +
    (fallback === undefined ? '' : escapeAttr(fallback)) + '</span>';
}

function escapeAttr(value) {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function key(value) { return '<b class="key">' + value + '</b>'; }

/** Выделенное число в тексте: формулой и полужирным. */
function keyMath(tx, fallback) { return key(math(tx, fallback)); }

/* ══════════════════════════════════════════════════════════
   Разбор чертежа: что на нём отмечено
   ══════════════════════════════════════════════════════════ */

function markOf(points, role) {
  var found = (points || []).filter(function (point) { return point.role === role; });
  return found.length ? found[0] : null;
}

/** Отмеченные узлы сетки, кроме вершины и точки на оси Oy. */
function plainMarks(points) {
  return (points || []).filter(function (point) {
    return point.role !== 'vertex' && point.role !== 'intercept' && point.role !== 'cross';
  });
}

/** Читается ли c прямо с чертежа: точка (0; c) в узле и внутри окна. */
function interceptVisible(p, win) {
  return isInt(p.c) && !!win && Math.abs(p.cValue) <= win.ymax - 1;
}

/** Вершина читается с чертежа: координаты кратны половине клетки. */
function vertexReadable(p, win) {
  var half = function (f) { return isInt(mul(frac(2), f)); };
  return half(p.m) && half(p.n) && !!win &&
    Math.abs(p.mValue) <= win.xmax - 1 && Math.abs(p.nValue) <= win.ymax - 1;
}

/** Пара отмеченных точек на одной высоте: вершина стоит посередине. */
function symmetricPair(marks) {
  for (var i = 0; i < marks.length; i++) {
    for (var j = i + 1; j < marks.length; j++) {
      if (marks[i].y === marks[j].y && marks[i].x !== marks[j].x) {
        return marks[i].x < marks[j].x ? [marks[i], marks[j]] : [marks[j], marks[i]];
      }
    }
  }
  return null;
}

/* Точка для шага от вершины: ближайшая к ней отмеченная. Чем ближе,
   тем меньше клеток считать. */
function stepPoint(marks, p) {
  var best = null;
  marks.forEach(function (point) {
    var away = Math.abs(point.x - p.mValue);
    if (away < 1e-9) { return; }
    if (best === null || away < Math.abs(best.x - p.mValue)) { best = point; }
  });
  return best;
}

/* ══════════════════════════════════════════════════════════
   Шаг 1. Куда направлены ветви
   ══════════════════════════════════════════════════════════ */
function stepDirection(p) {
  var up = p.aValue > 0;
  var blocks = [text('Сначала спросим себя: куда направлены ветви параболы?')];

  if (up) {
    blocks.push(text('Ветви идут вверх, вершина — самая нижняя точка графика. Значит ' +
      keyMath('a > 0', 'a > 0') + '.'));
  } else {
    blocks.push(text('Ветви идут вниз, вершина — самая высокая точка графика. Значит ' +
      keyMath('a < 0', 'a < 0') + '.'));
    blocks.push(text('Знак минус мы уже знаем — запишем его сразу, чтобы потом не потерять.'));
  }

  return { title: 'Куда направлены ветви?', arrow: up ? 'up' : 'down', blocks: blocks };
}

/* ══════════════════════════════════════════════════════════
   Шаг 2. Находим c по оси Oy
   ══════════════════════════════════════════════════════════ */
function stepIntercept(p, win, points) {
  var blocks = [
    text('Подставим ' + math('x = 0', 'x = 0') + ' в ' +
      math('y = ax^2 + bx + c', 'y = ax² + bx + c') +
      ': слагаемые с ' + math('x^2', 'x²') + ' и с ' + math('x', 'x') +
      ' обращаются в ноль, остаётся ' + math('y = c', 'y = c') + '.'),
    text('Значит ' + math('c', 'c') + ' — ордината точки, где парабола пересекает ось ' +
      math('Oy', 'Oy') + '.')
  ];

  if (interceptVisible(p, win)) {
    var marked = markOf(points, 'intercept') !== null;
    blocks.push(text('Смотрим на чертёж: пересечение с осью ' + math('Oy', 'Oy') +
      (marked ? ' отмечено — это точка ' : ' — это точка ') +
      keyMath(pointTex(frac(0), p.c), '(0; ' + plain(p.c) + ')') + '. Значит ' +
      keyMath('c = ' + tex(p.c), 'c = ' + plain(p.c)) + '.'));
    return { title: 'Находим c по оси Oy', blocks: blocks, found: true };
  }

  blocks.push(text(isInt(p.c)
    ? 'Здесь пересечение с осью ' + math('Oy', 'Oy') + ' за пределами чертежа: смотреть нечего.'
    : 'Здесь пересечение с осью ' + math('Oy', 'Oy') +
      ' попадает не в узел сетки: точное значение с чертежа не снять.'));
  blocks.push(text('Угадывать нельзя — «примерно» в ответе не бывает. Найдём ' +
    math('c', 'c') + ' счётом, когда узнаем ' + math('a', 'a') + ' и вершину.'));
  return { title: 'Находим c по оси Oy', blocks: blocks, found: false };
}

/* ══════════════════════════════════════════════════════════
   Шаг 3. Вершина и ось симметрии
   ══════════════════════════════════════════════════════════ */
function stepVertex(p, win, points) {
  var vertex = markOf(points, 'vertex');
  var marks = plainMarks(points);
  var pair = symmetricPair(marks);
  var blocks = [];

  if (vertex !== null) {
    blocks.push(text('Вершина отмечена на чертеже: ' +
      keyMath(pointTex(p.m, p.n), pointText(p.m, p.n)) + '.'));
    blocks.push(text('Через неё проходит ось симметрии — вертикальная прямая ' +
      math('x = ' + tex(p.m), 'x = ' + plain(p.m)) +
      '. По обе стороны от неё парабола устроена одинаково.'));
    return { title: 'Вершина и ось симметрии', blocks: blocks, known: true };
  }

  /* Отмеченных узлов меньше двух — системы из них не составить.
     Зато сама вершина на чертеже видна: это точка поворота графика,
     и её координаты попадают в узел сетки или в середину клетки. */
  if (marks.length < 2 && vertexReadable(p, win)) {
    blocks.push(text('Отметки вершины на чертеже нет, но она видна и так: ' +
      'в этой точке график поворачивает. Её координаты — ' +
      keyMath(pointTex(p.m, p.n), pointText(p.m, p.n)) + '.'));
    blocks.push(text('Через неё проходит ось симметрии — вертикальная прямая ' +
      math('x = ' + tex(p.m), 'x = ' + plain(p.m)) + '.'));
    return { title: 'Вершина и ось симметрии', blocks: blocks, known: true };
  }

  if (pair !== null) {
    var middle = div(add(frac(pair[0].x), frac(pair[1].x)), frac(2));
    blocks.push(text('Вершина не отмечена, но две отмеченные точки стоят на одной высоте: ' +
      math(pointTex(frac(pair[0].x), frac(pair[0].y)), pointText(frac(pair[0].x), frac(pair[0].y))) +
      ' и ' +
      math(pointTex(frac(pair[1].x), frac(pair[1].y)), pointText(frac(pair[1].x), frac(pair[1].y))) +
      '.'));
    blocks.push(text('Парабола симметрична, поэтому такие точки стоят на равном расстоянии ' +
      'от оси симметрии: вершина ровно посередине между ними.'));
    blocks.push(formula('x_{\\text{в}} = \\dfrac{' + tex(frac(pair[0].x)) + ' + ' +
      texBracket(frac(pair[1].x)) + '}{2} = ' + tex(middle)));
    blocks.push(text('Ординату вершины по симметрии не получить — её на чертеже нет. ' +
      'Но абсциссы уже хватает: через неё выражается ' + math('b', 'b') + '.'));
    return { title: 'Вершина и ось симметрии', blocks: blocks, known: true,
             abscissaOnly: true, middle: middle };
  }

  blocks.push(text('Вершина на чертеже не отмечена, и пары точек на одной высоте тоже нет.'));
  blocks.push(text('Тогда вершину оставляем на потом: её абсцисса считается по формуле ' +
    math('x_{\\text{в}} = -\\dfrac{b}{2a}', 'xв = −b/(2a)') +
    ', а ' + math('a', 'a') + ' и ' + math('b', 'b') + ' мы найдём из отмеченных точек.'));
  return { title: 'Вершина и ось симметрии', blocks: blocks, known: false };
}

/* ══════════════════════════════════════════════════════════
   Шаг 4. Находим a
   ══════════════════════════════════════════════════════════ */
function stepSlope(p, win, points, knownA, vertex, interceptFound) {
  var blocks = [];
  var vertexKnown = vertex.known === true && vertex.abscissaOnly !== true;

  if (knownA) {
    blocks.push(text('Коэффициент ' + math('a', 'a') + ' дан в условии: ' +
      keyMath('a = ' + tex(p.a), 'a = ' + plain(p.a)) + '. Считать его по чертежу не нужно.'));
    return { title: 'Коэффициент a дан в условии', blocks: blocks, found: true };
  }

  /* Вершина найдена по симметрии: известна только её абсцисса.
     Тогда b выражаем через неё, а a находим подстановкой точки. */
  if (vertex.abscissaOnly === true) {
    var spot = plainMarks(points)[0];
    if (spot !== undefined && interceptFound) {
      var x1 = frac(spot.x);
      var y1 = frac(spot.y);
      blocks.push(text('Ординаты вершины у нас нет, поэтому шагом от вершины ' +
        math('a', 'a') + ' не возьмёшь. Зато из формулы вершины ' +
        math('x_{\\text{в}} = -\\dfrac{b}{2a}', 'xв = −b/(2a)') + ' следует'));
      blocks.push(formula('b = -2a \\cdot x_{\\text{в}} = ' +
        tex(mul(frac(-2), vertex.middle)) + 'a'));
      blocks.push(text('Подставим это и уже известное ' +
        math('c = ' + tex(p.c), 'c = ' + plain(p.c)) + ' в уравнение с отмеченной точкой ' +
        math(pointTex(x1, y1), pointText(x1, y1)) + ':'));
      blocks.push(formula(tex(y1) + ' = a \\cdot ' + texBracket(x1) + '^2 ' +
        (num(mul(frac(-2), vertex.middle)) < 0 ? '-' : '+') + ' ' +
        tex(frac(Math.abs(mul(frac(-2), vertex.middle).p), mul(frac(-2), vertex.middle).q)) +
        'a \\cdot ' + texBracket(x1) + term(p.c)));
      blocks.push(text('Остаётся одно уравнение с одним неизвестным:'));
      blocks.push(formula('a = ' + tex(p.a)));
      return { title: 'Находим a подстановкой точки', blocks: blocks, found: true };
    }
  }

  var marks = plainMarks(points);
  /* Отмеченной точки может не быть — например, в задачах с двумя
     графиками. Тогда берём любой узел сетки, через который проходит
     парабола: на чертеже он виден так же. */
  var fromChart = false;
  if (marks.length === 0 && win) {
    var nodes = Q.integerPoints(p, win).filter(function (point) {
      return Math.abs(point.x - p.mValue) > 1e-9;
    });
    /* Узел, на котором уже стоит отметка пересечения, берём в
       последнюю очередь: на чертеже он занят другой ролью. */
    var free = nodes.filter(function (node) {
      return !(points || []).some(function (mark) {
        return mark.role === 'cross' && mark.x === node.x && mark.y === node.y;
      });
    });
    marks = free.length ? free : nodes;
    fromChart = marks.length > 0;
  }
  var probe = vertexKnown ? stepPoint(marks, p) : null;

  if (probe !== null) {
    var dx = sub(frac(probe.x), p.m);
    var dy = sub(frac(probe.y), p.n);
    blocks.push(text('В записи через вершину ' +
      math('y = a(x - m)^2 + n', 'y = a(x − m)² + n') + ' шаг от вершины в сторону ' +
      'меняет значение на ' + math('a', 'a') + ' при шаге на клетку и на ' +
      math('4a', '4a') + ' при шаге на две.'));
    blocks.push(text('От вершины до ' + (fromChart ? 'узла сетки ' : 'отмеченной точки ') +
      math(pointTex(frac(probe.x), frac(probe.y)), pointText(frac(probe.x), frac(probe.y))) +
      ' по горизонтали ' + key(plain(dx)) + ', по вертикали ' + key(plain(dy)) + '.'));
    blocks.push(formula('a = \\dfrac{' + tex(dy) + '}{' + texBracket(dx) + '^2} = ' + tex(p.a)));
    blocks.push(text('Получили ' + keyMath('a = ' + tex(p.a), 'a = ' + plain(p.a)) + '.'));
    return { title: 'Находим a шагом от вершины', blocks: blocks, found: true };
  }

  /* Вершина неизвестна: a и b находятся вместе, из системы. */
  var pair = marks.slice(0, 2);
  if (pair.length === 2) {
    blocks.push(text('Вершины нет, зато есть ' + math('c', 'c') +
      ' и две точки с целыми координатами. Подставим каждую в ' +
      math('y = ax^2 + bx + c', 'y = ax² + bx + c') + ' — получится система на ' +
      math('a', 'a') + ' и ' + math('b', 'b') + '.'));
    pair.forEach(function (point) {
      blocks.push(formula(tex(frac(point.y)) + ' = a \\cdot ' + texBracket(frac(point.x)) +
        '^2 + b \\cdot ' + texBracket(frac(point.x)) + term(p.c)));
    });
    var first = { x: frac(pair[0].x), y: frac(pair[0].y) };
    var second = { x: frac(pair[1].x), y: frac(pair[1].y) };
    blocks.push(text('Переносим ' + math('c', 'c') + ' влево и приводим:'));
    [first, second].forEach(function (point) {
      blocks.push(formula(coef(mul(point.x, point.x)) + 'a' + term(point.x, 'b') +
        ' = ' + tex(sub(point.y, p.c))));
    });
    blocks.push(text('Решаем систему — и сразу получаем оба коэффициента: ' +
      keyMath('a = ' + tex(p.a), 'a = ' + plain(p.a)) + ' и ' +
      keyMath('b = ' + tex(p.b), 'b = ' + plain(p.b)) + '.'));
    return { title: 'Находим a и b из системы', blocks: blocks, found: true, bySystem: true };
  }

  blocks.push(text('Отмеченных точек для счёта не хватает, поэтому ' + math('a', 'a') +
    ' возьмём из записи функции: ' + keyMath('a = ' + tex(p.a), 'a = ' + plain(p.a)) + '.'));
  return { title: 'Находим a', blocks: blocks, found: true };
}

/* ══════════════════════════════════════════════════════════
   Шаг 5. Находим b
   ══════════════════════════════════════════════════════════ */
function stepB(p, vertexKnown, bySystem) {
  var blocks = [];

  if (bySystem) {
    blocks.push(text('Коэффициент ' + math('b', 'b') +
      ' получился вместе с ' + math('a', 'a') + ' из той же системы: ' +
      keyMath('b = ' + tex(p.b), 'b = ' + plain(p.b)) + '.'));
    blocks.push(text('Проверить себя можно так: подставить найденные ' + math('a', 'a') +
      ' и ' + math('b', 'b') + ' во вторую отмеченную точку — равенство должно сойтись. ' +
      'Заодно по формуле вершины видно, где она стоит: ' +
      math('x_{\\text{в}} = -\\dfrac{b}{2a} = ' + tex(p.m), 'xв = ' + plain(p.m)) + '.'));
    return { title: 'Находим b', blocks: blocks };
  }

  if (vertexKnown) {
    blocks.push(text('Абсцисса вершины связана с коэффициентами формулой:'));
    blocks.push(formula('x_{\\text{в}} = -\\dfrac{b}{2a}'));
    blocks.push(text('Подставим то, что уже знаем, и выразим ' + math('b', 'b') + ':'));
    blocks.push(formula(tex(p.m) + ' = -\\dfrac{b}{2 \\cdot ' + texBracket(p.a) + '}'));
    blocks.push(formula('b = -2 \\cdot ' + texBracket(p.a) + ' \\cdot ' + texBracket(p.m) +
      ' = ' + tex(p.b)));
    blocks.push(text('Получили ' + keyMath('b = ' + tex(p.b), 'b = ' + plain(p.b)) + '.'));
    return { title: 'Находим b', blocks: blocks };
  }

  blocks.push(text('Коэффициент ' + math('b', 'b') + ' считается по вершине и ' +
    math('a', 'a') + ': ' + math('b = -2a \\cdot x_{\\text{в}}', 'b = −2a · xв') + '.'));
  blocks.push(formula('b = -2 \\cdot ' + texBracket(p.a) + ' \\cdot ' + texBracket(p.m) +
    ' = ' + tex(p.b)));
  return { title: 'Находим b', blocks: blocks };
}

/* ══════════════════════════════════════════════════════════
   Шаг 6. Записываем формулу целиком
   ══════════════════════════════════════════════════════════ */

/** Запись y = ax² + bx + c готовой строкой TeX. */
function equationTex(p, name) {
  var head = (name === undefined ? 'y' : name) + ' = ';
  var body = coef(p.a) + 'x^2' + term(p.b, 'x') + term(p.c);
  return head + body;
}

/** Запись через вершину: a(x − m)² + n. При m = 0 скобки не нужны. */
function vertexFormTex(p) {
  var body = isZero(p.m)
    ? 'x^2'
    : '(x ' + (num(p.m) < 0 ? '+ ' + tex(frac(-p.m.p, p.m.q)) : '- ' + tex(p.m)) + ')^2';
  return coef(p.a) + body + term(p.n);
}

/** Запись прямой: y = kx + b. */
function lineTex(line, name) {
  var head = (name === undefined ? 'y' : name) + ' = ';
  if (isZero(line.k)) { return head + tex(line.b); }
  var body = coef(line.k) + 'x' + term(line.b);
  return head + body;
}

function stepFormula(p, second, interceptFound) {
  var blocks = [];

  if (!interceptFound) {
    blocks.push(text('Вернёмся к ' + math('c', 'c') +
      '. Раскроем запись через вершину — свободный член и будет ' + math('c', 'c') + ':'));
    blocks.push(formula('c = a \\cdot ' + texBracket(p.m) + '^2 + ' + texBracket(p.n) +
      ' = ' + tex(p.c)));
  }

  blocks.push(text('Собираем всё вместе:'));
  blocks.push(formula(equationTex(p, second === null ? 'y' : 'f(x)')));

  if (second !== null) {
    blocks.push(text('Теперь вторая линия на чертеже.'));
    if (second.kind === 'line') {
      blocks.push(text('Это прямая: по двум её точкам в узлах сетки находим наклон ' +
        math('k', 'k') + ' и свободный член. Получается'));
      blocks.push(formula(lineTex(second.line, 'g(x)')));
    } else {
      blocks.push(text('Это вторая парабола. Её вершина отмечена — ' +
        math(pointTex(second.curve.m, second.curve.n),
          pointText(second.curve.m, second.curve.n)) +
        ', — и шаг от вершины даёт её старший коэффициент. Получается'));
      blocks.push(formula(equationTex(second.curve, 'g(x)')));
    }
  }

  return { title: 'Записываем формулу целиком', blocks: blocks };
}

/* ══════════════════════════════════════════════════════════
   Шаг 7. Отвечаем на вопрос задачи
   ══════════════════════════════════════════════════════════ */

function answerBlock(answer) {
  return { type: 'answer', html: 'Ответ: ' + key(answer) };
}

function stepAnswer(p, options) {
  var rule = options.rule;
  var answer = options.answer;
  var blocks = [];

  if (rule === 'sign-a') {
    blocks.push(text('Вопрос был о знаке ' + math('a', 'a') +
      '. Ветви ' + (p.aValue > 0 ? 'направлены вверх' : 'направлены вниз') + ', значит ' +
      keyMath(p.aValue > 0 ? 'a > 0' : 'a < 0', p.aValue > 0 ? 'a > 0' : 'a < 0') + '.'));
    blocks.push(answerBlock(p.aValue > 0 ? 'a > 0' : 'a < 0'));
    return { title: 'Отвечаем на вопрос', blocks: blocks };
  }

  if (rule === 'a' || rule === 'b' || rule === 'c') {
    var value = rule === 'a' ? p.a : rule === 'b' ? p.b : p.c;
    blocks.push(text('Вопрос был о коэффициенте ' + math(rule, rule) +
      ' — он уже найден.'));
    blocks.push(answerBlock(plain(value)));
    return { title: 'Отвечаем на вопрос', blocks: blocks };
  }

  if (rule === 'equation-choice') {
    blocks.push(text('Осталось найти среди вариантов ту же самую запись:'));
    blocks.push(formula(equationTex(p)));
    blocks.push(text('Это вариант ' + key(answer) + '.'));
    blocks.push(answerBlock(answer));
    return { title: 'Отвечаем на вопрос', blocks: blocks };
  }

  if (rule === 'value-at') {
    var x0 = Q.toExact(options.query.x0);
    blocks.push(text('Нужно значение функции при ' +
      math('x = ' + tex(x0), 'x = ' + plain(x0)) +
      '. Эта точка за пределами чертежа, поэтому считаем по формуле.'));
    blocks.push(text('Подставлять удобнее в запись через вершину: там одно возведение ' +
      'в квадрат и одно умножение.'));
    blocks.push(formula('f(x) = ' + vertexFormTex(p)));
    var shift = sub(x0, p.m);
    var factor = coef(p.a) === '' ? '' : coef(p.a) === '-' ? '-' : coef(p.a) + ' \\cdot ';
    blocks.push(formula('f(' + tex(x0) + ') = ' + factor + '(' + tex(shift) + ')^2' +
      term(p.n) + ' = ' + tex(Q.yAt(p, x0))));
    blocks.push(answerBlock(plain(Q.yAt(p, x0))));
    return { title: 'Отвечаем на вопрос', blocks: blocks };
  }

  if (rule === 'argument-for') {
    var y0 = Q.toExact(options.query.y0);
    var roots = Q.xForValue(p, y0) || [];
    var pick = options.query.pick;
    var words = { larger: 'больший', smaller: 'меньший',
                  positive: 'положительный', negative: 'отрицательный' };
    blocks.push(text('Нужно найти ' + math('x', 'x') + ', при котором ' +
      math('f(x) = ' + tex(y0), 'f(x) = ' + plain(y0)) + '. Составим уравнение:'));
    blocks.push(formula(equationTex(p, 'f(x)').replace('f(x) = ', '') + ' = ' + tex(y0)));
    if (roots.length === 2) {
      blocks.push(text('Квадратное уравнение даёт два корня, и они стоят симметрично ' +
        'относительно оси параболы:'));
      blocks.push(formula('x_1 = ' + tex(roots[0]) + ', \\quad x_2 = ' + tex(roots[1])));
      blocks.push(text('В условии сказано, какой из них нужен: ' +
        key(words[pick] || 'нужный') + '.'));
    }
    blocks.push(answerBlock(answer));
    return { title: 'Отвечаем на вопрос', blocks: blocks };
  }

  if (rule === 'intersection-x' || rule === 'intersection-y') {
    return stepIntersectionAnswer(p, options, blocks);
  }

  blocks.push(text('Ответ читается из формулы, которую мы выписали.'));
  blocks.push(answerBlock(answer));
  return { title: 'Отвечаем на вопрос', blocks: blocks };
}

/* Пересечение двух графиков: приравниваем формулы, один корень виден
   на чертеже, второй — из суммы корней. */
function stepIntersectionAnswer(p, options, blocks) {
  var cross = options.intersection;
  var second = options.second;
  var shown = cross.points.filter(function (point) { return point.shown; })[0];
  var asked = cross.asked;

  /* Вторая кривая приводится к виду a₂x² + b₂x + c₂: у прямой a₂ = 0. */
  var a2 = second.kind === 'line' ? frac(0) : second.curve.a;
  var b2 = second.kind === 'line' ? second.line.k : second.curve.b;
  var c2 = second.kind === 'line' ? second.line.b : second.curve.c;

  var A = sub(p.a, a2);
  var B = sub(p.b, b2);

  blocks.push(text('Точки пересечения — это те ' + math('x', 'x') +
    ', при которых значения обеих функций совпадают. Приравниваем формулы:'));
  blocks.push(formula(equationTex(p, 'f(x)').replace('f(x) = ', '') + ' = ' +
    (second.kind === 'line' ? lineTex(second.line, 'g(x)').replace('g(x) = ', '')
                            : equationTex(second.curve, 'g(x)').replace('g(x) = ', ''))));
  blocks.push(text('Переносим всё в одну сторону и приводим подобные:'));
  blocks.push(formula(coef(A) + 'x^2' + term(B, 'x') + term(sub(p.c, c2)) + ' = 0'));

  blocks.push(text('Один корень мы знаем: это абсцисса отмеченной точки ' +
    keyMath(pointTex(Q.toExact(shown.x), Q.toExact(shown.y)),
      pointText(Q.toExact(shown.x), Q.toExact(shown.y))) + '.'));
  blocks.push(text('Сумма корней квадратного уравнения равна ' +
    math('-\\dfrac{B}{A}', '−B/A') + ', поэтому второй корень находится вычитанием:'));

  var sum = div(mul(frac(-1), B), A);
  var x2 = sub(sum, Q.toExact(shown.x));
  blocks.push(formula('x_1 + x_2 = ' + tex(sum) + ', \\quad x_2 = ' + tex(sum) + ' - ' +
    texBracket(Q.toExact(shown.x)) + ' = ' + tex(x2)));

  if (options.rule === 'intersection-y') {
    blocks.push(text('Спрашивают ординату, поэтому подставим найденный ' + math('x', 'x') +
      ' в ту формулу, которая проще:'));
    var y2 = second.kind === 'line'
      ? add(mul(second.line.k, x2), second.line.b)
      : Q.yAt(p, x2);
    blocks.push(formula('y = ' + tex(y2)));
  }

  blocks.push(text('Вторая точка пересечения — ' +
    keyMath(pointTex(Q.toExact(asked.x), Q.toExact(asked.y)),
      pointText(Q.toExact(asked.x), Q.toExact(asked.y))) +
    '. С чертежа её было не прочитать: ' +
    (cross.hidden === 'fraction' ? 'она не попадает в узел сетки.'
                                 : 'она лежит за рамкой окна.')));
  blocks.push(answerBlock(options.answer));
  return { title: 'Отвечаем на вопрос', blocks: blocks };
}

/* ══════════════════════════════════════════════════════════
   Сборка
   ══════════════════════════════════════════════════════════ */

/**
 * Разбор задачи о параболе.
 *
 * options = {
 *   curve:  точная парабола (families/quadratic.js),
 *   window: окно чертежа,
 *   points: отмеченные точки с ролями,
 *   second: вторая кривая сцены или null,
 *   task:   { rule, answer, knownA, query, intersection }
 * }
 */
function build(options) {
  var p = options.curve;
  var win = options.window;
  var points = options.points || [];
  var second = options.second || null;
  var task = options.task || {};

  var direction = stepDirection(p);
  var intercept = stepIntercept(p, win, points);
  var vertex = stepVertex(p, win, points);
  var slope = stepSlope(p, win, points, task.knownA === true, vertex, intercept.found);
  var b = stepB(p, vertex.known, slope.bySystem === true);
  var formulaStep = stepFormula(p, second, intercept.found);
  var answer = stepAnswer(p, {
    rule: task.rule,
    answer: task.answer,
    query: task.query,
    intersection: task.intersection,
    second: second
  });

  return [direction, intercept, vertex, slope, b, formulaStep, answer]
    .map(function (step, index) {
      return { number: index + 1, title: step.title,
               arrow: step.arrow || null, blocks: step.blocks };
    });
}

const api = { build: build, equationTex: equationTex, interceptVisible: interceptVisible };

export default api;
export { build, equationTex, interceptVisible };
