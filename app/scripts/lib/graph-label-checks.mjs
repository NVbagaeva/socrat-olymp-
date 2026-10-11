/* scripts/lib/graph-label-checks.mjs — подписи точек на чертеже не
   налезают ни на что.

   Проверка независима от того, как рендерер выбирал место: она берёт
   его отчёт (renderGraph(scene, report) — прямоугольники подписей,
   кривые в пикселях, оси, поле, фигуры построения) и считает
   пересечения заново, по плотной выборке кривой.

   Что проверяется для каждой подписи точки:
     — рамка не пересекает ни одну кривую: расстояние от рамки до линии
       не меньше CURVE_CLEAR (полтолщины линии и небольшой запас);
     — не пересекает оси (с запасом на толщину);
     — не пересекает пунктиры и отрезки построений;
     — не пересекает другие подписи (чисел на осях, фигур, точек);
     — не закрывает чужие точки (кружки);
     — целиком внутри поля чертежа.
   Выноска (короткая линия от рамки к точке) допускается: подпись, у
   которой она есть, помечена leader. */

/* Полтолщины линии кривой (2,5 px) и запас: линия не должна касаться
   рамки, иначе подложка перебивает её. */
export const CURVE_CLEAR = 2;
export const AXIS_CLEAR = 1.5;
export const SHAPE_CLEAR = 1.5;

/* Расстояние от отрезка (a, b) до прямоугольника рамки; 0 — пересекаются. */
function segRectDist(ax, ay, bx, by, box) {
  const l = box.x - box.halfW;
  const r = box.x + box.halfW;
  const t = box.y - box.halfH;
  const d = box.y + box.halfH;
  // Плотная выборка вдоль отрезка: шаг 1 px.
  const len = Math.hypot(bx - ax, by - ay);
  const steps = Math.max(1, Math.ceil(len));
  let best = Infinity;
  for (let i = 0; i <= steps; i += 1) {
    const x = ax + ((bx - ax) * i) / steps;
    const y = ay + ((by - ay) * i) / steps;
    const dx = Math.max(l - x, 0, x - r);
    const dy = Math.max(t - y, 0, y - d);
    best = Math.min(best, Math.hypot(dx, dy));
    if (best === 0) return 0;
  }
  return best;
}

function boxesGap(a, b) {
  const dx = Math.max(Math.abs(a.x - b.x) - a.halfW - b.halfW, 0);
  const dy = Math.max(Math.abs(a.y - b.y) - a.halfH - b.halfH, 0);
  return Math.hypot(dx, dy);
}

/* Отрезки построений в пикселях по отчёту рендерера. */
function shapeSegments(report) {
  const { pad, cell, xmin, ymax } = report.map;
  const sx = (x) => pad + (x - xmin) * cell;
  const sy = (y) => pad + (ymax - y) * cell;
  const out = [];
  for (const item of report.shapes || []) {
    const shape = item.shape;
    if (shape.type === 'segment') {
      out.push([sx(shape.from[0]), sy(shape.from[1]), sx(shape.to[0]), sy(shape.to[1])]);
    } else if (shape.type === 'polygon') {
      shape.points.forEach((point, i) => {
        const next = shape.points[(i + 1) % shape.points.length];
        out.push([sx(point[0]), sy(point[1]), sx(next[0]), sy(next[1])]);
      });
    }
  }
  return out;
}

/**
 * Что не так с подписями точек в отчёте рендерера. Пустой список —
 * всё в порядке. where — строка для сообщения.
 */
export function labelProblems(report, where) {
  const errors = [];
  if (!report || !report.boxes || !report.curves) return errors;
  const boxes = report.boxes;
  const labels = boxes.filter((b) => b.kind === 'pointLabel');
  const segments = shapeSegments(report);
  const f = report.field;

  labels.forEach((box, index) => {
    const name = `подпись точки №${index + 1}`;
    // Поле чертежа.
    if (
      box.x - box.halfW < f.left - 1e-6 ||
      box.x + box.halfW > f.right + 1e-6 ||
      box.y - box.halfH < f.top - 1e-6 ||
      box.y + box.halfH > f.bottom + 1e-6
    ) {
      errors.push(`${where}: ${name} выходит за границу рисунка`);
    }
    // Кривые.
    let curveGap = Infinity;
    for (const curve of report.curves) {
      for (const piece of curve) {
        for (let i = 0; i + 1 < piece.length; i += 1) {
          curveGap = Math.min(
            curveGap,
            segRectDist(piece[i].x, piece[i].y, piece[i + 1].x, piece[i + 1].y, box),
          );
          if (curveGap < CURVE_CLEAR) break;
        }
        if (curveGap < CURVE_CLEAR) break;
      }
      if (curveGap < CURVE_CLEAR) break;
    }
    if (curveGap < CURVE_CLEAR) {
      errors.push(`${where}: ${name} пересекает кривую (зазор ${curveGap.toFixed(1)} px)`);
    }
    // Оси.
    const axisX = segRectDist(f.left, report.axes.x, f.right, report.axes.x, box);
    const axisY = segRectDist(report.axes.y, f.top, report.axes.y, f.bottom, box);
    if (axisX < AXIS_CLEAR) errors.push(`${where}: ${name} пересекает ось x`);
    if (axisY < AXIS_CLEAR) errors.push(`${where}: ${name} пересекает ось y`);
    // Пунктиры и отрезки построений.
    for (const seg of segments) {
      if (segRectDist(seg[0], seg[1], seg[2], seg[3], box) < SHAPE_CLEAR) {
        errors.push(`${where}: ${name} пересекает линию построения`);
        break;
      }
    }
    // Чужие подписи.
    boxes.forEach((other) => {
      if (other === box) return;
      if (boxesGap(box, other) <= 0) {
        errors.push(`${where}: ${name} налезает на подпись (${other.kind})`);
      }
    });
    // Чужие точки.
    (report.points || []).forEach((p) => {
      if (box.at && Math.abs(box.at.x - p.x) < 1e-6 && Math.abs(box.at.y - p.y) < 1e-6) return;
      const dx = Math.max(Math.abs(p.x - box.x) - box.halfW, 0);
      const dy = Math.max(Math.abs(p.y - box.y) - box.halfH, 0);
      if (Math.hypot(dx, dy) < p.r) errors.push(`${where}: ${name} закрывает чужую точку`);
    });
  });
  return errors;
}
