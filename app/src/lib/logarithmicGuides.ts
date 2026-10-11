/**
 * Чертёж задачи о логарифмической функции со вспомогательными
 * построениями: пунктиры от отмеченных точек к осям — по ним читаются
 * координаты, которые идут в систему уравнений.
 *
 * Показывается только в подсказке тренажёра, в разборе опорной задачи
 * и на листе учителя. У ученика на листе и в заданиях для отработки —
 * чертёж задачи как есть, без построений.
 */

import Logarithmic from '@/lib/graph/generate-logarithmic.js';
import { renderGraph } from '@/lib/graph/renderer.js';

/** Сцена с построениями. */
export function logarithmicGuideScene(meta: unknown): unknown {
  return Logarithmic.sceneWith(meta, Logarithmic.guideShapes(meta));
}

/** SVG с построениями. */
export function logarithmicGuideSvg(meta: unknown): string {
  return renderGraph(logarithmicGuideScene(meta)) as string;
}
