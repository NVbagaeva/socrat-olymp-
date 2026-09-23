/* graph/renderer.js — чистый рендерер чертежей задания №12.

   renderGraph(scene) -> строка SVG.

   Слой 1 архитектуры: ни зависимостей, ни предметной математики, ни знания
   о задачах. Рендерер получает готовую сцену и рисует её. Всё оформление —
   цвета, толщины, размеры, отступы, порядок слоёв — собрано в THEME ниже;
   по месту не хардкодится ничего.

   Новые семейства кривых (парабола, гипербола) добавляются через
   registerCurve(type, sampler) и не требуют правок в теле рендерера:
   сэмплер возвращает ломаные в математических координатах, обрезку по окну,
   толщины, цвета и подписи берёт на себя рендерер.

   scene = {
     window:     { xmin, xmax, ymin, ymax },   // строго симметричное, квадратное
     grid:       { step: 1, show: true },
     axes:       { labelX: 'x', labelY: 'y', origin: '0' },
     axisLabels: 'minimal' | 'full' | 'none',   // minimal: подписаны только 0, 1 и −1;
                                                // none: засечки есть, чисел нет (миниатюры)
     curves:     [ { type: 'line', k, b, color: 'lineA', label: null,
                     style: 'solid' | 'dashed' } ],   // dashed — эталон рядом
     points:     [ { x, y, style: 'solid', label: null, color: 'lineA' } ]
   }
*/

'use strict';

/* ══════════════════════════════════════════════════════════
   THEME — единственное место, где живёт оформление
   Цвета из токенов styleguide.html. Красный не используется:
   в системе он означает ошибку и риск.
   ══════════════════════════════════════════════════════════ */
var THEME = {
  /* Цвета берутся из токенов дизайн-системы через CSS-переменные.
     Хекс стоит только запасным значением: без него отдельный .svg
     вне страницы, где переменных нет, рисовался бы чёрным. */
  colors: {
    bg:          'var(--color-surface, #FFFFFF)',
    grid:        'var(--graph-grid, #C3D3E6)',
    axis:        'var(--graph-axis, #101728)',
    label:       'var(--graph-axis, #101728)',
    lineA:       'var(--color-primary, #1F5FD0)',
    lineB:       'var(--graph-accent, #E07A2F)',
    accent:      'var(--graph-accent, #E07A2F)',   /* треугольник наклона   */
    pointFill:   null,                             /* null — цвет кривой    */
    pointStroke: 'var(--color-surface, #FFFFFF)',
    halo:        'var(--color-surface, #FFFFFF)',
    /* Общая точка двух кривых: она ничья, и цвет у неё ничей —
       тёмный, как у осей, и не совпадает ни с одной из кривых. */
    cross:       'var(--graph-axis, #101728)'
  },

  /* Иерархия толщин: каждая ступень различима на глаз.
     сетка 1,2 < засечки 1,6 < оси 2,2 < график 3,2                        */
  width: {
    grid:        1.2,
    tick:        1.6,
    axis:        2.2,
    curve:       3.2,
    helper:      2,          /* катеты треугольника — тоньше графика        */
    helperMark:  1.6,        /* квадратик прямого угла и дуга               */
    pointStroke: 2.6,
    halo:        3                     /* тонкая белая обводка под текстом */
  },

  /* Треугольник наклона: вспомогательный, график не перебивает. */
  helper: {
    dash:          '6 5',
    fillOpacity:   0.12,
    rightAnglePx:  13,       /* сторона квадратика, в пикселях             */
    arcRadius:     1.15,     /* радиус дуги угла, в клетках                */
    labelGap:      11,
    slideReachPx:  62,       /* насколько подпись катета ходит вдоль него  */
    slideStepPx:    6,
    anchorPenalty:  3.5,     /* плата за уход от ближнего места подписи    */
    overlapPenalty: 1000,    /* занятое место проигрывает любому свободному */
    textPenalty:  100000     /* наложение подписи на подпись — хуже всего   */
  },

  geometry: {
    cell:          34,    /* пикселей на клетку, одинаково по обеим осям   */
    pad:           38,    /* поле вокруг чертежа                           */
    arrowLen:      11,
    arrowHalf:      4.6,
    arrowExtend:   20,    /* продление оси за границу поля под стрелку     */
    tick:           3.5,  /* половина длины засечки (было непропорционально)*/
    tickEdgeCells:  1,    /* засечки не ставятся в этой зоне у края поля   */
    pointRadius:    6
  },

  font: {
    /* Шрифт берётся из styleguide.html через CSS-переменную;
       фолбэк нужен для отдельного .svg-файла вне страницы.               */
    family:    "var(--font, 'Inter', system-ui, -apple-system, sans-serif)",
    axisLabel:  12,       /* числа на осях — заметно мельче подписей осей  */
    axisName:    17,      /* x, y, 0 — курсив                              */
    pointLabel:  13,
    /* Строгие подписи: координаты точки читаются с телефона, поэтому
       кегль не меньше, чем у чисел осей, и с запасом. */
    pointLabelStrict: 15,
    helperLabel: 19,      /* числа у катетов треугольника наклона           */

    /* Подпись графика: жирное математическое начертание —
       антиква с курсивом, как набирают формулы в учебниках.              */
    curveLabel:       21,
    curveLabelFamily: "var(--font-math, 'STIX Two Text', 'Cambria Math', Cambria, 'Charter', Georgia, serif)",
    curveLabelWeight: 700,
    pointLabelWeight: 600,
    curveLabelTrack:  0.62   /* оценка ширины символа в долях кегля       */
  },

  /* Типографский минус в подписях чертежа (в данных и ответах — обычный). */
  minus: '\u2212',

  gap: {
    axisLabelX: 16,       /* число под осью x                              */
    axisLabelY: 9,        /* число левее оси y                             */
    origin:      8,
    originDown: 18,
    axisName:   10,
    curveLabel: 15,       /* отступ подписи графика от линии               */
    pointLabel: 9
  },

  /* Режим подписей осей по умолчанию: 0, 1 и −1. */
  axisLabels: 'minimal',

  /* Порядок слоёв. labelsOnTop=true: подписи чисел рисуются ПОВЕРХ графика,
     поэтому белая обводка действительно спасает подпись «1» на оси x.
     false — строгий порядок «подписи → график», как в ТЗ; тогда линия
     ложится поверх подписи и обводка ничего не даёт.                      */
  layers: { labelsOnTop: true },

  /* Подбор места для подписи графика: доли видимой длины линии,
     которые перебираются, отступ от края поля и надбавка за внешнюю
     сторону линии (дальше от начала координат) и за середину линии.       */
  curveLabelScan:   { from: 0.10, to: 0.90, step: 0.02 },
  curveLabelEdge:    8,    /* не ближе к краю поля                        */
  curveLabelClear:  10,    /* минимальный зазор до линий, осей и точек    */
  curveLabelProbe:   5,    /* шаг опроса препятствий, пикселей            */
  curveLabelOuter:   6,    /* надбавка за внешнюю сторону линии           */
  curveLabelMiddle:  8     /* надбавка за место ближе к середине линии    */
};

/* ══════════════════════════════════════════════════════════
   Сэмплеры кривых: type -> function(curve, window) -> [ломаные]
   Ломаная — массив точек { x, y } в математических координатах.
   ══════════════════════════════════════════════════════════ */
var CURVES = {};

function registerCurve(type, sampler) { CURVES[type] = sampler; }

registerCurve('line', function (curve, win) {
  var span = (win.xmax - win.xmin) + (win.ymax - win.ymin) + 8;
  var x1 = win.xmin - span;
  var x2 = win.xmax + span;
  return [[
    { x: x1, y: curve.k * x1 + curve.b },
    { x: x2, y: curve.k * x2 + curve.b }
  ]];
});

/* ══════════════════════════════════════════════════════════
   Утилиты
   ══════════════════════════════════════════════════════════ */
