/* graph/solution-teacher.js — полное решение для листа ответов учителя.

   Разбор для ученика объясняет и ведёт за руку; лист учителя нужен,
   чтобы проверить работу ученика на каждом шаге. Решение набирается
   по пунктам: у каждого пункта номер и заголовок («Общий вид», «Точки
   с рисунка», «Направление прямой», «Треугольник», «Находим k»,
   «Находим b», «Формула»), под ним — одна-две короткие строки и
   формула. У задачи с двумя функциями пункты разбиты на блоки
   «I. Находим f(x)», «II. Находим g(x)», «III. Точки пересечения»,
   нумерация в каждом блоке своя.

   Всё строится из параметров задачи (task.meta): точных дробей
   коэффициентов, отмеченных точек и окна чертежа. Шаблонных чисел нет.
   Нецелые числа пишутся обыкновенной дробью; ответ — как в ключе.

   Модуль отдаёт структуру, а не разметку:
     { steps: [{ block, no, title, rows: [{ text, tex }], slope? }], check }
   text — строка, где формулы стоят между знаками $…$; tex — отдельная
   формула строки; slope — треугольник наклона пункта «Треугольник».
   check — что посчитано, для автопроверки
   (scripts/check-teacher-solutions.mjs).
*/

import Line from './families/line.js';
import Q from './families/quadratic.js';
import R from './generate-rational.js';
import { equationText as lineEquationText } from './generate.js';
import Slope from './slope.js';
import SlopeFigure from './slope-figure.js';

var frac = Line.frac;
var toFrac = Line.toFrac;
var add = Line.add;
var sub = Line.sub;
var mul = Line.mul;
var div = Line.div;
var num = Line.num;
var isInt = Line.isInt;
var isZero = Line.isZero;

var ZERO = frac(0);

function neg(f) { return frac(-f.p, f.q); }
function abs(f) { return frac(Math.abs(f.p), f.q); }
function eq(a, b) { return a.p === b.p && a.q === b.q; }
function F(value) { return toFrac(value); }

function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a; }
function lcm(a, b) { return a / gcd(a, b) * b; }

/* ══════════════════════════════════════════════════════════
   Числа в формулу
   ══════════════════════════════════════════════════════════ */

/** Число: целое как есть, нецелое — обыкновенной дробью. */
function N(f) {
  if (isInt(f)) { return String(f.p); }
  return (f.p < 0 ? '-' : '') + '\\dfrac{' + Math.abs(f.p) + '}{' + f.q + '}';
}

/** То же в скобках, если отрицательное: 2 · (−3), f(−3) — без двойных скобок. */
function P(f) {
  if (f.p >= 0) { return N(f); }
  return isInt(f) ? '(' + N(f) + ')' : '\\left(' + N(f) + '\\right)';
}

/** Основание степени: отрицательное и дробное — в скобках, (−3)^2 и (1/2)^2. */
function Pw(f) {
  if (isInt(f)) { return f.p < 0 ? '(' + N(f) + ')' : N(f); }
  return '\\left(' + N(f) + '\\right)';
}

/** Слагаемое со знаком: « + 3», « − 3» — без «+ (−3)». */
function plus(f) { return f.p < 0 ? ' - ' + N(abs(f)) : ' + ' + N(f); }

/** Разность x − x₀ со знаком по смыслу: x − 2, x + 3/2. */
function minus(left, f) {
  if (isZero(f)) { return left; }
  return left + (f.p < 0 ? ' + ' : ' - ') + N(abs(f));
}

/** Скобка (x − x₀): у дроби — растянутая, у нуля — без скобок. */
function bracket(body, f) {
  if (isZero(f)) { return body; }
  return isInt(f) ? '(' + body + ')' : '\\left(' + body + '\\right)';
}

/** Конечная десятичная запись есть: знаменатель из двоек и пятёрок. */
function decimalFriendly(f) {
  var q = Math.abs(f.q);
  while (q % 2 === 0) { q /= 2; }
  while (q % 5 === 0) { q /= 5; }
  return q === 1;
}

/** Десятичная запись для формулы: 3{,}5. */
function D(f) {
  return String(Math.round(num(f) * 1e6) / 1e6).replace('.', '{,}');
}

/** Дробь и, если ответ в ключе десятичный, её десятичная запись: «7/2 = 3,5». */
function withDecimal(f) {
  if (isInt(f) || !decimalFriendly(f)) { return N(f); }
  return N(f) + ' = ' + D(f);
}

/** Значение функции: f(−3), f\left(\dfrac{27}{2}\right). */
function fn(name, x) { return name + (isInt(x) ? '(' + N(x) + ')' : '\\left(' + N(x) + '\\right)'); }

/** Строка перевода числа из условия в обыкновенную дробь, если она нужна. */
function convertRow(f) {
  if (isInt(f) || !decimalFriendly(f)) { return null; }
  return { text: 'Переводим в обыкновенную дробь: $' + D(f) + ' = ' + N(f) + '$.' };
}

/** Точка: (2; −3). */
function pt(x, y) {
  var X = F(x); var Y = F(y);
  var body = N(X) + ';\\, ' + N(Y);
  return isInt(X) && isInt(Y) ? '(' + body + ')' : '\\left(' + body + '\\right)';
}

/**
 * Многочлен по слагаемым [{ c, v }]: знаки без «+ −», единица перед
 * буквой не пишется, нулевые слагаемые пропускаются.
 */
function poly(terms) {
  var out = '';
  terms.forEach(function (term) {
    var c = term.c;
    if (isZero(c)) { return; }
    var a = abs(c);
    var body = term.v ? ((isInt(a) && a.p === 1) ? '' : N(a)) + term.v : N(a);
    if (out === '') { out = (c.p < 0 ? '-' : '') + body; }
    else { out += (c.p < 0 ? ' - ' : ' + ') + body; }
  });
  return out === '' ? '0' : out;
}

function quadTex(a, b, c) { return poly([{ c: a, v: 'x^2' }, { c: b, v: 'x' }, { c: c }]); }
function lineTex(k, b) { return poly([{ c: k, v: 'x' }, { c: b }]); }

/** Вычитаемое в скобках, если в нём знак или несколько слагаемых: − (2x + 5), − (−2x). */
function grouped(body) {
  if (!/[+-]/.test(body)) { return body; }
  return /\\dfrac/.test(body) ? '\\left(' + body + '\\right)' : '(' + body + ')';
}

/**
 * Подстановка числа в многочлен: «2 · (−3)^2 − (−3) + 1 = 18 + 3 + 1 = 22».
 * terms — [{ c, power }], power 2, 1 или 0.
 */
function substitute(terms, x) {
  var X = F(x);
  var shown = [];
  var values = [];
  var total = ZERO;
  terms.forEach(function (term) {
    if (isZero(term.c)) { return; }
    var value = term.power === 2 ? mul(term.c, mul(X, X)) : term.power === 1 ? mul(term.c, X) : term.c;
    total = add(total, value);
    var a = abs(term.c);
    var unit = isInt(a) && a.p === 1;
    var body;
    if (term.power === 0) { body = N(a); }
    else {
      var power = term.power === 2 ? Pw(X) + '^2' : P(X);
      body = unit ? power : N(a) + ' \\cdot ' + power;
    }
    shown.push({ negative: term.c.p < 0, body: body });
    values.push(value);
  });
  var join = function (items) {
    return items.map(function (item, i) {
      if (i === 0) { return (item.negative ? '-' : '') + item.body; }
      return (item.negative ? ' - ' : ' + ') + item.body;
    }).join('') || '0';
  };
  var line = join(shown);
  if (values.length > 1) {
    var middle = join(values.map(function (v) { return { negative: v.p < 0, body: N(abs(v)) }; }));
    if (middle !== line) { line += ' = ' + middle; }
  }
  if (values.length !== 1 || line !== N(total)) { line += ' = ' + N(total); }
  return { tex: line, value: total };
}

/** Произведение коэффициента на число: 2 · (−3), а при k = ±1 — (−3) и −(−3). */
function times(k, x) {
  if (isInt(k) && k.p === 1) { return P(x); }
  if (isInt(k) && k.p === -1) { return '-' + P(x); }
  return N(k) + ' \\cdot ' + P(x);
}

