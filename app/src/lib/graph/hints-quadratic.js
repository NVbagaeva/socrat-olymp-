/* graph/hints-quadratic.js — подсказка тренажёра к задаче о параболе.

   Подсказка ведёт вопросами в том же порядке, что полное решение
   (graph/solution-quadratic.js), — тот же номер и то же название шага:

     1. Куда направлены ветви?          кнопки «вверх» / «вниз»
     2. Вершина в узле сетки?           «да» / «нет»; «да» — координаты
     3а. a во вспомогательной системе   Δx, Δy точки графика, затем a;
                                        на рисунке оси x′Oy′ от вершины
     3б. Ось симметрии по двум точкам   две точки на одной высоте, x₀,
                                        связь b = −2a·x₀; на рисунке —
                                        точки и ось симметрии
     4. Находим c по оси Oy             смысл c (кнопки), видно ли его
                                        (да / нет), значение
     5. b через абсциссу вершины        b; в случае «б» — точка для
                                        подстановки, затем a и b
     6. Формула                         выбор записи (кнопки), у задач с
                                        прямой — её k и m
     7. Ответ                           подстановка, корни, выбор корня

   Шаг — цепочка частей (parts). Часть — вопрос с кнопками (choice) или
   поля ввода (fields). У полей бывают:
     variants — другие верные наборы (любой узел, любая пара точек);
     traps    — значения, на которые нужно отдельное предупреждение
                (точка, симметричная (0; c), — тождество; точка из той
                же пары — новой информации не даст);
     sign     — пояснение, если число введено с неверным знаком.

   Подсказка кончается на шаге, где найдено то, о чём спрашивают.
   Формулы — TeX в $…$; набирает их lib/trainer.ts. Модуль без DOM: его
   читает и автопроверка scripts/check-quadratic-hints.mjs. */

import Line from './families/line.js';
import Q from './families/quadratic.js';
import Solution from './solution-quadratic.js';

var frac = Line.frac, sub = Line.sub, mul = Line.mul,
    num = Line.num, isInt = Line.isInt, isZero = Line.isZero;

/* ══════════════════════════════════════════════════════════
   Числа
   ══════════════════════════════════════════════════════════ */

function friendly(f) {
  var q = Math.abs(f.q);
  while (q % 2 === 0) { q /= 2; }
  while (q % 5 === 0) { q /= 5; }
  return q === 1;
}

function tex(f) {
  if (friendly(f)) { return String(Math.round(num(f) * 1e6) / 1e6).replace('.', '{,}'); }
  return (f.p < 0 ? '-' : '') + '\\dfrac{' + Math.abs(f.p) + '}{' + f.q + '}';
}

/* Ключ поля: так ученик и наберёт — десятичной дробью, а неконечную
   обыкновенной: «−1/3». */
function plain(f) {
  if (friendly(f)) { return String(Math.round(num(f) * 1e6) / 1e6).replace('.', ','); }
  return (f.p < 0 ? '-' : '') + Math.abs(f.p) + '/' + Math.abs(f.q);
}

function fr(value) { return typeof value === 'number' ? Line.toFrac(value) : value; }
function exact(o) { return o && o.p !== undefined ? frac(o.p, o.q) : fr(o); }

function coef(f) {
  if (isInt(f) && f.p === 1) { return ''; }
  if (isInt(f) && f.p === -1) { return '-'; }
  return tex(f);
}

function term(f, tail) {
  if (isZero(f)) { return ''; }
  var body = tail === undefined ? '' : tail;
  var abs = frac(Math.abs(f.p), f.q);
  return (f.p > 0 ? ' + ' : ' - ') +
    (body === '' ? tex(abs) : (isInt(abs) && abs.p === 1 ? '' : tex(abs)) + body);
}

function equationTex(a, b, c, name) {
  return (name || 'y') + ' = ' + coef(a) + 'x^2' + term(b, 'x') + term(c);
}