var EPS = 1e-9;

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* Пиксели округляем до сотых: SVG чистый, вывод детерминированный. */
function px(value) {
  var rounded = Math.round(value * 100) / 100;
  return String(rounded === 0 ? 0 : rounded);
}

/* Числа на чертеже — с запятой, как в бланке ЕГЭ. */
function fmt(value) {
  var rounded = Math.round(value * 100) / 100;
  var text = String(rounded).replace('.', ',');
  return text.charAt(0) === '-' ? THEME.minus + text.slice(1) : text;
}

function color(name) {
  if (!name) { return THEME.colors.axis; }
  if (name.charAt(0) === '#') { return name; }
  return THEME.colors[name] || THEME.colors.axis;
}

function pick(value, fallback) { return value === undefined || value === null ? fallback : value; }

/* ══════════════════════════════════════════════════════════
   Окно: прямоугольное, охват по осям задаётся независимо
   Симметрия и квадратность не требуются: охват по x и по y может
   быть разным. Масштаб при этом общий — одна единица по обеим осям
   занимает одинаковое число пикселей, потому что sx и sy считают
   от одного cell. Растянуть одну ось относительно другой нельзя
   по построению, и угол наклона прямой не искажается.
   Та же проверка вызывается из validate.js.
   ══════════════════════════════════════════════════════════ */
function checkWindow(win) {
  var errors = [];
  if (!win) { return ['окно не задано']; }

  var cellsX = win.xmax - win.xmin;
  var cellsY = win.ymax - win.ymin;
  if (cellsX < EPS) { errors.push('пустое окно по x'); }
  if (cellsY < EPS) { errors.push('пустое окно по y'); }
  return errors;
}

/* ══════════════════════════════════════════════════════════
   Обрезка ломаной по окну (Лианг — Барски по каждому звену)
   ══════════════════════════════════════════════════════════ */
function clipSegment(a, b, win) {
  var dx = b.x - a.x;
  var dy = b.y - a.y;
  var t0 = 0;
  var t1 = 1;
  var p = [-dx, dx, -dy, dy];
  var q = [a.x - win.xmin, win.xmax - a.x, a.y - win.ymin, win.ymax - a.y];

  for (var i = 0; i < 4; i++) {
    if (Math.abs(p[i]) < EPS) {
      if (q[i] < 0) { return null; }
      continue;
    }
    var t = q[i] / p[i];
    if (p[i] < 0) { if (t > t1) { return null; } if (t > t0) { t0 = t; } }
    else { if (t < t0) { return null; } if (t < t1) { t1 = t; } }
  }
  if (t1 - t0 < EPS) { return null; }
  return [
    { x: a.x + t0 * dx, y: a.y + t0 * dy },
    { x: a.x + t1 * dx, y: a.y + t1 * dy }
  ];
}

/* Обрезанная ломаная может распасться на несколько кусков. */
function clipPolyline(points, win) {
  var pieces = [];
  var current = null;

  for (var i = 0; i + 1 < points.length; i++) {
    var seg = clipSegment(points[i], points[i + 1], win);
    if (!seg) { current = null; continue; }
    if (current && near(current[current.length - 1], seg[0])) { current.push(seg[1]); }
    else { current = [seg[0], seg[1]]; pieces.push(current); }
  }
  return pieces;
}

function near(a, b) { return Math.abs(a.x - b.x) < 1e-7 && Math.abs(a.y - b.y) < 1e-7; }

/* ══════════════════════════════════════════════════════════
   Рендер
   ══════════════════════════════════════════════════════════ */
/* Второй аргумент — отчёт о размещении: рендерер складывает туда
   реальные прямоугольники подписей и фигур. По нему validate.js
   проверяет наложения на том же, что видит ученик, а не на догадках. */
