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
import type { PrepSkillId } from '@/content/prepSkills';
import { playground as PLAY } from '@/content/theoryQuadratic';

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


/**
 * Парабола и прямая на одном чертеже: вкладка «О задании»
 * квадратичной подтемы, там, где у линейной стоят две прямые.
 *
 * Коэффициенты подобраны так, чтобы обе точки пересечения — (−2; 0)
 * и (3; 2,5) — лежали внутри окна, а вершина (0; −2) читалась
 * в узле сетки. Числа здесь — параметры чертежа, не содержание
 * задания.
 */
export function parabolaAndLineScene() {
  return {
    window: squareWindow(6),
    grid: { step: 1, show: true },
    axes: { labelX: 'x', labelY: 'y', origin: '0' },
    axisLabels: 'minimal',
    curves: [
      { type: 'quadratic', a: 0.5, b: 0, c: -2, color: 'lineA', label: 'y = ax² + bx + c' },
      { type: 'line', k: 0.5, b: 1, color: 'lineB', label: 'y = kx + b' },
    ],
    points: [],
    alt: 'Парабола y = ax² + bx + c и прямая y = kx + b',
  };
}

/**
 * Чертёж вкладки «О задании» по подтеме: у линейной — две прямые,
 * у квадратичной — парабола и прямая.
 */
export function aboutScene(type: FunctionTypeId) {
  return type === 'quadratic' ? parabolaAndLineScene() : compareLinesScene();
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
    /* Оси с засечками, но без чисел: в карточке шириной сто пикселей
       цифры всё равно нечитаемы, а обрезанными они выглядят грязью. */
    axisLabels: 'none',
    curves: [{ ...preset.curve, color: 'lineA', label: null }],
    points: [],
    shapes: [],
  };
}


/* ── Миниатюры навыков ────────────────────────────────────────────
   Навык — набор прототипов; по одной картинке на набор: что дано
   и что ищут. Искомая координата показана пунктиром до оси — тем же
   приёмом, что катеты в разборе. Числа — параметры чертежа.

   Окно тесное, как у карточек подготовки: клетка крупнее, и в
   карточке шириной 120px сетка и буквы осей ещё читаются. Чисел на
   осях нет — они превращались бы в крошки. */

const SKILL_HALF = 2;

/** Прямая для 12.A и 12.B и точка на ней. */
const SKILL_LINE = { k: 0.6, b: 0.5 };
const SKILL_PROBE = { x: 1.4, y: 1.34 };

/** Две прямые для 12.C и 12.D; пересекаются внутри окна. */
const SKILL_PAIR = [
  { k: 0.75, b: 0.5 },
  { k: -0.5, b: 1.5 },
];
const SKILL_CROSS = { x: 0.8, y: 1.1 };

function dashed(from: [number, number], to: [number, number]) {
  return { type: 'segment', from, to, color: 'accent', style: 'dashed' };
}

