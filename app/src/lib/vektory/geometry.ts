/**
 * Плоская геометрия для рисунков и генератора задания №2.
 *
 * Расстояния между отрезками и прямоугольниками нужны дважды: движку —
 * чтобы подпись не легла на вектор или ось, генератору — чтобы
 * векторы не пересекались и держали дистанцию в клетку. Функции
 * чистые, единицы любые: клетки или пиксели.
 */

export interface Seg {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface Rect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

const EPS = 1e-9;

export function dist(x1: number, y1: number, x2: number, y2: number): number {
  return Math.hypot(x1 - x2, y1 - y2);
}

/** Расстояние от точки до отрезка. */
export function pointSegDist(px: number, py: number, s: Seg): number {
  const dx = s.x2 - s.x1;
  const dy = s.y2 - s.y1;
  const len2 = dx * dx + dy * dy;
  if (len2 < EPS) {
    return dist(px, py, s.x1, s.y1);
  }
  const t = Math.max(0, Math.min(1, ((px - s.x1) * dx + (py - s.y1) * dy) / len2));
  return dist(px, py, s.x1 + t * dx, s.y1 + t * dy);
}

function orient(ax: number, ay: number, bx: number, by: number, cx: number, cy: number): number {
  return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
}

function onSeg(ax: number, ay: number, bx: number, by: number, px: number, py: number): boolean {
  return (
    Math.min(ax, bx) - EPS <= px &&
    px <= Math.max(ax, bx) + EPS &&
    Math.min(ay, by) - EPS <= py &&
    py <= Math.max(ay, by) + EPS
  );
}

/** Пересекаются ли отрезки (касание концом тоже считается). */
export function segsIntersect(a: Seg, b: Seg): boolean {
  const o1 = orient(a.x1, a.y1, a.x2, a.y2, b.x1, b.y1);
  const o2 = orient(a.x1, a.y1, a.x2, a.y2, b.x2, b.y2);
  const o3 = orient(b.x1, b.y1, b.x2, b.y2, a.x1, a.y1);
  const o4 = orient(b.x1, b.y1, b.x2, b.y2, a.x2, a.y2);
  if (
    ((o1 > EPS && o2 < -EPS) || (o1 < -EPS && o2 > EPS)) &&
    ((o3 > EPS && o4 < -EPS) || (o3 < -EPS && o4 > EPS))
  ) {
    return true;
  }
  if (Math.abs(o1) <= EPS && onSeg(a.x1, a.y1, a.x2, a.y2, b.x1, b.y1)) return true;
  if (Math.abs(o2) <= EPS && onSeg(a.x1, a.y1, a.x2, a.y2, b.x2, b.y2)) return true;
  if (Math.abs(o3) <= EPS && onSeg(b.x1, b.y1, b.x2, b.y2, a.x1, a.y1)) return true;
  if (Math.abs(o4) <= EPS && onSeg(b.x1, b.y1, b.x2, b.y2, a.x2, a.y2)) return true;
  return false;
}

/** Расстояние между отрезками: 0, если они пересекаются или касаются. */
export function segSegDist(a: Seg, b: Seg): number {
  if (segsIntersect(a, b)) {
    return 0;
  }
  return Math.min(
    pointSegDist(a.x1, a.y1, b),
    pointSegDist(a.x2, a.y2, b),
    pointSegDist(b.x1, b.y1, a),
    pointSegDist(b.x2, b.y2, a),
  );
}

export function rectEdges(r: Rect): Seg[] {
  return [
    { x1: r.left, y1: r.top, x2: r.right, y2: r.top },
    { x1: r.right, y1: r.top, x2: r.right, y2: r.bottom },
    { x1: r.right, y1: r.bottom, x2: r.left, y2: r.bottom },
    { x1: r.left, y1: r.bottom, x2: r.left, y2: r.top },
  ];
}

export function pointInRect(px: number, py: number, r: Rect): boolean {
  return r.left - EPS <= px && px <= r.right + EPS && r.top - EPS <= py && py <= r.bottom + EPS;
}

/** Расстояние от отрезка до прямоугольника: 0 при любом касании. */
export function segRectDist(s: Seg, r: Rect): number {
  if (pointInRect(s.x1, s.y1, r) || pointInRect(s.x2, s.y2, r)) {
    return 0;
  }
  let best = Infinity;
  for (const edge of rectEdges(r)) {
    best = Math.min(best, segSegDist(s, edge));
    if (best === 0) {
      return 0;
    }
  }
  return best;
}

/** Зазор между прямоугольниками: отрицательный — они перекрываются. */
export function rectGap(a: Rect, b: Rect): number {
  const dx = Math.max(a.left - b.right, b.left - a.right);
  const dy = Math.max(a.top - b.bottom, b.top - a.bottom);
  if (dx < 0 && dy < 0) {
    return Math.max(dx, dy);
  }
  return Math.hypot(Math.max(dx, 0), Math.max(dy, 0));
}

/** Лежит ли точка на отрезке (включая концы). */
export function pointOnSeg(px: number, py: number, s: Seg): boolean {
  return pointSegDist(px, py, s) <= EPS;
}
