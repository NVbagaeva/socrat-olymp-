/* graph/quadratic-aux.js — вспомогательные построения на чертеже параболы.

   Вспомогательная система координат x′Oy′ с началом в вершине: в ней
   парабола имеет вид y′ = a·x′², и a читается шагом от вершины. Оси
   рисуются цветом подсказок (токен --graph-aux-axis: оранжевый, в ч/б
   печати серый), пунктиром, со стрелками и подписями x′, y′ тем же
   цветом; вершина выделена. Основные оси остаются тёмными, парабола —
   синей.

   Где она есть: подсказка тренажёра (шаг 3а), разбор опорных задач и
   лист учителя. На исходном чертеже задачи и в листе ученика её нет:
   там рисуется meta.scene как есть. Подсветка выбранных точек и оси
   симметрии — только в подсказке.

   Чертёж перерисовывается по meta.scene — той же сцене, по которой
   движок нарисовал задачу (generate-quadratic.js). */

import renderer from './renderer.js';

/* Класс у всех фигур вспомогательной системы: по нему проверка находит
   их в svg и убеждается, что на чертеже задачи их нет. */
var AUX_CLASS = 'chart-aux';

function clone(value) { return JSON.parse(JSON.stringify(value)); }

/** Фигуры системы x′Oy′ с началом в вершине (vx; vy). */
function auxShapes(vx, vy, win) {
  var right = win.xmax + 0.6;
  var top = win.ymax + 0.6;
  return [
    { type: 'segment', from: [win.xmin - 0.3, vy], to: [right, vy], color: 'aux', style: 'dashed',
      arrow: true, className: AUX_CLASS, width: 2 },
    { type: 'segment', from: [vx, win.ymin - 0.3], to: [vx, top], color: 'aux', style: 'dashed',
      arrow: true, className: AUX_CLASS, width: 2 },
    { type: 'label', at: [right, vy], offset: [-6, -12], text: 'x′', color: 'aux', size: 15,
      anchor: 'end' },
    { type: 'label', at: [vx, top], offset: [12, 6], text: 'y′', color: 'aux', size: 15,
      anchor: 'start' },
    { type: 'dot', at: [vx, vy], color: 'aux', radius: 6 }
  ];
}

/** Подсветка точки графика (выбранный узел сетки). */
function pointShapes(points) {
  return points.map(function (point) {
    return { type: 'dot', at: [point.x, point.y], color: 'aux', radius: 8 };
  });
}

/** Ось симметрии x = x0 пунктиром — для плохого случая. */
function axisShapes(x0, win) {
  return [{ type: 'segment', from: [x0, win.ymin - 0.3], to: [x0, win.ymax + 0.3], color: 'aux',
    style: 'dashed', className: 'chart-sym', width: 2 }];
}

function render(meta, shapes) {
  if (!meta || !meta.scene) { return null; }
  var scene = clone(meta.scene);
  scene.shapes = (scene.shapes || []).concat(shapes);
  return renderer.renderGraph(scene);
}

/** Есть ли у задачи вспомогательная система: вершина в узле сетки
 *  внутри чертежа — то же условие, что у шага 3а разбора. */
function hasAux(meta) {
  var win = meta && meta.scene && meta.scene.window;
  return !!win && Number.isInteger(meta.m) && Number.isInteger(meta.n) &&
    meta.m > win.xmin && meta.m < win.xmax && meta.n > win.ymin && meta.n < win.ymax;
}

/** Чертёж задачи со вспомогательной системой координат. */
function auxSvg(meta, chosen) {
  if (!meta || !meta.scene) { return null; }
  return render(meta, auxShapes(meta.m, meta.n, meta.scene.window)
    .concat(pointShapes(chosen ? [chosen] : [])));
}

/** Сцена со вспомогательной системой — для блока разбора (type: 'scene'). */
function auxScene(meta, chosen) {
  if (!meta || !meta.scene) { return null; }
  var scene = clone(meta.scene);
  scene.shapes = (scene.shapes || []).concat(auxShapes(meta.m, meta.n, scene.window))
    .concat(pointShapes(chosen ? [chosen] : []));
  return scene;
}

/** Чертёж с подсвеченными точками и осью симметрии x = x0. */
function symmetrySvg(meta, pair, x0) {
  if (!meta || !meta.scene) { return null; }
  return render(meta, axisShapes(x0, meta.scene.window).concat(pointShapes(pair)));
}

function symmetryScene(meta, pair, x0) {
  if (!meta || !meta.scene) { return null; }
  var scene = clone(meta.scene);
  scene.shapes = (scene.shapes || []).concat(axisShapes(x0, scene.window)).concat(pointShapes(pair));
  return scene;
}

const api = { AUX_CLASS: AUX_CLASS, hasAux: hasAux, auxSvg: auxSvg, auxScene: auxScene, symmetrySvg: symmetrySvg,
  symmetryScene: symmetryScene };

export default api;
export { AUX_CLASS, hasAux, auxSvg, auxScene, symmetrySvg, symmetryScene };
