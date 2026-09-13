/* families/shared.js — общее для всех семейств кривых.

   Здесь нет предметной математики: только подбор окна и выборка
   точек. Формулы живут в файлах семейств, рисование — в renderer.js.

   Окно у рендерера жёстко ограничено: checkWindow требует симметрии
   по обеим осям и квадратного поля. Значит окно задаётся одним числом —
   полушириной в клетках, а «расширить окно» означает увеличить это
   число до следующего целого.
*/

'use strict';

var EPS = 1e-9;

/** Окно из одной полуширины: иного renderGraph не принимает. */
function windowOf(half) {
  return { xmin: -half, xmax: half, ymin: -half, ymax: half };
}

/**
 * Наименьшее целое окно, в которое попадают все опорные точки.
 *
 * base — окно семейства по умолчанию, max — потолок: за ним чертёж
 * становится нечитаемым, и расширять его бессмысленно. Точка за
 * потолком просто окажется за кадром и будет обрезана рамкой.
 */
function fitWindow(points, base, max) {
  var half = base;
  for (var i = 0; i < points.length; i++) {
    var p = points[i];
    if (p === null || p === undefined) { continue; }
    if (!isFinite(p.x) || !isFinite(p.y)) { continue; }
    half = Math.max(half, Math.ceil(Math.abs(p.x) - EPS), Math.ceil(Math.abs(p.y) - EPS));
  }
  return windowOf(Math.min(half, max));
}

/**
 * Выборка по формуле на отрезке.
 *
 * Шаг мелкий намеренно: на изгибах не должно быть углов. Точки, где
 * функция не определена или уходит в бесконечность, разрывают ломаную —
 * вместо одной кривой получается несколько кусков. Именно так ветви
 * гиперболы остаются несоединёнными.
 *
 * Значения за окном не выбрасываются: рамку по окну режет сам рендерер,
 * и ему нужна точка снаружи, чтобы провести линию ровно до границы.
 * Но совсем огромные числа обрезаются — иначе полилиния копит мусор.
 */
function sample(fn, from, to, steps, limit) {
  var pieces = [];
  var current = [];
  var cap = limit === undefined ? 1e6 : limit;

  for (var i = 0; i <= steps; i++) {
    var x = from + ((to - from) * i) / steps;
    var y = fn(x);

    if (y === null || !isFinite(y) || Math.abs(y) > cap) {
      if (current.length > 1) { pieces.push(current); }
      current = [];
      continue;
    }
    current.push({ x: x, y: y });
  }
  if (current.length > 1) { pieces.push(current); }
  return pieces;
}

/**
 * Выборка со сгущением к краю отрезка.
 *
 * Возле вертикальной асимптоты равномерный шаг даёт ломаную из двух-трёх
 * отрезков: кривая там почти вертикальна. Сгущение по степенному закону
 * ставит точки плотнее у ближнего к асимптоте конца.
 */
function sampleDense(fn, near, far, steps, power, limit) {
  var p = power === undefined ? 3 : power;
  var pieces = [];
  var current = [];
  var cap = limit === undefined ? 1e6 : limit;

  for (var i = 0; i <= steps; i++) {
    var t = i / steps;
    var x = near + (far - near) * Math.pow(t, p);
    var y = fn(x);

    if (y === null || !isFinite(y) || Math.abs(y) > cap) {
      if (current.length > 1) { pieces.push(current); }
      current = [];
      continue;
    }
    current.push({ x: x, y: y });
  }
  if (current.length > 1) { pieces.push(current); }
  return pieces;
}

/** Пунктирная асимптота цветом сетки. Подписей в этой задаче нет. */
function asymptote(from, to) {
  return { type: 'segment', from: from, to: to, style: 'dashed', color: 'grid' };
}

function verticalAsymptote(x, win) {
  return asymptote([x, win.ymin], [x, win.ymax]);
}

function horizontalAsymptote(y, win) {
  return asymptote([win.xmin, y], [win.xmax, y]);
}

var api = {
  EPS: EPS,
  windowOf: windowOf,
  fitWindow: fitWindow,
  sample: sample,
  sampleDense: sampleDense,
  asymptote: asymptote,
  verticalAsymptote: verticalAsymptote,
  horizontalAsymptote: horizontalAsymptote,
};

export default api;
export {
  EPS, windowOf, fitWindow, sample, sampleDense,
  asymptote, verticalAsymptote, horizontalAsymptote,
};