/* Детерминированное перемешивание кнопок по номеру задачи. */
function shuffle(list, key) {
  var h = 2166136261;
  for (var i = 0; i < key.length; i++) { h = Math.imul(h ^ key.charCodeAt(i), 16777619) >>> 0; }
  var out = list.slice();
  for (var j = out.length - 1; j > 0; j--) {
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
    var r = h % (j + 1);
    var tmp = out[j]; out[j] = out[r]; out[r] = tmp;
  }
  return out;
}

function choice(prompt, options, right, key) {
  var answer = options.filter(function (o) { return o.right; })[0];
  return { kind: 'choice', prompt: prompt, options: key ? shuffle(options, key) : options,
           right: right, answer: answer ? answer.key : null };
}

function fields(text, list, extra) {
  var part = { kind: 'fields', text: text, fields: list, variants: null, traps: null,
               sign: null, wrong: '', after: null };
  Object.keys(extra || {}).forEach(function (name) { part[name] = extra[name]; });
  return part;
}

function field(label, value) { return { label: label, answer: plain(value) }; }

function solutionTex(step) {
  return (step.blocks || []).filter(function (b) { return b.type === 'formula' && b.tex; })
    .map(function (b) { return b.tex; });
}

/* ══════════════════════════════════════════════════════════
   Шаги
   ══════════════════════════════════════════════════════════ */

function directionStep(p) {
  var up = num(p.a) > 0;
  return [choice('Куда направлены ветви параболы?', [
    { text: 'вверх', right: up, key: 'up',
      why: up ? null : 'Нет: концы графика уходят вниз — вершина самая высокая точка.' },
    { text: 'вниз', right: !up, key: 'down',
      why: up ? 'Нет: концы графика уходят вверх — вершина самая низкая точка.' : null }
  ], up ? 'Ветви вверх $\\Rightarrow$ $a > 0$.' : 'Ветви вниз $\\Rightarrow$ $a < 0$.')];
}

function vertexStep(p, inNode) {
  var parts = [choice('Найди вершину параболы. Она лежит в узле сетки (целые координаты)?', [
    { text: 'да', right: inNode, key: 'yes',
      why: inNode ? null : 'Нет: вершина стоит между линиями сетки — её координаты не целые, ' +
        'с чертежа их точно не снять.' },
    { text: 'нет', right: !inNode, key: 'no',
      why: inNode ? 'Посмотри ещё раз: вершина стоит точно на пересечении линий сетки.' : null }
  ], inNode ? 'Верно: вершина в узле — её координаты читаются с чертежа.'
    : 'Верно: вершина не в узле — пойдём через симметричные точки.')];
  if (inNode) {
    parts.push(fields('Запиши координаты вершины.', [field('x_{\\text{в}} =', p.m),
      field('y_{\\text{в}} =', p.n)], {
      wrong: 'Вершина — точка поворота параболы: самая низкая при ветвях вверх, самая высокая ' +
        'при ветвях вниз. Считай клетки от начала координат.'
    }));
  }
  return parts;
}

/* Узлы сетки на кривой: Δx, Δy от вершины и a — любой подходит. */
function nodeTuples(p, win) {
  return Solution.curveNodes(p, win).map(function (node) {
    return [plain(sub(frac(node.x), p.m)), plain(sub(frac(node.y), p.n))];
  });
}

