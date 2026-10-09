/**
 * Рисунки разделов теории, свёрстанных блоками (content/theoryRich.ts):
 * линейная функция и график корня.
 *
 * Рисунок — сцена движка graph/ и подписи к ней. Сам SVG рисует
 * renderGraph; подписей внутри SVG нет вовсе — ни у осей, ни у углов,
 * ни у катетов. Все они идут отдельным списком и набираются KaTeX
 * поверх чертежа (components/tasks/theory/rich/KatexFigure.tsx):
 * математика на сайте — только KaTeX.
 *
 * Подпись привязана к точке чертежа в математических координатах и
 * сдвинута от неё на dx, dy пикселей натурального размера чертежа:
 * при уменьшении на телефоне сдвиг уменьшается вместе с рисунком.
 *
 * Числа здесь — параметры чертежей; те же числа стоят в текстах
 * разделов (content/theoryLinear.ts, content/theoryIrrational.ts).
 */

import { THEME } from '@/lib/graph/renderer.js';
import '@/lib/graph/families/sqrt.js';

/* Цвет второго угла (180° − α): острый угол внутри треугольника
   выделен не цветом подсказки, а своим. Ключ добавляется в THEME —
   штатную точку настройки оформления движка, renderer.js не правится. */
const COLORS = THEME.colors as unknown as Record<string, string>;
COLORS.alt = 'var(--graph-alt, var(--color-success))';
/* Имена тонов подписей годятся и для линий чертежа. */
COLORS.primary = COLORS.lineA as string;
COLORS.ink = COLORS.axis as string;
COLORS.muted = 'var(--color-text-tertiary)';

export type FigureTone = 'ink' | 'primary' | 'accent' | 'alt' | 'muted';

export interface FigureLabel {
  /** Точка привязки в координатах чертежа. */
  at: [number, number];
  /** Подпись: формула $…$ или текст с формулами внутри. */
  text: string;
  /** Сдвиг от точки привязки, пиксели натурального размера чертежа. */
  dx?: number;
  dy?: number;
  tone?: FigureTone;
  /** Кегль в пикселях натурального размера. */
  size?: number;
  /** Чем подпись прижата к точке: серединой, левым или правым краем. */
  anchor?: 'center' | 'left' | 'right';
}

export interface TheoryFigure {
  scene: Record<string, unknown>;
  labels: FigureLabel[];
}

interface Win {
  xmin: number;
  xmax: number;
  ymin: number;
  ymax: number;
}

/* ── Общие куски ──────────────────────────────────────────────── */

function win(xmin: number, xmax: number, ymin: number, ymax: number): Win {
  return { xmin, xmax, ymin, ymax };
}

/**
 * Сцена с сеткой и осями без подписей: оси подписывает KaTeX.
 * cell — пикселей на клетку: у мелкой окружности клетка крупнее.
 */
function base(w: Win, grid = true, cell?: number) {
  return {
    window: w,
    grid: { step: 1, show: grid },
    axes: { labelX: '', labelY: '', origin: '' },
    axisLabels: 'none',
    curves: [] as unknown[],
    points: [] as unknown[],
    shapes: [] as unknown[],
    ...(cell === undefined ? {} : { cell }),
  };
}

/** Подписи осей: x, y, 0 и единичные деления — KaTeX. */
function axisLabels(w: Win, units = true): FigureLabel[] {
  const out: FigureLabel[] = [
    { at: [w.xmax, 0], text: '$x$', dx: 8, dy: 16 },
    { at: [0, w.ymax], text: '$y$', dx: 16, dy: 8 },
    { at: [0, 0], text: '$0$', dx: -10, dy: 13, size: 14 },
  ];
  if (units) {
    out.push({ at: [1, 0], text: '$1$', dy: 14, size: 13, tone: 'muted' });
    out.push({ at: [0, 1], text: '$1$', dx: -10, size: 13, tone: 'muted' });
  }
  return out;
}