/** a · x₀²: 2 · (−3)^2, −(1/2)^2 при a = −1. */
function timesSquare(k, x) {
  return N(k) + ' \\cdot ' + Pw(x) + '^2';
}

function quadTerms(a, b, c) { return [{ c: a, power: 2 }, { c: b, power: 1 }, { c: c, power: 0 }]; }
function lineTerms(k, b) { return [{ c: k, power: 1 }, { c: b, power: 0 }]; }


/* ══════════════════════════════════════════════════════════
   Пункты решения
   ══════════════════════════════════════════════════════════ */

function row(textValue, texValue) {
  var out = {};
  if (textValue) { out.text = textValue; }
  if (texValue) { out.tex = texValue; }
  return out;
}

/**
 * Решение по пунктам. У задачи с двумя функциями пункты разбиты на блоки
 * («I. Находим f(x)», «II. Находим g(x)», «III. Точки пересечения»), и в
 * каждом блоке нумерация своя — с единицы. slope — треугольник наклона
 * пункта «Треугольник»: по нему разбор опорной задачи рисует чертёж.
 */
function Steps() {
  this.list = [];
  this.block = null;
}

Steps.prototype.start = function (block) { this.block = block; };

Steps.prototype.add = function (title, rows, extra) {
  var item = { block: this.block, title: title, rows: rows.filter(Boolean) };
  if (extra) { Object.keys(extra).forEach(function (key) { item[key] = extra[key]; }); }
  this.list.push(item);
  return item;
};

Steps.prototype.done = function () {
  var counters = {};
  this.list.forEach(function (item) {
    var key = item.block || '';
    counters[key] = (counters[key] || 0) + 1;
    item.no = counters[key];
  });
  return this.list;
};

var BLOCK_F = 'I. Находим f(x)';
var BLOCK_G = 'II. Находим g(x)';
var BLOCK_X = 'III. Точки пересечения';

/** Число в заголовке пункта — обычным текстом: «Находим f(13,5)». */
function plainNumber(f) {
  if (isInt(f)) { return String(f.p).replace('-', '−'); }
  if (decimalFriendly(f)) { return String(num(f)).replace('.', ',').replace('-', '−'); }
  return (f.p < 0 ? '−' : '') + Math.abs(f.p) + '/' + f.q;
}

/* ══════════════════════════════════════════════════════════
   Прямая по двум точкам: пункты «Общий вид» … «Формула»
   ══════════════════════════════════════════════════════════ */

/**
 * Пункты прямой. opts:
 *   name     — f или g;
 *   kLetter  — буква углового коэффициента (k, у прямой с гиперболой — a);
 *   bLetter  — буква свободного члена (b, у прямой с параболой — m);
 *   p1, p2   — точки прямой в узлах сетки; у точки может быть label —
 *              её имя из условия (A), остальные зовутся M и N;
 *   source   — откуда точки: 'marked' (отмечены) или 'grid' (узлы сетки);
 *   notes    — пояснение к точке по имени: { A: 'отмеченная точка пересечения' }.
 * Возвращает k, b, треугольник и имена точек.
 */
function lineSteps(S, opts) {
  var name = opts.name;
  var kL = opts.kLetter || 'k';
  var bL = opts.bLetter || 'b';
  var left = opts.p1.x < opts.p2.x ? opts.p1 : opts.p2;
  var right = opts.p1.x < opts.p2.x ? opts.p2 : opts.p1;
  /* Имена: из условия, иначе M и N — слева направо. */
  var free = ['M', 'N'].filter(function (letter) { return letter !== left.label && letter !== right.label; });
  var nameL = left.label || free.shift();
  var nameR = right.label || free.shift();
  var named = function (p, label) { return label + pt(p.x, p.y); };

  S.add('Общий вид', [row('', name + '(x) = ' + kL + 'x + ' + bL)]);

  var notes = opts.notes || {};
  var pointRows = [row('', named(left, nameL) + ',\\quad ' + named(right, nameR))];
  Object.keys(notes).forEach(function (label) {
    if (label === nameL || label === nameR) { pointRows.push(row('$' + label + '$ — ' + notes[label] + '.')); }
  });
  /* Отмеченные точки названы самим заголовком «Точки с рисунка»;
     пояснение нужно, только когда это просто узлы сетки на прямой. */
  if (opts.source === 'grid') {
    pointRows.push(row('Узлы сетки, через которые проходит прямая.'));
  }
  S.add('Точки с рисунка', pointRows);

  var t = Slope.build(left, right);
  var parts = Slope.pointedRows(t, { L: nameL, R: nameR }, kL);
  S.add('Направление прямой', parts.direction.map(function (r) { return row(r.text, r.tex); }));
  if (!t.flat) {
    S.add('Треугольник', parts.triangle.map(function (r) { return row(r.text, r.tex); }),
      { slope: { triangle: t, curve: opts.curve || 0 } });
  }
  S.add('Находим ' + kL, parts.k.map(function (r) { return row(r.text, r.tex); }));
  var k = t.k;

  var b;
  var onAxis = left.x === 0 ? left : right.x === 0 ? right : null;
  if (onAxis) {
    b = F(onAxis.y);
    S.add('Находим ' + bL, [row('$' + named(onAxis, onAxis === left ? nameL : nameR) +
      '$ лежит на оси $Oy$ $\\Rightarrow$ $' + bL + ' = ' + N(b) + '$')]);
  } else {
    var base = left;
    var baseName = nameL;
    var X = F(base.x); var Y = F(base.y);
    b = sub(Y, mul(k, X));
    S.add('Находим ' + bL, [
      row('Подставляем $' + named(base, baseName) + '$ в $' + name + '(x) = ' + lineTex(k, F(0)).replace(/^0$/, '') +
        (isZero(k) ? '' : ' + ') + bL + '$:'),
      row('', N(Y) + ' = ' + times(k, X) + ' + ' + bL + ' \\;\\Rightarrow\\; ' + bL + ' = ' + N(Y) +
        plus(neg(mul(k, X))) + ' = ' + N(b))
    ]);
  }
  S.add('Формула', [row('', name + '(x) = ' + lineTex(k, b))]);
  return { k: k, b: b, triangle: t, names: { L: nameL, R: nameR }, left: left, right: right };
}

/* ══════════════════════════════════════════════════════════
   Парабола по рисунку
   ══════════════════════════════════════════════════════════ */

function half(f) { return isInt(mul(frac(2), f)); }

/** Вершину можно прочитать с рисунка: она отмечена или стоит в полуклетке внутри окна. */
function vertexReadable(curve, win, marked) {
  if (marked) { return true; }
  return !!win && half(curve.m) && half(curve.n) &&
    Math.abs(curve.mValue) <= win.xmax - 1 && Math.abs(curve.nValue) <= win.ymax - 1;
}

/* Узлы сетки на параболе внутри окна, кроме вершины. */
function gridNodes(curve, win) {
  if (!win) { return []; }
  return Q.integerPoints(curve, win).filter(function (node) {
    return Math.abs(node.x - curve.mValue) > 1e-9;
  });
}

/** Ближайшая к вершине точка: из отмеченных, иначе узел сетки. */
function nearestToVertex(candidates, curve) {
  var best = null;
  candidates.forEach(function (point) {
    var away = Math.abs(point.x - curve.mValue);
    if (away < 1e-9) { return; }
    if (best === null || away < Math.abs(best.x - curve.mValue)) { best = point; }
  });
  return best;
}

function pointNote(point) {
  if (point.role === 'cross') { return 'отмеченная точка пересечения'; }
  return point.marked === false ? 'узел сетки' : 'отмечена на рисунке';
}

function pointName(point) { return (point.label || '') + pt(point.x, point.y); }

/**
 * Пункты параболы. letters — { a, b, c } (у второй параболы — a₂, b₂, c₂),
 * marks — отмеченные точки этой кривой, knownA — a дан в условии,
 * onlyA — спрашивают только a.
 */
