/* graph/labels.js — размещение подписей точек: общий модуль.

   Одно правило для всех чертежей №12, где у точки есть подпись
   координат: на сайте (рисунки движка), в разборах и подсказках, в
   теории (подписи KaTeX поверх SVG, components/tasks/theory/rich/
   KatexFigure.tsx) и на печати. Все числа — в пикселях чертежа.

   Рамка подписи не должна пересекать:
     • саму кривую — проверяется по плотной выборке отрезков кривой,
       а не по узлам: хорда между узлами могла пройти сквозь рамку;
     • оси;
     • пунктиры и отрезки построений;
     • другие подписи (числа на осях, подписи фигур, чужие подписи точек);
     • чужие точки;
     • границу рисунка: подпись не обрезается.

   Порядок перебора мест — это только порядок: решение за проверкой
   пересечений. Сначала вплотную к точке по четырём диагоналям. У
   возрастающей кривой первой идёт позиция «справа-снизу» (под кривой и
   правее), у убывающей — «справа-сверху» (над кривой и правее); затем
   противоположные диагонали и стороны. Если у точки места нет —
   кольцо шире: подпись отодвигается и к точке рисуется короткая
   выноска. Подписи, у которых нет ни одного свободного места даже на
   самом широком кольце, достаётся место с наибольшим зазором, тоже с
   выноской. */

'use strict';

/* Запас до линий и подписей. Он больше, чем допуск автотеста
   (scripts/lib/graph-label-checks.mjs), чтобы у проверки был запас. */
var CLEAR = {
  curve: 3 /* кривая: полтолщины линии 1,25 + подложка */,
  axis: 3,
  shape: 3 /* пунктиры и отрезки построений */,
  text: 2 /* другие подписи */,
  point: 3 /* чужие точки: сверх радиуса */,
  edge: 2 /* граница рисунка */,
};

/* Кольца отступа от точки, в долях базового зазора. Первое — вплотную. */
var RINGS = [1, 1.9, 3, 4.4];

/* ── Ширина подписи ─────────────────────────────────────────────── */

/* Ширина подписи координат — по таблице долей кегля того начертания,
   которым подпись набирается: скобки и точка с запятой узкие, и общая
   оценка «0,56 кегля на знак» завышала бы рамку в полтора раза. */
var GLYPH = {
  '(': 0.333,
  ')': 0.333,
  ';': 0.333,
  ' ': 0.25,
  '−': 0.57,
  '-': 0.57,
  ',': 0.25,
  '.': 0.25,
};

function pointTextWidth(value, size) {
  var total = 0;
  for (var i = 0; i < value.length; i++) {
    var w = GLYPH[value.charAt(i)];
    total += w === undefined ? 0.5 : w;
  }
  return total * size;
}

/* Подпись из записи TeX («$(4;\,3)$», «$(x_0;\,y_0)$») в обычный текст,
   по которому считается ширина. Индекс считается полной цифрой: на
   узком экране кегль подписи не опускается ниже предела, и запас нужен. */
function plainOfTex(tex) {
  return String(tex)
    .replace(/\$/g, '')
    .replace(/\\[,;:!]|\\ /g, ' ')
    .replace(/\\(?:operatorname|text|mathrm)\{([^}]*)\}/g, '$1')
    .replace(/_\{?([^}\s]+)\}?/g, '$1')
    .replace(/\{,\}/g, ',')
    .replace(/\\[a-zA-Z]+/g, 'x')
    .replace(/[{}]/g, '');
}

/* ── Геометрия ──────────────────────────────────────────────────── */

/* Расстояние от отрезка (ax, ay)–(bx, by) до прямоугольника рамки;
   0 — пересекаются или лежат внутри. Точно, без выборки: отрезок
   либо пересекает рамку, либо ближе всего к ней одним из концов или
   в одном из углов рамки. */