function auxStep(p, win, sol) {
  var f = sol.facts;
  var dx = f.dx || sub(frac(f.point.x), p.m);
  var dy = f.dy || sub(frac(f.point.y), p.n);
  var up = num(p.a) > 0;
  return [
    fields('В новой системе координат с началом в вершине парабола имеет вид $y\' = ax\'^2$. ' +
      'Выбери точку графика в узле сетки. На сколько клеток она правее или левее вершины ' +
      '($\\Delta x$) и выше или ниже ($\\Delta y$) — в новой системе? Вправо и вверх — плюс, ' +
      'влево и вниз — минус.', [field('\\Delta x =', dx), field('\\Delta y =', dy)], {
      variants: nodeTuples(p, win),
      wrong: 'Точка должна лежать на графике в узле сетки. Считай клетки от вершины — это ' +
        'начало новой системы координат.'
    }),
    fields('Подставь в $y\' = ax\'^2$: $\\Delta y = a \\cdot \\Delta x^2$.', [field('a =', p.a)], {
      wrong: 'Раздели $\\Delta y$ на $\\Delta x^2$.',
      sign: { field: 0, why: up ? 'Ветви вверх, значит $a$ положительное.'
        : 'Ветви вниз, значит $a$ отрицательное.' },
      after: solutionTex(sol)
    })
  ];
}

function knownAStep(p, sol) {
  return [fields('Коэффициент $a$ дан в условии задачи — выпиши его.', [field('a =', p.a)], {
    wrong: 'Посмотри в условие: там записана формула с известным $a$.', after: solutionTex(sol)
  })];
}

function symmetryStep(p, win, sol, key) {
  var f = sol.facts;
  var x0 = f.x0;
  /* Все пары узлов на одной высоте — любая подходит. */
  var nodes = Solution.curveNodes(p, win);
  var pairs = [];
  nodes.forEach(function (a) {
    nodes.forEach(function (b) {
      if (a.x !== b.x && a.y === b.y) { pairs.push([plain(fr(a.x)), plain(fr(b.x)), plain(fr(a.y))]); }
    });
  });
  var k = mul(frac(-2), x0);
  var relation = function (value) { return '$b = ' + (isZero(value) ? '0' : coef(value) + 'a') + '$'; };
  var options = [
    { text: relation(k), right: true, why: null, key: 'b=' + plain(k) + 'a' },
    { text: relation(mul(frac(-1), k)), right: false, key: 'b=' + plain(mul(frac(-1), k)) + 'a',
      why: 'Ошибка знака: $x_0 = -\\dfrac{b}{2a}$, отсюда $b = -2a \\cdot x_0$ — с минусом.' },
    { text: relation(x0), right: false, key: 'b=' + plain(x0) + 'a',
      why: 'Нет: в формуле вершины в знаменателе $2a$ — множитель $2$ не потерян?' },
    { text: relation(mul(frac(-1), x0)), right: false, key: 'b=' + plain(mul(frac(-1), x0)) + 'a',
      why: 'Нет: $b = -2a \\cdot x_0$ — множитель $2$ не потерян?' }
  ];
  var seen = {};
  options = options.filter(function (o) { if (seen[o.text]) { return false; } seen[o.text] = true; return true; });
  return [
    fields('Найди на графике две точки в узлах сетки с одинаковой ординатой — они симметричны ' +
      'относительно оси параболы. Запиши их абсциссы и общую ординату.',
      [field('x_1 =', frac(f.pair[0].x)), field('x_2 =', frac(f.pair[1].x)), field('y =', frac(f.pair[0].y))], {
      variants: pairs,
      wrong: 'Обе точки должны лежать на графике, в узлах сетки и на одной высоте.'
    }),
    fields('Ось симметрии проходит посередине: $x_0 = \\dfrac{x_1 + x_2}{2}$.', [field('x_0 =', x0)], {
      wrong: 'Сложи абсциссы двух точек и раздели пополам.', after: [solutionTex(sol)[0]]
    }),
    choice('Абсцисса вершины $x_0 = -\\dfrac{b}{2a}$. Какое простое уравнение получаем?', options,
      'Верно: $b = -2a \\cdot x_0 = ' + (isZero(k) ? '0' : coef(k) + 'a') + '$.', 'sym:' + key)
  ];
}