function parabolaSteps(S, name, letters, curve, win, marks, knownA, onlyA) {
  var la = letters.a; var lb = letters.b; var lc = letters.c;
  var vertexMark = (marks || []).filter(function (point) { return point.role === 'vertex'; })[0] || null;
  var others = (marks || []).filter(function (point) { return point.role !== 'vertex'; });
  var used = [];

  S.add('Общий вид', [row('', name + '(x) = ' + la + 'x^2 + ' + lb + 'x + ' + lc)]);

  if (vertexReadable(curve, win, !!vertexMark)) {
    var x0 = curve.m; var y0 = curve.n;
    used.push({ x: num(x0), y: num(y0) });
    var node = null;
    if (!knownA) {
      node = nearestToVertex(others, curve) ||
        nearestToVertex(gridNodes(curve, win).map(function (p) { return { x: p.x, y: p.y, marked: false }; }), curve);
      if (!node) { throw new Error('solution-teacher: у параболы нет второй точки'); }
      used.push({ x: node.x, y: node.y });
    }
    S.add('Точки с рисунка', [
      row('Вершина: $(x_0;\\, y_0) = ' + pt(x0, y0) + '$' + (vertexMark ? ' (отмечена на рисунке).' : '.')),
      node ? row('Точка графика: $' + pointName(node) + '$ — ' + pointNote(node) + '.') : null
    ]);
    var A;
    if (knownA) {
      A = curve.a;
      S.add('Находим ' + la, [row('Коэффициент $' + la + ' = ' + N(A) + '$ дан в условии.')]);
    } else {
      var X = F(node.x); var Y = F(node.y);
      var dx = sub(X, x0); var dy = sub(Y, y0);
      var dx2 = mul(dx, dx);
      A = div(dy, dx2);
      var base = isZero(x0) ? ' \\cdot ' + Pw(X) : bracket(minus(N(X), x0), x0);
      var chain = N(Y) + ' = ' + la + base + '^2' + (isZero(y0) ? '' : plus(y0)) +
        ' \\;\\Rightarrow\\; ' + (isInt(dx2) && dx2.p === 1 ? '' : N(dx2)) + la + ' = ' + N(dy);
      if (!(isInt(dx2) && dx2.p === 1)) {
        chain += ' \\;\\Rightarrow\\; ' + la + ' = ' + (isInt(dy) && isInt(dx2) ? '' : N(dy) + ' : ' + N(dx2) + ' = ') + N(A);
      }
      S.add('Находим ' + la, [
        row('Подставляем точку в $' + name + '(x) = ' + la + '(x - x_0)^2 + y_0$:'),
        row('', chain)
      ]);
    }
    if (onlyA) { return { a: A, points: used, partial: true }; }
    var B = mul(frac(-2), mul(A, x0));
    var C = add(mul(A, mul(x0, x0)), y0);
    S.add('Находим ' + lb + ' и ' + lc, [
      row('Раскрываем скобки в $' + name + '(x) = ' + vertexTex(A, x0, y0) + '$:'),
      row('', lb + ' = -2' + la + 'x_0 = -2 \\cdot ' + P(A) + ' \\cdot ' + P(x0) + ' = ' + N(B)),
      row('', lc + ' = ' + la + 'x_0^2 + y_0 = ' + timesSquare(A, x0) + (isZero(y0) ? '' : plus(y0)) + ' = ' + N(C))
    ]);
    S.add('Формула', [row('', name + '(x) = ' + quadTex(A, B, C))]);
    return { a: A, b: B, c: C, points: used };
  }

  /* Вершину не прочитать — три точки графика и система. */
  var pool = others.slice();
  gridNodes(curve, win).forEach(function (n) {
    if (!pool.some(function (p) { return p.x === n.x; })) { pool.push({ x: n.x, y: n.y, marked: false }); }
  });
  var interceptPoint = pool.filter(function (p) { return p.x === 0; })[0] || null;
  var chosen = interceptPoint ? [interceptPoint] : [];
  pool.forEach(function (p) { if (chosen.length < 3 && chosen.indexOf(p) < 0) { chosen.push(p); } });
  if (chosen.length < 3) { throw new Error('solution-teacher: у параболы меньше трёх точек на рисунке'); }
  chosen.forEach(function (p) { used.push({ x: p.x, y: p.y }); });
  S.add('Точки с рисунка', [row('', chosen.map(pointName).join(',\\quad ')),
    row('Вершину с рисунка не прочитать — берём три точки графика.')]);
  var eqs = chosen.map(function (p) {
    return N(F(p.y)) + ' = ' + la + ' \\cdot ' + Pw(F(p.x)) + '^2 + ' + lb + ' \\cdot ' + P(F(p.x)) + ' + ' + lc;
  });
  S.add('Система', [row('Подставляем точки в общий вид:'),
    row('', '\\begin{cases} ' + eqs.join(' \\\\ ') + ' \\end{cases}')]);
  var A2; var B2; var C2;
  var pts = chosen.map(function (p) { return { x: F(p.x), y: F(p.y) }; });
  var solveRows;
  if (interceptPoint) {
    C2 = pts[0].y;
    var s1 = div(sub(pts[1].y, C2), pts[1].x);
    var s2 = div(sub(pts[2].y, C2), pts[2].x);
    A2 = div(sub(s1, s2), sub(pts[1].x, pts[2].x));
    B2 = sub(s1, mul(A2, pts[1].x));
    solveRows = [row('Из первого уравнения $' + lc + ' = ' + N(C2) + '$; два других делим на $x$:'),
      row('', '\\begin{cases} ' + N(pts[1].x) + la + ' + ' + lb + ' = ' + N(s1) + ' \\\\ ' +
        N(pts[2].x) + la + ' + ' + lb + ' = ' + N(s2) + ' \\end{cases}')];
  } else {
    var t1 = add(pts[1].x, pts[0].x); var r1 = div(sub(pts[1].y, pts[0].y), sub(pts[1].x, pts[0].x));
    var t2 = add(pts[2].x, pts[0].x); var r2 = div(sub(pts[2].y, pts[0].y), sub(pts[2].x, pts[0].x));
    A2 = div(sub(r1, r2), sub(t1, t2));
    B2 = sub(r1, mul(A2, t1));
    C2 = sub(sub(pts[0].y, mul(A2, mul(pts[0].x, pts[0].x))), mul(B2, pts[0].x));
    solveRows = [row('Вычитаем первое уравнение из второго и третьего, делим на разность абсцисс:'),
      row('', '\\begin{cases} ' + lineTexLetters(t1, la, lb) + ' = ' + N(r1) + ' \\\\ ' +
        lineTexLetters(t2, la, lb) + ' = ' + N(r2) + ' \\end{cases}')];
  }
  solveRows.push(row('', '\\Rightarrow\\; ' + la + ' = ' + N(A2) + ', \\quad ' + lb + ' = ' + N(B2) + ', \\quad ' + lc + ' = ' + N(C2)));
  S.add('Решаем систему', solveRows);
  S.add('Формула', [row('', name + '(x) = ' + quadTex(A2, B2, C2))]);
  return { a: A2, b: B2, c: C2, points: used };
}

function lineTexLetters(t, la, lb) {
  var coefPart = isInt(t) && t.p === 1 ? '' : isInt(t) && t.p === -1 ? '-' : N(t);
  return isZero(t) ? lb : coefPart + la + ' + ' + lb;
}

/** a(x − x₀)² + y₀ числами: 2(x + 1)^2 − 3. */
function vertexTex(a, x0, y0) {
  var shift = isZero(x0) ? 'x^2' : bracket(minus('x', x0), x0) + '^2';
  var head = isInt(a) && a.p === 1 ? '' : isInt(a) && a.p === -1 ? '-' : N(a);
  var tail = isZero(y0) ? '' : (y0.p > 0 ? ' + ' : ' - ') + N(abs(y0));
  return head + shift + tail;
}

/* ══════════════════════════════════════════════════════════
   Квадратное уравнение: стандартный вид, дискриминант и Виета
   ══════════════════════════════════════════════════════════ */

/**
 * Ax² + Bx + C = 0 приводится к целым взаимно простым коэффициентам
 * с A > 0. Возвращает строки преобразования и новые коэффициенты.
 */
function normalize(A, B, C) {
  var rows = [];
  var L = [A, B, C].reduce(function (acc, f) { return lcm(acc, f.q); }, 1);
  if (L > 1) {
    A = mul(A, frac(L)); B = mul(B, frac(L)); C = mul(C, frac(L));
    rows.push(row('Умножаем обе части на $' + L + '$:'), row('', quadTex(A, B, C) + ' = 0'));
  }
  var g = [A, B, C].reduce(function (acc, f) { return gcd(acc, f.p); }, 0);
  if (A.p < 0) { g = -g; }
  if (g !== 1 && g !== 0) {
    A = div(A, frac(g)); B = div(B, frac(g)); C = div(C, frac(g));
    rows.push(row('Делим обе части на $' + g + '$:'), row('', quadTex(A, B, C) + ' = 0'));
  }
  return { rows: rows, A: A, B: B, C: C };
}

