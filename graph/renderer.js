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
     axisLabels: 'minimal' | 'full',   // minimal: подписаны только 0, 1 и −1
     curves:     [ { type: 'line', k, b, color: 'lineA', label: null } ],
     points:     [ { x, y, style: 'solid', label: null, color: 'lineA' } ]
   }
*/

(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.GraphRenderer = factory(); }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ══════════════════════════════════════════════════════════
     THEME — единственное место, где живёт оформление
     Цвета из токенов styleguide.html. Красный не используется:
     в системе он означает ошибку и риск.
     ══════════════════════════════════════════════════════════ */
  var THEME = {
    colors: {
      bg:          '#FFFFFF',   /* белый фон чертежа                          */
      grid:        '#C3D3E6',   /* светло-серый, но клетки уверенно читаются  */
      axis:        '#101728',   /* grey-900 — самый тёмный нейтральный токен  */
      label:       '#101728',   /* подписи — тот же цвет, что оси             */
      lineA:       '#1F5FD0',   /* blue-600, основной                         */
      lineB:       '#E07A2F',   /* терракотовый, вторая прямая                */
      pointFill:   null,        /* null — цвет своей кривой                   */
      pointStroke: '#FFFFFF',   /* белая обводка точек                        */
      halo:        '#FFFFFF'    /* подложка под текст                         */
    },

    /* Иерархия толщин: каждая ступень различима на глаз.
       сетка 1,2 < засечки 1,6 < оси 2,2 < график 3,2                        */
    width: {
      grid:        1.2,
      tick:        1.6,
      axis:        2.2,
      curve:       3.2,
      pointStroke: 2.6,
      halo:        3                     /* тонкая белая обводка под текстом */
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
      axisName:   17,       /* x, y, 0 — курсив                              */
      pointLabel: 13,

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
     Окно: строго симметричное и квадратное
     Одинаковое число клеток во все четыре стороны, размер клетки
     одинаков по обеим осям. Та же проверка вызывается из validate.js.
     ══════════════════════════════════════════════════════════ */
  function checkWindow(win) {
    var errors = [];
    if (!win) { return ['окно не задано']; }

    if (Math.abs(win.xmin + win.xmax) > EPS) {
      errors.push('окно не симметрично по x: xmin ' + win.xmin + ', xmax ' + win.xmax);
    }
    if (Math.abs(win.ymin + win.ymax) > EPS) {
      errors.push('окно не симметрично по y: ymin ' + win.ymin + ', ymax ' + win.ymax);
    }
    var cellsX = win.xmax - win.xmin;
    var cellsY = win.ymax - win.ymin;
    if (Math.abs(cellsX - cellsY) > EPS) {
      errors.push('поле не квадратное: ' + cellsX + ' клеток по горизонтали, ' + cellsY + ' по вертикали');
    }
    if (cellsX < EPS) { errors.push('пустое окно'); }
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
  function renderGraph(scene) {
    var win = scene.window;
    var problems = checkWindow(win);
    if (problems.length) { throw new Error('renderer: ' + problems.join('; ')); }

    var g = THEME.geometry;
    var cell = pick(scene.cell, g.cell);

    var plot = (win.xmax - win.xmin) * cell;   /* поле — квадрат */
    var size = plot + g.pad * 2;

    function sx(x) { return g.pad + (x - win.xmin) * cell; }
    function sy(y) { return g.pad + (win.ymax - y) * cell; }

    var axisX = sy(0);          /* пиксельная строка оси x */
    var axisY = sx(0);          /* пиксельный столбец оси y */

    var mode = pick(scene.axisLabels, THEME.axisLabels);
    var axes = scene.axes || {};
    var grid = scene.grid || {};
    var step = pick(grid.step, 1);

    var head = [];
    var gridLayer = [];
    var axisLayer = [];
    var labelLayer = [];
    var curveLayer = [];
    var pointLayer = [];
    var curveLabelLayer = [];

    head.push('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + px(size) + ' ' + px(size) + '"' +
      ' width="' + px(size) + '" height="' + px(size) + '" role="img"' +
      (scene.alt ? ' aria-label="' + esc(scene.alt) + '"' : ' aria-hidden="true"') +
      ' style="max-width:100%;height:auto">');
    if (scene.alt) { head.push('<title>' + esc(scene.alt) + '</title>'); }
    head.push('<rect x="0" y="0" width="' + px(size) + '" height="' + px(size) + '" fill="' +
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
    function ticked(value) {
      return value >= win.xmin + g.tickEdgeCells - EPS &&
             value <= win.xmax - g.tickEdgeCells + EPS &&
             Math.abs(value) > EPS;
    }

    var ticks = [];
    for (var tx = Math.ceil(win.xmin); tx <= win.xmax + EPS; tx++) {
      if (!ticked(tx)) { continue; }
      ticks.push('M' + px(sx(tx)) + ' ' + px(axisX - g.tick) + 'v' + px(g.tick * 2));
    }
    for (var ty = Math.ceil(win.ymin); ty <= win.ymax + EPS; ty++) {
      if (!ticked(ty)) { continue; }
      ticks.push('M' + px(axisY - g.tick) + ' ' + px(sy(ty)) + 'h' + px(g.tick * 2));
    }
    axisLayer.push('<path d="' + ticks.join('') + '" fill="none" stroke="' + THEME.colors.axis +
      '" stroke-width="' + THEME.width.tick + '" stroke-linecap="butt"/>');

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
      curveLayer.push('<path d="' + d + '" fill="none" stroke="' + stroke + '" stroke-width="' +
        THEME.width.curve + '" stroke-linecap="round" stroke-linejoin="round"/>');

      drawn.push({ curve: curve, pieces: pieces, stroke: stroke });
    });

    /* Подписи чисел. В режиме 'minimal' подписаны только 0, 1 и −1:
       единичный отрезок задан, остальное ученик отсчитывает по клеткам. -- */
    function labelled(value) {
      if (!ticked(value)) { return false; }
      return mode === 'full' ? true : Math.abs(Math.abs(value) - 1) < EPS;
    }

    var labelBoxes = [];
    function boxFor(value, cx, cy) {
      var half = textWidth(value, THEME.font.axisLabel) / 2;
      labelBoxes.push({ x: cx, y: cy, halfW: half, halfH: THEME.font.axisLabel * 0.62 });
    }

    for (var lx = Math.ceil(win.xmin); lx <= win.xmax + EPS; lx++) {
      if (!labelled(lx)) { continue; }
      var textX = fmt(lx);
      labelLayer.push(numberText(textX, sx(lx), axisX + THEME.gap.axisLabelX, 'middle'));
      boxFor(textX, sx(lx), axisX + THEME.gap.axisLabelX - THEME.font.axisLabel * 0.35);
    }
    for (var ly = Math.ceil(win.ymin); ly <= win.ymax + EPS; ly++) {
      if (!labelled(ly)) { continue; }
      var textY = fmt(ly);
      var half = textWidth(textY, THEME.font.axisLabel) / 2;
      labelLayer.push(numberText(textY, axisY - THEME.gap.axisLabelY, sy(ly) + 4.5, 'end'));
      boxFor(textY, axisY - THEME.gap.axisLabelY - half, sy(ly));
    }
    if (pick(axes.origin, '0') !== null) {
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

    /* Точки и их подписи: подпись уходит в свободную сторону,
       чтобы не садиться на линию, оси и числа. ------------------------- */
    var field = { left: sx(win.xmin), right: sx(win.xmax), top: sy(win.ymax), bottom: sy(win.ymin) };
    var originPx = { x: axisY, y: axisX };

    (scene.points || []).forEach(function (point) {
      var fill = THEME.colors.pointFill || color(point.color);
      var open = point.style === 'open';
      pointLayer.push('<circle cx="' + px(sx(point.x)) + '" cy="' + px(sy(point.y)) + '" r="' +
        px(g.pointRadius) + '" fill="' + (open ? THEME.colors.bg : fill) + '" stroke="' +
        (open ? fill : THEME.colors.pointStroke) + '" stroke-width="' + THEME.width.pointStroke + '"/>');
    });

    (scene.points || []).forEach(function (point) {
      if (!point.label) { return; }
      var halfW = textWidth(point.label, THEME.font.pointLabel) / 2;
      var halfH = THEME.font.pointLabel * 0.62;
      var cloud = obstacleCloud(scene, drawn, sx, sy, originPx, field, labelBoxes);
      var spot = bestLabelSpot(sx(point.x), sy(point.y), halfW, halfH,
        THEME.gap.pointLabel + g.pointRadius, cloud, field);

      labelBoxes.push({ x: spot.x, y: spot.y, halfW: halfW, halfH: halfH });
      pointLayer.push(labelText(point.label, spot.x, spot.y + halfH * 0.55, 'middle',
        THEME.font.pointLabel, color(point.color)));
    });

    /* Подписи графиков: горизонтально, у самой линии, в стороне
       от точек и пересечений с осями. -------------------------------------*/
    drawn.forEach(function (item) {
      if (!item.curve.label) { return; }
      curveLabelLayer.push(curveLabel(item, scene, win, sx, sy, drawn, labelBoxes));
    });

    var body = gridLayer.concat(axisLayer);
    if (THEME.layers.labelsOnTop) {
      body = body.concat(curveLayer, pointLayer, labelLayer);
    } else {
      body = body.concat(labelLayer, curveLayer, pointLayer);
    }
    return head.concat(body, curveLabelLayer, '</svg>').join('');
  }

  /* ══════════════════════════════════════════════════════════
     Подпись графика: горизонтально, без поворота, с белой подложкой.
     Перебираем точки вдоль видимой части линии и обе стороны от неё,
     считаем зазор от прямоугольника подписи до облака препятствий —
     самих графиков, осей и отмеченных точек — и берём лучшее место.
     Не нашлось — сдвигаемся вдоль линии, но никогда не вращаем.
     ══════════════════════════════════════════════════════════ */
  function curveLabel(item, scene, win, sx, sy, all, labelBoxes) {
    var piece = item.pieces[0];
    for (var i = 1; i < item.pieces.length; i++) {
      if (item.pieces[i].length > piece.length) { piece = item.pieces[i]; }
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

        if (!fallback || clear > fallback.clear + 1e-9) { fallback = { x: cx, y: cy, clear: clear }; }
        if (clear < THEME.curveLabelClear) { continue; }
        if (!best || score > best.score + 1e-9) { best = { x: cx, y: cy, score: score }; }
      }
    }

    var spot = best || fallback ||
      { x: (ax + bx) / 2 + nx * offset, y: (ay + by) / 2 + ny * offset };

    return curveLabelText(item.curve.label, spot.x, spot.y + halfH * 0.55, item.stroke);
  }

  /* Свободное место для короткой подписи рядом с точкой.
     Перебираются восемь направлений от якоря; берётся то, где до
     облака препятствий дальше всего. Диагональ вверх-вправо идёт
     первой: это привычное место подписи точки. */
  var LABEL_DIRECTIONS = [
    [1, -1], [-1, -1], [1, 1], [-1, 1],
    [0, -1], [0, 1], [1, 0], [-1, 0]
  ];

  function bestLabelSpot(ax, ay, halfW, halfH, gap, cloud, field) {
    var best = null;

    LABEL_DIRECTIONS.forEach(function (dir, order) {
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
      var score = clear - penalty;
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

    (labelBoxes || []).forEach(function (box) {
      cloud.push({ x: box.x, y: box.y });
      cloud.push({ x: box.x - box.halfW, y: box.y - box.halfH });
      cloud.push({ x: box.x + box.halfW, y: box.y - box.halfH });
      cloud.push({ x: box.x - box.halfW, y: box.y + box.halfH });
      cloud.push({ x: box.x + box.halfW, y: box.y + box.halfH });
    });
    return cloud;
  }

  /* Расстояние от точки до прямоугольника подписи. */
  function rectDist(point, cx, cy, halfW, halfH) {
    var dx = Math.max(Math.abs(point.x - cx) - halfW, 0);
    var dy = Math.max(Math.abs(point.y - cy) - halfH, 0);
    return Math.sqrt(dx * dx + dy * dy);
  }

  function dist(x1, y1, x2, y2) { return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2)); }

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

  return {
    THEME: THEME,
    renderGraph: renderGraph,
    registerCurve: registerCurve,
    checkWindow: checkWindow,
    fmt: fmt
  };
});