function interceptStep(p, sol, key) {
  var found = sol.facts.found === true;
  var parts = [
    choice('За что отвечает коэффициент $c$?', [
      { text: 'ордината точки пересечения с осью $Oy$', right: true, why: null, key: 'oy' },
      { text: 'абсцисса вершины', right: false, key: 'vertex',
        why: 'Нет: абсцисса вершины — это $-\\dfrac{b}{2a}$. А $c$ — значение при $x = 0$.' },
      { text: 'точка пересечения с осью $Ox$', right: false, key: 'ox',
        why: 'Нет: на оси $Ox$ ноль — значение функции, а $c$ — значение при $x = 0$.' },
      { text: 'направление ветвей', right: false, key: 'dir',
        why: 'Нет: направление ветвей задаёт знак $a$.' }
    ], 'Верно: $f(0) = c$, $c$ — ордината точки пересечения графика с осью $Oy$.', 'c:' + key),
    choice('Можно ли определить $c$ по графику? Точка пересечения с осью $Oy$ лежит в узле сетки?', [
      { text: 'да', right: found, key: 'yes',
        why: found ? null : 'Нет: пересечение с осью $Oy$ ' + (isInt(p.c)
          ? 'за пределами чертежа.' : 'не в узле сетки — точно не снять.') },
      { text: 'нет', right: !found, key: 'no',
        why: found ? 'Посмотри ещё раз: график пересекает ось $Oy$ в узле сетки.' : null }
    ], found ? 'Верно: снимаем $c$ с чертежа.'
      : 'Верно: $c$ с рисунка не определяем, найдём позже.')
  ];
  if (found) {
    parts.push(fields('Запиши $c$ — ординату точки пересечения с осью $Oy$.', [field('c =', p.c)], {
      wrong: 'Смотри, где график пересекает ось $Oy$, и считай клетки от начала координат.',
      after: ['c = ' + tex(p.c)]
    }));
  }
  return parts;
}

function bVertexStep(p, sol) {
  return [fields('Абсцисса вершины: $x_0 = -\\dfrac{b}{2a}$ $\\Rightarrow$ $b = -2a \\cdot x_0$. ' +
    'Подставь найденные $a$ и $x_0$.', [field('b =', p.b)], {
    wrong: 'Перемножь $-2$, $a$ и абсциссу вершины, следи за знаками.', after: solutionTex(sol)
  })];
}

/* Случай «б»: подстановка точки. Ловушки — точки, которые новой
   информации не дают. */
function substitutionStep(p, win, points, sol, axisFacts) {
  var f = sol.facts;
  var x0 = axisFacts.x0;
  var pair = axisFacts.pair;
  var cKnown = f.cFound !== true;
  var mirror0 = num(mul(frac(2), x0));
  var vertexMark = points.filter(function (pt) { return pt.role === 'vertex'; })[0];
  var nodes = Solution.curveNodes(p, win)
    .concat(points.filter(function (pt) { return pt.role === 'point'; }))
    .concat(vertexMark ? [vertexMark] : [])
    .concat(isInt(p.c) ? [{ x: 0, y: num(p.c) }] : []);
  var seenNode = {};
  nodes = nodes.filter(function (node) {
    var id = node.x + ':' + node.y;
    if (seenNode[id]) { return false; }
    seenNode[id] = true;
    return true;
  });
  var traps = [];
  var allowed = [];
  nodes.forEach(function (node) {
    var pairX = [pair[0].x, pair[1].x];
    var values = [plain(fr(node.x)), plain(fr(node.y))];
    if (cKnown && (node.x === 0 || Math.abs(node.x - mirror0) < 1e-9)) {
      traps.push({ values: values, why: node.x === 0
        ? 'Это сама точка $(0;\\, c)$ — подстановка даст тождество, возьми другую.'
        : 'Точка симметрична точке $(0;\\, c)$ — подстановка даст тождество, возьми другую.' });
    } else if (pairX.indexOf(node.x) !== -1) {
      traps.push({ values: values,
        why: 'Эта точка в паре с той, по которой нашли $x_0$, — новой информации не даст, возьми другую.' });
    } else if (node.x !== 0) {
      allowed.push(values);
    }
  });
  var first = (f.points || [])[0] || { x: Number(allowed[0][0]), y: Number(allowed[0][1]) };
  var parts = [fields('Подставь в $y = ax^2 + bx + c$ координаты ещё одной точки графика в узле ' +
    'сетки — вместе с $b = -2a \\cdot x_0$' + (cKnown ? ' и найденным $c$' : '') + '. Какую точку берёшь?',
    [field('x =', frac(first.x)), field('y =', frac(first.y))], {
      variants: allowed, traps: traps,
      wrong: 'Точка должна лежать на графике в узле сетки.'
    })];
  var list = [field('a =', p.a), field('b =', p.b)];
  if (!cKnown) { list.push(field('c =', p.c)); }
  parts.push(fields('Получилось уравнение с одним неизвестным $a$' +
    (cKnown ? '' : ' (и $c$ — нужна ещё одна точка)') + '. Реши его и найди $b = -2a \\cdot x_0$.', list, {
    wrong: 'Подставь $b = -2a \\cdot x_0$ в уравнение, приведи подобные и найди $a$.',
    sign: { field: 0, why: num(p.a) > 0 ? 'Ветви вверх, значит $a$ положительное.'
      : 'Ветви вниз, значит $a$ отрицательное.' },
    after: solutionTex(sol)
  }));
  return parts;
}