function isqrt(n) {
  if (n < 0) { return null; }
  var r = Math.round(Math.sqrt(n));
  return r * r === n ? r : null;
}

/**
 * Корни по дискриминанту и проверка по Виету. known — корень, который
 * уже известен (абсцисса отмеченной точки), или null.
 */
function rootsRows(A, B, C, known, knownName) {
  var rows = [];
  var d = sub(mul(B, B), mul(frac(4), mul(A, C)));
  if (!isInt(d)) { throw new Error('solution-teacher: дискриминант не целый'); }
  var s = isqrt(d.p);
  if (s === null) { throw new Error('solution-teacher: дискриминант не полный квадрат'); }
  var fourAC = mul(frac(4), mul(A, C));
  rows.push(row('$A = ' + N(A) + ',\\; B = ' + N(B) + ',\\; C = ' + N(C) + '$'));
  rows.push(row('', 'D = ' + P(B) + '^2 - 4 \\cdot ' + P(A) + ' \\cdot ' + P(C) + ' = ' + N(mul(B, B)) +
    (fourAC.p >= 0 ? ' - ' + N(fourAC) : ' + ' + N(abs(fourAC))) + ' = ' + N(d) +
    (d.p > 0 ? ', \\quad \\sqrt{D} = ' + s : '')));
  var twoA = mul(frac(2), A);
  var x1 = div(sub(neg(B), frac(s)), twoA);
  var x2 = div(add(neg(B), frac(s)), twoA);
  var roots = s === 0 ? [x1] : (num(x1) < num(x2) ? [x1, x2] : [x2, x1]);
  if (s === 0) {
    rows.push(row('', 'x = \\dfrac{' + N(neg(B)) + '}{' + N(twoA) + '} = ' + N(x1)));
  } else {
    rows.push(row('', 'x_{1,2} = \\dfrac{' + N(neg(B)) + ' \\pm ' + s + '}{' + N(twoA) + '}' +
      ' \\;\\Rightarrow\\; x_1 = \\dfrac{' + N(sub(neg(B), frac(s))) + '}{' + N(twoA) + '} = ' + N(x1) +
      ', \\quad x_2 = \\dfrac{' + N(add(neg(B), frac(s))) + '}{' + N(twoA) + '} = ' + N(x2)));
  }
  /* Виета — другой способ: сумма и произведение корней. */
  var sum = div(neg(B), A);
  var prod = div(C, A);
  rows.push(row('Другой способ — теорема Виета:'));
  rows.push(row('', 'x_1 + x_2 = -\\dfrac{B}{A} = ' + N(sum) + ', \\quad x_1 x_2 = \\dfrac{C}{A} = ' + N(prod)));
  if (known) {
    rows.push(row('Один корень известен — абсцисса точки $' + knownName + '$: $x = ' + N(known) + '$, второй:'));
    rows.push(row('', 'x = ' + N(sum) + plus(neg(known)) + ' = ' + N(sub(sum, known))));
  } else if (roots.length === 2) {
    rows.push(row('', '\\Rightarrow\\; x_1 = ' + N(roots[0]) + ', \\; x_2 = ' + N(roots[1])));
  }
  return { rows: rows, roots: roots };
}

/* ══════════════════════════════════════════════════════════
   Блок «Точки пересечения»
   ══════════════════════════════════════════════════════════ */

/**
 * f и g — { tex, terms | value(x), name }. Уравнение f = g, его вид
 * Ax² + Bx + C = 0 (A, B, C — из коэффициентов), корни, выбор корня
 * и ордината с проверкой по второй функции.
 */
function crossSteps(S, opts) {
  S.start(BLOCK_X);
  S.add('Приравниваем', [row('', opts.equation)]);
  var A = opts.A; var B = opts.B; var C = opts.C;
  var std = (opts.prepare || []).slice();
  std.push(row('', quadTex(A, B, C) + ' = 0'));
  var roots;
  var known = opts.known;
  if (isZero(A)) {
    std.push(row('Слагаемые с $x^2$ сократились — уравнение линейное.'));
    S.add('Уравнение в стандартном виде', std);
    var xLin = div(neg(C), B);
    S.add('Корни', [row('', poly([{ c: B, v: 'x' }]) + ' = ' + N(neg(C)) + ' \\;\\Rightarrow\\; x = ' + N(xLin))]);
    roots = [xLin];
  } else {
    var nq = normalize(A, B, C);
    S.add('Уравнение в стандартном виде', std.concat(nq.rows));
    var r = rootsRows(nq.A, nq.B, nq.C, known, opts.knownName);
    S.add('Корни', r.rows);
    roots = r.roots;
  }
  var askedX = opts.askedX;
  if (known && roots.length === 2) {
    S.add('Выбор корня', [
      row('$x = ' + N(known) + '$ — абсцисса точки $' + opts.knownName + '$, она отмечена на рисунке.'),
      row('Значит, искомая точка $' + opts.askedName + '$ имеет абсциссу $x = ' + withDecimal(askedX) + '$' +
        (opts.where ? ' — ' + opts.where : '') + '.')
    ]);
  }
  var answerValue = askedX;
  if (opts.asksY) {
    var main = opts.ordinate[0]; var second = opts.ordinate[1];
    var y1 = main.at(askedX); var y2 = second.at(askedX);
    S.add('Ордината', [
      row('Подставляем $x = ' + N(askedX) + '$ в $' + main.name + '(x)$:'),
      row('', 'y = ' + fn(main.name, askedX) + ' = ' + y1.tex + (isInt(y1.value) ? '' : ' = ' + D(y1.value))),
      row('Проверка по $' + second.name + '(x)$:'),
      row('', fn(second.name, askedX) + ' = ' + y2.tex + ' \\;\\checkmark')
    ]);
    answerValue = y1.value;
  }
  return { roots: roots, answerValue: answerValue };
}

/* ══════════════════════════════════════════════════════════
   Задачи о прямой (12.A, 12.B, 12.C, 12.D, P12-*)
   ══════════════════════════════════════════════════════════ */

function optionByText(task, text) {
  var plainText = function (value) { return String(value).replace(/−/g, '-').replace(/\s+/g, ' ').trim(); };
  var found = (task.options || []).filter(function (option) { return plainText(option.text) === plainText(text); })[0];
  return found ? found.number : null;
}

