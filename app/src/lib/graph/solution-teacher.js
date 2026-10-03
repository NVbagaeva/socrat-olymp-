/* graph/solution-teacher.js — полное решение для листа ответов учителя.

   Разбор для ученика (solution.js, solution-quadratic.js) объясняет
   и ведёт за руку; лист учителя нужен для другого — проверить работу
   ученика на каждом шаге. Поэтому здесь нет пояснений «почему», зато
   есть все выкладки по порядку:

     1. f(x): точки с рисунка, подстановка, коэффициенты, формула;
     2. то же для g(x), если функций две;
     3. f(x) = g(x) с подставленными коэффициентами;
     4. приведение к стандартному виду;
     5. решение: дискриминант и оба корня, рядом — проверка по Виету;
     6. выбор корня с пояснением;
     7. ордината, если спрашивают её;
     8. ответ.

   Всё строится из параметров задачи (task.meta): точных дробей
   коэффициентов, отмеченных точек и окна чертежа. Шаблонных чисел нет.
   Нецелые числа пишутся обыкновенной дробью; ответ — как в ключе.

   Модуль отдаёт структуру, а не разметку:
     { steps: [{ title, rows: [{ text, tex }] }], check }
   text — строка, где формулы внутри стоят между знаками $…$;
   tex  — отдельная формула строки. check — что посчитано, для
   автопроверки (scripts/check-teacher-solutions.mjs).
*/

import Line from './families/line.js';
import Q from './families/quadratic.js';
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

/** Число так, как оно записано в условии: 13,5 — десятичной, 1/3 — дробью. */
function given(f) { return isInt(f) || !decimalFriendly(f) ? N(f) : D(f); }

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
   Строки решения
   ══════════════════════════════════════════════════════════ */

function row(textValue, texValue) {
  var out = {};
  if (textValue) { out.text = textValue; }
  if (texValue) { out.tex = texValue; }
  return out;
}

/* ══════════════════════════════════════════════════════════
   Прямая по двум точкам
   ══════════════════════════════════════════════════════════ */

/**
 * name — f или g, letter — буква свободного члена (b, а если она
 * занята коэффициентом параболы, — m). Возвращает строки и найденные k, b.
 */
function lineFromPoints(name, letter, p1, p2, given, slopeLetter) {
  var rows = [];
  var x1 = F(p1.x); var y1 = F(p1.y); var x2 = F(p2.x);
  /* Точки называются слева направо — так же, как в треугольнике. */
  var left = p1.x < p2.x ? p1 : p2;
  var right = p1.x < p2.x ? p2 : p1;
  rows.push(row('Общий вид: $' + name + '(x) = kx + ' + letter + '$. С рисунка берём точки $' +
    pt(left.x, left.y) + '$ и $' + pt(right.x, right.y) + '$' + (given ? ' (отмечены на рисунке).' : ' (узлы сетки на прямой).')));
  /* k — через треугольник наклона и тангенс угла (graph/slope.js). */
  var triangle = Slope.build(p1, p2);
  var k = triangle.k;
  Slope.teacherRows(triangle, slopeLetter || 'k').forEach(function (item) { rows.push(row(item.text, item.tex)); });

  var b;
  var onAxis = isZero(x1) ? p1 : isZero(x2) ? p2 : null;
  if (onAxis) {
    b = F(onAxis.y);
    rows.push(row('Точка $' + pt(onAxis.x, onAxis.y) + '$ лежит на оси $Oy$, значит, $' +
      letter + ' = ' + N(b) + '$.'));
  } else {
    b = sub(y1, mul(k, x1));
    rows.push(row('Подставляем точку $' + pt(p1.x, p1.y) + '$:',
      N(y1) + ' = ' + times(k, x1) + ' + ' + letter + ', \\quad ' +
      letter + ' = ' + N(y1) + plus(neg(mul(k, x1))) + ' = ' + N(b)));
  }
  rows.push(row('Формула:', name + '(x) = ' + lineTex(k, b)));
  return { rows: rows, k: k, b: b, triangle: triangle };
}

/* ══════════════════════════════════════════════════════════
   Парабола по точкам
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

/**
 * Парабола по рисунку. letters — { a, b, c } для подписи коэффициентов
 * (у второй параболы — a₂, b₂, c₂). marks — отмеченные точки этой кривой.
 * knownA — старший коэффициент дан в условии.
 */
