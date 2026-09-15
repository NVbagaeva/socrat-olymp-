/* families/shared.js — общее для всех семейств кривых.

   Здесь нет предметной математики: только подбор окна и выборка
   точек. Формулы живут в файлах семейств, рисование — в renderer.js.

   Окно у рендерера жёстко ограничено: checkWindow требует симметрии
   по обеим осям и квадратного поля. Значит окно задаётся одним числом —
   полушириной в клетках, а «расширить окно» означает увеличить это
   число до следующего целого.
*/

'use strict';

import { THEME } from '../renderer.js';

var EPS = 1e-9;

/* ── Рисунок пунктира ─────────────────────────────────────────────
   Один на весь движок: асимптоты и катеты треугольника наклона
   пунктирятся одинаково. Штрих вдвое длиннее промежутка и заметно
   длиннее толщины линии — иначе пунктир читается сплошной серой.

   Рисунок подставляется в THEME, потому что renderShape берёт его
   оттуда и правок в renderer.js для этого не нужно: THEME — штатная
   точка настройки оформления, она для того и вынесена в экспорт. */
var DASH = '10 5';
THEME.helper.dash = DASH;

/* Цвет асимптоты. Сетка для неё слишком бледная: асимптота —
   математически значимая линия, а не часть фона. Берётся готовый
   оттенок палитры, заметно темнее сетки; новых цветов не заводим.
   Ключ добавляется в THEME — штатную точку настройки оформления,
   вынесенную движком в экспорт, поэтому renderer.js не правится.
   Запасное значение — цвет оси: своих хексов здесь не заводим. */
THEME.colors.asymptote = 'var(--graph-asymptote, var(--graph-axis))';

/* Цвет нарушения: точки, которыми на чертеже отмечено, что условие
   функции не выполняется. В самом рендерере красного нет намеренно —
   там он означал бы ошибку и риск. Здесь он значит ровно одно:
   нарушение условия функции, и берётся тем же токеном, которым на
   странице покрашены бейдж «НЕ ФУНКЦИЯ» и крестик. Ключ добавляется
   в THEME — штатную точку настройки оформления, вынесенную движком
   в экспорт, поэтому renderer.js не правится. */
THEME.colors.wrong = 'var(--graph-wrong, var(--color-error))';

/* Насколько кривая должна отстоять от оси, чтобы не читаться её
   утолщением. Пятая часть клетки — в единицах математических
   координат клетка равна единице. */
var CLEARANCE = 0.2;

/* ── Единый масштаб ───────────────────────────────────────────────
   Размер холста движок считает как (xmax − xmin) × cell, где cell —
   пикселей на клетку, общие для всех чертежей. Значит одинаковый
   размер картинки и одинаковый шаг сетки — это одна и та же
   полуширина окна у всех семейств.

   Отсюда правило: семейство задаёт границы окна только в
   математических единицах и только этой величиной. Пиксельный
   масштаб не трогает никто. */
var HALF = 6;

/** Окно из одной полуширины: квадратное и симметричное. */
function windowOf(half) {
  return { xmin: -half, xmax: half, ymin: -half, ymax: half };
}

/** Прямоугольное окно. Масштаб по осям всё равно общий: обе
    координаты рендерер считает от одного размера клетки. */
function windowBox(xmin, xmax, ymin, ymax) {
  return { xmin: xmin, xmax: xmax, ymin: ymin, ymax: ymax };
}

/* ── Подписи в долях π ────────────────────────────────────────────
   Числом доли π записать нельзя, поэтому подписи задаются строками
   через новое поле axes.ticks. */
var PI_HALF = Math.PI / 2;

/** Подпись деления, кратного π/2: «π/2», «π», «3π/2», «2π», «−π». */
function piLabel(halves) {
  var n = Math.round(halves);
  if (n === 0) { return null; }
  var sign = n < 0 ? '\u2212' : '';
  var k = Math.abs(n);
  if (k % 2 === 0) {
    var whole = k / 2;
    return sign + (whole === 1 ? '\u03c0' : whole + '\u03c0');
  }
  return sign + (k === 1 ? '\u03c0/2' : k + '\u03c0/2');
}

/** Деления по оси x с шагом π/2 в пределах окна. */
function piTicks(win) {
  var out = [];
  var from = Math.ceil(win.xmin / PI_HALF - EPS);
  var to = Math.floor(win.xmax / PI_HALF + EPS);
  for (var n = from; n <= to; n++) {
    out.push({ at: n * PI_HALF, label: piLabel(n) });
  }
  return out;
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

/* ── Асимптоты ────────────────────────────────────────────────────
   Общее правило на все семейства: асимптота рисуется пунктиром
   только тогда, когда она НЕ совпадает с координатной осью. Ось на
   чертеже уже есть, и вторая линия поверх неё — мусор.

   Проверка живёт здесь одна на всех, а не условием в каждом файле
   семейства. */

/** Совпадает ли асимптота с осью: значение ноль и есть ось. */
function onAxis(value) {
  return Math.abs(value) < EPS;
}

function asymptote(from, to) {
  return { type: 'segment', from: from, to: to, style: 'dashed', color: 'asymptote' };
}

/** Вертикальная x = value. На оси y не рисуется — вернётся null. */
function verticalAsymptote(x, win) {
  if (onAxis(x)) { return null; }
  return asymptote([x, win.ymin], [x, win.ymax]);
}

/** Горизонтальная y = value. На оси x не рисуется — вернётся null. */
function horizontalAsymptote(y, win) {
  if (onAxis(y)) { return null; }
  return asymptote([win.xmin, y], [win.xmax, y]);
}

/** Собрать список, выбросив совпавшие с осями. */
function asymptotes(list) {
  return list.filter(function (item) { return item !== null; });
}

var api = {
  EPS: EPS,
  DASH: DASH,
  CLEARANCE: CLEARANCE,
  HALF: HALF,
  onAxis: onAxis,
  windowBox: windowBox,
  PI_HALF: PI_HALF,
  piLabel: piLabel,
  piTicks: piTicks,
  asymptotes: asymptotes,
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
  EPS, DASH, CLEARANCE, HALF, PI_HALF, windowOf, windowBox, piLabel, piTicks, fitWindow, sample, sampleDense,
  onAxis, asymptote, asymptotes, verticalAsymptote, horizontalAsymptote,
};
