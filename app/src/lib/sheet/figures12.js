/* sheet/figures12.js — рисунки печатных листов задания №12.

   На листе два места для рисунка, и у каждого свой режим
   (graph/renderer.js, renderFigure):

     условие  — 'student'. Так же у учителя: рисунок условия на обоих
                листах одного комплекта один и тот же, байт в байт.
                Сетка, оси, графики, названные в условии точки — и
                ничего из построений;
     разбор   — 'teacherSolution'. Отдельный рисунок рядом с решением
                на листе учителя: треугольник наклона у прямой и у
                корня с прямой, система x′Oy′ у параболы, асимптоты и
                отмеченные узлы у гиперболы.

   Модуль общий для листа генератора (в браузере) и для сборника
   (scripts/build-pdf-12.mjs, в Node): движок приходит аргументом.
*/

import renderer from '../graph/renderer.js';
import QuadraticAux from '../graph/quadratic-aux.js';
import Sqrt from '../graph/generate-sqrt.js';
import Line from '../graph/families/line.js';
import Triangle from '../graph/triangle.js';

/* Названа ли точка в условии: буква её подписи (A из «A(2; 3)»)
   стоит в тексте отдельным словом. Текст — простой, без разметки. */
export function namedInCondition(label, question) {
  var letter = /^[A-Z]/.exec(String(label || ''));
  if (!letter) { return false; }
  return new RegExp('(^|[^A-Za-z])' + letter[0] + '([^A-Za-z]|$)').test(String(question || ''));
}

/**
 * Сцена рисунка условия: режим 'student' (без построений и безымянных
 * узлов) и только те подписанные точки, что названы в условии. Точка A
 * у задачи «Найдите a» на рисунке сайта подписана — разбор на неё
 * ссылается, — а в условии её нет, и ученику она не нужна.
 */
export function conditionScene(task) {
  if (!task || !task.scene) { return null; }
  var scene = renderer.sceneForMode(task.scene, 'student');
  return Object.assign({}, scene, {
    points: scene.points.filter(function (point) {
      return namedInCondition(point.label, task.question);
    })
  });
}

/** Рисунок условия: чистый, как на листе ученика. Нет сцены — нет рисунка. */
export function conditionSvg(task) {
  var scene = conditionScene(task);
  return scene === null ? null : renderer.renderGraph(scene);
}

/* Сцена построения к разбору — или null, если строить нечего. */
function solutionScene(task, generator) {
  var meta = task.meta || {};
  if (meta.family === 'quadratic') {
    return QuadraticAux.hasAux(meta) ? QuadraticAux.auxScene(meta, null) : task.scene;
  }
  if (meta.family === 'rational') {
    return task.scene;
  }
  if (meta.family === 'sqrt') {
    var A = (meta.points || []).filter(function (p) { return p.role === 'cross'; })[0];
    var P = (meta.points || []).filter(function (p) { return p.role === 'line'; })[0];
    if (meta.line && A && P) {
      var triangle = Triangle.build(Line.create(meta.line.k, meta.line.b), meta.window,
        [{ x: A.x, y: A.y }, { x: P.x, y: P.y }]);
      if (triangle) { return Sqrt.sceneWith(meta, Triangle.shapes(triangle)); }
    }
    return task.scene;
  }
  /* Прямая: сцена разбора движка с треугольником наклона. Две прямые
     (12.C, 12.D) треугольника не строят — тогда сцена задачи с
     отмеченными узлами. */
  var analysis = null;
  try { analysis = generator ? generator.analysis(task.id, meta.seed) : null; }
  catch { analysis = null; }
  return analysis ? analysis.scene : task.scene;
}

/**
 * Рисунок к разбору на листе учителя. null — если построений нет и
 * он совпал бы с рисунком условия: второй такой же рисунок не нужен.
 */
export function solutionSvg(task, generator) {
  if (!task || !task.scene) { return null; }
  var scene = solutionScene(task, generator);
  if (!scene) { return null; }
  var svg = renderer.renderFigure(scene, 'teacherSolution');
  return svg === conditionSvg(task) ? null : svg;
}

/* Ширина рисунка в миллиметрах при клетке cell: у движка клетка —
   34 единицы viewBox (sheet/sheet.js). Рисунок к разбору печатается
   в той же клетке, что и условие. */
var CELL_UNITS = 34;

/** Рисунок к разбору для answers12: { svg, width } или null. */
export function solutionFigure(task, generator, cell) {
  var svg = solutionSvg(task, generator);
  if (!svg) { return null; }
  var box = /viewBox="0 0 ([0-9.]+) /.exec(svg);
  return { svg: svg, width: box ? Number(box[1]) / CELL_UNITS * cell : null };
}

const api = { namedInCondition: namedInCondition, conditionScene: conditionScene,
  conditionSvg: conditionSvg, solutionSvg: solutionSvg, solutionFigure: solutionFigure };

export default api;