function renderGraph(scene, report) {
  var win = scene.window;
  var problems = checkWindow(win);
  if (problems.length) { throw new Error('renderer: ' + problems.join('; ')); }

  var g = THEME.geometry;
  var cell = pick(scene.cell, g.cell);

  /* Стороны считаются раздельно: охват по осям может не совпадать.
     У квадратного окна обе величины равны прежнему size. */
  var width = (win.xmax - win.xmin) * cell + g.pad * 2;
  var height = (win.ymax - win.ymin) * cell + g.pad * 2;

  function sx(x) { return g.pad + (x - win.xmin) * cell; }
  function sy(y) { return g.pad + (win.ymax - y) * cell; }

  var axisX = sy(0);          /* пиксельная строка оси x */
  var axisY = sx(0);          /* пиксельный столбец оси y */

  var mode = pick(scene.axisLabels, THEME.axisLabels);
  /* Строгие правила подписей: расхождение подтемы «Квадратичная
     функция». Сцена объявляет их сама, поэтому чертежи остальных
     подтем рисуются ровно как прежде. */
  var strict = scene.labelRules === 'strict';
  var axes = scene.axes || {};
  var grid = scene.grid || {};
  var step = pick(grid.step, 1);

  var head = [];
  var gridLayer = [];
  var axisLayer = [];
  var labelLayer = [];
  var shapeLayer = [];
  var curveLayer = [];
  var pointLayer = [];
  var curveLabelLayer = [];

  head.push('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + px(width) + ' ' + px(height) + '"' +
    ' width="' + px(width) + '" height="' + px(height) + '" role="img"' +
    (scene.alt ? ' aria-label="' + esc(scene.alt) + '"' : ' aria-hidden="true"') +
    ' style="max-width:100%;height:auto">');
  if (scene.alt) { head.push('<title>' + esc(scene.alt) + '</title>'); }
  if (report) { report.cell = cell; report.sx = sx; report.sy = sy; }
  head.push('<rect x="0" y="0" width="' + px(width) + '" height="' + px(height) + '" fill="' +
    THEME.colors.bg + '"/>');

  /* Сетка: только внутренние линии, крайние не рисуются —
     иначе поле читается как обведённый рамкой прямоугольник. ---------- */
  if (pick(grid.show, true)) {
    var lines = [];
    for (var gx = Math.ceil(win.xmin / step) * step; gx <= win.xmax + EPS; gx += step) {
      if (gx <= win.xmin + EPS || gx >= win.xmax - EPS) { continue; }
      lines.push('M' + px(sx(gx)) + ' ' + px(sy(win.ymin)) + 'V' + px(sy(win.ymax)));
    }
    for (var gy = Math.ceil(win.ymin / step) * step; gy <= win.ymax + EPS; gy += step) {
      if (gy <= win.ymin + EPS || gy >= win.ymax - EPS) { continue; }
      lines.push('M' + px(sx(win.xmin)) + ' ' + px(sy(gy)) + 'H' + px(sx(win.xmax)));
    }
    gridLayer.push('<path d="' + lines.join('') + '" fill="none" stroke="' + THEME.colors.grid +
      '" stroke-width="' + THEME.width.grid + '"/>');
  }

  /* Оси: стрелка только справа и сверху, противоположный конец
     доходит до края поля и просто обрывается (stroke-linecap butt). ---- */
  var tipX = sx(win.xmax) + g.arrowExtend;
  var tipY = sy(win.ymax) - g.arrowExtend;
  axisLayer.push('<path d="M' + px(sx(win.xmin)) + ' ' + px(axisX) + 'H' + px(tipX) +
    'M' + px(axisY) + ' ' + px(sy(win.ymin)) + 'V' + px(tipY) + '" fill="none" stroke="' +
    THEME.colors.axis + '" stroke-width="' + THEME.width.axis + '" stroke-linecap="butt"/>');
  axisLayer.push('<path d="M' + px(tipX) + ' ' + px(axisX) +
    'L' + px(tipX - g.arrowLen) + ' ' + px(axisX - g.arrowHalf) +
    'L' + px(tipX - g.arrowLen) + ' ' + px(axisX + g.arrowHalf) + 'Z' +
    'M' + px(axisY) + ' ' + px(tipY) +
    'L' + px(axisY - g.arrowHalf) + ' ' + px(tipY + g.arrowLen) +
    'L' + px(axisY + g.arrowHalf) + ' ' + px(tipY + g.arrowLen) + 'Z" fill="' +
    THEME.colors.axis + '"/>');

  /* Засечки: не ближе tickEdgeCells к краю поля, поэтому между
     последней засечкой и стрелкой остаётся зазор больше клетки,
     а у левого и нижнего концов осей нет «стопоров». ------------------ */
  function ticked(value, lo, hi) {
    return value >= lo + g.tickEdgeCells - EPS &&
           value <= hi - g.tickEdgeCells + EPS &&
           Math.abs(value) > EPS;
  }

  /* Подписи чисел. В режиме 'minimal' подписаны только 0, 1 и −1:
     единичный отрезок задан, остальное ученик отсчитывает по клеткам.
     В режиме 'none' чисел нет вовсе — это миниатюра, где цифры при
     уменьшении всё равно не прочитать; засечки при этом остаются. */
  function labelled(value, lo, hi) {
    if (mode === 'none' || !ticked(value, lo, hi)) { return false; }
    return mode === 'full' ? true : Math.abs(Math.abs(value) - 1) < EPS;
  }

  /* Деления оси. По умолчанию — целые, подписи числом, как было.
     Необязательное axes.ticks задаёт свои положения и подписи
     строками: только так на оси появляются доли π, которые числом
     записать нельзя. Формат: axes.ticks.x = [{ at, label }],
     label необязательна — без неё будет засечка без подписи. */
  function tickList(axis) {
    var custom = axes.ticks && axes.ticks[axis];
    var lo = axis === 'x' ? win.xmin : win.ymin;
    var hi = axis === 'x' ? win.xmax : win.ymax;

    if (custom) {
      return custom.filter(function (item) { return ticked(item.at, lo, hi); })
        .map(function (item) {
          return { at: item.at, text: item.label === undefined ? null : item.label };
        });
    }

    var out = [];
    for (var v = Math.ceil(lo); v <= hi + EPS; v++) {
      if (!ticked(v, lo, hi)) { continue; }
      out.push({ at: v, text: labelled(v, lo, hi) ? fmt(v) : null });
    }
    return out;
  }

  /* Отмеченная точка садится на подпись деления и закрывает её.
     Значение деления при этом видно из подписи самой точки, так что
     подпись убирается, а не рисуется под кружком.

     Проверяется не «точка стоит на оси», а настоящая геометрия:
     кружок радиуса pointRadius против прямоугольника подписи.
     Точка рядом с осью закрывает подпись ничуть не меньше, чем
     точка ровно на ней. */
  function coveredByPoint(cx, cy, halfW, halfH) {
    if (!strict) { return false; }
    return (scene.points || []).some(function (point) {
      var dx = Math.max(Math.abs(sx(point.x) - cx) - halfW, 0);
      var dy = Math.max(Math.abs(sy(point.y) - cy) - halfH, 0);
      return Math.sqrt(dx * dx + dy * dy) < g.pointRadius;
    });
  }

  var ticksX = tickList('x');
  var ticksY = tickList('y');

  var ticks = [];
  ticksX.forEach(function (item) {
    ticks.push('M' + px(sx(item.at)) + ' ' + px(axisX - g.tick) + 'v' + px(g.tick * 2));
  });
  ticksY.forEach(function (item) {
    ticks.push('M' + px(axisY - g.tick) + ' ' + px(sy(item.at)) + 'h' + px(g.tick * 2));
  });
  axisLayer.push('<path d="' + ticks.join('') + '" fill="none" stroke="' + THEME.colors.axis +
    '" stroke-width="' + THEME.width.tick + '" stroke-linecap="butt"/>');

  /* Вспомогательные фигуры (треугольник наклона): геометрия идёт
     под графиком, чтобы синяя прямая осталась самым заметным
     элементом, а подписи — поверх, со своим подбором места. -------- */
  var shapeLabels = [];
  (scene.shapes || []).forEach(function (shape) {
    if (shape.type === 'label') { shapeLabels.push(shape); return; }
    shapeLayer.push(renderShape(shape, sx, sy, cell));

    if (report) {
      if (!report.shapes) { report.shapes = []; }
      report.shapes.push({ type: shape.type, id: shape.id, shape: shape, cell: cell,
        at: shape.at ? [sx(shape.at[0]), sy(shape.at[1])] : null });
    }
  });

  /* Кривые: поверх осей, обрезаны ровно по границе поля --------------- */
  var drawn = [];
  (scene.curves || []).forEach(function (curve) {
    var sampler = CURVES[curve.type];
    if (!sampler) { throw new Error('renderer: неизвестный тип кривой «' + curve.type + '»'); }

    var stroke = color(curve.color);
    var pieces = [];
    sampler(curve, win).forEach(function (polyline) {
      clipPolyline(polyline, win).forEach(function (piece) { pieces.push(piece); });
    });
    if (!pieces.length) { return; }

    var d = pieces.map(function (piece) {
      return 'M' + piece.map(function (p) { return px(sx(p.x)) + ' ' + px(sy(p.y)); }).join('L');
    }).join('');
    /* Пунктирная кривая — эталон для сравнения (обычная парабола рядом
       со сдвинутой). Штрих тот же, что у вспомогательных линий. */
    var dash = curve.style === 'dashed' ? ' stroke-dasharray="' + THEME.helper.dash + '"' : '';
    /* Класс по ключу цвета. Он нужен печати: на чёрно-белом листе цвета
       нет, и две прямые различаются толщиной линии — её задаёт CSS,
       а правило CSS сильнее атрибута. Без CSS работает атрибут, то есть
       на сайте чертёж не меняется. */
    curveLayer.push('<path class="graph-curve graph-curve--' + (curve.color || 'lineA') +
      '" d="' + d + '" fill="none" stroke="' + stroke + '" stroke-width="' +
      THEME.width.curve + '" stroke-linecap="round" stroke-linejoin="round"' + dash + '/>');

    drawn.push({ curve: curve, pieces: pieces, stroke: stroke });
  });

  var labelBoxes = [];
  function boxFor(value, cx, cy) {
    var half = textWidth(value, THEME.font.axisLabel) / 2;
    labelBoxes.push({ x: cx, y: cy, halfW: half, halfH: THEME.font.axisLabel * 0.62 });
  }

  ticksX.forEach(function (item) {
    if (item.text === null) { return; }
    var textX = item.text;
    var boxXc = sx(item.at);
    var boxYc = axisX + THEME.gap.axisLabelX - THEME.font.axisLabel * 0.35;
    var boxXh = textWidth(textX, THEME.font.axisLabel) / 2;
    if (coveredByPoint(boxXc, boxYc, boxXh, THEME.font.axisLabel * 0.62)) { return; }
    labelLayer.push(numberText(textX, sx(item.at), axisX + THEME.gap.axisLabelX, 'middle'));
    boxFor(textX, sx(item.at), axisX + THEME.gap.axisLabelX - THEME.font.axisLabel * 0.35);
    collect(report, 'axisLabel', null, sx(item.at),
      axisX + THEME.gap.axisLabelX - THEME.font.axisLabel * 0.35,
      textWidth(textX, THEME.font.axisLabel) / 2, THEME.font.axisLabel * 0.62);
  });
  ticksY.forEach(function (item) {
    if (item.text === null) { return; }
    var textY = item.text;
    var half = textWidth(textY, THEME.font.axisLabel) / 2;
    if (coveredByPoint(axisY - THEME.gap.axisLabelY - half, sy(item.at), half,
      THEME.font.axisLabel * 0.62)) { return; }
    labelLayer.push(numberText(textY, axisY - THEME.gap.axisLabelY, sy(item.at) + 4.5, 'end'));
    boxFor(textY, axisY - THEME.gap.axisLabelY - half, sy(item.at));
    collect(report, 'axisLabel', null, axisY - THEME.gap.axisLabelY - half, sy(item.at),
      half, THEME.font.axisLabel * 0.62);
  });
  var originTaken = strict && (scene.points || []).some(function (point) {
    return dist(sx(point.x), sy(point.y), axisY, axisX) < g.pointRadius * 2;
  });
  if (pick(axes.origin, '0') !== null && !originTaken) {
    /* Подпись начала координат уходит в свободную четверть: если
       в начале координат стоит точка или через него идёт график,
       классическое место слева-снизу занято. */
    var originText = pick(axes.origin, '0');
    var originHalfW = textWidth(originText, THEME.font.axisName) / 2;
    var originHalfH = THEME.font.axisName * 0.62;
    var originField = { left: sx(win.xmin), right: sx(win.xmax),
                        top: sy(win.ymax), bottom: sy(win.ymin) };
    var originSpot = bestLabelSpot(axisY, axisX, originHalfW, originHalfH, THEME.gap.origin,
      obstacleCloud(scene, drawn, sx, sy, { x: axisY, y: axisX }, originField, labelBoxes,
        { axes: false }), originField);

    labelBoxes.push({ x: originSpot.x, y: originSpot.y, halfW: originHalfW, halfH: originHalfH });
    labelLayer.push(mathText(originText, originSpot.x + originHalfW,
      originSpot.y + originHalfH * 0.55, 'end'));
  }

  labelLayer.push(mathText(pick(axes.labelX, 'x'), tipX - 2, axisX - THEME.gap.axisName, 'end'));
  labelLayer.push(mathText(pick(axes.labelY, 'y'), axisY + THEME.gap.axisName, tipY + 8, 'start'));

  /* Подписи фигур: сторону выбираем так же, как у точек, но с оглядкой
     на подсказку от того, кто фигуру построил. ---------------------- */
  var shapeLabelLayer = [];
  shapeLabels.forEach(function (shape) {
    var size = shape.size || THEME.font.helperLabel;
    var halfW = textWidth(shape.text, size, THEME.font.curveLabelTrack) / 2;
    var halfH = size * 0.62;
    var offset = shape.offset || [0, 0];
    var prefer = [Math.sign(offset[0]) || 0, Math.sign(offset[1]) || 0];
    var cloud = obstacleCloud(scene, drawn, sx, sy, { x: axisY, y: axisX },
      { left: sx(win.xmin), right: sx(win.xmax), top: sy(win.ymax), bottom: sy(win.ymin) },
      labelBoxes);
    var field = { left: sx(win.xmin), right: sx(win.xmax),
                  top: sy(win.ymax), bottom: sy(win.ymin) };
    var spot;
    if (shape.slide) {
      spot = slideLabelSpot(shape, sx, sy, halfW, halfH, cloud, field);
    } else {
      /* Якорей может быть несколько, но они перечислены по удалению
         от того места, где подпись уместнее всего: дальний берётся,
         только если ближний заметно хуже. */
      (shape.anchors || [shape.at]).forEach(function (anchor, index) {
        var candidate = bestLabelSpot(sx(anchor[0]), sy(anchor[1]), halfW, halfH,
          shape.gap === undefined ? THEME.helper.labelGap : shape.gap, cloud, field, prefer);
        candidate.score -= index * THEME.helper.anchorPenalty;
        if (!spot || candidate.score > spot.score + 1e-9) { spot = candidate; }
      });
    }

    labelBoxes.push({ x: spot.x, y: spot.y, halfW: halfW, halfH: halfH });
    collect(report, 'shapeLabel', shape.id, spot.x, spot.y, halfW, halfH);
    shapeLabelLayer.push('<g' + (shape.id ? ' id="' + esc(shape.id) + '"' : '') + '>' +
      svgText(shape.text, spot.x, spot.y + halfH * 0.55, 'middle', {
        size:   size,
        family: THEME.font.curveLabelFamily,
        weight: THEME.font.pointLabelWeight,
        math:   true,
        fill:   color(shape.color || 'accent')
      }) + '</g>');
  });

  /* Точки и их подписи: подпись уходит в свободную сторону,
     чтобы не садиться на линию, оси и числа. ------------------------- */
  var field = { left: sx(win.xmin), right: sx(win.xmax), top: sy(win.ymax), bottom: sy(win.ymin) };
  var originPx = { x: axisY, y: axisX };

  (scene.points || []).forEach(function (point) {
    if (report) {
      if (!report.points) { report.points = []; }
      report.points.push({ x: sx(point.x), y: sy(point.y), r: g.pointRadius });
    }
    var fill = THEME.colors.pointFill || color(point.color);
    var open = point.style === 'open';
    pointLayer.push('<circle cx="' + px(sx(point.x)) + '" cy="' + px(sy(point.y)) + '" r="' +
      px(g.pointRadius) + '" fill="' + (open ? THEME.colors.bg : fill) + '" stroke="' +
      (open ? fill : THEME.colors.pointStroke) + '" stroke-width="' + THEME.width.pointStroke + '"/>');
  });

  (scene.points || []).forEach(function (point) {
    if (!point.label) { return; }
    var size = strict ? THEME.font.pointLabelStrict : THEME.font.pointLabel;
    var halfW = (strict ? pointTextWidth(point.label, size)
                        : textWidth(point.label, size)) / 2;
    var halfH = size * 0.62;
    var cloud = obstacleCloud(scene, drawn, sx, sy, originPx, field,
      strict ? [] : labelBoxes);
    var spot;
    if (strict) {
      /* Зазор до точки — не больше половины клетки: подпись читается
         как подпись именно этой точки, а не соседней. Кружок она при
         этом не задевает. */
      var gapStrict = Math.max(g.pointRadius + 2,
        Math.min(THEME.gap.pointLabel + g.pointRadius, cell * 0.5));
      spot = pointLabelSpot(sx(point.x), sy(point.y), halfW, halfH, gapStrict,
        cloud, labelBoxes, field);
    } else {
      spot = bestLabelSpot(sx(point.x), sy(point.y), halfW, halfH,
        THEME.gap.pointLabel + g.pointRadius, cloud, field);
    }

    labelBoxes.push({ x: spot.x, y: spot.y, halfW: halfW, halfH: halfH });
    collect(report, 'pointLabel', null, spot.x, spot.y, halfW, halfH);
    if (report) {
      report.boxes[report.boxes.length - 1].at = { x: sx(point.x), y: sy(point.y) };
    }
    /* Координаты точки — тёмные, как числа осей: цветом кривой их
       набирать незачем, а у общей точки двух кривых такого цвета и
       нет. Белая подложка под текстом — общая для всех подписей. */
    pointLayer.push(labelText(point.label, spot.x, spot.y + halfH * 0.55, 'middle',
      size, strict ? THEME.colors.label : color(point.color)));
  });

  /* Подписи графиков: горизонтально, у самой линии, в стороне
     от точек и пересечений с осями. -------------------------------------*/
  drawn.forEach(function (item) {
    if (!item.curve.label) { return; }
    /* Зона может быть пустой: тогда места под подпись нет и её не рисуем. */
    if (item.curve.labelZone === null) { return; }
    curveLabelLayer.push(curveLabel(item, scene, win, sx, sy, drawn, labelBoxes, report, cell,
      strict));
  });

  var body = gridLayer.concat(axisLayer, shapeLayer);
  if (THEME.layers.labelsOnTop) {
    body = body.concat(curveLayer, pointLayer, labelLayer, shapeLabelLayer);
  } else {
    body = body.concat(labelLayer, curveLayer, pointLayer, shapeLabelLayer);
  }
  return head.concat(body, curveLabelLayer, '</svg>').join('');
}