export function generatorSkillScene(setId: string) {
  const base = {
    window: squareWindow(SKILL_HALF),
    grid: { step: 1, show: true },
    axes: { labelX: 'x', labelY: 'y', origin: '0' },
    axisLabels: 'none',
    curves: [] as unknown[],
    points: [] as unknown[],
    shapes: [] as unknown[],
  };
  const probe = { ...SKILL_PROBE, style: 'solid', color: 'lineB', label: null };
  const cross = { ...SKILL_CROSS, style: 'solid', color: 'lineB', label: null };

  if (setId === '12.A') {
    /* Дан x — ищут y: пунктир от оси абсцисс к точке. */
    return {
      ...base,
      curves: [{ type: 'line', ...SKILL_LINE, color: 'lineA', label: null }],
      points: [probe],
      shapes: [dashed([SKILL_PROBE.x, 0], [SKILL_PROBE.x, SKILL_PROBE.y])],
    };
  }
  if (setId === '12.B') {
    /* Дан y — ищут x: пунктир от оси ординат к точке. */
    return {
      ...base,
      curves: [{ type: 'line', ...SKILL_LINE, color: 'lineA', label: null }],
      points: [probe],
      shapes: [dashed([0, SKILL_PROBE.y], [SKILL_PROBE.x, SKILL_PROBE.y])],
    };
  }
  const pair = [
    { type: 'line', ...SKILL_PAIR[0], color: 'lineA', label: null },
    { type: 'line', ...SKILL_PAIR[1], color: 'lineB', label: null },
  ];
  if (setId === '12.C') {
    return {
      ...base,
      curves: pair,
      points: [cross],
      shapes: [dashed([SKILL_CROSS.x, 0], [SKILL_CROSS.x, SKILL_CROSS.y])],
    };
  }
  if (setId === '12.D') {
    return {
      ...base,
      curves: pair,
      points: [cross],
      shapes: [dashed([0, SKILL_CROSS.y], [SKILL_CROSS.x, SKILL_CROSS.y])],
    };
  }
  /* Набор без своей картинки: одна прямая, без точек. Такого набора
     в данных нет — ветка на случай, если появится. */
  return { ...base, curves: [{ type: 'line', ...SKILL_LINE, color: 'lineA', label: null }] };
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


/* ── Проверка вертикальной линией ─────────────────────────────────
   Окружность пересекается с вертикальной прямой в двух точках —
   значит, графиком функции она не является. Точки пересечения
   отмечены цветом нарушения: тем же, что у бейджа «НЕ ФУНКЦИЯ». */

export function verticalTestScene() {
  return {
    window: squareWindow(3),
    grid: { step: 1, show: true },
    axes: { labelX: 'x', labelY: 'y', origin: '0' },
    axisLabels: 'minimal',
    curves: [],
    /* Точки пересечения: (0, 2) и (0, −2). */
    points: [
      { x: 0, y: 2, color: 'wrong', label: null },
      { x: 0, y: -2, color: 'wrong', label: null },
    ],
    shapes: [
      { type: 'circle', at: [0, 0], radius: 2, color: 'lineA', width: 3.2 },
      /* Прямая x = 0 совпадает с осью y, поэтому рисуется пунктиром:
         сплошная слилась бы с осью и проверять было бы нечем. */
      { type: 'segment', from: [0, -3], to: [0, 3], color: 'lineA', style: 'dashed' },
      { type: 'label', at: [0, -2.6], offset: [10, 0], text: 'x = 0', color: 'lineA' },
      /* Засечки 2 и −2 — ординаты точек пересечения. Ставятся слева
         от оси, как остальные числа: axisLabels: 'minimal' подписывает
         только 0 и ±1. */
      { type: 'label', at: [0, 2], offset: [-14, 0], text: '2', color: 'label' },
      { type: 'label', at: [0, -2], offset: [-14, 0], text: '\u22122', color: 'label' },
    ],
  };
}


/* ── Миниатюры навыков подготовительных задач ─────────────────────
   Значок рядом с названием навыка: каждая миниатюра показывает суть
   своего навыка, а не просто прямую.

   Кегль подписей задан числом: холст 416px ужимается до 112, и
   штатные 19px вышли бы пятью пикселями на экране. Толщину линий
   спасает vector-effect в стилях — иначе график в 3,2px рисуется
   в 0,86 и бледнеет до сетки. */

/* Тот же список, что и у самих навыков: держать его здесь вторым
   значило бы однажды добавить навык и забыть про миниатюру. Сборка
   это ловит, но ловит поздно. */
export type PrepSkillSceneId = PrepSkillId;

/** Кегль подписи в миниатюре: на экране это около двенадцати пунктов. */
const PREP_LABEL = 34;

function prepLabel(
  text: string,
  x: number,
  y: number,
  dx: number,
  dy: number,
  color = 'label',
  size = PREP_LABEL,
) {
  return { type: 'label', at: [x, y], offset: [dx, dy], text, size, color };
}

export function prepSkillScene(id: PrepSkillSceneId) {
  const base = {
    /* Окно тесное: клетка крупнее, и подпись при том же кегле
       занимает меньшую долю поля — длинная формула перестаёт
       упираться в край холста. */
    window: squareWindow(2),
    /* Сетка нужна: по клеткам читаются Δx и Δy у треугольника. */
    grid: { step: 1, show: true },
    axes: { labelX: '', labelY: '', origin: '' },
    /* До появления режима 'none' в рендерере это слово падало в
       'minimal', и на осях стояли 1 и −1. Так карточки навыков и
       выпущены — режим закреплён явно, чтобы они не изменились. */
    axisLabels: 'minimal',
    curves: [] as unknown[],
    points: [] as unknown[],
    shapes: [] as unknown[],
  };

  if (id === 'k') {
    /* Треугольник наклона: катеты пунктиром, как в разборе решения. */
    return {
      ...base,
      curves: [{ type: 'line', k: 1, b: 0, color: 'lineA', label: null }],
      points: [
        { x: -0.8, y: -0.8, color: 'lineA', label: null },
        { x: 0.8, y: 0.8, color: 'lineA', label: null },
      ],
      shapes: [
        { type: 'segment', from: [-0.8, -0.8], to: [0.8, -0.8], color: 'accent', style: 'dashed' },
        { type: 'segment', from: [0.8, -0.8], to: [0.8, 0.8], color: 'accent', style: 'dashed' },
        /* Опорные точки подписей отведены от самих катетов: движок
           ставит подпись рядом с точкой, и стоя на катете она на него
           же и наезжала. */
        prepLabel('\u0394x', 0, -1.25, 0, 14, 'accent'),
        prepLabel('\u0394y', 1.3, 0, 14, 0, 'accent'),
      ],
    };
  }

  if (id === 'b') {
    return {
      ...base,
      curves: [{ type: 'line', k: 0.9, b: 1, color: 'lineA', label: null }],
      points: [{ x: 0, y: 1, color: 'lineA', label: null }],
      shapes: [prepLabel('b', 0, 1, -20, 0)],
    };
  }

  if (id === 'b-point') {
    /* Отличие от карточки «по графику» — на самом чертеже: прямая
       пересекает ось Oy посередине клетки, читать там нечего.
       Зато на прямой стоит точка в узле: её и подставляют. */
    return {
      ...base,
      curves: [{ type: 'line', k: 0.5, b: 0.5, color: 'lineA', label: null }],
      points: [{ x: 1, y: 1, color: 'lineA', label: null }],
      shapes: [prepLabel('b', 0, 0.5, -20, 0), prepLabel('?', 0, 0.5, 18, 0)],
    };
  }

  if (id === 'point') {
    return {
      ...base,
      curves: [{ type: 'line', k: 0.9, b: 0, color: 'lineA', label: null }],
      /* Точка стоит в стороне от прямой: вопрос навыка именно в том,
         лежит она на ней или нет. */
      points: [{ x: 1, y: 1.6, color: 'lineA', label: null }],
      shapes: [prepLabel('A', 1, 1.6, 20, 0)],
    };
  }

  return {
    ...base,
    curves: [{ type: 'line', k: 0.7, b: -0.7, color: 'lineA', label: null }],
    /* Формулы «y = kx + b» внутри чертежа нет: при читаемом кегле она
       шире поля — 161 пиксель на холсте в 212, и движок вытесняет её
       за кромку. Подпись отсюда убрана до решения, где ей стоять. */
    shapes: [],
  };
}


/* ── Чертежи теории квадратичной функции ──────────────────────
   По одному чертежу на карточку раздела: парабола, отмеченные
   точки, ось симметрии пунктиром, подписи. Числа здесь — параметры
   чертежа, они же стоят в текстах карточек (content/theoryQuadratic.ts).

   Окно бывает прямоугольным: у обычной параболы y = x² стандартные
   точки доходят до 9, и квадратное окно ±9 сделало бы клетку крошкой.
   Чертёж декоративный, рядом стоит текст карточки: alt не задаётся,
   и график не читается вслух дважды. */

export type QuadraticTheorySceneId =
  | 'parabola-vertex-axis'
  | 'a-zero'
  | 'a-sign'
  | 'x-squared'
  | 'a-width'
  | 'a-step'
  | 'c-read'
  | 'c-offscreen'
  | 'vertex-formula'
  | 'b-sign'
  | 'path-vertex'
  | 'path-system'
  | 'symmetry'
  | 'shift-vertex'
  | 'shift-points'
  | 'complete-square'
  | 'roots-form'
  | 'roots-vertex'
  | 'two-roots'
  | 'no-roots'
  | 'physics'
  | 'inequality'
  | 'level-line'
  | 'family';

function windowOf(xmin: number, xmax: number, ymin: number, ymax: number) {
  return { xmin, xmax, ymin, ymax };
}

function parabola(a: number, b: number, c: number, extra: Record<string, unknown> = {}) {
  return { type: 'quadratic', a, b, c, color: 'lineA', label: null, ...extra };
}

/** Парабола через вершину: y = a(x − m)² + n. */
function fromVertex(a: number, m: number, n: number, extra: Record<string, unknown> = {}) {
  return parabola(a, -2 * a * m, a * m * m + n, extra);
}

/** Типографский минус в подписях чертежа. */
const MINUS = '−';

function coordinate(value: number) {
  return String(value).replace('-', MINUS).replace('.', ',');
}

/** Подпись точки координатами: «(1; −4)». */
function pointLabel(x: number, y: number) {
  return `(${coordinate(x)}; ${coordinate(y)})`;
}

function mark(x: number, y: number, labelled = false, color = 'lineA') {
  return { x, y, style: 'solid', color, label: labelled ? pointLabel(x, y) : null };
}

function dashedSegment(from: [number, number], to: [number, number], color = 'accent') {
  return { type: 'segment', from, to, color, style: 'dashed' };
}

function note(text: string, at: [number, number], offset: [number, number], color = 'accent') {
  return { type: 'label', at, offset, text, color };
}

/** Стрелка: отрезок и треугольник на конце, в клетках. */
function arrow(from: [number, number], to: [number, number], color = 'accent') {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const length = Math.hypot(dx, dy);
  const ux = dx / length;
  const uy = dy / length;
  const head = 0.42;
  const half = 0.2;
  const base: [number, number] = [to[0] - ux * head, to[1] - uy * head];
  return [
    { type: 'segment', from, to: base, color },
    {
      type: 'polygon',
      color,
      fillOpacity: 1,
      points: [to, [base[0] - uy * half, base[1] + ux * half], [base[0] + uy * half, base[1] - ux * half]],
    },
  ];
}

function theoryBase(win: { xmin: number; xmax: number; ymin: number; ymax: number }) {
  return {
    window: win,
    grid: { step: 1, show: true },
    axes: { labelX: 'x', labelY: 'y', origin: '0' },
    axisLabels: 'minimal',
    curves: [] as unknown[],
    points: [] as unknown[],
    shapes: [] as unknown[],
  };
}

export function quadraticTheoryScene(id: QuadraticTheorySceneId) {
  switch (id) {
    /* 1. Вершина и ось симметрии: y = x² − 2x − 3, вершина (1; −4). */
    case 'parabola-vertex-axis':
      return {
        ...theoryBase(squareWindow(5)),
        curves: [parabola(1, -2, -3)],
        points: [mark(1, -4, true)],
        shapes: [dashedSegment([1, -5], [1, 5]), note('x = 1', [1, 4.2], [26, 0])],
      };

    /* 1. Почему a ≠ 0: парабола y = x² + 1 и прямая y = x + 1. */
    case 'a-zero':
      return {
        ...theoryBase(squareWindow(4)),
        curves: [
          parabola(1, 0, 1, { label: 'a ≠ 0' }),
          { type: 'line', k: 1, b: 1, color: 'lineB', label: 'a = 0' },
        ],
      };

    /* 2. Направление ветвей: y = 0,5x² − 3 и y = −0,5x² + 3. */
    case 'a-sign':
      return {
        ...theoryBase(squareWindow(5)),
        curves: [
          parabola(0.5, 0, -3, { label: 'a > 0' }),
          parabola(-0.5, 0, 3, { color: 'lineB', label: 'a < 0' }),
        ],
        points: [mark(0, -3), mark(0, 3, false, 'lineB')],
      };

    /* 2. Обычная парабола со стандартными точками. */
    case 'x-squared':
      return {
        ...theoryBase(windowOf(-4, 4, -1, 10)),
        curves: [parabola(1, 0, 0, { label: 'y = x²' })],
        points: [-3, -2, -1, 0, 1, 2, 3].map((x) => mark(x, x * x, true)),
      };

    /* 2. Уже или шире: эталон пунктиром, y = 2x² и y = 0,5x². Окно
       тесное, чтобы три подписи у x = 1 не слипались; параболы
       узнаются по своим точкам, подписана только эталонная. */
    case 'a-width':
      return {
        ...theoryBase(windowOf(-2, 3, -1, 5)),
        curves: [
          parabola(1, 0, 0, { style: 'dashed', label: 'y = x²' }),
          parabola(2, 0, 0),
          parabola(0.5, 0, 0, { color: 'lineB' }),
        ],
        points: [mark(1, 1, true), mark(1, 2, true), mark(1, 0.5, true, 'lineB')],
      };

    /* 2. Шаг от вершины: y = −2(x − 1)² + 3, вправо на 1 — вниз на 2. */
    case 'a-step':
      return {
        ...theoryBase(squareWindow(5)),
        curves: [fromVertex(-2, 1, 3)],
        points: [mark(1, 3), mark(2, 1)],
        shapes: [
          dashedSegment([1, 3], [2, 3]),
          dashedSegment([2, 3], [2, 1]),
          /* Подпись вершины уходит влево-вверх: справа от неё ступенька. */
          note(pointLabel(1, 3), [1, 3], [-40, -14], 'lineA'),
          note('1', [1.5, 3], [0, -14]),
          note('2', [2, 2], [16, 0]),
          note(`a = ${MINUS}2`, [3.2, 1], [30, 8]),
        ],
      };

    /* 3. c с графика: y = x² − 2x − 3, точка (0; −3). */
    case 'c-read':
      return {
        ...theoryBase(squareWindow(5)),
        curves: [parabola(1, -2, -3)],
        points: [mark(0, -3, true)],
        shapes: [note(`c = ${MINUS}3`, [0, -3], [-52, 14])],
      };

    /* 3. Точка (0; c) за кадром: y = (x − 5)² − 2 в окне ±6. */
    case 'c-offscreen':
      return {
        ...theoryBase(squareWindow(6)),
        curves: [fromVertex(1, 5, -2)],
        points: [mark(5, -2, true)],
        shapes: [
          /* Стрелка идёт рядом с левой ветвью, левее её, вверх за рамку. */
          ...arrow([2.0, 3.4], [1.5, 5.8]),
          note('(0; c) за кадром', [0.6, 4.6], [-40, 0]),
        ],
      };

    /* 4. Формула вершины: y = x² − 6x + 5, вершина (3; −4). */
    case 'vertex-formula':
      return {
        ...theoryBase(squareWindow(6)),
        curves: [parabola(1, -6, 5)],
        points: [mark(3, -4, true)],
        shapes: [dashedSegment([3, -4], [3, 0]), note('xв = 3', [3, 0.6], [30, -8])],
      };

    /* 4. Знак b без счёта: вершины справа и слева от Oy. */
    case 'b-sign':
      return {
        ...theoryBase(squareWindow(5)),
        curves: [
          fromVertex(1, 2, -1, { label: 'b < 0' }),
          fromVertex(1, -2, -1, { color: 'lineB', label: 'b > 0' }),
        ],
        points: [mark(2, -1), mark(-2, -1, false, 'lineB')],
      };

    /* 4. Путь через вершину: та же парабола, вершина подписана. */
    case 'path-vertex':
      return {
        ...theoryBase(squareWindow(6)),
        curves: [parabola(1, -6, 5, { label: 'y = x² + bx + 5' })],
        points: [mark(3, -4, true)],
      };

    /* 4. Путь через систему: три несимметричные точки. */
    case 'path-system':
      return {
        ...theoryBase(windowOf(-2, 7, -2, 9)),
        curves: [parabola(1, -4, 3)],
        points: [mark(0, 3, true), mark(1, 0, true), mark(5, 8, true)],
      };

    /* 4. Симметрия: пара (0; 3) и (4; 3), ось x = 2. */
    case 'symmetry':
      return {
        ...theoryBase(squareWindow(5)),
        curves: [parabola(1, -4, 3)],
        points: [mark(0, 3, true), mark(4, 3, true), mark(2, -1)],
        shapes: [
          dashedSegment([2, -5], [2, 5]),
          ...arrow([2, 3], [0.35, 3]),
          ...arrow([2, 3], [3.65, 3]),
          note('x = 2', [2, 4.3], [28, 0]),
        ],
      };

    /* 5. Сдвиг: эталон пунктиром, y = (x − 2)² + 1, стрелка вершин. */
    case 'shift-vertex':
      return {
        ...theoryBase(squareWindow(5)),
        /* Подписана только эталонная: формула сдвинутой стоит в тексте,
           а две подписи в тесном окне садились друг на друга. */
        curves: [parabola(1, 0, 0, { style: 'dashed', label: 'y = x²' }), fromVertex(1, 2, 1)],
        points: [mark(0, 0), mark(2, 1, true)],
        shapes: arrow([0, 0], [2, 1]),
      };

    /* 5. Вершина и стандартные точки от неё. */
    case 'shift-points':
      return {
        ...theoryBase(squareWindow(6)),
        curves: [fromVertex(1, 2, 1)],
        points: [mark(2, 1, true), mark(1, 2), mark(3, 2), mark(0, 5, true), mark(4, 5, true)],
      };

    /* 5. Выделение полного квадрата: y = (x + 3)² − 2. */
    case 'complete-square':
      return {
        ...theoryBase(squareWindow(6)),
        curves: [fromVertex(1, -3, -2, { label: 'y = (x + 3)² − 2' })],
        points: [mark(-3, -2, true)],
      };

    /* 6. Форма через нули: y = (x − 3)(x − 5). */
    case 'roots-form':
      return {
        ...theoryBase(windowOf(-1, 7, -2, 6)),
        curves: [parabola(1, -8, 15)],
        points: [mark(3, 0, true), mark(5, 0, true)],
      };

    /* 6. Вершина посередине между нулями. */
    case 'roots-vertex':
      return {
        ...theoryBase(windowOf(-1, 7, -2, 6)),
        curves: [parabola(1, -8, 15)],
        points: [mark(3, 0), mark(5, 0), mark(4, -1, true)],
        shapes: [dashedSegment([4, -2], [4, 6]), note('x = 4', [4, 5.2], [28, 0])],
      };

    /* 6. Два корня уравнения f(x) = 3: симметричны относительно оси
       параболы, до каждого от вершины ровно две клетки. */
    case 'two-roots':
      return {
        ...theoryBase(windowOf(-1, 7, -2, 6)),
        curves: [parabola(1, -8, 15), { type: 'line', k: 0, b: 3, color: 'lineB', label: 'y = 3' }],
        points: [mark(2, 3, true, 'lineB'), mark(6, 3, true, 'lineB'), mark(4, -1)],
        shapes: [
          dashedSegment([4, -2], [4, 6]),
          ...arrow([4, 3], [2.35, 3]),
          ...arrow([4, 3], [5.65, 3]),
          note('x = 4', [4, 5.2], [28, 0]),
        ],
      };

    /* 6. Нулей нет: параболы целиком выше и целиком ниже оси Ox. */
    case 'no-roots':
      return {
        ...theoryBase(squareWindow(5)),
        curves: [fromVertex(1, 2, 1), fromVertex(-1, -2, -1, { color: 'lineB' })],
        points: [mark(2, 1), mark(-2, -1, false, 'lineB')],
      };

    /* 7. Полёт: h = −t² + 4t, вершина (2; 4), падение при t = 4. */
    case 'physics':
      return {
        ...theoryBase(windowOf(-1, 5, -1, 5)),
        axes: { labelX: 't', labelY: 'h', origin: '0' },
        curves: [parabola(-1, 4, 0)],
        points: [mark(2, 4), mark(4, 0)],
      };

    /* 7. Неравенство: y = x² − 4, участок под осью залит. */
    case 'inequality': {
      const region: [number, number][] = [];
      for (let x = -2; x <= 2 + 1e-9; x += 0.25) {
        region.push([x, x * x - 4]);
      }
      return {
        ...theoryBase(squareWindow(5)),
        curves: [parabola(1, 0, -4)],
        points: [mark(-2, 0), mark(2, 0)],
        shapes: [
          { type: 'polygon', points: region, color: 'lineB', fillOpacity: 0.18 },
          note('y < 0', [0, -2.4], [0, 0]),
          note('y > 0', [-3.6, 2.6], [0, 0]),
          note('y > 0', [3.6, 2.6], [0, 0]),
        ],
      };
    }

    /* 7. Уровень: y = x² − 2 и прямая y = 2, точки пересечения (±2; 2). */
    case 'level-line':
      return {
        ...theoryBase(squareWindow(5)),
        curves: [parabola(1, 0, -2), { type: 'line', k: 0, b: 2, color: 'lineB', label: 'y = h' }],
        points: [mark(-2, 2, false, 'lineB'), mark(2, 2, false, 'lineB')],
        shapes: [dashedSegment([-2, 2], [-2, 0]), dashedSegment([2, 2], [2, 0])],
      };

    /* 7. Семейство y = x² + px: вершина скользит при p = −2, 0, 2. */
    case 'family':
      return {
        ...theoryBase(squareWindow(4)),
        curves: [
          parabola(1, 0, 0, { style: 'dashed', label: 'p = 0' }),
          parabola(1, -2, 0, { label: `p = ${MINUS}2` }),
          parabola(1, 2, 0, { color: 'lineB', label: 'p = 2' }),
        ],
        points: [mark(0, 0), mark(1, -1), mark(-1, -1, false, 'lineB')],
      };
  }
}


/* ── Интерактив «Поиграй с параболой» ─────────────────────────
   Эталон y = x² пунктиром со стандартными точками, живая парабола
   y = ax² + c сплошной с точками при x = ±1, ±2. Точки у самой рамки
   и за ней не рисуются: подпись прилипала бы к краю. При a = 0
   квадрата нет, и живая кривая — прямая y = c. Числа окна и точек —
   в конфиге блока (content/theoryQuadratic.ts). */

/** Точка не ближе клетки к рамке окна: подписи есть где встать. */
function deepInside(x: number, y: number) {
  const win = PLAY.window;
  return x > win.xmin + 1 - 1e-9 && x < win.xmax - 1 + 1e-9 &&
    y > win.ymin + 1 - 1e-9 && y < win.ymax - 1 + 1e-9;
}

export function playgroundScene(a: number, c: number) {
  const live = a === 0
    ? { type: 'line', k: 0, b: c, color: 'lineA', label: null }
    : parabola(a, 0, c);
  const standard = PLAY.standardAt
    .filter((x) => deepInside(x, x * x))
    .map((x) => mark(x, x * x, true, 'lineB'));
  /* Точка живой параболы, совпавшая со стандартной, не рисуется второй
     раз: при a = 1 и c = 0 подписи легли бы одна на другую. */
  const marks = a === 0
    ? []
    : PLAY.markAt
        .map((x) => ({ x, y: Math.round((a * x * x + c) * 100) / 100 }))
        .filter((point) => deepInside(point.x, point.y) && point.y !== point.x * point.x)
        .map((point) => mark(point.x, point.y, true));
  return {
    ...theoryBase(PLAY.window),
    curves: [parabola(1, 0, 0, { color: 'lineB', style: 'dashed' }), live],
    points: [...standard, ...marks],
  };
}