function segRectDist(ax, ay, bx, by, box) {
  var l = box.x - box.halfW,
    r = box.x + box.halfW;
  var t = box.y - box.halfH,
    d = box.y + box.halfH;

  function pointToRect(x, y) {
    var dx = Math.max(l - x, 0, x - r);
    var dy = Math.max(t - y, 0, y - d);
    return Math.sqrt(dx * dx + dy * dy);
  }
  function pointToSeg(px, py) {
    var vx = bx - ax,
      vy = by - ay;
    var len2 = vx * vx + vy * vy;
    var u = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / len2));
    var cx = ax + vx * u,
      cy = ay + vy * u;
    return Math.sqrt((px - cx) * (px - cx) + (py - cy) * (py - cy));
  }

  /* Отрезок пересекает рамку (метод Лианга — Барски). */
  var t0 = 0,
    t1 = 1,
    dxs = bx - ax,
    dys = by - ay;
  var p = [-dxs, dxs, -dys, dys];
  var q = [ax - l, r - ax, ay - t, d - ay];
  var inside = true;
  for (var i = 0; i < 4; i++) {
    if (p[i] === 0) {
      if (q[i] < 0) {
        inside = false;
        break;
      }
    } else {
      var u = q[i] / p[i];
      if (p[i] < 0) {
        if (u > t1) {
          inside = false;
          break;
        }
        if (u > t0) {
          t0 = u;
        }
      } else {
        if (u < t0) {
          inside = false;
          break;
        }
        if (u < t1) {
          t1 = u;
        }
      }
    }
  }
  if (inside) {
    return 0;
  }

  return Math.min(
    pointToRect(ax, ay),
    pointToRect(bx, by),
    pointToSeg(l, t),
    pointToSeg(r, t),
    pointToSeg(l, d),
    pointToSeg(r, d),
  );
}

function boxGap(a, b) {
  var dx = Math.max(Math.abs(a.x - b.x) - a.halfW - b.halfW, 0);
  var dy = Math.max(Math.abs(a.y - b.y) - a.halfH - b.halfH, 0);
  return Math.sqrt(dx * dx + dy * dy);
}

/* ── Препятствия ────────────────────────────────────────────────── */

/**
 * Препятствия чертежа в пикселях.
 *   curves   — [[ {x, y} … ] …]: ломаные кривых;
 *   axes     — { x: строка оси x, y: столбец оси y };
 *   field    — { left, right, top, bottom };
 *   segments — [[x1, y1, x2, y2] …]: пунктиры и отрезки построений;
 *   points   — [{ x, y, r }]: отмеченные точки;
 *   boxes    — [{ x, y, halfW, halfH }]: уже стоящие подписи.
 */
function obstaclesOf(parts) {
  return {
    curves: parts.curves || [],
    axes: parts.axes,
    field: parts.field,
    segments: parts.segments || [],
    points: parts.points || [],
    boxes: parts.boxes || [],
  };
}

/**
 * Зазор, с которым рамка стоит среди препятствий: наименьший запас
 * сверх требуемого по каждому виду. Отрицательный — нарушено хотя бы
 * одно требование (рамка пересекает линию или подпись, вылезает за
 * поле). Чем больше число, тем свободнее место.
 */