/* Подпись легла на другую подпись — обе нечитаемы. Для строгих
   правил это дороже любого зазора, поэтому считается отдельно от
   облака: зазор там меряется до линий и осей, а лечь на линию
   подпись может — под ней белая подложка. */
function textHit(boxes, strict, cx, cy, halfW, halfH) {
  if (!strict) { return false; }
  for (var i = 0; i < boxes.length; i++) {
    if (rectDist(boxes[i], cx, cy, halfW, halfH) <= 0) { return true; }
  }
  return false;
}

/* ══════════════════════════════════════════════════════════
   Подпись графика: горизонтально, без поворота, с белой подложкой.
   Перебираем точки вдоль видимой части линии и обе стороны от неё,
   считаем зазор от прямоугольника подписи до облака препятствий —
   самих графиков, осей и отмеченных точек — и берём лучшее место.
   Не нашлось — сдвигаемся вдоль линии, но никогда не вращаем.
   ══════════════════════════════════════════════════════════ */
function curveLabel(item, scene, win, sx, sy, all, labelBoxes, report, cell, strict) {
  /* Зона задаётся снаружи: подпись ставится только на той части
     прямой, что лежит за треугольником. Пустая зона — подписи нет. */
  var zone = item.curve.labelZone;
  var piece = item.pieces[0];
  for (var i = 1; i < item.pieces.length; i++) {
    if (item.pieces[i].length > piece.length) { piece = item.pieces[i]; }
  }
  /* Кривая из многих звеньев (парабола) подписывается вдоль самой
     ломаной: хорда от первой точки до последней прошла бы мимо неё. */
  if (piece.length > 2) {
    return curveLabelAlong(item, piece, scene, win, sx, sy, all, labelBoxes, report, strict);
  }
  var a = piece[0];
  var b = piece[piece.length - 1];

  var ax = sx(a.x), ay = sy(a.y), bx = sx(b.x), by = sy(b.y);
  var len = dist(ax, ay, bx, by) || 1;
  var nx = -(by - ay) / len;          /* единичная нормаль к линии */
  var ny = (bx - ax) / len;

  var size = THEME.font.curveLabel;
  var halfW = textWidth(item.curve.label, size, THEME.font.curveLabelTrack) / 2;
  var halfH = size * 0.62;

  var offset = THEME.gap.curveLabel + halfW * Math.abs(nx) + halfH * Math.abs(ny);

  var labelField = { left: sx(win.xmin), right: sx(win.xmax), top: sy(win.ymax), bottom: sy(win.ymin) };
  var origin = { x: sx(0), y: sy(0) };
  var cloud = obstacleCloud(scene, all, sx, sy, origin, labelField, labelBoxes);

  var scan = THEME.curveLabelScan;
  var best = null;
  var fallback = null;

  for (var t = scan.from; t <= scan.to + 1e-9; t += scan.step) {
    var lx = ax + (bx - ax) * t;
    var ly = ay + (by - ay) * t;

    for (var side = 1; side >= -1; side -= 2) {
      /* Подпись горизонтальная, поэтому сдвиг по нормали учитывает
         проекцию прямоугольника подписи на эту нормаль: у крутой линии
         отойти нужно заметно дальше, чем у пологой.                    */
      var cx = lx + nx * side * offset;
      var cy = ly + ny * side * offset;
      /* Зона задаётся снаружи и проверяется по итоговому положению
         подписи: у крутой прямой сдвиг по нормали почти горизонтален
         и уводит подпись из зоны, даже если точка на линии была в ней. */
      if (zone) {
        var mathX = win.xmin + (cx - sx(win.xmin)) / cell;
        if (mathX < Math.min(zone[0], zone[1]) - 0.5 ||
            mathX > Math.max(zone[0], zone[1]) + 0.5) { continue; }
      }

      if (cx - halfW < labelField.left + THEME.curveLabelEdge) { continue; }
      if (cx + halfW > labelField.right - THEME.curveLabelEdge) { continue; }
      if (cy - halfH < labelField.top + THEME.curveLabelEdge) { continue; }
      if (cy + halfH > labelField.bottom - THEME.curveLabelEdge) { continue; }

      var clear = Infinity;
      for (var c = 0; c < cloud.length; c++) {
        var d = rectDist(cloud[c], cx, cy, halfW, halfH);
        if (d < clear) { clear = d; }
        if (clear <= 0) { break; }
      }

      /* Внешняя сторона линии — дальше от начала координат, чем сама линия. */
      var outer = dist(cx, cy, origin.x, origin.y) > dist(lx, ly, origin.x, origin.y);
      var score = clear +
        (outer ? THEME.curveLabelOuter : 0) +
        (1 - Math.abs(t - 0.5) * 2) * THEME.curveLabelMiddle;

      if (textHit(labelBoxes, strict, cx, cy, halfW, halfH)) { continue; }
      if (!fallback || clear > fallback.clear + 1e-9) { fallback = { x: cx, y: cy, clear: clear }; }
      if (clear < THEME.curveLabelClear) { continue; }
      if (!best || score > best.score + 1e-9) { best = { x: cx, y: cy, score: score }; }
    }
  }

  /* Зона задана, а места в ней не нашлось — подписи не будет:
     ставить её вне зоны значит вернуть её к треугольнику. */
  if (zone && !best && !fallback) { return ''; }

  var spot = best || fallback ||
    { x: (ax + bx) / 2 + nx * offset, y: (ay + by) / 2 + ny * offset };

  labelBoxes.push({ x: spot.x, y: spot.y, halfW: halfW, halfH: halfH });
  collect(report, 'curveLabel', 'curve-label', spot.x, spot.y, halfW, halfH);

  return curveLabelText(item.curve.label, spot.x, spot.y + halfH * 0.55, item.stroke);
}

