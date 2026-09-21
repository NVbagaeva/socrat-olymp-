/* scripts/lib/quadratic-sets.mjs — ограничения девяти наборов подтемы
   «Квадратичная функция» для проверки генератора.

   Здесь только устройство наборов: правила состава и ограничения
   каждой задачи. Условий и подсказок нет намеренно — тексты набора
   утверждаются отдельно и лягут в data/prep/12/ вместе с этими же
   ограничениями. До тех пор проверка генератора идёт по этому файлу:
   каждый набор обязан собираться на своём seed и на серии случайных,
   а каждый ответ — записываться целым числом или конечной десятичной
   дробью.

   Идентификаторы наборов — P12Q-1 … P12Q-9, задач — P12Q-1-01 и далее:
   с наборами прямой (P12-1 …) они не пересекаются. */

function tasks(setId, list) {
  return list.map((task, index) => ({
    id: `${setId}-${String(index + 1).padStart(2, '0')}`,
    question: '',
    ...task,
  }));
}

const VERTEX_AND_POINT = { vertex: true, points: 1 };

/* 1. Знак коэффициента a: по графику выбрать a > 0 или a < 0. */
const SIGN_A = {
  kind: 'prep',
  id: 'P12Q-1',
  title: 'Знак коэффициента a',
  seed: 12101,
  family: 'quadratic',
  axisLabels: 'minimal',
  uniqueVertices: true,
  composition: {
    count: 10,
    allChoice: 2,
    optionsDistinct: true,
    minUp: 5,
    minDown: 5,
    minFractionA: 3,
    uniqueVertices: true,
    noAlternatingAnswers: true,
  },
  tasks: tasks('P12Q-1', [
    { answerRule: 'sign-a', answerType: 'choice', constraints: { direction: 'up', aKind: 'integer' } },
    { answerRule: 'sign-a', answerType: 'choice', constraints: { direction: 'down', aKind: 'integer' } },
    { answerRule: 'sign-a', answerType: 'choice', constraints: { direction: 'down', aKind: 'fraction' } },
    { answerRule: 'sign-a', answerType: 'choice', constraints: { direction: 'up', aKind: 'fraction' } },
    /* Полуцелая вершина: узлы сетки на ветвях есть только у a = ±2
       с полуцелыми обеими координатами вершины. */
    { answerRule: 'sign-a', answerType: 'choice', constraints: { direction: 'up', absA: 2, vertex: { x: 'half', y: 'half' } } },
    { answerRule: 'sign-a', answerType: 'choice', constraints: { direction: 'down', absA: 2, vertex: { x: 'half', y: 'half' } } },
    { answerRule: 'sign-a', answerType: 'choice', constraints: { direction: 'up', aKind: 'any', vertex: { yNonZero: true } } },
    { answerRule: 'sign-a', answerType: 'choice', constraints: { direction: 'down', aKind: 'fraction' } },
    { answerRule: 'sign-a', answerType: 'choice', constraints: { direction: 'down', aKind: 'integer', absA: 3 } },
    { answerRule: 'sign-a', answerType: 'choice', constraints: { direction: 'up', aKind: 'integer', absA: 3 } },
  ]),
};

/* 2. Значение коэффициента a: по вершине и одной отмеченной точке. */
const VALUE_A = {
  kind: 'prep',
  id: 'P12Q-2',
  title: 'Значение коэффициента a',
  seed: 12102,
  family: 'quadratic',
  axisLabels: 'minimal',
  uniqueSlopes: true,
  uniqueVertices: true,
  uniqueAnswers: true,
  composition: {
    count: 10,
    minUp: 5,
    minDown: 5,
    minFractionA: 4,
    minDistinctA: 10,
    uniqueVertices: true,
    uniqueAnswers: true,
  },
  tasks: tasks('P12Q-2', [
    { answerRule: 'a', answerType: 'number', constraints: { direction: 'up', absA: 1, marks: VERTEX_AND_POINT } },
    { answerRule: 'a', answerType: 'number', constraints: { direction: 'down', absA: 1, marks: VERTEX_AND_POINT } },
    { answerRule: 'a', answerType: 'number', constraints: { direction: 'up', absA: 2, marks: VERTEX_AND_POINT } },
    { answerRule: 'a', answerType: 'number', constraints: { direction: 'down', absA: 2, marks: VERTEX_AND_POINT } },
    { answerRule: 'a', answerType: 'number', constraints: { direction: 'up', absA: [1, 2], marks: VERTEX_AND_POINT } },
    { answerRule: 'a', answerType: 'number', constraints: { direction: 'down', absA: [1, 2], marks: VERTEX_AND_POINT } },
    { answerRule: 'a', answerType: 'number', constraints: { direction: 'up', absA: 3, marks: VERTEX_AND_POINT } },
    { answerRule: 'a', answerType: 'number', constraints: { direction: 'down', absA: 3, marks: VERTEX_AND_POINT } },
    { answerRule: 'a', answerType: 'number', constraints: { direction: 'up', absA: [1, 4], marks: VERTEX_AND_POINT } },
    { answerRule: 'a', answerType: 'number', constraints: { direction: 'down', absA: [3, 2], marks: VERTEX_AND_POINT } },
  ]),
};

