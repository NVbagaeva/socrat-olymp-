/* graph/solution.js — разбор задачи: пять шагов.

   Схема одна и та же для всех задач, сколько бы действий ни требовалось:

     1. Прямая возрастает или убывает?
     2. Находим k
     3. Находим b
     4. Записываем формулу целиком
     5. Отвечаем на вопрос задачи

   Ученик привыкает к порядку и не разгадывает каждый раз заново.

   Модуль отдаёт структуру: шаги, внутри — блоки (текст, формула,
   врезка, чертёж). Разметку и анимацию делает страница, набор формул —
   KaTeX через data-tex. Здесь нет ни DOM, ни стилей.

   Тон: обращаемся на «мы», объясняем «почему», а не только «что
   сделать». Слова «просто», «очевидно», «легко», «всего лишь»
   не употребляются: тому, кто не понял, они звучат как упрёк.
*/

import Line from './families/line.js';

var MINUS = '−';

/* Число для текста: запятая и настоящий минус. */
function num(value) {
  return String(Math.round(value * 1000) / 1000).replace('.', ',').replace('-', MINUS);
}

/* Число для формулы KaTeX. */
function tex(value) {
  return String(Math.round(value * 1000) / 1000).replace('.', '{,}');
}

/* ══════════════════════════════════════════════════════════
   Точные числа

   Коэффициент может выйти дробью, которая в конечную десятичную
   не переводится: −1/3, 2/3. Округлять её нельзя, и не только
   из-за вида. Выкладка после округления перестаёт сходиться:
   при k = −2/3 подстановка даёт −0,667 · (−19,5) − 4 = 9,0065,
   а ответ задачи — ровно 9. Учитель, который проверит строчку,
   увидит противоречие.

   Поэтому такие числа печатаются обыкновенной дробью, а считаются
   точной дробной арифметикой из families/line.js.
   ══════════════════════════════════════════════════════════ */

/* Конечная десятичная запись есть, только если после сокращения
   знаменатель делится нацело лишь на 2 и 5. */
function decimalFriendly(f) {
  var q = Math.abs(f.q);
  while (q % 2 === 0) { q /= 2; }
  while (q % 5 === 0) { q /= 5; }
  return q === 1;
}

/* Точное число в формулу: десятичная, где она конечна, иначе дробь. */
function texExact(f) {
  if (decimalFriendly(f)) { return tex(Line.num(f)); }
  return (f.p < 0 ? '-' : '') + '\\dfrac{' + Math.abs(f.p) + '}{' + f.q + '}';
}

/* Коэффициент перед x точным числом: 1x и −1x не пишутся. */
function slopeTexExact(f) {
  if (f.q === 1 && f.p === 1) { return ''; }
  if (f.q === 1 && f.p === -1) { return '-'; }
  return texExact(f);
}

/* Формула функции целиком, точными числами. */
function equationTexExact(kf, bf) {
  var slope = Line.isZero(kf) ? '' : slopeTexExact(kf) + 'x';
  if (Line.isZero(bf)) { return 'f(x) = ' + (slope || '0'); }
  var sign = bf.p > 0 ? ' + ' : ' - ';
  return 'f(x) = ' + slope + sign + texExact(Line.frac(Math.abs(bf.p), bf.q));
}

/* Число в формулу со скобками у отрицательного: подстановка
   f(-4) = k · (-4) читается только так. */
function texBracket(f) {
  var body = texExact(f);
  if (f.p >= 0) { return body; }
  /* У дроби скобки растягиваются: обычные оказались бы ниже неё. */
  return decimalFriendly(f) ? '(' + body + ')' : '\\left(' + body + '\\right)';
}

/* Коэффициент в формуле: 1x и −1x не пишутся. */
function slopeTex(k) {
  if (Math.abs(k - 1) < 1e-9) { return ''; }
  if (Math.abs(k + 1) < 1e-9) { return '-'; }
  return tex(k);
}

function equationTex(k, b) {
  var slope = Math.abs(k) < 1e-9 ? '' : slopeTex(k) + 'x';
  if (Math.abs(b) < 1e-9) { return 'f(x) = ' + (slope || '0'); }
  return 'f(x) = ' + slope + (b > 0 ? ' + ' : ' - ') + tex(Math.abs(b));
}

/* Дробь столбиком — только так, без косой черты. */
function fracTex(top, bottom) { return '\\dfrac{' + tex(top) + '}{' + tex(bottom) + '}'; }

function text(html) { return { type: 'text', html: html }; }