function lineTask(task, rule) {
  var meta = task.meta;
  var S = new Steps();
  var check = { rule: rule, curves: [], points: [], triangles: [] };
  var lines = meta.lines || [];

  /* Две прямые. */
  if (lines.length === 2) {
    var found = lines.map(function (line, i) {
      var name = i === 0 ? 'f' : 'g';
      S.start(i === 0 ? BLOCK_F : BLOCK_G);
      var out = lineSteps(S, { name: name, p1: line.points[0], p2: line.points[1], source: 'marked', curve: i });
      check.curves.push({ kind: 'line', k: out.k, b: out.b, exact: { k: F(line.kFraction), b: F(line.bFraction) } });
      check.triangles.push({ curve: i, triangle: out.triangle });
      check.points.push({ curve: i, x: line.points[0].x, y: line.points[0].y }, { curve: i, x: line.points[1].x, y: line.points[1].y });
      return out;
    });
    var f = found[0]; var g = found[1];
    S.start(BLOCK_X);
    S.add('Приравниваем', [row('', lineTex(f.k, f.b) + ' = ' + lineTex(g.k, g.b))]);
    var K = sub(f.k, g.k); var Bv = sub(g.b, f.b);
    var x = div(Bv, K);
    var y = add(mul(f.k, x), f.b);
    var solveRows = [
      row('Слагаемые с $x$ — влево, числа — вправо:'),
      row('', poly([{ c: f.k, v: 'x' }, { c: neg(g.k), v: 'x' }]) + ' = ' + poly([{ c: g.b }, { c: neg(f.b) }]) +
        ' \\;\\Rightarrow\\; ' + poly([{ c: K, v: 'x' }]) + ' = ' + N(Bv))
    ];
    if (!(isInt(K) && K.p === 1)) {
      solveRows.push(row('', 'x = ' + N(Bv) + ' : ' + P(K) + ' = ' + withDecimal(x)));
    }
    solveRows.push(row('Прямые пересекаются в одной точке $' + pt(x, y) + '$' +
      (meta.intersection && meta.intersection.inside === false ? ' — за пределами рисунка.' : '.')));
    S.add('Решаем уравнение', solveRows);
    var answerValue = x;
    if (rule === 'intersection-y') {
      var y1 = substitute(lineTerms(f.k, f.b), x);
      var y2 = substitute(lineTerms(g.k, g.b), x);
      S.add('Ордината', [
        row('Подставляем $x = ' + N(x) + '$ в $f(x)$:'),
        row('', 'y = ' + fn('f', x) + ' = ' + y1.tex + (isInt(y1.value) ? '' : ' = ' + D(y1.value))),
        row('Проверка по $g(x)$:'),
        row('', fn('g', x) + ' = ' + y2.tex + ' \\;\\checkmark')
      ]);
      answerValue = y1.value;
    }
    check.roots = [x];
    check.answerValue = answerValue;
    return { steps: S.done(), check: check };
  }

  /* Одна прямая. */
  var line = lines[0] || { kFraction: meta.kFraction, bFraction: meta.bFraction, points: meta.points };
  var k; var b;
  var pts = line.points || [];
  if (pts.length >= 2 && meta.window) {
    var out1 = lineSteps(S, { name: 'f', p1: pts[0], p2: pts[1], source: 'marked', curve: 0 });
    k = out1.k; b = out1.b;
    check.triangles.push({ curve: 0, triangle: out1.triangle });
    check.points.push({ curve: 0, x: pts[0].x, y: pts[0].y }, { curve: 0, x: pts[1].x, y: pts[1].y });
  } else {
    k = F(meta.kFraction); b = F(meta.bFraction);
    S.add('Формула дана в условии', [row('', 'f(x) = ' + lineTex(k, b) + ', \\quad k = ' + N(k) + ', \\quad b = ' + N(b))]);
  }
  check.curves.push({ kind: 'line', k: k, b: b, exact: { k: F(line.kFraction || meta.kFraction), b: F(line.bFraction || meta.bFraction) } });

  if (rule === 'k') {
    check.answerValue = k;
  } else if (rule === 'b') {
    check.answerValue = b;
  } else if (rule === 'value-at') {
    var x0 = F(meta.query.x0);
    var s0 = substitute(lineTerms(k, b), x0);
    S.add('Находим f(' + plainNumber(x0) + ')', [convertRow(x0),
      row('', fn('f', x0) + ' = ' + s0.tex + (isInt(s0.value) ? '' : ' = ' + D(s0.value)))]);
    check.answerValue = s0.value;
  } else if (rule === 'argument-for') {
    var y0 = F(meta.query.y0);
    var right = sub(y0, b);
    var xr = div(right, k);
    var unitK = isInt(k) && k.p === 1;
    S.add('Решаем уравнение f(x) = ' + plainNumber(y0), [convertRow(y0),
      row('', lineTex(k, b) + ' = ' + N(y0) + ' \\;\\Rightarrow\\; ' + poly([{ c: k, v: 'x' }]) + ' = ' + N(y0) + plus(neg(b)) +
        ' = ' + (unitK ? withDecimal(right) : N(right))),
      unitK ? null : row('', 'x = ' + N(right) + ' : ' + P(k) + ' = ' + withDecimal(xr))]);
    check.answerValue = xr;
  } else if (rule === 'point-choice') {
    var probe = meta.probe;
    var px = F(probe.x); var py = F(probe.y);
    var sp = substitute(lineTerms(k, b), px);
    var on = eq(sp.value, py);
    var probeY = isInt(py) || !decimalFriendly(py) ? N(py) : D(py) + ' = ' + N(py);
    var probeName = (meta.pointName || 'A');
    S.add('Проверяем точку ' + probeName + '(' + plainNumber(px) + '; ' + plainNumber(py) + ')', [convertRow(px),
      row('Подставляем $x = ' + N(px) + '$:'),
      row('', fn('f', px) + ' = ' + sp.tex),
      row(on ? 'Совпадает с ординатой точки $' + probeY + '$ $\\Rightarrow$ точка принадлежит графику.'
        : 'Не равно ординате точки $' + probeY + '$ $\\Rightarrow$ точка графику не принадлежит.')]);
    check.answerOption = optionByText(task, on ? 'Да' : 'Нет');
  } else if (rule === 'equation-choice') {
    var number = optionByText(task, lineEquationText(num(k), num(b)));
    S.add('Выбираем вариант', [row('Формула $y = ' + lineTex(k, b) + '$ — вариант ' + number + '.')]);
    check.answerOption = number;
  } else {
    throw new Error('solution-teacher: правило «' + rule + '» не поддержано');
  }
  return { steps: S.done(), check: check };
}

/* ══════════════════════════════════════════════════════════
   Задачи о параболе (12Q.*, P12Q-*)
   ══════════════════════════════════════════════════════════ */

/* Узлы сетки на прямой внутри окна. */
function lineGridNodes(line, win) { return Line.integerPoints(Line.create(line.k, line.b), win); }

function rootFactor(r) {
  if (isZero(r)) { return 'x'; }
  return bracket(minus('x', r), r);
}

function pickRoot(roots, pick) {
  var lo = roots[0]; var hi = roots[roots.length - 1];
  if (pick === 'smaller') { return lo; }
  if (pick === 'positive') { return num(lo) > 0 ? lo : hi; }
  if (pick === 'negative') { return num(lo) < 0 ? lo : hi; }
  return hi;
}

/**
 * Пара точек прямой g для треугольника: первая, у которой подписи на
 * чертеже легли чисто. Сначала — отмеченная точка пересечения и узел на
 * оси Oy (тогда свободный член читается сразу), потом она же и узел в
 * двух–четырёх клетках, потом шире, в конце — два других узла: у точки
 * пересечения рядом вторая кривая, и треугольник с вершиной в ней бывает
 * зажат. Треугольник в одну клетку тесен — его подписи ложатся на кривые.
 */
function linePair(task, nodes, anchor, curveIndex) {
  var span = function (p, q) { return Math.abs(p.x - q.x); };
  var others = nodes.filter(function (n) { return n.x !== anchor.x; });
  var pairs = [];
  var zero = others.filter(function (n) { return n.x === 0 && span(n, anchor) >= 2; })[0];
  if (zero) { pairs.push([anchor, zero]); }
  others.filter(function (n) { return n !== zero && span(n, anchor) >= 2 && span(n, anchor) <= 4; })
    .sort(function (p, q) { return Math.abs(span(p, anchor) - 3) - Math.abs(span(q, anchor) - 3); })
    .forEach(function (n) { pairs.push([anchor, n]); });
  others.filter(function (n) { return span(n, anchor) > 4; })
    .sort(function (p, q) { return span(p, anchor) - span(q, anchor); })
    .forEach(function (n) { pairs.push([anchor, n]); });
  others.forEach(function (p, i) {
    others.slice(i + 1).forEach(function (q) {
      if (span(p, q) >= 2 && span(p, q) <= 4) { pairs.push([p, q]); }
    });
  });
  others.filter(function (n) { return span(n, anchor) < 2; }).forEach(function (n) { pairs.push([anchor, n]); });
  var best = null;
  var fewest = Infinity;
  for (var i = 0; i < pairs.length; i += 1) {
    var issues;
    try {
      issues = SlopeFigure.layoutProblems(task, [{ triangle: Slope.build(pairs[i][0], pairs[i][1]), curve: curveIndex }]).length;
    } catch { issues = Infinity; }
    if (issues < fewest) { fewest = issues; best = pairs[i]; }
    if (issues === 0) { break; }
  }
  if (!best) { throw new Error('solution-teacher: у прямой нет двух узлов сетки'); }
  return best;
}

