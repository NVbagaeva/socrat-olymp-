/* graph/renderer.js — чистый рендерер чертежей задания №12.

   renderGraph(scene) -> строка SVG.

   Слой 1 архитектуры: ни зависимостей, ни предметной математики, ни знания
   о задачах. Рендерер получает готовую сцену и рисует её. Всё оформление —
   цвета, толщины, размеры, отступы — собрано в THEME ниже; по месту
   не хардкодится ничего.

   Новые семейства кривых (парабола, гипербола) добавляются через
   registerCurve(type, sampler) и не требуют правок в теле рендерера:
   сэмплер возвращает ломаные в математических координатах, обрезку по окну,
   толщины, цвета и подписи берёт на себя рендерер.

   scene = {
     window:     { xmin, xmax, ymin, ymax },
     grid:       { step: 1, show: true },
     axes:       { labelX: 'x', labelY: 'y', origin: 'O' },
     axisLabels: 'minimal' | 'full',
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
     Цвета взяты из токенов styleguide.html.
     Красный не используется: в системе он означает ошибку.
     ══════════════════════════════════════════════════════════ */
  var THEME = {
    colors: {
      bg:          '#FFFFFF',           /* белый фон чертежа            */
      grid:        '#CFDAE8',           /* grey-300, заметно бледнее осей */
      axis:        '#101728',           /* grey-900, нейтральный тёмный   */
      label:       '#101728',           /* подписи — тот же цвет, что оси */
      lineA:       '#1F5FD0',           /* blue-600, основной            */
      lineB:       '#E07A2F',           /* терракотовый, вторая прямая   */
      pointFill:   null,                /* null — цвет своей кривой      */
      pointStroke: '#FFFFFF',           /* белая обводка точек           */
      halo:        '#FFFFFF'            /* подложка под текст            */
    },
    /* Толщины по шкале: сетка тоньше осей, оси тоньше графика. */
    width: {
      grid:        1,
      tick:        1.4,
      axis:        1.7,
      curve:       2.6,
      pointStroke: 2.2,
      halo:        3.6
    },
    geometry: {
      cell:         34,                 /* пиксели на одну клетку        */
      pad:          36,                 /* поле вокруг окна чертежа      */
      arrowLen:     11,
      arrowHalf:    4.6,
      arrowExtend:  16,                 /* насколько ось выходит за окно */
      tick:         5,                  /* половина длины засечки        */
      pointRadius:  4.6
    },
    font: {
      family:    "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
      axisLabel:  13,
      axisName:   15,
      origin:     14,
      curveLabel: 15,
      pointLabel: 13
    },
    gap: {
      axisLabelX: 17,                   /* число под осью x              */
      axisLabelY: 9,                    /* число левее оси y             */
      origin:     7,
      axisName:   9,
      curveLabel: 14,                   /* сдвиг подписи от линии        */
      pointLabel: 9
    },
    curveLabelAt: 0.78                  /* доля видимой длины кривой     */
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
    var text = String(rounded);
    return text.indexOf('.') === -1 ? text : text.replace('.', ',');
  }

  function color(name) {
    if (!name) { return THEME.colors.axis; }
    if (name.charAt(0) === '#') { return name; }
    return THEME.colors[name] || THEME.colors.axis;
  }

  function pick(value, fallback) { return value === undefined || value === null ? fallback : value; }

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
    var g = THEME.geometry;
    var cell = pick(scene.cell, g.cell);

    var plotW = (win.xmax - win.xmin) * cell;
    var plotH = (win.ymax - win.ymin) * cell;
    var W = plotW + g.pad * 2;
    var H = plotH + g.pad * 2;

    function sx(x) { return g.pad + (x - win.xmin) * cell; }
    function sy(y) { return g.pad + (win.ymax - y) * cell; }

    /* Оси прижимаются к окну, если начало координат за кадром. */
    var axisX = sy(Math.min(Math.max(0, win.ymin), win.ymax));
    var axisY = sx(Math.min(Math.max(0, win.xmin), win.xmax));
    var originInside = win.xmin <= 0 && win.xmax >= 0 && win.ymin <= 0 && win.ymax >= 0;

    var mode = pick(scene.axisLabels, 'full');
    var axes = scene.axes || {};
    var grid = scene.grid || {};
    var step = pick(grid.step, 1);

    var out = [];
    out.push('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + px(W) + ' ' + px(H) + '"' +
      ' width="' + px(W) + '" height="' + px(H) + '" role="img"' +
      (scene.alt ? ' aria-label="' + esc(scene.alt) + '"' : ' aria-hidden="true"') +
      ' style="max-width:100%;height:auto">');
    if (scene.alt) { out.push('<title>' + esc(scene.alt) + '</title>'); }
    out.push('<rect x="0" y="0" width="' + px(W) + '" height="' + px(H) + '" fill="' + THEME.colors.bg + '"/>');

    /* Сетка ------------------------------------------------- */
    if (pick(grid.show, true)) {
      var lines = [];
      for (var gx = Math.ceil(win.xmin / step) * step; gx <= win.xmax + EPS; gx += step) {
        lines.push('M' + px(sx(gx)) + ' ' + px(sy(win.ymin)) + 'V' + px(sy(win.ymax)));
      }
      for (var gy = Math.ceil(win.ymin / step) * step; gy <= win.ymax + EPS; gy += step) {
        lines.push('M' + px(sx(win.xmin)) + ' ' + px(sy(gy)) + 'H' + px(sx(win.xmax)));
      }
      out.push('<path d="' + lines.join('') + '" fill="none" stroke="' + THEME.colors.grid +
        '" stroke-width="' + THEME.width.grid + '"/>');
    }

    /* Оси со стрелками -------------------------------------- */
    var tipX = sx(win.xmax) + g.arrowExtend;
    var tipY = sy(win.ymax) - g.arrowExtend;
    out.push('<path d="M' + px(sx(win.xmin)) + ' ' + px(axisX) + 'H' + px(tipX) +
      'M' + px(axisY) + ' ' + px(sy(win.ymin)) + 'V' + px(tipY) + '" fill="none" stroke="' +
      THEME.colors.axis + '" stroke-width="' + THEME.width.axis + '" stroke-linecap="round"/>');
    out.push('<path d="M' + px(tipX) + ' ' + px(axisX) +
      'L' + px(tipX - g.arrowLen) + ' ' + px(axisX - g.arrowHalf) +
      'L' + px(tipX - g.arrowLen) + ' ' + px(axisX + g.arrowHalf) + 'Z' +
      'M' + px(axisY) + ' ' + px(tipY) +
      'L' + px(axisY - g.arrowHalf) + ' ' + px(tipY + g.arrowLen) +
      'L' + px(axisY + g.arrowHalf) + ' ' + px(tipY + g.arrowLen) + 'Z" fill="' +
      THEME.colors.axis + '"/>');

    /* Засечки единичных отрезков ---------------------------- */
    var ticks = [];
    for (var tx = Math.ceil(win.xmin); tx <= win.xmax + EPS; tx++) {
      if (Math.abs(tx) < EPS) { continue; }
      ticks.push('M' + px(sx(tx)) + ' ' + px(axisX - g.tick) + 'v' + px(g.tick * 2));
    }
    for (var ty = Math.ceil(win.ymin); ty <= win.ymax + EPS; ty++) {
      if (Math.abs(ty) < EPS) { continue; }
      ticks.push('M' + px(axisY - g.tick) + ' ' + px(sy(ty)) + 'h' + px(g.tick * 2));
    }
    out.push('<path d="' + ticks.join('') + '" fill="none" stroke="' + THEME.colors.axis +
      '" stroke-width="' + THEME.width.tick + '" stroke-linecap="round"/>');

    /* Подписи засечек --------------------------------------- */
    function labelled(value) { return mode === 'full' ? Math.abs(value) > EPS : Math.abs(value - 1) < EPS; }

    var texts = [];
    for (var lx = Math.ceil(win.xmin); lx <= win.xmax + EPS; lx++) {
      if (!labelled(lx)) { continue; }
      texts.push(text(fmt(lx), sx(lx), axisX + THEME.gap.axisLabelX, 'middle', THEME.font.axisLabel));
    }
    for (var ly = Math.ceil(win.ymin); ly <= win.ymax + EPS; ly++) {
      if (!labelled(ly)) { continue; }
      texts.push(text(fmt(ly), axisY - THEME.gap.axisLabelY, sy(ly) + 4.5, 'end', THEME.font.axisLabel));
    }
    if (originInside && pick(axes.origin, 'O') !== null) {
      texts.push(text(pick(axes.origin, 'O'), axisY - THEME.gap.origin, axisX + THEME.gap.axisLabelX,
        'end', THEME.font.origin));
    }
    texts.push(text(pick(axes.labelX, 'x'), tipX - 2, axisX - THEME.gap.axisName, 'end', THEME.font.axisName, true));
    texts.push(text(pick(axes.labelY, 'y'), axisY + THEME.gap.axisName, tipY + 6, 'start', THEME.font.axisName, true));

    /* Кривые ------------------------------------------------- */
    var curveLabels = [];
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
      out.push('<path d="' + d + '" fill="none" stroke="' + stroke + '" stroke-width="' +
        THEME.width.curve + '" stroke-linecap="round" stroke-linejoin="round"/>');

      if (curve.label) { curveLabels.push(curveLabel(curve, pieces, stroke, sx, sy)); }
    });

    /* Точки -------------------------------------------------- */
    (scene.points || []).forEach(function (point) {
      var fill = THEME.colors.pointFill || color(point.color);
      var open = point.style === 'open';
      out.push('<circle cx="' + px(sx(point.x)) + '" cy="' + px(sy(point.y)) + '" r="' +
        px(g.pointRadius) + '" fill="' + (open ? THEME.colors.bg : fill) + '" stroke="' +
        (open ? fill : THEME.colors.pointStroke) + '" stroke-width="' + THEME.width.pointStroke + '"/>');
      if (point.label) {
        var up = point.y >= 0;
        out.push(text(point.label, sx(point.x) + THEME.gap.pointLabel,
          sy(point.y) + (up ? -THEME.gap.pointLabel : THEME.gap.pointLabel + 8),
          'start', THEME.font.pointLabel, true, color(point.color)));
      }
    });

    /* Весь текст — поверх линий, с белой подложкой: подписи
       читаются, даже когда рядом проходит график.               */
    out.push(texts.join(''));
    out.push(curveLabels.join(''));
    out.push('</svg>');
    return out.join('');
  }

  /* Подпись вдоль кривой со сдвигом, чтобы не пересекать линию. */
  function curveLabel(curve, pieces, stroke, sx, sy) {
    var piece = pieces[0];
    for (var i = 1; i < pieces.length; i++) {
      if (pieces[i].length > piece.length) { piece = pieces[i]; }
    }
    var a = piece[0];
    var b = piece[piece.length - 1];
    var t = THEME.curveLabelAt;
    var at = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };

    var px1 = sx(a.x), py1 = sy(a.y), px2 = sx(b.x), py2 = sy(b.y);
    var angle = Math.atan2(py2 - py1, px2 - px1) * 180 / Math.PI;
    if (angle > 90) { angle -= 180; }
    if (angle < -90) { angle += 180; }

    /* Сдвиг по нормали: подпись уходит вверх от линии. */
    var rad = angle * Math.PI / 180;
    var offX = Math.sin(rad) * THEME.gap.curveLabel;
    var offY = -Math.cos(rad) * THEME.gap.curveLabel;
    var cx = sx(at.x) + offX;
    var cy = sy(at.y) + offY;

    return '<text x="' + px(cx) + '" y="' + px(cy) + '" transform="rotate(' + px(angle) + ' ' +
      px(cx) + ' ' + px(cy) + ')" text-anchor="middle" font-family="' + THEME.font.family +
      '" font-size="' + THEME.font.curveLabel + '" fill="' + stroke + '" stroke="' +
      THEME.colors.halo + '" stroke-width="' + THEME.width.halo +
      '" stroke-linejoin="round" style="paint-order:stroke">' + esc(curve.label) + '</text>';
  }

  /* Текст с белой подложкой: подписи не тонут в сетке и линиях. */
  function text(value, x, y, anchor, size, bold, fill) {
    return '<text x="' + px(x) + '" y="' + px(y) + '" text-anchor="' + anchor +
      '" font-family="' + THEME.font.family + '" font-size="' + size + '"' +
      (bold ? ' font-style="italic"' : '') +
      ' fill="' + (fill || THEME.colors.label) + '" stroke="' + THEME.colors.halo +
      '" stroke-width="' + THEME.width.halo + '" stroke-linejoin="round"' +
      ' style="paint-order:stroke">' + esc(value) + '</text>';
  }

  return {
    THEME: THEME,
    renderGraph: renderGraph,
    registerCurve: registerCurve,
    fmt: fmt
  };
});