function line(k: number, b: number, color = 'lineA') {
  return { type: 'line', k, b, color, label: null };
}

function sqrt(k: number, x0 = 0, y0 = 0, color = 'lineA') {
  return { type: 'sqrt', a: k, c: x0, d: y0, color, label: null };
}

function dot(x: number, y: number, color = 'lineA') {
  return { x, y, style: 'solid', color, label: null };
}

function seg(from: [number, number], to: [number, number], color = 'accent', dashed = true) {
  return { type: 'segment', from, to, color, ...(dashed ? { style: 'dashed' } : {}) };
}

function fill(points: [number, number][], color = 'accent') {
  return { type: 'polygon', points, color };
}

function arc(at: [number, number], from: number, to: number, radius: number, color = 'ink') {
  return { type: 'arc', at, from, to, radius, color };
}

function rightAngle(at: [number, number], alongX: number, alongY: number) {
  return { type: 'rightAngle', at, alongX, alongY, color: 'accent' };
}

const DEG = 180 / Math.PI;

/* ── Линейная функция ─────────────────────────────────────────── */

/* Возрастающая прямая y = 0,75x + 1,5: пересекает Ox в (−2; 0), через
   узел (2; 3). Треугольник под прямой: катеты 4 и 3. */
const RISE = { k: 0.75, b: 1.5, P: [-2, 0] as [number, number], Q: [2, 3] as [number, number] };
/* Убывающая y = −2/3·x + 2: пересекает Ox в (3; 0), через узел
   (−3; 4). Треугольник под прямой: катеты 6 и 4. */
const FALL = { k: -2 / 3, b: 2, P: [3, 0] as [number, number], Q: [-3, 4] as [number, number] };

function riseMini(): TheoryFigure {
  const w = win(-3, 3, -3, 3);
  return {
    scene: { ...base(w), curves: [line(0.8, 0.4)] },
    labels: [
      ...axisLabels(w, false),
      { at: [1.6, 2.1], text: '$k > 0$', tone: 'primary', anchor: 'right', dx: -6 },
    ],
  };
}

function fallMini(): TheoryFigure {
  const w = win(-3, 3, -3, 3);
  return {
    scene: { ...base(w), curves: [line(-0.8, 0.4)] },
    labels: [
      ...axisLabels(w, false),
      { at: [-1.6, 2.1], text: '$k < 0$', tone: 'primary', anchor: 'left', dx: 6 },
    ],
  };
}

/** Угол α: от положительного направления оси Ox до прямой. */
function angle(): TheoryFigure {
  const w = win(-4, 4, -2, 4);
  const deg = Math.atan(RISE.k) * DEG;
  return {
    scene: {
      ...base(w),
      curves: [line(RISE.k, RISE.b)],
      shapes: [seg(RISE.P, [3.6, 0], 'primary', false), arc(RISE.P, 0, deg, 1.4, 'accent')],
      points: [dot(...RISE.P)],
    },
    labels: [
      ...axisLabels(w),
      {
        at: [-2 + 1.75 * Math.cos(deg / 2 / DEG), 1.75 * Math.sin(deg / 2 / DEG)],
        text: '$\\alpha$',
        tone: 'accent',
        size: 20,
      },
    ],
  };
}

function rising(): TheoryFigure {
  const w = win(-4, 4, -2, 4);
  const deg = Math.atan(RISE.k) * DEG;
  const R: [number, number] = [RISE.Q[0], RISE.P[1]];
  return {
    scene: {
      ...base(w),
      curves: [line(RISE.k, RISE.b)],
      shapes: [
        fill([RISE.P, R, RISE.Q]),
        seg(RISE.P, R),
        seg(R, RISE.Q),
        rightAngle(R, -1, 1),
        arc(RISE.P, 0, deg, 1.2, 'accent'),
      ],
      points: [dot(...RISE.P), dot(...RISE.Q)],
    },
    labels: [
      ...axisLabels(w, false),
      { at: [0, 0], text: '$4$', dy: 16, dx: 18, tone: 'accent', size: 19 },
      { at: [2, 1.5], text: '$3$', dx: 14, tone: 'accent', size: 19 },
      {
        at: [-2 + 1.55 * Math.cos(deg / 2 / DEG), 1.55 * Math.sin(deg / 2 / DEG)],
        text: '$\\alpha$',
        tone: 'accent',
        size: 19,
      },
    ],
  };
}