function quadraticTask(task, rule) {
  var meta = task.meta;
  var S = new Steps();
  var check = { rule: rule, curves: [], points: [], triangles: [] };
  var curve = Q.exact(meta.aFraction, meta.bFraction, meta.cFraction);
  var win = meta.window;
  var marks = meta.points || [];

  if (rule === 'sign-a') {
    var up = curve.aValue > 0;
    S.add('Направление ветвей', [row('Ветви направлены ' + (up ? 'вверх' : 'вниз') + ' $\\Rightarrow$ $a ' + (up ? '>' : '<') + ' 0$')]);
    check.answerOption = optionByText(task, up ? 'a > 0' : 'a < 0');
    return { steps: S.done(), check: check };
  }

  var two = meta.curves && meta.curves[1];
  var intercept = marks.filter(function (p) { return p.role === 'intercept'; })[0];
  if (rule === 'c' && intercept) {
    S.add('Общий вид', [row('', 'f(x) = ax^2 + bx + c')]);
    S.add('Точка на оси Oy', [row('При $x = 0$: $f(0) = c$ — ордината точки на оси $Oy$.'),
      row('$' + pt(intercept.x, intercept.y) + '$ отмечена на рисунке $\\Rightarrow$ $c = ' + N(F(intercept.y)) + '$')]);
    check.curves.push({ kind: 'quadratic', c: F(intercept.y), exact: { c: curve.c }, partial: true });
    check.points.push({ curve: 0, x: intercept.x, y: intercept.y });
    check.answerValue = F(intercept.y);
    return { steps: S.done(), check: check };
  }

  /* Отмеченная точка пересечения — A: так её зовут и в решении, и на чертеже. */
  var crossMarks = marks.filter(function (p) { return p.role === 'cross'; })
    .map(function (p) { return { x: p.x, y: p.y, role: 'cross', label: 'A' }; });
  var ownMarks = marks.filter(function (p) { return p.role !== 'cross'; });
  if (two) { S.start(BLOCK_F); }
  var fFound = parabolaSteps(S, 'f', { a: 'a', b: 'b', c: 'c' }, curve, win, ownMarks.concat(crossMarks), meta.knownA,
    rule === 'a' && !two);
  check.curves.push({ kind: 'quadratic', a: fFound.a, b: fFound.b, c: fFound.c, partial: !!fFound.partial,
    exact: { a: curve.a, b: curve.b, c: curve.c } });
  fFound.points.forEach(function (p) { check.points.push({ curve: 0, x: p.x, y: p.y }); });
  var fTerms = quadTerms(fFound.a, fFound.b, fFound.c);

  if (!two) {
    if (rule === 'a') { check.answerValue = fFound.a; return { steps: S.done(), check: check }; }
    if (rule === 'b') { check.answerValue = fFound.b; return { steps: S.done(), check: check }; }
    if (rule === 'c') { check.answerValue = fFound.c; return { steps: S.done(), check: check }; }
    if (rule === 'value-at') {
      var x0 = F(meta.query.x0);
      var sv = substitute(fTerms, x0);
      S.add('Находим f(' + plainNumber(x0) + ')', [convertRow(x0),
        row('', fn('f', x0) + ' = ' + sv.tex + (isInt(sv.value) ? '' : ' = ' + D(sv.value)))]);
      check.answerValue = sv.value;
      return { steps: S.done(), check: check };
    }
    if (rule === 'argument-for') {
      var y0 = F(meta.query.y0);
      var C0 = sub(fFound.c, y0);
      var nz = normalize(fFound.a, fFound.b, C0);
      S.add('Уравнение f(x) = ' + plainNumber(y0), [convertRow(y0),
        row('', quadTex(fFound.a, fFound.b, fFound.c) + ' = ' + N(y0) + ' \\;\\Rightarrow\\; ' + quadTex(fFound.a, fFound.b, C0) + ' = 0')]
        .concat(nz.rows));
      var sol = rootsRows(nz.A, nz.B, nz.C, null);
      S.add('Корни', sol.rows);
      var pickText = { larger: 'больший', smaller: 'меньший', positive: 'положительный', negative: 'отрицательный' };
      var picked = pickRoot(sol.roots, meta.query.pick);
      S.add('Выбор корня', [row('Спрашивают ' + (pickText[meta.query.pick] || 'нужный') + ' корень $\\Rightarrow$ $x = ' + withDecimal(picked) + '$')]);
      check.roots = sol.roots;
      check.rootsCheck = sol.roots.map(function (r) { return { x: r, f: Q.yAt(curve, r), g: y0 }; });
      check.answerValue = picked;
      return { steps: S.done(), check: check };
    }
    if (rule === 'equation-choice') {
      var derived = Q.exact(fFound.a, fFound.b, fFound.c);
      var form = meta.form || 'general';
      var rowsChoice = [];
      if (form === 'vertex') {
        rowsChoice.push(row('Запись через вершину:'), row('', 'y = ' + vertexTex(derived.a, derived.m, derived.n)));
      } else if (form === 'roots') {
        var zeros = Q.rootsOf(derived);
        rowsChoice.push(row('Нули: $x = ' + N(zeros[0]) + '$ и $x = ' + N(zeros[1]) + '$. Запись через нули:'),
          row('', 'y = ' + (isInt(derived.a) && Math.abs(derived.a.p) === 1 ? (derived.a.p < 0 ? '-' : '') : N(derived.a)) +
            rootFactor(zeros[0]) + rootFactor(zeros[1])));
      }
      var numberQ = optionByText(task, Q.equationText(derived, form));
      rowsChoice.push(row('Этой формуле соответствует вариант ' + numberQ + '.'));
      S.add('Выбираем вариант', rowsChoice);
      check.answerOption = numberQ;
      return { steps: S.done(), check: check };
    }
    throw new Error('solution-teacher: правило «' + rule + '» не поддержано');
  }

  /* Две функции: парабола и прямая или две параболы. */
  var cross = crossMarks[0] || null;
  var g;
  S.start(BLOCK_G);
  if (two.kind === 'line') {
    var lineExact = { k: F(two.kFraction), b: F(two.bFraction) };
    var nodes = lineGridNodes(lineExact, win);
    var anchor = cross ? nodes.filter(function (n) { return n.x === cross.x; })[0] || cross : nodes[0];
    var pair = linePair(task, nodes, anchor, 1).map(function (p) {
      return cross && p.x === cross.x ? { x: p.x, y: p.y, label: 'A' } : { x: p.x, y: p.y };
    });
    var gl = lineSteps(S, { name: 'g', bLetter: 'm', p1: pair[0], p2: pair[1], source: 'grid', curve: 1,
      notes: { A: 'отмеченная точка пересечения' } });
    /* Буква b занята коэффициентом параболы — сказано в общем виде прямой. */
    S.list.filter(function (item) { return item.block === BLOCK_G && item.title === 'Общий вид'; })[0].rows
      .push(row('Буква $b$ занята параболой, свободный член прямой — $m$.'));
    g = { tex: lineTex(gl.k, gl.b), A: ZERO, B: gl.k, C: gl.b, terms: lineTerms(gl.k, gl.b) };
    check.curves.push({ kind: 'line', k: gl.k, b: gl.b, exact: lineExact });
    check.triangles.push({ curve: 1, triangle: gl.triangle });
    check.points.push({ curve: 1, x: pair[0].x, y: pair[0].y }, { curve: 1, x: pair[1].x, y: pair[1].y });
  } else {
    var gCurve = Q.exact(two.aFraction, two.bFraction, two.cFraction);
    var gMarks = (two.points || []).map(function (p) { return { x: p.x, y: p.y, role: p.role }; }).concat(crossMarks);
    var gq = parabolaSteps(S, 'g', { a: 'a_2', b: 'b_2', c: 'c_2' }, gCurve, win, gMarks, false);
    g = { tex: quadTex(gq.a, gq.b, gq.c), A: gq.a, B: gq.b, C: gq.c, terms: quadTerms(gq.a, gq.b, gq.c) };
    check.curves.push({ kind: 'quadratic', a: gq.a, b: gq.b, c: gq.c, exact: { a: gCurve.a, b: gCurve.b, c: gCurve.c } });
    gq.points.forEach(function (p) { check.points.push({ curve: 1, x: p.x, y: p.y }); });
  }

  var fTex = quadTex(fFound.a, fFound.b, fFound.c);
  var asked = meta.intersection.asked;
  var result = crossSteps(S, {
    equation: fTex + ' = ' + g.tex,
    prepare: [row('Переносим всё в левую часть:'), row('', fTex + ' - ' + grouped(g.tex) + ' = 0'), row('Приводим подобные:')],
    A: sub(fFound.a, g.A), B: sub(fFound.b, g.B), C: sub(fFound.c, g.C),
    known: cross ? F(cross.x) : null, knownName: 'A' + (cross ? pt(cross.x, cross.y) : ''),
    askedName: 'B', askedX: F(asked.x),
    where: meta.intersection.hidden === 'fraction' ? 'она не в узле сетки, с рисунка её не прочитать' : 'она за пределами рисунка',
    asksY: rule === 'intersection-y',
    /* Ордината — по прямой, если она есть: там считать проще. */
    ordinate: two.kind === 'line'
      ? [{ name: 'g', at: function (x) { return substitute(g.terms, x); } }, { name: 'f', at: function (x) { return substitute(fTerms, x); } }]
      : [{ name: 'f', at: function (x) { return substitute(fTerms, x); } }, { name: 'g', at: function (x) { return substitute(g.terms, x); } }]
  });
  check.roots = result.roots;
  check.answerValue = result.answerValue;
  return { steps: S.done(), check: check };
}

