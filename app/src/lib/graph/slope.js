/* graph/slope.js — угловой коэффициент прямой через треугольник наклона.

   Так мы находим k везде: в листе учителя, в разборах, в подсказках.
   Формулу через разность координат не используем.

     k = tg α, α — угол между прямой и положительным направлением оси Ox.

   Треугольник строится по двум точкам прямой в узлах сетки: отрезок
   между ними — гипотенуза, катеты параллельны осям, вершина прямого
   угла всегда ПОД прямой. Катеты — длины в клетках, числа положительные.

     прямая возрастает  α острый, он и есть угол треугольника
                        при левой точке:   k = tg α = верт. / гориз.
     прямая убывает     α тупой; острый угол треугольника при правой
                        точке смежный с ним и равен 180° − α:
                        tg(180° − α) = верт. / гориз., k = tg α = −tg(180° − α)
     прямая параллельна Ox  треугольника нет: α = 0°, k = tg 0° = 0

   Модуль отдаёт геометрию (build), строки решения для листа учителя
   (teacherRows) и фигуры для чертежа (shapes). Ни DOM, ни SVG здесь нет.
*/

import Line from './families/line.js';

var frac = Line.frac;
var div = Line.div;
var isInt = Line.isInt;

/**
 * Треугольник наклона по двум точкам прямой.
 *
 * Возвращает { flat, rising, A, B, C, dx, dy, k, acute }:
 * A — левая точка, B — правая, C — вершина прямого угла (под прямой),
 * dx, dy — катеты в клетках, k — точной дробью, acute — вершина острого
 * угла, который отмечается на чертеже (α или 180° − α).
 */
function build(p1, p2) {
  if (p1.x === p2.x) { throw new Error('slope: вертикальная прямая'); }
  var A = p1.x < p2.x ? p1 : p2;
  var B = p1.x < p2.x ? p2 : p1;
  var dx = Math.abs(B.x - A.x);
  var dy = Math.abs(B.y - A.y);
  if (dy === 0) {
    return { flat: true, rising: false, A: A, B: B, C: null, dx: dx, dy: 0, k: frac(0), acute: null };
  }
  var rising = B.y > A.y;
  /* Ниже прямой — та вершина, у которой ордината меньшая из двух. */
  var C = rising ? { x: B.x, y: A.y } : { x: A.x, y: B.y };
  var k = div(frac(rising ? dy : -dy), frac(dx));
  return { flat: false, rising: rising, A: A, B: B, C: C, dx: dx, dy: dy, k: k,
           acute: rising ? A : B };
}

/* ══════════════════════════════════════════════════════════
   Текст для листа учителя
   ══════════════════════════════════════════════════════════ */

function N(f) {
  if (isInt(f)) { return String(f.p); }
  return (f.p < 0 ? '-' : '') + '\\dfrac{' + Math.abs(f.p) + '}{' + f.q + '}';
}

function pt(p) { return '(' + p.x + ';\\, ' + p.y + ')'; }

/** 6/4 = 3/2; у несократимой дроби и целого — без лишнего «=». */
function ratio(dy, dx) {
  var value = frac(dy, dx);
  var raw = '\\dfrac{' + dy + '}{' + dx + '}';
  return value.q === dx && !isInt(value) ? raw : raw + ' = ' + N(value);
}

/**
 * Строки решения: [{ text, tex }] — тот же формат, что у
 * solution-teacher.js. letter — буква коэффициента: k, а у прямой
 * в задачах с гиперболой — a.
 */
function teacherRows(t, letter) {
  var name = letter || 'k';
  var tg = '\\operatorname{tg}';
  if (t.flat) {
    return [{ text: 'Прямая параллельна оси $Ox$, $\\alpha = 0^\\circ$, $' + name + ' = ' + tg +
      ' 0^\\circ = 0$.' }];
  }
  /* Точки всегда называются слева направо: A, затем B. */
  var build = 'Строим под прямой прямоугольный треугольник с гипотенузой между точками $' +
    pt(t.A) + '$ и $' + pt(t.B) + '$. Вершина прямого угла — $' + pt(t.C) + '$. ' +
    'Катеты: вертикальный $' + t.dy + '$, горизонтальный $' + t.dx + '$.';
  if (t.rising) {
    return [
      { text: 'Прямая возрастает, значит $' + name + ' = ' + tg + ' \\alpha > 0$, $\\alpha$ — угол между ' +
        'прямой и положительным направлением оси $Ox$. ' + build +
        ' Угол треугольника при вершине $' + pt(t.A) + '$ равен $\\alpha$.' },
      { text: '', tex: tg + ' \\alpha = ' + ratio(t.dy, t.dx) + ', \\quad ' + name + ' = ' + N(t.k) }
    ];
  }
  var acute = frac(t.dy, t.dx);
  return [
    { text: 'Прямая убывает, значит $\\alpha$ — тупой угол и $' + name + ' = ' + tg + ' \\alpha < 0$. ' + build +
      ' Острый угол треугольника при вершине $' + pt(t.B) + '$ — смежный с $\\alpha$, он равен $180^\\circ - \\alpha$.' },
    { text: '', tex: tg + '(180^\\circ - \\alpha) = ' + ratio(t.dy, t.dx) },
    { text: '', tex: tg + ' \\alpha = -' + tg + '(180^\\circ - \\alpha) = ' + N(frac(-acute.p, acute.q)) +
      ', \\quad ' + name + ' = ' + N(t.k) }
  ];
}