/* Подпись кривой вдоль ломаной: точки перебираются по длине дуги,
   подпись отводится по местной нормали — по обе стороны, — а зазор до
   облака препятствий считается так же, как у прямой. Зона подписи
   у кривых не задаётся: она нужна только треугольнику наклона. */
function curveLabelAlong(item, piece, scene, win, sx, sy, all, labelBoxes, report, strict) {
  var pts = piece.map(function (p) { return { x: sx(p.x), y: sy(p.y) }; });
  var cum = [0];
  for (var i = 1; i < pts.length; i++) {
    cum.push(cum[i - 1] + dist(pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y));
  }
  var total = cum[cum.length - 1] || 1;

  /* Точка на расстоянии s от начала и единичная нормаль в ней. */
  function at(s) {
    var k = 1;
    while (k < cum.length - 1 && cum[k] < s) { k++; }
    var p0 = pts[k - 1], p1 = pts[k];
    var seg = cum[k] - cum[k - 1] || 1;
    var t = Math.min(1, Math.max(0, (s - cum[k - 1]) / seg));
    var len = dist(p0.x, p0.y, p1.x, p1.y) || 1;
    return { x: p0.x + (p1.x - p0.x) * t, y: p0.y + (p1.y - p0.y) * t,
             nx: -(p1.y - p0.y) / len, ny: (p1.x - p0.x) / len };
  }

  var size = THEME.font.curveLabel;
  var halfW = textWidth(item.curve.label, size, THEME.font.curveLabelTrack) / 2;
  var halfH = size * 0.62;
  var labelField = { left: sx(win.xmin), right: sx(win.xmax), top: sy(win.ymax), bottom: sy(win.ymin) };
  var origin = { x: sx(0), y: sy(0) };
  var cloud = obstacleCloud(scene, all, sx, sy, origin, labelField, labelBoxes);

  var scan = THEME.curveLabelScan;
  var best = null;
  var fallback = null;

  for (var t = scan.from; t <= scan.to + 1e-9; t += scan.step) {
    var here = at(t * total);
    var offset = THEME.gap.curveLabel + halfW * Math.abs(here.nx) + halfH * Math.abs(here.ny);

    for (var side = 1; side >= -1; side -= 2) {
      var cx = here.x + here.nx * side * offset;
      var cy = here.y + here.ny * side * offset;

      if (cx - halfW < labelField.left + THEME.curveLabelEdge) { continue; }
      if (cx + halfW > labelField.right - THEME.curveLabelEdge) { continue; }
      if (cy - halfH < labelField.top + THEME.curveLabelEdge) { continue; }
      if (cy + halfH > labelField.bottom - THEME.curveLabelEdge) { continue; }

      var clear = Infinity;
      for (var c = 0; c < cloud.length; c++) {
        var d = rectDist(cloud[c], cx, cy, halfW, halfH);
        if (d < clear) { clear = d; }
        if (clear <= 0) { break; }
      }

      var outer = dist(cx, cy, origin.x, origin.y) > dist(here.x, here.y, origin.x, origin.y);
      var score = clear +
        (outer ? THEME.curveLabelOuter : 0) +
        (1 - Math.abs(t - 0.5) * 2) * THEME.curveLabelMiddle;

      if (textHit(labelBoxes, strict, cx, cy, halfW, halfH)) { continue; }
      if (!fallback || clear > fallback.clear + 1e-9) { fallback = { x: cx, y: cy, clear: clear }; }
      if (clear < THEME.curveLabelClear) { continue; }
      if (!best || score > best.score + 1e-9) { best = { x: cx, y: cy, score: score }; }
    }
  }

  var mid = at(total / 2);
  var spot = best || fallback ||
    { x: mid.x + mid.nx * THEME.gap.curveLabel, y: mid.y + mid.ny * THEME.gap.curveLabel };

  labelBoxes.push({ x: spot.x, y: spot.y, halfW: halfW, halfH: halfH });
  collect(report, 'curveLabel', 'curve-label', spot.x, spot.y, halfW, halfH);

  return curveLabelText(item.curve.label, spot.x, spot.y + halfH * 0.55, item.stroke);
}