/* ══════════════════════════════════════════════════════════
   Задачи о гиперболе (12R.*, P12R-*)
   ══════════════════════════════════════════════════════════ */

function fracOf(o) { return o ? frac(o.p, o.q) : null; }

/* Шаблоны записи условия. */
var R_FORM = {
  basic: 'f(x) = \\dfrac{k}{x}',
  line: 'f(x) = \\dfrac{k}{x}',
  'shift-y': 'f(x) = \\dfrac{k}{x} + a',
  'shift-x': 'f(x) = \\dfrac{k}{x + a}',
  'shift-xy': 'f(x) = \\dfrac{k}{x + a} + b',
  linear: 'f(x) = \\dfrac{kx + a}{x + b}'
};

/** Формула гиперболы числами в записи условия. */
function rationalTex(form, co) {
  var tail = function (f) { return isZero(f) ? '' : plus(f); };
  if (form === 'basic' || form === 'line') { return 'f(x) = \\dfrac{' + N(co.k) + '}{x}'; }
  if (form === 'shift-y') { return 'f(x) = \\dfrac{' + N(co.k) + '}{x}' + tail(co.a); }
  if (form === 'shift-x') { return 'f(x) = \\dfrac{' + N(co.k) + '}{' + minus('x', neg(co.a)) + '}'; }
  if (form === 'shift-xy') { return 'f(x) = \\dfrac{' + N(co.k) + '}{' + minus('x', neg(co.a)) + '}' + tail(co.b); }
  return 'f(x) = \\dfrac{' + poly([{ c: co.k, v: 'x' }, { c: co.a }]) + '}{' + minus('x', neg(co.b)) + '}';
}

/** Значение гиперболы в точке: m/(x − s) + t. */
function rationalAt(c, x) { return add(div(c.m, sub(x, c.s)), c.t); }

/** Подстановка x в формулу гиперболы — строкой. */
function rationalSubstitute(form, co, c, x) {
  var value = rationalAt(c, x);
  var X = P(x);
  var expr;
  if (form === 'basic' || form === 'line') { expr = '\\dfrac{' + N(co.k) + '}{' + N(x) + '}'; }
  else if (form === 'shift-y') { expr = '\\dfrac{' + N(co.k) + '}{' + N(x) + '}' + (isZero(co.a) ? '' : plus(co.a)); }
  else if (form === 'shift-x') { expr = '\\dfrac{' + N(co.k) + '}{' + N(x) + plus(co.a) + '}'; }
  else if (form === 'shift-xy') { expr = '\\dfrac{' + N(co.k) + '}{' + N(x) + plus(co.a) + '}' + (isZero(co.b) ? '' : plus(co.b)); }
  else { expr = '\\dfrac{' + N(co.k) + ' \\cdot ' + X + plus(co.a) + '}{' + N(x) + plus(co.b) + '}'; }
  return { tex: expr + ' = ' + N(value), value: value };
}

/**
 * Пункты гиперболы: «Общий вид», «Асимптоты», «Сдвиги», «Находим k»
 * (у (kx + a)/(x + b) — «Находим a»), «Формула».
 */
function hyperbolaSteps(S, task, c, form) {
  var meta = task.meta;
  var co = R.coefficients(c, form);
  S.add('Общий вид', [row('', R_FORM[form])]);
  S.add('Асимптоты', [row('Вертикальная: $x = ' + N(c.s) + '$, горизонтальная: $y = ' + N(c.t) + '$.')]);

  var shiftRows = [];
  if (form === 'basic' || form === 'line') {
    shiftRows.push(row('Асимптоты — оси координат $\\Rightarrow$ сдвигов нет.'));
  }
  if (form === 'shift-x' || form === 'shift-xy') {
    shiftRows.push(row('Знаменатель $x + a$ равен нулю при $x = -a$:'));
    shiftRows.push(row('', '-a = ' + N(c.s) + ' \\;\\Rightarrow\\; a = ' + N(co.a)));
    shiftRows.push(row('Внимание на знак: график сдвинут ' + (num(c.s) > 0 ? 'вправо' : 'влево') + ', а в знаменателе $' +
      minus('x', c.s) + '$.'));
  }
  if (form === 'shift-y') {
    shiftRows.push(row('Слагаемое $a$ сдвигает график вместе с асимптотой:'), row('', 'a = ' + N(c.t)));
  }
  if (form === 'shift-xy') {
    shiftRows.push(row('Слагаемое $b$ сдвигает график по вертикали:'), row('', 'b = ' + N(c.t)));
  }
  if (form === 'basic' && !isZero(c.s)) { shiftRows = []; }
  if (form === 'linear') {
    shiftRows.push(row('Знаменатель $x + b$ равен нулю при $x = -b$:'));
    shiftRows.push(row('', '-b = ' + N(c.s) + ' \\;\\Rightarrow\\; b = ' + N(co.b)));
    shiftRows.push(row('Внимание на знак: асимптота $x = ' + N(c.s) + '$, а в знаменателе $' + minus('x', c.s) + '$.'));
    shiftRows.push(row('Целая часть: $\\dfrac{kx + a}{x + b} = k + \\dfrac{a - kb}{x + b}$ $\\Rightarrow$ горизонтальная асимптота $y = k$:'));
    shiftRows.push(row('', 'k = ' + N(c.t)));
  }
  S.add('Сдвиги', shiftRows);

  var marks = (meta.points || []).filter(function (p) { return p.role === 'mark' || p.role === 'cross'; });
  var P0 = marks[0];
  var X = F(P0.x); var Y = F(P0.y);
  var label = P0.label ? P0.label : '';
  var kRows = [row('Подставляем $' + label + pt(P0.x, P0.y) + '$' + (P0.role === 'cross' ? ' — точку пересечения графиков:' : ' (отмечена на рисунке):'))];
  if (form === 'basic' || form === 'line') {
    kRows.push(row('', N(Y) + ' = \\dfrac{k}{' + N(X) + '} \\;\\Rightarrow\\; k = ' + P(X) + ' \\cdot ' + P(Y) + ' = ' + N(co.k)));
  } else if (form === 'shift-y') {
    kRows.push(row('', N(Y) + ' = \\dfrac{k}{' + N(X) + '}' + plus(co.a) + ' \\;\\Rightarrow\\; k = (' + N(Y) + plus(neg(co.a)) +
      ') \\cdot ' + P(X) + ' = ' + N(co.k)));
  } else if (form === 'shift-x') {
    kRows.push(row('', N(Y) + ' = \\dfrac{k}{' + N(X) + plus(co.a) + '} \\;\\Rightarrow\\; k = ' + P(Y) + ' \\cdot (' + N(X) +
      plus(co.a) + ') = ' + N(co.k)));
  } else if (form === 'shift-xy') {
    kRows.push(row('', N(Y) + ' = \\dfrac{k}{' + N(X) + plus(co.a) + '}' + plus(co.b) + ' \\;\\Rightarrow\\; k = (' + N(Y) +
      plus(neg(co.b)) + ') \\cdot (' + N(X) + plus(co.a) + ') = ' + N(co.k)));
  } else {
    kRows.push(row('', N(Y) + ' = \\dfrac{' + N(co.k) + ' \\cdot ' + P(X) + ' + a}{' + N(X) + plus(co.b) + '} \\;\\Rightarrow\\; a = ' +
      P(Y) + ' \\cdot (' + N(X) + plus(co.b) + ')' + plus(neg(mul(co.k, X))) + ' = ' + N(co.a)));
  }
  S.add(form === 'linear' ? 'Находим a' : 'Находим k', kRows);
  S.add('Формула', [row('', rationalTex(form, co))]);
  return { co: co, point: P0 };
}