/* ══════════════════════════════════════════════════════════
   Фигуры для чертежа: тонкий пунктир, длины катетов, угол
   ══════════════════════════════════════════════════════════ */

var GAP_PX = 12;

/* Подпись катета: места — только вдоль самого катета, от середины
   к краям, и снаружи треугольника (side — сторона на экране). */
function legLabel(id, value, ink, from, to, side) {
  var anchors = [0.5, 0.35, 0.65, 0.25, 0.75].map(function (share) {
    return [from.x + (to.x - from.x) * share, from.y + (to.y - from.y) * share];
  });
  return { type: 'label', id: id, text: String(value), color: ink, at: anchors[0], anchors: anchors,
    offset: [side[0] * GAP_PX, side[1] * GAP_PX], gap: GAP_PX };
}

/**
 * Фигуры сцены рендерера. suffix делает id уникальными, когда
 * на одном чертеже два треугольника (две прямые); color — цвет
 * своей прямой: так видно, чей это треугольник, и катет, легший
 * на ось, не сливается с ней.
 */
function shapes(t, suffix, color) {
  if (t.flat) { return []; }
  var tail = suffix ? '-' + suffix : '';
  var ink = color || 'accent';
  var A = t.A; var B = t.B; var C = t.C;
  var list = [];

  /* Катеты: горизонтальный и вертикальный, оба от вершины прямого угла. */
  var horizontalTo = t.rising ? A : B;
  var verticalTo = t.rising ? B : A;
  list.push({ type: 'segment', id: 'teacher-leg-x' + tail, style: 'dashed', color: ink,
    from: [C.x, C.y], to: [horizontalTo.x, horizontalTo.y] });
  list.push({ type: 'segment', id: 'teacher-leg-y' + tail, style: 'dashed', color: ink,
    from: [C.x, C.y], to: [verticalTo.x, verticalTo.y] });

  /* Длины — снаружи треугольника: под горизонтальным катетом и с той
     стороны вертикального, где треугольника нет. Рендерер сдвигает
     подпись вдоль катета, если место занято. */
  var outward = horizontalTo.x < C.x ? 1 : -1;     /* +1 — вправо по экрану */
  list.push(legLabel('teacher-label-x' + tail, t.dx, ink, C, horizontalTo, [0, 1]));
  list.push(legLabel('teacher-label-y' + tail, t.dy, ink, C, verticalTo, [outward, 0]));

  list.push({ type: 'rightAngle', id: 'teacher-right' + tail, color: ink, at: [C.x, C.y],
    alongX: Math.sign(horizontalTo.x - C.x), alongY: Math.sign(verticalTo.y - C.y), sizePx: 9 });

  /* Угол: α при левой точке у возрастающей, 180° − α при правой
     у убывающей. Дуга — между горизонтальным катетом и гипотенузой. */
  var r = Math.min(t.dx, t.dy) / 3;
  var at = t.acute;
  var toward = t.rising ? B : A;
  var hyp = Math.atan2(toward.y - at.y, toward.x - at.x) * 180 / Math.PI;
  var base = t.rising ? 0 : 180;
  var from = Math.min(base, hyp);
  var to = Math.max(base, hyp);
  list.push({ type: 'arc', id: 'teacher-arc' + tail, color: ink, at: [at.x, at.y],
    radius: r, maxRadiusPx: 30, from: from, to: to });

  /* Подпись угла — веером внутри угла, ближе к вершине: рендерер
     берёт первое свободное место. */
  var anchors = [];
  [1.6, 2.1, 2.7].forEach(function (scale) {
    [0.5, 0.3, 0.7].forEach(function (share) {
      var theta = (from + (to - from) * share) * Math.PI / 180;
      anchors.push([at.x + r * scale * Math.cos(theta), at.y + r * scale * Math.sin(theta)]);
    });
  });
  list.push({ type: 'label', id: 'teacher-angle' + tail, color: ink,
    text: t.rising ? 'α' : '180° − α', at: anchors[0], anchors: anchors, gap: 4 });
  return list;
}

/** Вершина прямого угла под прямой: значение прямой в C больше ординаты C. */
function vertexBelow(t, line) {
  if (t.flat) { return true; }
  var value = Line.num(Line.yAt(line, t.C.x));
  return value > t.C.y + 1e-9;
}

var api = { build: build, teacherRows: teacherRows, shapes: shapes, vertexBelow: vertexBelow };

export default api;
export { build, teacherRows, shapes, vertexBelow };