function formulaStep(p, task, sol, key) {
  var a = p.a, b = p.b, c = p.c;
  var right = equationTex(a, b, c, 'f(x)');
  var variants = [
    { text: '$' + right + '$', right: true, why: null, key: 'f' },
    { text: '$' + equationTex(a, mul(frac(-1), b), c, 'f(x)') + '$', right: false, key: 'b-',
      why: 'Проверь знак $b$: $b = -2a \\cdot x_0$.' },
    { text: '$' + equationTex(a, b, mul(frac(-1), c), 'f(x)') + '$', right: false, key: 'c-',
      why: 'Проверь знак $c$: это ордината точки на оси $Oy$.' },
    { text: '$' + equationTex(mul(frac(-1), a), b, c, 'f(x)') + '$', right: false, key: 'a-',
      why: 'Проверь знак $a$: он задан направлением ветвей.' }
  ];
  var seen = {};
  variants = variants.filter(function (o) { if (seen[o.text]) { return false; } seen[o.text] = true; return true; });
  var parts = [choice('Собери формулу из найденных коэффициентов.', variants,
    'Верно: $' + right + '$.', 'f:' + key)];
  var second = task.meta.curves && task.meta.curves[1];
  if (second && second.kind === 'line') {
    parts.push(fields('Вторая линия — прямая $g(x) = kx + m$. Наклон — через треугольник наклона и ' +
      '$\\operatorname{tg} \\alpha$, как у линейной функции: катеты по клеткам, у убывающей — со ' +
      'знаком минус. Затем $m$ — подстановкой точки прямой.',
      [field('k =', exact(second.kFraction)), field('m =', exact(second.bFraction))], {
        wrong: 'Считай катеты между двумя узлами прямой; знак $k$ — по направлению прямой.',
        after: solutionTex(sol).slice(-3)
      }));
  } else if (second) {
    var q = Q.exact(second.aFraction, second.bFraction, second.cFraction);
    parts.push(fields('Вторая линия — парабола $g(x)$. Найди её коэффициенты так же: $a_2$ шагом от ' +
      'вершины, затем раскрой скобки в записи через вершину.',
      [field('a_2 =', q.a), field('b_2 =', q.b), field('c_2 =', q.c)], {
        wrong: 'Проверь $a_2$ по узлу сетки рядом с вершиной второй параболы.',
        after: solutionTex(sol).slice(-2)
      }));
  }
  return parts;
}