function rationalTask(task, rule) {
  var meta = task.meta;
  var S = new Steps();
  var check = { rule: rule, curves: [], points: [], triangles: [] };
  var c = R.curve(fracOf(meta.m), fracOf(meta.s), fracOf(meta.t));
  var form = meta.form;
  var exactCurve = { m: c.m, s: c.s, t: c.t };
  /* m из отмеченной точки — как в пункте «Находим k»: m = (y − t)(x − s). */
  var fromPoint = function (found) {
    var p0 = found.point;
    return { kind: 'rational', m: mul(sub(F(p0.y), c.t), sub(F(p0.x), c.s)), s: c.s, t: c.t, exact: exactCurve };
  };

  if (form === 'line') {
    var A = meta.points.filter(function (p) { return p.role === 'cross'; })[0];
    var Pl = meta.points.filter(function (p) { return p.role === 'line'; })[0];
    var line = { k: fracOf(meta.line.k), b: fracOf(meta.line.b) };
    var lineOnly = rule === 'line-a' || rule === 'line-b';
    var gl;
    if (!lineOnly) {
      S.start(BLOCK_F);
      check.curves.push(fromPoint(hyperbolaSteps(S, task, c, form)));
      check.points.push({ curve: 0, x: A.x, y: A.y });
      S.start(BLOCK_G);
    }
    /* Треугольник — по отмеченным A и второй точке прямой. */
    var p1 = { x: A.x, y: A.y, label: A.label || 'A' };
    var p2 = { x: Pl.x, y: Pl.y };
    var source = 'marked';
    /* Прямая на чертеже — вторая кривая (её цвет), даже когда спрашивают
       только про неё. */
    gl = lineSteps(S, { name: 'g', kLetter: 'a', p1: p1, p2: p2,
      source: source, curve: 1, notes: { A: 'точка пересечения графиков' } });
    check.curves.push({ kind: 'line', k: gl.k, b: gl.b, exact: { k: line.k, b: line.b } });
    check.triangles.push({ curve: lineOnly ? 0 : 1, triangle: gl.triangle, lineIndex: lineOnly ? 0 : 1 });
    check.points.push({ curve: lineOnly ? 0 : 1, x: p1.x, y: p1.y }, { curve: lineOnly ? 0 : 1, x: p2.x, y: p2.y });
    if (lineOnly) {
      check.answerValue = rule === 'line-a' ? gl.k : gl.b;
      return { steps: S.done(), check: check };
    }
    var k = c.m;
    var result = crossSteps(S, {
      equation: '\\dfrac{' + N(k) + '}{x} = ' + lineTex(gl.k, gl.b),
      prepare: [row('Умножаем на $x \\ne 0$ и переносим всё в левую часть:')],
      A: gl.k, B: gl.b, C: neg(k),
      known: F(A.x), knownName: 'A' + pt(A.x, A.y),
      askedName: 'B', askedX: fracOf(meta.intersection.B.x),
      where: 'она за пределами рисунка',
      asksY: meta.intersection.axis === 'y',
      ordinate: [
        { name: 'f', at: function (x) { return rationalSubstitute(form, { k: k }, c, x); } },
        { name: 'g', at: function (x) { return substitute(lineTerms(gl.k, gl.b), x); } }
      ]
    });
    check.roots = result.roots;
    check.answerValue = result.answerValue;
    return { steps: S.done(), check: check };
  }

  var found = hyperbolaSteps(S, task, c, form);
  var co = found.co;
  check.curves.push(fromPoint(found));
  (meta.points || []).forEach(function (p) { check.points.push({ curve: 0, x: p.x, y: p.y }); });
  if (rule === 'value-at') {
    var x0 = fracOf(meta.query.x0);
    var sv = rationalSubstitute(form, co, c, x0);
    S.add('Находим f(' + plainNumber(x0) + ')', [row('', fn('f', x0) + ' = ' + sv.tex)]);
    check.answerValue = sv.value;
  } else if (rule === 'argument-for') {
    var y0 = fracOf(meta.query.y0);
    var d = sub(y0, c.t);
    var shifted = div(c.m, d);
    var x = add(shifted, c.s);
    var den = minus('x', c.s);
    var rows = [row('', rationalTex(form, co).replace('f(x) = ', '') + ' = ' + N(y0))];
    if (!isZero(c.t)) {
      rows.push(row('Переносим $' + N(c.t) + '$ вправо:'), row('', '\\dfrac{' + N(c.m) + '}{' + den + '} = ' + N(y0) + plus(neg(c.t)) + ' = ' + N(d)));
    }
    var quotient = '\\dfrac{' + N(c.m) + '}{' + N(d) + '}';
    var chain = [quotient];
    if (N(shifted) !== quotient) { chain.push(N(shifted)); }
    if (isZero(c.s) && !isInt(shifted) && decimalFriendly(shifted)) { chain.push(D(shifted)); }
    rows.push(row('', den + ' = ' + chain.join(' = ') +
      (isZero(c.s) ? '' : ' \\;\\Rightarrow\\; x = ' + N(shifted) + plus(c.s) + ' = ' + withDecimal(x))));
    S.add('Решаем уравнение f(x) = ' + plainNumber(y0), rows);
    check.rootsCheck = [{ x: x, f: rationalAt(c, x), g: y0 }];
    check.answerValue = x;
  } else if (rule === 'coef-sum') {
    var total = add(add(co.k, co.a), co.b);
    S.add('Сумма коэффициентов', [row('', 'k + a + b = ' + N(co.k) + plus(co.a) + plus(co.b) + ' = ' + N(total))]);
    check.answerValue = total;
  } else if (rule === 'coef-k' || rule === 'coef-a' || rule === 'coef-b') {
    check.answerValue = co[rule.slice(5)];
  } else {
    throw new Error('solution-teacher: правило «' + rule + '» не поддержано');
  }
  return { steps: S.done(), check: check };
}

/* ══════════════════════════════════════════════════════════
   Вход
   ══════════════════════════════════════════════════════════ */

/**
 * Решение задачи для листа учителя и разбора опорной задачи.
 * task — { meta, answer, options, answerRule }: то, что собрал движок,
 * и правило ответа из данных набора.
 *
 * Возвращает { steps: [{ block, no, title, rows, slope? }], check }.
 */
function build(task) {
  var rule = task.answerRule || (task.meta && task.meta.rule);
  if (!rule) { throw new Error('solution-teacher: у задачи нет правила ответа'); }
  var family = task.meta && task.meta.family;
  if (family === 'quadratic') { return quadraticTask(task, rule); }
  if (family === 'rational') { return rationalTask(task, rule); }
  return lineTask(task, rule);
}

/* ══════════════════════════════════════════════════════════
   Чертёж к решению
   ══════════════════════════════════════════════════════════ */

/**
 * Чертёж к решению для листа учителя: чертёж условия и поверх —
 * треугольники наклона, по которым найдены угловые коэффициенты
 * (graph/slope-figure.js). У горизонтальной прямой треугольника нет —
 * чертёж условия как есть. Нет прямой с рисунка — null.
 *
 * options.triangles: false — без треугольников (для сверки с условием).
 */
function figure(task, solved, options) {
  var all = (solved && solved.check.triangles) || [];
  if (options && options.triangles === false) { return SlopeFigure.render(task, []); }
  if (!all.length) { return null; }
  /* У гиперболы прямая на чертеже всегда вторая — треугольник её цвета. */
  var rational = task.meta && task.meta.family === 'rational';
  return SlopeFigure.render(task, all.filter(function (item) { return !item.triangle.flat; }).map(function (item) {
    return rational ? { triangle: item.triangle, curve: 1 } : item;
  }));
}

var api = { build: build, figure: figure };

export default api;
export { build, figure };