/* ══════════════════════════════════════════════════════════
   Вспомогательные фигуры сцены
   Рендерер не знает, что это треугольник наклона: он рисует
   отрезок, многоугольник, метку прямого угла, дугу и подпись.
   Геометрию считает graph/triangle.js, движение — graph/animate.js;
   id нужен, чтобы анимация могла найти фигуру в готовом SVG.
   ══════════════════════════════════════════════════════════ */
function renderShape(shape, sx, sy, cell) {
  var stroke = color(shape.color || 'accent');
  var id = shape.id ? ' id="' + esc(shape.id) + '"' : '';
  var dash = shape.style === 'dashed' ? ' stroke-dasharray="' + THEME.helper.dash + '"' : '';

  /* Отрезок рисуется как path: анимация берёт у него длину
     и прочерчивает штрихом, у line длины нет. */
  if (shape.type === 'segment') {
    return '<path' + id + ' d="M' + px(sx(shape.from[0])) + ' ' + px(sy(shape.from[1])) +
      'L' + px(sx(shape.to[0])) + ' ' + px(sy(shape.to[1])) +
      '" fill="none" stroke="' + stroke + '" stroke-width="' + THEME.width.helper +
      '" stroke-linecap="round"' + dash + '/>';
  }

  if (shape.type === 'polygon') {
    return '<polygon' + id + ' points="' + shape.points.map(function (point) {
      return px(sx(point[0])) + ',' + px(sy(point[1]));
    }).join(' ') + '" fill="' + stroke + '" fill-opacity="' +
      (shape.fillOpacity === undefined ? THEME.helper.fillOpacity : shape.fillOpacity) +
      '" stroke="none"/>';
  }

  /* Квадратик прямого угла: две стороны внутрь треугольника.
     Сторона задана в пикселях — клетка при разных окнах разная,
     а квадратик обязан выглядеть одинаково. Направления приходят
     знаками, поэтому все четыре ориентации считаются одинаково. */
  if (shape.type === 'rightAngle') {
    var side = shape.sizePx === undefined ? THEME.helper.rightAnglePx : shape.sizePx;
    var cx0 = sx(shape.at[0]);
    var cy0 = sy(shape.at[1]);
    var stepX = (shape.alongX || 1) * side;
    var stepY = -(shape.alongY || 1) * side;      /* ось y на экране вниз */
    return '<path' + id + ' d="M' + px(cx0 + stepX) + ' ' + px(cy0) +
      'L' + px(cx0 + stepX) + ' ' + px(cy0 + stepY) +
      'L' + px(cx0) + ' ' + px(cy0 + stepY) +
      '" fill="none" stroke="' + stroke + '" stroke-width="' + THEME.width.helperMark + '"/>';
  }

  /* Окружность: нужна тригонометрическому кругу в разборе. */
  if (shape.type === 'circle') {
    return '<circle' + id + ' cx="' + px(sx(shape.at[0])) + '" cy="' + px(sy(shape.at[1])) +
      '" r="' + px(shape.radius * cell) + '" fill="' +
      (shape.fill ? color(shape.fill) : 'none') + '" fill-opacity="' +
      (shape.fillOpacity === undefined ? 1 : shape.fillOpacity) + '" stroke="' + stroke +
      '" stroke-width="' + (shape.width || THEME.width.helperMark) + '"' + dash + '/>';
  }

  /* Точка: маленький кружок с белой обводкой, как опорные точки. */
  if (shape.type === 'dot') {
    return '<circle' + id + ' cx="' + px(sx(shape.at[0])) + '" cy="' + px(sy(shape.at[1])) +
      '" r="' + px(shape.radius === undefined ? THEME.geometry.pointRadius * 0.8 : shape.radius) +
      '" fill="' + stroke + '" stroke="' + THEME.colors.pointStroke +
      '" stroke-width="' + THEME.width.pointStroke * 0.7 + '"/>';
  }

  /* Дуга угла наклона у левой опорной точки. */
  if (shape.type === 'arc') {
    var r = (shape.radius === undefined ? THEME.helper.arcRadius : shape.radius) * cell;
    if (shape.maxRadiusPx !== undefined) { r = Math.min(r, shape.maxRadiusPx); }
    var cx = sx(shape.at[0]);
    var cy = sy(shape.at[1]);
    var a1 = -shape.from * Math.PI / 180;
    var a2 = -shape.to * Math.PI / 180;
    var large = Math.abs(shape.to - shape.from) > 180 ? 1 : 0;
    var sweep = shape.to > shape.from ? 0 : 1;
    return '<path' + id + ' d="M' + px(cx + r * Math.cos(a1)) + ' ' + px(cy + r * Math.sin(a1)) +
      'A' + px(r) + ' ' + px(r) + ' 0 ' + large + ' ' + sweep + ' ' +
      px(cx + r * Math.cos(a2)) + ' ' + px(cy + r * Math.sin(a2)) +
      '" fill="none" stroke="' + stroke + '" stroke-width="' + THEME.width.helperMark + '"/>';
  }

  if (shape.type === 'label') {
    var offset = shape.offset || [0, 0];
    return '<g' + id + '>' + svgText(shape.text,
      sx(shape.at[0]) + offset[0], sy(shape.at[1]) + offset[1],
      shape.anchor || 'middle', {
        size:   shape.size || THEME.font.pointLabel,
        family: THEME.font.curveLabelFamily,
        weight: THEME.font.pointLabelWeight,
        math:   true,
        fill:   stroke
      }) + '</g>';
  }

  throw new Error('renderer: неизвестная фигура «' + shape.type + '»');
}

/* Подпись катета стоит снаружи треугольника и двигается только вдоль
   своего катета: внутрь она заходить не должна, а наложение на ось,
   точку или соседнюю подпись снимается сдвигом. */
