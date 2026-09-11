/* graph/triangle.js — треугольник наклона.

   Гипотенуза — отрезок между двумя жирными опорными точками:
   A — левая, B — правая. Вершина прямого угла C зависит от направления:

     возрастающая (k > 0)  C = (xB, yA) — прямой угол внизу справа,
                           построение читается «вправо, затем вверх»;
     убывающая    (k < 0)  C = (xA, yB) — прямой угол внизу слева,
                           построение читается «вниз, затем вправо».

   Треугольник обязан целиком помещаться в окне при выбранной вершине;
   не помещается — берётся другая пара опорных точек, нет подходящей —
   вариант бракуется на генерации.

   Слой геометрии: знает про клетки и координаты, не знает ни про SVG,
   ни про анимацию. Рендерер получает готовые фигуры сцены,
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

  var RULES = {
    rightAnglePx:  13,     /* сторона квадратика в пикселях: клетка разного
                              размера при разных окнах, квадратик — нет     */
    arcMaxPx:      34,     /* потолок радиуса дуги                          */
    arcLegShare:   1 / 3,  /* и не больше трети кратчайшего катета          */
    alphaGapPx:    12,     /* насколько α отстоит от дуги                   */
    labelGapPx:    13,     /* насколько подпись катета отстоит от него      */
    labelZoneCells: 3      /* короче этого крайний кусок прямой не годится
                              под подпись y = f(x)                          */
  };

  function inside(point, win) {
    return point.x >= win.xmin && point.x <= win.xmax &&
           point.y >= win.ymin && point.y <= win.ymax;
  }

  /* Вершина прямого угла по правилу направления. */
  function vertexFor(left, right) {
    return right.y > left.y ? { x: right.x, y: left.y }    /* возрастающая */
                            : { x: left.x,  y: right.y };  /* убывающая    */
  }

  function fits(left, right, win) {
    return inside(left, win) && inside(right, win) && inside(vertexFor(left, right), win);
  }

  /* Пара опорных точек: сначала пробуем ту, что уже отмечена на чертеже,
     иначе перебираем остальные пары целых точек прямой. */
  function choosePair(line, win, preferred) {
    function ordered(pair) {
      return pair[0].x <= pair[1].x ? [pair[0], pair[1]] : [pair[1], pair[0]];
    }

    if (preferred && preferred.length === 2) {
      var pair = ordered(preferred);
      if (pair[0].x !== pair[1].x && fits(pair[0], pair[1], win) &&
          !onAxis(pair[0], pair[1])) {
        return pair;
      }
    }

    var points = Line.integerPoints(line, win);
    var best = null;
    for (var i = 0; i < points.length; i++) {
      for (var j = i + 1; j < points.length; j++) {
        var candidate = ordered([points[i], points[j]]);
        var a = candidate[0];
        var b = candidate[1];
        if (a.x === b.x || !fits(a, b, win)) { continue; }

        var score = Math.min(Math.abs(b.x - a.x), 4) -
          0.1 * (Math.abs(a.x) + Math.abs(b.x)) -
          (onAxis(a, b) ? 1.5 : 0);
        if (!best || score > best.score + 1e-9) { best = { pair: candidate, score: score }; }
      }
    }
    return best ? best.pair : null;
  }

  /* Катет, легший на ось, сливается с каркасом чертежа, а дуга и подпись
     α у опорной точки на оси попадают прямо на неё и на числа. */
  function onAxis(left, right) {
    var vertex = vertexFor(left, right);
    var legOnAxis = (vertex.x === 0 && (left.x === 0 || right.x === 0)) ||
                    (vertex.y === 0 && (left.y === 0 || right.y === 0));
    var cornerOnAxis = left.x === 0 || left.y === 0;
    return legOnAxis || cornerOnAxis;
  }

  /* ══════════════════════════════════════════════════════════
     Построение
     ══════════════════════════════════════════════════════════ */
  function build(line, win, preferred) {
    var pair = choosePair(line, win, preferred);
    if (!pair) { return null; }

    var A = pair[0];
    var B = pair[1];
    var C = vertexFor(A, B);
    var rising = B.y > A.y;

    var dx = Math.abs(B.x - A.x);
    var dy = Math.abs(B.y - A.y);
    if (dx === 0 || dy === 0) { return null; }

    /* Катеты. У возрастающей путь идёт «вправо, затем вверх»,
       у убывающей — «вниз, затем вправо»; поэтому у них разные
       начала и разный порядок в анимации. */
    var horizontal = rising ? { from: A, to: C } : { from: C, to: B };
    var vertical   = rising ? { from: C, to: B } : { from: A, to: C };

    /* Третья вершина относительно каждого катета: по ней определяется,
       с какой стороны снаружи треугольника ставить подпись. */
    var thirdForHorizontal = rising ? B : A;
    var thirdForVertical   = rising ? A : B;

    return {
      A: A, B: B, C: C,
      left: A, right: B, vertex: C,
      rising: rising,
      dx: dx, dy: dy,
      k: (B.y - A.y) / (B.x - A.x),
      horizontal: horizontal,
      vertical: vertical,
      thirdForHorizontal: thirdForHorizontal,
      thirdForVertical: thirdForVertical,

      /* На чертеже у катетов стоит только число клеток, без знаков:
         катет — длина. Знак приращения разбирается в блоке решения,
         для него хранятся values. */
      labels: { dx: String(dx), dy: String(dy) },
      values: { dx: '+' + dx, dy: (rising ? '+' : MINUS) + dy },

      angleDeg: Math.atan2(B.y - A.y, B.x - A.x) * 180 / Math.PI,
      order: rising ? ['horizontal', 'vertical'] : ['vertical', 'horizontal'],
      ids: IDS
    };
  }

  /* Радиус дуги: не больше трети кратчайшего катета. Потолок в пикселях
     ставит рендерер — клетка у него, а не здесь. */
  function arcRadius(t) {
    return Math.min(t.dx, t.dy) * RULES.arcLegShare;
  }

  /* ══════════════════════════════════════════════════════════
     Фигуры сцены
     ══════════════════════════════════════════════════════════ */
  function shapes(triangle) {
    var t = triangle;
    var list = [];

    list.push({ type: 'polygon', id: IDS.fill,
      points: [[t.A.x, t.A.y], [t.C.x, t.C.y], [t.B.x, t.B.y]] });

    list.push({ type: 'segment', id: IDS.legX, style: 'dashed',
      from: [t.horizontal.from.x, t.horizontal.from.y],
      to:   [t.horizontal.to.x,   t.horizontal.to.y] });

    list.push({ type: 'segment', id: IDS.legY, style: 'dashed',
      from: [t.vertical.from.x, t.vertical.from.y],
      to:   [t.vertical.to.x,   t.vertical.to.y] });

    /* Подписи катетов — снаружи треугольника, со стороны, противоположной
       гипотенузе. Сторона считается из ориентации, а не задана заранее. */
    var hy = t.horizontal.from.y;
    var hOut = t.thirdForHorizontal.y > hy ? 1 : -1;     /* +1 — вниз по экрану */
    list.push({ type: 'label', id: IDS.labelX, text: t.labels.dx, slide: 'x',
      at: [ (t.horizontal.from.x + t.horizontal.to.x) / 2, hy ],
      offset: [0, hOut * RULES.labelGapPx], gap: RULES.labelGapPx });

    var vx = t.vertical.from.x;
    var vOut = t.thirdForVertical.x > vx ? -1 : 1;       /* +1 — вправо по экрану */
    list.push({ type: 'label', id: IDS.labelY, text: t.labels.dy, slide: 'y',
      at: [ vx, (t.vertical.from.y + t.vertical.to.y) / 2 ],
      offset: [vOut * RULES.labelGapPx, 0], gap: RULES.labelGapPx });

    /* Квадратик прямого угла — внутрь треугольника, вдоль обоих катетов.
       Направления берутся из знаков разностей координат: четыре
       ориентации обрабатываются одним и тем же вычислением. */
    list.push({ type: 'rightAngle', id: IDS.rightAngle,
      at: [t.C.x, t.C.y],
      alongX: Math.sign(otherEnd(t.horizontal, t.C).x - t.C.x),
      alongY: Math.sign(otherEnd(t.vertical, t.C).y - t.C.y),
      sizePx: RULES.rightAnglePx });

    /* Дуга угла наклона — только у возрастающей прямой.
       У убывающей угол с положительным направлением оси x тупой,
       а острый угол треугольника равен 180° − α: подписать его как α
       значит заложить ошибку. Там смысл несёт знак подписи катета. */
    if (t.rising) {
      var r = arcRadius(t);
      list.push({ type: 'arc', id: IDS.arc, at: [t.A.x, t.A.y],
        radius: r, maxRadiusPx: RULES.arcMaxPx, from: 0, to: t.angleDeg });

      /* Подпись угла ищется по биссектрисе на нескольких расстояниях:
         у самой дуги места может не быть. */
      var bisector = (t.angleDeg / 2) * Math.PI / 180;
      var anchors = [1, 1.35, 1.75, 2.2].map(function (scale) {
        return [ t.A.x + r * scale * Math.cos(bisector), t.A.y + r * scale * Math.sin(bisector) ];
      });
      list.push({ type: 'label', id: IDS.alpha, text: 'α', gap: RULES.alphaGapPx,
        at: anchors[0], anchors: anchors,
        offset: [Math.cos(bisector) * RULES.alphaGapPx, -Math.sin(bisector) * RULES.alphaGapPx] });
    }

    return list;
  }

  function otherEnd(leg, point) {
    return (leg.from.x === point.x && leg.from.y === point.y) ? leg.to : leg.from;
  }

  /* Где на прямой можно поставить подпись y = f(x): на самой длинной
     из крайних частей — левее A или правее B, но никогда между ними.
     Считать по краям окна нельзя: прямая может выходить из окна
     через верх или низ, и «крайняя часть» окажется невидимой.
     Обе части короче трёх клеток — подписи не будет вовсе:
     пустое место лучше слипшихся надписей. */
  function labelZone(triangle, line, win) {
    var visible = Line.visiblePart(line, win);
    if (!visible || visible.x1 === undefined) { return null; }

    var leftPart  = triangle.A.x - visible.x1;
    var rightPart = visible.x2 - triangle.B.x;
    var best = leftPart >= rightPart
      ? { from: visible.x1, to: triangle.A.x, length: leftPart }
      : { from: triangle.B.x, to: visible.x2, length: rightPart };

    return best.length >= RULES.labelZoneCells ? [best.from, best.to] : null;
  }

  return {
    RULES: RULES,
    build: build,
    choosePair: choosePair,
    vertexFor: vertexFor,
    arcRadius: arcRadius,
    shapes: shapes,
    labelZone: labelZone,
    IDS: IDS
  };
});