/**
 * Убывающая прямая: α — тупой угол от положительного направления Ox
 * до прямой, большая дуга подписана α. Острый угол 180° − α — внутри
 * треугольника у точки пересечения с Ox, своим цветом.
 */
function falling(): TheoryFigure {
  const w = win(-4, 5, -2, 5);
  const beta = Math.atan(-FALL.k) * DEG; /* 180° − α */
  const alpha = 180 - beta;
  const R: [number, number] = [FALL.Q[0], FALL.P[1]];
  const at = (a: number, r: number): [number, number] => [
    FALL.P[0] + r * Math.cos(a / DEG),
    r * Math.sin(a / DEG),
  ];
  return {
    scene: {
      ...base(w),
      curves: [line(FALL.k, FALL.b)],
      shapes: [
        fill([FALL.P, R, FALL.Q]),
        seg(FALL.P, R),
        seg(R, FALL.Q),
        rightAngle(R, 1, 1),
        arc(FALL.P, 0, alpha, 0.7, 'primary'),
        arc(FALL.P, alpha, 180, 1.5, 'alt'),
        arc(FALL.P, alpha, 180, 1.35, 'alt'),
      ],
      points: [dot(...FALL.P), dot(...FALL.Q)],
    },
    labels: [
      ...axisLabels(w, false),
      { at: [0, 0], text: '$6$', dy: 16, dx: -26, tone: 'accent', size: 19 },
      { at: [-3, 2], text: '$4$', dx: -14, tone: 'accent', size: 19 },
      { at: at(alpha / 2, 0.7), text: '$\\alpha$', dx: 12, dy: -12, tone: 'primary', size: 20 },
      { at: [0.7, 0.55], text: '$180^\\circ - \\alpha$', tone: 'alt', size: 16 },
    ],
  };
}

/**
 * Тригонометрическая окружность с осью тангенсов x = 1.
 * β = 180° − α — острый угол, tg β = 2/3; α — тупой.
 * Луч β доходит до оси тангенсов сам: точка (1; tg β). Луч α уходит
 * влево — его продолжение через центр (пунктир) встречает ось
 * тангенсов в точке (1; tg α) = (1; −tg β): симметрично относительно Ox.
 */
