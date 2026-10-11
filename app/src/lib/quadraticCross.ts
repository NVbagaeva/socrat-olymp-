/**
 * Геометрия разборов «пересечение параболы с прямой или параболой»
 * (вкладка «О задании» квадратичной подтемы, content/quadraticTypes.ts).
 *
 * Один источник для рисунков (lib/theoryFigures.ts) и для автотеста
 * (scripts/check-about-examples.mjs): тест пересчитывает по этим числам
 * второй корень по теореме Виета, ординату и проверяет, что искомая
 * точка с рисунка не читается.
 *
 * Функция — y = a·x² + b·x + c; у прямой a = 0.
 */

export interface Quad {
  a: number;
  b: number;
  c: number;
}

export interface Win {
  xmin: number;
  xmax: number;
  ymin: number;
  ymax: number;
}

export interface CrossExample {
  /** Ключ рисунка в lib/theoryFigures.ts. */
  figure: string;
  window: Win;
  /** Клетка рисунка в пикселях натурального размера. */
  cell: number;
  f: Quad;
  g: Quad;
  /** Отмеченная общая точка — в узле сетки. */
  common: [number, number];
  /** Что спрашивают: абсциссу или ординату второй точки. */
  asks: 'x' | 'y';
}

const F: Quad = { a: 1, b: 0, c: -4 };
const LINE_RISE: Quad = { a: 0, b: 0.5, c: -1 };
const LINE_FALL: Quad = { a: 0, b: -2, c: 4 };
const PARAB_DOWN: Quad = { a: -1, b: 3, c: -2 };
const PARAB_WIDE: Quad = { a: 0.5, b: -1, c: 0 };

const W: Win = { xmin: -5, xmax: 5, ymin: -6, ymax: 6 };
/* Точка в окне: клетка крупнее, чтобы подписи у точки и у осей не
   садились на графики. Точка за рамкой — обычная клетка. */
const CELL_NEAR = 44;
const CELL = 34;

/** Восемь примеров: по два на каждый из четырёх типов. */
export const CROSS_EXAMPLES: Record<string, CrossExample[]> = {
  'abscissa-line': [
    {
      figure: 'q-line-visible-x',
      window: W,
      cell: CELL_NEAR,
      f: F,
      g: LINE_RISE,
      common: [2, 0],
      asks: 'x',
    },
    {
      figure: 'q-line-outside',
      window: W,
      cell: CELL,
      f: F,
      g: LINE_FALL,
      common: [2, 0],
      asks: 'x',
    },
  ],
  'abscissa-parabola': [
    {
      figure: 'q-parab-visible-x',
      window: W,
      cell: CELL_NEAR,
      f: F,
      g: PARAB_DOWN,
      common: [2, 0],
      asks: 'x',
    },
    {
      figure: 'q-parab-outside',
      window: W,
      cell: CELL,
      f: F,
      g: PARAB_WIDE,
      common: [2, 0],
      asks: 'x',
    },
  ],
  'ordinate-line': [
    {
      figure: 'q-line-visible-y',
      window: W,
      cell: CELL_NEAR,
      f: F,
      g: LINE_RISE,
      common: [2, 0],
      asks: 'y',
    },
    {
      figure: 'q-line-outside',
      window: W,
      cell: CELL,
      f: F,
      g: LINE_FALL,
      common: [2, 0],
      asks: 'y',
    },
  ],
  'ordinate-parabola': [
    {
      figure: 'q-parab-visible-y',
      window: W,
      cell: CELL_NEAR,
      f: F,
      g: PARAB_DOWN,
      common: [2, 0],
      asks: 'y',
    },
    {
      figure: 'q-parab-outside',
      window: W,
      cell: CELL,
      f: F,
      g: PARAB_WIDE,
      common: [2, 0],
      asks: 'y',
    },
  ],
};

export function valueOf(q: Quad, x: number): number {
  return q.a * x * x + q.b * x + q.c;
}

/**
 * Вторая точка пересечения: f − g = A·x² + B·x + C, один корень —
 * абсцисса общей точки, второй — по теореме Виета из суммы −B/A.
 */
export function secondPoint(example: CrossExample): [number, number] {
  const A = example.f.a - example.g.a;
  const B = example.f.b - example.g.b;
  const x2 = -B / A - example.common[0];
  return [x2, valueOf(example.f, x2)];
}

/** Пример по ключу рисунка: рисунок общий у абсциссы и ординаты. */
export function exampleOfFigure(figure: string): CrossExample | undefined {
  return Object.values(CROSS_EXAMPLES)
    .flat()
    .find((item) => item.figure === figure);
}
