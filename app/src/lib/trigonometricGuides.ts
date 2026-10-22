/**
 * Чертёж задачи о тригонометрической функции со вспомогательными
 * построениями: пунктиры от отмеченных точек к осям — по ним читаются
 * координаты, которые идут в систему уравнений.
 *
 * Показывается только в подсказке тренажёра, в разборе опорной задачи
 * и на листе учителя. У ученика на листе и в заданиях для отработки —
 * чертёж задачи как есть, без построений.
 */

import Trigonometric from '@/lib/graph/generate-trigonometric.js';
import { renderGraph } from '@/lib/graph/renderer.js';

/** Сцена с построениями. */
export function trigonometricGuideScene(meta: unknown): unknown {
  return Trigonometric.sceneWith(meta, Trigonometric.guideShapes(meta));
}

/** SVG с построениями. */
export function trigonometricGuideSvg(meta: unknown): string {
  return renderGraph(trigonometricGuideScene(meta)) as string;
}