/* 3. Коэффициент c: точка пересечения с осью Oy. */
const VALUE_C = {
  kind: 'prep',
  id: 'P12Q-3',
  title: 'Коэффициент c',
  seed: 12103,
  family: 'quadratic',
  axisLabels: 'minimal',
  uniqueIntercepts: true,
  uniqueVertices: true,
  composition: {
    count: 10,
    minUp: 5,
    minDown: 5,
    minFractionA: 3,
    minDistinctC: 10,
    uniqueVertices: true,
    minPositiveC: 4,
    minNegativeC: 4,
  },
  tasks: tasks('P12Q-3', [
    { answerRule: 'c', answerType: 'number', constraints: { direction: 'up', aKind: 'integer', cSign: 'positive', cVisible: true, marks: { intercept: true } } },
    { answerRule: 'c', answerType: 'number', constraints: { direction: 'down', aKind: 'integer', cSign: 'positive', cVisible: true, marks: { intercept: true } } },
    { answerRule: 'c', answerType: 'number', constraints: { direction: 'up', aKind: 'integer', cSign: 'negative', cVisible: true, marks: { intercept: true } } },
    { answerRule: 'c', answerType: 'number', constraints: { direction: 'down', aKind: 'integer', cSign: 'negative', cVisible: true, marks: { intercept: true } } },
    { answerRule: 'c', answerType: 'number', constraints: { direction: 'up', aKind: 'fraction', cSign: 'positive', cVisible: true, marks: { intercept: true } } },
    { answerRule: 'c', answerType: 'number', constraints: { direction: 'down', aKind: 'fraction', cSign: 'negative', cVisible: true, marks: { intercept: true } } },
    { answerRule: 'c', answerType: 'number', constraints: { direction: 'up', aKind: 'any', cNonZero: true, cVisible: true, vertex: { xNonZero: true }, marks: { intercept: true } } },
    { answerRule: 'c', answerType: 'number', constraints: { direction: 'down', aKind: 'any', cNonZero: true, cVisible: true, vertex: { xNonZero: true }, marks: { intercept: true } } },
    { answerRule: 'c', answerType: 'number', constraints: { direction: 'up', aKind: 'fraction', cSign: 'negative', cVisible: true, vertex: { xNonZero: true, ySign: 'negative' }, marks: { intercept: true } } },
    { answerRule: 'c', answerType: 'number', constraints: { direction: 'down', aKind: 'any', cSign: 'positive', cVisible: true, vertex: { xNonZero: true, ySign: 'positive' }, marks: { intercept: true } } },
  ]),
};

/* 4. Коэффициент b: через вершину (a дано) или через систему (a не дано).
   Когда a и c стоят в формуле, c читать с чертежа не нужно: точка
   (0; c) может быть за кадром, а само c — десятичным. */
const KNOWN_A = { vertex: { xNonZero: true }, bInteger: true, marks: { vertex: true } };
/* Вершина подальше от оси Oy: тогда b = −2am у задач с известным a
   не совпадает с b задач на систему, где вершина рядом с осью. */
const FAR = { vertex: { xNonZero: true, xAbsMin: 4 }, bInteger: true, marks: { vertex: true } };
/* Система: точка на Oy и два узла по обе стороны от вершины. Пара
   несимметричная; симметричная — не больше двух на набор, с пометкой. */
const SYSTEM = { vertex: { xNonZero: true }, bInteger: true, cVisible: true, cNonZero: true,
                 marks: { intercept: true, points: 2, sides: 'both', symmetric: false } };