function trigCircle(): TheoryFigure {
  const w = win(-1.4, 2.6, -1.3, 1.3);
  const t = 2 / 3;
  const beta = Math.atan(t) * DEG;
  const alpha = 180 - beta;
  const ca = Math.cos(alpha / DEG),
    sa = Math.sin(alpha / DEG);
  return {
    scene: {
      ...base(w, false, 150),
      shapes: [
        { type: 'circle', at: [0, 0], radius: 1, color: 'ink', width: 1.6 },
        { type: 'segment', from: [1, -1.25], to: [1, 1.25], color: 'ink', width: 2, arrow: true },
        seg([0, 0], [ca, sa], 'primary', false),
        seg([0, 0], [1, -t], 'primary'),
        seg([0, 0], [1, t], 'alt', false),
        seg([-0.05, t], [1, t], 'muted'),
        seg([-0.05, -t], [1, -t], 'muted'),
        arc([0, 0], 0, alpha, 0.22, 'primary'),
        arc([0, 0], 0, beta, 0.38, 'alt'),
        { type: 'dot', at: [1, t], color: 'alt' },
        { type: 'dot', at: [1, -t], color: 'primary' },
        { type: 'dot', at: [ca, sa], color: 'primary', radius: 4 },
      ],
    },
    labels: [
      { at: [w.xmax, 0], text: '$x$', dx: -4, dy: 16 },
      { at: [0, w.ymax], text: '$y$', dx: 14, dy: 10 },
      { at: [0, 0], text: '$O$', dx: -12, dy: 14, size: 15 },
      {
        at: [1, 1.25],
        text: 'ось тангенсов',
        dx: 8,
        dy: 4,
        size: 14,
        tone: 'muted',
        anchor: 'left',
      },
      {
        at: [0.22 * Math.cos(alpha / 2 / DEG), 0.22 * Math.sin(alpha / 2 / DEG)],
        text: '$\\alpha$',
        dx: 2,
        dy: -16,
        tone: 'primary',
        size: 18,
      },
      {
        at: [0.38 * Math.cos(beta / 2 / DEG), 0.38 * Math.sin(beta / 2 / DEG)],
        text: '$180^\\circ - \\alpha$',
        dx: 8,
        dy: 8,
        tone: 'alt',
        size: 15,
        anchor: 'left',
      },
      {
        at: [1, t],
        text: '$\\operatorname{tg}(180^\\circ - \\alpha) = -\\operatorname{tg} \\alpha$',
        dx: 12,
        tone: 'alt',
        size: 15,
        anchor: 'left',
      },
      {
        at: [1, -t],
        text: '$\\operatorname{tg} \\alpha$',
        dx: 12,
        tone: 'primary',
        size: 16,
        anchor: 'left',
      },
    ],
  };
}

/** Развилка шага 2: прямая пересекает Oy в узле сетки. */
function bNode(): TheoryFigure {
  const w = win(-3, 3, -1, 4);
  return {
    scene: { ...base(w), curves: [line(0.5, 2)], points: [dot(0, 2, 'accent')] },
    labels: [
      ...axisLabels(w),
      { at: [0, 2], text: '$b = 2$', dx: -12, dy: -14, tone: 'accent', anchor: 'right' },
    ],
  };
}

/** Развилка шага 2: прямая пересекает Oy между узлами. */
function bOff(): TheoryFigure {
  const w = win(-3, 3, -1, 4);
  return {
    scene: {
      ...base(w),
      curves: [line(2 / 3, 4 / 3)],
      points: [dot(-2, 0), dot(1, 2)],
      shapes: [{ type: 'dot', at: [0, 4 / 3], color: 'accent', radius: 4 }],
    },
    labels: [
      ...axisLabels(w),
      { at: [0, 4 / 3], text: '$b = \\,?$', dx: 12, dy: -12, tone: 'accent', anchor: 'left' },
      { at: [1, 2], text: '$(1;\\, 2)$', dx: -8, dy: -14, anchor: 'right', size: 15 },
    ],
  };
}

/* Разобранные примеры: те же числа, что в тексте раздела. */
function exValue(): TheoryFigure {
  const w = win(-2, 4, -3, 4);
  return {
    scene: {
      ...base(w),
      curves: [line(1.5, -2)],
      points: [dot(0, -2), dot(2, 1), dot(3, 2.5, 'lineB')],
      shapes: [
        fill([
          [0, -2],
          [2, -2],
          [2, 1],
        ]),
        seg([0, -2], [2, -2]),
        seg([2, -2], [2, 1]),
        seg([3, 0], [3, 2.5], 'lineB'),
      ],
    },
    labels: [
      ...axisLabels(w),
      { at: [1, -2], text: '$2$', dy: 15, tone: 'accent' },
      { at: [2, -0.5], text: '$3$', dx: 12, tone: 'accent' },
      { at: [3, 2.5], text: '$f(3)$', dx: 10, dy: -12, tone: 'accent', anchor: 'left' },
    ],
  };
}

/* Пример 8.2, «Найти x, если f(x) = …». Ответ нельзя прочитать с
   рисунка: искомая точка либо в окне, но x не в узле сетки (пример 1),
   либо за рамкой (пример 2). Подписи крупные и жирные: \boldsymbol. */