function answerStep(p, task, sol, key) {
  var meta = task.meta;
  var rule = meta.rule;
  var after = solutionTex(sol);
  if (rule === 'value-at') {
    var x0 = exact(meta.query.x0);
    return [fields('Подставь $x = ' + tex(x0) + '$ в формулу. Удобнее — в запись через вершину.',
      [field('f(' + tex(x0) + ') =', Q.yAt(p, x0))], {
        wrong: 'Сначала скобка, потом квадрат, потом умножение на $a$ и сдвиг.', after: after
      })];
  }
  if (rule === 'argument-for') {
    var y0 = exact(meta.query.y0);
    var roots = Q.xForValue(p, y0) || [];
    var parts = [];
    if (roots.length === 2) {
      parts.push(fields('Реши уравнение $f(x) = ' + tex(y0) + '$: у него два корня.',
        [field('x_1 =', roots[0]), field('x_2 =', roots[1])], {
          variants: [[plain(roots[0]), plain(roots[1])], [plain(roots[1]), plain(roots[0])]],
          wrong: 'Перенеси всё в одну часть и реши квадратное уравнение.'
        }));
      var words = { larger: 'больший', smaller: 'меньший', positive: 'положительный',
                    negative: 'отрицательный' };
      var answer = fr(Number(String(task.answer).replace(',', '.').replace('−', '-')));
      parts.push(choice('Какой корень нужен по условию (' + (words[meta.query.pick] || 'нужный') + ')?',
        roots.map(function (r) {
          var isRight = Math.abs(num(r) - num(answer)) < 1e-9;
          return { text: '$x = ' + tex(r) + '$', right: isRight, key: 'x=' + plain(r),
            why: isRight ? null : 'Нет: в условии сказано, какой корень нужен, — перечитай.' };
        }), 'Верно.', 'root:' + key));
    } else {
      parts.push(fields('Реши уравнение $f(x) = ' + tex(y0) + '$.', [field('x =', answer)], {
        wrong: 'Перенеси всё в одну часть и реши уравнение.' }));
    }
    return parts;
  }
  if (rule === 'intersection-x' || rule === 'intersection-y') {
    var cross = meta.intersection;
    var second = meta.curves[1];
    var a2 = second.kind === 'line' ? frac(0) : exact(second.aFraction);
    var b2 = second.kind === 'line' ? exact(second.kFraction) : exact(second.bFraction);
    var c2 = second.kind === 'line' ? exact(second.bFraction) : exact(second.cFraction);
    var A = sub(p.a, a2), B = sub(p.b, b2), C = sub(p.c, c2);
    var shown = cross.points.filter(function (point) { return point.shown; })[0];
    var xs = exact(shown.xFraction || shown.x);
    var xa = exact(cross.asked.xFraction || cross.asked.x);
    var list = [
      fields('Приравняй формулы и перенеси всё в одну часть: $Ax^2 + Bx + C = 0$.',
        [field('A =', A), field('B =', B), field('C =', C)], {
          variants: [[plain(A), plain(B), plain(C)],
            [plain(mul(frac(-1), A)), plain(mul(frac(-1), B)), plain(mul(frac(-1), C))]],
          wrong: 'Из коэффициентов $f$ вычти коэффициенты $g$.'
        }),
      fields('Найди корни. Один известен — абсцисса отмеченной точки пересечения; второй — по ' +
        'теореме Виета: $x_1 + x_2 = -\\dfrac{B}{A}$.', [field('x_1 =', xs), field('x_2 =', xa)], {
          variants: [[plain(xs), plain(xa)], [plain(xa), plain(xs)]],
          wrong: 'Сумма корней равна $-\\dfrac{B}{A}$.'
        }),
      choice('Какой корень — абсцисса искомой точки?', [
        { text: '$x = ' + tex(xa) + '$', right: true, why: null, key: 'x=' + plain(xa) },
        { text: '$x = ' + tex(xs) + '$', right: false, key: 'x=' + plain(xs),
          why: 'Нет: это абсцисса отмеченной точки пересечения — она уже на чертеже. Нужна вторая.' }
      ], 'Верно: $x = ' + tex(xa) + '$.', 'cross:' + key)
    ];
    if (rule === 'intersection-y') {
      list.push(fields('Подставь найденный $x$ в формулу — удобнее в более короткую.',
        [field('y =', exact(cross.asked.yFraction || cross.asked.y))], {
          wrong: 'Подставляй второй корень, а не абсциссу отмеченной точки.', after: after
        }));
    }
    return list;
  }
  return [];
}