function parabolaFromChart(name, letters, curve, win, marks, knownA, onlyA) {
  var rows = [];
  var la = letters.a; var lb = letters.b; var lc = letters.c;
  var vertexMark = (marks || []).filter(function (point) { return point.role === 'vertex'; })[0] || null;
  var others = (marks || []).filter(function (point) { return point.role !== 'vertex'; });
  var used = [];

  rows.push(row('Общий вид: $' + name + '(x) = ' + la + 'x^2 + ' + lb + 'x + ' + lc + '$.'));

  if (vertexReadable(curve, win, !!vertexMark)) {
    var x0 = curve.m; var y0 = curve.n;
    used.push({ x: num(x0), y: num(y0) });
    rows.push(row('Вершина параболы' + (vertexMark ? ' отмечена на рисунке' : ' видна на рисунке') +
      ': $(x_0;\\, y_0) = ' + pt(x0, y0) + '$. Запись через вершину: $' + name + '(x) = ' +
      la + '(x - x_0)^2 + y_0$.'));
    var A;
    if (knownA) {
      A = curve.a;
      rows.push(row('Коэффициент $' + la + ' = ' + N(A) + '$ дан в условии.'));
    } else {
      var node = nearestToVertex(others, curve) || nearestToVertex(gridNodes(curve, win), curve);
      if (!node) { throw new Error('solution-teacher: у параболы нет второй точки'); }
      used.push({ x: node.x, y: node.y });
      var X = F(node.x); var Y = F(node.y);
      var dx = sub(X, x0); var dy = sub(Y, y0);
      A = div(dy, mul(dx, dx));
      var dx2 = mul(dx, dx);
      var base = isZero(x0) ? ' \\cdot ' + Pw(X) : bracket(minus(N(X), x0), x0);
      var aRow = N(Y) + ' = ' + la + base + '^2' + (isZero(y0) ? '' : plus(y0)) +
        ', \\quad ' + (isInt(dx2) && dx2.p === 1 ? '' : N(dx2)) + la + ' = ' + N(dy);
      if (!(isInt(dx2) && dx2.p === 1)) {
        aRow += ', \\quad ' + la + ' = ' + (isInt(dy) && isInt(dx2) ? '' : N(dy) + ' : ' + N(dx2) + ' = ') + N(A);
      }
      rows.push(row('Ещё одна точка графика: $' + pt(node.x, node.y) + '$' +
        (others.indexOf(node) >= 0 ? ' (отмечена на рисунке)' : ' (узел сетки)') + '. Подставляем в запись через вершину:',
        aRow));
    }
    if (onlyA) { return { rows: rows, a: A, points: used, partial: true }; }
    var B = mul(frac(-2), mul(A, x0));
    var C = add(mul(A, mul(x0, x0)), y0);
    rows.push(row('Раскрываем скобки: $' + name + '(x) = ' + vertexTex(A, x0, y0) + '$, откуда',
      lb + ' = -2' + la + 'x_0 = -2 \\cdot ' + P(A) + ' \\cdot ' + P(x0) + ' = ' + N(B) + ', \\quad ' +
      lc + ' = ' + la + 'x_0^2 + y_0 = ' + timesSquare(A, x0) + (isZero(y0) ? '' : plus(y0)) + ' = ' + N(C)));
    rows.push(row('Формула:', name + '(x) = ' + quadTex(A, B, C)));
    return { rows: rows, a: A, b: B, c: C, points: used };
  }

  /* Вершину не прочитать — три точки графика и система. */
  var pool = others.slice();
  gridNodes(curve, win).forEach(function (node) {
    if (!pool.some(function (p) { return p.x === node.x; })) { pool.push(node); }
  });
  var interceptPoint = pool.filter(function (p) { return p.x === 0; })[0] || null;
  var chosen = interceptPoint ? [interceptPoint] : [];
  pool.forEach(function (p) { if (chosen.length < 3 && chosen.indexOf(p) < 0) { chosen.push(p); } });
  if (chosen.length < 3) { throw new Error('solution-teacher: у параболы меньше трёх точек на рисунке'); }
  chosen.forEach(function (p) { used.push({ x: p.x, y: p.y }); });
  rows.push(row('Берём с рисунка три точки графика: $' + chosen.map(function (p) { return pt(p.x, p.y); }).join('$, $') + '$.'));
  var eqs = chosen.map(function (p) {
    return N(F(p.y)) + ' = ' + la + ' \\cdot ' + P(F(p.x)) + '^2 + ' + lb + ' \\cdot ' + P(F(p.x)) + ' + ' + lc;
  });
  rows.push(row('Подставляем в общий вид:', '\\begin{cases} ' + eqs.join(' \\\\ ') + ' \\end{cases}'));
  var A2; var B2; var C2;
  var pts = chosen.map(function (p) { return { x: F(p.x), y: F(p.y) }; });
  if (interceptPoint) {
    C2 = pts[0].y;
    var s1 = div(sub(pts[1].y, C2), pts[1].x);
    var s2 = div(sub(pts[2].y, C2), pts[2].x);
    rows.push(row('Из первого уравнения $' + lc + ' = ' + N(C2) + '$. Подставляем в два других и делим на $x$:',
      '\\begin{cases} ' + N(pts[1].x) + la + ' + ' + lb + ' = ' + N(s1) + ' \\\\ ' +
      N(pts[2].x) + la + ' + ' + lb + ' = ' + N(s2) + ' \\end{cases}'));
    A2 = div(sub(s1, s2), sub(pts[1].x, pts[2].x));
    B2 = sub(s1, mul(A2, pts[1].x));
  } else {
    var t1 = add(pts[1].x, pts[0].x); var r1 = div(sub(pts[1].y, pts[0].y), sub(pts[1].x, pts[0].x));
    var t2 = add(pts[2].x, pts[0].x); var r2 = div(sub(pts[2].y, pts[0].y), sub(pts[2].x, pts[0].x));
    rows.push(row('Вычитаем первое уравнение из второго и третьего и делим на разность абсцисс:',
      '\\begin{cases} ' + lineTexLetters(t1, la, lb) + ' = ' + N(r1) + ' \\\\ ' +
      lineTexLetters(t2, la, lb) + ' = ' + N(r2) + ' \\end{cases}'));
    A2 = div(sub(r1, r2), sub(t1, t2));
    B2 = sub(r1, mul(A2, t1));
    C2 = sub(sub(pts[0].y, mul(A2, mul(pts[0].x, pts[0].x))), mul(B2, pts[0].x));
  }
  rows.push(row('Отсюда:', la + ' = ' + N(A2) + ', \\quad ' + lb + ' = ' + N(B2) + ', \\quad ' + lc + ' = ' + N(C2)));
  rows.push(row('Формула:', name + '(x) = ' + quadTex(A2, B2, C2)));
  return { rows: rows, a: A2, b: B2, c: C2, points: used };
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
   Квадратное уравнение: дискриминант и Виета
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
    rows.push(row('Умножаем обе части на $' + L + '$:', quadTex(A, B, C) + ' = 0'));
  }
  var g = [A, B, C].reduce(function (acc, f) { return gcd(acc, f.p); }, 0);
  if (A.p < 0) { g = -g; }
  if (g !== 1 && g !== 0) {
    A = div(A, frac(g)); B = div(B, frac(g)); C = div(C, frac(g));
    rows.push(row('Делим обе части на $' + g + '$:', quadTex(A, B, C) + ' = 0'));
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
function solveQuadratic(A, B, C, known) {
  var rows = [];
  var d = sub(mul(B, B), mul(frac(4), mul(A, C)));
  if (!isInt(d)) { throw new Error('solution-teacher: дискриминант не целый'); }
  var s = isqrt(d.p);
  if (s === null) { throw new Error('solution-teacher: дискриминант не полный квадрат'); }
  rows.push(row('Здесь $A = ' + N(A) + ',\\; B = ' + N(B) + ',\\; C = ' + N(C) + '$. Дискриминант:', 'D = ' + P(B) + '^2 - 4 \\cdot ' + P(A) + ' \\cdot ' + P(C) +
    ' = ' + N(mul(B, B)) + (mul(frac(4), mul(A, C)).p >= 0 ? ' - ' + N(mul(frac(4), mul(A, C))) : ' + ' + N(abs(mul(frac(4), mul(A, C))))) +
    ' = ' + N(d) + (d.p > 0 ? ', \\quad \\sqrt{D} = ' + s : '')));
  var twoA = mul(frac(2), A);
  var x1 = div(sub(neg(B), frac(s)), twoA);
  var x2 = div(add(neg(B), frac(s)), twoA);
  if (num(x1) > num(x2)) { var t = x1; x1 = x2; x2 = t; }
  var roots = s === 0 ? [x1] : [x1, x2];
  if (s === 0) {
    rows.push(row('$D = 0$, корень один:', 'x = \\dfrac{' + N(neg(B)) + '}{' + N(twoA) + '} = ' + N(x1)));
  } else {
    var xMinus = div(sub(neg(B), frac(s)), twoA);
    var xPlus = div(add(neg(B), frac(s)), twoA);
    rows.push(row('Корни:', 'x_{1,2} = \\dfrac{' + N(neg(B)) + ' \\pm ' + s + '}{' + N(twoA) + '}' +
      ', \\quad x_1 = \\dfrac{' + N(sub(neg(B), frac(s))) + '}{' + N(twoA) + '} = ' + N(xMinus) +
      ', \\quad x_2 = \\dfrac{' + N(add(neg(B), frac(s))) + '}{' + N(twoA) + '} = ' + N(xPlus)));
  }

  /* Виета — альтернатива: сумма и произведение корней. */
  var sum = div(neg(B), A);
  var prod = div(C, A);
  var vieta = 'x_1 + x_2 = -\\dfrac{B}{A} = ' + N(sum) + ', \\quad x_1 x_2 = \\dfrac{C}{A} = ' + N(prod);
  if (known) {
    var other = sub(sum, known);
    rows.push(row('Другой способ — теорема Виета:', vieta));
    rows.push(row('Один корень известен: $x = ' + N(known) + '$ (абсцисса отмеченной точки), второй:',
      'x = ' + N(sum) + plus(neg(known)) + ' = ' + N(other)));
  } else if (roots.length === 2) {
    rows.push(row('Другой способ — теорема Виета:', vieta + ' \\;\\Rightarrow\\; x_1 = ' + N(roots[0]) +
      ', \\; x_2 = ' + N(roots[1])));
  }
  return { rows: rows, roots: roots };
}

/* ══════════════════════════════════════════════════════════
   Задачи о прямой (12.A, 12.B, 12.C, 12.D, P12-*)
   ══════════════════════════════════════════════════════════ */

function linePointsOf(line) {
  var pts = line.points || [];
  if (pts.length >= 2) { return { p1: pts[0], p2: pts[1], given: true }; }
  return null;
}

function optionByText(task, text) {
  var plainText = function (value) { return String(value).replace(/−/g, '-').replace(/\s+/g, ' ').trim(); };
  var found = (task.options || []).filter(function (option) { return plainText(option.text) === plainText(text); })[0];
  return found ? found.number : null;
}

function lineTask(task, rule) {
  var meta = task.meta;
  var steps = [];
  var check = { rule: rule, curves: [], points: [], triangles: [] };
  var lines = meta.lines || [];

  /* Две прямые. */
  if (lines.length === 2) {
    var found = lines.map(function (line, i) {
      var name = i === 0 ? 'f' : 'g';
      var source = linePointsOf(line);
      var out = lineFromPoints(name, 'b', source.p1, source.p2, true);
      steps.push({ title: 'Находим $' + name + '(x)$', rows: out.rows });
      check.curves.push({ kind: 'line', k: out.k, b: out.b, exact: { k: F(line.kFraction), b: F(line.bFraction) } });
      check.triangles.push({ curve: i, triangle: out.triangle });
      check.points.push({ curve: i, x: source.p1.x, y: source.p1.y }, { curve: i, x: source.p2.x, y: source.p2.y });
      return out;
    });
    var f = found[0]; var g = found[1];
    steps.push({ title: 'Приравниваем $f(x) = g(x)$', rows: [row('', lineTex(f.k, f.b) + ' = ' + lineTex(g.k, g.b))] });
    var K = sub(f.k, g.k); var Bv = sub(g.b, f.b);
    var x = div(Bv, K);
    steps.push({ title: 'Переносим слагаемые', rows: [
      row('Слагаемые с $x$ — влево, числа — вправо:', poly([{ c: f.k, v: 'x' }, { c: neg(g.k), v: 'x' }]) + ' = ' +
        poly([{ c: g.b }, { c: neg(f.b) }]) + ', \\quad ' + poly([{ c: K, v: 'x' }]) + ' = ' + N(Bv))
    ] });
    if (!(isInt(K) && K.p === 1)) {
      steps.push({ title: 'Решаем уравнение', rows: [
        row('', 'x = ' + N(Bv) + ' : ' + P(K) + ' = ' + withDecimal(x))
      ] });
    }
    var y = add(mul(f.k, x), f.b);
    var choice = [row('Уравнение линейное, корень один: прямые пересекаются в одной точке $' + pt(x, y) + '$' +
      (meta.intersection && meta.intersection.inside === false ? ', она лежит за пределами рисунка.' : '.'))];
    steps.push({ title: 'Точка пересечения', rows: choice });
    var answerValue = x;
    if (rule === 'intersection-y') {
      var sub1 = substitute(lineTerms(f.k, f.b), x);
      steps.push({ title: 'Находим ординату', rows: [row('Подставляем $x = ' + N(x) + '$ в $f(x)$:', 'y = ' + fn('f', x) + ' = ' + sub1.tex + (isInt(sub1.value) ? '' : ' = ' + D(sub1.value)))] });
      answerValue = sub1.value;
    }
    check.roots = [x];
    check.answerValue = answerValue;
    return { steps: steps, check: check };
  }

  /* Одна прямая. */
  var line = lines[0] || { kFraction: meta.kFraction, bFraction: meta.bFraction, points: meta.points };
  var k; var b;
  var source1 = linePointsOf(line);
  if (source1 && meta.window) {
    var out1 = lineFromPoints('f', 'b', source1.p1, source1.p2, true);
    steps.push({ title: 'Находим $f(x)$', rows: out1.rows });
    k = out1.k; b = out1.b;
    check.triangles.push({ curve: 0, triangle: out1.triangle });
    check.points.push({ curve: 0, x: source1.p1.x, y: source1.p1.y }, { curve: 0, x: source1.p2.x, y: source1.p2.y });
  } else {
    k = F(meta.kFraction); b = F(meta.bFraction);
    steps.push({ title: 'Формула дана в условии', rows: [row('', 'y = ' + lineTex(k, b) + ', \\quad k = ' + N(k) + ', \\quad b = ' + N(b))] });
  }
  check.curves.push({ kind: 'line', k: k, b: b, exact: { k: F(line.kFraction || meta.kFraction), b: F(line.bFraction || meta.bFraction) } });

  if (rule === 'k') {
    check.answerValue = k;
  } else if (rule === 'b') {
    check.answerValue = b;
  } else if (rule === 'value-at') {
    var x0 = F(meta.query.x0);
    var s0 = substitute(lineTerms(k, b), x0);
    steps.push({ title: 'Подставляем $x = ' + given(x0) + '$', rows: [convertRow(x0),
      row('', fn('f', x0) + ' = ' + s0.tex + (isInt(s0.value) ? '' : ' = ' + D(s0.value)))].filter(Boolean) });
    check.answerValue = s0.value;
  } else if (rule === 'argument-for') {
    var y0 = F(meta.query.y0);
    var right = sub(y0, b);
    var xr = div(right, k);
    var unitK = isInt(k) && k.p === 1;
    steps.push({ title: 'Решаем уравнение $f(x) = ' + given(y0) + '$', rows: [convertRow(y0),
      row('', lineTex(k, b) + ' = ' + N(y0) + ', \\quad ' + poly([{ c: k, v: 'x' }]) + ' = ' + N(y0) + plus(neg(b)) + ' = ' +
        (unitK ? withDecimal(right) : N(right))),
      unitK ? null : row('', 'x = ' + N(right) + ' : ' + P(k) + ' = ' + withDecimal(xr))
    ].filter(Boolean) });
    check.answerValue = xr;
  } else if (rule === 'point-choice') {
    var probe = meta.probe;
    var sp = substitute(lineTerms(k, b), F(probe.x));
    var on = eq(sp.value, F(probe.y));
    var px = F(probe.x); var py = F(probe.y);
    var probeY = isInt(py) || !decimalFriendly(py) ? N(py) : D(py) + ' = ' + N(py);
    steps.push({ title: 'Проверяем точку $(' + given(px) + ';\\, ' + given(py) + ')$', rows: [convertRow(px),
      row('Подставляем $x = ' + N(px) + '$:', fn('f', px) + ' = ' + sp.tex),
      row(on ? 'Значение совпадает с ординатой точки $' + probeY + '$, точка принадлежит графику.'
        : 'Значение не равно ординате точки $' + probeY + '$, точка графику не принадлежит.')
    ].filter(Boolean) });
    check.answerOption = optionByText(task, on ? 'Да' : 'Нет');
  } else if (rule === 'equation-choice') {
    var text = lineEquationText(num(k), num(b));
    var number = optionByText(task, text);
    steps.push({ title: 'Выбираем вариант', rows: [row('Формуле $y = ' + lineTex(k, b) + '$ соответствует вариант ' + number + '.')] });
    check.answerOption = number;
  } else {
    throw new Error('solution-teacher: правило «' + rule + '» не поддержано');
  }
  return { steps: steps, check: check };
}

/* ══════════════════════════════════════════════════════════
   Задачи о параболе (12Q.*, P12Q-*)
   ══════════════════════════════════════════════════════════ */

/* Узлы сетки на прямой внутри окна. */
function lineGridNodes(line, win) { return Line.integerPoints(Line.create(line.k, line.b), win); }

function quadraticTask(task, rule) {
  var meta = task.meta;
  var steps = [];
  var check = { rule: rule, curves: [], points: [], triangles: [] };
  var curve = Q.exact(meta.aFraction, meta.bFraction, meta.cFraction);
  var win = meta.window;
  var marks = meta.points || [];

  if (rule === 'sign-a') {
    var up = curve.aValue > 0;
    steps.push({ title: 'Направление ветвей', rows: [row('Ветви параболы направлены ' + (up ? 'вверх' : 'вниз') +
      ', значит, $a ' + (up ? '>' : '<') + ' 0$.')] });
    check.answerOption = optionByText(task, up ? 'a > 0' : 'a < 0');
    return { steps: steps, check: check };
  }

  var two = meta.curves && meta.curves[1];
  var intercept = marks.filter(function (p) { return p.role === 'intercept'; })[0];
  if (rule === 'c' && intercept) {
    steps.push({ title: 'Находим $c$', rows: [
      row('При $x = 0$ получаем $y = a \\cdot 0^2 + b \\cdot 0 + c = c$, то есть $c$ — ордината точки пересечения графика с осью $Oy$.'),
      row('На рисунке это точка $' + pt(intercept.x, intercept.y) + '$, значит, $c = ' + N(F(intercept.y)) + '$.')
    ] });
    check.curves.push({ kind: 'quadratic', c: F(intercept.y), exact: { c: curve.c }, partial: true });
    check.points.push({ curve: 0, x: intercept.x, y: intercept.y });
    check.answerValue = F(intercept.y);
    return { steps: steps, check: check };
  }

  var ownMarks = marks.filter(function (p) { return p.role !== 'cross'; });
  var crossMarks = marks.filter(function (p) { return p.role === 'cross'; });
  var fFound = parabolaFromChart('f', { a: 'a', b: 'b', c: 'c' }, curve, win, ownMarks.concat(crossMarks), meta.knownA,
    rule === 'a' && !two);
  steps.push({ title: fFound.partial ? 'Находим $a$' : 'Находим $f(x)$', rows: fFound.rows });
  check.curves.push({ kind: 'quadratic', a: fFound.a, b: fFound.b, c: fFound.c, partial: !!fFound.partial,
    exact: { a: curve.a, b: curve.b, c: curve.c } });
  fFound.points.forEach(function (p) { check.points.push({ curve: 0, x: p.x, y: p.y }); });
  var fTerms = quadTerms(fFound.a, fFound.b, fFound.c);

  if (!two) {
    if (rule === 'a') { check.answerValue = fFound.a; return { steps: steps, check: check }; }
    if (rule === 'b') { check.answerValue = fFound.b; return { steps: steps, check: check }; }
    if (rule === 'c') { check.answerValue = fFound.c; return { steps: steps, check: check }; }
    if (rule === 'value-at') {
      var x0 = F(meta.query.x0);
      var sv = substitute(fTerms, x0);
      steps.push({ title: 'Подставляем $x = ' + given(x0) + '$', rows: [convertRow(x0),
        row('', fn('f', x0) + ' = ' + sv.tex + (isInt(sv.value) ? '' : ' = ' + D(sv.value)))].filter(Boolean) });
      check.answerValue = sv.value;
      return { steps: steps, check: check };
    }
    if (rule === 'argument-for') {
      var y0 = F(meta.query.y0);
      var C0 = sub(fFound.c, y0);
      steps.push({ title: 'Составляем уравнение $f(x) = ' + given(y0) + '$', rows: [convertRow(y0),
        row('', quadTex(fFound.a, fFound.b, fFound.c) + ' = ' + N(y0)),
        row('Переносим число в левую часть:', quadTex(fFound.a, fFound.b, C0) + ' = 0')
      ].filter(Boolean) });
      var nz = normalize(fFound.a, fFound.b, C0);
      var sol = solveQuadratic(nz.A, nz.B, nz.C, null);
      steps.push({ title: 'Решаем уравнение', rows: nz.rows.concat(sol.rows) });
      var pickText = { larger: 'больший', smaller: 'меньший', positive: 'положительный', negative: 'отрицательный' };
      var picked = pickRoot(sol.roots, meta.query.pick);
      steps.push({ title: 'Выбираем корень', rows: [row('Спрашивают ' + (pickText[meta.query.pick] || 'нужный') +
        ' корень' + (sol.roots.length === 2 ? ' из $x_1 = ' + N(sol.roots[0]) + '$ и $x_2 = ' + N(sol.roots[1]) + '$' : '') +
        ': $x = ' + withDecimal(picked) + '$.')] });
      check.roots = sol.roots;
      check.rootsCheck = sol.roots.map(function (r) { return { x: r, f: Q.yAt(curve, r), g: y0 }; });
      check.answerValue = picked;
      return { steps: steps, check: check };
    }
    if (rule === 'equation-choice') {
      var derived = Q.exact(fFound.a, fFound.b, fFound.c);
      var form = meta.form || 'general';
      var rowsChoice = [];
      if (form === 'vertex') {
        rowsChoice.push(row('Запись через вершину:', 'y = ' + vertexTex(derived.a, derived.m, derived.n)));
      } else if (form === 'roots') {
        var zeros = Q.rootsOf(derived);
        rowsChoice.push(row('Нули функции: $f(x) = 0$ при $x = ' + N(zeros[0]) + '$ и $x = ' + N(zeros[1]) + '$. Запись через нули:',
          'y = ' + (isInt(derived.a) && Math.abs(derived.a.p) === 1 ? (derived.a.p < 0 ? '-' : '') : N(derived.a)) +
          rootFactor(zeros[0]) + rootFactor(zeros[1])));
      }
      var numberQ = optionByText(task, Q.equationText(derived, form));
      rowsChoice.push(row('Этой формуле соответствует вариант ' + numberQ + '.'));
      steps.push({ title: 'Выбираем вариант', rows: rowsChoice });
      check.answerOption = numberQ;
      return { steps: steps, check: check };
    }
    throw new Error('solution-teacher: правило «' + rule + '» не поддержано');
  }

  /* Две функции: парабола и прямая или две параболы. */
  var cross = crossMarks[0] || null;
  var gRows; var gTerms; var gTex; var gDesc;
  if (two.kind === 'line') {
    var lineExact = { k: F(two.kFraction), b: F(two.bFraction) };
    var nodes = lineGridNodes(lineExact, win);
    /* Пара точек прямой для треугольника. Сначала — отмеченная точка
       пересечения и узел на оси Oy (тогда m читается сразу), потом она же
       и узел в двух–четырёх клетках, потом более широкие пары; в конце —
       два других узла сетки: у точки пересечения рядом всегда парабола,
       и треугольник с вершиной в ней бывает зажат её веткой. Треугольник
       в одну клетку тесен: его подписи ложатся на кривые. */
    var anchor = cross || nodes[0];
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
    /* Из пар — первая, у которой подписи треугольника на чертеже легли
       чисто: не на кривую и не друг на друга. Чистой нет — та, где
       замечаний меньше всего. */
    var first = null;
    var second = null;
    var fewest = Infinity;
    for (var ci = 0; ci < pairs.length; ci += 1) {
      var issues;
      try {
        issues = SlopeFigure.layoutProblems(task, [{ triangle: Slope.build(pairs[ci][0], pairs[ci][1]), curve: 1 }]).length;
      } catch { issues = Infinity; }
      if (issues < fewest) { fewest = issues; first = pairs[ci][0]; second = pairs[ci][1]; }
      if (issues === 0) { break; }
    }
    if (!first || !second) { throw new Error('solution-teacher: у прямой нет двух узлов сетки'); }
    var gl = lineFromPoints('g', 'm', first, second, false);
    gl.rows[0].text = 'Это прямая. Буква $b$ занята коэффициентом параболы, поэтому свободный член обозначим $m$: $g(x) = kx + m$. ' +
      'С рисунка берём точки ' + [first, second].sort(function (p, q) { return p.x - q.x; }).map(function (p) {
        return '$' + pt(p.x, p.y) + '$' + (p === cross ? ' (отмеченная точка пересечения)' : ' (узел сетки)');
      }).join(' и ') + '.';
    gRows = gl.rows;
    gTerms = lineTerms(gl.k, gl.b);
    gTex = lineTex(gl.k, gl.b);
    gDesc = { A: ZERO, B: gl.k, C: gl.b };
    check.curves.push({ kind: 'line', k: gl.k, b: gl.b, exact: lineExact });
    check.triangles.push({ curve: 1, triangle: gl.triangle });
    check.points.push({ curve: 1, x: first.x, y: first.y }, { curve: 1, x: second.x, y: second.y });
  } else {
    var gCurve = Q.exact(two.aFraction, two.bFraction, two.cFraction);
    var gMarks = (two.points || []).map(function (p) { return { x: p.x, y: p.y, role: p.role }; });
    if (cross) { gMarks.push(cross); }
    var gq = parabolaFromChart('g', { a: 'a_2', b: 'b_2', c: 'c_2' }, gCurve, win, gMarks, false);
    gq.rows[0].text = 'Вторая парабола, её коэффициенты обозначим $a_2, b_2, c_2$: $g(x) = a_2x^2 + b_2x + c_2$.';
    gRows = gq.rows;
    gTerms = quadTerms(gq.a, gq.b, gq.c);
    gTex = quadTex(gq.a, gq.b, gq.c);
    gDesc = { A: gq.a, B: gq.b, C: gq.c };
    check.curves.push({ kind: 'quadratic', a: gq.a, b: gq.b, c: gq.c, exact: { a: gCurve.a, b: gCurve.b, c: gCurve.c } });
    gq.points.forEach(function (p) { check.points.push({ curve: 1, x: p.x, y: p.y }); });
  }
  steps.push({ title: 'Находим $g(x)$', rows: gRows });

  var fTex = quadTex(fFound.a, fFound.b, fFound.c);
  steps.push({ title: 'Приравниваем $f(x) = g(x)$', rows: [row('', fTex + ' = ' + gTex)] });

  var A = sub(fFound.a, gDesc.A); var B = sub(fFound.b, gDesc.B); var C = sub(fFound.c, gDesc.C);
  var std = [row('Переносим всё в левую часть:', fTex + ' - ' + grouped(gTex) + ' = 0'),
    row('Приводим подобные:', quadTex(A, B, C) + ' = 0')];
  var known = cross ? F(cross.x) : null;
  var roots;
  var solveRows;
  if (isZero(A)) {
    var xLin = div(neg(C), B);
    std.push(row('Слагаемые с $x^2$ сократились, уравнение линейное.'));
    solveRows = [row('', poly([{ c: B, v: 'x' }]) + ' = ' + N(neg(C)) + ', \\quad x = ' + N(xLin))];
    roots = [xLin];
  } else {
    var nq = normalize(A, B, C);
    std = std.concat(nq.rows);
    var sq = solveQuadratic(nq.A, nq.B, nq.C, known);
    solveRows = sq.rows;
    roots = sq.roots;
  }
  steps.push({ title: 'Приводим к виду $Ax^2 + Bx + C = 0$', rows: std });
  steps.push({ title: 'Решаем уравнение', rows: solveRows });

  var asked = meta.intersection.asked;
  var askedX = F(asked.x);
  var whereText = meta.intersection.hidden === 'fraction'
    ? 'она не в узле сетки, и её координаты с рисунка не прочитать'
    : 'она лежит за пределами рисунка';
  var choiceRows = [];
  if (cross && roots.length === 2) {
    choiceRows.push(row('$x = ' + N(known) + '$ — абсцисса отмеченной точки пересечения $' + pt(cross.x, cross.y) +
      '$, она видна на рисунке. Значит, вторая точка пересечения имеет абсциссу $x = ' + withDecimal(askedX) + '$ — ' + whereText + '.'));
  } else {
    choiceRows.push(row('Искомая точка пересечения имеет абсциссу $x = ' + withDecimal(askedX) + '$.'));
  }
  steps.push({ title: 'Выбираем корень', rows: choiceRows });

  var answerValue = askedX;
  if (rule === 'intersection-y') {
    /* Подставляем в ту функцию, где считать проще: прямую, если она есть. */
    var useG = two.kind === 'line';
    var sy = substitute(useG ? gTerms : fTerms, askedX);
    steps.push({ title: 'Находим ординату', rows: [row('Подставляем $x = ' + N(askedX) + '$ в $' + (useG ? 'g' : 'f') + '(x)$:',
      'y = ' + fn(useG ? 'g' : 'f', askedX) + ' = ' + sy.tex + (isInt(sy.value) ? '' : ' = ' + D(sy.value)))] });
    answerValue = sy.value;
  }
  check.roots = roots;
  check.answerValue = answerValue;
  return { steps: steps, check: check };
}

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

/* ══════════════════════════════════════════════════════════
   Вход
   ══════════════════════════════════════════════════════════ */

/**
 * Решение задачи для листа учителя.
 * task — { meta, answer, options, answerRule }: то, что собрал движок,
 * и правило ответа из данных набора.
 */
function build(task) {
  var rule = task.answerRule || (task.meta && task.meta.rule);
  if (!rule) { throw new Error('solution-teacher: у задачи нет правила ответа'); }
  if (task.meta && task.meta.family === 'quadratic') { return quadraticTask(task, rule); }
  return lineTask(task, rule);
}

/* ══════════════════════════════════════════════════════════
   Чертёж к решению: тот же график, что в условии, и поверх —
   треугольники наклона, по которым найдены угловые коэффициенты
   ══════════════════════════════════════════════════════════ */

/**
 * Чертёж к решению для листа учителя: чертёж условия и поверх —
 * треугольники наклона, по которым найдены угловые коэффициенты
 * (graph/slope-figure.js). Нет чертежа или треугольника — null.
 *
 * options.triangles: false — без треугольников (для сверки с условием).
 */
function figure(task, solved, options) {
  var items = ((solved && solved.check.triangles) || []).filter(function (item) { return !item.triangle.flat; });
  if (options && options.triangles === false) { return SlopeFigure.render(task, []); }
  if (!items.length) { return null; }
  return SlopeFigure.render(task, items);
}

var api = { build: build, figure: figure };

export default api;
export { build, figure };
