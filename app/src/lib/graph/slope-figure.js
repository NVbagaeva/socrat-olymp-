/* graph/slope-figure.js — чертёж условия с треугольниками наклона.

   Треугольник подсказывает ответ, поэтому на чертеже ученика его нет
   (рендерер рисует фигуры с пометкой slope только на сцене
   с showSlopeTriangle: true). Здесь собирается такая сцена: тот же
   график, что в условии, и поверх — треугольники, по которым найден
   угловой коэффициент. Её берут лишь места, где треугольник уместен:
   лист учителя, подсказка тренажёра на шаге «Построй треугольник»,
   разбор опорной задачи.

   Сцена условия восстанавливается из meta по тем же правилам, что
   sceneFor в generate.js и generate-quadratic.js: без треугольников
   она даёт тот же SVG, что у ученика, — это сверяет автопроверка.
*/

import renderer from './renderer.js';
import Rational from './families/rational.js';
import Slope from './slope.js';
import { loadSets } from './generate.js';
import { pointText } from './text.js';

var COLORS = ['lineA', 'lineB'];

/* Описание задачи и её набора в данных: оттуда подписи кривых, точки
   и подписи осей — ровно то, по чему генератор рисовал условие. */
function sourceOf(taskId) {
  var sets = loadSets();
  var found = null;
  sets.prep.concat(sets.prototypes).forEach(function (set) {
    (set.tasks || []).forEach(function (item) { if (item.id === taskId) { found = { set: set, task: item }; } });
  });
  return found;
}

/**
 * Сцена чертежа условия, восстановленная из meta по тем же правилам,
 * что sceneFor в generate.js и generate-quadratic.js. Без треугольников
 * она даёт тот же SVG, что у ученика, — это сверяет автопроверка.
 */
function taskScene(task) {
  var meta = task.meta || {};
  var source = sourceOf(task.id);
  if (!source || !meta.window) { return null; }
  var set = source.set;
  var def = source.task;
  var axisLabels = def.axisLabels || set.axisLabels || 'minimal';
  var singleLabel = def.curveLabel === null ? null : (def.curveLabel || set.curveLabel || 'y = f(x)');

  if (meta.family === 'rational') {
    var value = function (f) { return f.p / f.q; };
    /* Как sceneFor в generate-rational.js: кривые не подписаны. */
    var hyper = { k: value(meta.m), a: -value(meta.s), b: value(meta.t) };
    var rationalCurves = [{ type: 'rational', k: hyper.k, a: hyper.a, b: hyper.b, color: 'lineA', label: null }];
    if (meta.line) {
      rationalCurves.push({ type: 'line', k: value(meta.line.k), b: value(meta.line.b), color: 'lineB', label: null });
    }
    return {
      window: meta.window,
      grid: { step: 1, show: true },
      axes: { labelX: 'x', labelY: 'y', origin: '0' },
      labelRules: 'strict',
      axisLabels: axisLabels,
      curves: rationalCurves,
      points: (meta.points || []).map(function (p) {
        return { x: p.x, y: p.y, style: 'solid',
                 color: p.role === 'cross' ? 'cross' : (p.role === 'line' ? 'lineB' : 'lineA'),
                 label: p.label || null };
      }),
      shapes: Rational.asymptotes(hyper, meta.window),
      alt: meta.line ? 'Графики гиперболы и прямой' : 'График гиперболы'
    };
  }

  if (meta.family === 'quadratic') {
    var curves = meta.curves || [];
    var pair = def.curveLabels || set.curveLabels || ['y = f(x)', 'y = g(x)'];
    var points = [];
    curves.forEach(function (curve, i) {
      (curve.points || []).forEach(function (p) {
        points.push({ x: p.x, y: p.y, style: 'solid', color: COLORS[i], label: p.label });
      });
    });
    (meta.points || []).filter(function (p) { return p.role === 'cross'; }).forEach(function (p) {
      points.push({ x: p.x, y: p.y, style: 'solid', color: 'cross', label: null });
    });
    return {
      window: meta.window,
      grid: { step: 1, show: true },
      axes: { labelX: 'x', labelY: 'y', origin: '0' },
      labelRules: 'strict',
      axisLabels: axisLabels,
      curves: curves.map(function (curve, i) {
        var label = curves.length === 1 ? singleLabel : (pair[i] || null);
        return curve.kind === 'line'
          ? { type: 'line', k: curve.k, b: curve.b, color: COLORS[i], label: label }
          : { type: 'quadratic', a: curve.a, b: curve.b, c: curve.c, color: COLORS[i], label: label };
      }),
      points: points,
      alt: curves.length === 1 ? 'График квадратичной функции'
        : (curves[1].kind === 'line' ? 'Графики квадратичной и линейной функций'
                                     : 'Графики двух квадратичных функций')
    };
  }

  var lines = meta.lines || [];
  var single = lines.length === 1;
  var labels = def.curveLabels || set.curveLabels || null;
  var linePoints = [];
  lines.forEach(function (line, i) {
    (line.points || []).forEach(function (p) {
      linePoints.push({ x: p.x, y: p.y, style: 'solid', color: COLORS[i] });
    });
  });
  if (meta.probe) {
    linePoints.push({ x: meta.probe.x, y: meta.probe.y, style: 'solid', color: 'lineB',
      label: pointText(def.pointName || 'A', meta.probe.x, meta.probe.y) });
  }
  return {
    window: meta.window,
    grid: { step: 1, show: true },
    axes: { labelX: 'x', labelY: 'y', origin: '0' },
    axisLabels: axisLabels,
    curves: lines.map(function (line, i) {
      return { type: 'line', k: line.k, b: line.b, color: COLORS[i],
               label: single ? singleLabel : (labels ? (labels[i] || null) : null) };
    }),
    points: linePoints,
    alt: single ? 'График линейной функции' : 'Графики двух линейных функций'
  };
}