/** Пример 1: f(x) = −2/3·x + 1, f(x) = 4. Точка (−4,5; 4) в окне. */
function exArgumentVisible(): TheoryFigure {
  const w = win(-6, 5, -3, 6);
  const X = -4.5;
  const Y = 4;
  return {
    scene: {
      ...base(w),
      curves: [line(-2 / 3, 1)],
      points: [dot(0, 1), dot(3, -1), dot(X, Y, 'lineB')],
      shapes: [
        fill([
          [0, 1],
          [0, -1],
          [3, -1],
        ]),
        seg([0, -1], [3, -1]),
        seg([0, 1], [0, -1]),
        rightAngle([0, -1], 1, 1),
        /* Два пунктира от искомой точки: к Oy (значение 4) и к Ox. Тот,
           что к Ox, падает между вертикалями x = −5 и x = −4. */
        seg([X, Y], [0, Y], 'lineB'),
        seg([X, Y], [X, 0], 'lineB'),
      ],
    },
    labels: [
      ...axisLabels(w, false),
      { at: [1, 0], text: '$1$', dy: 14, size: 13, tone: 'muted' },
      /* Деление y = 1 стоит ниже и левее: выше, у самого узла, через него идёт прямая. */
      { at: [0, 1], text: '$1$', dx: -11, dy: 11, size: 13, tone: 'muted' },
      { at: [1.5, -1], text: '$\\boldsymbol{3}$', dy: 17, tone: 'accent', size: 20 },
      { at: [0, -0.5], text: '$\\boldsymbol{2}$', dx: 13, tone: 'accent', size: 20 },
      { at: [0, Y], text: '$\\boldsymbol{4}$', dx: 14, tone: 'accent', size: 20 },
      { at: [X, 0], text: '$\\boldsymbol{x = \\,?}$', dy: 18, tone: 'accent', size: 20 },
    ],
  };
}

/** Пример 2: f(x) = −0,5x + 3, f(x) = 7. Точка (−8; 7) за рамкой. */
function exArgumentOutside(): TheoryFigure {
  const w = win(-5, 5, -3, 5);
  return {
    scene: {
      ...base(w),
      curves: [line(-0.5, 3)],
      points: [dot(0, 3), dot(2, 2)],
      shapes: [
        fill([
          [0, 3],
          [0, 2],
          [2, 2],
        ]),
        seg([0, 2], [2, 2]),
        seg([0, 3], [0, 2]),
        rightAngle([0, 2], 1, 1),
        /* Стрелка рядом с прямой, вдоль неё: прямая уходит за рамку вверх
           и влево. Сама линия не перекрыта. */
        {
          type: 'segment',
          from: [-2.67, 3.66],
          to: [-3.74, 4.2],
          color: 'accent',
          width: 3,
          arrow: true,
        },
      ],
    },
    labels: [
      ...axisLabels(w),
      { at: [1, 2], text: '$\\boldsymbol{2}$', dy: 17, tone: 'accent', size: 20 },
      { at: [0, 2.5], text: '$\\boldsymbol{1}$', dx: -14, tone: 'accent', size: 20 },
      /* Подпись к стрелке — в две строки: в одну она не помещается левее оси. */
      { at: [-4.85, 3.35], text: 'до $y = 7$', tone: 'accent', size: 16, anchor: 'left' },
      { at: [-4.85, 2.75], text: 'за рамкой', tone: 'accent', size: 16, anchor: 'left' },
    ],
  };
}

function exCrossZero(): TheoryFigure {
  const w = win(-2, 4, -2, 4);
  return {
    scene: {
      ...base(w),
      curves: [line(2, 0), line(-0.5, 3, 'lineB')],
      points: [dot(1, 2), dot(0, 3, 'lineB'), dot(2, 2, 'lineB'), dot(1.2, 2.4, 'cross')],
    },
    labels: [
      ...axisLabels(w),
      { at: [1.6, 3.2], text: '$f$', dx: 12, tone: 'primary' },
      { at: [3.4, 1.3], text: '$g$', dy: -14, tone: 'accent' },
    ],
  };
}

