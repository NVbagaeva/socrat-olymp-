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


/* ── Чертежи раздела «Какие бывают функции» ───────────────────────
   Четыре известных графика. В отличие от миниатюр типов сетка и
   подписи осей включены: карточка заметно крупнее значка, и по
   клеткам видно, что это чертёж, а не пиктограмма.

   Чертёж декоративный: рядом стоят название и формула, поэтому alt
   не задаётся и график не читается вслух дважды. */

export type KindId = 'linear' | 'quadratic' | 'rational' | 'sqrt';

/* Коэффициенты подобраны так, чтобы в окне читалась характерная
   форма: прямая идёт через оба края, у параболы видны обе ветви и
   вершина, у гиперболы — обе ветви, у корня — начало в нуле. */
const KINDS: Record<KindId, Curve> = {
  linear: { type: 'line', k: 0.8, b: 1 },
  quadratic: { type: 'quadratic', a: 1, b: 0, c: -2 },
  rational: { type: 'rational', k: 3, b: 0 },
  sqrt: { type: 'sqrt', a: 1, c: 0 },
};

export function kindScene(id: KindId) {
  return {
    window: squareWindow(5),
    grid: { step: 1, show: true },
    axes: { labelX: 'x', labelY: 'y', origin: '' },
    axisLabels: 'minimal',
    curves: [{ ...KINDS[id], color: 'lineA', label: null }],
    points: [],
    shapes: [],
  };
}


/* ── Чертежи раздела «Когда график не функция» ────────────────────
   Четыре прямые в одном окне и одном масштабе: карточки стоят рядом,
   и разный масштаб читался бы разным наклоном.

   Вертикальная прямая — не функция, кривой вида y = kx + b её не
   задать, поэтому она рисуется фигурой-отрезком. Точки на ней —
   те самые разные y при одном x, ради которых раздел и написан.

   Подписи прямых расставлены фигурами, а не полем label у кривой:
   автоподбор места рассчитан на крупные чертежи тренажёра и на
   карточке в 280 пикселей жмёт подпись к началу координат, под числа
   осей. У фигуры точка — опорная: движок ставит подпись рядом с ней
   и обходит препятствия, а offset задаёт предпочтительную сторону. */

export type LineKindId = 'horizontal' | 'vertical' | 'bisector' | 'antibisector';

/** Общая часть всех четырёх чертежей: окно, сетка и оси. */
function lineKindBase() {
  return {
    window: squareWindow(3),
    grid: { step: 1, show: true },
    axes: { labelX: 'x', labelY: 'y', origin: '0' },
    axisLabels: 'minimal',
    curves: [] as unknown[],
    points: [] as unknown[],
    shapes: [] as unknown[],
  };
}

/** Подпись прямой: синяя, как сама прямая. dx и dy — сторона, в
    которую её отводить от опорной точки. */
function lineLabel(text: string, x: number, y: number, dx: number, dy: number) {
  return { type: 'label', at: [x, y], offset: [dx, dy], text, color: 'lineA' };
}

export function lineKindScene(id: LineKindId) {
  const base = lineKindBase();

  if (id === 'horizontal') {
    return {
      ...base,
      curves: [{ type: 'line', k: 0, b: 1.5, color: 'lineA', label: null }],
      /* Точка b на оси y: подпись стоит слева от неё, чтобы не сесть
         на саму прямую. Цвет тёмный, как у остальных чисел оси. */
      points: [{ x: 0, y: 1.5, color: 'lineA', label: null }],
      shapes: [
        { type: 'label', at: [0, 1.5], offset: [-12, 5], text: 'b', anchor: 'end', color: 'label' },
        lineLabel('y = b', 1.6, 1.5, 8, -8),
      ],
    };
  }

  if (id === 'vertical') {
    return {
      ...base,
      shapes: [
        { type: 'segment', from: [1.5, -3], to: [1.5, 3], color: 'lineA' },
        lineLabel('x = a', 1.5, 2.2, 8, 0),
        { type: 'label', at: [1.5, 0], offset: [-4, 20], text: 'a', anchor: 'end', color: 'label' },
      ],
      /* Пять значений y при одном и том же x — то, что делает эту
         прямую не графиком функции. */
      points: [-2, -1, 0, 1, 2].map((y) => ({ x: 1.5, y, color: 'lineA', label: null })),
    };
  }

  const up = id === 'bisector';
  return {
    ...base,
    curves: [{ type: 'line', k: up ? 1 : -1, b: 0, color: 'lineA', label: null }],
    points: [{ x: 2, y: up ? 2 : -2, color: 'lineA', label: null }],
    /* Типографский минус, а не дефис: в подписях чертежа проект
       набирает его именно так. */
    shapes: [
      up ? lineLabel('y = x', 1.8, 1.8, -8, -8) : lineLabel('y = \u2212x', 1.8, -1.8, 8, 8),
    ],
  };
}