/**
 * SVG: чертёж условия и треугольники наклона.
 *
 * items — [{ triangle, curve, legLabels }]: треугольник из slope.js,
 *         номер кривой (0 — f, 1 — g), чьим цветом он рисуется,
 *         и legLabels: false — без длин катетов у этого треугольника.
 * report — отчёт рендерера о размещении подписей (для проверки).
 * options.legLabels: false — без длин катетов (шаг подсказки, где
 *         катеты ученик ещё считает сам).
 */
function render(task, items, options, report) {
  var scene = taskScene(task);
  if (!scene) { return null; }
  var shapes = [];
  (items || []).forEach(function (item, i) {
    if (item.triangle.flat) { return; }
    var legLabels = item.legLabels !== false && (!options || options.legLabels !== false);
    shapes = shapes.concat(Slope.shapes(item.triangle, String(i + 1), COLORS[item.curve],
      { legLabels: legLabels }));
  });
  if (shapes.length) {
    scene.shapes = (scene.shapes || []).concat(shapes);
    scene.showSlopeTriangle = true;
  }
  return renderer.renderGraph(scene, report);
}

/* ══════════════════════════════════════════════════════════
   Раскладка подписей треугольника
   ══════════════════════════════════════════════════════════ */

function segment(p, a, b) {
  var vx = b.x - a.x; var vy = b.y - a.y;
  var len = vx * vx + vy * vy;
  var u = len ? Math.max(0, Math.min(1, ((p[0] - a.x) * vx + (p[1] - a.y) * vy) / len)) : 0;
  return Math.hypot(p[0] - (a.x + u * vx), p[1] - (a.y + u * vy));
}

function overlap(a, b) {
  return Math.abs(a.x - b.x) < a.halfW + b.halfW && Math.abs(a.y - b.y) < a.halfH + b.halfH;
}

/**
 * Что не так с подписями треугольников на чертеже: они налезают друг
 * на друга, на подписи кривых, точек и чисел на осях, лежат на кривой,
 * стоят далеко от своей дуги или своего катета. Пусто — раскладка чистая.
 * Меряется по отчёту рендерера: по тем прямоугольникам, что он поставил.
 */