function slack(box, ob, selfPoint) {
  var best = Infinity;
  var f = ob.field;

  /* Граница рисунка. */
  best = Math.min(
    best,
    box.x - box.halfW - (f.left + CLEAR.edge),
    f.right - CLEAR.edge - (box.x + box.halfW),
    box.y - box.halfH - (f.top + CLEAR.edge),
    f.bottom - CLEAR.edge - (box.y + box.halfH),
  );
  if (best < 0) {
    return best;
  }

  /* Оси. */
  if (ob.axes) {
    best = Math.min(
      best,
      segRectDist(f.left, ob.axes.x, f.right, ob.axes.x, box) - CLEAR.axis,
      segRectDist(ob.axes.y, f.top, ob.axes.y, f.bottom, box) - CLEAR.axis,
    );
    if (best < 0) {
      return best;
    }
  }

  /* Кривые. */
  for (var c = 0; c < ob.curves.length; c++) {
    var curve = ob.curves[c];
    for (var k = 0; k < curve.length; k++) {
      var piece = curve[k];
      for (var i = 0; i + 1 < piece.length; i++) {
        var gap = segRectDist(piece[i].x, piece[i].y, piece[i + 1].x, piece[i + 1].y, box);
        best = Math.min(best, gap - CLEAR.curve);
        if (best < 0) {
          return best;
        }
      }
    }
  }

  /* Пунктиры и отрезки построений. */
  for (var s = 0; s < ob.segments.length; s++) {
    var seg = ob.segments[s];
    best = Math.min(best, segRectDist(seg[0], seg[1], seg[2], seg[3], box) - CLEAR.shape);
    if (best < 0) {
      return best;
    }
  }

  /* Чужие подписи. */
  for (var b = 0; b < ob.boxes.length; b++) {
    best = Math.min(best, boxGap(box, ob.boxes[b]) - CLEAR.text);
    if (best < 0) {
      return best;
    }
  }

  /* Чужие точки: свою подпись к ним подводит выноска, а не сама рамка. */
  for (var p = 0; p < ob.points.length; p++) {
    var point = ob.points[p];
    if (selfPoint && point.x === selfPoint.x && point.y === selfPoint.y) {
      continue;
    }
    var dx = Math.max(Math.abs(point.x - box.x) - box.halfW, 0);
    var dy = Math.max(Math.abs(point.y - box.y) - box.halfH, 0);
    best = Math.min(best, Math.sqrt(dx * dx + dy * dy) - (point.r || 0) - CLEAR.point);
    if (best < 0) {
      return best;
    }
  }
  return best;
}

/* Куда идёт кривая у точки: сторона наклона на экране. true — на
   экране идёт вверх (слева направо y уменьшается). */
function risesAt(ax, ay, curves) {
  var bestDist = Infinity,
    rising = true;
  curves.forEach(function (curve) {
    curve.forEach(function (piece) {
      for (var i = 0; i + 1 < piece.length; i++) {
        var x1 = piece[i].x,
          y1 = piece[i].y,
          x2 = piece[i + 1].x,
          y2 = piece[i + 1].y;
        var vx = x2 - x1,
          vy = y2 - y1;
        var len2 = vx * vx + vy * vy;
        if (len2 === 0) {
          continue;
        }
        var u = Math.max(0, Math.min(1, ((ax - x1) * vx + (ay - y1) * vy) / len2));
        var cx = x1 + vx * u,
          cy = y1 + vy * u;
        var d = (ax - cx) * (ax - cx) + (ay - cy) * (ay - cy);
        if (d < bestDist - 1e-9) {
          bestDist = d;
          /* Слева направо: dy < 0 — идёт вверх. Вертикальный кусок считаем по знаку dy. */
          rising = vx === 0 ? vy < 0 : vy / vx < 0;
        }
      }
    });
  });
  return rising;
}

/* Диагонали по порядку. Системы координат экрана: y растёт вниз,
   поэтому «справа-снизу» — (1, 1). */
function diagonalOrder(rising) {
  return rising
    ? [
        [1, 1],
        [-1, -1],
        [1, -1],
        [-1, 1],
      ]
    : [
        [1, -1],
        [-1, 1],
        [1, 1],
        [-1, -1],
      ];
}

/* Стороны по порядку: справа, снизу, слева, сверху (для убывающей —
   справа, сверху, слева, снизу). */
function sideOrder(rising) {
  return rising
    ? [
        [1, 0],
        [0, 1],
        [-1, 0],
        [0, -1],
      ]
    : [
        [1, 0],
        [0, -1],
        [-1, 0],
        [0, 1],
      ];
}

/**
 * Место подписи точки.
 *
 *   anchor  { x, y }       — точка;
 *   halfW, halfH           — полуразмеры рамки подписи;
 *   r                      — радиус кружка точки;
 *   gap                    — зазор от рамки до кружка в первом кольце;
 *   obstacles              — obstaclesOf(…);
 *   shiftSides             — ходить ли подписи вдоль стороны (для
 *                            подписей, прижатых к стороне, а не к углу).
 *
 * Возвращает { x, y, ring, leader: null | { x1, y1, x2, y2 }, free }:
 * центр рамки, номер кольца, выноска (от кружка к рамке) и признак,
 * что найдено свободное место.
 */