function slideLabelSpot(shape, sx, sy, halfW, halfH, cloud, field) {
  var offset = shape.offset || [0, 0];
  var baseX = sx(shape.at[0]) + offset[0];
  var baseY = sy(shape.at[1]) + offset[1];
  var alongX = shape.slide === 'x';
  var reach = THEME.helper.slideReachPx;
  var step = THEME.helper.slideStepPx;
  var best = null;

  for (var shift = -reach; shift <= reach + 1e-9; shift += step) {
    var cx = baseX + (alongX ? shift : 0);
    var cy = baseY + (alongX ? 0 : shift);
    if (cx - halfW < field.left || cx + halfW > field.right) { continue; }
    if (cy - halfH < field.top || cy + halfH > field.bottom) { continue; }

    var clear = Infinity;
    for (var c = 0; c < cloud.length; c++) {
      clear = Math.min(clear, rectDist(cloud[c], cx, cy, halfW, halfH));
      if (clear <= 0) { break; }
    }
    /* При равном зазоре ближе к середине катета. */
    var score = (clear > 0 ? clear : clear - THEME.helper.overlapPenalty) -
      Math.abs(shift) * 0.05;
    if (!best || score > best.score + 1e-9) { best = { x: cx, y: cy, score: score }; }
  }
  return best || { x: baseX, y: baseY };
}

/* Свободное место для короткой подписи рядом с точкой.
   Перебираются восемь направлений от якоря; берётся то, где до
   облака препятствий дальше всего. Диагональ вверх-вправо идёт
   первой: это привычное место подписи точки. */
var LABEL_DIRECTIONS = [
  [1, -1], [-1, -1], [1, 1], [-1, 1],
  [0, -1], [0, 1], [1, 0], [-1, 0]
];

/* Место подписи у точки по строгим правилам подтемы «Квадратичная
   функция».

   Два отличия от общего подбора. Первое: подпись стоит вплотную к
   своей точке — зазор от её рамки до точки один и тот же во всех
   положениях, и он не больше половины клетки. Раньше по диагонали
   рамка отъезжала в полтора раза дальше, чем по прямой, и подпись
   читалась как ничья. Второе: положений не восемь, а до двадцати —
   у каждой прямой стороны подпись ещё ходит вдоль себя на свою
   полуширину. Уехать от точки она при этом не может: сдвиг вдоль
   стороны зазор не меняет.

   Наложение по-прежнему дисквалифицирует место, но теперь считается
   честно, по прямоугольникам соседних подписей. */
function pointLabelSpot(ax, ay, halfW, halfH, gap, cloud, texts, field) {
  var best = null;
  var order = 0;

  /* Лечь на кривую подпись может: под ней белая подложка, и линия
     сквозь неё не читается. Лечь на другую подпись — нет: там обе
     становятся нечитаемыми. Поэтому наложение на текст стоит дороже
     всего остального вместе взятого. */
  function onText(cx, cy) {
    for (var i = 0; i < texts.length; i++) {
      if (rectDist(texts[i], cx, cy, halfW, halfH) <= 0) { return true; }
    }
    return false;
  }

  LABEL_DIRECTIONS.forEach(function (dir) {
    var diagonal = dir[0] !== 0 && dir[1] !== 0;
    /* По диагонали зазор раскладывается на две оси: иначе рамка
       окажется от точки в √2 раз дальше, чем сбоку. */
    var step = diagonal ? gap * Math.SQRT1_2 : gap;
    var dx = dir[0] * (dir[0] ? halfW + step : 0);
    var dy = dir[1] * (dir[1] ? halfH + step : 0);
    var shifts = diagonal ? [0]
      : (dir[0] !== 0 ? [0, -halfH, halfH] : [0, -halfW, halfW]);

    shifts.forEach(function (shift) {
      var cx = ax + dx + (dir[0] !== 0 ? 0 : shift);
      var cy = ay + dy + (dir[0] !== 0 ? shift : 0);
      var penalty = order * 0.6;
      order += 1;

      if (cx - halfW < field.left) { penalty += (field.left - (cx - halfW)) * 2; }
      if (cx + halfW > field.right) { penalty += ((cx + halfW) - field.right) * 2; }
      if (cy - halfH < field.top) { penalty += (field.top - (cy - halfH)) * 2; }
      if (cy + halfH > field.bottom) { penalty += ((cy + halfH) - field.bottom) * 2; }

      var clear = Infinity;
      for (var c = 0; c < cloud.length; c++) {
        clear = Math.min(clear, rectDist(cloud[c], cx, cy, halfW, halfH));
        if (clear <= 0) { break; }
      }
      var score = (clear > 0 ? clear : clear - THEME.helper.overlapPenalty) - penalty;
      if (onText(cx, cy)) { score -= THEME.helper.textPenalty; }
      if (!best || score > best.score + 1e-9) { best = { x: cx, y: cy, score: score }; }
    });
  });
  return best;
}

function bestLabelSpot(ax, ay, halfW, halfH, gap, cloud, field, prefer) {
  var best = null;
  var directions = LABEL_DIRECTIONS;

  /* Подсказанное направление пробуется первым: тот, кто строил фигуру,
     знает, с какой стороны подпись уместнее. */
  if (prefer && (prefer[0] || prefer[1])) {
    directions = LABEL_DIRECTIONS.slice().sort(function (a, b) {
      var fitA = (a[0] === prefer[0] ? 1 : 0) + (a[1] === prefer[1] ? 1 : 0);
      var fitB = (b[0] === prefer[0] ? 1 : 0) + (b[1] === prefer[1] ? 1 : 0);
      return fitB - fitA;
    });
  }

  directions.forEach(function (dir, order) {
    var cx = ax + dir[0] * (gap + halfW);
    var cy = ay + dir[1] * (gap + halfH);

    var penalty = order * 0.6;
    if (cx - halfW < field.left) { penalty += (field.left - (cx - halfW)) * 2; }
    if (cx + halfW > field.right) { penalty += ((cx + halfW) - field.right) * 2; }
    if (cy - halfH < field.top) { penalty += (field.top - (cy - halfH)) * 2; }
    if (cy + halfH > field.bottom) { penalty += ((cy + halfH) - field.bottom) * 2; }

    var clear = Infinity;
    for (var c = 0; c < cloud.length; c++) {
      clear = Math.min(clear, rectDist(cloud[c], cx, cy, halfW, halfH));
      if (clear <= 0) { break; }
    }
    /* Наложение дисквалифицирует место: любое свободное положение
       лучше любого занятого, каким бы привычным оно ни было. */
    var score = (clear > 0 ? clear : clear - THEME.helper.overlapPenalty) - penalty;
    if (!best || score > best.score + 1e-9) { best = { x: cx, y: cy, score: score }; }
  });
  return best;
}

/* Облако препятствий в пикселях: графики, оси, отмеченные точки
   и уже размещённые подписи чисел. */