const SYSTEM_SYMMETRIC = { ...SYSTEM, marks: { ...SYSTEM.marks, symmetric: true } };
const SYMMETRY = 'симметрия — вершина по двум точкам';
const VALUE_B = {
  kind: 'prep',
  id: 'P12Q-4',
  title: 'Коэффициент b',
  seed: 12104,
  family: 'quadratic',
  axisLabels: 'minimal',
  uniqueVertices: true,
  uniqueAnswers: true,
  maxSymmetricPairs: 2,
  composition: {
    count: 10,
    minUp: 4,
    minDown: 4,
    uniqueVertices: true,
    uniqueAnswers: true,
    allIntegerB: true,
    knownA: 6,
    maxSymmetricPairs: 2,
  },
  tasks: tasks('P12Q-4', [
    { answerRule: 'b', answerType: 'number', knownA: true, constraints: { ...FAR, direction: 'up', absA: 1 } },
    { answerRule: 'b', answerType: 'number', knownA: true, constraints: { ...FAR, direction: 'down', absA: 1 } },
    { answerRule: 'b', answerType: 'number', knownA: true, constraints: { ...KNOWN_A, direction: 'up', absA: 2, vertex: { xNonZero: true, xAbsMin: 3 } } },
    { answerRule: 'b', answerType: 'number', knownA: true, constraints: { ...KNOWN_A, direction: 'down', absA: 2, vertex: { xNonZero: true, xAbsMin: 3 } } },
    { answerRule: 'b', answerType: 'number', knownA: true, constraints: { ...KNOWN_A, direction: 'up', absA: [1, 2], cInteger: false } },
    { answerRule: 'b', answerType: 'number', knownA: true, constraints: { ...KNOWN_A, direction: 'down', absA: [1, 2], cInteger: false } },
    /* В системе a получается сам: целый или половина — оба читаются. */
    { answerRule: 'b', answerType: 'number', knownA: false, constraints: { ...SYSTEM, direction: 'up', absA: 1 } },
    { answerRule: 'b', answerType: 'number', knownA: false, constraints: { ...SYSTEM, direction: 'down', absA: 1 } },
    { answerRule: 'b', answerType: 'number', knownA: false, levelReason: SYMMETRY, constraints: { ...SYSTEM_SYMMETRIC, direction: 'up', absA: [1, 2] } },
    { answerRule: 'b', answerType: 'number', knownA: false, levelReason: SYMMETRY, constraints: { ...SYSTEM_SYMMETRIC, direction: 'down', absA: [1, 2] } },
  ]),
};

/* 5. Значение функции по аргументу: точка за пределами окна. */
const VALUE_AT = (extra) => ({
  answerRule: 'value-at',
  answerType: 'number',
  constraints: { marks: VERTEX_AND_POINT, cVisible: true, vertex: { xNonZero: true },
    query: { type: 'value-at', outside: true, xAbsMax: 8, yAbsMax: 60, decimals: 1 }, ...extra },
});
const VALUE_AT_SET = {
  kind: 'prep',
  id: 'P12Q-5',
  title: 'Значение функции по аргументу',
  seed: 12105,
  family: 'quadratic',
  axisLabels: 'minimal',
  uniqueVertices: true,
  uniqueAnswers: true,
  composition: {
    count: 10,
    minUp: 5,
    minDown: 5,
    minFractionA: 3,
    uniqueVertices: true,
    uniqueAnswers: true,
    queryOutsideWindow: true,
    minNonIntegerAnswers: 2,
  },
  tasks: tasks('P12Q-5', [
    VALUE_AT({ direction: 'up', absA: 1 }),
    VALUE_AT({ direction: 'down', absA: 1 }),
    VALUE_AT({ direction: 'up', absA: 2 }),
    VALUE_AT({ direction: 'down', absA: 2 }),
    VALUE_AT({ direction: 'up', absA: [1, 2], query: { type: 'value-at', outside: true, xAbsMax: 8, yAbsMax: 60, decimals: 1, answerKind: 'half' } }),
    VALUE_AT({ direction: 'down', absA: [1, 2], query: { type: 'value-at', outside: true, xAbsMax: 8, yAbsMax: 60, decimals: 1, answerKind: 'half' } }),
    VALUE_AT({ direction: 'up', absA: 3, query: { type: 'value-at', outside: true, xAbsMax: 8, yAbsMax: 80, decimals: 1, side: 'left' } }),
    VALUE_AT({ direction: 'down', absA: [1, 2], query: { type: 'value-at', outside: true, xAbsMax: 8, yAbsMax: 60, decimals: 1, side: 'right' } }),
    VALUE_AT({ direction: 'up', absA: 2, vertex: { x: 'half', y: 'half' }, query: { type: 'value-at', outside: true, xAbsMax: 8, yAbsMax: 60, decimals: 1 } }),
    VALUE_AT({ direction: 'down', absA: 2, query: { type: 'value-at', outside: true, xAbsMax: 8, yAbsMax: 60, decimals: 1, side: 'left' } }),
  ]),
};