function exCrossInt(): TheoryFigure {
  const w = win(-2, 4, -2, 4);
  return {
    scene: {
      ...base(w),
      curves: [line(3, -3), line(0.5, 1, 'lineB')],
      points: [
        dot(1, 0),
        dot(2, 3),
        dot(0, 1, 'lineB'),
        dot(2, 2, 'lineB'),
        dot(1.6, 1.8, 'cross'),
      ],
    },
    labels: [
      ...axisLabels(w),
      { at: [2.2, 3.6], text: '$f$', dx: 12, tone: 'primary' },
      { at: [3.4, 2.7], text: '$g$', dy: -14, tone: 'accent' },
    ],
  };
}

/* ── График корня ─────────────────────────────────────────────── */

const SQ = win(-1, 10, -1, 5);

/** y = √x и его целые точки: 0, 1, 4, 9 под корнем. */
function sqrtTable(): TheoryFigure {
  return {
    scene: { ...base(SQ), curves: [sqrt(1)], points: [dot(0, 0), dot(1, 1), dot(4, 2), dot(9, 3)] },
    labels: [
      ...axisLabels(SQ),
      { at: [1, 1], text: '$(1;\\, 1)$', dx: 10, dy: 12, size: 15, anchor: 'left' },
      { at: [4, 2], text: '$(4;\\, 2)$', dy: -18, size: 15 },
      { at: [9, 3], text: '$(9;\\, 3)$', dy: -18, size: 15 },
    ],
  };
}

function sqrtSigns(): TheoryFigure {
  const w = win(-1, 10, -5, 5);
  return {
    scene: {
      ...base(w),
      curves: [sqrt(1.5), sqrt(-1.5, 0, 0, 'lineB')],
      points: [dot(4, 3), dot(4, -3, 'lineB')],
    },
    labels: [
      ...axisLabels(w),
      { at: [7, 4], text: '$k > 0$', dy: -16, tone: 'primary' },
      { at: [7, -4], text: '$k < 0$', dy: 16, tone: 'accent' },
    ],
  };
}

/** y = 1,5√(x + 3) − 2: начало (−3; −2), целая точка (1; 1). */
function sqrtShift(): TheoryFigure {
  const w = win(-4, 7, -3, 4);
  return {
    scene: {
      ...base(w),
      curves: [sqrt(1.5, -3, -2)],
      points: [dot(-3, -2, 'accent'), dot(1, 1)],
      shapes: [seg([-3, -2], [1, -2]), seg([1, -2], [1, 1])],
    },
    labels: [
      ...axisLabels(w),
      { at: [-3, -2], text: '$(x_0;\\, y_0)$', dx: -6, dy: -16, tone: 'accent', anchor: 'right' },
      { at: [-1, -2], text: '$4 = 2^2$', dy: 16, tone: 'accent', size: 16 },
      { at: [1, -0.5], text: '$3$', dx: 12, tone: 'accent' },
      { at: [1, 1], text: '$(1;\\, 1)$', dx: 10, dy: -12, anchor: 'left', size: 15 },
    ],
  };
}

/** y = 1,5√x: от начала вправо на 4 = 2², вверх на 3 — k = 3 : 2. */
function sqrtK(): TheoryFigure {
  const w = win(-1, 10, -1, 6);
  return {
    scene: {
      ...base(w),
      curves: [sqrt(1.5)],
      points: [dot(4, 3), dot(9, 4.5)],
      shapes: [seg([0, 0], [4, 0], 'accent', false), seg([4, 0], [4, 3])],
    },
    labels: [
      ...axisLabels(w),
      { at: [2, 0], text: '$4 = 2^2$', dy: 16, tone: 'accent', size: 16 },
      { at: [4, 1.5], text: '$3$', dx: 12, tone: 'accent' },
      { at: [4, 3], text: '$(4;\\, 3)$', dx: -8, dy: -14, anchor: 'right', size: 15 },
      { at: [9, 4.5], text: '$(9;\\, 4{,}5)$', dy: -18, size: 15 },
    ],
  };
}

