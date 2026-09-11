/* graph/triangle.js — треугольник наклона.

   Гипотенуза — отрезок между двумя жирными опорными точками прямой.
   Катеты — горизонталь из левой точки и вертикаль до правой.
   Вершина прямого угла выбирается детерминированно: пересечение
   горизонтали из ЛЕВОЙ опорной точки и вертикали из ПРАВОЙ.

   Слой геометрии: знает про клетки и координаты, не знает ни про SVG,
   ни про анимацию. Рендерер получает от него готовые фигуры сцены,
   graph/animate.js — их идентификаторы и порядок шагов.
*/

(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) { module.exports = factory(require('./families/line.js')); }
  else { root.GraphTriangle = factory(root.GraphLine); }
})(typeof self !== 'undefined' ? self : this, function (Line) {
  'use strict';

  var MINUS = '−';

  /* Идентификаторы фигур: по ним анимация находит элементы в готовом SVG. */
  var IDS = {
    fill:       'slope-fill',
    legX:       'slope-leg-x',
    legY:       'slope-leg-y',
    labelX:     'slope-label-x',
    labelY:     'slope-label-y',
    rightAngle: 'slope-right-angle',
    arc:        'slope-arc',
    alpha:      'slope-alpha'
  };

  function inside(point, win) {
    return point.x >= win.xmin && point.x <= win.xmax &&
           point.y >= win.ymin && point.y <= win.ymax;
  }

  /* Треугольник целиком помещается в окне: обе опорные точки и вершина. */
  function fits(left, right, win) {
    return inside(left, win) && inside(right, win) &&
           inside({ x: right.x, y: left.y }, win);
  }

  /* Пара опорных точек: сначала пробуем ту, что уже отмечена на чертеже,
     иначе перебираем остальные пары целых точек прямой. Если ни одна
     не даёт помещающийся треугольник — null, и вариант бракуется. */
  function choosePair(line, win, preferred) {
    if (preferred && preferred.length === 2) {
      var a = preferred[0].x <= preferred[1].x ? preferred[0] : preferred[1];
      var b = preferred[0].x <= preferred[1].x ? preferred[1] : preferred[0];
      if (a.x !== b.x && fits(a, b, win) && b.x !== 0 && a.y !== 0) { return [a, b]; }
    }

    var points = Line.integerPoints(line, win);
    var best = null;
    for (var i = 0; i < points.length; i++) {
      for (var j = i + 1; j < points.length; j++) {
        var left = points[i].x <= points[j].x ? points[i] : points[j];
        var right = points[i].x <= points[j].x ? points[j] : points[i];
        if (left.x === right.x || !fits(left, right, win)) { continue; }
        /* Катет, легший на ось, сливается с каркасом чертежа,
           а его подпись попадает в числа на оси. */
        var onAxis = (right.x === 0 ? 1 : 0) + (left.y === 0 ? 1 : 0);
        var score = Math.min(Math.abs(right.x - left.x), 4) -
          0.1 * (Math.abs(left.x) + Math.abs(right.x)) - onAxis * 1.5;
        if (!best || score > best.score + 1e-9) { best = { pair: [left, right], score: score }; }
      }
    }
    return best ? best.pair : null;
  }

  /* Построение треугольника. Возвращает null, если построить нельзя. */
  function build(line, win, preferred) {
    var pair = choosePair(line, win, preferred);
    if (!pair) { return null; }

    var left = pair[0];
    var right = pair[1];
    var vertex = { x: right.x, y: left.y };

    var dx = right.x - left.x;            /* катет — длина, всегда больше нуля */
    var dy = right.y - left.y;            /* приращение функции, со знаком     */
    var rising = dy > 0;

    /* Катеты — длины, они положительны. Но k может быть отрицательным,
       поэтому вертикальный катет подписывается со знаком приращения:
       иначе ученик запоминает «k — отношение катетов» и теряет минус. */
    return {
      left: left, right: right, vertex: vertex,
      dx: dx, dy: dy, rising: rising,
      k: dy / dx,
      labels: { dx: '+' + dx, dy: (rising ? '+' : MINUS) + Math.abs(dy) },
      angleDeg: Math.atan2(dy, dx) * 180 / Math.PI,
      ids: IDS
    };
  }

  /* Фигуры сцены. Рендерер рисует их как есть, ничего не зная о наклоне. */
  function shapes(triangle) {
    var t = triangle;
    var topY = Math.max(t.left.y, t.right.y);
    var midX = (t.left.x + t.right.x) / 2;
    var midY = (t.vertex.y + t.right.y) / 2;

    return [
      { type: 'polygon', id: IDS.fill,
        points: [[t.left.x, t.left.y], [t.vertex.x, t.vertex.y], [t.right.x, t.right.y]] },

      { type: 'segment', id: IDS.legX, style: 'dashed',
        from: [t.left.x, t.left.y], to: [t.vertex.x, t.vertex.y] },

      { type: 'segment', id: IDS.legY, style: 'dashed',
        from: [t.vertex.x, t.vertex.y], to: [t.right.x, t.right.y] },

      /* Подпись горизонтального катета — над ним, вертикального — сбоку. */
      { type: 'label', id: IDS.labelX, at: [midX, t.left.y], offset: [0, -12], text: t.labels.dx },
      { type: 'label', id: IDS.labelY, at: [t.vertex.x, midY], offset: [14, 4],
        anchor: 'start', text: t.labels.dy },

      { type: 'rightAngle', id: IDS.rightAngle,
        at: [t.vertex.x, t.vertex.y], toward: [t.left.x, topY] },

      /* Дуга угла наклона у левой опорной точки, между осью x и прямой. */
      { type: 'arc', id: IDS.arc, at: [t.left.x, t.left.y],
        from: 0, to: t.angleDeg },
      { type: 'label', id: IDS.alpha,
        at: [t.left.x, t.left.y],
        offset: [26, t.rising ? -8 : 18], text: 'α' }
    ];
  }

  return { build: build, choosePair: choosePair, shapes: shapes, IDS: IDS };
});