/* 6. Аргумент по значению: два кандидата, в условии сказано, какой брать. */
const ARGUMENT_FOR = (pick, extra) => ({
  answerRule: 'argument-for',
  answerType: 'number',
  constraints: { marks: VERTEX_AND_POINT, cVisible: true, vertex: { xNonZero: true },
    query: { type: 'argument-for', outside: true, xAbsMax: 9, yAbsMax: 60, decimals: 1, pick }, ...extra },
});
const ARGUMENT_FOR_SET = {
  kind: 'prep',
  id: 'P12Q-6',
  title: 'Аргумент по значению',
  seed: 12106,
  family: 'quadratic',
  axisLabels: 'minimal',
  uniqueVertices: true,
  uniqueAnswers: true,
  composition: {
    count: 10,
    minUp: 5,
    minDown: 5,
    minFractionA: 2,
    uniqueVertices: true,
    uniqueAnswers: true,
    queryOutsideWindow: true,
    picks: { larger: 3, smaller: 3, positive: 2, negative: 2 },
  },
  tasks: tasks('P12Q-6', [
    ARGUMENT_FOR('larger', { direction: 'up', absA: 1 }),
    ARGUMENT_FOR('smaller', { direction: 'down', absA: 1 }),
    ARGUMENT_FOR('positive', { direction: 'up', absA: 2 }),
    ARGUMENT_FOR('negative', { direction: 'down', absA: 2 }),
    ARGUMENT_FOR('larger', { direction: 'up', absA: [1, 2] }),
    ARGUMENT_FOR('smaller', { direction: 'down', absA: [1, 2] }),
    ARGUMENT_FOR('positive', { direction: 'down', absA: 1 }),
    ARGUMENT_FOR('negative', { direction: 'up', absA: 1 }),
    ARGUMENT_FOR('larger', { direction: 'down', absA: 2, vertex: { x: 'half', y: 'half' } }),
    ARGUMENT_FOR('smaller', { direction: 'up', absA: [1, 2], vertex: { y: 'half' } }),
  ]),
};

/* 7. Формула по графику: шесть вариантов, ошибки разного вида. */
const CHOICE = (form, extra) => ({
  answerRule: 'equation-choice',
  answerType: 'choice',
  form,
  constraints: { vertex: { xNonZero: true, yNonZero: true }, cNonZero: true, cVisible: true,
    marks: VERTEX_AND_POINT, ...extra },
});
const EQUATION_SET = {
  kind: 'prep',
  id: 'P12Q-7',
  title: 'Формула по графику',
  seed: 12107,
  family: 'quadratic',
  axisLabels: 'minimal',
  uniqueVertices: true,
  options: 6,
  composition: {
    count: 10,
    allChoice: 6,
    optionsDistinct: true,
    optionsAre: 'equation',
    balancedAnswerPlaces: true,
    minUp: 4,
    minDown: 4,
    minFractionA: 2,
    uniqueVertices: true,
    forms: { general: 6, vertex: 3, roots: 1 },
  },
  tasks: tasks('P12Q-7', [
    CHOICE('general', { direction: 'up', absA: 1 }),
    CHOICE('general', { direction: 'down', absA: 1 }),
    CHOICE('general', { direction: 'up', absA: 2 }),
    CHOICE('general', { direction: 'down', absA: [1, 2] }),
    CHOICE('vertex', { direction: 'up', absA: 1 }),
    CHOICE('vertex', { direction: 'down', absA: 2 }),
    CHOICE('general', { direction: 'up', absA: [1, 2] }),
    CHOICE('roots', { direction: 'down', absA: 1, roots: 'integer', rootsVisible: true }),
    CHOICE('vertex', { direction: 'up', absA: [1, 2] }),
    CHOICE('general', { direction: 'down', absA: 2 }),
  ]),
};

