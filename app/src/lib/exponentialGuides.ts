/**
 * Чертёж задачи о показательной функции со вспомогательными
 * построениями: пунктиры от отмеченных точек к осям — по ним читаются
 * координаты, которые идут в систему уравнений.
 *
 * Показывается только в подсказке тренажёра, в разборе опорной задачи
 * и на листе учителя. У ученика на листе и в заданиях для отработки —
 * чертёж задачи как есть, без построений.
 */

import Exponential from '@/lib/graph/generate-exponential.js';
import { renderGraph } from '@/lib/graph/renderer.js';

/** Сцена с построениями. */
export function exponentialGuideScene(meta: unknown): unknown {
  return Exponential.sceneWith(meta, Exponential.guideShapes(meta));
}

/** SVG с построениями. */
export function exponentialGuideSvg(meta: unknown): string {
  return renderGraph(exponentialGuideScene(meta)) as string;
}
