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

/* Подписи треугольника крупнее подписей делений: их читают с листа. */
var LABEL_SIZE = 30;
var ANGLE_SIZE = 25;

/* Запасные места вокруг точки: по кольцам, от ближних к дальним.
   Нужны, когда все «правильные» места заняты прямой или подписями —
   подпись тогда встаёт рядом, но не поверх линии. */
function ring(center, maxRadius) {
  var out = [];
  for (var dx = -maxRadius; dx <= maxRadius + 1e-9; dx += 0.25) {
    for (var dy = -maxRadius; dy <= maxRadius + 1e-9; dy += 0.25) {
      out.push([center.x + dx, center.y + dy, Math.hypot(dx, dy)]);
    }
  }
  return out.sort(function (a, b) { return a[2] - b[2]; }).map(function (p) { return [p[0], p[1]]; });
}

/* Подпись катета: места — только вдоль самого катета, от середины
   к краям; сначала снаружи треугольника (side — сторона в клетках),
   потом изнутри, если снаружи занято. */
/* Расстояние от точки до отрезка — в клетках. */
function toSegment(p, a, b) {
  var vx = b.x - a.x; var vy = b.y - a.y;
  var len = vx * vx + vy * vy;
  var u = len ? Math.max(0, Math.min(1, ((p[0] - a.x) * vx + (p[1] - a.y) * vy) / len)) : 0;
  return Math.hypot(p[0] - (a.x + u * vx), p[1] - (a.y + u * vy));
}

function legLabel(id, value, ink, from, to, side, other) {
  var anchors = [];
  /* Отступ — в клетках, с запасом на половину подписи: у горизонтального
     катета подпись высокая, у вертикального — узкая. */
  var gaps = side[1] ? [0.8, 1.05] : [0.6, 0.9];
  [1, -1].forEach(function (sign) {
    gaps.forEach(function (gap) {
      [0.5, 0.35, 0.65, 0.2, 0.8].forEach(function (share) {
        anchors.push([from.x + (to.x - from.x) * share + sign * side[0] * gap,
                      from.y + (to.y - from.y) * share + sign * side[1] * gap]);
      });
    });
  });
  /* Запасные места — рядом с серединой катета, не дальше полутора
     клеток: дальше подпись читается как длина соседнего катета. */
  anchors = anchors.concat(ring({ x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 }, 1.5));
  /* Подпись ближе к своему катету, чем к соседнему: иначе её читают
     как длину соседнего. */
  anchors = anchors.filter(function (p) { return toSegment(p, from, to) + 0.3 < toSegment(p, other.from, other.to); });
  return { type: 'label', id: id, text: String(value), color: ink, centered: true,
    at: anchors[0], anchors: anchors, size: LABEL_SIZE, smaller: [24, 20] };
}

/**
 * Фигуры сцены рендерера. suffix делает id уникальными, когда
 * на одном чертеже два треугольника (две прямые); color — цвет
 * своей прямой: так видно, чей это треугольник, и катет, легший
 * на ось, не сливается с ней. options.legLabels: false — без длин
 * катетов (их ученик на шаге подсказки считает сам).
 */
function shapes(t, suffix, color, options) {
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

  /* Подпись угла: рендерер перебирает места по порядку и берёт первое,
     где она не задевает ни прямую, ни катеты, ни другие подписи. */
  /* Треугольник всегда над горизонтальным катетом (прямой угол под
     прямой), поэтому места — над катетом, от вершины угла к вершине
     прямого угла: там треугольник шире, и подпись не задевает прямую.
     Высота — от половины до целой клетки, чтобы не лечь на катет. */
  var inward = Math.sign(C.x - at.x);
  var anchors = [];
  /* Не дальше двух с половиной клеток от вершины угла: глубже внутри
     большого треугольника подпись уже не читается как подпись угла. */
  [1.2, 1.6, 2.0, 2.4, 0.9].forEach(function (shift) {
    if (shift > 0.85 * t.dx) { return; }
    [0.6, 0.8, 1.0, 1.25].forEach(function (lift) {
      anchors.push([at.x + inward * shift, at.y + lift]);
    });
  });
  /* Запасные места — под дугой, по ту сторону горизонтального катета:
     прямая за вершиной угла уходит в другую сторону, там свободно. */
  [1.0, 1.3, 1.6, 0.7, 2.0].forEach(function (shift) {
    [0.55, 0.8].forEach(function (drop) {
      anchors.push([at.x + inward * shift, at.y - drop]);
    });
  });
  /* Кольца — от дуги, а не от вершины: подпись должна читаться как
     подпись этого угла, а не соседнего. */
  anchors = anchors.concat(ring({ x: at.x + inward * 0.8, y: at.y + 0.3 }, 2.2));
  /* Только под прямой — с той стороны, где треугольник: подпись над
     прямой читается как подпись другого угла. */
  var kValue = Line.num(t.k);
  anchors = anchors.filter(function (p) { return A.y + kValue * (p[0] - A.x) - p[1] > 0.45; });
  list.push({ type: 'label', id: 'teacher-angle' + tail, color: ink, centered: true,
    text: t.rising ? 'α' : '180°−α', at: anchors[0], anchors: anchors, size: ANGLE_SIZE,
    smaller: [21, 18, 15] });

  /* Длины катетов — после подписи угла: они короткие и встают
     вокруг неё, а не наоборот. */
  if (!options || options.legLabels !== false) {
    list.push(legLabel('teacher-label-x' + tail, t.dx, ink, C, horizontalTo, [0, -1],
      { from: C, to: verticalTo }));
    list.push(legLabel('teacher-label-y' + tail, t.dy, ink, C, verticalTo, [outward, 0],
      { from: C, to: horizontalTo }));
  }

  /* Пометка slope: рендерер рисует фигуры только на сцене
     с showSlopeTriangle: true. */
  list.forEach(function (shape) { shape.slope = true; });
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