function layoutProblems(task, items) {
  var report = {};
  render(task, items, null, report);
  var scene = taskScene(task);
  if (!scene) { return []; }
  var g = renderer.THEME.geometry;
  var cell = g.cell;
  var sx = function (x) { return g.pad + (x - scene.window.xmin) * cell; };
  var sy = function (y) { return g.pad + (scene.window.ymax - y) * cell; };
  var boxes = report.boxes || [];
  var mine = boxes.filter(function (box) { return String(box.id || '').indexOf('teacher-') === 0; });
  var others = boxes.filter(function (box) {
    return String(box.id || '').indexOf('teacher-') !== 0 &&
      ['curveLabel', 'pointLabel', 'axisLabel', 'shapeLabel'].indexOf(box.kind) >= 0;
  });
  var out = [];
  var find = function (id) { return mine.filter(function (box) { return box.id === id; })[0]; };

  items.forEach(function (item, i) {
    var t = item.triangle;
    if (t.flat) { return; }
    var angle = find('teacher-angle-' + (i + 1));
    if (angle && Math.hypot(angle.x - sx(t.acute.x), angle.y - sy(t.acute.y)) > 3.5 * cell) {
      out.push('подпись ' + angle.id + ' далеко от своей дуги');
    }
    var kValue = t.k.p / t.k.q;
    if (angle) {
      var ax = (angle.x - g.pad) / cell + scene.window.xmin;
      var ay = scene.window.ymax - (angle.y - g.pad) / cell;
      if (t.A.y + kValue * (ax - t.A.x) - ay <= 0) { out.push('подпись ' + angle.id + ' над прямой, а треугольник под ней'); }
    }
    var horizontalTo = t.rising ? t.A : t.B;
    var verticalTo = t.rising ? t.B : t.A;
    [['teacher-label-x-', horizontalTo, verticalTo], ['teacher-label-y-', verticalTo, horizontalTo]].forEach(function (leg) {
      var box = find(leg[0] + (i + 1));
      if (!box) { return; }
      var to = leg[1];
      var away = Math.hypot(box.x - sx((t.C.x + to.x) / 2), box.y - sy((t.C.y + to.y) / 2)) / cell;
      var half = Math.hypot(to.x - t.C.x, to.y - t.C.y) / 2;
      if (away > half + 1.6) { out.push('подпись ' + box.id + ' далеко от своего катета'); }
      var p = [(box.x - g.pad) / cell + scene.window.xmin, scene.window.ymax - (box.y - g.pad) / cell];
      if (segment(p, t.C, to) >= segment(p, t.C, leg[2])) {
        out.push('подпись ' + box.id + ' ближе к соседнему катету, чем к своему');
      }
    });
  });

  mine.forEach(function (box, i) {
    mine.slice(i + 1).forEach(function (other) {
      if (overlap(box, other)) { out.push('подписи ' + box.id + ' и ' + other.id + ' налезают друг на друга'); }
    });
    others.forEach(function (other) {
      if (overlap(box, other)) { out.push('подпись ' + box.id + ' налезает на ' + other.kind); }
    });
    scene.curves.forEach(function (curve) {
      for (var x = scene.window.xmin; x <= scene.window.xmax; x += 0.02) {
        var y = curve.type === 'line' ? curve.k * x + curve.b : curve.a * x * x + curve.b * x + curve.c;
        if (y < scene.window.ymin || y > scene.window.ymax) { continue; }
        if (Math.abs(sx(x) - box.x) < box.halfW && Math.abs(sy(y) - box.y) < box.halfH) {
          out.push('подпись ' + box.id + ' лежит на кривой');
          break;
        }
      }
    });
  });
  return out;
}

var api = { render: render, taskScene: taskScene, layoutProblems: layoutProblems };

export default api;
export { render, taskScene, layoutProblems };