/* 8. Парабола и прямая: абсцисса или ордината скрытой точки пересечения.
   На чертеже ровно одна точка пересечения, отмеченная; вторая за рамкой
   с запасом, ответ только решением уравнения. */
const CROSS_LINE = (axis, extra) => ({
  answerRule: axis === 'y' ? 'intersection-y' : 'intersection-x',
  answerType: 'number',
  constraints: {
    marks: { vertex: true }, cVisible: true,
    line: { absKMin: [1, 2] },
    intersection: { visible: 'one', which: 'hidden', axis, marks: 'visible', labels: false },
    ...extra,
  },
});
const CROSS_LINE_SET = {
  kind: 'prep',
  id: 'P12Q-8',
  title: 'Парабола и прямая',
  seed: 12108,
  family: 'quadratic',
  axisLabels: 'minimal',
  uniqueVertices: true,
  uniqueAnswers: true,
  composition: {
    count: 10,
    minUp: 4,
    minDown: 4,
    uniqueVertices: true,
    uniqueAnswers: true,
    intersectionsInteger: true,
    visibleBoth: 0,
    visibleOne: 10,
  },
  tasks: tasks('P12Q-8', [
    CROSS_LINE('x', { direction: 'up', absA: 1 }),
    CROSS_LINE('y', { direction: 'down', absA: 1 }),
    CROSS_LINE('x', { direction: 'up', absA: [1, 2] }),
    CROSS_LINE('y', { direction: 'down', absA: 2 }),
    CROSS_LINE('x', { direction: 'up', absA: 2 }),
    CROSS_LINE('y', { direction: 'down', absA: [1, 2] }),
    CROSS_LINE('x', { direction: 'up', absA: 1, line: { absKMin: 1 } }),
    CROSS_LINE('y', { direction: 'down', absA: 1, line: { absKMin: 1 } }),
    CROSS_LINE('x', { direction: 'up', absA: [1, 2], line: { direction: 'down' } }),
    CROSS_LINE('y', { direction: 'down', absA: 2, line: { direction: 'up' } }),
  ]),
};

/* 9. Парабола и парабола: одна точка пересечения видна и подписана,
   вторая — за рамкой, по Виета. */
const CROSS_PARABOLA = (axis, extra) => ({
  answerRule: axis === 'y' ? 'intersection-y' : 'intersection-x',
  answerType: 'number',
  constraints: {
    marks: { vertex: true }, cVisible: true,
    second: { aKind: 'any', marks: { vertex: true } },
    intersection: { visible: 'one', which: 'hidden', axis, marks: 'visible', labels: true, gapMax: 6 },
    ...extra,
  },
});
const CROSS_PARABOLA_SET = {
  kind: 'prep',
  id: 'P12Q-9',
  title: 'Парабола и парабола',
  seed: 12109,
  family: 'quadratic',
  axisLabels: 'minimal',
  uniqueVertices: true,
  uniqueAnswers: true,
  composition: {
    count: 10,
    minUp: 4,
    minDown: 4,
    uniqueVertices: true,
    uniqueAnswers: true,
    intersectionsInteger: true,
    visibleBoth: 0,
    visibleOne: 10,
  },
  tasks: tasks('P12Q-9', [
    CROSS_PARABOLA('x', { direction: 'up', absA: 1 }),
    CROSS_PARABOLA('y', { direction: 'down', absA: 1 }),
    CROSS_PARABOLA('x', { direction: 'up', absA: 2 }),
    CROSS_PARABOLA('y', { direction: 'down', absA: 2 }),
    CROSS_PARABOLA('x', { direction: 'up', absA: [1, 2] }),
    CROSS_PARABOLA('y', { direction: 'down', absA: [1, 2] }),
    CROSS_PARABOLA('x', { direction: 'down', absA: 1 }),
    CROSS_PARABOLA('y', { direction: 'up', absA: 2 }),
    CROSS_PARABOLA('x', { direction: 'up', absA: 1, second: { aKind: 'fraction', marks: { vertex: true } } }),
    CROSS_PARABOLA('y', { direction: 'down', absA: 1, second: { absA: 2, marks: { vertex: true } } }),
  ]),
};

export const QUADRATIC_SETS = [
  SIGN_A, VALUE_A, VALUE_C, VALUE_B, VALUE_AT_SET, ARGUMENT_FOR_SET,
  EQUATION_SET, CROSS_LINE_SET, CROSS_PARABOLA_SET,
];

export default QUADRATIC_SETS;