function placePointLabel(req) {
  var ax = req.anchor.x,
    ay = req.anchor.y;
  var halfW = req.halfW,
    halfH = req.halfH,
    r = req.r || 4;
  var base = req.gap === undefined ? r + 3 : req.gap;
  var ob = req.obstacles;
  var rising = risesAt(ax, ay, ob.curves);
  var diagonals = diagonalOrder(rising);
  var sides = sideOrder(rising);

  function candidates(ring) {
    var g = base * RINGS[ring];
    var out = [];
    diagonals.forEach(function (dir) {
      /* Зазор по диагонали раскладывается на две оси: рамка стоит от
         точки так же далеко, как и сбоку. */
      var step = g * Math.SQRT1_2;
      out.push({ x: ax + dir[0] * (halfW + step), y: ay + dir[1] * (halfH + step) });
    });
    sides.forEach(function (dir) {
      var dx = dir[0] * (dir[0] ? halfW + g : 0);
      var dy = dir[1] * (dir[1] ? halfH + g : 0);
      var along = dir[0] !== 0 ? [0, -halfH, halfH] : [0, -halfW, halfW];
      along.forEach(function (shift) {
        out.push({
          x: ax + dx + (dir[0] === 0 ? shift : 0),
          y: ay + dy + (dir[0] !== 0 ? shift : 0),
        });
      });
    });
    return out;
  }

  /* Прежнее место, если оно годится: рисунок, который и так был без
     пересечений, не двигается. */
  if (req.legacy) {
    var kept = { x: req.legacy.x, y: req.legacy.y, halfW: halfW, halfH: halfH };
    if (slack(kept, ob, { x: ax, y: ay }) >= 0) {
      return { x: kept.x, y: kept.y, ring: 0, free: true, leader: null, kept: true };
    }
  }

  var fallback = null;
  for (var ring = 0; ring < RINGS.length; ring++) {
    var list = candidates(ring);
    for (var i = 0; i < list.length; i++) {
      var box = { x: list[i].x, y: list[i].y, halfW: halfW, halfH: halfH };
      var room = slack(box, ob, { x: ax, y: ay });
      if (room >= 0) {
        return {
          x: box.x,
          y: box.y,
          ring: ring,
          free: true,
          leader: ring === 0 ? null : leaderOf(ax, ay, r, box),
        };
      }
      /* Запасной вариант на случай, если свободных мест нет: самое
         малое нарушение, а при равенстве — ближайшее кольцо. */
      if (!fallback || room > fallback.room + 1e-9) {
        fallback = { x: box.x, y: box.y, ring: ring, room: room };
      }
    }
  }
  return {
    x: fallback.x,
    y: fallback.y,
    ring: fallback.ring,
    free: false,
    leader: fallback.ring === 0 ? null : leaderOf(ax, ay, r, fallback),
  };
}

/* Выноска: от края кружка к ближайшей точке рамки. */
function leaderOf(ax, ay, r, box) {
  var cx = Math.max(box.x - box.halfW, Math.min(ax, box.x + box.halfW));
  var cy = Math.max(box.y - box.halfH, Math.min(ay, box.y + box.halfH));
  var dx = cx - ax,
    dy = cy - ay;
  var len = Math.sqrt(dx * dx + dy * dy);
  if (len <= r + 1) {
    return null;
  }
  var k = (r + 1) / len;
  return { x1: ax + dx * k, y1: ay + dy * k, x2: cx, y2: cy };
}

var api = {
  CLEAR: CLEAR,
  pointTextWidth: pointTextWidth,
  plainOfTex: plainOfTex,
  segRectDist: segRectDist,
  obstaclesOf: obstaclesOf,
  placePointLabel: placePointLabel,
  slack: slack,
};

export default api;
export { CLEAR, pointTextWidth, plainOfTex, segRectDist, obstaclesOf, placePointLabel, slack };