function obstacleCloud(scene, all, sx, sy, origin, field, labelBoxes, opts) {
  var withAxes = !opts || opts.axes !== false;
  var cloud = [];
  var stepPx = THEME.curveLabelProbe;

  all.forEach(function (other) {
    other.pieces.forEach(function (piece) {
      for (var i = 0; i + 1 < piece.length; i++) {
        var x1 = sx(piece[i].x), y1 = sy(piece[i].y);
        var x2 = sx(piece[i + 1].x), y2 = sy(piece[i + 1].y);
        var steps = Math.max(1, Math.ceil(dist(x1, y1, x2, y2) / stepPx));
        for (var s = 0; s <= steps; s++) {
          cloud.push({ x: x1 + (x2 - x1) * s / steps, y: y1 + (y2 - y1) * s / steps });
        }
      }
    });
  });

  if (withAxes) {
    for (var px1 = field.left; px1 <= field.right; px1 += stepPx) { cloud.push({ x: px1, y: origin.y }); }
    for (var py1 = field.top; py1 <= field.bottom; py1 += stepPx) { cloud.push({ x: origin.x, y: py1 }); }
  }

  (scene.points || []).forEach(function (point) {
    cloud.push({ x: sx(point.x), y: sy(point.y) });
  });

  /* Вспомогательные фигуры — тоже препятствия: подпись графика
     не должна ложиться на треугольник наклона и его разметку. */
  (scene.shapes || []).forEach(function (shape) {
    function line(x1, y1, x2, y2) {
      var steps = Math.max(1, Math.ceil(dist(x1, y1, x2, y2) / stepPx));
      for (var i = 0; i <= steps; i++) {
        cloud.push({ x: x1 + (x2 - x1) * i / steps, y: y1 + (y2 - y1) * i / steps });
      }
    }

    if (shape.type === 'segment') {
      line(sx(shape.from[0]), sy(shape.from[1]), sx(shape.to[0]), sy(shape.to[1]));
    } else if (shape.type === 'polygon') {
      shape.points.forEach(function (point, i) {
        var next = shape.points[(i + 1) % shape.points.length];
        line(sx(point[0]), sy(point[1]), sx(next[0]), sy(next[1]));
      });
    } else if (shape.at) {
      cloud.push({ x: sx(shape.at[0]), y: sy(shape.at[1]) });
    }
  });

  (labelBoxes || []).forEach(function (box) {
    /* Строгий режим: подпись занимает свой прямоугольник целиком.
       Обычный — только середину, как было до правил квадратичной. */
    cloud.push(opts && opts.boxes === 'rect'
      ? { x: box.x, y: box.y, halfW: box.halfW, halfH: box.halfH }
      : { x: box.x, y: box.y });
    cloud.push({ x: box.x - box.halfW, y: box.y - box.halfH });
    cloud.push({ x: box.x + box.halfW, y: box.y - box.halfH });
    cloud.push({ x: box.x - box.halfW, y: box.y + box.halfH });
    cloud.push({ x: box.x + box.halfW, y: box.y + box.halfH });
  });
  return cloud;
}

/* Расстояние от точки до прямоугольника подписи. */
/* Зазор от прямоугольника подписи до препятствия. Препятствие — либо
   точка облака, либо прямоугольник (у него есть halfW и halfH): подпись
   занимает место целиком, и мерить расстояние до её середины значит
   разрешить наложение краями. Раньше так и было. */
function rectDist(item, cx, cy, halfW, halfH) {
  var dx = Math.max(Math.abs(item.x - cx) - halfW - (item.halfW || 0), 0);
  var dy = Math.max(Math.abs(item.y - cy) - halfH - (item.halfH || 0), 0);
  return Math.sqrt(dx * dx + dy * dy);
}

function dist(x1, y1, x2, y2) { return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2)); }

/* Запись прямоугольника в отчёт о размещении. */
function collect(report, kind, id, x, y, halfW, halfH) {
  if (!report) { return; }
  if (!report.boxes) { report.boxes = []; }
  report.boxes.push({ kind: kind, id: id, x: x, y: y, halfW: halfW, halfH: halfH });
}

/* Ширина подписи координат — по таблице долей кегля, снятой с того
   самого начертания, каким подпись набирается. Общая оценка в 0,56
   кегля на знак годится для слов, а у «(2; −3)» половину строки
   занимают скобки и точка с запятой, и она завышает ширину в полтора
   раза. Подпись от этого отъезжала от своей точки дальше, чем видно
   рендереру: он считал, что рамка уже дотянулась. */
var GLYPH = { '(': 0.333, ')': 0.333, ';': 0.333, ' ': 0.25,
              '\u2212': 0.57, '-': 0.57, ',': 0.25, '.': 0.25 };

function pointTextWidth(value, size) {
  var total = 0;
  for (var i = 0; i < value.length; i++) {
    var w = GLYPH[value.charAt(i)];
    total += w === undefined ? 0.5 : w;
  }
  return total * size;
}

/* Оценка ширины строки: по умолчанию символ примерно 0,56 кегля. */
function textWidth(value, size, track) {
  var unit = track || 0.56;
  var total = 0;
  for (var i = 0; i < value.length; i++) {
    var ch = value.charAt(i);
    total += ch === ' ' ? unit * 0.55 : (ch === '=' || ch === '−' || ch === '-' ? unit * 1.07 : unit);
  }
  return total * size;
}

/* ══════════════════════════════════════════════════════════
   Текст. Под каждой подписью белая обводка (paint-order: stroke fill),
   иначе линия графика перечёркивает число.
   ══════════════════════════════════════════════════════════ */
/* Переменные в подписи набираются курсивом, числа и скобки — прямым.
   Правило то же, что в graph/math.js; рендерер держит его у себя,
   чтобы остаться без зависимостей. */
var VARIABLE = /[A-Za-z]/;

function mathRuns(value) {
  var out = [];
  var buffer = '';
  var italic = null;

  for (var i = 0; i < value.length; i++) {
    var ch = value.charAt(i);
    var isVar = VARIABLE.test(ch);
    if (italic === null || isVar === italic) { buffer += ch; }
    else { out.push({ text: buffer, italic: italic }); buffer = ch; }
    italic = isVar;
  }
  if (buffer) { out.push({ text: buffer, italic: italic }); }
  return out;
}

function mathSpans(value, baseItalic) {
  var parts = mathRuns(String(value));
  if (parts.length === 1 && parts[0].italic === !!baseItalic) { return esc(value); }
  return parts.map(function (run) {
    return '<tspan font-style="' + (run.italic ? 'italic' : 'normal') + '">' +
      esc(run.text) + '</tspan>';
  }).join('');
}

function svgText(value, x, y, anchor, opts) {
  var style = 'font-family:' + (opts.family || THEME.font.family) + ';paint-order:stroke fill' +
    (opts.style ? ';font-style:' + opts.style : '') +
    (opts.extra ? ';' + opts.extra : '');
  return '<text x="' + px(x) + '" y="' + px(y) + '" text-anchor="' + anchor +
    '" font-size="' + opts.size + '"' + (opts.weight ? ' font-weight="' + opts.weight + '"' : '') +
    ' fill="' + (opts.fill || THEME.colors.label) + '" stroke="' + THEME.colors.halo +
    '" stroke-width="' + THEME.width.halo + '" stroke-linejoin="round"' +
    ' style="' + style + '">' +
    (opts.math ? mathSpans(value, opts.style === 'italic') : esc(value)) + '</text>';
}

/* Числа на осях — табличные цифры, мельче подписей осей. */
function numberText(value, x, y, anchor) {
  return svgText(value, x, y, anchor, {
    size: THEME.font.axisLabel,
    extra: 'font-variant-numeric:tabular-nums;font-feature-settings:\'tnum\' 1'
  });
}

/* x, y и 0 — курсив, как принято в математике. */
function mathText(value, x, y, anchor) {
  return svgText(value, x, y, anchor, { size: THEME.font.axisName, style: 'italic' });
}

/* Подпись графика — жирная антиква, переменные курсивом. */
function curveLabelText(value, x, y, fill) {
  return svgText(value, x, y, 'middle', {
    size:   THEME.font.curveLabel,
    family: THEME.font.curveLabelFamily,
    weight: THEME.font.curveLabelWeight,
    style:  'normal',
    math:   true,
    fill:   fill
  });
}

/* Подпись точки — та же антиква: A курсивом, координаты прямым. */
function labelText(value, x, y, anchor, size, fill) {
  return svgText(value, x, y, anchor, {
    size:   size,
    family: THEME.font.curveLabelFamily,
    weight: THEME.font.pointLabelWeight,
    math:   true,
    fill:   fill
  });
}

const api = {
  THEME: THEME,
  renderGraph: renderGraph,
  registerCurve: registerCurve,
  checkWindow: checkWindow,
  fmt: fmt
};

export default api;
export { THEME, renderGraph, registerCurve, checkWindow, fmt };
