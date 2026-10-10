/**
 * Чертёж задачи о графике корня с треугольником наклона прямой.
 *
 * Треугольник строится под прямой между точкой A и второй отмеченной
 * точкой прямой (graph/triangle.js), катеты подписаны длинами, без
 * знаков. Показывается только в подсказке тренажёра, в разборе
 * опорной задачи и на листе учителя; ученику на листе — чертёж
 * задачи как есть.
 */

import Line from '@/lib/graph/families/line.js';
import Sqrt from '@/lib/graph/generate-sqrt.js';
import Triangle from '@/lib/graph/triangle.js';
import { renderGraph } from '@/lib/graph/renderer.js';

interface Exact {
  p: number;
  q: number;
}

interface SqrtMeta {
  window: { xmin: number; xmax: number; ymin: number; ymax: number };
  points: { x: number; y: number; role: string }[];
  line: { k: Exact; b: Exact } | null;
}

/** SVG с треугольником или null — у задачи нет прямой. */
export function sqrtTriangleSvg(meta: unknown): string | null {
  const m = meta as SqrtMeta;
  if (m.line === null) {
    return null;
  }
  const A = m.points.find((p) => p.role === 'cross');
  const P = m.points.find((p) => p.role === 'line');
  if (A === undefined || P === undefined) {
    return null;
  }
  const line = Line.create(m.line.k, m.line.b);
  const triangle = Triangle.build(line, m.window, [
    { x: A.x, y: A.y },
    { x: P.x, y: P.y },
  ]);
  if (triangle === null) {
    return null;
  }
  return renderGraph(Sqrt.sceneWith(meta, Triangle.shapes(triangle))) as string;
}