function sqrtExValue(): TheoryFigure {
  const w = win(-1, 10, -1, 6);
  const y = 1.5 * 2.6;
  return {
    scene: {
      ...base(w),
      curves: [sqrt(1.5)],
      points: [dot(4, 3), dot(9, 4.5), dot(6.76, y, 'lineB')],
      shapes: [seg([6.76, 0], [6.76, y], 'lineB')],
    },
    labels: [
      ...axisLabels(w),
      { at: [6.76, 0], text: '$6{,}76$', dy: 16, tone: 'accent', size: 15 },
      {
        at: [6.76, y],
        text: '$f(6{,}76)$',
        dx: -8,
        dy: -14,
        tone: 'accent',
        anchor: 'right',
        size: 15,
      },
      { at: [4, 3], text: '$(4;\\, 3)$', dx: 8, dy: 14, anchor: 'left', size: 14 },
    ],
  };
}

function sqrtExArgument(): TheoryFigure {
  const w = win(-1, 10, -1, 7);
  return {
    scene: {
      ...base(w),
      curves: [sqrt(2)],
      points: [dot(1, 2), dot(4, 4), dot(6.25, 5, 'lineB')],
      shapes: [seg([0, 5], [6.25, 5], 'lineB')],
    },
    labels: [
      ...axisLabels(w),
      { at: [0, 5], text: '$5$', dx: -12, tone: 'accent' },
      { at: [6.25, 5], text: '$x = \\,?$', dy: -16, tone: 'accent' },
      { at: [4, 4], text: '$(4;\\, 4)$', dx: 10, dy: 12, anchor: 'left', size: 14 },
    ],
  };
}

/* Точка B(9; 6) — за рамкой: окно до x = 7 и y = 5, и на рисунке её
   нет (правило «невидимой» точки, graph/hidden.js). Её абсциссу
   находят только из уравнения — ровно как в задачах генератора. */
function sqrtExCross(): TheoryFigure {
  const w = win(-4, 7, -1, 5);
  return {
    scene: {
      ...base(w),
      curves: [sqrt(2), line(0.5, 1.5, 'lineB')],
      points: [dot(-3, 0, 'lineB'), dot(1, 2, 'cross')],
    },
    labels: [
      ...axisLabels(w),
      { at: [1, 2], text: '$A$', dx: -6, dy: -16, size: 17 },
      {
        at: [-3, 0],
        text: '$(-3;\\, 0)$',
        dx: 4,
        dy: -14,
        size: 14,
        tone: 'accent',
        anchor: 'left',
      },
    ],
  };
}

/* ── Реестр ───────────────────────────────────────────────────── */

const FIGURES = {
  'lin-rise-mini': riseMini,
  'lin-fall-mini': fallMini,
  'lin-angle': angle,
  'lin-rising': rising,
  'lin-falling': falling,
  'trig-circle': trigCircle,
  'lin-b-node': bNode,
  'lin-b-off': bOff,
  'lin-ex-value': exValue,
  'lin-ex-argument-visible': exArgumentVisible,
  'lin-ex-argument-outside': exArgumentOutside,
  'lin-ex-cross-zero': exCrossZero,
  'lin-ex-cross-int': exCrossInt,
  'sqrt-table': sqrtTable,
  'sqrt-signs': sqrtSigns,
  'sqrt-shift': sqrtShift,
  'sqrt-k': sqrtK,
  'sqrt-ex-value': sqrtExValue,
  'sqrt-ex-argument': sqrtExArgument,
  'sqrt-ex-cross': sqrtExCross,
} satisfies Record<string, () => TheoryFigure>;

export type TheoryFigureId = keyof typeof FIGURES;

export function theoryFigure(id: TheoryFigureId): TheoryFigure {
  return FIGURES[id]();
}