/* Формула внутри текста — той же разметкой, что и отдельная:
   KaTeX заменит её вёрсткой. Внутри лежит исходная запись —
   она видна, только пока KaTeX не отработал. */
function math(tx, plain) {
  return '<span class="math" data-tex="' + escapeAttr(tx) + '">' + (plain || '') + '</span>';
}

function escapeAttr(value) {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
function formula(tx) { return { type: 'formula', tex: tx }; }
function key(value) { return '<b class="key">' + num(value) + '</b>'; }

/* ══════════════════════════════════════════════════════════
   Шаг 1. Возрастает или убывает
   ══════════════════════════════════════════════════════════ */
function stepDirection(t) {
  var blocks = [ text('Сначала спросим себя: прямая идёт вверх или вниз?') ];

  if (t.rising) {
    blocks.push(text('Слева направо линия поднимается. Значит ' +
      '<b class="key">' + math('k > 0', 'k &gt; 0') + '</b>.'));
  } else {
    blocks.push(text('Слева направо линия опускается. Значит ' +
      '<b class="key">' + math('k < 0', 'k &lt; 0') + '</b>.'));
    blocks.push(text('Знак минус мы уже знаем — запишем его сразу, чтобы потом не потерять.'));
  }

  return { title: 'Прямая возрастает или убывает?', arrow: t.rising ? 'up' : 'down', blocks: blocks };
}

/* ══════════════════════════════════════════════════════════
   Шаг 2. Находим k
   ══════════════════════════════════════════════════════════ */
function stepSlope(t, kf) {
  var blocks = [
    text(math('k', 'k') + ' — это тангенс угла наклона. Угол ' + math('\\alpha', 'α') +
         ' отсчитывается от положительного направления оси ' + math('x', 'x') + ' до прямой.'),
    formula('k = \\operatorname{tg} \\alpha')
  ];

  if (t.rising) {
    blocks.push(text('Угол ' + math('\\alpha', 'α') + ' острый — он весь помещается ' +
      'в прямоугольный треугольник, который мы построили.'));
    blocks.push(text('Напомним: тангенс острого угла в прямоугольном треугольнике — ' +
      'это отношение противолежащего катета к прилежащему.'));
    blocks.push(text('Противолежащий катет — вертикальный, ' + key(t.dy) + ' кл. ' +
      'Прилежащий катет — горизонтальный, ' + key(t.dx) + ' кл.'));
    /* Хвост «= 0,333» у неконечной дроби был бы округлением,
       поэтому сама дробь и есть итог шага. */
    blocks.push(formula(decimalFriendly(kf)
      ? 'k = ' + fracTex(t.dy, t.dx) + ' = ' + texExact(kf)
      : 'k = ' + fracTex(t.dy, t.dx)));
  } else {
    blocks.push(text('Угол ' + math('\\alpha', 'α') + ' здесь тупой: прямая наклонена влево. ' +
      'А прямоугольного треугольника с тупым углом не бывает — значит напрямую ' +
      'посчитать ' + math('\\operatorname{tg} \\alpha', 'tg α') + ' нельзя.'));
    blocks.push(text('Выход: берём смежный острый угол. Он равен ' +
      math('180^\\circ - \\alpha', '180° − α') + ', и именно он лежит в нашем треугольнике.'));
    blocks.push(text('Связь между ними такая:'));
    blocks.push(formula('\\operatorname{tg} \\alpha = -\\operatorname{tg}(180^\\circ - \\alpha)'));
    blocks.push(text('Поэтому считаем тангенс острого угла и ставим минус.'));
    blocks.push(text('Противолежащий катет — ' + key(t.dy) + ' кл. ' +
      'Прилежащий катет — ' + key(t.dx) + ' кл.'));
    var absK = Line.frac(Math.abs(kf.p), kf.q);
    blocks.push(formula(decimalFriendly(absK)
      ? '\\operatorname{tg}(180^\\circ - \\alpha) = ' + fracTex(t.dy, t.dx) + ' = ' + texExact(absK)
      : '\\operatorname{tg}(180^\\circ - \\alpha) = ' + fracTex(t.dy, t.dx)));
    blocks.push(formula('k = -' + texExact(absK)));
    blocks.push({ type: 'details', id: 'why-minus', title: 'Откуда берётся минус',
                  blocks: whyMinus() });
  }

  blocks.push({ type: 'callout', id: 'simpler', title: 'Можно проще', blocks: [
    text('На самом деле всё это можно не считать каждый раз. Достаточно запомнить:'),
    text('<b class="key">' + math('k > 0', 'k &gt; 0') + '</b> — прямая идёт вверх, ' +
         '<b class="key">' + math('k < 0', 'k &lt; 0') + '</b> — прямая идёт вниз.'),
    text('Поэтому у убывающей прямой сразу ставим минус, а дальше спокойно считаем ' +
         'по треугольнику.')
  ] });

  return { title: 'Находим k', blocks: blocks };
}

/* Тригонометрическая окружность: почему у смежных углов
   тангенсы противоположны. Рисуется тем же движком и в той же
   палитре, что и графики. */
function whyMinus() {
  /* Угол взят удобный для чтения: тангенсы получаются ровно ±1,
     и точки на линии тангенсов видно без прищуривания. */
  var alpha = 135;                      /* тупой угол, вторая четверть  */
  var acute = 180 - alpha;              /* смежный острый, первая        */
  var radAcute = acute * Math.PI / 180;
  var tangent = Math.tan(radAcute);     /* tg 45° = 1                    */

  function at(angleDeg, radius) {
    var rad = angleDeg * Math.PI / 180;
    return [radius * Math.cos(rad), radius * Math.sin(rad)];
  }

  var scene = {
    window: { xmin: -2.4, xmax: 2.4, ymin: -2.4, ymax: 2.4 },
    cell: 62,                           /* рисунок мелкий, клетку берём крупнее */
    grid: { show: false },
    axes: { labelX: 'x', labelY: 'y', origin: '0' },
    axisLabels: 'minimal',
    curves: [],
    points: [],
    shapes: [
      { type: 'circle', at: [0, 0], radius: 1, color: 'axis', width: 1.4 },

      /* Линия тангенсов — вертикаль x = 1, справа от окружности. */
      { type: 'segment', from: [1, -2.4], to: [1, 2.4], color: 'axis', style: 'dashed' },

      /* Острый угол: радиус, продолжение до линии тангенсов и точка. */
      { type: 'segment', from: [0, 0], to: at(acute, 1), color: 'lineA' },
      { type: 'segment', from: at(acute, 1), to: [1, tangent], color: 'lineA', style: 'dashed' },
      { type: 'dot', at: [1, tangent], color: 'lineA' },
      { type: 'arc', at: [0, 0], radius: 0.34, from: 0, to: acute, color: 'lineA' },

      /* Тупой угол: радиус влево-вверх, продолжение назад пересекает
         линию тангенсов симметрично относительно оси x. */
      { type: 'segment', from: [0, 0], to: at(alpha, 1), color: 'lineB' },
      { type: 'segment', from: [0, 0], to: [1, -tangent], color: 'lineB', style: 'dashed' },
      { type: 'dot', at: [1, -tangent], color: 'lineB' },
      { type: 'arc', at: [0, 0], radius: 0.72, from: 0, to: alpha, color: 'lineB' },

      /* Подпись острого угла ищет место по биссектрисе: у самой дуги
         тесно между осью, радиусом и линией тангенсов. */
      { type: 'label', at: at(acute / 2, 0.55), text: '180°−α', color: 'lineA', size: 13, gap: 3,
        anchors: [at(acute / 2, 0.55), at(acute / 2, 0.95), at(acute / 2, 1.45),
                  at(acute / 2 - 14, 1.45)] },
      { type: 'label', at: at(alpha, 1.3), text: 'α', color: 'lineB', size: 15, gap: 3 },
      { type: 'label', at: [1, tangent], offset: [16, -6], text: 'tg(180° − α)',
        color: 'lineA', size: 13 },
      { type: 'label', at: [1, -tangent], offset: [16, 6], text: 'tg α',
        color: 'lineB', size: 13 }
    ],
    alt: 'Тригонометрическая окружность: смежные углы и их тангенсы'
  };

  return [
    { type: 'scene', scene: scene },
    text('Углы симметричны относительно оси ' + math('y', 'y') +
         ', поэтому их тангенсы противоположны по знаку.')
  ];
}

/* ══════════════════════════════════════════════════════════
   Шаг 3. Находим b
   ══════════════════════════════════════════════════════════ */
/* Читается ли b прямо с чертежа: пересечение с осью Oy попадает
   в узел сетки и не жмётся к краю поля.

   Признак вынесен наружу намеренно. По нему выбирает ветку не только
   разбор, но и цепочка подсказок тренажёра; запиши мы условие дважды,
   однажды они разойдутся — и подсказка станет звать читать с чертежа
   то, чего там нет. */
function interceptVisible(b, win) {
  return Number.isInteger(b) && !!win && Math.abs(b) <= win.ymax - 1;
}

/* Опорная точка для подстановки — та, что ученик видит жирной на чертеже
   задачи. Треугольник наклона может стоять на другой паре: его пару
   выбирают под рисунок, чтобы катет не лёг на ось и дуга угла не села
   на числа. Подставлять же надо отмеченную точку — другую на чертеже
   не найти, а условие прямо говорит, что точки отмечены.

   Из двух отмеченных берём ту, где k · x выходит целым: промежуточная
   строка тогда без дробей. Нет отмеченных точек (задача без чертежа) —
   остаётся вершина треугольника. */
function substitutionPoint(t, points, k) {
  var marked = (points || []).filter(function (p) {
    return whole(p.x) && whole(p.y);
  });
  var nice = marked.filter(function (p) { return whole(k * p.x); });
  return nice[0] || marked[0] || t.A;
}

function whole(value) {
  return Math.abs(value - Math.round(value)) < 1e-9;
}

function stepIntercept(t, line, win, k, b, points) {
  var visible = interceptVisible(b, win);
  var blocks = [];

  if (visible) {
    blocks.push(text(math('b', 'b') + ' — это значение ' + math('y', 'y') +
      ' в точке, где прямая пересекает ось ' + math('Oy', 'Oy') + '.'));
    blocks.push(text('Смотрим на чертёж: пересечение в точке ' +
      '<b class="key">' + math('(0;\\, ' + tex(b) + ')', '(0; ' + num(b) + ')') + '</b>. Значит ' +
      '<b class="key">' + math('b = ' + tex(b), 'b = ' + num(b)) + '</b>.'));
    return { title: 'Находим b', highlight: { x: 0, y: b }, blocks: blocks };
  }

  /* b с графика не снять: пересечение за кадром или не в узле сетки. */
  var base = substitutionPoint(t, points, k);
  /* Произведение считается точной дробью: при k = −2/3 округление
     здесь увело бы и b, и всё, что из него следует. */
  var productFrac = Line.mul(line.k, Line.toFrac(base.x));
  var product = Line.num(productFrac);

  /* Причина у двух случаев разная, и называть её надо ту, что есть:
     «за кадром или не в узле» на чертеже, где пересечение отлично
     видно посередине клетки, только сбивает. Ветка та же, что
     в подсказке тренажёра, и условие у них одно — interceptVisible. */
  blocks.push(text(
    Number.isInteger(b)
      ? 'Пересечение с осью ' + math('Oy', 'Oy') + ' за пределами чертежа. Угадывать нельзя.'
      : 'Пересечение с осью ' + math('Oy', 'Oy') + ' попадает не в узел сетки. ' +
        'Угадывать нельзя.'));
  blocks.push(text('Может показаться, что там примерно полтора или примерно два — ' +
    'но «примерно» в ответе не бывает. Это лотерея, а в лотерею мы не играем: ' +
    'угадать шесть чисел из сорока пяти — примерно один шанс на восемь миллионов.'));
  blocks.push(text('Считаем честно. Берём любую точку, которая точно лежит на прямой ' +
    'и имеет целые координаты — например, <b class="key">' +
    math('(' + tex(base.x) + ';\\, ' + tex(base.y) + ')', '(' + num(base.x) + '; ' + num(base.y) + ')') +
    '</b>. Подставляем её в уравнение вместо ' + math('x', 'x') + ' и ' + math('y', 'y') + ':'));
  blocks.push(formula(tex(base.y) + ' = ' + tex(k) + ' \\cdot ' + texNegative(base.x) + ' + b'));
  blocks.push(formula(tex(base.y) + ' = ' + texNegative(product) + ' + b'));
  blocks.push(formula('b = ' + tex(base.y) + ' - ' + texNegative(product) + ' = ' + tex(b)));

  return { title: 'Находим b', blocks: blocks };
}

/* Отрицательное число в формуле берётся в скобки: −2 · −3 нечитаемо. */
function texNegative(value) {
  return value < 0 ? '(' + tex(value) + ')' : tex(value);
}

/* ══════════════════════════════════════════════════════════
   Шаг 4. Формула целиком
   ══════════════════════════════════════════════════════════ */
function stepFormula(kf, bf) {
  return {
    title: 'Записываем формулу',
    blocks: [
      text('Теперь выпишем формулу целиком и зафиксируем её:'),
      { type: 'formula', tex: equationTexExact(kf, bf), feature: true },
      text('Дальше работаем только с ней.')
    ]
  };
}

/* ══════════════════════════════════════════════════════════
   Шаг 5. Ответ на вопрос задачи
   ══════════════════════════════════════════════════════════ */
function stepAnswer(task, line) {
  var rule = task.rule;
  var answer = task.answer;
  var kf = line.k;
  var bf = line.b;
  var b = Line.num(bf);
  var blocks = [];

  if (rule === 'value-at' && task.query) {
    var x0 = task.query.x0;
    /* Значение считает сам движок точной дробью — тот же yAt,
       которым посчитан ответ задачи. Своей арифметики здесь нет,
       поэтому строка и ответ разойтись не могут. */
    var valueAt = Line.yAt(line, x0);
    blocks.push(text('Нужно найти <b class="key">' +
      math('f(' + tex(x0) + ')', 'f(' + num(x0) + ')') + '</b>. Подставляем:'));
    blocks.push(formula('f(' + texNegative(x0) + ') = ' + texBracket(kf) + ' \\cdot ' +
      texNegative(x0) + ' + ' + texNegative(b) + ' = ' + texExact(valueAt)));
  } else if (rule === 'argument-for' && task.query) {
    var y0 = task.query.y0;
    var shifted = Line.sub(Line.toFrac(y0), bf);
    var root = Line.xForValue(line, y0);
    blocks.push(text('Нужно найти ' + math('x', 'x') + ', при котором <b class="key">' +
      math('f(x) = ' + tex(y0), 'f(x) = ' + num(y0)) + '</b>. Решаем уравнение:'));
    blocks.push(formula(slopeTexExact(kf) + 'x + ' + texNegative(b) + ' = ' + tex(y0)));
    blocks.push(formula(slopeTexExact(kf) + 'x = ' + texExact(shifted)));
    blocks.push(formula('x = ' + texExact(shifted) + ' : ' + texBracket(kf) +
      ' = ' + texExact(root)));
  } else if (rule === 'k') {
    blocks.push(text('В задаче спрашивают угловой коэффициент. Мы его уже нашли:'));
    blocks.push(formula('k = ' + texExact(kf)));
  } else if (rule === 'b') {
    blocks.push(text('В задаче спрашивают свободный член. Мы его уже нашли:'));
    blocks.push(formula('b = ' + texExact(bf)));
  } else if (rule === 'equation-choice') {
    blocks.push(text('Сравниваем нашу формулу с вариантами ответа и выбираем совпадающую.'));
    blocks.push(formula(equationTexExact(kf, bf)));
    blocks.push(text('Это вариант № ' + answer + '.'));
  } else if (rule === 'point-choice' && task.probe) {
    var atProbe = Line.yAt(line, task.probe.x);
    blocks.push(text('Подставляем координаты точки в формулу и сравниваем с её ординатой:'));
    blocks.push(formula('f(' + texNegative(task.probe.x) + ') = ' + texBracket(kf) + ' \\cdot ' +
      texNegative(task.probe.x) + ' + ' + texNegative(b) + ' = ' + texExact(atProbe)));
    blocks.push(text('У точки ордината <b class="key">' + num(task.probe.y) + '</b>. ' +
      (Line.isZero(Line.sub(atProbe, Line.toFrac(task.probe.y)))
        ? 'Значения совпали — точка лежит на прямой.'
        : 'Значения разные — точка на прямой не лежит.')));
  } else {
    blocks.push(text('Ответ читается из формулы, которую мы выписали.'));
  }

  blocks.push({ type: 'answer', html: 'Ответ: <b class="key">' + answer + '</b>' });
  return { title: 'Отвечаем на вопрос', blocks: blocks };
}

/* ══════════════════════════════════════════════════════════
   Сборка
   ══════════════════════════════════════════════════════════ */
function build(options) {
  var t = options.triangle;
  var line = options.line;
  var win = options.window;
  var k = Line.num(line.k);
  var b = Line.num(line.b);

  var steps = [
    stepDirection(t),
    stepSlope(t, line.k),
    stepIntercept(t, line, win, k, b, options.points),
    stepFormula(line.k, line.b),
    stepAnswer(options.task || {}, line)
  ];

  return steps.map(function (step, i) {
    step.number = i + 1;
    return step;
  });
}

const api = {
  build: build,
  equationTex: equationTex,
  interceptVisible: interceptVisible,
  num: num,
  tex: tex
};

export default api;
export { build, equationTex, interceptVisible, num, tex };
