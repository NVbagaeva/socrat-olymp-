/**
 * Описания сцен для чертежей движка graph/.
 *
 * Здесь только данные: окно, кривые, точки. Рисует их renderGraph —
 * своего SVG для чертежей в проекте нет.
 *
 * Движок знает шесть семейств: прямая зарегистрирована в самом
 * рендерере, остальные пять — модулями в graph/families. Импорт
 * families/index.js и выполняет эту регистрацию.
 */

import '@/lib/graph/families/index.js';
import type { FunctionTypeId } from '@/data/functionTypes';

/** Квадратное симметричное окно — иного renderGraph не принимает. */
function squareWindow(half: number) {
  return { xmin: -half, xmax: half, ymin: -half, ymax: half };
}

export interface LineSceneOptions {
  k: number;
  b: number;
  /** Половина стороны окна в клетках. */
  half?: number;
  /** Подпись чертежа для скринридера. Без неё чертёж считается декором. */
  alt?: string;
  /** Подпись самой прямой на поле. */
  label?: string | null;
}

/** Сцена с одной прямой: используется и как декор, и как миниатюра. */
export function lineScene({ k, b, half = 6, alt, label = null }: LineSceneOptions) {
  return {
    window: squareWindow(half),
    grid: { step: 1, show: true },
    axes: { labelX: 'x', labelY: 'y', origin: '0' },
    axisLabels: 'minimal',
    curves: [{ type: 'line', k, b, color: 'lineA', label }],
    points: [],
    ...(alt === undefined ? {} : { alt }),
  };
}


/**
 * Сравнение двух прямых на одном чертеже.
 *
 * Движку для этого ничего не добавлялось: поле curves всегда было
 * списком, а второй цвет lineB в теме уже есть. Коэффициенты подобраны
 * так, чтобы прямые пересекались внутри окна и различались наклоном.
 */
export function compareLinesScene() {
  return {
    window: squareWindow(6),
    grid: { step: 1, show: true },
    axes: { labelX: 'x', labelY: 'y', origin: '0' },
    axisLabels: 'minimal',
    curves: [
      { type: 'line', k: 1, b: 1, color: 'lineA', label: 'y = k₁x + b₁' },
      { type: 'line', k: -0.5, b: -2, color: 'lineB', label: 'y = k₂x + b₂' },
    ],
    points: [],
    alt: 'Две прямые: y = k₁x + b₁ и y = k₂x + b₂',
  };
}


/* ── Миниатюры типов функций ──────────────────────────────────────
   По одному представителю на семейство: коэффициенты подобраны так,
   чтобы кривая в окне читалась характерной формой, а не куском.
   Числа здесь — параметры чертежа, а не содержание задания. */

interface Curve {
  type: string;
  [key: string]: unknown;
}

const PREVIEW: Record<FunctionTypeId, { curve: Curve; half: number }> = {
  linear: { curve: { type: 'line', k: 1, b: 0.5 }, half: 3 },
  quadratic: { curve: { type: 'quadratic', a: 1, b: 0, c: -1.5 }, half: 3 },
  rational: { curve: { type: 'rational', k: 1.5, b: 0 }, half: 3 },
  logarithmic: { curve: { type: 'logarithmic', a: 2, c: 0 }, half: 3 },
  exponential: { curve: { type: 'exponential', a: 2, d: 0 }, half: 3 },
  trigonometric: { curve: { type: 'trigonometric', a: 2, b: 1.4, c: 0, d: 0 }, half: 3 },
};

/**
 * Миниатюра типа функции: одна кривая, только оси.
 *
 * Сетка выключена, окно тесное: в кадре 56px клетки сливаются в серое
 * пятно, а форма кривой — единственное, что должно читаться. Чертёж
 * декоративный — рядом стоят название и формула, поэтому alt не
 * задаётся и чертёж не читается вслух дважды.
 */
export function previewScene(id: FunctionTypeId) {
  const preset = PREVIEW[id];
  return {
    window: squareWindow(preset.half),
    grid: { step: 1, show: false },
    axes: { labelX: '', labelY: '', origin: '' },
    axisLabels: 'none',
    curves: [{ ...preset.curve, color: 'lineA', label: null }],
    points: [],
    shapes: [],
  };
}