/* Приём шага 3а — виден на шаге всегда. */
var REMIND_AUX = 'Если от вершины на 1 клетку вбок — на 1 клетку вверх, то $a = 1$; ' +
  'на 1 вниз — $a = -1$. Это видно сразу.';

/* Где подсказка кончается: шаг, на котором найден ответ. */
var STOP = { 'sign-a': 'direction', a: 'slope', c: 'intercept', b: 'b', 'equation-choice': 'formula' };

/**
 * Шаги подсказки к задаче о параболе (meta.family === 'quadratic').
 * Шаг: { number, title, id, parts, chart } — номер и название из
 * полного решения; chart — какой чертёж показать на шаге:
 * 'aux' (вспомогательная система координат), 'symmetry' (точки и ось
 * симметрии) или null.
 */
function fromTask(task) {
  var meta = task.meta;
  var p = Q.exact(meta.aFraction, meta.bFraction, meta.cFraction);
  var win = meta.window;
  var points = meta.points || [];
  var key = task.id + ':' + meta.seed;
  var solution = Solution.fromTask(task);
  var axisFacts = null;
  var steps = [];
  var stop = STOP[meta.rule];
  var aInB = solution.some(function (s) { return s.facts && s.facts.aInB; });

  for (var i = 0; i < solution.length; i++) {
    var sol = solution[i];
    var base = { number: sol.number, title: sol.title, id: sol.id, chart: null, chartFrom: 0,
                 reminder: null };
    var parts = null;
    if (sol.id === 'direction') {
      parts = directionStep(p);
    } else if (sol.id === 'vertex') {
      parts = vertexStep(p, sol.facts.inNode === true);
    } else if (sol.id === 'slope') {
      if (sol.facts.knownA) {
        parts = knownAStep(p, sol);
      } else if (sol.facts.pair) {
        axisFacts = sol.facts;
        parts = symmetryStep(p, win, sol, key);
        base.chart = 'symmetry'; base.chartFrom = 1;
      } else if (sol.facts.point) {
        parts = auxStep(p, win, sol);
        base.chart = 'aux'; base.chartFrom = 0;
        base.reminder = REMIND_AUX;
      } else {
        parts = [fields('Найди $a$.', [field('a =', p.a)], { wrong: 'Проверь по узлу сетки.',
          after: solutionTex(sol) })];
      }
    } else if (sol.id === 'intercept') {
      parts = interceptStep(p, sol, key);
    } else if (sol.id === 'b') {
      parts = axisFacts !== null ? substitutionStep(p, win, points, sol, axisFacts)
        : bVertexStep(p, sol);
    } else if (sol.id === 'formula') {
      parts = formulaStep(p, task, sol, key);
    } else if (sol.id === 'answer') {
      if (stop) { break; }
      parts = answerStep(p, task, sol, key);
    }
    if (parts === null || parts.length === 0) { continue; }
    base.parts = parts;
    steps.push(base);
    if (stop && (sol.id === stop || (stop === 'slope' && aInB && sol.id === 'b'))) { break; }
  }
  return steps;
}

const api = { fromTask: fromTask, STOP: STOP };

export default api;
export { fromTask, STOP };
