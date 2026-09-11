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

(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./families/line.js'));
  } else { root.GraphSolution = factory(root.GraphLine); }
})(typeof self !== 'undefined' ? self : this, function (Line) {
  'use strict';

  var MINUS = '−';

  /* Число для текста: запятая и настоящий минус. */
  function num(value) {
    return String(Math.round(value * 1000) / 1000).replace('.', ',').replace('-', MINUS);
  }

  /* Число для формулы KaTeX. */
  function tex(value) {
    return String(Math.round(value * 1000) / 1000).replace('.', '{,}');
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
  function formula(tx) { return { type: 'formula', tex: tx }; }
  function note(html) { return { type: 'note', html: html }; }
  function key(value) { return '<b class="key">' + num(value) + '</b>'; }

  /* ══════════════════════════════════════════════════════════
     Шаг 1. Возрастает или убывает
     ══════════════════════════════════════════════════════════ */
  function stepDirection(t) {
    var blocks = [ text('Сначала спросим себя: прямая идёт вверх или вниз?') ];

    if (t.rising) {
      blocks.push(text('Слева направо линия поднимается. Значит <b class="key">k &gt; 0</b>.'));
    } else {
      blocks.push(text('Слева направо линия опускается. Значит <b class="key">k &lt; 0</b>.'));
      blocks.push(text('Знак минус мы уже знаем — запишем его сразу, чтобы потом не потерять.'));
    }

    return { title: 'Прямая возрастает или убывает?', arrow: t.rising ? 'up' : 'down', blocks: blocks };
  }

  /* ══════════════════════════════════════════════════════════
     Шаг 2. Находим k
     ══════════════════════════════════════════════════════════ */
  function stepSlope(t, k) {
    var blocks = [
      text('k — это тангенс угла наклона. Угол α отсчитывается от положительного ' +
           'направления оси x до прямой.'),
      formula('k = \\operatorname{tg} \\alpha')
    ];

    if (t.rising) {
      blocks.push(text('Угол α острый — он весь помещается в прямоугольный треугольник, ' +
        'который мы построили.'));
      blocks.push(text('Напомним: тангенс острого угла в прямоугольном треугольнике — ' +
        'это отношение противолежащего катета к прилежащему.'));
      blocks.push(text('Противолежащий катет — вертикальный, ' + key(t.dy) + ' кл. ' +
        'Прилежащий катет — горизонтальный, ' + key(t.dx) + ' кл.'));
      blocks.push(formula('k = ' + fracTex(t.dy, t.dx) + ' = ' + tex(k)));
    } else {
      blocks.push(text('Угол α здесь тупой: прямая наклонена влево. А прямоугольного ' +
        'треугольника с тупым углом не бывает — значит напрямую посчитать ' +
        '<span class="math" data-tex="\\operatorname{tg} \\alpha">tg α</span> нельзя.'));
      blocks.push(text('Выход: берём смежный острый угол. Он равен 180° − α, и именно он ' +
        'лежит в нашем треугольнике.'));
      blocks.push(text('Связь между ними такая:'));
      blocks.push(formula('\\operatorname{tg} \\alpha = -\\operatorname{tg}(180^\\circ - \\alpha)'));
      blocks.push(text('Поэтому считаем тангенс острого угла и ставим минус.'));
      blocks.push(text('Противолежащий катет — ' + key(t.dy) + ' кл. ' +
        'Прилежащий катет — ' + key(t.dx) + ' кл.'));
      blocks.push(formula('\\operatorname{tg}(180^\\circ - \\alpha) = ' + fracTex(t.dy, t.dx) +
        ' = ' + tex(Math.abs(k))));
      blocks.push(formula('k = -' + tex(Math.abs(k))));
      blocks.push({ type: 'details', id: 'why-minus', title: 'Откуда берётся минус',
                    blocks: whyMinus() });
    }

    blocks.push({ type: 'callout', id: 'simpler', title: 'Можно проще', blocks: [
      text('На самом деле всё это можно не считать каждый раз. Достаточно запомнить:'),
      text('<b class="key">k &gt; 0</b> — прямая идёт вверх, ' +
           '<b class="key">k &lt; 0</b> — прямая идёт вниз.'),
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
    var radObtuse = alpha * Math.PI / 180;
    var radAcute = acute * Math.PI / 180;
    var tangent = Math.tan(radAcute);     /* tg 60° ≈ 1,73                 */

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
      text('Углы симметричны относительно оси y, поэтому их тангенсы противоположны по знаку.')
    ];
  }

  /* ══════════════════════════════════════════════════════════
     Шаг 3. Находим b
     ══════════════════════════════════════════════════════════ */
  function stepIntercept(t, line, win, k, b) {
    var visible = Number.isInteger(b) && Math.abs(b) <= win.ymax - 1;
    var blocks = [];

    if (visible) {
      blocks.push(text('b — это значение y в точке, где прямая пересекает ось Oy.'));
      blocks.push(text('Смотрим на чертёж: пересечение в точке (0; ' + key(b) + '). ' +
        'Значит b = ' + key(b) + '.'));
      return { title: 'Находим b', highlight: { x: 0, y: b }, blocks: blocks };
    }

    /* b с графика не снять: пересечение за кадром или не в узле сетки. */
    var base = t.A;
    var product = k * base.x;

    blocks.push(text('Пересечение с осью Oy за пределами чертежа — или попадает ' +
      'не в узел сетки. Угадывать нельзя.'));
    blocks.push(text('Может показаться, что там примерно полтора или примерно два — ' +
      'но «примерно» в ответе не бывает. Это лотерея, а в лотерею мы не играем: ' +
      'угадать шесть чисел из сорока пяти — примерно один шанс на восемь миллионов.'));
    blocks.push(text('Считаем честно. Берём любую точку, которая точно лежит на прямой ' +
      'и имеет целые координаты — например, (' + key(base.x) + '; ' + key(base.y) + '). ' +
      'Подставляем её в уравнение вместо x и y:'));
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
  function stepFormula(k, b) {
    return {
      title: 'Записываем формулу',
      blocks: [
        text('Теперь выпишем формулу целиком и зафиксируем её:'),
        { type: 'formula', tex: equationTex(k, b), feature: true },
        text('Дальше работаем только с ней.')
      ]
    };
  }

  /* ══════════════════════════════════════════════════════════
     Шаг 5. Ответ на вопрос задачи
     ══════════════════════════════════════════════════════════ */
  function stepAnswer(task, k, b) {
    var rule = task.rule;
    var answer = task.answer;
    var blocks = [];

    if (rule === 'value-at' && task.query) {
      var x0 = task.query.x0;
      blocks.push(text('Нужно найти f(' + key(x0) + '). Подставляем:'));
      blocks.push(formula('f(' + texNegative(x0) + ') = ' + tex(k) + ' \\cdot ' + texNegative(x0) +
        ' + ' + texNegative(b) + ' = ' + tex(k * x0 + b)));
    } else if (rule === 'argument-for' && task.query) {
      var y0 = task.query.y0;
      blocks.push(text('Нужно найти x, при котором f(x) = ' + key(y0) + '. Решаем уравнение:'));
      blocks.push(formula(slopeTex(k) + 'x + ' + texNegative(b) + ' = ' + tex(y0)));
      blocks.push(formula(slopeTex(k) + 'x = ' + tex(y0 - b)));
      blocks.push(formula('x = ' + fracTex(y0 - b, k) + ' = ' + tex((y0 - b) / k)));
    } else if (rule === 'k') {
      blocks.push(text('В задаче спрашивают угловой коэффициент. Мы его уже нашли:'));
      blocks.push(formula('k = ' + tex(k)));
    } else if (rule === 'b') {
      blocks.push(text('В задаче спрашивают свободный член. Мы его уже нашли:'));
      blocks.push(formula('b = ' + tex(b)));
    } else if (rule === 'equation-choice') {
      blocks.push(text('Сравниваем нашу формулу с вариантами ответа и выбираем совпадающую.'));
      blocks.push(formula(equationTex(k, b)));
      blocks.push(text('Это вариант № ' + answer + '.'));
    } else if (rule === 'point-choice' && task.probe) {
      blocks.push(text('Подставляем координаты точки в формулу и сравниваем с её ординатой:'));
      blocks.push(formula('f(' + texNegative(task.probe.x) + ') = ' + tex(k) + ' \\cdot ' +
        texNegative(task.probe.x) + ' + ' + texNegative(b) + ' = ' + tex(k * task.probe.x + b)));
      blocks.push(text('У точки ордината ' + key(task.probe.y) + '. ' +
        (Math.abs(k * task.probe.x + b - task.probe.y) < 1e-9
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
      stepSlope(t, k),
      stepIntercept(t, line, win, k, b),
      stepFormula(k, b),
      stepAnswer(options.task || {}, k, b)
    ];

    return steps.map(function (step, i) {
      step.number = i + 1;
      return step;
    });
  }

  return { build: build, equationTex: equationTex, num: num, tex: tex };
});
